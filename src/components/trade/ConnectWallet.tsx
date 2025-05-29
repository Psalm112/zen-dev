// src/components/ConnectWallet/ConnectWallet.tsx
import React, { useState, useCallback, useMemo, memo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaWallet,
  FaGoogle,
  FaApple,
  FaFingerprint,
  FaUser,
  FaCopy,
  FaExternalLinkAlt,
  FaChevronDown,
  FaChevronUp,
  FaTimes,
  FaCheck,
  FaSpinner,
} from "react-icons/fa";
import {
  IoMail,
  IoCall,
  IoExit,
  IoWallet,
  IoRefresh,
  IoSwapHorizontal,
} from "react-icons/io5";
import {
  useWallet,
  useWalletBalance,
  useWalletNetwork,
} from "../../context/WalletContext";
import { RiUser6Line } from "react-icons/ri";

// Types and Interfaces
interface ConnectWalletProps {
  onTransactionStart?: () => void;
  onTransactionComplete?: (hash: string) => void;
  onTransactionError?: (error: string) => void;
}

interface VerificationFlowProps {
  type: "email" | "phone";
  onBack: () => void;
  onSuccess: (address: string) => void;
}

interface WalletDetailsProps {
  isOpen: boolean;
  onToggle: () => void;
}

interface BalanceDisplayProps {
  variant: "compact" | "detailed";
}

interface CurrencyDropdownProps {
  isOpen: boolean;
  onToggle: () => void;
  selectedCurrency: string;
  onCurrencyChange: (currency: string) => void;
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, staggerChildren: 0.1 },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: { duration: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 },
};

const slideVariants = {
  enter: { x: 300, opacity: 0 },
  center: { x: 0, opacity: 1 },
  exit: { x: -300, opacity: 0 },
};

// Currency Dropdown Component
const CurrencyDropdown = memo<CurrencyDropdownProps>(
  ({ isOpen, onToggle, selectedCurrency, onCurrencyChange }) => {
    const currencies = [
      { code: "USDT", symbol: "$", name: "US Dollar (USDT)" },
      { code: "CELO", symbol: "CELO", name: "Celo" },
      { code: "FIAT", symbol: "₦", name: "Nigerian Naira" },
    ];

    return (
      <div className="relative">
        <button
          onClick={onToggle}
          className="flex items-center gap-2 px-3 py-1.5 bg-[#2A2D35] rounded-lg hover:bg-[#3A3D45] transition-colors duration-200"
        >
          <span className="text-sm font-medium text-white">
            {currencies.find((c) => c.code === selectedCurrency)?.symbol}
          </span>
          {isOpen ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full mt-2 right-0 bg-[#2A2D35] rounded-lg shadow-xl border border-gray-700 z-50 min-w-[200px]"
            >
              {currencies.map((currency) => (
                <button
                  key={currency.code}
                  onClick={() => {
                    onCurrencyChange(currency.code);
                    onToggle();
                  }}
                  className={`w-full px-4 py-3 text-left hover:bg-[#3A3D45] transition-colors duration-200 first:rounded-t-lg last:rounded-b-lg ${
                    selectedCurrency === currency.code
                      ? "bg-[#3A3D45] text-[#ff343f]"
                      : "text-white"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{currency.symbol}</span>
                    <span className="text-sm text-gray-400">
                      {currency.name}
                    </span>
                  </div>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

// Balance Display Component
const BalanceDisplay = memo<BalanceDisplayProps>(({ variant }) => {
  const { balances, isLoading, refetch, formatted } = useWalletBalance();
  const [selectedCurrency, setSelectedCurrency] = useState("USDT");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const displayBalance = useMemo(() => {
    switch (selectedCurrency) {
      case "USDT":
        return formatted.usdt;
      case "CELO":
        return formatted.celo;
      case "FIAT":
        return formatted.fiat;
      default:
        return formatted.usdt;
    }
  }, [selectedCurrency, formatted]);

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  if (variant === "compact") {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <IoWallet className="text-[#ff343f]" size={16} />
          <span className="text-white font-semibold">{displayBalance}</span>
        </div>
        <CurrencyDropdown
          isOpen={isDropdownOpen}
          onToggle={() => setIsDropdownOpen(!isDropdownOpen)}
          selectedCurrency={selectedCurrency}
          onCurrencyChange={setSelectedCurrency}
        />
      </div>
    );
  }

  return (
    <motion.div
      variants={itemVariants}
      className="bg-[#2A2D35] rounded-xl p-4 space-y-4"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <IoWallet className="text-[#ff343f]" />
          Wallet Balance
        </h3>
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="p-2 hover:bg-[#3A3D45] rounded-lg transition-colors duration-200 disabled:opacity-50"
        >
          <IoRefresh
            className={`text-gray-400 ${isLoading ? "animate-spin" : ""}`}
            size={16}
          />
        </button>
      </div>

      <div className="space-y-3">
        {/* Primary Balance - USDT */}
        <div className="flex items-center justify-between p-3 bg-[#212428] rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-xs font-bold text-white">$</span>
            </div>
            <div>
              <p className="text-white font-semibold">{formatted.usdt}</p>
              <p className="text-xs text-gray-400">USDT Balance</p>
            </div>
          </div>
          <CurrencyDropdown
            isOpen={isDropdownOpen}
            onToggle={() => setIsDropdownOpen(!isDropdownOpen)}
            selectedCurrency={selectedCurrency}
            onCurrencyChange={setSelectedCurrency}
          />
        </div>

        {/* Secondary Balance - CELO (Gas) */}
        <div className="flex items-center justify-between p-3 bg-[#212428] rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
              <span className="text-xs font-bold text-white">C</span>
            </div>
            <div>
              <p className="text-white font-medium">{formatted.celo}</p>
              <p className="text-xs text-gray-400">CELO (Gas Fees)</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

// Verification Flow Component
const VerificationFlow = memo<VerificationFlowProps>(
  ({ type, onBack, onSuccess }) => {
    const [step, setStep] = useState<"input" | "verify">("input");
    const [value, setValue] = useState("");
    const [code, setCode] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { connectWithEmail, connectWithPhone } = useWallet();

    const handleSubmit = useCallback(
      async (e: React.FormEvent) => {
        e.preventDefault();
        if (!value.trim()) return;

        setIsLoading(true);
        setError(null);

        try {
          const result =
            type === "email"
              ? await connectWithEmail(value)
              : await connectWithPhone(value);

          if (result.requiresVerification) {
            setStep("verify");
          } else {
            onSuccess(result.address);
          }
        } catch (err: any) {
          setError(err.message || `Failed to send ${type} verification`);
        } finally {
          setIsLoading(false);
        }
      },
      [value, type, connectWithEmail, connectWithPhone, onSuccess]
    );

    const handleVerify = useCallback(
      async (e: React.FormEvent) => {
        e.preventDefault();
        if (!code.trim()) return;

        setIsLoading(true);
        setError(null);

        try {
          const result =
            type === "email"
              ? await connectWithEmail(value, code)
              : await connectWithPhone(value, code);

          onSuccess(result.address);
        } catch (err: any) {
          setError(err.message || "Invalid verification code");
        } finally {
          setIsLoading(false);
        }
      },
      [code, value, type, connectWithEmail, connectWithPhone, onSuccess]
    );

    const inputIcon = type === "email" ? IoMail : IoCall;
    const placeholder =
      type === "email" ? "Enter your email address" : "Enter your phone number";
    const title =
      type === "email" ? "Connect with Email" : "Connect with Phone";

    return (
      <motion.div
        variants={slideVariants}
        initial="enter"
        animate="center"
        exit="exit"
        className="space-y-6"
      >
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-[#3A3D45] rounded-lg transition-colors duration-200"
          >
            <FaTimes className="text-gray-400" size={16} />
          </button>
          <h2 className="text-xl font-bold text-white">{title}</h2>
        </div>

        {step === "input" ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <RiUser6Line
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type={type === "email" ? "email" : "tel"}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={placeholder}
                className="w-full pl-12 pr-4 py-4 bg-[#2A2D35] border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:border-[#ff343f] focus:outline-none transition-colors duration-200"
                disabled={isLoading}
                required
              />
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-[#ff343f] text-sm"
              >
                {error}
              </motion.p>
            )}

            <button
              type="submit"
              disabled={isLoading || !value.trim()}
              className="w-full py-4 bg-[#ff343f] text-white font-semibold rounded-xl hover:bg-[#e6303a] disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <FaSpinner className="animate-spin" size={16} />
                  Sending...
                </>
              ) : (
                `Send Verification Code`
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="space-y-4">
            <div className="text-center space-y-2">
              <p className="text-gray-300">We sent a verification code to</p>
              <p className="text-white font-medium">{value}</p>
            </div>

            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter 6-digit code"
              className="w-full px-4 py-4 bg-[#2A2D35] border border-gray-700 rounded-xl text-white text-center text-2xl tracking-widest placeholder-gray-400 focus:border-[#ff343f] focus:outline-none transition-colors duration-200"
              maxLength={6}
              disabled={isLoading}
              required
            />

            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-[#ff343f] text-sm text-center"
              >
                {error}
              </motion.p>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep("input")}
                className="flex-1 py-4 bg-[#2A2D35] text-white font-semibold rounded-xl hover:bg-[#3A3D45] transition-colors duration-200"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isLoading || code.length !== 6}
                className="flex-1 py-4 bg-[#ff343f] text-white font-semibold rounded-xl hover:bg-[#e6303a] disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <FaSpinner className="animate-spin" size={16} />
                    Verifying...
                  </>
                ) : (
                  <>
                    <FaCheck size={16} />
                    Verify
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </motion.div>
    );
  }
);

// Wallet Details Component
const WalletDetails = memo<WalletDetailsProps>(({ isOpen, onToggle }) => {
  const { account, walletType, chainId, switchChain } = useWallet();
  const { networkName, isTestnet } = useWalletNetwork();
  const [copied, setCopied] = useState(false);

  const copyAddress = useCallback(async () => {
    if (!account) return;

    try {
      await navigator.clipboard.writeText(account);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy address:", err);
    }
  }, [account]);

  const formatAddress = useCallback((address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }, []);

  const openExplorer = useCallback(() => {
    if (!account) return;

    const explorerUrl = isTestnet
      ? "https://alfajores-blockscout.celo-testnet.org"
      : "https://explorer.celo.org";

    window.open(
      `${explorerUrl}/address/${account}`,
      "_blank",
      "noopener,noreferrer"
    );
  }, [account, isTestnet]);

  if (!account) return null;

  return (
    <motion.div
      variants={itemVariants}
      className="bg-[#2A2D35] rounded-xl overflow-hidden"
    >
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between hover:bg-[#3A3D45] transition-colors duration-200"
      >
        <div className="flex items-center gap-3">
          <FaWallet className="text-[#ff343f]" size={16} />
          <span className="text-white font-medium">Wallet Details</span>
        </div>
        {isOpen ? <FaChevronUp /> : <FaChevronDown />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-0 space-y-4">
              {/* Address */}
              <div className="flex items-center justify-between p-3 bg-[#212428] rounded-lg">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">
                    Address
                  </p>
                  <p className="text-white font-mono">
                    {formatAddress(account)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={copyAddress}
                    className="p-2 hover:bg-[#3A3D45] rounded-lg transition-colors duration-200"
                    title="Copy address"
                  >
                    {copied ? (
                      <FaCheck className="text-green-500" size={14} />
                    ) : (
                      <FaCopy className="text-gray-400" size={14} />
                    )}
                  </button>
                  <button
                    onClick={openExplorer}
                    className="p-2 hover:bg-[#3A3D45] rounded-lg transition-colors duration-200"
                    title="View on explorer"
                  >
                    <FaExternalLinkAlt className="text-gray-400" size={14} />
                  </button>
                </div>
              </div>

              {/* Network */}
              <div className="flex items-center justify-between p-3 bg-[#212428] rounded-lg">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">
                    Network
                  </p>
                  <p className="text-white font-medium">{networkName}</p>
                </div>
                {isTestnet && (
                  <button
                    onClick={() => switchChain(42220)}
                    className="px-3 py-1.5 bg-[#ff343f] text-white text-xs font-medium rounded-lg hover:bg-[#e6303a] transition-colors duration-200"
                  >
                    Switch to Mainnet
                  </button>
                )}
              </div>

              {/* Wallet Type */}
              <div className="p-3 bg-[#212428] rounded-lg">
                <p className="text-xs text-gray-400 uppercase tracking-wide">
                  Wallet Type
                </p>
                <p className="text-white font-medium capitalize">
                  {walletType}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

// Main ConnectWallet Component
const ConnectWallet = memo<ConnectWalletProps>(
  ({ onTransactionStart, onTransactionComplete, onTransactionError }) => {
    const [currentView, setCurrentView] = useState<
      "connect" | "email" | "phone"
    >("connect");
    const [showDetails, setShowDetails] = useState(false);

    const {
      isConnected,
      isConnecting,
      account,
      walletType,
      availableWallets,
      recommendedWallet,
      connectWallet,
      connectRecommended,
      connectWithGoogle,
      connectWithApple,
      connectWithPasskey,
      connectAsGuest,
      disconnectWallet,
      deviceInfo,
      error,
      clearError,
    } = useWallet();

    // Connection handlers
    const handleWalletConnect = useCallback(
      async (type: string | null) => {
        if (type === null) return;
        try {
          clearError();
          const wallet = availableWallets.find((w) => w.type === type);
          if (!wallet) return;

          await connectWallet(wallet.type, deviceInfo.preferredConnection);
        } catch (err: any) {
          console.error("Connection failed:", err);
        }
      },
      [
        availableWallets,
        connectWallet,
        deviceInfo.preferredConnection,
        clearError,
      ]
    );

    const handleRecommendedConnect = useCallback(async () => {
      try {
        clearError();
        await connectRecommended();
      } catch (err: any) {
        console.error("Recommended connection failed:", err);
      }
    }, [connectRecommended, clearError]);

    const handleSocialConnect = useCallback(
      async (provider: string) => {
        try {
          clearError();
          switch (provider) {
            case "google":
              await connectWithGoogle();
              break;
            case "apple":
              if (deviceInfo.isIOS) {
                await connectWithApple();
              }
              break;
            case "passkey":
              if (deviceInfo.hasWebAuthn) {
                await connectWithPasskey();
              }
              break;
            case "guest":
              await connectAsGuest();
              break;
          }
        } catch (err: any) {
          console.error("Social connection failed:", err);
        }
      },
      [
        connectWithGoogle,
        connectWithApple,
        connectWithPasskey,
        connectAsGuest,
        deviceInfo,
        clearError,
      ]
    );

    const handleDisconnect = useCallback(async () => {
      try {
        await disconnectWallet();
        setShowDetails(false);
        setCurrentView("connect");
      } catch (err: any) {
        console.error("Disconnect failed:", err);
      }
    }, [disconnectWallet]);

    const handleVerificationSuccess = useCallback((address: string) => {
      setCurrentView("connect");
    }, []);

    // Connected state
    if (isConnected && account) {
      return (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-4"
        >
          {/* Connected Header */}
          <motion.div
            variants={itemVariants}
            className="flex items-center justify-between p-4 bg-[#2A2D35] rounded-xl"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                <FaCheck className="text-white" size={16} />
              </div>
              <div>
                <p className="text-white font-semibold">Wallet Connected</p>
                <p className="text-gray-400 text-sm">
                  {account.slice(0, 6)}...{account.slice(-4)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <BalanceDisplay variant="compact" />
              <button
                onClick={handleDisconnect}
                className="p-2.5 bg-[#ff343f] hover:bg-[#e6303a] rounded-lg transition-colors duration-200"
                title="Disconnect wallet"
              >
                <IoExit className="text-white" size={16} />
              </button>
            </div>
          </motion.div>

          {/* Balance Details */}
          <BalanceDisplay variant="detailed" />

          {/* Wallet Details */}
          <WalletDetails
            isOpen={showDetails}
            onToggle={() => setShowDetails(!showDetails)}
          />
        </motion.div>
      );
    }

    // Connection interface
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="bg-[#2A2D35] rounded-2xl p-6 max-w-md mx-auto"
      >
        <AnimatePresence mode="wait">
          {currentView === "connect" ? (
            <motion.div
              key="connect"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="space-y-6"
            >
              {/* Header */}
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-white">
                  Connect Wallet
                </h2>
                <p className="text-gray-400">
                  Choose your preferred connection method
                </p>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl"
                >
                  <p className="text-red-400 text-sm text-center">{error}</p>
                </motion.div>
              )}

              {/* Recommended Wallet */}
              {recommendedWallet && (
                <motion.button
                  variants={itemVariants}
                  onClick={handleRecommendedConnect}
                  disabled={isConnecting}
                  className="w-full p-4 bg-[#ff343f] hover:bg-[#e6303a] disabled:bg-gray-600 text-white font-semibold rounded-xl transition-colors duration-200 flex items-center justify-center gap-3"
                >
                  {isConnecting ? (
                    <>
                      <FaSpinner className="animate-spin" size={20} />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <img
                        src={recommendedWallet.icon}
                        alt={recommendedWallet.name}
                        className="w-6 h-6"
                      />
                      Connect with {recommendedWallet.name}
                    </>
                  )}
                </motion.button>
              )}

              {/* Alternative Wallets */}
              <div className="space-y-3">
                <p className="text-gray-400 text-sm text-center">
                  Or connect with
                </p>

                <div className="grid grid-cols-2 gap-3">
                  {availableWallets
                    .filter((w) => w.type !== recommendedWallet?.type)
                    .slice(0, 4)
                    .map((wallet) => (
                      <motion.button
                        key={wallet.type}
                        variants={itemVariants}
                        onClick={() => handleWalletConnect(wallet.type)}
                        disabled={isConnecting}
                        className="p-4 bg-[#212428] hover:bg-[#3A3D45] disabled:bg-gray-700 border border-gray-700 rounded-xl transition-colors duration-200 flex flex-col items-center gap-2"
                      >
                        <img
                          src={wallet.icon}
                          alt={wallet.name}
                          className="w-8 h-8"
                        />
                        <span className="text-white text-sm font-medium">
                          {wallet.name}
                        </span>
                      </motion.button>
                    ))}
                </div>
              </div>

              {/* Social Login Options */}
              <div className="space-y-3">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-700"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-[#2A2D35] text-gray-400">
                      Quick Connect
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <motion.button
                    variants={itemVariants}
                    onClick={() => handleSocialConnect("google")}
                    disabled={isConnecting}
                    className="p-4 bg-[#212428] hover:bg-[#3A3D45] border border-gray-700 rounded-xl transition-colors duration-200 flex items-center justify-center gap-2"
                  >
                    <FaGoogle className="text-red-500" size={16} />
                    <span className="text-white text-sm font-medium">
                      Google
                    </span>
                  </motion.button>

                  {deviceInfo.isIOS && (
                    <motion.button
                      variants={itemVariants}
                      onClick={() => handleSocialConnect("apple")}
                      disabled={isConnecting}
                      className="p-4 bg-[#212428] hover:bg-[#3A3D45] border border-gray-700 rounded-xl transition-colors duration-200 flex items-center justify-center gap-2"
                    >
                      <FaApple className="text-white" size={16} />
                      <span className="text-white text-sm font-medium">
                        Apple
                      </span>
                    </motion.button>
                  )}

                  <motion.button
                    variants={itemVariants}
                    onClick={() => setCurrentView("email")}
                    disabled={isConnecting}
                    className="p-4 bg-[#212428] hover:bg-[#3A3D45] border border-gray-700 rounded-xl transition-colors duration-200 flex items-center justify-center gap-2"
                  >
                    <IoMail className="text-blue-500" size={16} />
                    <span className="text-white text-sm font-medium">
                      Email
                    </span>
                  </motion.button>

                  <motion.button
                    variants={itemVariants}
                    onClick={() => setCurrentView("phone")}
                    disabled={isConnecting}
                    className="p-4 bg-[#212428] hover:bg-[#3A3D45] border border-gray-700 rounded-xl transition-colors duration-200 flex items-center justify-center gap-2"
                  >
                    <IoCall className="text-green-500" size={16} />
                    <span className="text-white text-sm font-medium">
                      Phone
                    </span>
                  </motion.button>

                  {deviceInfo.hasWebAuthn && (
                    <motion.button
                      variants={itemVariants}
                      onClick={() => handleSocialConnect("passkey")}
                      disabled={isConnecting}
                      className="p-4 bg-[#212428] hover:bg-[#3A3D45] border border-gray-700 rounded-xl transition-colors duration-200 flex items-center justify-center gap-2"
                    >
                      <FaFingerprint className="text-purple-500" size={16} />
                      <span className="text-white text-sm font-medium">
                        Passkey
                      </span>
                    </motion.button>
                  )}

                  <motion.button
                    variants={itemVariants}
                    onClick={() => handleSocialConnect("guest")}
                    disabled={isConnecting}
                    className="p-4 bg-[#212428] hover:bg-[#3A3D45] border border-gray-700 rounded-xl transition-colors duration-200 flex items-center justify-center gap-2"
                  >
                    <FaUser className="text-gray-500" size={16} />
                    <span className="text-white text-sm font-medium">
                      Guest
                    </span>
                  </motion.button>
                </div>
              </div>

              {/* Security Notice */}
              <motion.div
                variants={itemVariants}
                className="p-4 bg-[#212428] border border-gray-700 rounded-xl"
              >
                <p className="text-gray-400 text-xs text-center">
                  Your wallet connection is secured with end-to-end encryption.
                  We never store your private keys or personal data.
                </p>
              </motion.div>
            </motion.div>
          ) : currentView === "email" ? (
            <VerificationFlow
              key="email"
              type="email"
              onBack={() => setCurrentView("connect")}
              onSuccess={handleVerificationSuccess}
            />
          ) : (
            <VerificationFlow
              key="phone"
              type="phone"
              onBack={() => setCurrentView("connect")}
              onSuccess={handleVerificationSuccess}
            />
          )}
        </AnimatePresence>
      </motion.div>
    );
  }
);

// Transaction Confirmation Component
interface TransactionConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  transactionType: "escrow" | "delivery";
  amount?: string;
  recipient?: string;
  isLoading?: boolean;
}

const TransactionConfirmation = memo<TransactionConfirmationProps>(
  ({
    isOpen,
    onClose,
    onConfirm,
    transactionType,
    amount,
    recipient,
    isLoading = false,
  }) => {
    const { balances, formatted } = useWalletBalance();
    const [hasInsufficientBalance, setHasInsufficientBalance] = useState(false);

    const transactionDetails = useMemo(() => {
      const isEscrow = transactionType === "escrow";
      return {
        title: isEscrow ? "Confirm Escrow Payment" : "Confirm Delivery",
        description: isEscrow
          ? "Lock funds in escrow until delivery confirmation"
          : "Confirm delivery and release escrowed funds",
        actionText: isEscrow ? "Lock in Escrow" : "Release Funds",
        icon: isEscrow ? IoWallet : FaCheck,
        color: isEscrow ? "text-yellow-500" : "text-green-500",
      };
    }, [transactionType]);

    useEffect(() => {
      if (amount && balances) {
        const amountNum = parseFloat(amount);
        const balanceNum = parseFloat(balances.usdt);
        setHasInsufficientBalance(amountNum > balanceNum);
      }
    }, [amount, balances]);

    if (!isOpen) return null;

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-[#2A2D35] rounded-2xl p-6 w-full max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <transactionDetails.icon
                className={transactionDetails.color}
                size={24}
              />
              <h3 className="text-xl font-bold text-white">
                {transactionDetails.title}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[#3A3D45] rounded-lg transition-colors duration-200"
            >
              <FaTimes className="text-gray-400" size={16} />
            </button>
          </div>

          <div className="space-y-4 mb-6">
            <p className="text-gray-300 text-sm">
              {transactionDetails.description}
            </p>

            {amount && (
              <div className="p-4 bg-[#212428] rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Amount</span>
                  <span className="text-white font-semibold text-lg">
                    ${amount} USDT
                  </span>
                </div>
              </div>
            )}

            {recipient && (
              <div className="p-4 bg-[#212428] rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Recipient</span>
                  <span className="text-white font-mono text-sm">
                    {recipient.slice(0, 6)}...{recipient.slice(-4)}
                  </span>
                </div>
              </div>
            )}

            <div className="p-4 bg-[#212428] rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400">Your Balance</span>
                <span className="text-white font-medium">
                  {formatted?.usdt || "0.00"} USDT
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Gas Fee (Est.)</span>
                <span className="text-white font-medium">
                  {formatted?.celo || "0.00"} CELO
                </span>
              </div>
            </div>

            {hasInsufficientBalance && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg"
              >
                <p className="text-red-400 text-sm">
                  Insufficient balance. Please top up your wallet.
                </p>
              </motion.div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 py-3 bg-[#212428] text-white font-semibold rounded-xl hover:bg-[#3A3D45] disabled:opacity-50 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading || hasInsufficientBalance}
              className="flex-1 py-3 bg-[#ff343f] text-white font-semibold rounded-xl hover:bg-[#e6303a] disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <FaSpinner className="animate-spin" size={16} />
                  Processing...
                </>
              ) : (
                transactionDetails.actionText
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    );
  }
);

// Enhanced ConnectWallet with Transaction Support
interface EnhancedConnectWalletProps extends ConnectWalletProps {
  showTransactionModal?: boolean;
  transactionType?: "escrow" | "delivery";
  transactionAmount?: string;
  transactionRecipient?: string;
  onTransactionModalClose?: () => void;
}

const EnhancedConnectWallet = memo<EnhancedConnectWalletProps>((props) => {
  const {
    showTransactionModal = false,
    transactionType = "escrow",
    transactionAmount,
    transactionRecipient,
    onTransactionModalClose,
    onTransactionStart,
    onTransactionComplete,
    onTransactionError,
    ...connectWalletProps
  } = props;

  const [isTransactionLoading, setIsTransactionLoading] = useState(false);

  const handleTransactionConfirm = useCallback(async () => {
    if (!onTransactionStart) return;

    setIsTransactionLoading(true);

    try {
      onTransactionStart();

      // Simulate transaction processing
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const mockTxHash = `0x${Math.random().toString(16).slice(2, 66)}`;
      onTransactionComplete?.(mockTxHash);
      onTransactionModalClose?.();
    } catch (error: any) {
      onTransactionError?.(error.message || "Transaction failed");
    } finally {
      setIsTransactionLoading(false);
    }
  }, [
    onTransactionStart,
    onTransactionComplete,
    onTransactionError,
    onTransactionModalClose,
  ]);

  return (
    <>
      <ConnectWallet {...connectWalletProps} />

      <AnimatePresence>
        {showTransactionModal && (
          <TransactionConfirmation
            isOpen={showTransactionModal}
            onClose={onTransactionModalClose || (() => {})}
            onConfirm={handleTransactionConfirm}
            transactionType={transactionType}
            amount={transactionAmount}
            recipient={transactionRecipient}
            isLoading={isTransactionLoading}
          />
        )}
      </AnimatePresence>
    </>
  );
});

// Set display names for better debugging
ConnectWallet.displayName = "ConnectWallet";
VerificationFlow.displayName = "VerificationFlow";
BalanceDisplay.displayName = "BalanceDisplay";
WalletDetails.displayName = "WalletDetails";
CurrencyDropdown.displayName = "CurrencyDropdown";
TransactionConfirmation.displayName = "TransactionConfirmation";
EnhancedConnectWallet.displayName = "EnhancedConnectWallet";

export default EnhancedConnectWallet;
export { ConnectWallet, TransactionConfirmation };
