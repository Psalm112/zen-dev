"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useWallet, useWalletStatus } from "../../context/WalletContext";
import { createDeviceInfo } from "../../utils/device.utils";
import {
  WalletIcon,
  ErrorMessage,
  SuccessMessage,
  ConnectionStatus,
} from "./ui";
import WalletConnectionButton from "./buttons/WalletConnectionButton";
import EnhancedWalletOptions from "./EnhancedWalletOptions";
import AlternativeConnectionMethods from "./forms/AlternativeConnectionMethods";
import { FaWallet } from "react-icons/fa";

interface MainConnectionViewProps {
  showAlternatives: boolean;
  setActiveTab: (tab: "main" | "email" | "phone") => void;
}

const MainConnectionView = ({
  showAlternatives,
  setActiveTab,
}: MainConnectionViewProps) => {
  const wallet = useWallet();
  const { isConnecting, error } = useWalletStatus();
  const hasError = !!error;
  const [localError, setLocalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const deviceInfo = createDeviceInfo();

  const handleConnect = async () => {
    setLocalError(null);
    setSuccessMessage(null);

    try {
      await wallet.connectRecommended();
      setSuccessMessage("Wallet connected successfully!");
    } catch (error: any) {
      setLocalError(error.message || "Failed to connect wallet");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-md mx-auto bg-[#212428] p-6 md:p-8 rounded-xl shadow-2xl border border-[#2A2D35]"
    >
      <AnimatePresence>
        {localError && <ErrorMessage error={localError} />}
        {successMessage && <SuccessMessage message={successMessage} />}
      </AnimatePresence>

      <div className="text-center mb-8">
        <WalletIcon />
        <h2 className="text-2xl font-bold mb-2 text-white">Connect Wallet</h2>
        <p className="text-gray-400 text-sm">
          Choose your preferred wallet to get started
        </p>
      </div>

      <div className="space-y-4">
        {/* Recommended Connection */}
        <WalletConnectionButton
          onClick={handleConnect}
          icon={FaWallet}
          variant="primary"
          loading={isConnecting}
          className="text-lg py-4"
        >
          {isConnecting ? "Connecting..." : "Connect Recommended Wallet"}
        </WalletConnectionButton>

        {/* Enhanced Wallet Options */}
        <EnhancedWalletOptions
          onConnect={handleConnect}
          isConnecting={isConnecting}
          deviceInfo={deviceInfo}
          walletInfo={wallet}
          showAlternatives={showAlternatives}
        />

        {/* Alternative Connection Methods */}
        {showAlternatives && (
          <AlternativeConnectionMethods
            activeTab="main"
            setActiveTab={setActiveTab}
            isConnecting={isConnecting}
          />
        )}
      </div>

      {/* Connection Status */}
      <ConnectionStatus isConnecting={isConnecting} hasError={hasError} />
    </motion.div>
  );
};

export default MainConnectionView;
