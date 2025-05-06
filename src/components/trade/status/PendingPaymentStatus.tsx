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
import { useContractData } from "../../../utils/hooks/useContractData";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Modal from "../../common/Modal";
import ConnectWallet from "../ConnectWallet";
import { useWallet } from "../../../utils/hooks/useWallet";

interface PendingPaymentStatusProps {
  tradeDetails?: TradeDetails;
  orderDetails?: OrderDetails;
  transactionInfo?: TradeTransactionInfo;
  onContactSeller?: () => void;
  onOrderDispute?: () => void;
  onReleaseNow?: () => void;
  navigatePath?: string;
  orderId?: string;
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
}) => {
  const navigate = useNavigate();
  const [timeRemaining, setTimeRemaining] = useState({
    minutes: 9,
    seconds: 59,
  });
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingTransactionData, setPendingTransactionData] = useState<{
    contractAddress: string;
    amount: string;
    isUSDT: boolean;
    usdtAddress: string;
  } | null>(null);
  const { initiateTradeContract, sendFundsToEscrow } = useContractData();
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

  const getAmount = () => {
    if (tradeDetails && tradeDetails.amount) {
      return tradeDetails.amount.toString();
    }
    if (orderDetails && orderDetails.product.price) {
      return orderDetails.product.price;
    }
    return "200";
  };

  const processRelease = async () => {
    setIsProcessing(true);
    try {
      const tradeResponse = await initiateTradeContract({
        seller: "0x57aEAAEb6081A394675642B5A7E70e94618641d9",
        productCost: getAmount(),
        logisticsProvider: "0x57aEAAEb6081A394675642B5A7E70e94618641d9",
        logisticsCost: "2000.00",
        useUSDT: true,
        orderId: orderId || "",
      });

      console.log(tradeResponse, getAmount());
      if (tradeResponse.status !== "success" || !tradeResponse.data) {
        throw new Error(
          tradeResponse.message || "Failed to create trade contract"
        );
      }

      const { contractAddress, amount, isUSDT, usdtAddress } =
        tradeResponse.data;

      // const escrowResult = await sendFundsToEscrow(
      //   contractAddress,
      //   amount,
      //   isUSDT,
      //   usdtAddress
      // );

      // if (!escrowResult.success) {
      //   throw new Error("Failed to send funds to escrow");
      // }

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
        showTimer={true}
        timeRemaining={timeRemaining}
        actionButtons={
          <div className="w-full flex justify-evenly flex-row flex-wrap gap-4">
            {onOrderDispute && (
              <Button
                title="Order Dispute?"
                className="bg-transparent hover:bg-gray-700 text-white text-sm px-6 py-3 border border-gray-600 rounded transition-colors"
                onClick={onOrderDispute}
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
                  "Release Now"
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
