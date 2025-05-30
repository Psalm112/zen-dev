"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from "react";
import { ethers } from "ethers";
import { WalletType, ConnectionMethod } from "../utils/types/wallet.types";

interface ConnectionState {
  account: string | null;
  chainId: number;
  walletType: WalletType;
  connectionMethod: ConnectionMethod | null;
  isConnected: boolean;
  isConnecting: boolean;
  isReconnecting: boolean;
  provider: ethers.Provider | null;
  signer: ethers.Signer | null;
  error: string | null;
}

interface ConnectionActions {
  setConnectionState: (state: Partial<ConnectionState>) => void;
  clearError: () => void;
  reset: () => void;
}

type ConnectionContextType = ConnectionState & ConnectionActions;

const ConnectionContext = createContext<ConnectionContextType | null>(null);

export function ConnectionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, setState] = useState<ConnectionState>({
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
  });

  const setConnectionState = useCallback(
    (updates: Partial<ConnectionState>) => {
      setState((prev) => ({ ...prev, ...updates }));
    },
    []
  );

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  const reset = useCallback(() => {
    setState({
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
    });
  }, []);

  const contextValue = useMemo(
    () => ({
      ...state,
      setConnectionState,
      clearError,
      reset,
    }),
    [state, setConnectionState, clearError, reset]
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
