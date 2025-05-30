"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { ConnectionProvider } from "./WalletConnectionContext";
import { WalletErrorBoundary } from "../components/WalletErrorBoundary";
import { useConnection } from "./WalletConnectionContext";
import { useWalletInfo } from "../utils/hooks/useWalletInfo";
import { useMetaMaskConnection } from "../utils/hooks/useMetaMaskConnection";
import { useSmartWalletConnection } from "../utils/hooks/useSmartWalletConnection";
import { usePaymentProcessor } from "../utils/hooks/usePaymentProcessor";
import { WalletType, ConnectionMethod } from "../utils/types/wallet.types";

interface WalletContextType {
  // Re-export all functionality
  account: string | null;
  chainId: number;
  walletType: WalletType;
  connectionMethod: ConnectionMethod | null;
  isConnected: boolean;
  isConnecting: boolean;
  isReconnecting: boolean;
  provider: any;
  signer: any;
  deviceInfo: any;
  availableWallets: any[];
  recommendedWallet: any;
  connectWallet: (
    type: WalletType,
    method?: ConnectionMethod
  ) => Promise<string>;
  connectRecommended: () => Promise<string>;
  // ... other methods
  error: string | null;
  clearError: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

function WalletProviderCore({ children }: { children: ReactNode }) {
  const connection = useConnection();
  const walletInfo = useWalletInfo();
  const { connectMetaMask } = useMetaMaskConnection();
  const smartWallet = useSmartWalletConnection();
  const payment = usePaymentProcessor();

  const connectWallet = async (
    type: WalletType,
    method: ConnectionMethod = "extension"
  ) => {
    if (!type) throw new Error("Wallet type is required");

    switch (type) {
      case "metamask":
        return await connectMetaMask(method);
      case "smart":
        const result = await smartWallet.connectAsGuest();
        return result.address;
      // Add other wallet types...
      default:
        throw new Error(`Unsupported wallet type: ${type}`);
    }
  };

  const connectRecommended = async () => {
    if (!walletInfo.recommendedWallet) {
      throw new Error("No recommended wallet available");
    }
    return connectWallet(
      walletInfo.recommendedWallet.type,
      walletInfo.deviceInfo.preferredConnection
    );
  };

  const contextValue: WalletContextType = {
    ...connection,
    ...walletInfo,
    ...smartWallet,
    ...payment,
    connectWallet,
    connectRecommended,
  };

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
}

interface WalletProviderProps {
  children: ReactNode;
  defaultChainId?: number;
  enableAnalytics?: boolean;
}

export function WalletProvider({ children, ...props }: WalletProviderProps) {
  return (
    <WalletErrorBoundary>
      <ConnectionProvider>
        <WalletProviderCore {...props}>{children}</WalletProviderCore>
      </ConnectionProvider>
    </WalletErrorBoundary>
  );
}

export function useWallet(): WalletContextType {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within WalletProvider");
  }
  return context;
}
