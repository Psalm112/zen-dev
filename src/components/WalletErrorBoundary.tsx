// src/components/WalletErrorBoundary.tsx
"use client";

import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  enableRetry?: boolean;
  maxRetries?: number;
  resetKeys?: Array<string | number>;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
  errorType: "wallet" | "network" | "transaction" | "unknown";
  isRetrying: boolean;
  lastResetKeys: Array<string | number>;
}

export class WalletErrorBoundary extends Component<Props, State> {
  private readonly maxRetries: number;
  private retryTimeout: NodeJS.Timeout | null = null;

  constructor(props: Props) {
    super(props);
    this.maxRetries = props.maxRetries || 3;
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      errorType: "unknown",
      isRetrying: false,
      lastResetKeys: props.resetKeys || [],
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Only catch specific wallet-related errors
    if (!WalletErrorBoundary.isWalletError(error)) {
      return {}; // Don't catch non-wallet errors
    }

    const errorType = WalletErrorBoundary.categorizeError(error);
    return {
      hasError: true,
      error,
      errorType,
    };
  }

  static getDerivedStateFromProps(
    props: Props,
    state: State
  ): Partial<State> | null {
    const { resetKeys = [] } = props;
    const { lastResetKeys } = state;

    // Reset error boundary when resetKeys change
    if (resetKeys.some((key, idx) => key !== lastResetKeys[idx])) {
      return {
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: 0,
        isRetrying: false,
        lastResetKeys: resetKeys,
      };
    }

    return null;
  }

  private static isWalletError(error: Error): boolean {
    const message = error.message.toLowerCase();
    const stack = error.stack?.toLowerCase() || "";

    // Only catch wallet, blockchain, or payment related errors
    const walletKeywords = [
      "wallet",
      "metamask",
      "ethereum",
      "web3",
      "blockchain",
      "transaction",
      "gas",
      "contract",
      "provider",
      "signer",
      "connection",
      "network",
      "chain",
      "rpc",
      "usdt",
      "celo",
    ];

    return walletKeywords.some(
      (keyword) => message.includes(keyword) || stack.includes(keyword)
    );
  }

  private static categorizeError(error: Error): State["errorType"] {
    const message = error.message.toLowerCase();

    if (
      message.includes("wallet") ||
      message.includes("metamask") ||
      message.includes("connection") ||
      message.includes("provider")
    ) {
      return "wallet";
    }
    if (
      message.includes("network") ||
      message.includes("chain") ||
      message.includes("rpc")
    ) {
      return "network";
    }
    if (
      message.includes("transaction") ||
      message.includes("gas") ||
      message.includes("insufficient")
    ) {
      return "transaction";
    }
    return "unknown";
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Only handle wallet-related errors
    if (!WalletErrorBoundary.isWalletError(error)) {
      throw error; // Re-throw non-wallet errors
    }

    this.setState({ error, errorInfo });

    // Enhanced logging
    const errorContext = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      errorType: this.state.errorType,
      retryCount: this.state.retryCount,
      url: typeof window !== "undefined" ? window.location.href : "",
    };

    if (process.env.NODE_ENV === "development") {
      console.group("🚨 WalletErrorBoundary - Wallet Error Caught");
      console.error("Error:", error);
      console.error("Error Info:", errorInfo);
      console.error("Context:", errorContext);
      console.groupEnd();
    }

    this.props.onError?.(error, errorInfo);

    // Auto-retry for recoverable errors
    if (
      this.shouldAutoRetry(error) &&
      this.state.retryCount < this.maxRetries
    ) {
      this.scheduleRetry();
    }
  }

  private shouldAutoRetry(error: Error): boolean {
    const message = error.message.toLowerCase();
    const autoRetryErrors = [
      "network error",
      "timeout",
      "connection failed",
      "rpc error",
    ];
    const noRetryErrors = [
      "user rejected",
      "user denied",
      "insufficient funds",
    ];

    return (
      autoRetryErrors.some((err) => message.includes(err)) &&
      !noRetryErrors.some((err) => message.includes(err))
    );
  }

  private scheduleRetry = () => {
    if (this.retryTimeout) clearTimeout(this.retryTimeout);

    this.setState({ isRetrying: true });
    const delay = Math.pow(2, this.state.retryCount) * 1000; // 1s, 2s, 4s

    this.retryTimeout = setTimeout(() => {
      this.handleRetry();
    }, delay);
  };

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: this.state.retryCount + 1,
      isRetrying: false,
    });
  };

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isRetrying: false,
    });

    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }
  };

  componentWillUnmount() {
    if (this.retryTimeout) clearTimeout(this.retryTimeout);
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    // Custom fallback UI if provided
    if (this.props.fallback) {
      return this.props.fallback;
    }

    const { error, errorType, retryCount, isRetrying } = this.state;
    const canRetry =
      retryCount < this.maxRetries && this.props.enableRetry !== false;

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-6 text-center">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {errorType === "wallet"
                ? "Wallet Connection Error"
                : errorType === "network"
                ? "Network Error"
                : errorType === "transaction"
                ? "Transaction Error"
                : "Something went wrong"}
            </h2>
            <p className="text-gray-600 mb-4">
              {error?.message || "We encountered an issue. Please try again."}
            </p>
          </div>

          <div className="space-y-3">
            {canRetry && (
              <button
                onClick={this.handleRetry}
                disabled={isRetrying}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2"
              >
                {isRetrying ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Retrying...</span>
                  </>
                ) : (
                  <span>
                    Try Again ({this.maxRetries - retryCount} attempts left)
                  </span>
                )}
              </button>
            )}

            <button
              onClick={this.handleReset}
              className="w-full bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors duration-200"
            >
              Reset
            </button>

            <button
              onClick={() => window.location.reload()}
              className="w-full bg-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-400 transition-colors duration-200"
            >
              Reload Page
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default WalletErrorBoundary;
