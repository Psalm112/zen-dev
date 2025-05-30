"use client";
import { memo, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { FaEnvelope, FaPhone, FaGoogle, FaApple } from "react-icons/fa";
import WalletConnectionButton from "../buttons/WalletConnectionButton";
import { createDeviceInfo } from "../../../utils/device.utils";

interface AlternativeConnectionMethodsProps {
  activeTab: string;
  setActiveTab: (tab: "main" | "email" | "phone") => void;
  isConnecting: boolean;
}

const AlternativeConnectionMethods = memo(
  ({
    activeTab,
    setActiveTab,
    isConnecting,
  }: AlternativeConnectionMethodsProps) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="space-y-3"
    >
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[#3A3D45]"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-[#212428] text-gray-500">Quick connect</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <WalletConnectionButton
          onClick={() => setActiveTab("email")}
          icon={FaEnvelope}
          variant="secondary"
          disabled={isConnecting}
          className="text-sm py-2.5"
        >
          Email
        </WalletConnectionButton>

        <WalletConnectionButton
          onClick={() => setActiveTab("phone")}
          icon={FaPhone}
          variant="secondary"
          disabled={isConnecting}
          className="text-sm py-2.5"
        >
          Phone
        </WalletConnectionButton>
      </div>

      {/* Social login options for smart wallet */}
      <SocialLoginOptions isConnecting={isConnecting} />
    </motion.div>
  )
);

// Social login options with conditional rendering
const SocialLoginOptions = memo(
  ({ isConnecting }: { isConnecting: boolean }) => {
    const deviceInfo = useMemo(() => createDeviceInfo(), []);

    // Simplified version without actual connection logic
    const handleSocialLogin = useCallback(
      async (provider: "google" | "apple") => {
        console.log(`Connecting with ${provider}...`);
        // Actual connection would be implemented here
      },
      []
    );

    return (
      <div className="grid grid-cols-2 gap-2">
        <WalletConnectionButton
          onClick={() => handleSocialLogin("google")}
          icon={FaGoogle}
          variant="secondary"
          disabled={isConnecting}
          className="text-xs py-2"
        >
          Google
        </WalletConnectionButton>

        {deviceInfo.isIOS && (
          <WalletConnectionButton
            onClick={() => handleSocialLogin("apple")}
            icon={FaApple}
            variant="secondary"
            disabled={isConnecting}
            className="text-xs py-2"
          >
            Apple
          </WalletConnectionButton>
        )}
      </div>
    );
  }
);

AlternativeConnectionMethods.displayName = "AlternativeConnectionMethods";
SocialLoginOptions.displayName = "SocialLoginOptions";

export default AlternativeConnectionMethods;
