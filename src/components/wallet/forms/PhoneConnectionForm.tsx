"use client";
import { FC, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaPhone } from "react-icons/fa";
import WalletConnectionButton from "../buttons/WalletConnectionButton";
import { ErrorMessage, SuccessMessage } from "../ui";
import { useWallet } from "../../../context/WalletContext";

interface PhoneConnectionFormProps {
  onBack: () => void;
}

const PhoneConnectionForm: FC<PhoneConnectionFormProps> = ({ onBack }) => {
  const wallet = useWallet();
  const { isConnecting } = wallet;
  const [phone, setPhone] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handlePhoneConnect = useCallback(async () => {
    if (!phone.trim()) {
      setLocalError("Please enter a valid phone number");
      return;
    }

    setLocalError(null);
    try {
      // In the actual implementation, this would call the wallet.connectWallet method
      // For now, we're just showing a success message
      setSuccessMessage("Verification code sent! Please check your phone.");
    } catch (error: any) {
      setLocalError(error.message || "Failed to connect with phone");
    }
  }, [phone]);

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

      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 text-green-500 mb-4">
          <FaPhone className="text-3xl" />
        </div>
        <h2 className="text-xl font-semibold mb-2 text-white">
          Connect with Phone
        </h2>
        <p className="text-gray-400 text-sm">
          We'll send you a verification code via SMS
        </p>
      </div>

      <div className="mb-6">
        <input
          type="tel"
          placeholder="Enter your phone number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full bg-[#2A2D35] border border-[#3A3D45] rounded-lg p-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors"
          disabled={isConnecting}
          autoComplete="tel"
        />
      </div>

      <div className="flex gap-3">
        <WalletConnectionButton
          onClick={onBack}
          icon={() => <span>←</span>}
          variant="secondary"
          disabled={isConnecting}
          className="flex-1"
        >
          Back
        </WalletConnectionButton>
        <WalletConnectionButton
          onClick={handlePhoneConnect}
          icon={FaPhone}
          variant="primary"
          disabled={isConnecting || !phone.trim()}
          loading={isConnecting}
          className="flex-1"
        >
          {isConnecting ? "Sending..." : "Continue"}
        </WalletConnectionButton>
      </div>
    </motion.div>
  );
};

export default PhoneConnectionForm;
