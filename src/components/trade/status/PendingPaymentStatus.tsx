import { FC, useState, useEffect } from "react";
import {
  OrderDetails,
  TradeDetails,
  TradeTransactionInfo,
} from "../../../utils/types";
import BaseStatus from "./BaseStatus";
import StatusAlert from "./StatusAlert";
import Button from "../../common/Button";
import { BsShieldExclamation } from "react-icons/bs";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Modal from "../../common/Modal";
import ConnectWallet from "../ConnectWallet";
import { motion } from "framer-motion";
import { useWallet } from "../../../context/WalletContext";
import { FiEdit2 } from "react-icons/fi";
import LogisticsSelector from "../../product/singleProduct/LogisticsSelector";
import { useContract } from "../../../utils/hooks/useContract";
import TransactionConfirmation from "../TransactionConfirmation";
import { useSnackbar } from "../../../context/SnackbarContext";

const ESCROW_CONTRACT_ADDRESS =
  import.meta.env.VITE_ESCROW_CONTRACT_ADDRESS || "";

interface PendingPaymentStatusProps {
  tradeDetails?: TradeDetails;
  orderDetails?: OrderDetails;
  transactionInfo?: TradeTransactionInfo;
  onContactSeller?: () => void;
  onOrderDispute?: (reason: string) => Promise<void>;
  onReleaseNow?: () => void;
  navigatePath?: string;
  orderId?: string;
  showTimer?: boolean;
  onUpdateOrder?: (orderId: string, updates: any) => Promise<void>;
}

const PendingPaymentStatus: FC<PendingPaymentStatusProps> = ({
  tradeDetails,
  orderDetails,
  transactionInfo,
  // onContactSeller,
  // onOrderDispute,
  onReleaseNow,
  navigatePath,
  orderId,
  showTimer,
  onUpdateOrder,
}) => {
  const navigate = useNavigate();
  const [timeRemaining, setTimeRemaining] = useState({
    minutes: 9,
    seconds: 59,
  });
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const { showSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingTransactionData, setPendingTransactionData] = useState<{
    contractAddress: string;
    amount: string;
    isUSDT: boolean;
    usdtAddress?: string;
    tradeId: string;
    quantity: number;
    logisticsProviderAddress: string;
  } | null>(null);
  const { isConnected, balanceInUSDT, balanceInCELO } = useWallet();
  const { buyTrade } = useContract();

  // Order update state
  const [quantity, setQuantity] = useState<number>(orderDetails?.quantity || 1);
  const [hasChanges, setHasChanges] = useState(false);
  const [selectedLogisticsProvider, setSelectedLogisticsProvider] =
    useState<any>(null);

  useEffect(() => {
    if (orderDetails) {
      setQuantity(orderDetails.quantity || 1);
    }
  }, [orderDetails]);

  // Check if there are changes to order details
  useEffect(() => {
    if (orderDetails) {
      const hasQuantityChanged = quantity !== orderDetails.quantity;
      const hasLogisticsChanged =
        selectedLogisticsProvider?.walletAddress !==
        orderDetails.logisticsProviderWalletAddress;

      setHasChanges(hasQuantityChanged || hasLogisticsChanged);
    }
  }, [quantity, selectedLogisticsProvider, orderDetails]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { minutes: prev.minutes - 1, seconds: 59 };
        clearInterval(timer);
        return { minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Check if user has sufficient balance
  const checkSufficientBalance = () => {
    if (!orderDetails?.product?.price) return false;

    const totalAmount = orderDetails.product.price * quantity;
    console.log(
      totalAmount,
      orderDetails.product.price,
      quantity,
      "totalAmount"
    );
    const requiredAmount = totalAmount * 1.02;

    const cleanBalance = (balanceInUSDT || "0")
      .replace(/[^\d.,]/g, "")
      .replace(/,/g, "");

    const userBalance = parseFloat(cleanBalance) || 0;

    console.log(userBalance, requiredAmount, balanceInUSDT, "balance check");
    return userBalance >= requiredAmount;
  };

  const handleShowConfirmationModal = () => {
    if (!isConnected) {
      setIsWalletModalOpen(true);
      return;
    }

    setIsConfirmationModalOpen(true);
  };

  const processPayment = async () => {
    setIsProcessing(true);

    try {
      if (
        !orderDetails?.product?.tradeId ||
        !(
          selectedLogisticsProvider?.walletAddress ||
          orderDetails?.logisticsProviderWalletAddress
        )
      ) {
        ("Missing trade information. Please refresh and try again.");
        setIsProcessing(false);
        return;
      }

      // Check for sufficient balance before proceeding
      if (!checkSufficientBalance()) {
        showSnackbar("Insufficient balance for this transaction", "error");
        setIsProcessing(false);
        return;
      }

      // Create transaction data for confirmation modal
      setPendingTransactionData({
        contractAddress: ESCROW_CONTRACT_ADDRESS,
        amount: (orderDetails.product.price * quantity).toString(),
        // isUSDT: (orderDetails.product.currency || "CELO") !== "CELO",
        isUSDT: true,
        tradeId: orderDetails.product.tradeId,
        quantity: quantity,
        logisticsProviderAddress:
          selectedLogisticsProvider?.walletAddress ||
          orderDetails.logisticsProviderWalletAddress,
      });

      setIsConfirmationModalOpen(false);
      setIsWalletModalOpen(true);
    } catch (error: any) {
      console.error("Error preparing payment:", error);
      toast.error(error.message || "Failed to prepare transaction");
      setIsProcessing(false);
    }
  };

  const handleWalletConnected = (success: boolean) => {
    setIsWalletModalOpen(false);
    setIsProcessing(false);

    if (success) {
      showSnackbar("Payment completed successfully!", "success");

      // Navigate to the specified path or call the onReleaseNow callback
      if (navigatePath) {
        navigate(navigatePath, { replace: true });
      } else if (onReleaseNow) {
        onReleaseNow();
      }
    }
  };

  const handleUpdateOrder = async () => {
    if (!orderId || !onUpdateOrder) return;

    setLoading(true);
    try {
      await onUpdateOrder(orderId, {
        quantity,
        logisticsProviderWalletAddress:
          selectedLogisticsProvider?.walletAddress,
      });

      toast.success("Order updated successfully!");
      setIsEditModalOpen(false);
      setHasChanges(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to update order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Get the currency with fallback to CELO
  // const getProductCurrency = () => orderDetails?.product?.currency || "CELO";

  return (
    <>
      <BaseStatus
        statusTitle="Order Summary"
        statusDescription="Review your order details before payment. You can modify quantity and logistics provider if needed."
        statusAlert={
          <StatusAlert
            icon={<BsShieldExclamation size={20} className="text-yellow-600" />}
            message="Please verify all order details before proceeding with payment."
            type="warning"
          />
        }
        orderDetails={orderDetails}
        tradeDetails={tradeDetails}
        transactionInfo={transactionInfo}
        showTimer={showTimer}
        timeRemaining={timeRemaining}
        actionButtons={
          <div className="w-full flex items-center justify-center flex-wrap gap-4">
            <Button
              title={
                <div className="flex items-center gap-2">
                  <FiEdit2 className="w-4 h-4" />
                  Edit Order
                </div>
              }
              className="bg-transparent hover:bg-gray-700 text-white text-sm px-6 py-3 border border-gray-600 rounded transition-colors"
              onClick={() => setIsEditModalOpen(true)}
              disabled={isProcessing}
            />

            <Button
              title={
                isProcessing ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Processing...
                  </div>
                ) : (
                  "Pay Now"
                )
              }
              className={`bg-Red hover:bg-[#e02d37] text-white text-sm px-6 py-3 rounded transition-colors ${
                isProcessing ? "opacity-70 cursor-not-allowed" : ""
              }`}
              onClick={handleShowConfirmationModal}
              disabled={isProcessing}
            />
          </div>
        }
      />

      {/* Confirmation Modal */}
      <Modal
        isOpen={isConfirmationModalOpen}
        onClose={() => setIsConfirmationModalOpen(false)}
        title="Confirm Payment"
        maxWidth="md:max-w-lg"
      >
        <div className="p-4">
          <div className="mb-6 text-center">
            <div className="bg-amber-500/10 text-amber-400 p-4 rounded-lg border border-amber-500/20 mb-4">
              <p className="text-sm">
                By proceeding, funds will be held in escrow until the order is
                completed. The seller will not receive the funds until delivery
                is confirmed.
              </p>
            </div>

            <h3 className="text-lg font-medium text-white mb-2">
              Payment Summary
            </h3>

            <div className="bg-[#2A2D35] p-4 rounded-lg mb-3 text-left">
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">Item Price:</span>
                <span className="text-white">
                  {orderDetails?.product?.price} USDT
                </span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">Quantity:</span>
                <span className="text-white">{quantity}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span className="text-gray-300">Total Amount:</span>
                <span className="text-white">
                  {(orderDetails?.product?.price || 0) * quantity} USDT
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              title="Cancel"
              className="bg-transparent hover:bg-gray-700 text-white text-sm px-6 py-3 border border-gray-600 rounded transition-colors"
              onClick={() => setIsConfirmationModalOpen(false)}
            />
            <Button
              title={
                isProcessing ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Processing...
                  </div>
                ) : (
                  "Proceed to Payment"
                )
              }
              className="bg-Red hover:bg-[#e02d37] text-white text-sm px-6 py-3 rounded transition-colors"
              onClick={processPayment}
              disabled={isProcessing}
            />
          </div>
        </div>
      </Modal>

      {/* Edit Order Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Update Order Details"
        maxWidth="md:max-w-lg"
      >
        <div className="space-y-4 mt-4">
          <div>
            <label htmlFor="quantity" className="block text-gray-300 mb-2">
              Quantity
            </label>
            <input
              type="number"
              id="quantity"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-full px-3 py-2 bg-neutral-800 text-white border border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div>
            <LogisticsSelector
              onSelect={(provider) => setSelectedLogisticsProvider(provider)}
              selectedProviderWalletAddress={
                orderDetails?.logisticsProviderWalletAddress
              }
            />
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button
              title="Cancel"
              className="bg-transparent hover:bg-gray-700 text-white text-sm px-4 py-2 border border-gray-600 rounded transition-colors"
              onClick={() => setIsEditModalOpen(false)}
            />
            <Button
              title={loading ? "Updating..." : "Save Changes"}
              className="bg-Red hover:bg-[#e02d37] text-white text-sm px-4 py-2 rounded transition-colors"
              onClick={handleUpdateOrder}
              disabled={loading || !hasChanges}
            />
          </div>
        </div>
      </Modal>

      {/* Wallet Connection Modal */}
      <Modal
        isOpen={isWalletModalOpen}
        onClose={() => {
          setIsWalletModalOpen(false);
          setIsProcessing(false);
        }}
        title="Transaction Confirmation"
        maxWidth="md:max-w-lg"
      >
        {pendingTransactionData ? (
          <TransactionConfirmation
            contractAddress={pendingTransactionData.contractAddress}
            amount={pendingTransactionData.amount}
            isUSDT={pendingTransactionData.isUSDT}
            usdtAddress={pendingTransactionData.usdtAddress}
            tradeId={pendingTransactionData.tradeId}
            quantity={pendingTransactionData.quantity}
            logisticsProviderAddress={
              pendingTransactionData.logisticsProviderAddress
            }
            onComplete={handleWalletConnected}
          />
        ) : (
          <ConnectWallet
            showAlternatives={true}
            onTransactionComplete={handleWalletConnected}
          />
        )}
      </Modal>
    </>
  );
};

export default PendingPaymentStatus;
