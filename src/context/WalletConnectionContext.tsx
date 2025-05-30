"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import { ethers } from "ethers";
import {
  ConnectionState,
  WalletError,
  WalletErrorCode,
} from "../utils/types/wallet.types";

interface ConnectionActions {
  setConnectionState: (state: Partial<ConnectionState>) => void;
  clearError: () => void;
  reset: () => void;
  reconnect: () => Promise<void>;
  switchNetwork: (chainId: number) => Promise<void>;
  disconnect: () => Promise<void>;
}

type ConnectionContextType = ConnectionState & ConnectionActions;

const ConnectionContext = createContext<ConnectionContextType | null>(null);

const INITIAL_STATE: ConnectionState = {
  account: null,
  chainId: 44787,
  walletType: null,
  connectionMethod: null,
  isConnected: false,
  isConnecting: false,
  isReconnecting: false,
  provider: null,
  signer: null,
  error: null,
  lastConnected: undefined,
  connectionUri: undefined,
};

export function ConnectionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, setState] = useState<ConnectionState>(INITIAL_STATE);

  useEffect(() => {
    return () => {
      if (state.provider?.removeAllListeners) {
        state.provider.removeAllListeners();
      }
    };
  }, [state.provider]);

  const setConnectionState = useCallback(
    (updates: Partial<ConnectionState>) => {
      setState((prev) => {
        const newState = { ...prev, ...updates };

        // Auto-save connection info for reconnection
        if (newState.isConnected && newState.account && newState.walletType) {
          const connectionInfo = {
            account: newState.account,
            walletType: newState.walletType,
            connectionMethod: newState.connectionMethod,
            chainId: newState.chainId,
            lastConnected: Date.now(),
          };
          localStorage.setItem(
            "wallet_connection",
            JSON.stringify(connectionInfo)
          );
        }

        return newState;
      });
    },
    []
  );

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  const reset = useCallback(() => {
    setState(INITIAL_STATE);
    localStorage.removeItem("wallet_connection");
  }, []);

  const switchNetwork = useCallback(
    async (targetChainId: number) => {
      const ethereum = (window as any).ethereum;
      if (!ethereum) {
        throw new WalletError(
          "No wallet provider found",
          WalletErrorCode.WALLET_NOT_FOUND
        );
      }

      try {
        await ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: `0x${targetChainId.toString(16)}` }],
        });

        setConnectionState({ chainId: targetChainId });
      } catch (switchError: any) {
        if (switchError.code === 4902) {
          const networkConfig = getNetworkConfig(targetChainId);
          if (networkConfig) {
            await ethereum.request({
              method: "wallet_addEthereumChain",
              params: [networkConfig],
            });
            setConnectionState({ chainId: targetChainId });
          }
        } else {
          throw new WalletError(
            `Failed to switch network: ${switchError.message}`,
            WalletErrorCode.NETWORK_ERROR,
            switchError
          );
        }
      }
    },
    [setConnectionState]
  );

  const disconnect = useCallback(async () => {
    try {
      if (
        state.connectionMethod === "walletconnect" &&
        state.provider?.disconnect
      ) {
        await state.provider.disconnect();
      }

      reset();
    } catch (error) {
      console.error("Disconnect error:", error);
      reset();
    }
  }, [state.connectionMethod, state.provider, reset]);

  const reconnect = useCallback(async () => {
    const savedConnection = localStorage.getItem("wallet_connection");
    if (!savedConnection) return;

    try {
      const connectionInfo = JSON.parse(savedConnection);
      const timeSinceLastConnection =
        Date.now() - (connectionInfo.lastConnected || 0);

      // Only attempt reconnection if less than 24 hours ago
      if (timeSinceLastConnection > 24 * 60 * 60 * 1000) {
        localStorage.removeItem("wallet_connection");
        return;
      }

      setConnectionState({ isReconnecting: true });

      switch (connectionInfo.walletType) {
        case "metamask":
          await reconnectMetaMask();
          break;
        case "walletconnect":
          await reconnectWalletConnect();
          break;
        case "smart":
          break;
        default:
          break;
      }
    } catch (error) {
      console.error("Reconnection failed:", error);
      localStorage.removeItem("wallet_connection");
    } finally {
      setConnectionState({ isReconnecting: false });
    }
  }, [setConnectionState]);

  const reconnectMetaMask = async () => {
    const ethereum = (window as any).ethereum;
    if (!ethereum?.isMetaMask) return;

    try {
      const accounts = await ethereum.request({ method: "eth_accounts" });
      if (accounts.length > 0) {
        const browserProvider = new ethers.BrowserProvider(ethereum);
        const network = await browserProvider.getNetwork();
        const signer = await browserProvider.getSigner();

        setConnectionState({
          account: accounts[0],
          provider: browserProvider,
          signer,
          walletType: "metamask",
          connectionMethod: "extension",
          chainId: Number(network.chainId),
          isConnected: true,
        });
      }
    } catch (error) {
      console.error("MetaMask reconnection failed:", error);
    }
  };

  const reconnectWalletConnect = async () => {
    // WalletConnect reconnection logic will be implemented in the WalletConnect hook
  };

  // Auto-reconnect on app load
  useEffect(() => {
    const autoReconnect = async () => {
      const savedConnection = localStorage.getItem("wallet_connection");
      if (savedConnection && !state.isConnected && !state.isConnecting) {
        await reconnect();
      }
    };

    autoReconnect();
  }, []);

  // Listen for account/network changes
  useEffect(() => {
    const ethereum = (window as any).ethereum;
    if (!ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        reset();
      } else if (accounts[0] !== state.account) {
        setConnectionState({ account: accounts[0] });
      }
    };

    const handleChainChanged = (chainId: string) => {
      setConnectionState({ chainId: parseInt(chainId, 16) });
    };

    const handleDisconnect = () => {
      reset();
    };

    ethereum.on("accountsChanged", handleAccountsChanged);
    ethereum.on("chainChanged", handleChainChanged);
    ethereum.on("disconnect", handleDisconnect);

    return () => {
      ethereum.removeListener("accountsChanged", handleAccountsChanged);
      ethereum.removeListener("chainChanged", handleChainChanged);
      ethereum.removeListener("disconnect", handleDisconnect);
    };
  }, [state.account, setConnectionState, reset]);

  const contextValue = useMemo(
    () => ({
      ...state,
      setConnectionState,
      clearError,
      reset,
      reconnect,
      switchNetwork,
      disconnect,
    }),
    [
      //   state,
      //   setConnectionState,
      //   clearError,
      //   reset,
      //   reconnect,
      //   switchNetwork,
      //   disconnect,
      state.account,
      state.isConnected,
      state.isConnecting,
      state.error,
    ]
  );

  return (
    <ConnectionContext.Provider value={contextValue}>
      {children}
    </ConnectionContext.Provider>
  );
}

export function useConnection() {
  const context = useContext(ConnectionContext);
  if (!context) {
    throw new Error("useConnection must be used within ConnectionProvider");
  }
  return context;
}

const getNetworkConfig = (chainId: number) => {
  const configs: Record<number, any> = {
    44787: {
      chainId: "0xAEF3",
      chainName: "Celo Alfajores Testnet",
      nativeCurrency: { name: "Celo", symbol: "CELO", decimals: 18 },
      rpcUrls: ["https://alfajores-forno.celo-testnet.org"],
      blockExplorerUrls: ["https://alfajores-blockscout.celo-testnet.org"],
    },
    42220: {
      chainId: "0xA4EC",
      chainName: "Celo Mainnet",
      nativeCurrency: { name: "Celo", symbol: "CELO", decimals: 18 },
      rpcUrls: ["https://forno.celo.org"],
      blockExplorerUrls: ["https://explorer.celo.org"],
    },
  };

  return configs[chainId];
};
