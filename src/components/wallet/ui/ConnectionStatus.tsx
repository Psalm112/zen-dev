"use client";
import { motion } from "framer-motion";
import { memo } from "react";
import LoadingSpinner from "./LoadingSpinner";

interface ConnectionStatusProps {
  isConnecting: boolean;
  hasError: boolean;
}

const ConnectionStatus = memo(
  ({ isConnecting, hasError }: ConnectionStatusProps) => {
    if (!isConnecting && !hasError) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-6 text-center"
      >
        {isConnecting && (
          <div className="flex items-center justify-center text-gray-400 text-sm">
            <LoadingSpinner size="sm" />
            <span className="ml-2">Establishing connection...</span>
          </div>
        )}
      </motion.div>
    );
  }
);

ConnectionStatus.displayName = "ConnectionStatus";
export default ConnectionStatus;
