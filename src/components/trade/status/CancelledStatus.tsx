import { FC } from "react";
import { motion } from "framer-motion";
import { TradeOrderDetails, TradeTransactionInfo } from "../../../utils/types";
import BaseStatus from "./BaseStatus";
import StatusAlert from "./StatusAlert";
import Button from "../../common/Button";
import { FaExclamationTriangle } from "react-icons/fa";

interface CancelledStatusProps {
  orderDetails: TradeOrderDetails;
  transactionInfo: TradeTransactionInfo;
  onContactSeller?: () => void;
  onOrderDispute?: () => void;
}

const CancelledStatus: FC<CancelledStatusProps> = ({
  orderDetails,
  transactionInfo,
  onContactSeller,
  onOrderDispute,
}) => {
  const statusAlert = (
    <StatusAlert
      icon={<FaExclamationTriangle size={18} />}
      message="This order has been concluded, and the assets are no longer locked by Desemnart. Do not blindly trust strangers or release funds without confirming."
      verificationMessage="To ensure the safety of your funds,please verify the real name of the payer: Femi Cole"
      type="warning"
    />
  );

  const actionButtons = (
    <Button
      title="Order Dispute?"
      className="bg-transparent hover:bg-gray-700 text-white text-sm px-6 py-3 border border-gray-600 rounded transition-colors"
      onClick={onOrderDispute}
    />
  );

  return (
    <BaseStatus
      statusTitle="Your order has been cancelled."
      statusDescription="This order has been concluded, and the assets are no longer locked by Desemnart."
      statusAlert={statusAlert}
      orderDetails={orderDetails}
      transactionInfo={transactionInfo}
      onContact={onContactSeller}
      actionButtons={actionButtons}
    />
  );
};

export default CancelledStatus;
