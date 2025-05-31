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
} from "../utils/types/web3.types";
import { TARGET_CHAIN, USDT_ADDRESSES } from "../utils/config/web3.config";
import { useSnackbar } from "./SnackbarContext";
import { useCurrencyConverter } from "../utils/hooks/useCurrencyConverter";

// Extended wallet state to include converted balances
interface ExtendedWalletState extends WalletState {
  usdtBalance?: {
    raw: string;
    usdt: string;
    celo: string;
    fiat: string;
  };
}

// Extended context type
interface ExtendedWeb3ContextType extends Omit<Web3ContextType, "wallet"> {
  wallet: ExtendedWalletState;
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

  const isCorrectNetwork = chain?.id === TARGET_CHAIN.id;

  // Get CELO balance for gas fees
  const { data: celoBalance, refetch: refetchCeloBalance } = useBalance({
    address,
    query: {
      enabled: !!address && isCorrectNetwork,
      refetchInterval: 30000, // Refetch every 30 seconds
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

  // Get USDT balance with fixed typing
  // const { data: usdtBalance, refetch: refetchUSDTBalance } = useReadContract({
  //   address: usdtContractAddress,
  //   abi: erc20Abi,
  //   functionName: "balanceOf",
  //   args: address ? [address] : undefined,
  //   query: { enabled: !!address && !!usdtContractAddress },
  // });

  // converted USDT balances
  const convertedUSDTBalances = useMemo(() => {
    if (!usdtBalance || usdtError) return undefined;

    try {
      const rawBalance = formatUnits(usdtBalance as bigint, 6);
      const numericBalance = parseFloat(rawBalance);

      if (isNaN(numericBalance)) return undefined;

      return {
        raw: rawBalance,
        usdt: formatPrice(numericBalance, "USDT"),
        celo: formatPrice(convertPrice(numericBalance, "USDT", "CELO"), "CELO"),
        fiat: formatPrice(convertPrice(numericBalance, "USDT", "FIAT"), "FIAT"),
      };
    } catch (error) {
      console.error("Error formatting USDT balance:", error);
      return undefined;
    }
  }, [usdtBalance, usdtError, convertPrice, formatPrice]);

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

  // Auto-refresh balances
  useEffect(() => {
    if (isConnected && address && isCorrectNetwork) {
      const interval = setInterval(() => {
        refetchUSDTBalance();
        refetchCeloBalance();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [
    isConnected,
    address,
    isCorrectNetwork,
    refetchUSDTBalance,
    refetchCeloBalance,
  ]);

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
      if (result.data) {
        return formatUnits(result.data as bigint, 6);
      }
      return "0";
    } catch (error) {
      console.error("Failed to fetch USDT balance:", error);
      return "0";
    }
  }, [refetchUSDTBalance]);

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
      if (!usdtAddress) {
        throw new Error("USDT not supported on this network");
      }

      try {
        const amount = parseUnits(params.amount, 6);

        const hash = await writeContractAsync({
          address: usdtAddress as `0x${string}`,
          abi: erc20Abi,
          functionName: "transfer",
          args: [params.to as `0x${string}`, amount],
        });

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
        showSnackbar("Payment failed. Please try again.", "error");
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
    ]
  );

  const value: ExtendedWeb3ContextType = {
    wallet,
    connectWallet,
    disconnectWallet,
    switchToCorrectNetwork,
    sendPayment,
    getUSDTBalance,
    isCorrectNetwork,
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
