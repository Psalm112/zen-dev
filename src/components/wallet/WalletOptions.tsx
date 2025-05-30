"use client";
import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IoChevronDown } from "react-icons/io5";
import WalletOption from "./ui/WalletOption";
import { useWallet, useWalletStatus } from "../../context/WalletContext";
import { WalletType } from "../../utils/types/wallet.types";
import { useWalletInfo } from "../../utils/hooks/useWalletInfo";

interface WalletOptionsProps {
  deviceInfo: any;
  showAlternatives: boolean;
}

const WalletOptions = ({
  deviceInfo,
  showAlternatives,
}: WalletOptionsProps) => {
  const [expandedOptions, setExpandedOptions] = useState(false);
  const { connectWallet, connectWithFallback } = useWallet();
  const { isConnecting } = useWalletStatus();
  const { availableWallets, openWalletWithFallback } = useWalletInfo();

  const handleWalletConnect = useCallback(
    async (walletType: WalletType) => {
      try {
        if (
          deviceInfo.isMobile &&
          !availableWallets.find((w) => w.type === walletType)?.installed
        ) {
          openWalletWithFallback(walletType);
          return;
        }

        // Use connectWithFallback for better compatibility
        await connectWithFallback(walletType);
      } catch (error: any) {
        console.error(`Failed to connect ${walletType}:`, error);
      }
    },
    [deviceInfo, availableWallets, openWalletWithFallback, connectWithFallback]
  );

  const displayWallets = useMemo(() => {
    return expandedOptions ? availableWallets : availableWallets.slice(0, 3);
  }, [availableWallets, expandedOptions]);

  if (!showAlternatives || !availableWallets.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.1 }}
      className="space-y-3"
    >
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[#3A3D45]"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-[#212428] text-gray-500">
            Or connect with
          </span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div className="space-y-2" layout>
          {displayWallets.map((wallet, index) => (
            <motion.div
              key={wallet.type}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              layout
            >
              <WalletOption
                wallet={wallet}
                onConnect={() => handleWalletConnect(wallet.type)}
                isConnecting={isConnecting}
                deviceInfo={deviceInfo}
              />
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>

      {availableWallets.length > 3 && (
        <motion.button
          onClick={() => setExpandedOptions(!expandedOptions)}
          className="w-full py-2 text-gray-400 hover:text-white text-sm transition-colors flex items-center justify-center"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {expandedOptions
            ? "Show Less"
            : `Show ${availableWallets.length - 3} More`}
          <motion.div
            animate={{ rotate: expandedOptions ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="ml-1"
          >
            <IoChevronDown className="w-4 h-4" />
          </motion.div>
        </motion.button>
      )}
    </motion.div>
  );
};

export default WalletOptions;
