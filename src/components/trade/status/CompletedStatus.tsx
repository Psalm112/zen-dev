import { FC } from "react";
import { motion } from "framer-motion";
import { TradeOrderDetails, TradeTransactionInfo } from "../../../utils/types";
import BaseStatus from "./BaseStatus";
import StatusAlert from "./StatusAlert";
import Button from "../../common/Button";
import { FaExclamationTriangle, FaCheck } from "react-icons/fa";

interface CompletedStatusProps {
  orderDetails: TradeOrderDetails;
  transactionInfo: TradeTransactionInfo;
  onContactBuyer?: () => void;
}

const CompletedStatus: FC<CompletedStatusProps> = ({
  orderDetails,
  transactionInfo,
  onContactBuyer,
}) => {
  // Show success notification at the top
  const SuccessNotification = () => (
    <motion.div
      className="bg-green-50 border border-green-200 text-green-800 rounded-md p-4 flex items-center justify-between mb-6"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex items-center gap-2">
        <FaCheck className="text-green-500" />
        <span>Your payment is complete</span>
      </div>
      <button className="text-gray-500 hover:text-gray-700">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M15 5L5 15M5 5L15 15"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </motion.div>
  );

  const statusAlert = (
    <StatusAlert
      icon={<FaExclamationTriangle size={18} />}
      message="This order has concluded and the assets are no longer locked in Desemnart escrow system. Do not trust strangers or release funds without confirming."
      type="warning"
    />
  );

  const actionButtons = (
    <Button
      title="Sell more"
      className="bg-Red fles items-center justify-center hover:bg-[#e02d37] text-white text-sm px-6 py-3 rounded transition-colors w-full max-w-md mx-auto"
      path="/trades"
    />
  );

  return (
    <>
      <SuccessNotification />
      <BaseStatus
        statusTitle="Completed"
        statusDescription="This order has concluded and the assets are no longer locked in Desemnart escrow system."
        statusAlert={statusAlert}
        orderDetails={orderDetails}
        transactionInfo={transactionInfo}
        contactLabel="Contact Buyer"
        onContact={onContactBuyer}
        actionButtons={actionButtons}
      />
    </>
  );
};

export default CompletedStatus;
