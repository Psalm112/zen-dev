import { FC } from "react";
import CancelledStatus from "./CancelledStatus";
import PendingPaymentStatus from "./PendingPaymentStatus";
import FundsReleaseStatus from "./FundsReleaseStatus";
import CompletedStatus from "./CompletedStatus";
import {
  OrderDetails,
  StatusProps,
  TradeDetails,
  TradeTransactionInfo,
} from "../../../utils/types";
import { ErrorBoundary } from "react-error-boundary";

interface TradeStatusProps extends StatusProps {
  orderDetails?: OrderDetails;
  navigatePath?: string;
}

const TradeStatus: FC<TradeStatusProps> = ({
  status,
  orderDetails,
  tradeDetails,
  transactionInfo,
  onContactSeller,
  onContactBuyer,
  onOrderDispute,
  onConfirmDelivery,
  onReleaseNow,
  orderId,
  navigatePath,
}) => {
  const safeTransactionInfo: TradeTransactionInfo = transactionInfo || {
    buyerName: "Unknown",
    goodRating: 0,
    completedOrders: 0,
    completionRate: 0,
    avgPaymentTime: 0,
  };

  if (!tradeDetails && !orderDetails) {
    return (
      <div className="p-4 bg-[#292B30] rounded-lg text-center text-gray-400">
        Order information is not available.
      </div>
    );
  }

  return (
    <ErrorBoundary
      fallbackRender={({ error }) => (
        <div className="p-4 bg-[#292B30] rounded-lg text-Red">
          <p className="font-medium mb-2">
            Something went wrong displaying the order status.
          </p>
          <p className="text-sm text-gray-400">{error.message}</p>
        </div>
      )}
    >
      {renderStatusComponent(
        status,
        orderDetails,
        tradeDetails,
        safeTransactionInfo,
        onContactSeller,
        onContactBuyer,
        onOrderDispute,
        onConfirmDelivery,
        onReleaseNow,
        orderId,
        navigatePath
      )}
    </ErrorBoundary>
  );
};

const renderStatusComponent = (
  status: string,
  orderDetails?: OrderDetails,
  tradeDetails?: TradeDetails,
  transactionInfo?: TradeTransactionInfo,
  onContactSeller?: () => void,
  onContactBuyer?: () => void,
  onOrderDispute?: (reason?: string) => void,
  onConfirmDelivery?: () => void,
  onReleaseNow?: () => void,
  orderId?: string,
  navigatePath?: string
) => {
  switch (status) {
    case "cancelled":
      return (
        <CancelledStatus
          tradeDetails={tradeDetails}
          orderDetails={orderDetails}
          transactionInfo={transactionInfo}
          onContactSeller={onContactSeller}
          onOrderDispute={onOrderDispute}
        />
      );
    case "pending":
      return (
        <PendingPaymentStatus
          tradeDetails={tradeDetails}
          orderDetails={orderDetails}
          transactionInfo={transactionInfo}
          onContactSeller={onContactSeller}
          onOrderDispute={onOrderDispute}
          onReleaseNow={onReleaseNow}
          navigatePath={navigatePath}
          orderId={orderId}
        />
      );
    case "release":
      return (
        <FundsReleaseStatus
          tradeDetails={tradeDetails}
          orderDetails={orderDetails}
          transactionInfo={transactionInfo}
          onContactSeller={onContactSeller}
          onOrderDispute={onOrderDispute}
          onConfirmDelivery={onConfirmDelivery}
          orderId={orderId}
        />
      );
    case "completed":
      return (
        <CompletedStatus
          orderDetails={orderDetails}
          tradeDetails={tradeDetails}
          onContactBuyer={onContactBuyer}
        />
      );
    default:
      return (
        <PendingPaymentStatus
          tradeDetails={tradeDetails}
          orderDetails={orderDetails}
          transactionInfo={transactionInfo}
          onContactSeller={onContactSeller}
          onOrderDispute={onOrderDispute}
          onReleaseNow={onReleaseNow}
          navigatePath={navigatePath}
          orderId={orderId}
        />
      );
  }
};

export default TradeStatus;
