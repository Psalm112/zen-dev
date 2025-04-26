import { FC, useState, useEffect } from "react";
import { TradeOrderDetails, TradeTransactionInfo } from "../../../utils/types";
import BaseStatus from "./BaseStatus";
import StatusAlert from "./StatusAlert";
import Button from "../../common/Button";
import { BsShieldExclamation } from "react-icons/bs";

interface PendingPaymentStatusProps {
  orderDetails: TradeOrderDetails;
  transactionInfo: TradeTransactionInfo;
  onContactSeller?: () => void;
  onOrderDispute?: () => void;
  onReleaseNow?: () => void;
}

const PendingPaymentStatus: FC<PendingPaymentStatusProps> = ({
  orderDetails,
  transactionInfo,
  onContactSeller,
  onOrderDispute,
  onReleaseNow,
}) => {
  const [timeRemaining, setTimeRemaining] = useState({
    minutes: 9,
    seconds: 59,
  });

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

  const statusAlert = (
    <StatusAlert
      icon={<BsShieldExclamation size={18} />}
      message="To ensure the safety of your funds,please verify the real name of the payer: Femi Cole"
      type="warning"
    />
  );

  const actionButtons = (
    <div className="w-full flex justify-evenly flex-row flex-wrap gap-4">
      <Button
        title="Order Dispute?"
        className="bg-transparent hover:bg-gray-700 text-white text-sm px-6 py-3 border border-gray-600 rounded transition-colors "
        onClick={onOrderDispute}
      />
      <Button
        title="Release Now"
        className="bg-Red hover:bg-[#e02d37] text-white text-sm px-6 py-3 rounded transition-colors "
        onClick={onReleaseNow}
      />
    </div>
  );

  return (
    <BaseStatus
      statusTitle="Pending Payment"
      statusDescription="The payment is expected to be completed in approximately 15:00"
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

export default PendingPaymentStatus;
