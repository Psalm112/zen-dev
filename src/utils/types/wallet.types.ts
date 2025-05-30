import { Currency } from "../hooks/useCurrencyConverter";

export type WalletType =
  | "metamask"
  | "coinbase"
  | "walletconnect"
  | "trust"
  | "rainbow"
  | "smart"
  | "embedded"
  | "injected"
  | null;

export type ConnectionMethod =
  | "extension"
  | "mobile_app"
  | "qr_code"
  | "deeplink"
  | "embedded"
  | "walletconnect";

export enum WalletErrorCode {
  USER_REJECTED = 4001,
  UNAUTHORIZED = 4100,
  UNSUPPORTED_METHOD = 4200,
  DISCONNECTED = 4900,
  CHAIN_DISCONNECTED = 4901,
  NETWORK_ERROR = -32000,
  CONNECTION_TIMEOUT = -32001,
  WALLET_NOT_FOUND = -32002,
}

export class WalletError extends Error {
  constructor(
    message: string,
    public code: WalletErrorCode,
    public data?: any
  ) {
    super(message);
    this.name = "WalletError";
  }
}

export interface PaymentRequest {
  to: string;
  amount: string;
  currency: Currency;
  data?: string;
  gasLimit?: string;
  gasPrice?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  orderId?: string;
  isEscrow?: boolean;
}

export interface PaymentResult {
  hash: string;
  from: string;
  to: string;
  amount: string;
  currency: Currency;
  gasUsed?: string;
  effectiveGasPrice?: string;
  blockNumber?: number;
  timestamp?: number;
  isEscrow?: boolean;
  orderId?: string;
}

export interface WalletInfo {
  type: WalletType;
  name: string;
  icon: string;
  color: string;
  installed: boolean;
  available: boolean;
  recommended: boolean;
  supportedMethods: ConnectionMethod[];
  requiresDownload: boolean;
  downloadUrl?: string;
  deepLink?: string;
  priority: number;
}

export interface DeviceInfo {
  isMobile: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isTouchDevice: boolean;
  isStandalone: boolean;
  hasWebAuthn: boolean;
  supportsBiometrics: boolean;
  preferredConnection: ConnectionMethod;
  availableWallets: string[];
  userAgent: string;
}

export interface ConnectionState {
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
  lastConnected?: number;
  connectionUri?: string;
}

export interface EscrowTransaction {
  orderId: string;
  buyerAddress: string;
  amount: string;
  currency: Currency;
  status: "pending" | "completed" | "cancelled";
}
