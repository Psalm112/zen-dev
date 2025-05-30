import { FC, useState, useEffect } from "react";
import { FaSpinner, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import { motion } from "framer-motion";
import { useContract } from "../../utils/hooks/useContract";
import { useWallet } from "../../context/WalletContext";
import { useCurrencyConverter } from "../../utils/hooks/useCurrencyConverter";

interface TransactionConfirmationProps {
  contractAddress: string;
  amount: string;
  isUSDT?: boolean;
  usdtAddress?: string;
  tradeId?: string;
  quantity?: number;
  logisticsProviderAddress?: string;
  onComplete: (success: boolean) => void;
}

const TransactionConfirmation: FC<TransactionConfirmationProps> = ({
  contractAddress,
  amount,
  isUSDT = false,
  usdtAddress,
  tradeId,
  quantity = 1,
  logisticsProviderAddress,
  onComplete,
}) => {
  const { buyTrade } = useContract();
  const { balances } = useWallet();
  const { convertPrice, formatPrice } = useCurrencyConverter();

  const [status, setStatus] = useState<"pending" | "success" | "error">(
    "pending"
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleTransaction = async () => {
      setIsProcessing(true);

      try {
        const userUSDTBalance = parseFloat(
          (balances.usdt || "0").replace(/[^\d.,]/g, "").replace(/,/g, "") ||
            "0"
        );
        const requiredAmount = parseFloat(amount);
        const requiredWithBuffer = requiredAmount * 1.01;

        if (userUSDTBalance < requiredWithBuffer) {
          setStatus("error");
          setErrorMessage(
            `Insufficient USDT balance. You need ${formatPrice(
              requiredAmount,
              "USDT"
            )} USDT but only have ${formatPrice(
              userUSDTBalance,
              "USDT"
            )} USDT available.`
          );
          onComplete(false);
          return;
        }

        const userCELOBalance = parseFloat(
          balances.celo?.replace(/[^\d.-]/g, "") || "0"
        );

        if (userCELOBalance < 0.001) {
          console.warn("Low CELO balance for gas fees");
        }

        if (tradeId && logisticsProviderAddress) {
          const result = await buyTrade({
            tradeId,
            quantity,
            logisticsProvider: logisticsProviderAddress,
          });

          if (result.success) {
            if (result.transactionHash) {
              setTransactionHash(result.transactionHash);
            } else {
              setTransactionHash(
                "0x" + Math.random().toString(16).substr(2, 64)
              );
            }
            setStatus("success");
            onComplete(true);
          } else {
            setStatus("error");
            setErrorMessage(
              result.message || "Transaction failed. Please try again."
            );
            onComplete(false);
          }
        } else {
          setStatus("error");
          setErrorMessage("Missing trade information.");
          onComplete(false);
        }
      } catch (error: any) {
        console.error("Transaction error:", error);
        setStatus("error");
        setErrorMessage(error.message || "Unknown error occurred");
        onComplete(false);
      } finally {
        setIsProcessing(false);
      }
    };

    handleTransaction();
  }, [
    contractAddress,
    amount,
    isUSDT,
    usdtAddress,
    tradeId,
    quantity,
    logisticsProviderAddress,
    buyTrade,
    balances,
    formatPrice,
    onComplete,
  ]);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-md mx-auto bg-[#212428] p-6 md:p-8 rounded-lg shadow-lg"
    >
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4">
          {status === "pending" && (
            <FaSpinner className="text-4xl text-yellow-500 animate-spin" />
          )}
          {status === "success" && (
            <FaCheckCircle className="text-4xl text-green-500" />
          )}
          {status === "error" && (
            <FaTimesCircle className="text-4xl text-red-500" />
          )}
        </div>
        <h2 className="text-xl font-semibold mb-2">
          {status === "pending" && "Confirming Transaction"}
          {status === "success" && "Transaction Complete"}
          {status === "error" && "Transaction Failed"}
        </h2>
        <p className="text-gray-400 text-sm">
          {status === "pending" &&
            `Sending ${amount} ${isUSDT ? "USDT" : "ETH"} to escrow...`}
          {status === "success" &&
            `Successfully sent ${amount} ${isUSDT ? "USDT" : "ETH"} to escrow.`}
          {status === "error" &&
            (errorMessage || "There was an error processing your transaction.")}
        </p>
      </div>

      <div className="bg-[#2A2D35] p-4 rounded-lg mb-4">
        <p className="text-gray-400 text-sm">Contract Address</p>
        <p className="text-white font-mono text-sm break-all">
          {contractAddress}
        </p>
      </div>

      <div className="bg-[#2A2D35] p-4 rounded-lg mb-4">
        <p className="text-gray-400 text-sm">Amount</p>
        <p className="text-white">
          {amount} {isUSDT ? "USDT" : "ETH"}
        </p>
      </div>

      {transactionHash && (
        <div className="bg-[#2A2D35] p-4 rounded-lg mb-4">
          <p className="text-gray-400 text-sm">Transaction Hash</p>
          <p className="text-white font-mono text-sm break-all">
            {transactionHash}
          </p>
        </div>
      )}

      {status === "error" && (
        <button
          onClick={() => window.location.reload()}
          className="w-full py-3 bg-Red hover:bg-[#e02d37] text-white rounded transition-colors mt-4"
        >
          Try Again
        </button>
      )}
    </motion.div>
  );
};

export default TransactionConfirmation;
