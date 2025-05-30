"use client";
import { motion } from "framer-motion";
import { memo } from "react";

interface ErrorMessageProps {
  error: string;
}

const ErrorMessage = memo(({ error }: ErrorMessageProps) => (
  <motion.div
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-md mb-4 text-sm"
    role="alert"
    aria-live="polite"
  >
    {error}
  </motion.div>
));

ErrorMessage.displayName = "ErrorMessage";
export default ErrorMessage;
