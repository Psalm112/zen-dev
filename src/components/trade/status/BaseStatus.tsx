import { FC, ReactNode } from "react";
import { motion } from "framer-motion";
import { TradeOrderDetails, TradeTransactionInfo } from "../../../utils/types";
import TradeDetailRow from "../view/TradeDetailRow";
import { FaCopy } from "react-icons/fa";
import { LuMessageSquare } from "react-icons/lu";
import Button from "../../common/Button";

interface BaseStatusProps {
  statusTitle: string;
  statusDescription?: string;
  statusAlert?: ReactNode;
  orderDetails: TradeOrderDetails;
  transactionInfo: TradeTransactionInfo;
  contactLabel?: string;
  onContact?: () => void;
  actionButtons?: ReactNode;
  showTimer?: boolean;
  timeRemaining?: { minutes: number; seconds: number };
}

const BaseStatus: FC<BaseStatusProps> = ({
  statusTitle,
  statusDescription,
  statusAlert,
  orderDetails,
  transactionInfo,
  contactLabel = "Contact Seller",
  onContact,
  actionButtons,
  showTimer,
  timeRemaining,
}) => {
  const [copied, setCopied] = useState(false);

  const copyOrderId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <motion.div
        className="flex items-center mb-8 justify-between"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div>
          <motion.button
            className="flex items-center text-gray-400 hover:text-white mb-4"
            whileHover={{ x: -3 }}
            transition={{ type: "spring", stiffness: 400 }}
            onClick={() => window.history.back()}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M15 18L9 12L15 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </motion.button>
          <motion.h1
            className="text-2xl font-medium text-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            {statusTitle}
          </motion.h1>
          {statusDescription && (
            <motion.p
              className="text-gray-400 text-sm mt-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {statusDescription}
            </motion.p>
          )}
        </div>

        {showTimer && timeRemaining && (
          <motion.div
            className="flex gap-2 items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {onContact && (
              <Button
                title={contactLabel}
                className="bg-transparent hover:bg-gray-700 text-white text-sm px-4 py-2 border border-Red rounded-2xl transition-colors flex items-center gap-x-2 justify-center"
                onClick={onContact}
                icon={<LuMessageSquare className="w-5 h-5 text-Red" />}
                iconPosition="start"
              />
            )}
            <div className="flex gap-1">
              <div className="bg-Red text-white text-xl font-bold rounded px-2 py-1 min-w-[36px] text-center">
                {String(timeRemaining.minutes).padStart(2, "0")}
              </div>
              <span className="text-white text-xl">:</span>
              <div className="bg-Red text-white text-xl font-bold rounded px-2 py-1 min-w-[36px] text-center">
                {String(timeRemaining.seconds).padStart(2, "0")}
              </div>
            </div>
          </motion.div>
        )}

        {!showTimer && onContact && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Button
              title={contactLabel}
              className="bg-transparent hover:bg-gray-700 text-white text-sm px-4 py-2 border border-Red rounded-2xl transition-colors flex items-center gap-x-2 justify-center"
              onClick={onContact}
              icon={<LuMessageSquare className="w-5 h-5 text-Red" />}
              iconPosition="start"
            />
          </motion.div>
        )}
      </motion.div>

      {statusAlert && (
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {statusAlert}
        </motion.div>
      )}

      <motion.div
        className="bg-[#292B30] rounded-lg overflow-hidden shadow-lg mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        <div className="py-4 px-6 md:px-12">
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <div className="w-fit flex flex-col gap-2">
              <div className="w-full flex gap-4">
                <motion.h3
                  className="font-medium text-xl text-white"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  {orderDetails.productName}
                </motion.h3>
                <motion.span
                  className={`${
                    orderDetails.tradeType === "BUY"
                      ? "bg-green-500"
                      : "bg-red-500"
                  } text-white text-xs px-3 py-1 rounded-full`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  {orderDetails.tradeType}
                </motion.span>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-700 py-8">
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Amount</span>
                <span className="text-red-500 text-xl font-bold">
                  {orderDetails.amount}
                </span>
              </div>

              <div className="space-y-2">
                <TradeDetailRow
                  label="Total Quantity"
                  value={orderDetails.quantity.toString()}
                />
                <TradeDetailRow
                  label="Order Time"
                  value={orderDetails.orderTime}
                />
                <TradeDetailRow
                  label="Order No."
                  value={
                    <div className="flex items-center">
                      <span className="mr-2">{orderDetails.orderNo}</span>
                      <motion.button
                        onClick={() => copyOrderId(orderDetails.orderNo)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <FaCopy className="text-gray-400 hover:text-white transition-colors" />
                      </motion.button>
                    </div>
                  }
                  bottomNote={
                    copied && (
                      <motion.p
                        className="text-green-400 text-center mt-2 text-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        Code copied to clipboard!
                      </motion.p>
                    )
                  }
                />
                {orderDetails.paymentMethod && (
                  <TradeDetailRow
                    label="Payment Method"
                    value={orderDetails.paymentMethod}
                  />
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      <motion.div
        className="bg-[#292B30] rounded-lg overflow-hidden shadow-lg mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        <div className="py-4 px-6 md:px-12">
          <div className="mb-4">
            <h3 className="text-white text-lg font-medium">Transaction Info</h3>
          </div>
          <div className="space-y-2">
            <TradeDetailRow
              label="Buyer's Name"
              value={transactionInfo.buyerName}
            />
            <TradeDetailRow
              label="Good Rating %"
              value={`${transactionInfo.goodRating}%`}
            />
            <TradeDetailRow
              label="Completed Order(s) in 30 Days"
              value={`${transactionInfo.completedOrders} Order(s)`}
            />
            <TradeDetailRow
              label="30-Day Order Completion Rate"
              value={`${transactionInfo.completionRate}%`}
            />
            <TradeDetailRow
              label="Avg. Payment Time"
              value={`${transactionInfo.avgPaymentTime} Minute(s)`}
            />
          </div>
        </div>
      </motion.div>

      {actionButtons && (
        <motion.div
          className="flex flex-col sm:flex-row justify-center gap-4 mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          {actionButtons}
        </motion.div>
      )}
    </div>
  );
};

export default BaseStatus;
