import { FC, useState, useEffect, useCallback, useMemo, useRef } from "react";
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

interface UpdateOrderPayload {
  quantity: number;
  logisticsProviderWalletAddress?: string;
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

  // Refs for cleanup and performance
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  // State management with better typing
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>({
    minutes: 9,
    seconds: 59,
  });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [quantity, setQuantity] = useState<number>(
    () => orderDetails?.quantity || 1
  );
  const [selectedLogisticsProvider, setSelectedLogisticsProvider] =
    useState<any>(null);

  // Memoized order validation
  const orderValidation = useMemo(() => {
    if (!orderDetails) {
      return {
        isValid: false,
        error: "Order details not available",
      };
    }

    if (!orderDetails.product) {
      return {
        isValid: false,
        error: "Product information missing",
      };
    }

    if (quantity <= 0) {
      return {
        isValid: false,
        error: "Invalid quantity",
      };
    }

    return {
      isValid: true,
      error: null,
    };
  }, [orderDetails, quantity]);

  // Memoized calculations with error handling
  const calculations = useMemo(() => {
    if (!orderValidation.isValid || !orderDetails?.product?.price) {
      return {
        totalAmount: 0,
        requiredAmount: 0,
        hasChanges: false,
        userBalance: 0,
        hasSufficientBalance: false,
      };
    }

    const totalAmount = orderDetails.product.price * quantity;
    const requiredAmount = Math.ceil(totalAmount * 1.02 * 100) / 100; // Round up to 2 decimals

    const hasQuantityChanged = quantity !== orderDetails.quantity;
    const hasLogisticsChanged =
      selectedLogisticsProvider?.walletAddress !==
      orderDetails.logisticsProviderWalletAddress;
    const hasChanges = hasQuantityChanged || hasLogisticsChanged;

    const userBalance =
      parseFloat(String(usdtBalance || 0).replace(/,/g, "")) || 0;
    const hasSufficientBalance = userBalance >= requiredAmount;

    return {
      totalAmount,
      requiredAmount,
      hasChanges,
      userBalance,
      hasSufficientBalance,
    };
  }, [
    orderValidation.isValid,
    orderDetails?.product?.price,
    orderDetails?.quantity,
    orderDetails?.logisticsProviderWalletAddress,
    quantity,
    selectedLogisticsProvider?.walletAddress,
    usdtBalance,
  ]);

  // Memoized escrow address with error handling
  const escrowAddress = useMemo(() => {
    try {
      return ESCROW_ADDRESSES[44787] || null;
    } catch (error) {
      console.error("Failed to get escrow address:", error);
      return null;
    }
  }, []);

  // Memoized button text with loading state
  const payButtonText = useMemo(() => {
    if (loading) return "Processing...";
    if (!wallet.isConnected) return "Connect Wallet to Pay";
    if (!calculations.hasSufficientBalance) return "Insufficient Balance";
    return `Pay ${calculations.totalAmount.toFixed(2)} USDT`;
  }, [
    wallet.isConnected,
    calculations.totalAmount,
    calculations.hasSufficientBalance,
    loading,
  ]);

  // Initialize quantity with effect cleanup
  useEffect(() => {
    if (orderDetails?.quantity && orderDetails.quantity !== quantity) {
      setQuantity(orderDetails.quantity);
    }
  }, [orderDetails?.quantity]); // Remove quantity from deps to avoid loops

  // Enhanced timer with cleanup and performance optimization
  useEffect(() => {
    if (!showTimer) return;

    const startTimer = () => {
      timerRef.current = setInterval(() => {
        if (!isMountedRef.current) return;

        setTimeRemaining((prev) => {
          if (prev.seconds > 0) {
            return { ...prev, seconds: prev.seconds - 1 };
          }
          if (prev.minutes > 0) {
            return { minutes: prev.minutes - 1, seconds: 59 };
          }
          // Timer expired
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          return { minutes: 0, seconds: 0 };
        });
      }, 1000);
    };

    startTimer();

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [showTimer]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Enhanced handlers with error handling and loading states
  const handlePayNow = useCallback(async () => {
    if (!orderValidation.isValid) {
      showSnackbar(orderValidation.error || "Invalid order", "error");
      return;
    }

    if (loading) return;

    setLoading(true);
    abortControllerRef.current = new AbortController();

    try {
      if (!wallet.isConnected) {
        await connectWallet();
        // Wait for wallet connection to complete
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await refetchBalance();
      }

      if (!calculations.hasSufficientBalance) {
        showSnackbar(
          `Insufficient USDT balance. Required: ${calculations.requiredAmount.toFixed(
            2
          )} USDT`,
          "error"
        );
        return;
      }

      if (abortControllerRef.current?.signal.aborted) return;

      setIsPaymentModalOpen(true);
    } catch (error) {
      console.error("Payment initialization failed:", error);
      showSnackbar(
        error instanceof Error ? error.message : "Failed to initialize payment",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }, [
    orderValidation,
    loading,
    wallet.isConnected,
    calculations.hasSufficientBalance,
    calculations.requiredAmount,
    connectWallet,
    refetchBalance,
    showSnackbar,
  ]);

  const handlePaymentSuccess = useCallback(
    async (transaction: any) => {
      setIsPaymentModalOpen(false);

      if (!isMountedRef.current) return;

      try {
        // Update order status with optimistic UI
        if (orderId) {
          showSnackbar("Updating order status...", "info");
          await changeOrderStatus(orderId, "accepted", false);
        }

        showSnackbar("Payment completed successfully!", "success");

        // Navigate with slight delay for better UX
        setTimeout(() => {
          if (!isMountedRef.current) return;

          if (navigatePath) {
            navigate(navigatePath, { replace: true });
          } else if (onReleaseNow) {
            onReleaseNow();
          }
        }, 1000);
      } catch (error) {
        console.error("Error updating order status:", error);
        // Still show success for payment completion
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
    if (!orderId || !onUpdateOrder || loading) return;

    // Validate changes
    if (!calculations.hasChanges) {
      showSnackbar("No changes to save", "info");
      return;
    }

    setLoading(true);
    abortControllerRef.current = new AbortController();

    try {
      const updates: UpdateOrderPayload = {
        quantity,
        ...(selectedLogisticsProvider?.walletAddress && {
          logisticsProviderWalletAddress:
            selectedLogisticsProvider.walletAddress,
        }),
      };

      if (abortControllerRef.current?.signal.aborted) return;

      await onUpdateOrder(orderId, updates);

      if (!isMountedRef.current) return;

      toast.success("Order updated successfully!");
      setIsEditModalOpen(false);
    } catch (error: any) {
      console.error("Order update failed:", error);
      if (!isMountedRef.current) return;

      const errorMessage =
        error?.message || "Failed to update order. Please try again.";
      toast.error(errorMessage);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [
    orderId,
    onUpdateOrder,
    loading,
    calculations.hasChanges,
    quantity,
    selectedLogisticsProvider,
    showSnackbar,
  ]);

  // Optimized modal handlers
  const handleEditModalClose = useCallback(() => {
    if (loading) {
      showSnackbar("Please wait for the current operation to complete", "info");
      return;
    }
    setIsEditModalOpen(false);
  }, [loading, showSnackbar]);

  const handlePaymentModalClose = useCallback(() => {
    if (loading) {
      showSnackbar("Transaction in progress. Please wait...", "info");
      return;
    }
    setIsPaymentModalOpen(false);
  }, [loading, showSnackbar]);

  const handleEditModalOpen = useCallback(() => {
    if (loading) return;
    setIsEditModalOpen(true);
  }, [loading]);

  // Input handlers with validation
  const handleQuantityChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseInt(e.target.value, 10);
      if (!isNaN(value) && value > 0) {
        setQuantity(value);
      }
    },
    []
  );

  const handleLogisticsSelect = useCallback((provider: any) => {
    setSelectedLogisticsProvider(provider);
  }, []);

  // Memoized components with performance optimization
  const editButton = useMemo(
    () => (
      <Button
        title={
          <div className="flex items-center gap-2">
            <FiEdit2 className="w-4 h-4" />
            Edit Order
          </div>
        }
        className="bg-transparent hover:bg-gray-700 text-white text-sm px-6 py-3 border border-gray-600 rounded transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={handleEditModalOpen}
        disabled={loading}
      />
    ),
    [handleEditModalOpen, loading]
  );

  const payButton = useMemo(
    () => (
      <Button
        title={payButtonText}
        className={`text-white text-sm px-6 py-3 rounded transition-colors duration-200 disabled:cursor-not-allowed ${
          calculations.hasSufficientBalance && !loading
            ? "bg-Red hover:bg-[#e02d37]"
            : "bg-gray-600 opacity-75"
        }`}
        onClick={handlePayNow}
        disabled={
          !calculations.hasSufficientBalance ||
          loading ||
          !orderValidation.isValid
        }
        aria-label={payButtonText}
      />
    ),
    [
      payButtonText,
      calculations.hasSufficientBalance,
      loading,
      orderValidation.isValid,
      handlePayNow,
    ]
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

  // Early return for invalid states
  if (!orderValidation.isValid) {
    return (
      <div className="text-center py-8">
        <p className="text-red-400">{orderValidation.error}</p>
      </div>
    );
  }

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
              max={999}
              value={quantity}
              onChange={handleQuantityChange}
              disabled={loading}
              className="w-full px-3 py-2 bg-neutral-800 text-white border border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-describedby="quantity-help"
            />
            <p id="quantity-help" className="text-xs text-gray-400 mt-1">
              Enter the desired quantity for this order (1-999)
            </p>
          </div>

          {orderDetails?.product && (
            <div>
              <LogisticsSelector
                logisticsCost={orderDetails.product.logisticsCost ?? []}
                logisticsProviders={
                  orderDetails.product.logisticsProviders ?? []
                }
                onSelect={handleLogisticsSelect}
                selectedProviderWalletAddress={
                  orderDetails.logisticsProviderWalletAddress
                }
              />
            </div>
          )}

          <div className="flex justify-end gap-3 mt-6">
            <Button
              title="Cancel"
              className="bg-transparent hover:bg-gray-700 text-white text-sm px-4 py-2 border border-gray-600 rounded transition-colors duration-200 disabled:opacity-50"
              onClick={handleEditModalClose}
              disabled={loading}
            />
            <Button
              title={loading ? "Updating..." : "Save Changes"}
              className="bg-Red hover:bg-[#e02d37] text-white text-sm px-4 py-2 rounded transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleUpdateOrder}
              disabled={loading || !calculations.hasChanges}
              aria-describedby={
                !calculations.hasChanges ? "no-changes-help" : undefined
              }
            />
            {!calculations.hasChanges && (
              <p id="no-changes-help" className="text-xs text-gray-400 sr-only">
                No changes detected to save
              </p>
            )}
          </div>
        </div>
      </Modal>

      {/* Payment Modal */}
      {orderDetails && escrowAddress && (
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={handlePaymentModalClose}
          orderDetails={orderDetails}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </>
  );
};

export default PendingPaymentStatus;
