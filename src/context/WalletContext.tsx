// src/context/WalletContext.tsx
"use client";

import React, {
  createContext,
  useContext,
  ReactNode,
  useMemo,
  useCallback,
  useReducer,
  useRef,
  useEffect,
} from "react";
import { ConnectionProvider, useConnection } from "./WalletConnectionContext";
import { WalletErrorBoundary } from "../components/WalletErrorBoundary";
import { useWalletInfo } from "../utils/hooks/useWalletInfo";
import { useMetaMaskConnection } from "../utils/hooks/useMetaMaskConnection";
import { useSmartWalletConnection } from "../utils/hooks/useSmartWalletConnection";
import { useWalletConnectConnection } from "../utils/hooks/useWalletConnectConnection";
import { usePaymentProcessor } from "../utils/hooks/usePaymentProcessor";
import { useWalletBalance } from "../utils/hooks/oldBalance";
import {
  WalletType,
  ConnectionMethod,
  PaymentRequest,
  PaymentResult,
} from "../utils/types/wallet.types";

// Separate contexts for performance optimization
interface WalletStateContextType {
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
  deviceInfo: any;
  availableWallets: any[];
  recommendedWallet: any;
  balances: { celo: string; usdt: string; fiat: string };
  isLoadingBalance: boolean;
  pendingTransactions: PaymentResult[];
  connectionUri?: string;
}

interface WalletActionsContextType {
  connectWallet: (
    type: WalletType,
    method?: ConnectionMethod
  ) => Promise<string>;
  connectRecommended: () => Promise<string>;
  connectWithFallback: (type: WalletType) => Promise<string>;
  disconnect: () => Promise<void>;
  switchNetwork: (chainId: number) => Promise<void>;
  reconnect: () => Promise<void>;
  sendPayment: (request: PaymentRequest) => Promise<PaymentResult>;
  sendToEscrow: (
    request: PaymentRequest & { orderId: string }
  ) => Promise<PaymentResult>;
  estimateGas: (
    request: Omit<PaymentRequest, "gasLimit" | "gasPrice">
  ) => Promise<string>;
  clearError: () => void;
  refreshBalance: () => Promise<void>;
  openWalletWithFallback: (walletType: WalletType, dappUrl?: string) => void;
}

const WalletStateContext = createContext<WalletStateContextType | undefined>(
  undefined
);
const WalletActionsContext = createContext<
  WalletActionsContextType | undefined
>(undefined);

// Action types for reducer
type WalletAction =
  | { type: "SET_CONNECTING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_CONNECTION_STATE"; payload: Partial<WalletStateContextType> }
  | { type: "CLEAR_ERROR" }
  | { type: "RESET" };

// Reducer for wallet state management
function walletReducer(
  state: WalletStateContextType,
  action: WalletAction
): WalletStateContextType {
  switch (action.type) {
    case "SET_CONNECTING":
      return {
        ...state,
        isConnecting: action.payload,
        error: action.payload ? null : state.error,
      };
    case "SET_ERROR":
      return { ...state, error: action.payload, isConnecting: false };
    case "SET_CONNECTION_STATE":
      return { ...state, ...action.payload };
    case "CLEAR_ERROR":
      return { ...state, error: null };
    case "RESET":
      return {
        ...state,
        account: null,
        isConnected: false,
        isConnecting: false,
        walletType: null,
        connectionMethod: null,
        provider: null,
        signer: null,
        error: null,
      };
    default:
      return state;
  }
}

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

  // Use reducer for complex state management
  const [walletState, dispatch] = useReducer(walletReducer, {
    ...connection,
    ...walletInfo,
    balances,
    isLoadingBalance,
    pendingTransactions: payment.pendingTransactions,
    connectionUri: wcUri || connection.connectionUri,
  });

  // Memoized device detection for mobile fallbacks
  const deviceCapabilities = useMemo(() => {
    const userAgent =
      typeof navigator !== "undefined" ? navigator.userAgent : "";
    const isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        userAgent
      );
    const isIOS = /iPad|iPhone|iPod/.test(userAgent);
    const isAndroid = /Android/.test(userAgent);
    const hasMetaMask =
      typeof window !== "undefined" && !!(window as any).ethereum?.isMetaMask;
    const isInAppBrowser = /FB_IAB|FBAN|Instagram|Twitter|Line|WeChat/i.test(
      userAgent
    );

    return {
      isMobile,
      isIOS,
      isAndroid,
      hasMetaMask,
      isInAppBrowser,
      supportsWalletConnect: !isInAppBrowser,
      recommendedMethod: isMobile
        ? isInAppBrowser
          ? "smart"
          : "walletconnect"
        : "extension",
    };
  }, []);

  // Optimized connection method with comprehensive fallbacks
  const connectWithFallback = useCallback(
    async (type: WalletType): Promise<string> => {
      dispatch({ type: "SET_CONNECTING", payload: true });

      try {
        // Mobile-first approach
        if (deviceCapabilities.isMobile) {
          switch (type) {
            case "metamask":
              if (deviceCapabilities.hasMetaMask) {
                return await connectMetaMask("extension");
              }
              // Fallback to MetaMask mobile deep link
              const metamaskUrl = `https://metamask.app.link/dapp/${window.location.host}${window.location.pathname}`;
              window.location.href = metamaskUrl;
              throw new Error("Redirecting to MetaMask mobile app...");

            case "walletconnect":
              if (deviceCapabilities.supportsWalletConnect) {
                return await connectWalletConnect();
              }
              // Fallback to smart wallet for in-app browsers
              const guestResult = await smartWallet.connectAsGuest();
              return guestResult.address;

            case "smart":
              const smartResult = await smartWallet.connectAsGuest();
              return smartResult.address;

            default:
              // For other wallets on mobile, try WalletConnect first
              if (deviceCapabilities.supportsWalletConnect) {
                return await connectWalletConnect();
              }
              const guestWalletResult = await smartWallet.connectAsGuest();
              return guestWalletResult.address;
          }
        }

        // Desktop approach
        switch (type) {
          case "metamask":
            if (deviceCapabilities.hasMetaMask) {
              return await connectMetaMask("extension");
            }
            // Fallback to WalletConnect for desktop without MetaMask
            return await connectWalletConnect();

          case "walletconnect":
            return await connectWalletConnect();

          case "smart":
            const smartGuestResult = await smartWallet.connectAsGuest();
            return smartGuestResult.address;

          default:
            // Try extension first, then WalletConnect
            try {
              return await connectMetaMask("extension");
            } catch {
              return await connectWalletConnect();
            }
        }
      } catch (error: any) {
        dispatch({ type: "SET_ERROR", payload: error.message });
        throw error;
      } finally {
        dispatch({ type: "SET_CONNECTING", payload: false });
      }
    },
    [deviceCapabilities, connectMetaMask, connectWalletConnect, smartWallet]
  );

  const connectWallet = useCallback(
    async (
      type: WalletType,
      method: ConnectionMethod = "extension"
    ): Promise<string> => {
      if (!type) throw new Error("Wallet type is required");

      dispatch({ type: "SET_CONNECTING", payload: true });
      dispatch({ type: "CLEAR_ERROR" });

      try {
        let result: string;

        switch (type) {
          case "metamask":
            result = await connectMetaMask(method);
            break;
          case "walletconnect":
            await connectWalletConnect();
            result = connection.account || "";
            break;
          case "smart":
            const smartResult = await smartWallet.connectAsGuest();
            result = smartResult.address;
            break;
          case "coinbase":
          case "trust":
          case "rainbow":
            // Use WalletConnect for mobile wallets
            if (deviceCapabilities.isMobile) {
              await connectWalletConnect();
              result = connection.account || "";
            } else {
              result = await connectMetaMask(method);
            }
            break;
          default:
            throw new Error(`Unsupported wallet type: ${type}`);
        }

        dispatch({
          type: "SET_CONNECTION_STATE",
          payload: {
            isConnected: true,
            walletType: type,
            connectionMethod: method,
            account: result,
          },
        });

        return result;
      } catch (error: any) {
        let errorMessage = error.message;

        // Enhanced error handling with user-friendly messages
        if (error.code === 4001) {
          errorMessage = "Connection was rejected. Please try again.";
        } else if (error.message?.includes("not found")) {
          errorMessage = `${type} wallet is not installed. Please install it or try another wallet.`;
        } else if (error.message?.includes("network")) {
          errorMessage =
            "Network error. Please check your connection and try again.";
        } else if (error.message?.includes("user rejected")) {
          errorMessage = "Transaction was cancelled by user.";
        }

        dispatch({ type: "SET_ERROR", payload: errorMessage });
        throw new Error(errorMessage);
      } finally {
        dispatch({ type: "SET_CONNECTING", payload: false });
      }
    },
    [
      connectMetaMask,
      connectWalletConnect,
      smartWallet,
      connection.account,
      deviceCapabilities,
    ]
  );

  const connectRecommended = useCallback(async () => {
    const { recommendedWallet } = walletInfo;

    if (!recommendedWallet) {
      // Smart recommendations based on device capabilities
      if (deviceCapabilities.isMobile) {
        if (deviceCapabilities.isInAppBrowser) {
          return connectWallet("smart", "embedded");
        } else if (deviceCapabilities.hasMetaMask) {
          return connectWallet("metamask", "extension");
        } else {
          return connectWallet("walletconnect", "qr_code");
        }
      } else {
        // Desktop recommendations
        if (deviceCapabilities.hasMetaMask) {
          return connectWallet("metamask", "extension");
        } else {
          return connectWallet("walletconnect", "qr_code");
        }
      }
    }

    return connectWithFallback(recommendedWallet.type);
  }, [walletInfo, deviceCapabilities, connectWallet, connectWithFallback]);

  // Enhanced payment methods with retry logic and gas optimization
  const sendPaymentWithRetry = useCallback(
    async (request: PaymentRequest, maxRetries = 2): Promise<PaymentResult> => {
      let lastError: Error;

      // Pre-flight checks
      if (!walletState.isConnected || !walletState.signer) {
        throw new Error("Wallet not connected");
      }

      // Validate USDT balance for payment
      const requiredAmount = parseFloat(request.amount);
      const availableUSDT = parseFloat(balances.usdt);

      if (availableUSDT < requiredAmount) {
        throw new Error(
          `Insufficient USDT balance. Required: ${requiredAmount}, Available: ${availableUSDT}`
        );
      }

      // Validate CELO balance for gas
      const estimatedGas = await payment.estimateGas(request);
      const availableCELO = parseFloat(balances.celo);
      const estimatedGasCost = parseFloat(estimatedGas);

      if (availableCELO < estimatedGasCost) {
        throw new Error(
          `Insufficient CELO for gas fees. Required: ${estimatedGasCost}, Available: ${availableCELO}`
        );
      }

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          const result = await payment.sendPayment({
            ...request,
            gasLimit: request.gasLimit || estimatedGas,
          });

          // Refresh balance after successful transaction
          setTimeout(() => refreshBalance(), 2000);

          return result;
        } catch (error: any) {
          lastError = error;

          // Don't retry user rejections, insufficient funds, or invalid transactions
          if (
            error.code === 4001 ||
            error.message?.includes("insufficient") ||
            error.message?.includes("invalid") ||
            error.message?.includes("rejected")
          ) {
            throw error;
          }

          // Add exponential backoff for retries
          if (attempt < maxRetries) {
            await new Promise((resolve) =>
              setTimeout(resolve, 1000 * Math.pow(2, attempt))
            );
          }
        }
      }

      throw lastError!;
    },
    [walletState, balances, payment, refreshBalance]
  );

  // const sendToEscrowWithRetry = useCallback(
  //   async (
  //     request: PaymentRequest & { orderId: string },
  //     maxRetries = 2
  //   ): Promise<PaymentResult> => {
  //     // Escrow-specific validation
  //     if (!request.orderId) {
  //       throw new Error("Order ID is required for escrow transactions");
  //     }

  //     if (!import.meta.env.VITE_ESCROW_CONTRACT_ADDRESS) {
  //       throw new Error("Escrow contract address is required");
  //     }

  //     return sendPaymentWithRetry(request, maxRetries);
  //   },
  //   [sendPaymentWithRetry]
  // );

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

  // Memoized actions to prevent unnecessary re-renders
  const actions = useMemo<WalletActionsContextType>(
    () => ({
      connectWallet,
      connectRecommended,
      connectWithFallback,
      disconnect: connection.disconnect,
      switchNetwork: connection.switchNetwork,
      reconnect: connection.reconnect,
      sendPayment: sendPaymentWithRetry,
      sendToEscrow: sendToEscrowWithRetry,
      estimateGas: payment.estimateGas,
      clearError: () => dispatch({ type: "CLEAR_ERROR" }),
      refreshBalance,
      openWalletWithFallback: walletInfo.openWalletWithFallback,
    }),
    [
      connectWallet,
      connectRecommended,
      connectWithFallback,
      connection.disconnect,
      connection.switchNetwork,
      connection.reconnect,
      sendPaymentWithRetry,
      sendToEscrowWithRetry,
      payment.estimateGas,
      refreshBalance,
      walletInfo.openWalletWithFallback,
    ]
  );

  // Memoized state to prevent unnecessary re-renders
  const state = useMemo<WalletStateContextType>(
    () => ({
      ...walletState,
      balances,
      isLoadingBalance,
      pendingTransactions: payment.pendingTransactions,
      connectionUri: wcUri || connection.connectionUri,
    }),
    [
      walletState,
      balances,
      isLoadingBalance,
      payment.pendingTransactions,
      wcUri,
      connection.connectionUri,
    ]
  );

  return (
    <WalletStateContext.Provider value={state}>
      <WalletActionsContext.Provider value={actions}>
        {children}
      </WalletActionsContext.Provider>
    </WalletStateContext.Provider>
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
    <WalletErrorBoundary
      enableRetry={true}
      maxRetries={3}
      onError={(error) => {
        // Log to analytics service in production
        if (process.env.NODE_ENV === "production" && enableAnalytics) {
          console.error("Wallet Error:", error);
          // Add your analytics logging here
        }
      }}
    >
      <ConnectionProvider>
        <WalletProviderCore {...props}>{children}</WalletProviderCore>
      </ConnectionProvider>
    </WalletErrorBoundary>
  );
}

// Optimized hooks with performance considerations
export function useWallet(): WalletStateContextType & WalletActionsContextType {
  const state = useContext(WalletStateContext);
  const actions = useContext(WalletActionsContext);

  if (!state || !actions) {
    throw new Error("useWallet must be used within WalletProvider");
  }

  return useMemo(() => ({ ...state, ...actions }), [state, actions]);
}

export function useWalletStatus() {
  const state = useContext(WalletStateContext);

  if (!state) {
    throw new Error("useWalletStatus must be used within WalletProvider");
  }

  return useMemo(
    () => ({
      isConnected: state.isConnected,
      isConnecting: state.isConnecting,
      isDisconnected: !state.isConnected && !state.isConnecting,
      hasError: !!state.error,
      account: state.account,
      walletType: state.walletType,
      error: state.error,
    }),
    [
      state.isConnected,
      state.isConnecting,
      state.account,
      state.walletType,
      state.error,
    ]
  );
}

export function useWalletPayments() {
  const state = useContext(WalletStateContext);
  const actions = useContext(WalletActionsContext);

  if (!state || !actions) {
    throw new Error("useWalletPayments must be used within WalletProvider");
  }

  return useMemo(
    () => ({
      sendPayment: actions.sendPayment,
      sendToEscrow: actions.sendToEscrow,
      estimateGas: actions.estimateGas,
      pendingTransactions: state.pendingTransactions,
      balances: state.balances,
      isLoadingBalance: state.isLoadingBalance,
      hasSufficientBalance: (amount: string, currency: "CELO" | "USDT") => {
        const balance =
          currency === "CELO" ? state.balances.celo : state.balances.usdt;
        return parseFloat(balance) >= parseFloat(amount);
      },
    }),
    [
      actions.sendPayment,
      actions.sendToEscrow,
      actions.estimateGas,
      state.pendingTransactions,
      state.balances,
      state.isLoadingBalance,
    ]
  );
}
