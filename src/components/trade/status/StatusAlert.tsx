import { FC, ReactNode } from "react";
import { motion } from "framer-motion";

interface StatusAlertProps {
  icon: ReactNode;
  message: string;
  verificationMessage?: string;
  type?: "warning" | "info" | "error";
}

const StatusAlert: FC<StatusAlertProps> = ({
  icon,
  message,
  verificationMessage,
  type = "warning",
}) => {
  const bgColor = {
    warning: "bg-amber-950 border-amber-500 text-amber-200",
    info: "bg-blue-950 border-blue-500 text-blue-200",
    error: "bg-red-950 border-red-500 text-red-200",
  }[type];

  return (
    <motion.div
      className={`border rounded-lg p-4 flex items-center gap-3 ${bgColor}`}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="text-red-500">{icon}</div>
      <div>
        <p className="text-sm">{message}</p>
        {verificationMessage && (
          <p className="text-sm mt-1">{verificationMessage}</p>
        )}
      </div>
    </motion.div>
  );
};

export default StatusAlert;
