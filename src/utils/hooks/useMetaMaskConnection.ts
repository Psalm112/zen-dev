import { useCallback } from "react";
import { ethers } from "ethers";
import { ConnectionMethod } from "../types/wallet.types";
import { useConnection } from "../../context/WalletConnectionContext";
import { createDeviceInfo } from "../device.utils";

export function useMetaMaskConnection() {
  const { setConnectionState } = useConnection();
  const deviceInfo = createDeviceInfo();

  const connectMetaMask = useCallback(
    async (method: ConnectionMethod = "extension"): Promise<string> => {
      const ethereum = (window as any).ethereum;

      if (!ethereum?.isMetaMask) {
        if (deviceInfo.isMobile) {
          throw new Error(
            "Please open this page in MetaMask browser or install MetaMask app"
          );
        }
        throw new Error("MetaMask not installed");
      }

      setConnectionState({ isConnecting: true, error: null });

      try {
        const accounts = await ethereum.request({
          method: "eth_requestAccounts",
        });

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
        setConnectionState({
          isConnecting: false,
          error: error.message || "Failed to connect MetaMask",
        });
        throw error;
      }
    },
    [setConnectionState, deviceInfo.isMobile]
  );

  return { connectMetaMask };
}
