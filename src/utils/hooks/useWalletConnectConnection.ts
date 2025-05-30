import { useCallback, useState } from "react";
import { ethers } from "ethers";
import { useConnection } from "../../context/WalletConnectionContext";
import { WalletError, WalletErrorCode } from "../types/wallet.types";

let WalletConnectProvider: any = null;

export function useWalletConnectConnection() {
  const { setConnectionState } = useConnection();
  const [connectionUri, setConnectionUri] = useState<string>("");
  const [isInitializing, setIsInitializing] = useState(false);

  const initWalletConnect = useCallback(async () => {
    if (WalletConnectProvider) return WalletConnectProvider;

    try {
      setIsInitializing(true);
      const { EthereumProvider } = await import(
        "@walletconnect/ethereum-provider"
      );

      WalletConnectProvider = await EthereumProvider.init({
        projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID,
        chains: [44787, 42220],
        showQrModal: false, // handle QR display ourselves
        methods: [
          "eth_sendTransaction",
          "eth_signTransaction",
          "eth_sign",
          "personal_sign",
          "eth_signTypedData",
        ],
        events: ["chainChanged", "accountsChanged"],
        metadata: {
          name: "Your App Name",
          description: "Your App Description",
          url: window.location.origin,
          icons: ["/favicon.png"],
        },
      });

      return WalletConnectProvider;
    } catch (error) {
      throw new WalletError(
        "Failed to initialize WalletConnect",
        WalletErrorCode.NETWORK_ERROR,
        error
      );
    } finally {
      setIsInitializing(false);
    }
  }, []);

  const connectWalletConnect = useCallback(async () => {
    setConnectionState({ isConnecting: true, error: null });

    try {
      const provider = await initWalletConnect();

      provider.on("display_uri", (uri: string) => {
        setConnectionUri(uri);
        setConnectionState({ connectionUri: uri });
      });

      provider.on("connect", async () => {
        try {
          const ethersProvider = new ethers.BrowserProvider(provider);
          const signer = await ethersProvider.getSigner();
          const address = await signer.getAddress();
          const network = await ethersProvider.getNetwork();

          setConnectionState({
            account: address,
            provider: ethersProvider,
            signer,
            walletType: "walletconnect",
            connectionMethod: "walletconnect",
            chainId: Number(network.chainId),
            isConnected: true,
            isConnecting: false,
            connectionUri: undefined,
          });

          setConnectionUri("");
        } catch (error) {
          throw new WalletError(
            "Failed to setup connection",
            WalletErrorCode.NETWORK_ERROR,
            error
          );
        }
      });

      provider.on("disconnect", () => {
        setConnectionState({
          account: null,
          provider: null,
          signer: null,
          isConnected: false,
          walletType: null,
          connectionMethod: null,
        });
      });

      // Enable the provider (triggers QR code display)
      await provider.enable();

      return provider;
    } catch (error: any) {
      setConnectionState({
        isConnecting: false,
        error: error.message || "Failed to connect with WalletConnect",
      });
      throw error;
    }
  }, [setConnectionState, initWalletConnect]);

  const disconnectWalletConnect = useCallback(async () => {
    if (WalletConnectProvider?.connected) {
      await WalletConnectProvider.disconnect();
    }
  }, []);

  return {
    connectWalletConnect,
    disconnectWalletConnect,
    connectionUri,
    isInitializing,
  };
}
