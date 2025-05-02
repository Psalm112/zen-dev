import { motion } from "framer-motion";
import React, { FC, useState } from "react";
import { FaBox, FaSpinner, FaCheckCircle } from "react-icons/fa";
import { useContractData } from "../../utils/hooks/useContractData";

interface ConfirmDeliveryProps {
  tradeId: string;
  onComplete: () => void;
}

const ConfirmDelivery: FC<ConfirmDeliveryProps> = ({ tradeId, onComplete }) => {
  const [isConfirmed, setIsConfirmed] = useState(false);
  const {
    confirmTradeDelivery,
    isDeliveryConfirmLoading,
    deliveryConfirmError,
  } = useContractData();

  const handleConfirmDelivery = async () => {
    const result = await confirmTradeDelivery(tradeId);
    if (result.success) {
      setIsConfirmed(true);
      setTimeout(() => {
        onComplete();
      }, 2000);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-md mx-auto bg-[#212428] p-6 md:p-8 rounded-lg shadow-lg"
    >
      {deliveryConfirmError && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-md mb-4">
          {deliveryConfirmError}
        </div>
      )}

      <div className="text-center mb-6">
        <motion.div
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
          className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
            isConfirmed
              ? "bg-green-500/10 text-green-500"
              : "bg-Red/10 text-Red"
          }`}
        >
          {isConfirmed ? (
            <FaCheckCircle className="text-3xl" />
          ) : (
            <FaBox className="text-3xl" />
          )}
        </motion.div>
        <h2 className="text-xl font-semibold mb-2">
          {isConfirmed ? "Delivery Confirmed" : "Confirm Delivery"}
        </h2>
        <p className="text-gray-400 text-sm">
          {isConfirmed
            ? "Thank you for confirming. Funds have been released to the seller."
            : "Confirm that you've received your order to release funds from escrow."}
        </p>
      </div>

      {!isConfirmed && (
        <div className="space-y-6">
          <div className="bg-[#2A2D35] p-4 rounded-lg">
            <p className="text-sm text-gray-300 leading-relaxed">
              By confirming delivery, you acknowledge that:
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>You have received the items as described</li>
                <li>The condition of the items meets your expectations</li>
                <li>Funds will be immediately released to the seller</li>
              </ul>
            </p>
          </div>

          <button
            onClick={handleConfirmDelivery}
            disabled={isDeliveryConfirmLoading}
            className="w-full py-3 bg-Red hover:bg-[#e02d37] text-white rounded transition-colors flex items-center justify-center"
          >
            {isDeliveryConfirmLoading ? (
              <FaSpinner className="animate-spin mr-2" />
            ) : null}
            {isDeliveryConfirmLoading ? "Processing..." : "Confirm Delivery"}
          </button>
        </div>
      )}

      {isConfirmed && (
        <div className="bg-green-500/10 border border-green-500/30 text-green-400 p-3 rounded-md">
          Delivery successfully confirmed. The transaction is now complete.
        </div>
      )}
    </motion.div>
  );
};

export default React.memo(ConfirmDelivery);
