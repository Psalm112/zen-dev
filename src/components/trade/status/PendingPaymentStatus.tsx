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
import { FiEdit2 } from "react-icons/fi";
import LogisticsSelector from "../../product/singleProduct/LogisticsSelector";
import { useSnackbar } from "../../../context/SnackbarContext";
import { useWeb3 } from "../../../context/Web3Context";
import { useWalletBalance } from "../../../utils/hooks/useWalletBalance";
import { ESCROW_ADDRESSES } from "../../../utils/config/web3.config";
import PaymentModal from "../../web3/PaymentModal";

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
  onReleaseNow,
  navigatePath,
  orderId,
  showTimer,
  onUpdateOrder,
}) => {
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();
  const { wallet, connectWallet } = useWeb3();
  const { usdtBalance, refetch: refetchBalance } = useWalletBalance();

  const [timeRemaining, setTimeRemaining] = useState({
    minutes: 9,
    seconds: 59,
  });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

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
    if (!showTimer) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { minutes: prev.minutes - 1, seconds: 59 };
        clearInterval(timer);
        return { minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [showTimer]);

  // Check if user has sufficient balance
  const checkSufficientBalance = () => {
    if (!orderDetails?.product?.price) return false;

    const totalAmount = orderDetails.product.price * quantity;
    const requiredAmount = totalAmount * 1.02; // 2% buffer for gas

    const userBalance = parseFloat(usdtBalance) || 0;
    return userBalance >= requiredAmount;
  };

  const handlePayNow = async () => {
    if (!wallet.isConnected) {
      try {
        await connectWallet();
        await refetchBalance();
      } catch (error) {
        showSnackbar("Failed to connect wallet", "error");
        return;
      }
    }

    if (!checkSufficientBalance()) {
      showSnackbar("Insufficient USDT balance for this transaction", "error");
      return;
    }

    setIsPaymentModalOpen(true);
  };

  const handlePaymentSuccess = (transaction: any) => {
    setIsPaymentModalOpen(false);
    showSnackbar("Payment completed successfully!", "success");

    // Navigate to the specified path or call the onReleaseNow callback
    if (navigatePath) {
      navigate(navigatePath, { replace: true });
    } else if (onReleaseNow) {
      onReleaseNow();
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

  const getEscrowAddress = () => {
    // const chainId = process.env.NODE_ENV === "production" ? 42220 : 44787;
    // return ESCROW_ADDRESSES[chainId as keyof typeof ESCROW_ADDRESSES];
    return ESCROW_ADDRESSES[44787];
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
            />

            <Button
              title={
                wallet.isConnected
                  ? `Pay ${(orderDetails?.product?.price || 0) * quantity} USDT`
                  : "Connect Wallet to Pay"
              }
              className="bg-Red hover:bg-[#e02d37] text-white text-sm px-6 py-3 rounded transition-colors"
              onClick={handlePayNow}
            />
          </div>
        }
      />

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
              logisticsCost={[]}
              logisticsProviders={[]}
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

      {/* Payment Modal */}
      {orderDetails && (
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          orderDetails={{
            id: orderDetails._id || orderId || "",
            amount: ((orderDetails.product?.price || 0) * quantity).toString(),
            items: [
              {
                name: orderDetails.product?.name || "Product",
                quantity: quantity,
                price: (orderDetails.product?.price || 0).toString(),
              },
            ],
            escrowAddress: getEscrowAddress(),
          }}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </>
  );
};

export default PendingPaymentStatus;
