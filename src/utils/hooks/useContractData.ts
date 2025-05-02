// import { useCallback } from "react";
// import { useAppDispatch, useAppSelector } from "./redux";
// import {
//   createTrade,
//   clearTradeResponse,
// } from "../../store/slices/contractSlice";
// import {
//   selectTradeResponse,
//   selectIsContractPending,
//   selectIsContractError,
//   selectIsContractSuccess,
//   selectContractError,
// } from "../../store/selectors/contractSelectors";
// import { useSnackbar } from "../../context/SnackbarContext";
// import { CreateTradeParams } from "../types";

// export const useContractData = () => {
//   const dispatch = useAppDispatch();
//   const { showSnackbar } = useSnackbar();

//   const tradeResponse = useAppSelector(selectTradeResponse);
//   const isLoading = useAppSelector(selectIsContractPending);
//   const isError = useAppSelector(selectIsContractError);
//   const isSuccess = useAppSelector(selectIsContractSuccess);
//   const error = useAppSelector(selectContractError);

//   const initiateTradeContract = useCallback(
//     async (tradeData: CreateTradeParams, showNotifications = true) => {
//       try {
//         const result = await dispatch(createTrade(tradeData)).unwrap();

//         if (showNotifications) {
//           if (result.status === "success") {
//             showSnackbar("Trade contract created successfully", "success");
//           } else {
//             showSnackbar(result.message || "Trade creation failed", "error");
//           }
//         }

//         return result;
//       } catch (err) {
//         if (showNotifications) {
//           showSnackbar(
//             (err as string) || "Failed to create trade contract",
//             "error"
//           );
//         }
//         return {
//           status: "error",
//           message: (err as string) || "Failed to create trade contract",
//         };
//       }
//     },
//     [dispatch, showSnackbar]
//   );

//   const resetTradeResponse = useCallback(() => {
//     dispatch(clearTradeResponse());
//   }, [dispatch]);

//   return {
//     tradeResponse,
//     isLoading,
//     isError,
//     isSuccess,
//     error,
//     initiateTradeContract,
//     resetTradeResponse,
//   };
// };

// src/utils/hooks/useContractData.ts - Updated version

import { useCallback, useState } from "react";
import { useAppDispatch, useAppSelector } from "./redux";
import {
  createTrade,
  clearTradeResponse,
  setTransactionPending,
  confirmDelivery,
  clearDeliveryConfirmError,
} from "../../store/slices/contractSlice";
import {
  selectTradeResponse,
  selectIsContractPending,
  selectIsContractError,
  selectIsContractSuccess,
  selectContractError,
  selectTransactionPending,
  selectDeliveryConfirmLoading,
  selectDeliveryConfirmError,
} from "../../store/selectors/contractSelectors";
import { useSnackbar } from "../../context/SnackbarContext";
import { CreateTradeParams } from "../types";
import { useWallet } from "../../utils/hooks/useWallet";
import { ethers } from "ethers";

export const useContractData = () => {
  const dispatch = useAppDispatch();
  const { showSnackbar } = useSnackbar();
  const { signer, provider } = useWallet();
  const [transactionHash, setTransactionHash] = useState<string | null>(null);

  const tradeResponse = useAppSelector(selectTradeResponse);
  const isLoading = useAppSelector(selectIsContractPending);
  const isError = useAppSelector(selectIsContractError);
  const isSuccess = useAppSelector(selectIsContractSuccess);
  const error = useAppSelector(selectContractError);
  const isTransactionPending = useAppSelector(selectTransactionPending);
  const isDeliveryConfirmLoading = useAppSelector(selectDeliveryConfirmLoading);
  const deliveryConfirmError = useAppSelector(selectDeliveryConfirmError);

  const sendFundsToEscrow = useCallback(
    async (contractAddress: string, amount: string) => {
      if (!signer) {
        showSnackbar("Wallet not connected", "error");
        return { success: false, hash: null };
      }

      try {
        dispatch(setTransactionPending(true));

        // Convert the amount to wei
        const amountInWei = ethers.parseEther(amount);

        // Send transaction to escrow contract
        const tx = await signer.sendTransaction({
          to: contractAddress,
          value: amountInWei,
        });

        setTransactionHash(tx.hash);

        // Wait for transaction to be mined
        await tx.wait();

        showSnackbar("Funds successfully sent to escrow", "success");
        return { success: true, hash: tx.hash };
      } catch (err: any) {
        console.error("Transaction error:", err);
        showSnackbar(err.message || "Transaction failed", "error");
        return { success: false, hash: null };
      } finally {
        dispatch(setTransactionPending(false));
      }
    },
    [signer, dispatch, showSnackbar]
  );

  const initiateTradeContract = useCallback(
    async (tradeData: CreateTradeParams, showNotifications = true) => {
      try {
        const result = await dispatch(createTrade(tradeData)).unwrap();

        if (showNotifications) {
          if (result.status === "success") {
            showSnackbar("Trade contract created successfully", "success");

            // If contract creation was successful, we need to prompt for funds transfer
            if (result.data.contractAddress && result.data.amount) {
              // Show notification about required action
              showSnackbar(
                "Please confirm the transaction in your wallet to deposit funds",
                "info"
              );
            }
          } else {
            showSnackbar(result.message || "Trade creation failed", "error");
          }
        }

        return result;
      } catch (err) {
        if (showNotifications) {
          showSnackbar(
            (err as string) || "Failed to create trade contract",
            "error"
          );
        }
        return {
          status: "error",
          message: (err as string) || "Failed to create trade contract",
        };
      }
    },
    [dispatch, showSnackbar]
  );

  const confirmTradeDelivery = useCallback(
    async (tradeId: string) => {
      try {
        const result = await dispatch(confirmDelivery(tradeId)).unwrap();
        showSnackbar(
          "Delivery confirmed successfully. Funds released to seller.",
          "success"
        );
        return { success: true, message: result.message };
      } catch (err) {
        showSnackbar((err as string) || "Failed to confirm delivery", "error");
        return { success: false, message: err as string };
      }
    },
    [dispatch, showSnackbar]
  );

  const resetTradeResponse = useCallback(() => {
    dispatch(clearTradeResponse());
  }, [dispatch]);

  const clearDeliveryError = useCallback(() => {
    dispatch(clearDeliveryConfirmError());
  }, [dispatch]);

  return {
    tradeResponse,
    isLoading,
    isError,
    isSuccess,
    error,
    isTransactionPending,
    transactionHash,
    isDeliveryConfirmLoading,
    deliveryConfirmError,
    initiateTradeContract,
    sendFundsToEscrow,
    confirmTradeDelivery,
    resetTradeResponse,
    clearDeliveryError,
  };
};
