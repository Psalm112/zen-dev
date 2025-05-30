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
  | "embedded";

export interface WalletError extends Error {
  code?: number;
  data?: any;
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
}
