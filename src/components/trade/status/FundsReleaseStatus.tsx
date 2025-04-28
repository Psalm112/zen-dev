import { FC, useState, useEffect } from "react";
import { TradeOrderDetails, TradeTransactionInfo } from "../../../utils/types";
import BaseStatus from "./BaseStatus";
import StatusAlert from "./StatusAlert";
import Button from "../../common/Button";
import { BsShieldExclamation } from "react-icons/bs";
import { toast } from "react-toastify";
import { useTradeService } from "../../../utils/services/tradeService"; // Import the trade service

interface FundsReleaseStatusProps {
  orderDetails: TradeOrderDetails;
  transactionInfo: TradeTransactionInfo;
  onContactSeller?: () => void;
  onOrderDispute?: () => void;
  onReleaseNow?: () => void;
  orderId?: string;
}

const FundsReleaseStatus: FC<FundsReleaseStatusProps> = ({
  orderDetails,
  transactionInfo,
  onContactSeller,
  onOrderDispute,
  onReleaseNow,
  orderId,
}) => {
  const [timeRemaining, setTimeRemaining] = useState({
    minutes: 9,
    seconds: 59,
  });
  const [isCreatingTrade, setIsCreatingTrade] = useState(false);

  // Use the trade service
  const { createTrade } = useTradeService();

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { minutes: prev.minutes - 1, seconds: 59 };
        } else {
          clearInterval(timer);
          return { minutes: 0, seconds: 0 };
        }
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleReleaseNow = async () => {
    try {
      setIsCreatingTrade(true);

      const tradeResponse = await createTrade({
        orderId: orderId || "",
        seller: orderDetails.sellerId || "608021b86eda53ead327e0ea",
        buyer: orderDetails.buyerId || "60804386704fcfe10f451cf",
        amount: orderDetails.amount || 20000,
        status: "completed",
      });

      if (!tradeResponse.ok) {
        throw new Error(
          tradeResponse.data?.message || "Failed to create trade"
        );
      }

      toast.success("Trade completed successfully!");

      if (onReleaseNow) {
        onReleaseNow();
      }
    } catch (error) {
      console.error("Error during release process:", error);
      toast.error("Failed to create trade. Please try again.");
    } finally {
      setIsCreatingTrade(false);
    }
  };

  const statusAlert = (
    <StatusAlert
      icon={<BsShieldExclamation size={18} />}
      message="To ensure the safety of your funds, please verify the real name of the payer: Femi Cole"
      type="warning"
    />
  );

  const actionButtons = (
    <div className="w-full flex justify-evenly flex-row flex-wrap gap-4">
      <Button
        title="Order Dispute?"
        className="w-fit bg-transparent hover:bg-gray-700 text-white text-sm px-6 py-3 border border-gray-600 rounded transition-colors"
        onClick={onOrderDispute}
        disabled={isCreatingTrade}
      />
      <Button
        title={
          isCreatingTrade ? (
            <div className="flex items-center">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Processing...
            </div>
          ) : (
            "Release Now"
          )
        }
        className={`w-fit text-white text-sm px-6 py-3 border-none rounded transition-colors ${
          isCreatingTrade
            ? "bg-gray-600 cursor-not-allowed"
            : "bg-Red hover:bg-[#e02d37]"
        }`}
        onClick={handleReleaseNow}
        disabled={isCreatingTrade}
      />
    </div>
  );

  return (
    <BaseStatus
      statusTitle="Funds Release in progress"
      statusDescription="Please check your available balance to make sure that you've successfully received the payment. Once confirmed, you may proceed to release the products."
      statusAlert={statusAlert}
      orderDetails={orderDetails}
      transactionInfo={transactionInfo}
      onContact={onContactSeller}
      actionButtons={actionButtons}
      showTimer={true}
      timeRemaining={timeRemaining}
    />
  );
};

export default FundsReleaseStatus;
