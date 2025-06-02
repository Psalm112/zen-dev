interface Web3Error {
  message?: string;
  reason?: string;
  code?: string | number;
  data?: {
    message?: string;
  };
  details?: string;
  shortMessage?: string;
}

export const parseWeb3Error = (error: unknown): string => {
  // Handle null/undefined
  if (!error) {
    return "An unknown error occurred";
  }

  // Handle string errors
  if (typeof error === "string") {
    return error;
  }

  // Handle Error objects and Web3 errors
  if (typeof error === "object") {
    const err = error as Web3Error;

    // Check for specific contract errors first
    const errorStr = JSON.stringify(error).toLowerCase();

    if (errorStr.includes("insufficientusdtbalance")) {
      return "Insufficient USDT balance for this purchase";
    }
    if (errorStr.includes("insufficientusdtallowance")) {
      return "Please approve USDT spending first";
    }
    if (errorStr.includes("insufficientquantity")) {
      return "Not enough items available";
    }
    if (errorStr.includes("buyerisseller")) {
      return "You cannot buy your own product";
    }
    if (errorStr.includes("user rejected")) {
      return "Transaction was rejected by user";
    }
    if (errorStr.includes("insufficient funds")) {
      return "Insufficient CELO for transaction fees";
    }

    // Try different error message properties
    if (err.shortMessage && typeof err.shortMessage === "string") {
      return err.shortMessage;
    }
    if (err.message && typeof err.message === "string") {
      return err.message;
    }
    if (err.reason && typeof err.reason === "string") {
      return err.reason;
    }
    if (err.data?.message && typeof err.data.message === "string") {
      return err.data.message;
    }
    if (err.details && typeof err.details === "string") {
      return err.details;
    }
  }

  // Fallback
  return "Transaction failed. Please try again.";
};
