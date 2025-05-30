"use client";
import { FaWallet } from "react-icons/fa";
import { motion } from "framer-motion";
import { memo } from "react";

const WalletIcon = memo(() => (
  <motion.div
    whileHover={{ scale: 1.05 }}
    transition={{ type: "spring", stiffness: 400, damping: 10 }}
    className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 text-red-500 mb-4"
  >
    <FaWallet className="text-3xl" />
  </motion.div>
));

WalletIcon.displayName = "WalletIcon";
export default WalletIcon;
