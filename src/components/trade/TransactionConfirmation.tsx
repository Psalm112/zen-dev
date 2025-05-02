import { motion } from "framer-motion";
import React, { FC, useEffect, useState } from "react";
import {
  FaSpinner,
  FaCheckCircle,
  FaExclamationTriangle,
} from "react-icons/fa";
import { useContractData } from "../../utils/hooks/useContractData";

interface TransactionConfirmationProps {
  contractAddress: string;
  amount: string;
  onComplete: (success: boolean) => void;
}

const TransactionConfirmation: FC<TransactionConfirmationProps> = ({
  contractAddress,
  amount,
  onComplete,
}) => {
  const [status, setStatus] = useState<
    "pending" | "sending" | "success" | "error"
  >("pending");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { sendFundsToEscrow, isTransactionPending, transactionHash } =
    useContractData();

  useEffect(() => {
    const initiateTransaction = async () => {
      setStatus("sending");
      try {
        const result = await sendFundsToEscrow(contractAddress, amount);
        if (result.success) {
          setStatus("success");
          onComplete(true);
        } else {
          setStatus("error");
          setErrorMessage("Transaction failed. Please try again.");
          onComplete(false);
        }
      } catch (error) {
        setStatus("error");
        setErrorMessage((error as Error).message || "Transaction failed");
        onComplete(false);
      }
    };

    initiateTransaction();
  }, [contractAddress, amount, sendFundsToEscrow, onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-md mx-auto bg-[#212428] p-6 md:p-8 rounded-lg shadow-lg"
    >
      <div className="text-center mb-6">
        <motion.div
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
          className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
            status === "success"
              ? "bg-green-500/10 text-green-500"
              : status === "error"
              ? "bg-red-500/10 text-red-500"
              : "bg-Red/10 text-Red"
          }`}
        >
          {status === "pending" ||
          status === "sending" ||
          isTransactionPending ? (
            <FaSpinner className="text-3xl animate-spin" />
          ) : status === "success" ? (
            <FaCheckCircle className="text-3xl" />
          ) : (
            <FaExclamationTriangle className="text-3xl" />
          )}
        </motion.div>
        <h2 className="text-xl font-semibold mb-2">
          {status === "pending"
            ? "Preparing Transaction"
            : status === "sending" || isTransactionPending
            ? "Awaiting Confirmation"
            : status === "success"
            ? "Transaction Successful"
            : "Transaction Failed"}
        </h2>
        <p className="text-gray-400 text-sm">
          {status === "pending"
            ? "Please wait while we prepare your transaction..."
            : status === "sending" || isTransactionPending
            ? "Please confirm the transaction in your wallet to deposit funds into escrow"
            : status === "success"
            ? "Your funds have been successfully deposited into escrow"
            : errorMessage || "There was an error processing your transaction"}
        </p>
      </div>

      {status === "sending" || isTransactionPending ? (
        <div className="bg-[#2A2D35] p-4 rounded-lg mb-4">
          <p className="text-gray-400 text-sm mb-1">Amount</p>
          <p className="text-white font-medium">{amount} ETH</p>
        </div>
      ) : null}

      {transactionHash && (status === "success" || status === "error") && (
        <div className="bg-[#2A2D35] p-4 rounded-lg mb-4">
          <p className="text-gray-400 text-sm mb-1">Transaction Hash</p>
          <p className="text-white font-mono text-sm break-all">
            {transactionHash}
          </p>
        </div>
      )}

      {status === "error" && (
        <button
          onClick={() => sendFundsToEscrow(contractAddress, amount)}
          className="w-full py-3 bg-Red hover:bg-[#e02d37] text-white rounded transition-colors"
        >
          Try Again
        </button>
      )}

      {status === "success" && (
        <div className="bg-green-500/10 border border-green-500/30 text-green-400 p-3 rounded-md">
          Your transaction was successful. The funds are now held in escrow
          until delivery is confirmed.
        </div>
      )}
    </motion.div>
  );
};

export default React.memo(TransactionConfirmation);
