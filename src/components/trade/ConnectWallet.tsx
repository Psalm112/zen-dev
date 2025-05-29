"use client";
import { motion, AnimatePresence } from "framer-motion";
import { FC, useState, useCallback, useEffect, useMemo, memo } from "react";
import {
  FaWallet,
  FaSpinner,
  FaGoogle,
  FaEnvelope,
  FaPhone,
  FaFingerprint,
  FaUserSecret,
  FaSignOutAlt,
} from "react-icons/fa";
import TransactionConfirmation from "./TransactionConfirmation";
import ConfirmDelivery from "./ConfirmDelivery";
import { pendingTransactionProps } from "../../utils/types";
import { useRef } from "react";
import { IoChevronDown } from "react-icons/io5";
import { useWallet } from "../../context/WalletContext";
import { useWalletOperations } from "../../utils/hooks/useWallet";

export interface ConnectWalletProps {
  showAlternatives?: boolean;
  pendingTransaction?: pendingTransactionProps | null;
  onTransactionComplete?: (success: boolean) => void;
}

// Memoized components for better performance
const ErrorMessage = memo(({ error }: { error: string }) => (
  <motion.div
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-md mb-4 text-sm"
  >
    {error}
  </motion.div>
));

const LoadingSpinner = memo(() => <FaSpinner className="animate-spin mr-2" />);

const WalletIcon = memo(() => (
  <motion.div
    whileHover={{ scale: 1.05 }}
    transition={{ type: "spring", stiffness: 400, damping: 10 }}
    className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-Red/10 text-Red mb-4"
  >
    <FaWallet className="text-3xl" />
  </motion.div>
));

const CurrencyDropdown = memo(
  ({
    displayCurrency,
    setDisplayCurrency,
    showCurrencyDropdown,
    setShowCurrencyDropdown,
    currencyDropdownRef,
  }: {
    displayCurrency: string;
    setDisplayCurrency: (currency: "USDT" | "CELO" | "FIAT") => void;
    showCurrencyDropdown: boolean;
    setShowCurrencyDropdown: (show: boolean) => void;
    currencyDropdownRef: React.RefObject<HTMLDivElement | null>;
  }) => {
    const currencies = useMemo(() => ["USDT", "CELO", "FIAT"] as const, []);

    return (
      <div className="relative" ref={currencyDropdownRef}>
        <button
          onClick={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
          className="text-xs px-2 py-1 bg-[#35383F] hover:bg-[#3F4249] rounded text-gray-300 flex items-center transition-colors"
        >
          {displayCurrency}
          <IoChevronDown className="w-3 h-3 ml-1" />
        </button>
        <AnimatePresence>
          {showCurrencyDropdown && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.1 }}
              className="absolute right-0 mt-1 w-24 bg-[#35383F] rounded shadow-lg z-10 border border-[#3F4249]"
            >
              {currencies.map((currency) => (
                <button
                  key={currency}
                  onClick={() => {
                    setDisplayCurrency(currency);
                    setShowCurrencyDropdown(false);
                  }}
                  className="block w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-[#3F4249] transition-colors first:rounded-t last:rounded-b"
                >
                  {currency}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

const ConnectWallet: FC<ConnectWalletProps> = ({
  showAlternatives = true,
  pendingTransaction = null,
  onTransactionComplete = () => {},
}) => {
  const {
    isConnected,
    account,
    chainId,
    displayCurrency,
    setDisplayCurrency,
    formattedBalance,
    celoBalance,
    disconnect,
  } = useWallet();

  const {
    loading: operationLoading,
    error: operationError,
    success: operationSuccess,
    resetState,
    connectMetaMask,
    connectGoogle,
    connectEmail: walletConnectEmail,
    connectPhone: walletConnectPhone,
    connectPasskey,
    connectGuest,
    disconnect: handleDisconnect,
  } = useWalletOperations();

  // Local state
  const [activeTab, setActiveTab] = useState<"main" | "email" | "phone">(
    "main"
  );
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [authMethod, setAuthMethod] = useState<"email" | "phone" | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);

  const currencyDropdownRef = useRef<HTMLDivElement>(null);

  // Memoized values
  const shortenedAddress = useMemo(
    () => (account ? `${account.slice(0, 6)}...${account.slice(-4)}` : ""),
    [account]
  );

  const isVerifying = useMemo(
    () =>
      operationLoading && (authMethod === "email" || authMethod === "phone"),
    [operationLoading, authMethod]
  );

  // Handlers
  const handleConnect = useCallback(async () => {
    resetState();
    await connectMetaMask();
  }, [connectMetaMask, resetState]);

  const handleEmailConnect = useCallback(async () => {
    if (!email.trim()) {
      return;
    }
    resetState();
    const result = await walletConnectEmail(email);
    if (result?.preAuth) {
      setAuthMethod("email");
    }
  }, [email, walletConnectEmail, resetState]);

  const handlePhoneConnect = useCallback(async () => {
    if (!phone.trim()) {
      return;
    }
    resetState();
    const result = await walletConnectPhone(phone);
    if (result?.preAuth) {
      setAuthMethod("phone");
    }
  }, [phone, walletConnectPhone, resetState]);

  const verifyCode = useCallback(async () => {
    if (!verificationCode.trim()) {
      return;
    }
    resetState();

    if (authMethod === "email") {
      await walletConnectEmail(email, verificationCode);
    } else if (authMethod === "phone") {
      await walletConnectPhone(phone, verificationCode);
    }
  }, [
    authMethod,
    email,
    phone,
    verificationCode,
    walletConnectEmail,
    walletConnectPhone,
    resetState,
  ]);

  const handleCopyAddress = useCallback(() => {
    if (!account) return;

    navigator.clipboard
      .writeText(account)
      .catch((err) => console.error("Failed to copy address:", err));
  }, [account]);

  const handleFullDisconnect = useCallback(async () => {
    await handleDisconnect();
    setActiveTab("main");
    setEmail("");
    setPhone("");
    setVerificationCode("");
    setAuthMethod(null);
    setShowDetails(false);
  }, [handleDisconnect]);

  const resetToMain = useCallback(() => {
    setAuthMethod(null);
    setActiveTab("main");
    resetState();
  }, [resetState]);

  // Click outside handler for dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        currencyDropdownRef.current &&
        !currencyDropdownRef.current.contains(event.target as Node)
      ) {
        setShowCurrencyDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Reset error on tab change
  useEffect(() => {
    resetState();
  }, [activeTab, resetState]);

  // Connected state
  if (isConnected && account) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-md mx-auto bg-[#212428] p-6 md:p-8 rounded-lg shadow-lg"
      >
        <div className="text-center mb-6">
          <WalletIcon />
          <p className="text-gray-400 text-sm mb-2">
            Connected as{" "}
            <span className="font-semibold text-white">{shortenedAddress}</span>
          </p>
          <h2 className="text-xl font-semibold">Wallet Connected</h2>
        </div>

        <AnimatePresence mode="wait">
          {showDetails ? (
            <motion.div
              key="details"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <div className="bg-[#2A2D35] p-4 rounded-lg">
                <p className="text-gray-400 text-sm">Address</p>
                <p
                  className="text-white font-mono text-sm break-all cursor-pointer hover:text-Red transition-colors"
                  onClick={handleCopyAddress}
                  title="Click to copy"
                >
                  {account}
                </p>
              </div>

              <div className="bg-[#2A2D35] p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-gray-400 text-sm">Balance</p>
                  <CurrencyDropdown
                    displayCurrency={displayCurrency}
                    setDisplayCurrency={setDisplayCurrency}
                    showCurrencyDropdown={showCurrencyDropdown}
                    setShowCurrencyDropdown={setShowCurrencyDropdown}
                    currencyDropdownRef={currencyDropdownRef}
                  />
                </div>
                <p className="text-white font-semibold">{formattedBalance}</p>
                <p className="text-gray-500 text-xs mt-1">
                  Gas: {celoBalance || "Loading..."}
                </p>
              </div>

              <div className="bg-[#2A2D35] p-4 rounded-lg">
                <p className="text-gray-400 text-sm">Chain ID</p>
                <p className="text-white">{chainId}</p>
              </div>

              <button
                onClick={() => setShowDetails(false)}
                className="w-full py-3 bg-[#2A2D35] hover:bg-[#35383F] text-white rounded transition-colors"
              >
                Hide Details
              </button>

              <button
                onClick={handleFullDisconnect}
                disabled={operationLoading}
                className="w-full py-3 bg-Red hover:bg-[#e02d37] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded transition-colors flex items-center justify-center"
              >
                {operationLoading ? (
                  <LoadingSpinner />
                ) : (
                  <FaSignOutAlt className="mr-2" />
                )}
                Sign Out
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="simple"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-3"
            >
              <button
                onClick={() => setShowDetails(true)}
                className="w-full py-3 bg-[#2A2D35] hover:bg-[#35383F] text-white rounded transition-colors"
              >
                View Details
              </button>

              <button
                onClick={handleFullDisconnect}
                disabled={operationLoading}
                className="w-full py-3 bg-Red hover:bg-[#e02d37] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded transition-colors flex items-center justify-center"
              >
                {operationLoading ? (
                  <LoadingSpinner />
                ) : (
                  <FaSignOutAlt className="mr-2" />
                )}
                Sign Out
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  // Handle pending transactions
  if (pendingTransaction) {
    if (
      pendingTransaction.type === "escrow" &&
      pendingTransaction.contractAddress &&
      pendingTransaction.amount
    ) {
      return (
        <TransactionConfirmation
          contractAddress={pendingTransaction.contractAddress}
          amount={pendingTransaction.amount}
          onComplete={onTransactionComplete}
        />
      );
    }

    if (pendingTransaction.type === "delivery" && pendingTransaction.tradeId) {
      return (
        <ConfirmDelivery
          tradeId={pendingTransaction.tradeId}
          onComplete={() => onTransactionComplete(true)}
        />
      );
    }
  }

  // Verification step
  if (authMethod) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-md mx-auto bg-[#212428] p-6 md:p-8 rounded-lg shadow-lg"
      >
        <AnimatePresence>
          {operationError && <ErrorMessage error={operationError} />}
        </AnimatePresence>

        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold mb-2">
            Verify Your {authMethod === "email" ? "Email" : "Phone"}
          </h2>
          <p className="text-gray-400 text-sm">
            Enter the verification code sent to your{" "}
            {authMethod === "email" ? "email" : "phone"}
          </p>
        </div>

        <div className="mb-6">
          <input
            type="text"
            placeholder="Verification Code"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            className="w-full bg-[#2A2D35] border border-[#3A3D45] rounded p-3 text-white focus:outline-none focus:border-Red focus:ring-1 focus:ring-Red transition-colors"
            disabled={isVerifying}
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={resetToMain}
            disabled={isVerifying}
            className="w-1/2 py-3 rounded bg-[#2A2D35] text-gray-300 hover:bg-[#35383F] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Back
          </button>
          <button
            onClick={verifyCode}
            disabled={isVerifying || !verificationCode.trim()}
            className="w-1/2 py-3 bg-Red hover:bg-[#e02d37] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded transition-colors flex items-center justify-center"
          >
            {isVerifying ? <LoadingSpinner /> : null}
            Verify
          </button>
        </div>
      </motion.div>
    );
  }

  // Email connection tab
  if (activeTab === "email") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-md mx-auto bg-[#212428] p-6 md:p-8 rounded-lg shadow-lg"
      >
        <AnimatePresence>
          {operationError && <ErrorMessage error={operationError} />}
        </AnimatePresence>

        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold mb-2">Connect with Email</h2>
          <p className="text-gray-400 text-sm">
            We'll send you a verification code
          </p>
        </div>

        <div className="mb-6">
          <input
            type="email"
            placeholder="Your Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-[#2A2D35] border border-[#3A3D45] rounded p-3 text-white focus:outline-none focus:border-Red focus:ring-1 focus:ring-Red transition-colors"
            disabled={operationLoading}
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setActiveTab("main")}
            disabled={operationLoading}
            className="w-1/2 py-3 rounded bg-[#2A2D35] text-gray-300 hover:bg-[#35383F] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Back
          </button>
          <button
            onClick={handleEmailConnect}
            disabled={operationLoading || !email.trim()}
            className="w-1/2 py-3 bg-Red hover:bg-[#e02d37] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded transition-colors flex items-center justify-center"
          >
            {operationLoading ? <LoadingSpinner /> : null}
            Continue
          </button>
        </div>
      </motion.div>
    );
  }

  // Phone connection tab
  if (activeTab === "phone") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-md mx-auto bg-[#212428] p-6 md:p-8 rounded-lg shadow-lg"
      >
        <AnimatePresence>
          {operationError && <ErrorMessage error={operationError} />}
        </AnimatePresence>

        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold mb-2">Connect with Phone</h2>
          <p className="text-gray-400 text-sm">
            We'll send you a verification code via SMS
          </p>
        </div>

        <div className="mb-6">
          <input
            type="tel"
            placeholder="Your Phone Number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full bg-[#2A2D35] border border-[#3A3D45] rounded p-3 text-white focus:outline-none focus:border-Red focus:ring-1 focus:ring-Red transition-colors"
            disabled={operationLoading}
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setActiveTab("main")}
            disabled={operationLoading}
            className="w-1/2 py-3 rounded bg-[#2A2D35] text-gray-300 hover:bg-[#35383F] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Back
          </button>
          <button
            onClick={handlePhoneConnect}
            disabled={operationLoading || !phone.trim()}
            className="w-1/2 py-3 bg-Red hover:bg-[#e02d37] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded transition-colors flex items-center justify-center"
          >
            {operationLoading ? <LoadingSpinner /> : null}
            Continue
          </button>
        </div>
      </motion.div>
    );
  }

  // Main connection screen
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-md mx-auto bg-[#212428] p-6 md:p-8 rounded-lg shadow-lg"
    >
      <AnimatePresence>
        {operationError && <ErrorMessage error={operationError} />}
      </AnimatePresence>

      <div className="text-center mb-6">
        <WalletIcon />
        <h2 className="text-xl font-semibold mb-2">Connect Your Wallet</h2>
        <p className="text-gray-400 text-sm">
          Connect your wallet to start trading digital assets securely.
        </p>
      </div>

      <div className="space-y-3">
        <button
          onClick={handleConnect}
          disabled={operationLoading}
          className="w-full py-3 bg-Red hover:bg-[#e02d37] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded transition-colors flex items-center justify-center"
        >
          {operationLoading ? (
            <LoadingSpinner />
          ) : (
            <FaWallet className="mr-2" />
          )}
          {operationLoading ? "Connecting..." : "Connect Wallet"}
        </button>

        {showAlternatives && (
          <>
            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-[#3A3D45]"></div>
              <span className="flex-shrink px-3 text-xs text-gray-400">
                or continue with
              </span>
              <div className="flex-grow border-t border-[#3A3D45]"></div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={connectGoogle}
                disabled={operationLoading}
                className="py-3 bg-[#2A2D35] hover:bg-[#35383F] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded transition-colors flex items-center justify-center"
              >
                <FaGoogle className="mr-2" />
                Google
              </button>
              <button
                onClick={() => setActiveTab("email")}
                disabled={operationLoading}
                className="py-3 bg-[#2A2D35] hover:bg-[#35383F] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded transition-colors flex items-center justify-center"
              >
                <FaEnvelope className="mr-2" />
                Email
              </button>
              <button
                onClick={() => setActiveTab("phone")}
                disabled={operationLoading}
                className="py-3 bg-[#2A2D35] hover:bg-[#35383F] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded transition-colors flex items-center justify-center"
              >
                <FaPhone className="mr-2" />
                Phone
              </button>
              <button
                onClick={connectPasskey}
                disabled={operationLoading}
                className="py-3 bg-[#2A2D35] hover:bg-[#35383F] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded transition-colors flex items-center justify-center"
              >
                <FaFingerprint className="mr-2" />
                Passkey
              </button>
              <button
                onClick={connectGuest}
                disabled={operationLoading}
                className="col-span-2 py-3 bg-[#2A2D35] hover:bg-[#35383F] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded transition-colors flex items-center justify-center"
              >
                <FaUserSecret className="mr-2" />
                Continue as Guest
              </button>
            </div>
          </>
        )}
      </div>

      <p className="text-xs text-gray-500 mt-6 text-center">
        By connecting, you agree to our Terms of Service and Privacy Policy
      </p>
    </motion.div>
  );
};

export default memo(ConnectWallet);
