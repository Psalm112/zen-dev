"use client";
import { motion } from "framer-motion";
import { memo } from "react";
import LoadingSpinner from "../ui/LoadingSpinner";
import { IconType } from "react-icons";

interface WalletConnectionButtonProps {
  onClick: () => void;
  icon: IconType;
  children: React.ReactNode;
  disabled?: boolean;
  variant?: "primary" | "secondary";
  loading?: boolean;
  className?: string;
}

const WalletConnectionButton = memo(
  ({
    onClick,
    icon: Icon,
    children,
    disabled = false,
    variant = "secondary",
    loading = false,
    className = "",
  }: WalletConnectionButtonProps) => {
    const baseClasses =
      "w-full py-3 rounded-lg transition-all duration-200 flex items-center justify-center font-medium disabled:opacity-50 disabled:cursor-not-allowed";
    const variants = {
      primary:
        "bg-red-500 hover:bg-red-600 text-white shadow-lg hover:shadow-xl",
      secondary:
        "bg-[#2A2D35] hover:bg-[#35383F] text-white border border-[#3A3D45] hover:border-[#4A4D55]",
    };

    return (
      <motion.button
        onClick={onClick}
        disabled={disabled || loading}
        className={`${baseClasses} ${variants[variant]} ${className}`}
        whileHover={!disabled ? { scale: 1.02 } : {}}
        whileTap={!disabled ? { scale: 0.98 } : {}}
      >
        {loading ? (
          <LoadingSpinner size="sm" />
        ) : (
          <Icon className="w-4 h-4 mr-2" />
        )}
        {children}
      </motion.button>
    );
  }
);

WalletConnectionButton.displayName = "WalletConnectionButton";
export default WalletConnectionButton;
