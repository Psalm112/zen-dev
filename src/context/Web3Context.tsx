import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useBalance,
  useSwitchChain,
} from "wagmi";
import { parseUnits, formatUnits, erc20Abi } from "viem";
import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import {
  Web3ContextType,
  WalletState,
  PaymentTransaction,
  PaymentParams,
  BuyTradeParams,
} from "../utils/types/web3.types";
import { TARGET_CHAIN, USDT_ADDRESSES } from "../utils/config/web3.config";
import { useSnackbar } from "./SnackbarContext";
import { useCurrencyConverter } from "../utils/hooks/useCurrencyConverter";
import { DEZENMART_ABI } from "../utils/abi/dezenmartAbi.json";
import { ESCROW_ADDRESSES } from "../utils/config/web3.config";
import { parseWeb3Error } from "../utils/errorParser";

interface ExtendedWalletState extends WalletState {
  usdtBalance?: {
    raw: string;
    usdt: string;
    celo: string;
    fiat: string;
  };
}

interface TransactionState {
  status: "idle" | "pending" | "confirming" | "success" | "error";
  hash?: string;
  receipt?: any;
  error?: string;
}

interface ExtendedWeb3ContextType extends Omit<Web3ContextType, "wallet"> {
  wallet: ExtendedWalletState;
  buyTrade: (params: BuyTradeParams) => Promise<PaymentTransaction>;
  approveUSDT: (amount: string) => Promise<string>;
  usdtAllowance: bigint | undefined;
  usdtDecimals: number | undefined;
  transactionState: TransactionState;
  needsApproval: (amount: string) => Promise<boolean>;
}

const Web3Context = createContext<ExtendedWeb3ContextType | undefined>(
  undefined
);

export const Web3Provider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { showSnackbar } = useSnackbar();
  const { address, isConnected, chain } = useAccount();
  const {
    connect,
    connectors,
    isPending: isConnecting,
    error: connectError,
  } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  const { convertPrice, formatPrice } = useCurrencyConverter();

  const [wallet, setWallet] = useState<ExtendedWalletState>({
    isConnected: false,
    isConnecting: false,
  });

  const [transactionState, setTransactionState] = useState<TransactionState>({
    status: "idle",
  });

  const [currentTxHash, setCurrentTxHash] = useState<string | undefined>();

  const isCorrectNetwork = chain?.id === TARGET_CHAIN.id;

  // Transaction receipt monitoring
  const { data: receipt, isLoading: isConfirming } =
    useWaitForTransactionReceipt({
      hash: currentTxHash as `0x${string}`,
      query: {
        enabled: !!currentTxHash,
      },
    });

  // Update transaction state based on receipt
  useEffect(() => {
    if (receipt && currentTxHash) {
      if (receipt.status === "success") {
        setTransactionState({
          status: "success",
          hash: currentTxHash,
          receipt,
        });
        showSnackbar("Transaction confirmed successfully!", "success");
      } else {
        setTransactionState({
          status: "error",
          hash: currentTxHash,
          error: "Transaction failed",
        });
        showSnackbar("Transaction failed", "error");
      }
      setCurrentTxHash(undefined);
    }
  }, [receipt, currentTxHash, showSnackbar]);

  // Update confirming state
  useEffect(() => {
    if (isConfirming && currentTxHash) {
      setTransactionState((prev) => ({
        ...prev,
        status: "confirming",
      }));
    }
  }, [isConfirming, currentTxHash]);

  // CELO balance for gas fees
  const { data: celoBalance, refetch: refetchCeloBalance } = useBalance({
    address,
    query: {
      enabled: !!address && isCorrectNetwork,
      refetchInterval: 30000,
    },
  });

  // Get USDT contract address
  const usdtContractAddress = useMemo(() => {
    if (!address || !chain?.id) return undefined;
    const contractAddr =
      USDT_ADDRESSES[chain.id as keyof typeof USDT_ADDRESSES];
    return contractAddr as `0x${string}` | undefined;
  }, [address, chain?.id]);

  const {
    data: usdtBalance,
    refetch: refetchUSDTBalance,
    isLoading: isLoadingUSDT,
    error: usdtError,
  } = useReadContract({
    address: usdtContractAddress,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!usdtContractAddress && isCorrectNetwork,
      refetchInterval: 30000,
    },
  });

  // get USDT decimals
  const { data: usdtDecimals } = useReadContract({
    address: usdtContractAddress,
    abi: erc20Abi,
    functionName: "decimals",
    query: {
      enabled: !!usdtContractAddress && isCorrectNetwork,
      staleTime: Infinity,
    },
  });

  // Check current allowance
  const { data: usdtAllowance, refetch: refetchAllowance } = useReadContract({
    address: usdtContractAddress,
    abi: erc20Abi,
    functionName: "allowance",
    args:
      address && chain?.id
        ? [
            address,
            ESCROW_ADDRESSES[
              chain.id as keyof typeof ESCROW_ADDRESSES
            ] as `0x${string}`,
          ]
        : undefined,
    query: {
      enabled: !!address && !!usdtContractAddress && isCorrectNetwork,
      refetchInterval: 30000,
    },
  });

  // Optimized balance refetching
  const refetchBalances = useCallback(() => {
    if (
      document.visibilityState === "visible" &&
      isConnected &&
      isCorrectNetwork
    ) {
      refetchUSDTBalance();
      refetchCeloBalance();
      refetchAllowance();
    }
  }, [
    isConnected,
    isCorrectNetwork,
    refetchUSDTBalance,
    refetchCeloBalance,
    refetchAllowance,
  ]);

  // Auto-refresh balances
  useEffect(() => {
    if (isConnected && address && isCorrectNetwork) {
      const interval = setInterval(refetchBalances, 30000);
      return () => clearInterval(interval);
    }
  }, [isConnected, address, isCorrectNetwork, refetchBalances]);

  // Handle account and chain changes
  useEffect(() => {
    const handleAccountsChanged = () => {
      refetchBalances();
    };

    const handleChainChanged = () => {
      if (chain?.id !== TARGET_CHAIN.id) {
        showSnackbar("Please switch to the correct network", "info");
      }
    };

    if (typeof window !== "undefined" && window.ethereum) {
      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", handleChainChanged);

      return () => {
        window.ethereum?.removeListener(
          "accountsChanged",
          handleAccountsChanged
        );
        window.ethereum?.removeListener("chainChanged", handleChainChanged);
      };
    }
  }, [chain?.id, refetchBalances, showSnackbar]);

  const connectWallet = useCallback(async () => {
    try {
      const connector =
        connectors.find((c) => c.name === "MetaMask") || connectors[0];
      if (connector) {
        connect({ connector });
      }
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      showSnackbar("Failed to connect wallet. Please try again.", "error");
    }
  }, [connect, connectors, showSnackbar]);

  const disconnectWallet = useCallback(() => {
    disconnect();
    setTransactionState({ status: "idle" });
    showSnackbar("Wallet disconnected", "success");
  }, [disconnect, showSnackbar]);

  const switchToCorrectNetwork = useCallback(async () => {
    try {
      await switchChain({ chainId: TARGET_CHAIN.id });
      showSnackbar(`Switched to ${TARGET_CHAIN.name}`, "success");
    } catch (error) {
      console.error("Failed to switch network:", error);
      showSnackbar(`Failed to switch to ${TARGET_CHAIN.name}`, "error");
      throw error;
    }
  }, [switchChain, showSnackbar]);

  const getUSDTBalance = useCallback(async (): Promise<string> => {
    try {
      const result = await refetchUSDTBalance();
      if (result.data && usdtDecimals !== undefined) {
        const balanceBigInt = result.data as bigint;
        const decimals = Number(usdtDecimals);

        const formattedBalance = formatUnits(balanceBigInt, decimals);
        const numericBalance = parseFloat(formattedBalance);

        const cleanBalance = numericBalance.toLocaleString("en-US", {
          minimumFractionDigits: 0,
          maximumFractionDigits: Math.min(decimals, 6),
        });

        return cleanBalance;
      }
      return "0";
    } catch (error) {
      console.error("Failed to fetch USDT balance:", error);
      return "0";
    }
  }, [refetchUSDTBalance, usdtDecimals]);

  // converted USDT balances
  const convertedUSDTBalances = useMemo(() => {
    if (!usdtBalance || usdtError || usdtDecimals === undefined)
      return undefined;

    try {
      const decimals = Number(usdtDecimals);
      const rawBalance = formatUnits(usdtBalance as bigint, decimals);
      const numericBalance = parseFloat(rawBalance);

      if (isNaN(numericBalance)) return undefined;

      const formatWithDecimals = (value: number, maxDecimals: number = 2) => {
        return value.toLocaleString("en-US", {
          minimumFractionDigits: 0,
          maximumFractionDigits: maxDecimals,
          useGrouping: true,
        });
      };

      return {
        raw: rawBalance,
        usdt: `${formatWithDecimals(numericBalance, 6)} USDT`,
        celo: formatPrice(convertPrice(numericBalance, "USDT", "CELO"), "CELO"),
        fiat: `$${formatWithDecimals(numericBalance, 2)}`,
      };
    } catch (error) {
      console.error("Error formatting USDT balance:", error);
      return undefined;
    }
  }, [usdtBalance, usdtError, usdtDecimals, convertPrice, formatPrice]);

  // Update wallet state
  useEffect(() => {
    setWallet((prev) => ({
      ...prev,
      isConnected,
      address,
      chainId: chain?.id,
      balance: celoBalance
        ? formatUnits(celoBalance.value, celoBalance.decimals)
        : undefined,
      error: connectError?.message || usdtError?.message,
      isConnecting: isConnecting || isLoadingUSDT,
      usdtBalance: convertedUSDTBalances,
    }));
  }, [
    isConnected,
    address,
    chain,
    celoBalance,
    connectError,
    usdtError,
    isConnecting,
    isLoadingUSDT,
    convertedUSDTBalances,
  ]);

  const needsApproval = useCallback(
    async (amount: string): Promise<boolean> => {
      if (!usdtAllowance || usdtDecimals === undefined) return true;

      const requiredAmount = parseUnits(amount, Number(usdtDecimals));
      return (usdtAllowance as bigint) < requiredAmount;
    },
    [usdtAllowance, usdtDecimals]
  );

  const getCurrentAllowance = useCallback(async (): Promise<number> => {
    if (!address || !chain?.id || !usdtContractAddress) {
      return 0;
    }

    try {
      const result = await refetchAllowance();
      if (result.data && usdtDecimals !== undefined) {
        const allowanceBigInt = result.data as bigint;
        const decimals = Number(usdtDecimals);
        const formattedAllowance = formatUnits(allowanceBigInt, decimals);
        return parseFloat(formattedAllowance);
      }
      return 0;
    } catch (error) {
      console.error("Failed to fetch allowance:", error);
      return 0;
    }
  }, [address, chain?.id, usdtContractAddress, refetchAllowance, usdtDecimals]);

  const approveUSDT = useCallback(
    async (amount: string): Promise<string> => {
      if (!address || !chain?.id) {
        throw new Error("Wallet not connected");
      }

      if (!isCorrectNetwork) {
        await switchToCorrectNetwork();
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }

      const usdtAddress =
        USDT_ADDRESSES[chain.id as keyof typeof USDT_ADDRESSES];
      const escrowAddress =
        ESCROW_ADDRESSES[chain.id as keyof typeof ESCROW_ADDRESSES];

      if (!usdtAddress || !escrowAddress || usdtDecimals === undefined) {
        throw new Error("Contracts not available on this network");
      }

      setTransactionState({ status: "pending" });
      showSnackbar("Approving USDT spending...", "info");

      try {
        const hash = await writeContractAsync({
          address: usdtAddress as `0x${string}`,
          abi: erc20Abi,
          functionName: "approve",
          args: [
            escrowAddress as `0x${string}`,
            parseUnits(amount, Number(usdtDecimals)),
          ],
        });

        setCurrentTxHash(hash);
        showSnackbar("Approval submitted! Waiting for confirmation...", "info");
        return hash;
      } catch (error) {
        setTransactionState({ status: "error", error: parseWeb3Error(error) });
        throw error;
      }
    },
    [
      address,
      chain,
      isCorrectNetwork,
      switchToCorrectNetwork,
      writeContractAsync,
      showSnackbar,
      usdtDecimals,
    ]
  );

  const buyTrade = useCallback(
    async (params: BuyTradeParams): Promise<PaymentTransaction> => {
      if (!address || !chain?.id) {
        throw new Error("Wallet not connected");
      }

      if (!isCorrectNetwork) {
        await switchToCorrectNetwork();
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      const escrowAddress =
        ESCROW_ADDRESSES[chain.id as keyof typeof ESCROW_ADDRESSES];
      if (!escrowAddress) {
        throw new Error("Escrow contract not available on this network");
      }

      // Calculate total amount needed (this should come from contract or be calculated)
      const totalAmount = (
        params.productCost * params.quantity +
        params.logisticsCost
      ).toString();

      try {
        // Step 1: Check if approval is needed
        const approvalNeeded = await needsApproval(totalAmount);

        if (approvalNeeded) {
          showSnackbar("Approval required for USDT spending", "info");
          await approveUSDT(totalAmount);

          // Wait for approval to be mined
          await new Promise((resolve) => setTimeout(resolve, 2000));

          // Refresh allowance
          await refetchAllowance();
        }

        // Step 2: Execute buy trade
        setTransactionState({ status: "pending" });
        showSnackbar("Initiating purchase...", "info");

        const hash = await writeContractAsync({
          address: escrowAddress as `0x${string}`,
          abi: DEZENMART_ABI,
          functionName: "buyTrade",
          args: [
            BigInt(params.tradeId),
            BigInt(params.quantity),
            params.logisticsProvider as `0x${string}`,
          ],
        });

        setCurrentTxHash(hash);

        const transaction: PaymentTransaction = {
          hash,
          amount: totalAmount,
          token: "USDT",
          to: escrowAddress,
          from: address,
          status: "pending",
          timestamp: Date.now(),
        };

        showSnackbar("Purchase submitted! Waiting for confirmation...", "info");

        // Refresh balances after transaction
        setTimeout(() => {
          refetchBalances();
        }, 3000);

        return transaction;
      } catch (error) {
        console.error("Buy trade failed:", error);
        const errorMessage = parseWeb3Error(error);
        setTransactionState({ status: "error", error: errorMessage });
        showSnackbar(errorMessage, "error");
        throw new Error(errorMessage);
      }
    },
    [
      address,
      chain,
      isCorrectNetwork,
      switchToCorrectNetwork,
      writeContractAsync,
      showSnackbar,
      needsApproval,
      approveUSDT,
      refetchAllowance,
      refetchBalances,
    ]
  );

  const sendPayment = useCallback(
    async (params: PaymentParams): Promise<PaymentTransaction> => {
      if (!address || !chain?.id) {
        throw new Error("Wallet not connected");
      }

      if (!isCorrectNetwork) {
        try {
          await switchToCorrectNetwork();
          await new Promise((resolve) => setTimeout(resolve, 1000));
        } catch (error) {
          throw new Error("Please switch to the correct network first");
        }
      }

      const usdtAddress =
        USDT_ADDRESSES[chain.id as keyof typeof USDT_ADDRESSES];
      if (!usdtAddress || usdtDecimals === undefined) {
        throw new Error("USDT not supported on this network");
      }

      setTransactionState({ status: "pending" });

      try {
        const amount = parseUnits(params.amount, Number(usdtDecimals));

        const hash = await writeContractAsync({
          address: usdtAddress as `0x${string}`,
          abi: erc20Abi,
          functionName: "transfer",
          args: [params.to as `0x${string}`, amount],
        });

        setCurrentTxHash(hash);

        const transaction: PaymentTransaction = {
          hash,
          amount: params.amount,
          token: "USDT",
          to: params.to,
          from: address,
          status: "pending",
          timestamp: Date.now(),
        };

        showSnackbar("Payment sent! Waiting for confirmation...", "success");
        return transaction;
      } catch (error) {
        console.error("Payment failed:", error);
        const errorMessage = parseWeb3Error(error);
        setTransactionState({ status: "error", error: errorMessage });
        showSnackbar(errorMessage, "error");
        throw error;
      }
    },
    [
      address,
      chain,
      isCorrectNetwork,
      switchToCorrectNetwork,
      writeContractAsync,
      showSnackbar,
      usdtDecimals,
    ]
  );

  const value: ExtendedWeb3ContextType = {
    wallet,
    connectWallet,
    disconnectWallet,
    switchToCorrectNetwork,
    sendPayment,
    usdtAllowance,
    usdtDecimals,
    getCurrentAllowance,
    getUSDTBalance,
    buyTrade,
    approveUSDT,
    isCorrectNetwork,
    transactionState,
    needsApproval,
  };

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
};

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (context === undefined) {
    throw new Error("useWeb3 must be used within a Web3Provider");
  }
  return context;
};
