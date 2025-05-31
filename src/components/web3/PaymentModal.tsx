import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HiCreditCard,
  HiShieldCheck,
  HiExclamationTriangle,
  HiCheckCircle,
  HiXCircle,
} from "react-icons/hi2";
import Modal from "../common/Modal";
import Button from "../common/Button";
import { useWeb3 } from "../../context/Web3Context";
import { PaymentTransaction } from "../../utils/types/web3.types";
import { formatCurrency } from "../../utils/web3.utils";
import { useSnackbar } from "../../context/SnackbarContext";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderDetails: {
    id: string;
    amount: string;
    items: Array<{ name: string; quantity: number; price: string }>;
    escrowAddress: string;
  };
  onPaymentSuccess: (transaction: PaymentTransaction) => void;
}

type PaymentStep = "review" | "processing" | "success" | "error";

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  orderDetails,
  onPaymentSuccess,
}) => {
  const { showSnackbar } = useSnackbar();
  const {
    wallet,
    sendPayment,
    getUSDTBalance,
    isCorrectNetwork,
    switchToCorrectNetwork,
  } = useWeb3();
  const [step, setStep] = useState<PaymentStep>("review");
  const [transaction, setTransaction] = useState<PaymentTransaction | null>(
    null
  );
  const [usdtBalance, setUsdtBalance] = useState<string>("0");
  const [error, setError] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (isOpen && wallet.isConnected) {
      loadBalance();
    }
  }, [isOpen, wallet.isConnected]);

  const loadBalance = async () => {
    try {
      const balance = await getUSDTBalance();
      setUsdtBalance(balance);
    } catch (error) {
      console.error("Failed to load balance:", error);
    }
  };

  const hasInsufficientBalance =
    parseFloat(usdtBalance) < parseFloat(orderDetails.amount);
  const hasInsufficientGas = parseFloat(wallet.balance || "0") < 0.01; // Minimum CELO for gas

  const handlePayment = async () => {
    if (!wallet.isConnected) {
      showSnackbar("Please connect your wallet first", "error");
      return;
    }

    if (!isCorrectNetwork) {
      try {
        await switchToCorrectNetwork();
      } catch (error) {
        return; // Error already handled
      }
    }

    if (hasInsufficientBalance) {
      setError("Insufficient USDT balance");
      setStep("error");
      return;
    }

    if (hasInsufficientGas) {
      setError(
        "Insufficient CELO for transaction fees. Please add some CELO to your wallet."
      );
      setStep("error");
      return;
    }

    try {
      setIsProcessing(true);
      setStep("processing");
      setError("");

      const paymentTransaction = await sendPayment({
        to: orderDetails.escrowAddress,
        amount: orderDetails.amount,
        orderId: orderDetails.id,
      });

      setTransaction(paymentTransaction);
      setStep("success");
      onPaymentSuccess(paymentTransaction);
    } catch (error: any) {
      console.error("Payment failed:", error);
      setError(error.message || "Payment failed. Please try again.");
      setStep("error");
    } finally {
      setIsProcessing(false);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case "review":
        return (
          <div className="space-y-6">
            {/* Order Summary */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-white">Order Summary</h3>
              <div className="bg-[#292B30] rounded-lg p-4 space-y-3">
                {orderDetails.items.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-gray-300">
                      {item.name} × {item.quantity}
                    </span>
                    <span className="text-white font-medium">
                      ${formatCurrency(item.price)}
                    </span>
                  </div>
                ))}
                <div className="border-t border-gray-700/50 pt-3">
                  <div className="flex justify-between text-lg font-bold">
                    <span className="text-white">Total</span>
                    <span className="text-green-400">
                      ${formatCurrency(orderDetails.amount)} USDT
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="space-y-3">
              <h3 className="text-lg font-medium text-white">Payment Method</h3>
              <div className="bg-[#292B30] rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <HiCreditCard className="w-6 h-6 text-blue-500" />
                  <div>
                    <p className="text-white font-medium">
                      USDT (Celo Network)
                    </p>
                    <p className="text-sm text-gray-400">
                      Balance: ${formatCurrency(usdtBalance)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Security Notice */}
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <HiShieldCheck className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-green-400 font-medium">
                    Secure Escrow Payment
                  </p>
                  <p className="text-sm text-green-300/80 mt-1">
                    Your payment is held securely until you confirm receipt of
                    your order.
                  </p>
                </div>
              </div>
            </div>

            {/* Warnings */}
            {(hasInsufficientBalance ||
              hasInsufficientGas ||
              !isCorrectNetwork) && (
              <div className="space-y-2">
                {hasInsufficientBalance && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <HiExclamationTriangle className="w-4 h-4 text-red-500" />
                      <span className="text-red-400 text-sm">
                        Insufficient USDT balance. Need $
                        {formatCurrency(orderDetails.amount)}
                      </span>
                    </div>
                  </div>
                )}

                {hasInsufficientGas && (
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <HiExclamationTriangle className="w-4 h-4 text-yellow-500" />
                      <span className="text-yellow-400 text-sm">
                        Low CELO balance for transaction fees
                      </span>
                    </div>
                  </div>
                )}

                {!isCorrectNetwork && (
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <HiExclamationTriangle className="w-4 h-4 text-yellow-500" />
                      <span className="text-yellow-400 text-sm">
                        Please switch to Celo network
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Payment Button */}
            <Button
              title={`Pay $${formatCurrency(orderDetails.amount)} USDT`}
              onClick={handlePayment}
              disabled={
                hasInsufficientBalance || hasInsufficientGas || isProcessing
              }
              className="w-full bg-green-600 hover:bg-green-700 text-white text-lg py-3"
            />
          </div>
        );

      case "processing":
        return (
          <div className="text-center space-y-6 py-8">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">
                Processing Payment
              </h3>
              <p className="text-gray-300">
                Please confirm the transaction in your wallet and wait for
                blockchain confirmation.
              </p>
              <p className="text-sm text-gray-400">
                This may take a few moments...
              </p>
            </div>
          </div>
        );

      case "success":
        return (
          <div className="text-center space-y-6 py-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", duration: 0.5 }}
            >
              <HiCheckCircle className="w-16 h-16 text-green-500 mx-auto" />
            </motion.div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">
                Payment Successful!
              </h3>
              <p className="text-gray-300">
                Your payment has been sent to escrow. You'll receive your order
                soon.
              </p>
              {transaction && (
                <div className="bg-[#292B30] rounded-lg p-4 mt-4">
                  <p className="text-sm text-gray-400">Transaction Hash:</p>
                  <p className="font-mono text-xs text-blue-400 break-all">
                    {transaction.hash}
                  </p>
                </div>
              )}
            </div>
            <Button
              title="Continue Shopping"
              onClick={onClose}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            />
          </div>
        );

      case "error":
        return (
          <div className="text-center space-y-6 py-8">
            <HiXCircle className="w-16 h-16 text-red-500 mx-auto" />
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">Payment Failed</h3>
              <p className="text-gray-300">{error}</p>
            </div>
            <div className="space-y-3">
              <Button
                title="Try Again"
                onClick={() => setStep("review")}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              />
              <Button
                title="Close"
                onClick={onClose}
                className="w-full bg-gray-700 hover:bg-gray-600 text-white"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={step === "review" ? "Complete Payment" : ""}
      maxWidth="md:max-w-lg"
      showCloseButton={step !== "processing"}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {renderStepContent()}
        </motion.div>
      </AnimatePresence>
    </Modal>
  );
};

export default PaymentModal;
