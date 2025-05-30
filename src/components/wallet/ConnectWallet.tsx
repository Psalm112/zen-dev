// src/components/wallet/ConnectWallet.tsx
import { memo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaCheck, FaSpinner } from "react-icons/fa";
import { IoExit } from "react-icons/io5";
import { useWallet } from "../../context/WalletContext";
import {
  ConnectWalletProps,
  TransactionData,
} from "../../utils/types/wallet.types";
import { BalanceDisplay } from "./BalanceDisplay";
import { WalletDetails } from "./WalletDetails";
import { WalletConnectionInterface } from "./WalletConnectionInterface";
import { TransactionConfirmation } from "./TransactionConfirmation";

export const ConnectWallet = memo<ConnectWalletProps>(
  ({
    onTransactionStart,
    onTransactionComplete,
    onTransactionError,
    showTransactionModal = false,
    transactionData,
    onTransactionModalClose,
  }) => {
    const [showDetails, setShowDetails] = useState(false);
    const [isTransactionLoading, setIsTransactionLoading] = useState(false);

    const { isConnected, account, disconnectWallet } = useWallet();

    const handleDisconnect = useCallback(async () => {
      try {
        await disconnectWallet();
        setShowDetails(false);
      } catch (err: any) {
        console.error("Disconnect failed:", err);
      }
    }, [disconnectWallet]);

    const handleTransactionConfirm = useCallback(async () => {
      if (!onTransactionStart) return;

      setIsTransactionLoading(true);

      try {
        onTransactionStart();

        // Simulate transaction processing
        await new Promise((resolve) => setTimeout(resolve, 2000));

        const mockTxHash = `0x${Math.random().toString(16).slice(2, 66)}`;
        onTransactionComplete?.(mockTxHash);
        onTransactionModalClose?.();
      } catch (error: any) {
        onTransactionError?.(error.message || "Transaction failed");
      } finally {
        setIsTransactionLoading(false);
      }
    }, [
      onTransactionStart,
      onTransactionComplete,
      onTransactionError,
      onTransactionModalClose,
    ]);

    const handleDetailsToggle = useCallback(() => {
      setShowDetails((prev) => !prev);
    }, []);

    const container = {
      hidden: { opacity: 0, y: 20 },
      visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.3, staggerChildren: 0.1 },
      },
      exit: { opacity: 0, y: -20, transition: { duration: 0.2 } },
    };

    const item = {
      hidden: { opacity: 0, x: -20 },
      visible: { opacity: 1, x: 0 },
    };

    // Connected state
    if (isConnected && account) {
      return (
        <>
          <motion.div
            variants={container}
            initial="hidden"
            animate="visible"
            className="space-y-4"
          >
            <motion.div
              variants={item}
              className="flex items-center justify-between p-4 bg-[#2A2D35] rounded-xl"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                  <FaCheck className="text-white" size={16} />
                </div>
                <div>
                  <p className="text-white font-semibold">Wallet Connected</p>
                  <p className="text-gray-400 text-sm">
                    {account.slice(0, 6)}...{account.slice(-4)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <BalanceDisplay variant="compact" />
                <button
                  onClick={handleDisconnect}
                  className="p-2.5 bg-[#ff343f] hover:bg-[#e6303a] rounded-lg transition-colors duration-200"
                  title="Disconnect wallet"
                  aria-label="Disconnect wallet"
                >
                  <IoExit className="text-white" size={16} />
                </button>
              </div>
            </motion.div>

            <BalanceDisplay variant="detailed" />
            <WalletDetails
              isOpen={showDetails}
              onToggle={handleDetailsToggle}
            />
          </motion.div>

          <AnimatePresence>
            {showTransactionModal && transactionData && (
              <TransactionConfirmation
                isOpen={showTransactionModal}
                isLoading={isTransactionLoading}
                transactionData={transactionData}
                onClose={onTransactionModalClose || (() => {})}
                onConfirm={handleTransactionConfirm}
              />
            )}
          </AnimatePresence>
        </>
      );
    }

    return <WalletConnectionInterface />;
  }
);

ConnectWallet.displayName = "ConnectWallet";
