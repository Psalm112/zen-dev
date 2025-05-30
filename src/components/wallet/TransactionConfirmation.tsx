import { memo, useMemo, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FaTimes, FaCheck, FaSpinner } from "react-icons/fa";
import { IoWallet } from "react-icons/io5";
import { useWalletBalance } from "../../context/WalletContext";
import { TransactionData } from "../../utils/types/wallet.types";

interface TransactionConfirmationProps {
  readonly isOpen: boolean;
  readonly isLoading?: boolean;
  readonly transactionData: TransactionData;
  onClose: () => void;
  onConfirm: () => void;
}

export const TransactionConfirmation = memo<TransactionConfirmationProps>(
  ({ isOpen, isLoading = false, transactionData, onClose, onConfirm }) => {
    const modal = {
      overlay: {
        hidden: { opacity: 0 },
        visible: { opacity: 1 },
      },
      content: {
        hidden: { scale: 0.9, opacity: 0 },
        visible: { scale: 1, opacity: 1 },
      },
    };
    const { balances, formatted } = useWalletBalance();
    const [hasInsufficientBalance, setHasInsufficientBalance] = useState(false);

    const transactionDetails = useMemo(() => {
      const isEscrow = transactionData.type === "escrow";
      return {
        title: isEscrow ? "Confirm Escrow Payment" : "Confirm Delivery",
        description: isEscrow
          ? "Lock funds in escrow until delivery confirmation"
          : "Confirm delivery and release escrowed funds",
        actionText: isEscrow ? "Lock in Escrow" : "Release Funds",
        icon: isEscrow ? IoWallet : FaCheck,
        color: isEscrow ? "text-yellow-500" : "text-green-500",
      };
    }, [transactionData.type]);

    useEffect(() => {
      if (transactionData.amount && balances) {
        const amountNum = parseFloat(transactionData.amount);
        const balanceNum = parseFloat(balances.usdt);
        setHasInsufficientBalance(amountNum > balanceNum);
      }
    }, [transactionData.amount, balances]);

    const handleBackdropClick = (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    };

    if (!isOpen) return null;

    return (
      <motion.div
        variants={modal.overlay}
        initial="hidden"
        animate="visible"
        exit="hidden"
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={handleBackdropClick}
      >
        <motion.div
          variants={modal.content}
          className="bg-[#2A2D35] rounded-2xl p-6 w-full max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <transactionDetails.icon
                className={transactionDetails.color}
                size={24}
              />
              <h3 className="text-xl font-bold text-white">
                {transactionDetails.title}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[#3A3D45] rounded-lg transition-colors duration-200"
              aria-label="Close modal"
            >
              <FaTimes className="text-gray-400" size={16} />
            </button>
          </div>

          <div className="space-y-4 mb-6">
            <p className="text-gray-300 text-sm">
              {transactionDetails.description}
            </p>

            {transactionData.amount && (
              <div className="p-4 bg-[#212428] rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Amount</span>
                  <span className="text-white font-semibold text-lg">
                    ${transactionData.amount} USDT
                  </span>
                </div>
              </div>
            )}

            {transactionData.recipient && (
              <div className="p-4 bg-[#212428] rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Recipient</span>
                  <span className="text-white font-mono text-sm">
                    {transactionData.recipient.slice(0, 6)}...
                    {transactionData.recipient.slice(-4)}
                  </span>
                </div>
              </div>
            )}

            <div className="p-4 bg-[#212428] rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400">Your Balance</span>
                <span className="text-white font-medium">
                  {formatted?.usdt || "0.00"} USDT
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Gas Fee (Est.)</span>
                <span className="text-white font-medium">
                  {formatted?.celo || "0.00"} CELO
                </span>
              </div>
            </div>

            {hasInsufficientBalance && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg"
              >
                <p className="text-red-400 text-sm">
                  Insufficient balance. Please top up your wallet.
                </p>
              </motion.div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 py-3 bg-[#212428] text-white font-semibold rounded-xl hover:bg-[#3A3D45] disabled:opacity-50 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading || hasInsufficientBalance}
              className="flex-1 py-3 bg-[#ff343f] text-white font-semibold rounded-xl hover:bg-[#e6303a] disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <FaSpinner className="animate-spin" size={16} />
                  Processing...
                </>
              ) : (
                transactionDetails.actionText
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    );
  }
);

TransactionConfirmation.displayName = "TransactionConfirmation";
