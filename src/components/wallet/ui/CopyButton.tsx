"use client";
import { FaCopy, FaCheck } from "react-icons/fa";
import { motion } from "framer-motion";
import { memo, useState, useCallback } from "react";

interface CopyButtonProps {
  text: string;
  label: string;
}

const CopyButton = memo(({ text, label }: CopyButtonProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      className="ml-2 p-1 text-gray-400 hover:text-red-400 transition-colors"
      title={`Copy ${label}`}
      aria-label={`Copy ${label}`}
    >
      <motion.div
        key={copied ? "check" : "copy"}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        {copied ? (
          <FaCheck className="w-3 h-3 text-green-400" />
        ) : (
          <FaCopy className="w-3 h-3" />
        )}
      </motion.div>
    </button>
  );
});

CopyButton.displayName = "CopyButton";
export default CopyButton;
