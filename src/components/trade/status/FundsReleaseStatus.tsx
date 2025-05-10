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
import { toast } from "react-toastify";
import { useContractData } from "../../../utils/hooks/useContract";
import Modal from "../../common/Modal";
import ConnectWallet from "../ConnectWallet";
// import { useWallet } from "../../../utils/hooks/useWallet";
import { motion } from "framer-motion";
import { useWallet } from "../../../context/WalletContext";

interface FundsReleaseStatusProps {
  tradeDetails?: TradeDetails;
  orderDetails?: OrderDetails;
  transactionInfo?: TradeTransactionInfo;
  onContactSeller?: () => void;
  onOrderDispute?: (reason: string) => Promise<void>;
  onConfirmDelivery?: () => void;
  orderId?: string;
  showTimer?: boolean;
}

const FundsReleaseStatus: FC<FundsReleaseStatusProps> = ({
  tradeDetails,
  transactionInfo,
  onContactSeller,
  onOrderDispute,
  onConfirmDelivery,
  orderId,
  showTimer,
}) => {
  const [timeRemaining, setTimeRemaining] = useState({
    minutes: 9,
    seconds: 59,
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
  const [dispute, setDispute] = useState("");
  const [loading, setLoading] = useState(false);
  const { confirmTradeDelivery, raiseTradeDispute } = useContractData();
  const { isConnected } = useWallet();

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

  const handleConfirmDelivery = async () => {
    if (!isConnected) {
      setIsWalletModalOpen(true);
      return;
    }

    if (!orderId) {
      toast.error("Order ID is missing. Cannot confirm delivery.");
      return;
    }

    setIsProcessing(true);
    try {
      const result = await confirmTradeDelivery(orderId);

      if (!result.success) {
        throw new Error(result.message || "Failed to confirm delivery");
      }

      if (onConfirmDelivery) {
        onConfirmDelivery();
      }

      toast.success(
        "Delivery confirmed successfully! Funds released to seller."
      );
    } catch (error: any) {
      console.error("Error during delivery confirmation:", error);
      toast.error(
        error.message || "Failed to confirm delivery. Please try again."
      );
    } finally {
      setIsProcessing(false);
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

  // const handleDispute = async () => {
  //   if (!isConnected) {
  //     setIsWalletModalOpen(true);
  //     return;
  //   }

  //   if (!orderId) {
  //     toast.error("Order ID is missing. Cannot raise dispute.");
  //     return;
  //   }

  //   setIsProcessing(true);
  //   try {
  //     const result = await raiseTradeDispute(
  //       orderId,
  //       "Issue with received item"
  //     );

  //     if (!result.success) {
  //       throw new Error(result.message || "Failed to raise dispute");
  //     }

  //     if (onOrderDispute) {
  //       onOrderDispute();
  //     }

  //     toast.success(
  //       "Dispute raised successfully! Admin will review your case."
  //     );
  //   } catch (error: any) {
  //     console.error("Error raising dispute:", error);
  //     toast.error(
  //       error.message || "Failed to raise dispute. Please try again."
  //     );
  //   } finally {
  //     setIsProcessing(false);
  //   }
  // };

  const handleWalletConnected = (success: boolean) => {
    setIsWalletModalOpen(false);
  };

  return (
    <>
      <BaseStatus
        statusTitle="Funds Release"
        statusDescription="The buyer has confirmed payment for this order. Please release the funds."
        statusAlert={
          <StatusAlert
            icon={<BsShieldExclamation size={18} />}
            message="To ensure the safety of your funds, please verify the real name of the payer: Femi Cole"
            type="warning"
          />
        }
        tradeDetails={tradeDetails}
        transactionInfo={transactionInfo}
        contactLabel="Contact Buyer"
        onContact={onContactSeller}
        showTimer={showTimer}
        timeRemaining={timeRemaining}
        actionButtons={
          <div className="w-full flex justify-evenly flex-row flex-wrap gap-4">
            {onOrderDispute && (
              <Button
                title="Order Dispute?"
                className="w-fit bg-transparent hover:bg-gray-700 text-white text-sm px-6 py-3 border border-gray-600 rounded transition-colors"
                onClick={() => setIsDisputeModalOpen(true)}
                disabled={isProcessing}
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
                  "Confirm Delivery"
                )
              }
              className={`w-fit text-white text-sm px-6 py-3 border-none rounded transition-colors ${
                isProcessing
                  ? "bg-gray-600 cursor-not-allowed"
                  : "bg-Red hover:bg-[#e02d37]"
              }`}
              onClick={handleConfirmDelivery}
              disabled={isProcessing}
            />
          </div>
        }
      />
      <Modal
        isOpen={isDisputeModalOpen}
        onClose={() => setIsDisputeModalOpen(false)}
        title="Reason for Dispute"
        maxWidth="md:max-w-lg"
      >
        <form onSubmit={handleDisputeSubmit} className="space-y-4 mt-4">
          <div>
            {/* <label htmlFor="comment" className="block text-gray-300 mb-2">
              Reason for Dispute
            </label> */}
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
        />
      </Modal>
    </>
  );
};

export default FundsReleaseStatus;
