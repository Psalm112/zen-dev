"use client";

import React, {
  createContext,
  useContext,
  ReactNode,
  useMemo,
  useCallback,
} from "react";
import { ConnectionProvider, useConnection } from "./WalletConnectionContext";
import { WalletErrorBoundary } from "../components/WalletErrorBoundary";
import { useWalletInfo } from "../utils/hooks/useWalletInfo";
import { useMetaMaskConnection } from "../utils/hooks/useMetaMaskConnection";
import { useSmartWalletConnection } from "../utils/hooks/useSmartWalletConnection";
import { useWalletConnectConnection } from "../utils/hooks/useWalletConnectConnection";
import { usePaymentProcessor } from "../utils/hooks/usePaymentProcessor";
import { useWalletBalance } from "../utils/hooks/useWalletBalance";
import {
  WalletType,
  ConnectionMethod,
  PaymentRequest,
  PaymentResult,
} from "../utils/types/wallet.types";

interface WalletContextType {
  // Connection state
  account: string | null;
  chainId: number;
  walletType: WalletType;
  connectionMethod: ConnectionMethod | null;
  isConnected: boolean;
  isConnecting: boolean;
  isReconnecting: boolean;
  provider: any;
  signer: any;
  error: string | null;

  // Device & wallet info
  deviceInfo: any;
  availableWallets: any[];
  recommendedWallet: any;

  // Balances
  balances: {
    celo: string;
    usdt: string;
    fiat: string;
  };
  isLoadingBalance: boolean;

  // Connection methods
  connectWallet: (
    type: WalletType,
    method?: ConnectionMethod
  ) => Promise<string>;
  connectRecommended: () => Promise<string>;
  connectWithFallback: (type: WalletType) => Promise<string>;
  disconnect: () => Promise<void>;
  switchNetwork: (chainId: number) => Promise<void>;
  reconnect: () => Promise<void>;

  // Payment methods
  sendPayment: (request: PaymentRequest) => Promise<PaymentResult>;
  sendToEscrow: (
    request: PaymentRequest & { orderId: string }
  ) => Promise<PaymentResult>;
  estimateGas: (
    request: Omit<PaymentRequest, "gasLimit" | "gasPrice">
  ) => Promise<string>;
  pendingTransactions: PaymentResult[];

  // Utility methods
  clearError: () => void;
  refreshBalance: () => Promise<void>;
  openWalletWithFallback: (walletType: WalletType, dappUrl?: string) => void;

  // Connection URIs for QR codes
  connectionUri?: string;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

function WalletProviderCore({ children }: { children: ReactNode }) {
  const connection = useConnection();
  const walletInfo = useWalletInfo();
  const { connectMetaMask } = useMetaMaskConnection();
  const smartWallet = useSmartWalletConnection();
  const { connectWalletConnect, connectionUri: wcUri } =
    useWalletConnectConnection();
  const payment = usePaymentProcessor();
  const {
    balances,
    isLoading: isLoadingBalance,
    refetch: refreshBalance,
  } = useWalletBalance();

  const connectWithFallback = useCallback(
    async (type: WalletType): Promise<string> => {
      const { deviceInfo, recommendedWallet } = walletInfo;

      try {
        // First, try the preferred method for the wallet type
        return await connectWallet(type, deviceInfo.preferredConnection);
      } catch (error: any) {
        console.warn(`Primary connection failed for ${type}:`, error);

        if (type === "metamask" && deviceInfo.isMobile) {
          try {
            // Try opening MetaMask mobile app
            walletInfo.openWalletWithFallback(type);
            throw new Error("Redirecting to MetaMask app...");
          } catch {
            // If MetaMask not available, fallback to WalletConnect
            return await connectWallet("walletconnect", "qr_code");
          }
        }

        // For desktop users without extensions, fallback to WalletConnect
        if (!deviceInfo.isMobile && !deviceInfo.availableWallets.length) {
          return await connectWallet("walletconnect", "qr_code");
        }

        // For mobile users, try smart wallet as last resort
        if (deviceInfo.isMobile && type !== "smart") {
          return await connectWallet("smart", "embedded");
        }

        throw error;
      }
    },
    [walletInfo]
  );

  const connectWallet = useCallback(
    async (
      type: WalletType,
      method: ConnectionMethod = "extension"
    ): Promise<string> => {
      if (!type) throw new Error("Wallet type is required");

      try {
        switch (type) {
          case "metamask":
            return await connectMetaMask(method);

          case "walletconnect":
            const provider = await connectWalletConnect();
            return connection.account || "";

          case "smart":
            const result = await smartWallet.connectAsGuest();
            return result.address;

          case "coinbase":
          case "trust":
          case "rainbow":
            if (walletInfo.deviceInfo.availableWallets.includes(type)) {
              return await connectMetaMask(method);
            } else {
              return await connectWalletConnect();
            }

          default:
            throw new Error(`Unsupported wallet type: ${type}`);
        }
      } catch (error: any) {
        // error handling
        if (error.code === 4001) {
          throw new Error("Connection was rejected. Please try again.");
        } else if (error.message?.includes("not found")) {
          throw new Error(
            `${type} wallet is not installed. Please install it or try another wallet.`
          );
        } else if (error.message?.includes("network")) {
          throw new Error(
            "Network error. Please check your connection and try again."
          );
        }
        throw error;
      }
    },
    [
      connectMetaMask,
      connectWalletConnect,
      smartWallet,
      connection.account,
      walletInfo,
    ]
  );

  const connectRecommended = useCallback(async () => {
    const { recommendedWallet, deviceInfo } = walletInfo;

    if (!recommendedWallet) {
      if (deviceInfo.isMobile) {
        // On mobile, prefer smart wallet
        return connectWallet("smart", "embedded");
      } else {
        // On desktop, prefer WalletConnect
        return connectWallet("walletconnect", "qr_code");
      }
    }

    return connectWithFallback(recommendedWallet.type);
  }, [walletInfo, connectWallet, connectWithFallback]);

  const sendPaymentWithRetry = useCallback(
    async (request: PaymentRequest, maxRetries = 2): Promise<PaymentResult> => {
      let lastError: Error;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          return await payment.sendPayment(request);
        } catch (error: any) {
          lastError = error;

          // Don't retry user rejections or insufficient funds
          if (error.code === 4001 || error.message?.includes("insufficient")) {
            throw error;
          }

          // Add delay between retries
          if (attempt < maxRetries) {
            await new Promise((resolve) =>
              setTimeout(resolve, 1000 * (attempt + 1))
            );
          }
        }
      }

      throw lastError!;
    },
    [payment]
  );

  const sendToEscrowWithRetry = useCallback(
    async (
      request: PaymentRequest & { orderId: string },
      maxRetries = 2
    ): Promise<PaymentResult> => {
      let lastError: Error;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          return await payment.sendToEscrow(request);
        } catch (error: any) {
          lastError = error;

          if (error.code === 4001 || error.message?.includes("insufficient")) {
            throw error;
          }

          if (attempt < maxRetries) {
            await new Promise((resolve) =>
              setTimeout(resolve, 1000 * (attempt + 1))
            );
          }
        }
      }

      throw lastError!;
    },
    [payment]
  );

  // Network switching with validation
  const switchNetworkSafe = useCallback(
    async (chainId: number) => {
      const validChainIds = [44787, 42220]; // Celo Alfajores and Mainnet

      if (!validChainIds.includes(chainId)) {
        throw new Error("Unsupported network");
      }

      return connection.switchNetwork(chainId);
    },
    [connection]
  );

  const contextValue = useMemo<WalletContextType>(
    () => ({
      // Connection state
      ...connection,

      // Device & wallet info
      ...walletInfo,

      // Balances
      balances,
      isLoadingBalance,

      // connection methods
      connectWallet,
      connectRecommended,
      connectWithFallback,
      switchNetwork: switchNetworkSafe,

      // payment methods
      sendPayment: sendPaymentWithRetry,
      sendToEscrow: sendToEscrowWithRetry,
      estimateGas: payment.estimateGas,
      pendingTransactions: payment.pendingTransactions,

      // Utility methods
      refreshBalance,
      connectionUri: wcUri || connection.connectionUri,
    }),
    [
      connection,
      walletInfo,
      balances,
      isLoadingBalance,
      connectWallet,
      connectRecommended,
      connectWithFallback,
      switchNetworkSafe,
      sendPaymentWithRetry,
      sendToEscrowWithRetry,
      payment.estimateGas,
      payment.pendingTransactions,
      refreshBalance,
      wcUri,
    ]
  );

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
  autoConnect?: boolean;
}

export function WalletProvider({
  children,
  defaultChainId = 44787,
  enableAnalytics = false,
  autoConnect = true,
  ...props
}: WalletProviderProps) {
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

export function useWalletStatus() {
  const { isConnected, isConnecting, account, walletType, error } = useWallet();

  return useMemo(
    () => ({
      isConnected,
      isConnecting,
      isDisconnected: !isConnected && !isConnecting,
      hasError: !!error,
      account,
      walletType,
      error,
    }),
    [isConnected, isConnecting, account, walletType, error]
  );
}

export function useWalletPayments() {
  const {
    sendPayment,
    sendToEscrow,
    estimateGas,
    pendingTransactions,
    balances,
    isLoadingBalance,
  } = useWallet();

  return {
    sendPayment,
    sendToEscrow,
    estimateGas,
    pendingTransactions,
    balances,
    isLoadingBalance,
    hasSufficientBalance: useCallback(
      (amount: string, currency: "CELO" | "USDT") => {
        const balance = currency === "CELO" ? balances.celo : balances.usdt;
        return parseFloat(balance) >= parseFloat(amount);
      },
      [balances]
    ),
  };
}
