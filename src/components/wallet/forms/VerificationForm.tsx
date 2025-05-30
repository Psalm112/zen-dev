"use client";
import { FC, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaEnvelope, FaPhone, FaCheck } from "react-icons/fa";
import WalletConnectionButton from "../buttons/WalletConnectionButton";
import { ErrorMessage, SuccessMessage } from "../ui";
import { useWallet } from "../../../context/WalletContext";

interface VerificationFormProps {
  authMethod: "email" | "phone";
  onBack: () => void;
}

const VerificationForm: FC<VerificationFormProps> = ({
  authMethod,
  onBack,
}) => {
  const wallet = useWallet();
  const { isConnecting } = wallet;
  const [verificationCode, setVerificationCode] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const verifyCode = useCallback(async () => {
    if (!verificationCode.trim()) {
      setLocalError("Please enter the verification code");
      return;
    }

    setLocalError(null);
    try {
      // In the actual implementation, this would call the wallet.connectWallet method
      // For now, we're just showing a success message
      setSuccessMessage("Verification successful!");
    } catch (error: any) {
      setLocalError(error.message || "Verification failed");
    }
  }, [verificationCode]);

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
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-500/10 text-blue-500 mb-4">
          {authMethod === "email" ? (
            <FaEnvelope className="text-3xl" />
          ) : (
            <FaPhone className="text-3xl" />
          )}
        </div>
        <h2 className="text-xl font-semibold mb-2 text-white">
          Verify Your {authMethod === "email" ? "Email" : "Phone"}
        </h2>
        <p className="text-gray-400 text-sm">
          Enter the verification code sent to your{" "}
          {authMethod === "email" ? "email" : "phone number"}
        </p>
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Enter verification code"
          value={verificationCode}
          onChange={(e) => setVerificationCode(e.target.value)}
          className="w-full bg-[#2A2D35] border border-[#3A3D45] rounded-lg p-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors"
          disabled={isConnecting}
          maxLength={6}
          autoComplete="one-time-code"
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
          onClick={verifyCode}
          icon={FaCheck}
          variant="primary"
          disabled={isConnecting || !verificationCode.trim()}
          loading={isConnecting}
          className="flex-1"
        >
          {isConnecting ? "Verifying..." : "Verify"}
        </WalletConnectionButton>
      </div>
    </motion.div>
  );
};

export default VerificationForm;
