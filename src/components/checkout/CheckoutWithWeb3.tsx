import React, { useState } from "react";
import { useWeb3 } from "../../context/Web3Context";
import PaymentModal from "../web3/PaymentModal";
import Button from "../common/Button";
import { HiCreditCard, HiWallet } from "react-icons/hi2";

interface CheckoutWithWeb3Props {
  orderData: {
    id: string;
    amount: string;
    items: Array<{ name: string; quantity: number; price: string }>;
  };
  onOrderComplete: (transactionHash: string) => void;
}

const CheckoutWithWeb3: React.FC<CheckoutWithWeb3Props> = ({
  orderData,
  onOrderComplete,
}) => {
  const { wallet } = useWeb3();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showWalletConnect, setShowWalletConnect] = useState(false);

  const handleCryptoPayment = () => {
    if (!wallet.isConnected) {
      setShowWalletConnect(true);
      return;
    }
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = (transaction: any) => {
    setShowPaymentModal(false);
    onOrderComplete(transaction.hash);
  };

  return (
    <div className="space-y-6">
      {/* Payment Options */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-white">
          Choose Payment Method
        </h3>

        {/* Traditional Payment */}
        {/* <Button
          title="Pay with Card"
          icon={<HiCreditCard className="w-5 h-5" />}
          iconPosition="start"
          onClick={() => {}}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white p-4 text-left justify-start"
        /> */}

        {/* Crypto Payment */}
        <Button
          title={
            wallet.isConnected
              ? "Pay with USDT"
              : "Connect Wallet to Pay with Crypto"
          }
          icon={<HiWallet className="w-5 h-5" />}
          iconPosition="start"
          onClick={handleCryptoPayment}
          className="w-full bg-green-600 hover:bg-green-700 text-white p-4 text-left justify-start"
        />
      </div>

      {/* Crypto Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        orderDetails={{
          ...orderData,
          escrowAddress: process.env.VITE_ESCROW_CONTRACT_MAINNET!, // Use your escrow address
        }}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </div>
  );
};

export default CheckoutWithWeb3;
