import React, { useState, useCallback, useMemo } from "react";
import { useWeb3 } from "../../context/Web3Context";
import PaymentModal from "../web3/PaymentModal";
import Button from "../common/Button";
import { HiWallet } from "react-icons/hi2";

interface CheckoutWithWeb3Props {
  orderData: {
    id: string;
    amount: string;
    tradeId?: string; // Add optional tradeId
    logisticsProvider?: string; // Add optional logisticsProvider
    items: Array<{ name: string; quantity: number; price: string }>;
  };
  onOrderComplete: (transactionHash: string) => void;
}

const CheckoutWithWeb3: React.FC<CheckoutWithWeb3Props> = React.memo(
  ({ orderData, onOrderComplete }) => {
    const { wallet } = useWeb3();
    const [showPaymentModal, setShowPaymentModal] = useState(false);

    // Memoize button text to prevent unnecessary re-renders
    const buttonText = useMemo(() => {
      return wallet.isConnected
        ? "Pay with USDT"
        : "Connect Wallet to Pay with Crypto";
    }, [wallet.isConnected]);

    // Optimize button class computation
    const buttonClassName = useMemo(() => {
      return "w-full bg-green-600 hover:bg-green-700 text-white p-4 text-left justify-start transition-colors duration-200";
    }, []);

    const handleCryptoPayment = useCallback(() => {
      if (!wallet.isConnected) {
        setShowPaymentModal(true);
        return;
      }
      setShowPaymentModal(true);
    }, [wallet.isConnected]);

    const handlePaymentSuccess = useCallback(
      (transaction: any) => {
        setShowPaymentModal(false);
        onOrderComplete(transaction.hash);
      },
      [onOrderComplete]
    );

    const handleModalClose = useCallback(() => {
      setShowPaymentModal(false);
    }, []);

    // Calculate total quantity from items
    const totalQuantity = useMemo(() => {
      return orderData.items.reduce((sum, item) => sum + item.quantity, 0);
    }, [orderData.items]);

    // Memoize order details to prevent unnecessary PaymentModal re-renders
    const memoizedOrderDetails = useMemo(
      () => ({
        id: orderData.id,
        amount: orderData.amount,
        tradeId: orderData.tradeId || "0", // Default to "0" if not provided
        quantity: totalQuantity.toString(),
        logisticsProvider: orderData.logisticsProvider || "", // Default to empty string if not provided
        items: orderData.items,
        escrowAddress: import.meta.env.VITE_ESCROW_CONTRACT_MAINNET!,
      }),
      [orderData, totalQuantity]
    );

    return (
      <div className="space-y-6">
        {/* Payment Options */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-white">
            Choose Payment Method
          </h3>

          {/* Crypto Payment */}
          <Button
            title={buttonText}
            icon={<HiWallet className="w-5 h-5" />}
            iconPosition="start"
            onClick={handleCryptoPayment}
            className={buttonClassName}
            aria-label={
              wallet.isConnected
                ? "Pay with USDT cryptocurrency"
                : "Connect wallet to pay with cryptocurrency"
            }
          />
        </div>

        {/* Crypto Payment Modal */}
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={handleModalClose}
          orderDetails={memoizedOrderDetails}
          onPaymentSuccess={handlePaymentSuccess}
        />
      </div>
    );
  }
);

CheckoutWithWeb3.displayName = "CheckoutWithWeb3";

export default CheckoutWithWeb3;
