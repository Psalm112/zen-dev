import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HiCreditCard,
  HiShieldCheck,
  HiExclamationTriangle,
  HiCheckCircle,
  HiXCircle,
  HiCurrencyDollar,
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
    parseFloat(usdtBalance.replace(/,/g, "")) < parseFloat(orderDetails.amount);
  const hasInsufficientGas = parseFloat(wallet.balance || "0") < 0.01;

  const handlePayment = async () => {
    if (!wallet.isConnected) {
      showSnackbar("Please connect your wallet first", "error");
      return;
    }

    if (!isCorrectNetwork) {
      try {
        await switchToCorrectNetwork();
      } catch (error) {
        return;
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
              <h3 className="text-lg font-semibold text-white">
                Order Summary
              </h3>
              <div className="bg-Dark/50 border border-Red/20 rounded-lg p-4 space-y-3">
                {orderDetails.items.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-gray-300">
                      {item.name} × {item.quantity}
                    </span>
                    <span className="text-white font-medium">
                      {formatCurrency(item.price)} USDT
                    </span>
                  </div>
                ))}
                <div className="border-t border-Red/20 pt-3">
                  <div className="flex justify-between text-lg font-bold">
                    <span className="text-white">Total</span>
                    <span className="text-Red">
                      {formatCurrency(orderDetails.amount)} USDT
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Method & Balance */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-white">
                Payment Method
              </h3>
              <div className="bg-Dark/50 border border-Red/20 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-Red/20 rounded-full flex items-center justify-center">
                      <HiCurrencyDollar className="w-5 h-5 text-Red" />
                    </div>
                    <div>
                      <p className="text-white font-medium">
                        USDT (Celo Network)
                      </p>
                      <p className="text-sm text-gray-400">Celo testnet</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-medium">
                      {wallet.usdtBalance?.usdt}
                    </p>
                    <p className="text-xs text-gray-400">Available</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Security Notice */}
            <div className="bg-Red/10 border border-Red/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <HiShieldCheck className="w-5 h-5 text-Red flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-Red font-medium">Secure Escrow Payment</p>
                  <p className="text-sm text-Red/80 mt-1">
                    Your payment is held securely until you confirm the delivery
                    of your order.
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
                  <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <HiExclamationTriangle className="w-4 h-4 text-red-400" />
                      <span className="text-red-400 text-sm">
                        Insufficient USDT balance. Need $
                        {formatCurrency(orderDetails.amount)}
                      </span>
                    </div>
                  </div>
                )}

                {hasInsufficientGas && (
                  <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <HiExclamationTriangle className="w-4 h-4 text-yellow-400" />
                      <span className="text-yellow-400 text-sm">
                        Low CELO balance for transaction fees
                      </span>
                    </div>
                  </div>
                )}

                {!isCorrectNetwork && (
                  <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <HiExclamationTriangle className="w-4 h-4 text-yellow-400" />
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
              title={`Pay ${formatCurrency(orderDetails.amount)} USDT`}
              onClick={handlePayment}
              disabled={
                hasInsufficientBalance || hasInsufficientGas || isProcessing
              }
              className="flex items-center justify-center w-full bg-Red hover:bg-Red/80 text-white text-lg py-4 font-semibold transition-all duration-200"
            />
          </div>
        );

      case "processing":
        return (
          <div className="text-center space-y-6 py-12">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-Red/30 border-t-Red rounded-full animate-spin mx-auto" />
              <div className="absolute inset-0 w-12 h-12 border-2 border-Red/20 border-t-transparent rounded-full animate-spin mx-auto mt-2" />
            </div>
            <div className="space-y-3">
              <h3 className="text-xl font-bold text-white">
                Processing Payment
              </h3>
              <p className="text-gray-300 max-w-sm mx-auto">
                Please confirm the transaction in your wallet and wait for
                blockchain confirmation.
              </p>
              <div className="flex items-center justify-center gap-1 text-sm text-Red">
                <div className="w-2 h-2 bg-Red rounded-full animate-pulse" />
                <div className="w-2 h-2 bg-Red rounded-full animate-pulse delay-100" />
                <div className="w-2 h-2 bg-Red rounded-full animate-pulse delay-200" />
              </div>
            </div>
          </div>
        );

      case "success":
        return (
          <div className="text-center space-y-6 py-8">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                type: "spring",
                duration: 0.6,
                delay: 0.1,
              }}
            >
              <div className="w-16 h-16 bg-Red/20 rounded-full flex items-center justify-center mx-auto">
                <HiCheckCircle className="w-10 h-10 text-Red" />
              </div>
            </motion.div>
            <div className="space-y-3">
              <h3 className="text-xl font-bold text-white">
                Payment Successful!
              </h3>
              <p className="text-gray-300 max-w-md mx-auto">
                Your payment has been sent to escrow. You'll receive your order
                soon.
              </p>
              {transaction && (
                <div className="bg-Dark/50 border border-Red/20 rounded-lg p-4 mt-4">
                  <p className="text-sm text-gray-400 mb-1">
                    Transaction Hash:
                  </p>
                  <p className="font-mono text-xs text-Red break-all">
                    {transaction.hash}
                  </p>
                </div>
              )}
            </div>
            <Button
              title="Continue Shopping"
              onClick={onClose}
              className="w-full bg-Red hover:bg-Red/80 text-white"
            />
          </div>
        );

      case "error":
        return (
          <div className="text-center space-y-6 py-8">
            <div className="w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center mx-auto">
              <HiXCircle className="w-10 h-10 text-red-400" />
            </div>
            <div className="space-y-3">
              <h3 className="text-xl font-bold text-white">Payment Failed</h3>
              <p className="text-gray-300 max-w-md mx-auto">{error}</p>
            </div>
            <div className="space-y-3">
              <Button
                title="Try Again"
                onClick={() => setStep("review")}
                className="w-full bg-Red hover:bg-Red/80 text-white"
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
          transition={{ duration: 0.2 }}
        >
          {renderStepContent()}
        </motion.div>
      </AnimatePresence>
    </Modal>
  );
};

export default PaymentModal;
