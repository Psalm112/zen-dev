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

// Extend OrderDetails to include logistics provider
interface ExtendedOrderDetails extends OrderDetails {
  logisticsProviderWalletAddress?: string;
}

interface PendingPaymentStatusProps {
  tradeDetails?: TradeDetails;
  orderDetails?: ExtendedOrderDetails;
  transactionInfo?: TradeTransactionInfo;
  onContactSeller?: () => void;
  onOrderDispute?: (reason: string) => Promise<void>;
  onReleaseNow?: () => void;
  navigatePath?: string;
  orderId?: string;
  showTimer?: boolean;
  onUpdateOrder?: (orderId: string, updates: OrderUpdateData) => Promise<void>;
}

interface OrderUpdateData {
  quantity?: number;
  logisticsProviderWalletAddress?: string;
  type?: string;
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
  // const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
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

  // New state for order updates
  const [orderUpdates, setOrderUpdates] = useState<OrderUpdateData>({});
  const [hasChanges, setHasChanges] = useState(false);

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

  const handleUpdateChange = (field: keyof OrderUpdateData, value: any) => {
    const updates = { ...orderUpdates, [field]: value };
    setOrderUpdates(updates);

    // Check if any values are different from original order
    const hasUpdates = Object.keys(updates).some((key) => {
      const typedKey = key as keyof OrderUpdateData;
      return updates[typedKey] !== (orderDetails as any)?.[typedKey];
    });

    setHasChanges(hasUpdates);
  };

  const handleUpdateOrder = async () => {
    if (!orderId || !onUpdateOrder) return;

    setLoading(true);
    try {
      await onUpdateOrder(orderId, orderUpdates);
      toast.success("Order details updated successfully!");
      setHasChanges(false);
    } catch (error) {
      toast.error("Failed to update order details");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const processRelease = async () => {
    setIsProcessing(true);

    try {
      if (navigatePath) {
        navigate(navigatePath, { replace: true });
      } else if (onReleaseNow) {
        onReleaseNow();
      }

      toast.success("Funds successfully sent to escrow!");
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

  // const handleDisputeSubmit = async () => {
  //   setLoading(true);
  //   try {
  //     if (onOrderDispute) {
  //       await onOrderDispute(dispute);
  //     }
  //   } catch (error) {
  //     console.log(error);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const renderOrderSummary = () => (
    <div className="w-full bg-neutral-800 p-4 rounded-lg mb-6">
      <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span>Product:</span>
          <span>{orderDetails?.product?.name}</span>
        </div>
        <div className="flex justify-between items-center">
          <span>Price:</span>
          <span>${orderDetails?.product?.price}</span>
        </div>
        <div className="flex justify-between items-center">
          <span>Quantity:</span>
          <input
            type="number"
            min="1"
            value={orderUpdates.quantity || orderDetails?.quantity || 1}
            onChange={(e) =>
              handleUpdateChange("quantity", parseInt(e.target.value))
            }
            className="bg-neutral-700 px-2 py-1 rounded"
          />
        </div>
        <div className="flex justify-between items-center">
          <span>Logistics Provider:</span>
          <input
            type="text"
            value={
              orderUpdates.logisticsProviderWalletAddress ||
              orderDetails?.logisticsProviderWalletAddress ||
              ""
            }
            onChange={(e) =>
              handleUpdateChange(
                "logisticsProviderWalletAddress",
                e.target.value
              )
            }
            className="bg-neutral-700 px-2 py-1 rounded"
            placeholder="Provider wallet address"
          />
        </div>
      </div>
    </div>
  );

  const renderActionButtons = () => (
    <div className="w-full flex items-center justify-center flex-wrap gap-4">
      {hasChanges && (
        <Button
          title={loading ? "Updating..." : "Update Order"}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-6 py-3 rounded transition-colors"
          onClick={handleUpdateOrder}
          disabled={loading || isProcessing}
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
  );

  return (
    <>
      <BaseStatus
        statusTitle="Pending Payment"
        statusDescription="Please wait for the buyer to make payment. You'll be notified once payment is confirmed."
        statusAlert={
          <StatusAlert
            icon={<BsShieldExclamation size={20} className="text-yellow-600" />}
            message="To ensure the safety of your funds, please verify the real name of the payer: Femi Cole"
            type="warning"
          />
        }
        orderDetails={orderDetails}
        tradeDetails={tradeDetails}
        transactionInfo={transactionInfo}
        contactLabel="Contact Buyer"
        onContact={onContactSeller}
        showTimer={showTimer}
        timeRemaining={timeRemaining}
        actionButtons={
          <>
            {renderOrderSummary()}
            {renderActionButtons()}
          </>
        }
      />

      {/* <Modal
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
      </Modal> */}

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
