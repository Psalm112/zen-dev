import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
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

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

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

  const [wallet, setWallet] = useState<WalletState>({
    isConnected: false,
    isConnecting: false,
  });

  const isCorrectNetwork = chain?.id === TARGET_CHAIN.id;

  // Get ETH balance for gas fees
  const { data: ethBalance } = useBalance({
    address,
    query: { enabled: !!address },
  });

  // Get USDT balance
  const { data: usdtBalance, refetch: refetchUSDTBalance } = useReadContract({
    address:
      address && USDT_ADDRESSES[chain?.id as keyof typeof USDT_ADDRESSES],
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!chain?.id },
  });

  // Update wallet state when account changes
  useEffect(() => {
    setWallet((prev) => ({
      ...prev,
      isConnected,
      address,
      chainId: chain?.id,
      balance: ethBalance
        ? formatUnits(ethBalance.value, ethBalance.decimals)
        : undefined,
      error: connectError?.message,
      isConnecting,
    }));
  }, [isConnected, address, chain, ethBalance, connectError, isConnecting]);

  const connectWallet = useCallback(async () => {
    try {
      // Auto-connect to the first available connector (usually MetaMask)
      const connector =
        connectors.find((c) => c.name === "MetaMask") || connectors[0];
      if (connector) {
        connect({ connector });
      }
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      showSnackbar("Failed to connect wallet. Please try again.", "error");
    }
  }, [connect, connectors]);

  const disconnectWallet = useCallback(() => {
    disconnect();
    showSnackbar("Wallet disconnected", "success");
  }, [disconnect]);

  const switchToCorrectNetwork = useCallback(async () => {
    try {
      await switchChain({ chainId: TARGET_CHAIN.id });
      showSnackbar(`Switched to ${TARGET_CHAIN.name}`, "success");
    } catch (error) {
      console.error("Failed to switch network:", error);
      showSnackbar(`Failed to switch to ${TARGET_CHAIN.name}`, "error");
      throw error;
    }
  }, [switchChain]);

  const getUSDTBalance = useCallback(async (): Promise<string> => {
    await refetchUSDTBalance();
    if (usdtBalance) {
      return formatUnits(usdtBalance as bigint, 6);
    }
    return "0";
  }, [usdtBalance, refetchUSDTBalance]);

  const sendPayment = useCallback(
    async (params: PaymentParams): Promise<PaymentTransaction> => {
      if (!address || !chain?.id) {
        throw new Error("Wallet not connected");
      }

      if (!isCorrectNetwork) {
        await switchToCorrectNetwork();
      }

      const usdtAddress =
        USDT_ADDRESSES[chain.id as keyof typeof USDT_ADDRESSES];
      if (!usdtAddress) {
        throw new Error("USDT not supported on this network");
      }

      try {
        const amount = parseUnits(params.amount, 6);

        const hash = await writeContractAsync({
          address: usdtAddress,
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
    ]
  );

  const value: Web3ContextType = {
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
