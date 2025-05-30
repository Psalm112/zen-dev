"use client";
import { motion } from "framer-motion";
import { memo } from "react";

interface SuccessMessageProps {
  message: string;
}

const SuccessMessage = memo(({ message }: SuccessMessageProps) => (
  <motion.div
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    className="bg-green-500/10 border border-green-500/30 text-green-400 p-3 rounded-md mb-4 text-sm"
    role="alert"
    aria-live="polite"
  >
    {message}
  </motion.div>
));

SuccessMessage.displayName = "SuccessMessage";
export default SuccessMessage;
