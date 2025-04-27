import { FC } from "react";
import { motion } from "framer-motion";
import { FaCheck } from "react-icons/fa";

interface SuccessNotificationProps {
  message: string;
  onClose?: () => void;
}

const SuccessNotification: FC<SuccessNotificationProps> = ({
  message,
  onClose,
}) => {
  return (
    <motion.div
      className="bg-green-50 border border-green-200 text-green-800 rounded-md p-4 flex items-center justify-between mb-6"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex items-center gap-2">
        <FaCheck className="text-green-500" />
        <span>{message}</span>
      </div>
      <button
        className="text-gray-500 hover:text-gray-700 transition-colors"
        onClick={onClose}
        aria-label="Close notification"
      >
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
};

export default SuccessNotification;
