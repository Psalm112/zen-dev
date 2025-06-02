import { useCallback, useState } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useWeb3 } from "../../context/Web3Context";
import { DEZENMART_ABI } from "../abi/dezenmartAbi.json";
import { ESCROW_ADDRESSES } from "../config/web3.config";
import { useSnackbar } from "../../context/SnackbarContext";
import { parseWeb3Error } from "../errorParser";

interface ContractResult {
  success: boolean;
  message?: string;
  hash?: string;
  receipt?: any;
}

interface ContractState {
  isLoading: boolean;
  error?: string;
}

export const useContract = () => {
  const { wallet, switchToCorrectNetwork, isCorrectNetwork } = useWeb3();
  const { writeContractAsync } = useWriteContract();
  const { showSnackbar } = useSnackbar();

  const [contractState, setContractState] = useState<ContractState>({
    isLoading: false,
  });

  const [currentTxHash, setCurrentTxHash] = useState<string | undefined>();

  // Monitor transaction receipt
  const { data: receipt, isLoading: isConfirming } =
    useWaitForTransactionReceipt({
      hash: currentTxHash as `0x${string}`,
      query: {
        enabled: !!currentTxHash,
      },
    });

  const getEscrowAddress = useCallback(() => {
    if (!wallet.chainId) {
      throw new Error("Wallet not connected");
    }

    const escrowAddress =
      ESCROW_ADDRESSES[wallet.chainId as keyof typeof ESCROW_ADDRESSES];
    if (!escrowAddress) {
      throw new Error("Escrow contract not available on this network");
    }

    return escrowAddress as `0x${string}`;
  }, [wallet.chainId]);

  const executeContractFunction = useCallback(
    async (
      functionName: string,
      args: any[],
      loadingMessage: string,
      successMessage: string
    ): Promise<ContractResult> => {
      try {
        if (!wallet.isConnected || !wallet.address) {
          return {
            success: false,
            message: "Please connect your wallet first",
          };
        }

        if (!isCorrectNetwork) {
          try {
            await switchToCorrectNetwork();
            await new Promise((resolve) => setTimeout(resolve, 1500));
          } catch (error) {
            return {
              success: false,
              message: "Please switch to the correct network first",
            };
          }
        }

        const escrowAddress = getEscrowAddress();

        setContractState({ isLoading: true });
        showSnackbar(loadingMessage, "info");

        const hash = await writeContractAsync({
          address: escrowAddress,
          abi: DEZENMART_ABI,
          functionName,
          args,
        });

        setCurrentTxHash(hash);
        showSnackbar(
          "Transaction submitted! Waiting for confirmation...",
          "info"
        );

        // Wait for confirmation
        return new Promise((resolve) => {
          const checkReceipt = setInterval(() => {
            if (receipt) {
              clearInterval(checkReceipt);
              setContractState({ isLoading: false });
              setCurrentTxHash(undefined);

              if (receipt.status === "success") {
                showSnackbar(successMessage, "success");
                resolve({
                  success: true,
                  message: successMessage,
                  hash,
                  receipt,
                });
              } else {
                const errorMessage = "Transaction failed";
                showSnackbar(errorMessage, "error");
                resolve({
                  success: false,
                  message: errorMessage,
                });
              }
            }
          }, 1000);

          // Timeout after 2 minutes
          setTimeout(() => {
            clearInterval(checkReceipt);
            if (!receipt) {
              setContractState({ isLoading: false });
              setCurrentTxHash(undefined);
              resolve({
                success: false,
                message: "Transaction timeout. Please check manually.",
              });
            }
          }, 120000);
        });
      } catch (error: any) {
        console.error(`${functionName} error:`, error);
        setContractState({ isLoading: false, error: parseWeb3Error(error) });
        setCurrentTxHash(undefined);

        const errorMessage = parseWeb3Error(error);
        showSnackbar(errorMessage, "error");

        return { success: false, message: errorMessage };
      }
    },
    [
      wallet.isConnected,
      wallet.address,
      isCorrectNetwork,
      switchToCorrectNetwork,
      getEscrowAddress,
      writeContractAsync,
      showSnackbar,
      receipt,
    ]
  );

  const confirmDelivery = useCallback(
    async (purchaseId: string): Promise<ContractResult> => {
      const purchaseIdBigInt = BigInt(purchaseId);
      return executeContractFunction(
        "confirmDelivery",
        [purchaseIdBigInt],
        "Confirming delivery...",
        "Delivery confirmed successfully!"
      );
    },
    [executeContractFunction]
  );

  const confirmPurchase = useCallback(
    async (purchaseId: string): Promise<ContractResult> => {
      const purchaseIdBigInt = BigInt(purchaseId);
      return executeContractFunction(
        "confirmPurchase",
        [purchaseIdBigInt],
        "Confirming purchase...",
        "Purchase confirmed successfully!"
      );
    },
    [executeContractFunction]
  );

  return {
    confirmDelivery,
    confirmPurchase,
    contractState,
    isConfirming,
  };
};
