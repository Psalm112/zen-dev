// src/components/trade/status/PendingPaymentStatus.tsx
import { FC, useState, useEffect, useCallback, useMemo } from "react";
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
import { useOrderData } from "../../../utils/hooks/useOrder";
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

interface TimeRemaining {
  minutes: number;
  seconds: number;
}

const PendingPaymentStatus: FC<PendingPaymentStatusProps> = ({
  tradeDetails,
  orderDetails,
  transactionInfo,
  onReleaseNow,
  navigatePath,
  orderId,
  showTimer = false,
  onUpdateOrder,
}) => {
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();
  const { wallet, connectWallet } = useWeb3();
  const { usdtBalance, refetch: refetchBalance } = useWalletBalance();
  const { changeOrderStatus } = useOrderData();

  // State management
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>({
    minutes: 9,
    seconds: 59,
  });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [quantity, setQuantity] = useState<number>(orderDetails?.quantity || 1);
  const [selectedLogisticsProvider, setSelectedLogisticsProvider] =
    useState<any>(null);

  // Memoized calculations
  const hasChanges = useMemo(() => {
    if (!orderDetails) return false;

    const hasQuantityChanged = quantity !== orderDetails.quantity;
    const hasLogisticsChanged =
      selectedLogisticsProvider?.walletAddress !==
      orderDetails.logisticsProviderWalletAddress;

    return hasQuantityChanged || hasLogisticsChanged;
  }, [quantity, selectedLogisticsProvider, orderDetails]);

  const totalAmount = useMemo(() => {
    return (orderDetails?.product?.price || 0) * quantity;
  }, [orderDetails?.product?.price, quantity]);

  const requiredAmount = useMemo(() => {
    return totalAmount * 1.02; // 2% buffer for gas
  }, [totalAmount]);

  const userBalance = useMemo(() => {
    return parseFloat(usdtBalance) || 0;
  }, [usdtBalance]);

  const hasSufficientBalance = useMemo(() => {
    return userBalance >= requiredAmount;
  }, [userBalance, requiredAmount]);

  const escrowAddress = useMemo(() => {
    return ESCROW_ADDRESSES[44787]; // Consider making this dynamic based on network
  }, []);

  // Button text memoization
  const payButtonText = useMemo(() => {
    return wallet.isConnected
      ? `Pay ${totalAmount} USDT`
      : "Connect Wallet to Pay";
  }, [wallet.isConnected, totalAmount]);

  // Initialize quantity from orderDetails
  useEffect(() => {
    if (orderDetails?.quantity) {
      setQuantity(orderDetails.quantity);
    }
  }, [orderDetails?.quantity]);

  // Timer effect
  useEffect(() => {
    if (!showTimer) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        }
        if (prev.minutes > 0) {
          return { minutes: prev.minutes - 1, seconds: 59 };
        }
        clearInterval(timer);
        return { minutes: 0, seconds: 0 };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showTimer]);

  // Handlers
  const handlePayNow = useCallback(async () => {
    if (!wallet.isConnected) {
      try {
        await connectWallet();
        await refetchBalance();
      } catch (error) {
        showSnackbar("Failed to connect wallet", "error");
        return;
      }
    }

    if (!hasSufficientBalance) {
      showSnackbar("Insufficient USDT balance for this transaction", "error");
      return;
    }

    setIsPaymentModalOpen(true);
  }, [
    wallet.isConnected,
    connectWallet,
    refetchBalance,
    hasSufficientBalance,
    showSnackbar,
  ]);

  const handlePaymentSuccess = useCallback(
    async (transaction: any) => {
      setIsPaymentModalOpen(false);

      try {
        // Update order status to accepted after successful payment
        if (orderId) {
          await changeOrderStatus(orderId, "accepted", false);
        }

        showSnackbar("Payment completed successfully!", "success");

        if (navigatePath) {
          navigate(navigatePath, { replace: true });
        } else if (onReleaseNow) {
          onReleaseNow();
        }
      } catch (error) {
        console.error("Error updating order status:", error);
        // Still show success for payment, but log the status update error
        showSnackbar("Payment completed successfully!", "success");

        if (navigatePath) {
          navigate(navigatePath, { replace: true });
        } else if (onReleaseNow) {
          onReleaseNow();
        }
      }
    },
    [
      navigate,
      navigatePath,
      onReleaseNow,
      showSnackbar,
      orderId,
      changeOrderStatus,
    ]
  );

  const handleUpdateOrder = useCallback(async () => {
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
    } catch (error: any) {
      toast.error(error.message || "Failed to update order. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [orderId, onUpdateOrder, quantity, selectedLogisticsProvider]);

  const handleEditModalClose = useCallback(() => {
    setIsEditModalOpen(false);
  }, []);

  const handlePaymentModalClose = useCallback(() => {
    setIsPaymentModalOpen(false);
  }, []);

  const handleEditModalOpen = useCallback(() => {
    setIsEditModalOpen(true);
  }, []);

  const handleQuantityChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setQuantity(Number(e.target.value));
    },
    []
  );

  const handleLogisticsSelect = useCallback((provider: any) => {
    setSelectedLogisticsProvider(provider);
  }, []);

  // Memoized components
  const editButton = useMemo(
    () => (
      <Button
        title={
          <div className="flex items-center gap-2">
            <FiEdit2 className="w-4 h-4" />
            Edit Order
          </div>
        }
        className="bg-transparent hover:bg-gray-700 text-white text-sm px-6 py-3 border border-gray-600 rounded transition-colors duration-200"
        onClick={handleEditModalOpen}
      />
    ),
    [handleEditModalOpen]
  );

  const payButton = useMemo(
    () => (
      <Button
        title={payButtonText}
        className="bg-Red hover:bg-[#e02d37] text-white text-sm px-6 py-3 rounded transition-colors duration-200"
        onClick={handlePayNow}
      />
    ),
    [payButtonText, handlePayNow]
  );

  const statusAlert = useMemo(
    () => (
      <StatusAlert
        icon={<BsShieldExclamation size={20} className="text-yellow-600" />}
        message="Please verify all order details before proceeding with payment."
        type="warning"
      />
    ),
    []
  );

  const actionButtons = useMemo(
    () => (
      <div className="w-full flex items-center justify-center flex-wrap gap-4">
        {editButton}
        {payButton}
      </div>
    ),
    [editButton, payButton]
  );

  // Memoized order details for PaymentModal
  const paymentOrderDetails = useMemo(() => {
    if (!orderDetails) return null;

    return {
      id: orderDetails._id || orderId || "",
      amount: totalAmount.toString(),
      tradeId: orderDetails.product.tradeId,
      quantity: quantity.toString(),
      logisticsProvider: orderDetails.logisticsProviderWalletAddress,
      items: [
        {
          name: orderDetails.product?.name || "Product",
          quantity: quantity,
          price: (orderDetails.product?.price || 0).toString(),
        },
      ],
      escrowAddress,
    };
  }, [orderDetails, orderId, totalAmount, quantity, escrowAddress]);

  return (
    <>
      <BaseStatus
        statusTitle="Order Summary"
        statusDescription="Review your order details before payment. You can modify quantity and logistics provider if needed."
        statusAlert={statusAlert}
        orderDetails={orderDetails}
        tradeDetails={tradeDetails}
        transactionInfo={transactionInfo}
        showTimer={showTimer}
        timeRemaining={timeRemaining}
        actionButtons={actionButtons}
      />

      {/* Edit Order Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={handleEditModalClose}
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
              onChange={handleQuantityChange}
              className="w-full px-3 py-2 bg-neutral-800 text-white border border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors duration-200"
              aria-describedby="quantity-help"
            />
            <p id="quantity-help" className="text-xs text-gray-400 mt-1">
              Enter the desired quantity for this order
            </p>
          </div>

          <div>
            <LogisticsSelector
              logisticsCost={orderDetails?.product.logisticsCost ?? []}
              logisticsProviders={
                orderDetails?.product.logisticsProviders ?? []
              }
              onSelect={handleLogisticsSelect}
              selectedProviderWalletAddress={
                orderDetails?.logisticsProviderWalletAddress
              }
            />
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button
              title="Cancel"
              className="bg-transparent hover:bg-gray-700 text-white text-sm px-4 py-2 border border-gray-600 rounded transition-colors duration-200"
              onClick={handleEditModalClose}
            />
            <Button
              title={loading ? "Updating..." : "Save Changes"}
              className="bg-Red hover:bg-[#e02d37] text-white text-sm px-4 py-2 rounded transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleUpdateOrder}
              disabled={loading || !hasChanges}
              aria-describedby={!hasChanges ? "no-changes-help" : undefined}
            />
            {!hasChanges && (
              <p id="no-changes-help" className="text-xs text-gray-400 sr-only">
                No changes detected to save
              </p>
            )}
          </div>
        </div>
      </Modal>

      {/* Payment Modal */}
      {paymentOrderDetails && (
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={handlePaymentModalClose}
          orderDetails={paymentOrderDetails}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </>
  );
};

export default PendingPaymentStatus;
