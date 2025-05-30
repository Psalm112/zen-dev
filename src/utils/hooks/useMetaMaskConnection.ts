import { useCallback } from "react";
import { ethers } from "ethers";
import {
  ConnectionMethod,
  WalletError,
  WalletErrorCode,
} from "../types/wallet.types";
import { useConnection } from "../../context/WalletConnectionContext";
import { createDeviceInfo } from "../device.utils";

export function useMetaMaskConnection() {
  const { setConnectionState } = useConnection();
  const deviceInfo = createDeviceInfo();

  const connectWithRetry = async (
    connectFn: () => Promise<string>,
    maxRetries = 3,
    delay = 1000
  ): Promise<string> => {
    let lastError: Error;

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await connectFn();
      } catch (error) {
        lastError = error as Error;
        if (i === maxRetries - 1) throw error;

        // Don't retry user rejections
        if ((error as any)?.code === WalletErrorCode.USER_REJECTED) {
          throw error;
        }

        await new Promise((resolve) => setTimeout(resolve, delay * (i + 1)));
      }
    }

    throw lastError!;
  };

  const openMetaMaskMobile = useCallback(
    (dappUrl?: string) => {
      const currentUrl = dappUrl || window.location.href;
      const encodedUrl = encodeURIComponent(currentUrl);

      if (deviceInfo.isIOS) {
        window.location.href = `metamask://dapp/${encodedUrl}`;
      } else if (deviceInfo.isAndroid) {
        window.location.href = `https://metamask.app.link/dapp/${encodedUrl}`;
      } else {
        // Fallback to universal link
        window.location.href = `https://metamask.app.link/dapp/${encodedUrl}`;
      }
    },
    [deviceInfo]
  );

  const connectMetaMask = useCallback(
    async (method: ConnectionMethod = "extension"): Promise<string> => {
      const ethereum = (window as any).ethereum;

      // Handle mobile connections
      if (method === "mobile_app" || method === "deeplink") {
        if (!ethereum?.isMetaMask && deviceInfo.isMobile) {
          openMetaMaskMobile();
          throw new WalletError(
            "Opening MetaMask app...",
            WalletErrorCode.USER_REJECTED
          );
        }
      }

      // Check if MetaMask is available
      if (!ethereum) {
        if (deviceInfo.isMobile) {
          throw new WalletError(
            "MetaMask not found. Please install MetaMask mobile app.",
            WalletErrorCode.WALLET_NOT_FOUND
          );
        } else {
          throw new WalletError(
            "MetaMask not found. Please install MetaMask extension.",
            WalletErrorCode.WALLET_NOT_FOUND
          );
        }
      }

      if (!ethereum.isMetaMask) {
        throw new WalletError(
          "MetaMask not detected",
          WalletErrorCode.WALLET_NOT_FOUND
        );
      }

      setConnectionState({ isConnecting: true, error: null });

      const connectAttempt = async (): Promise<string> => {
        try {
          // Request account access with timeout
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error("Connection timeout")), 30000);
          });

          const accountsPromise = ethereum.request({
            method: "eth_requestAccounts",
          });

          const accounts = (await Promise.race([
            accountsPromise,
            timeoutPromise,
          ])) as string[];

          if (!accounts || accounts.length === 0) {
            throw new WalletError(
              "No accounts found",
              WalletErrorCode.UNAUTHORIZED
            );
          }

          const browserProvider = new ethers.BrowserProvider(ethereum);
          const network = await browserProvider.getNetwork();
          const signer = await browserProvider.getSigner();

          setConnectionState({
            account: accounts[0],
            provider: browserProvider,
            signer,
            walletType: "metamask",
            connectionMethod: method,
            chainId: Number(network.chainId),
            isConnected: true,
            isConnecting: false,
          });

          return accounts[0];
        } catch (error: any) {
          let walletError: WalletError;

          if (error.code === 4001) {
            walletError = new WalletError(
              "Connection rejected by user",
              WalletErrorCode.USER_REJECTED,
              error
            );
          } else if (error.message?.includes("timeout")) {
            walletError = new WalletError(
              "Connection timeout",
              WalletErrorCode.CONNECTION_TIMEOUT,
              error
            );
          } else {
            walletError = new WalletError(
              error.message || "Failed to connect MetaMask",
              WalletErrorCode.NETWORK_ERROR,
              error
            );
          }

          setConnectionState({
            isConnecting: false,
            error: walletError.message,
          });

          throw walletError;
        }
      };

      try {
        return await connectWithRetry(connectAttempt);
      } catch (error) {
        throw error;
      }
    },
    [setConnectionState, deviceInfo, openMetaMaskMobile]
  );

  return {
    connectMetaMask,
    openMetaMaskMobile,
  };
}
