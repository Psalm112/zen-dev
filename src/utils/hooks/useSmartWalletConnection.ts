import { useCallback, useMemo } from "react";
import { ethers } from "ethers";
import { inAppWallet } from "thirdweb/wallets";
import { createThirdwebClient } from "thirdweb";
import { useConnection } from "../../context/WalletConnectionContext";
import { useProviderPool } from "../../context/ProviderPoolContext";
import { SUPPORTED_CHAINS } from "../config/wallet.config";
import { createSecureStorage } from "../storage.utils";
import { createDeviceInfo } from "../device.utils";

const thirdwebClient = createThirdwebClient({
  clientId: import.meta.env.VITE_THIRDWEB_CLIENT_ID,
});

export function useSmartWalletConnection() {
  const { setConnectionState, chainId } = useConnection();
  const { getProvider } = useProviderPool();
  const deviceInfo = createDeviceInfo();
  const secureStorage = createSecureStorage();

  const smartWallet = useMemo(() => {
    type AuthOption =
      | "apple"
      | "google"
      | "email"
      | "phone"
      | "passkey"
      | "guest";

    const baseAuthOptions: AuthOption[] = [
      "google",
      "email",
      "phone",
      "passkey",
      "guest",
    ];
    const iosAuthOptions: AuthOption[] = [
      "apple",
      "google",
      "email",
      "phone",
      "passkey",
      "guest",
    ];

    return inAppWallet({
      smartAccount: {
        chain:
          chainId === 42220
            ? SUPPORTED_CHAINS.celoMainnet
            : SUPPORTED_CHAINS.celoAlfajores,
        sponsorGas: true,
      },
      auth: {
        mode: deviceInfo.isMobile ? "redirect" : "popup",
        options: deviceInfo.isIOS ? iosAuthOptions : baseAuthOptions,
        defaultSmsCountryCode: "NG",
        passkeyDomain:
          typeof window !== "undefined"
            ? window.location.hostname
            : "localhost",
      },
      hidePrivateKeyExport: true,
      metadata: {
        image: {
          src: "/favicon.png",
          alt: "App Logo",
          width: 100,
          height: 100,
        },
      },
      storage: secureStorage,
    });
  }, [chainId, deviceInfo, secureStorage]);

  const connectSmartWallet = useCallback(
    async (
      strategy: "google" | "apple" | "email" | "phone" | "passkey" | "guest",
      options?: any
    ) => {
      setConnectionState({ isConnecting: true, error: null });

      try {
        const chainDef =
          chainId === 42220
            ? SUPPORTED_CHAINS.celoMainnet
            : SUPPORTED_CHAINS.celoAlfajores;

        const wallet = await smartWallet.connect({
          client: thirdwebClient,
          chain: chainDef,
          strategy,
          ...options,
        });

        const rpcProvider = await getProvider();
        const ethersSigner = new ethers.JsonRpcSigner(
          rpcProvider as ethers.JsonRpcApiProvider,
          wallet.address
        );

        setConnectionState({
          account: wallet.address,
          provider: rpcProvider,
          signer: ethersSigner,
          walletType: "smart",
          connectionMethod: "embedded",
          isConnected: true,
          isConnecting: false,
        });

        return { address: wallet.address };
      } catch (error: any) {
        setConnectionState({
          isConnecting: false,
          error: error.message || "Failed to connect smart wallet",
        });

        if (error?.message?.includes("verification")) {
          return { address: "", requiresVerification: true };
        }
        throw error;
      }
    },
    [setConnectionState, chainId, smartWallet, getProvider]
  );

  return {
    connectSmartWallet,
    connectWithEmail: (email: string, code?: string) =>
      connectSmartWallet("email", { email, verificationCode: code }),
    connectWithPhone: (phone: string, code?: string) =>
      connectSmartWallet("phone", {
        phoneNumber: phone,
        verificationCode: code,
      }),
    connectWithGoogle: () => connectSmartWallet("google"),
    connectWithApple: () => connectSmartWallet("apple"),
    connectWithPasskey: () => connectSmartWallet("passkey"),
    connectAsGuest: () => connectSmartWallet("guest"),
  };
}
