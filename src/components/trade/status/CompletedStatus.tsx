// import { FC } from "react";
// import { motion } from "framer-motion";
// import { TradeOrderDetails, TradeTransactionInfo } from "../../../utils/types";
// import BaseStatus from "./BaseStatus";
// import StatusAlert from "./StatusAlert";
// import Button from "../../common/Button";
// import { FaExclamationTriangle, FaCheck } from "react-icons/fa";

// interface CompletedStatusProps {
//   orderDetails: TradeOrderDetails;
//   transactionInfo: TradeTransactionInfo;
//   onContactBuyer?: () => void;
// }

// const CompletedStatus: FC<CompletedStatusProps> = ({
//   orderDetails,
//   transactionInfo,
//   onContactBuyer,
// }) => {
//   // Show success notification at the top
//   const SuccessNotification = () => (
//     <motion.div
//       className="bg-green-50 border border-green-200 text-green-800 rounded-md p-4 flex items-center justify-between mb-6"
//       initial={{ opacity: 0, y: -20 }}
//       animate={{ opacity: 1, y: 0 }}
//       transition={{ duration: 0.4 }}
//     >
//       <div className="flex items-center gap-2">
//         <FaCheck className="text-green-500" />
//         <span>Your payment is complete</span>
//       </div>
//       <button className="text-gray-500 hover:text-gray-700">
//         <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
//           <path
//             d="M15 5L5 15M5 5L15 15"
//             stroke="currentColor"
//             strokeWidth="1.5"
//             strokeLinecap="round"
//             strokeLinejoin="round"
//           />
//         </svg>
//       </button>
//     </motion.div>
//   );

//   const statusAlert = (
//     <StatusAlert
//       icon={<FaExclamationTriangle size={18} />}
//       message="This order has concluded and the assets are no longer locked in Desemnart escrow system. Do not trust strangers or release funds without confirming."
//       type="warning"
//     />
//   );

//   const actionButtons = (
//     <Button
//       title="Sell more"
//       className="bg-Red fles items-center justify-center hover:bg-[#e02d37] text-white text-sm px-6 py-3 rounded transition-colors w-full max-w-md mx-auto"
//       path="/trades"
//     />
//   );

//   return (
//     <>
//       <SuccessNotification />
//       <BaseStatus
//         statusTitle="Completed"
//         statusDescription="This order has concluded and the assets are no longer locked in Desemnart escrow system."
//         statusAlert={statusAlert}
//         orderDetails={orderDetails}
//         transactionInfo={transactionInfo}
//         contactLabel="Contact Buyer"
//         onContact={onContactBuyer}
//         actionButtons={actionButtons}
//       />
//     </>
//   );
// };

// export default CompletedStatus;

import { FC } from "react";
import { motion } from "framer-motion";
import { TradeOrderDetails, TradeTransactionInfo } from "../../../utils/types";
import { FaCheck } from "react-icons/fa";
import { IoChevronBack, IoChevronForward } from "react-icons/io5";
import { LuMessageSquare } from "react-icons/lu";
import { BsShieldExclamation } from "react-icons/bs";
import Button from "../../common/Button";

interface CompletedStatusProps {
  orderDetails: TradeOrderDetails;
  transactionInfo: TradeTransactionInfo;
  onContactBuyer?: () => void;
  onLeaveReview?: () => void;
  onViewFAQ?: () => void;
}

const CompletedStatus: FC<CompletedStatusProps> = ({
  orderDetails,
  onContactBuyer,
  onLeaveReview,
  onViewFAQ,
}) => {
  // Success notification component
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

  return (
    <>
      <SuccessNotification />

      <motion.div
        className="flex items-center mb-8 justify-between flex-col sm:flex-row gap-4"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="w-full">
          <motion.button
            className="flex items-center text-gray-400 hover:text-white mb-4"
            whileHover={{ x: -3 }}
            transition={{ type: "spring", stiffness: 400 }}
            onClick={() => window.history.back()}
          >
            <IoChevronBack className="w-5 h-5" />
          </motion.button>
          <motion.h1
            className="text-2xl font-medium text-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            Completed
          </motion.h1>
          <div>
            <motion.p
              className="text-gray-400 text-sm mt-2 w-full inline"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              This order has concluded and the assets are no longer locked in
              Desemnart escrow system.
            </motion.p>
            &nbsp;
            <motion.p
              className="text-Red text-sm mt-2 w-full inline"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              Do not trust strangers or release funds without confirming.
            </motion.p>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="self-end sm:self-auto"
        >
          <Button
            title="Contact Buyer"
            className="bg-transparent hover:bg-gray-700 text-white text-sm px-4 py-2 border border-Red rounded-2xl transition-colors flex items-center gap-x-2 justify-center"
            onClick={onContactBuyer}
            icon={<LuMessageSquare className="w-5 h-5 text-Red" />}
            iconPosition="start"
          />
        </motion.div>
      </motion.div>

      {/* alert */}
      <motion.div
        className="rounded-lg p-4 flex items-center gap-3 text-white-200 bg-Red/10 mb-6"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="text-red-500">
          <BsShieldExclamation size={18} />
        </div>
        <div className="w-full">
          <p className="text-sm">
            This order has concluded and the assets are no longer locked in
            Desemnart escrow system. Do not trust strangers or release funds
            without confirming.
          </p>
        </div>
      </motion.div>

      {/* Order details */}
      <motion.div
        className="bg-[#292B30] rounded-lg overflow-hidden shadow-lg mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        <div className="py-4 px-6 md:px-12">
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <div className="w-fit flex flex-col gap-2">
              <div className="w-full flex gap-4 items-center">
                <motion.h3
                  className="font-medium text-xl text-white"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  {orderDetails.productName}
                </motion.h3>
                <motion.span
                  className="bg-green-500 text-white text-xs px-3 py-1 rounded-full"
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
                <div className="flex justify-between py-2">
                  <span className="text-gray-400 text-sm">Total Quantity</span>
                  <span className="text-white">{orderDetails.quantity}</span>
                </div>

                <div className="flex justify-between py-2">
                  <span className="text-gray-400 text-sm">Order Time</span>
                  <span className="text-white">{orderDetails.orderTime}</span>
                </div>

                <div className="flex justify-between py-2">
                  <span className="text-gray-400 text-sm">Order No.</span>
                  <div className="flex items-center">
                    <span className="text-white mr-2">
                      {orderDetails.orderNo}
                    </span>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <svg
                        className="w-4 h-4 text-gray-400 hover:text-white transition-colors"
                        fill="currentColor"
                        viewBox="0 0 16 16"
                      >
                        <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z" />
                        <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z" />
                      </svg>
                    </motion.button>
                  </div>
                </div>

                <div className="flex justify-between py-2">
                  <span className="text-gray-400 text-sm">Payment Method</span>
                  <span className="text-white">
                    {orderDetails.paymentMethod}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/*  Review section */}
      <motion.div
        className="bg-[#292B30] rounded-lg overflow-hidden shadow-lg mb-6 cursor-pointer"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        whileHover={{ scale: 1.01 }}
        onClick={onLeaveReview}
      >
        <div className="py-4 px-6 flex justify-between items-center">
          <h3 className="text-white font-medium">Leave A Review</h3>
          <motion.div
            whileHover={{ x: 3 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <IoChevronForward className="text-gray-400" />
          </motion.div>
        </div>
      </motion.div>

      {/* FAQ section */}
      <motion.div
        className="bg-[#292B30] rounded-lg overflow-hidden shadow-lg mb-6 cursor-pointer"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.4 }}
        whileHover={{ scale: 1.01 }}
        onClick={onViewFAQ}
      >
        <div className="py-4 px-6 flex justify-between items-center">
          <h3 className="text-white font-medium">FAQ</h3>
          <motion.div
            whileHover={{ x: 3 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <IoChevronForward className="text-gray-400" />
          </motion.div>
        </div>
      </motion.div>

      <motion.a
        className="max-w-md mx-auto bg-Red hover:bg-[#e02d37] text-white text-sm px-6 py-3 rounded transition-colors w-full flex items-center justify-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.4 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        href="/trades"
      >
        Sell more
      </motion.a>
    </>
  );
};

export default CompletedStatus;
