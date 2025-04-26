import { FC } from "react";
import { motion } from "framer-motion";
import CancelledStatus from "./CancelledStatus";
import PendingPaymentStatus from "./PendingPaymentStatus";
import FundsReleaseStatus from "./FundsReleaseStatus";
import CompletedStatus from "./CompletedStatus";
import { TradeStatusProps } from "../../../utils/types";

const TradeStatus: FC<TradeStatusProps> = ({
  status,
  orderDetails,
  transactionInfo,
  onContactSeller,
  onOrderDispute,
  onReleaseNow,
}) => {
  switch (status) {
    case "cancelled":
      return (
        <CancelledStatus
          orderDetails={orderDetails}
          transactionInfo={transactionInfo}
          onContactSeller={onContactSeller}
          onOrderDispute={onOrderDispute}
        />
      );
    case "pending":
      return (
        <PendingPaymentStatus
          orderDetails={orderDetails}
          transactionInfo={transactionInfo}
          onContactSeller={onContactSeller}
          onOrderDispute={onOrderDispute}
          onReleaseNow={onReleaseNow}
        />
      );
    case "release":
      return (
        <FundsReleaseStatus
          orderDetails={orderDetails}
          transactionInfo={transactionInfo}
          onContactSeller={onContactSeller}
          onOrderDispute={onOrderDispute}
          onReleaseNow={onReleaseNow}
        />
      );
    case "completed":
      return (
        <CompletedStatus
          orderDetails={orderDetails}
          transactionInfo={transactionInfo}
          onContactBuyer={onContactSeller}
        />
      );
    default:
      return null;
  }
};

export default TradeStatus;
