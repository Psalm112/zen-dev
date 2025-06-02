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
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { parseUnits, formatUnits, erc20Abi } from "viem";
import { readContract } from "@wagmi/core";
import { config } from "../utils/config/wagmi.config";
import {
  Web3ContextType,
  WalletState,
  PaymentTransaction,
  PaymentParams,
  BuyTradeParams,
} from "../utils/types/web3.types";
import {
  TARGET_CHAIN,
  USDT_ADDRESSES,
  ESCROW_ADDRESSES,
} from "../utils/config/web3.config";
import { useSnackbar } from "./SnackbarContext";
import { useCurrencyConverter } from "../utils/hooks/useCurrencyConverter";
import { DEZENMART_ABI } from "../utils/abi/dezenmartAbi.json";
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

interface TradeDetails {
  seller: string;
  productCost: bigint;
  escrowFee: bigint;
  totalQuantity: bigint;
  remainingQuantity: bigint;
  active: boolean;
  logisticsProviders: string[];
  logisticsCosts: bigint[];
}

interface ExtendedWeb3ContextType extends Omit<Web3ContextType, "wallet"> {
  wallet: ExtendedWalletState;
  buyTrade: (params: BuyTradeParams) => Promise<PaymentTransaction>;
  approveUSDT: (amount: string) => Promise<string>;
  usdtAllowance: bigint | undefined;
  usdtDecimals: number | undefined;
  transactionState: TransactionState;
  needsApproval: (amount: string) => Promise<boolean>;
  getTradeDetails: (tradeId: string) => Promise<TradeDetails>;
  calculateTotalCost: (
    tradeId: string,
    quantity: string,
    logisticsProvider: string
  ) => Promise<string>;
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

  // Memoized contract addresses
  const contractConfig = useMemo(() => {
    if (!chain?.id) return null;
    return {
      escrowAddress:
        ESCROW_ADDRESSES[chain.id as keyof typeof ESCROW_ADDRESSES],
      usdtAddress: USDT_ADDRESSES[chain.id as keyof typeof USDT_ADDRESSES],
    };
  }, [chain?.id]);

  // Query options
  const queryOptions = useMemo(
    () => ({
      enabled: !!address && !!contractConfig?.usdtAddress && isCorrectNetwork,
      refetchInterval: 30000,
      staleTime: 15000,
      retry: 2,
      retryDelay: (attemptIndex: number) =>
        Math.min(1000 * 2 ** attemptIndex, 10000),
    }),
    [address, contractConfig?.usdtAddress, isCorrectNetwork]
  );

  // Transaction receipt monitoring
  const { data: receipt, isLoading: isConfirming } =
    useWaitForTransactionReceipt({
      hash: currentTxHash as `0x${string}`,
      query: { enabled: !!currentTxHash },
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
    query: queryOptions,
  });

  // USDT balance
  const {
    data: usdtBalance,
    refetch: refetchUSDTBalance,
    isLoading: isLoadingUSDT,
    error: usdtError,
  } = useReadContract({
    address: contractConfig?.usdtAddress as `0x${string}`,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: queryOptions,
  });

  // USDT decimals
  const { data: usdtDecimals } = useReadContract({
    address: contractConfig?.usdtAddress as `0x${string}`,
    abi: erc20Abi,
    functionName: "decimals",
    query: {
      enabled: !!contractConfig?.usdtAddress && isCorrectNetwork,
      staleTime: Infinity,
    },
  });

  // USDT allowance
  const { data: usdtAllowance, refetch: refetchAllowance } = useReadContract({
    address: contractConfig?.usdtAddress as `0x${string}`,
    abi: erc20Abi,
    functionName: "allowance",
    args:
      address && contractConfig?.escrowAddress
        ? [address, contractConfig.escrowAddress as `0x${string}`]
        : undefined,
    query: queryOptions,
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
    const handleAccountsChanged = () => refetchBalances();
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

  // Wallet functions
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

  // Get trade details from contract
  const getTradeDetails = useCallback(
    async (tradeId: string): Promise<TradeDetails> => {
      if (!address || !contractConfig?.escrowAddress) {
        throw new Error("Wallet not connected or contract not available");
      }

      try {
        const trade = await readContract(config, {
          address: contractConfig.escrowAddress as `0x${string}`,
          abi: DEZENMART_ABI,
          functionName: "getTrade",
          args: [BigInt(tradeId)],
        });

        return {
          seller: trade.seller,
          productCost: trade.productCost,
          escrowFee: trade.escrowFee,
          totalQuantity: trade.totalQuantity,
          remainingQuantity: trade.remainingQuantity,
          active: trade.active,
          logisticsProviders: trade.logisticsProviders,
          logisticsCosts: trade.logisticsCosts,
        };
      } catch (error) {
        console.error("Failed to get trade details:", error);
        throw new Error("Failed to fetch trade details");
      }
    },
    [address, contractConfig?.escrowAddress]
  );

  // Calculate total cost using contract data
  const calculateTotalCost = useCallback(
    async (
      tradeId: string,
      quantity: string,
      logisticsProvider: string
    ): Promise<string> => {
      if (usdtDecimals === undefined) {
        throw new Error("USDT decimals not loaded");
      }

      try {
        const trade = await getTradeDetails(tradeId);

        // Find logistics cost for the selected provider
        const providerIndex = trade.logisticsProviders.findIndex(
          (provider) =>
            provider.toLowerCase() === logisticsProvider.toLowerCase()
        );

        if (providerIndex === -1) {
          throw new Error("Invalid logistics provider");
        }

        const logisticsCost = trade.logisticsCosts[providerIndex];
        const productCost = trade.productCost * BigInt(quantity);
        const escrowFee = trade.escrowFee;

        // Total = (productCost * quantity) + logisticsCost + escrowFee
        const totalCostBigInt = productCost + logisticsCost + escrowFee;

        return formatUnits(totalCostBigInt, Number(usdtDecimals));
      } catch (error) {
        console.error("Failed to calculate total cost:", error);
        throw error;
      }
    },
    [getTradeDetails, usdtDecimals]
  );

  const getUSDTBalance = useCallback(async (): Promise<string> => {
    try {
      const result = await refetchUSDTBalance();
      if (result.data && usdtDecimals !== undefined) {
        const balanceBigInt = result.data as bigint;
        const decimals = Number(usdtDecimals);
        const formattedBalance = formatUnits(balanceBigInt, decimals);
        const numericBalance = parseFloat(formattedBalance);

        return numericBalance.toLocaleString("en-US", {
          minimumFractionDigits: 0,
          maximumFractionDigits: Math.min(decimals, 6),
        });
      }
      return "0";
    } catch (error) {
      console.error("Failed to fetch USDT balance:", error);
      return "0";
    }
  }, [refetchUSDTBalance, usdtDecimals]);

  // Converted USDT balances
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
    if (!address || !contractConfig?.usdtAddress) return 0;

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
  }, [address, contractConfig?.usdtAddress, refetchAllowance, usdtDecimals]);

  const approveUSDT = useCallback(
    async (amount: string): Promise<string> => {
      if (!address || !contractConfig) {
        throw new Error("Wallet not connected");
      }

      if (!isCorrectNetwork) {
        await switchToCorrectNetwork();
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }

      if (
        !contractConfig.usdtAddress ||
        !contractConfig.escrowAddress ||
        usdtDecimals === undefined
      ) {
        throw new Error("Contracts not available on this network");
      }

      setTransactionState({ status: "pending" });
      showSnackbar("Approving USDT spending...", "info");

      try {
        const hash = await writeContractAsync({
          address: contractConfig.usdtAddress as `0x${string}`,
          abi: erc20Abi,
          functionName: "approve",
          args: [
            contractConfig.escrowAddress as `0x${string}`,
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
      contractConfig,
      isCorrectNetwork,
      switchToCorrectNetwork,
      writeContractAsync,
      showSnackbar,
      usdtDecimals,
    ]
  );

  const buyTrade = useCallback(
    async (params: BuyTradeParams): Promise<PaymentTransaction> => {
      if (!address || !contractConfig?.escrowAddress) {
        throw new Error("Wallet not connected");
      }

      if (!isCorrectNetwork) {
        await switchToCorrectNetwork();
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      try {
        // Get actual total cost from contract calculation
        const totalAmount = await calculateTotalCost(
          params.tradeId,
          params.quantity,
          params.logisticsProvider
        );

        // Check if approval is needed
        const approvalNeeded = await needsApproval(totalAmount);

        if (approvalNeeded) {
          showSnackbar("Approval required for USDT spending", "info");
          await approveUSDT(totalAmount);
          await new Promise((resolve) => setTimeout(resolve, 2000));
          await refetchAllowance();
        }

        // Execute buy trade
        setTransactionState({ status: "pending" });
        showSnackbar("Initiating purchase...", "info");

        const hash = await writeContractAsync({
          address: contractConfig.escrowAddress as `0x${string}`,
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
          to: contractConfig.escrowAddress,
          from: address,
          status: "pending",
          timestamp: Date.now(),
        };

        showSnackbar("Purchase submitted! Waiting for confirmation...", "info");

        // Refresh balances after transaction
        setTimeout(refetchBalances, 3000);

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
      contractConfig,
      isCorrectNetwork,
      switchToCorrectNetwork,
      writeContractAsync,
      showSnackbar,
      needsApproval,
      approveUSDT,
      refetchAllowance,
      refetchBalances,
      calculateTotalCost,
    ]
  );

  const sendPayment = useCallback(
    async (params: PaymentParams): Promise<PaymentTransaction> => {
      if (!address || !contractConfig?.usdtAddress) {
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

      if (usdtDecimals === undefined) {
        throw new Error("USDT not supported on this network");
      }

      setTransactionState({ status: "pending" });

      try {
        const amount = parseUnits(params.amount, Number(usdtDecimals));

        const hash = await writeContractAsync({
          address: contractConfig.usdtAddress as `0x${string}`,
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
      contractConfig,
      isCorrectNetwork,
      switchToCorrectNetwork,
      writeContractAsync,
      showSnackbar,
      usdtDecimals,
    ]
  );

  // Memoized context value
  const value = useMemo(
    (): ExtendedWeb3ContextType => ({
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
      getTradeDetails,
      calculateTotalCost,
      isCorrectNetwork,
      transactionState,
      needsApproval,
    }),
    [
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
      getTradeDetails,
      calculateTotalCost,
      isCorrectNetwork,
      transactionState,
      needsApproval,
    ]
  );

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
};

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (context === undefined) {
    throw new Error("useWeb3 must be used within a Web3Provider");
  }
  return context;
};
