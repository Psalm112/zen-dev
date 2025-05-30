export interface WalletConnection {
  isConnected: boolean;
  isConnecting: boolean;
  account: string | null;
  walletType: string | null;
  chainId: number | null;
  error: string | null;
}

export interface WalletBalance {
  usdt: string;
  celo: string;
  fiat: string;
}

export interface TransactionData {
  type: "escrow" | "delivery";
  amount?: string;
  recipient?: string;
  gasEstimate?: string;
}

export interface ConnectWalletProps {
  onTransactionStart?: () => void;
  onTransactionComplete?: (hash: string) => void;
  onTransactionError?: (error: string) => void;
  showTransactionModal?: boolean;
  transactionData?: TransactionData;
  onTransactionModalClose?: () => void;
}

export interface EscrowDetails {
  id: string;
  buyer: string;
  seller: string;
  amount: string;
  currency: Currency;
  status: "pending" | "completed" | "disputed" | "released" | "refunded";
  createdAt: number;
  releaseTime?: number;
  disputeResolver?: string;
  metadata?: string;
}
