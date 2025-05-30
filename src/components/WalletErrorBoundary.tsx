"use client";

import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  enableRetry?: boolean;
  maxRetries?: number;
  resetOnPropsChange?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
  errorType: "wallet" | "network" | "transaction" | "unknown";
  isRetrying: boolean;
}

export class WalletErrorBoundary extends Component<Props, State> {
  private readonly maxRetries: number;
  private retryTimeout: NodeJS.Timeout | null = null;
  private reconnectInterval: NodeJS.Timeout | null = null;

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
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    const errorType = WalletErrorBoundary.categorizeError(error);
    return {
      hasError: true,
      error,
      errorType,
    };
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
    this.setState({
      error,
      errorInfo,
    });

    // Enhanced logging with context
    const errorContext = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
      url: typeof window !== "undefined" ? window.location.href : "",
      errorType: this.state.errorType,
      retryCount: this.state.retryCount,
      // Add wallet context if available
      walletState: this.getWalletState(),
    };

    if (process.env.NODE_ENV === "development") {
      console.group("🚨 WalletErrorBoundary - Error Caught");
      console.error("Error:", error);
      console.error("Error Info:", errorInfo);
      console.error("Context:", errorContext);
      console.groupEnd();
    }

    // Call custom error handler
    this.props.onError?.(error, errorInfo);

    // Log to external service in production
    if (process.env.NODE_ENV === "production") {
      this.logErrorToService(errorContext);
    }

    // Auto-retry for certain error types
    if (
      this.shouldAutoRetry(error) &&
      this.state.retryCount < this.maxRetries
    ) {
      this.scheduleRetry();
    }
  }

  private getWalletState() {
    try {
      // Try to get wallet state from localStorage or context
      const savedConnection = localStorage.getItem("wallet_connection");
      return savedConnection ? JSON.parse(savedConnection) : null;
    } catch {
      return null;
    }
  }

  private shouldAutoRetry(error: Error): boolean {
    const message = error.message.toLowerCase();
    const autoRetryErrors = [
      "network error",
      "timeout",
      "connection failed",
      "rpc error",
      "provider error",
    ];

    // Don't auto-retry user rejections or insufficient funds
    const noRetryErrors = [
      "user rejected",
      "user denied",
      "insufficient funds",
      "insufficient balance",
    ];

    return (
      autoRetryErrors.some((err) => message.includes(err)) &&
      !noRetryErrors.some((err) => message.includes(err))
    );
  }

  private scheduleRetry = () => {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }

    this.setState({ isRetrying: true });

    // Exponential backoff: 2s, 4s, 8s
    const delay = Math.pow(2, this.state.retryCount) * 2000;

    this.retryTimeout = setTimeout(() => {
      this.handleRetry();
    }, delay);
  };

  private logErrorToService = async (errorContext: any) => {
    try {
      // Enhanced error reporting
      const payload = {
        ...errorContext,
        environment: process.env.NODE_ENV,
        version: process.env.VITE_APP_VERSION || "unknown",
        buildHash: process.env.VITE_BUILD_HASH || "unknown",
      };

      // You can integrate with services like Sentry, LogRocket, etc.
      console.error("Production Error Log:", payload);

      // Example integration with a logging service
      if (typeof window !== "undefined" && (window as any).Sentry) {
        (window as any).Sentry.captureException(errorContext.error, {
          tags: {
            component: "WalletErrorBoundary",
            errorType: errorContext.errorType,
          },
          extra: payload,
        });
      }
    } catch (loggingError) {
      console.error("Failed to log error to service:", loggingError);
    }
  };

  private handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState((prevState) => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1,
        isRetrying: false,
      }));

      // Reset retry count after successful recovery
      this.retryTimeout = setTimeout(() => {
        this.setState({ retryCount: 0 });
      }, 10000); // Reset after 10 seconds of no errors
    } else {
      this.setState({ isRetrying: false });
    }
  };

  private handleManualRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.handleRetry();
    }
  };

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isRetrying: false,
    });

    // Clear timeouts
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }
    if (this.reconnectInterval) {
      clearInterval(this.reconnectInterval);
      this.reconnectInterval = null;
    }

    // Clear wallet state and reload
    localStorage.removeItem("wallet_connection");
    window.location.reload();
  };

  private getErrorMessage(): {
    title: string;
    description: string;
    actions: string[];
  } {
    const { error, errorType } = this.state;
    const errorMessage = error?.message || "An unexpected error occurred";

    switch (errorType) {
      case "wallet":
        return {
          title: "Wallet Connection Error",
          description:
            "There was an issue connecting to your wallet. This might be due to wallet extension issues or connection problems.",
          actions: [
            "Check if your wallet extension is installed and unlocked",
            "Refresh your wallet extension",
            "Try connecting with a different wallet",
            "Clear browser cache and cookies",
          ],
        };

      case "network":
        return {
          title: "Network Connection Error",
          description:
            "Unable to connect to the blockchain network. This might be due to network congestion or RPC issues.",
          actions: [
            "Check your internet connection",
            "Try switching to a different network",
            "Wait a moment and try again",
            "Contact support if the issue persists",
          ],
        };

      case "transaction":
        return {
          title: "Transaction Error",
          description:
            "There was an issue processing your transaction. This might be due to insufficient funds or network issues.",
          actions: [
            "Check your wallet balance",
            "Ensure you have enough for gas fees",
            "Try adjusting gas settings",
            "Wait for network congestion to clear",
          ],
        };

      default:
        return {
          title: "Application Error",
          description:
            errorMessage.length > 100
              ? "An unexpected error occurred in the application."
              : errorMessage,
          actions: [
            "Try refreshing the page",
            "Clear browser cache",
            "Try using a different browser",
            "Contact support if the issue persists",
          ],
        };
    }
  }

  componentWillUnmount() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
    if (this.reconnectInterval) {
      clearInterval(this.reconnectInterval);
    }
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { title, description, actions } = this.getErrorMessage();
      const canRetry =
        this.state.retryCount < this.maxRetries &&
        this.props.enableRetry !== false;

      return (
        <div className="min-h-screen flex items-center justify-center bg-Dark px-4 py-8">
          <div className="max-w-md w-full bg-black/30 rounded-xl shadow-lg p-6 text-center">
            {/* Error Icon */}
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

              <h2 className="text-xl font-semibold text-white mb-2">{title}</h2>

              <p className="text-white/80 mb-4 leading-relaxed">
                {description}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 mb-6">
              {canRetry && (
                <button
                  onClick={this.handleManualRetry}
                  disabled={this.state.isRetrying}
                  className="w-full bg-Red text-white py-3 px-4 rounded-lg hover:bg-Red/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2"
                >
                  {this.state.isRetrying ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      <span>Retrying...</span>
                    </>
                  ) : (
                    <span>
                      Try Again ({this.maxRetries - this.state.retryCount}{" "}
                      attempts left)
                    </span>
                  )}
                </button>
              )}

              <button
                onClick={this.handleReset}
                className="w-full bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors duration-200"
              >
                Reset & Reload
              </button>
            </div>

            {/* Troubleshooting Tips */}
            <details className="text-left mb-4">
              <summary className="cursor-pointer text-sm font-medium text-white/90 hover:text-white mb-2">
                💡 Troubleshooting Tips
              </summary>
              <ul className="text-sm text-white/80 space-y-1 pl-4">
                {actions.map((action, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </details>

            {/* Technical Details */}
            <details className="text-left">
              <summary className="cursor-pointer text-sm text-white/90 hover:text-white">
                🔧 Technical Details
              </summary>
              <div className="mt-3 p-3 rounded-lg text-xs font-mono text-white/80 max-h-32 overflow-auto">
                <div className="mb-2">
                  <strong>Error Type:</strong> {this.state.errorType}
                </div>
                <div className="mb-2">
                  <strong>Message:</strong> {this.state.error?.message}
                </div>
                <div className="mb-2">
                  <strong>Retry Count:</strong> {this.state.retryCount}/
                  {this.maxRetries}
                </div>
                {process.env.NODE_ENV === "development" &&
                  this.state.error?.stack && (
                    <div>
                      <strong>Stack Trace:</strong>
                      <pre className="whitespace-pre-wrap text-xs mt-1 p-2 bg-whitegit  rounded max-h-24 overflow-auto">
                        {this.state.error.stack}
                      </pre>
                    </div>
                  )}
              </div>
            </details>

            {/* Support Contact */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                Need help? Contact our{" "}
                <a
                  href="/support"
                  className="text-blue-600 hover:text-blue-700 underline"
                >
                  support team
                </a>{" "}
                or check our{" "}
                <a
                  href="/help"
                  className="text-blue-600 hover:text-blue-700 underline"
                >
                  help center
                </a>
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default WalletErrorBoundary;
