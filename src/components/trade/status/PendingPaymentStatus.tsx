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
  onContactSeller,
  onOrderDispute,
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
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [dispute, setDispute] = useState("");
  const [loading, setLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingTransactionData, setPendingTransactionData] = useState<{
    contractAddress: string;
    amount: string;
    isUSDT: boolean;
    usdtAddress: string;
  } | null>(null);
  const { isConnected } = useWallet();
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

  const processRelease = async () => {
    setIsProcessing(true);

    try {
      // Call buyTrade with the necessary parameters
      if (orderDetails?.product?.tradeId) {
        const success = await buyTrade({
          tradeId: orderDetails.product.tradeId,
          quantity: quantity,
          logisterProvider: selectedLogisticsProvider?.walletAddress || "",
        });

        if (success) {
          toast.success("Funds successfully sent to escrow!");

          if (navigatePath) {
            navigate(navigatePath, { replace: true });
          } else if (onReleaseNow) {
            onReleaseNow();
          }
        } else {
          toast.error("Transaction failed. Please try again.");
        }
      } else {
        toast.error("Missing trade information. Please refresh and try again.");
      }
    } catch (error: any) {
      console.error("Error during release process:", error);
      toast.error(error.message || "Transaction failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReleaseNow = async () => {
    if (!isConnected) {
      setIsWalletModalOpen(true);
      return;
    }

    await processRelease();
  };

  const handleWalletConnected = (success: boolean) => {
    setIsWalletModalOpen(false);
    if (success) {
      processRelease();
    }
  };

  const handleDisputeSubmit = async () => {
    setLoading(true);
    try {
      if (onOrderDispute) {
        await onOrderDispute(dispute);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
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
        // contactLabel="Contact Seller"
        // onContact={onContactSeller}
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

            {hasChanges && (
              <Button
                title="Update Order"
                className="bg-amber-600 hover:bg-amber-700 text-white text-sm px-6 py-3 rounded transition-colors"
                onClick={handleUpdateOrder}
                disabled={isProcessing || loading}
              />
            )}

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
              onClick={handleReleaseNow}
              disabled={isProcessing}
            />
          </div>
        }
      />

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

      <Modal
        isOpen={isDisputeModalOpen}
        onClose={() => setIsDisputeModalOpen(false)}
        title="Reason for Dispute"
        maxWidth="md:max-w-lg"
      >
        <form onSubmit={handleDisputeSubmit} className="space-y-4 mt-4">
          <div>
            <textarea
              id="dispue-reason"
              value={dispute}
              onChange={(e) => setDispute(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-800 text-white border border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              rows={4}
              placeholder="Share the reason for the dispute or issue"
            />
          </div>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              title="Submit Review"
              type="submit"
              className={`max-w-md mx-auto flex items-center justify-center p-3 ${
                loading ? "bg-Red/20" : "bg-Red"
              } hover:bg-red-600 text-white w-full`}
            />
          </motion.div>
        </form>
      </Modal>

      <Modal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
        title="Connect Wallet"
        maxWidth="md:max-w-lg"
      >
        <ConnectWallet
          showAlternatives={true}
          onTransactionComplete={handleWalletConnected}
          pendingTransaction={
            pendingTransactionData
              ? {
                  type: "escrow",
                  contractAddress: pendingTransactionData.contractAddress,
                  amount: pendingTransactionData.amount,
                }
              : null
          }
        />
      </Modal>
    </>
  );
};

export default PendingPaymentStatus;
