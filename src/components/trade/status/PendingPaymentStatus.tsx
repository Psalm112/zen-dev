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

  // Performance: Use refs for cleanup and state management
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  const balanceRefetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // State with proper initialization
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>(() => ({
    minutes: 9,
    seconds: 59,
  }));
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedLogisticsProvider, setSelectedLogisticsProvider] =
    useState<any>(null);

  // Performance: Memoized validation with error boundary protection
  const orderValidation = useMemo(() => {
    try {
      if (!orderDetails?.product?.price || !orderDetails.quantity) {
        return {
          isValid: false,
          error: "Order information incomplete",
        };
      }

      if (quantity <= 0 || quantity > 999) {
        return {
          isValid: false,
          error: "Invalid quantity (1-999)",
        };
      }

      return { isValid: true, error: null };
    } catch (error) {
      console.error("Order validation error:", error);
      return {
        isValid: false,
        error: "Order validation failed",
      };
    }
  }, [orderDetails?.product?.price, orderDetails?.quantity, quantity]);

  // Performance: Optimized calculations with proper number handling
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

    try {
      const totalAmount = Number(
        (orderDetails.product.price * quantity).toFixed(6)
      );
      const requiredAmount = Number((totalAmount * 1.02).toFixed(6));

      const hasQuantityChanged = quantity !== orderDetails.quantity;
      const hasLogisticsChanged =
        selectedLogisticsProvider?.walletAddress !==
        orderDetails.logisticsProviderWalletAddress;

      // Performance: Parse balance once and cache
      const userBalance = (() => {
        const balanceStr = String(usdtBalance || 0).replace(/[,\s]/g, "");
        const parsed = Number(balanceStr);
        return Number.isFinite(parsed) ? parsed : 0;
      })();

      return {
        totalAmount,
        requiredAmount,
        hasChanges: hasQuantityChanged || hasLogisticsChanged,
        userBalance,
        hasSufficientBalance: userBalance >= requiredAmount,
      };
    } catch (error) {
      console.error("Calculation error:", error);
      return {
        totalAmount: 0,
        requiredAmount: 0,
        hasChanges: false,
        userBalance: 0,
        hasSufficientBalance: false,
      };
    }
  }, [
    orderValidation.isValid,
    orderDetails?.product?.price,
    orderDetails?.quantity,
    orderDetails?.logisticsProviderWalletAddress,
    quantity,
    selectedLogisticsProvider?.walletAddress,
    usdtBalance,
  ]);

  // Performance: Memoized escrow address with error handling
  const escrowAddress = useMemo(() => {
    try {
      return ESCROW_ADDRESSES[44787] || null;
    } catch {
      return null;
    }
  }, []);

  // Performance: Memoized button text with loading state
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

  // Performance: Initialize quantity only once
  useEffect(() => {
    if (
      orderDetails?.quantity &&
      quantity === 1 &&
      orderDetails.quantity !== 1
    ) {
      setQuantity(orderDetails.quantity);
    }
  }, [orderDetails?.quantity]);

  // Performance: Optimized timer with proper cleanup
  useEffect(() => {
    if (!showTimer) return;

    const timer = setInterval(() => {
      if (!mountedRef.current) return;

      setTimeRemaining((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        }
        if (prev.minutes > 0) {
          return { minutes: prev.minutes - 1, seconds: 59 };
        }
        return { minutes: 0, seconds: 0 };
      });
    }, 1000);

    timerRef.current = timer;
    return () => clearInterval(timer);
  }, [showTimer]);

  // Performance: Single cleanup effect
  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearInterval(timerRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
      if (balanceRefetchTimeoutRef.current)
        clearTimeout(balanceRefetchTimeoutRef.current);
    };
  }, []);

  // Performance: Debounced balance refetch
  const debouncedRefetchBalance = useCallback(() => {
    if (balanceRefetchTimeoutRef.current) {
      clearTimeout(balanceRefetchTimeoutRef.current);
    }
    balanceRefetchTimeoutRef.current = setTimeout(() => {
      if (mountedRef.current) {
        refetchBalance();
      }
    }, 500);
  }, [refetchBalance]);

  // Performance: Optimized payment handler with proper error boundaries
  const handlePayNow = useCallback(async () => {
    if (!orderValidation.isValid || loading) return;

    setLoading(true);
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      if (!wallet.isConnected) {
        await connectWallet();
        // Performance: Use shorter wait time
        await new Promise((resolve) => setTimeout(resolve, 500));
        debouncedRefetchBalance();
      }

      if (controller.signal.aborted) return;

      if (!calculations.hasSufficientBalance) {
        showSnackbar(
          `Insufficient USDT balance. Required: ${calculations.requiredAmount.toFixed(
            2
          )} USDT`,
          "error"
        );
        return;
      }

      setIsPaymentModalOpen(true);
    } catch (error) {
      if (!controller.signal.aborted && mountedRef.current) {
        console.error("Payment initialization failed:", error);
        showSnackbar(
          error instanceof Error
            ? error.message
            : "Failed to initialize payment",
          "error"
        );
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [
    orderValidation.isValid,
    loading,
    wallet.isConnected,
    calculations.hasSufficientBalance,
    calculations.requiredAmount,
    connectWallet,
    debouncedRefetchBalance,
    showSnackbar,
  ]);

  // Performance: Optimized payment success handler
  const handlePaymentSuccess = useCallback(
    async (transaction: any) => {
      setIsPaymentModalOpen(false);
      if (!mountedRef.current) return;

      try {
        if (orderId) {
          // Performance: Fire and forget for better UX
          changeOrderStatus(orderId, "accepted", false).catch(console.error);
        }

        showSnackbar("Payment completed successfully!", "success");

        // Performance: Immediate navigation for better UX
        if (navigatePath) {
          navigate(navigatePath, { replace: true });
        } else if (onReleaseNow) {
          onReleaseNow();
        }
      } catch (error) {
        console.error("Post-payment processing error:", error);
        // Still navigate on payment success
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

  // Performance: Optimized update handler with validation
  const handleUpdateOrder = useCallback(async () => {
    if (!orderId || !onUpdateOrder || loading || !calculations.hasChanges) {
      if (!calculations.hasChanges) {
        showSnackbar("No changes to save", "info");
      }
      return;
    }

    setLoading(true);
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const updates: UpdateOrderPayload = {
        quantity,
        ...(selectedLogisticsProvider?.walletAddress && {
          logisticsProviderWalletAddress:
            selectedLogisticsProvider.walletAddress,
        }),
      };

      if (controller.signal.aborted) return;

      await onUpdateOrder(orderId, updates);

      if (mountedRef.current) {
        toast.success("Order updated successfully!");
        setIsEditModalOpen(false);
      }
    } catch (error: any) {
      if (!controller.signal.aborted && mountedRef.current) {
        console.error("Order update failed:", error);
        toast.error(
          error?.message || "Failed to update order. Please try again."
        );
      }
    } finally {
      if (mountedRef.current) {
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

  // Performance: Optimized modal handlers
  const handleEditModalClose = useCallback(() => {
    if (!loading) {
      setIsEditModalOpen(false);
    }
  }, [loading]);

  const handlePaymentModalClose = useCallback(() => {
    if (!loading) {
      setIsPaymentModalOpen(false);
    }
  }, [loading]);

  const handleEditModalOpen = useCallback(() => {
    if (!loading) {
      setIsEditModalOpen(true);
    }
  }, [loading]);

  // Performance: Optimized input handlers
  const handleQuantityChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = Math.max(
        1,
        Math.min(999, parseInt(e.target.value, 10) || 1)
      );
      setQuantity(value);
    },
    []
  );

  const handleLogisticsSelect = useCallback((provider: any) => {
    setSelectedLogisticsProvider(provider);
  }, []);

  // Performance: Memoized components
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
        actionButtons={
          <div className="w-full flex items-center justify-center flex-wrap gap-4">
            {editButton}
            {payButton}
          </div>
        }
      />

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
              className="w-full px-3 py-2 bg-neutral-800 text-white border border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors duration-200 disabled:opacity-50"
            />
          </div>

          {orderDetails?.product && (
            <LogisticsSelector
              logisticsCost={orderDetails.product.logisticsCost ?? []}
              logisticsProviders={orderDetails.product.logisticsProviders ?? []}
              onSelect={handleLogisticsSelect}
              selectedProviderWalletAddress={
                orderDetails.logisticsProviderWalletAddress
              }
            />
          )}

          <div className="flex justify-end gap-3 mt-6">
            <Button
              title="Cancel"
              className="bg-transparent hover:bg-gray-700 text-white text-sm px-4 py-2 border border-gray-600 rounded transition-colors duration-200"
              onClick={handleEditModalClose}
              disabled={loading}
            />
            <Button
              title={loading ? "Updating..." : "Save Changes"}
              className="bg-Red hover:bg-[#e02d37] text-white text-sm px-4 py-2 rounded transition-colors duration-200 disabled:opacity-50"
              onClick={handleUpdateOrder}
              disabled={loading || !calculations.hasChanges}
            />
          </div>
        </div>
      </Modal>

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
