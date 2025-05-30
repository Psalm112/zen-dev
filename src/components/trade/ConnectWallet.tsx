// "use client";
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
  FaApple,
  FaQrcode,
  FaCopy,
  FaCheck,
  FaExternalLinkAlt,
} from "react-icons/fa";
import { SiMetamask } from "react-icons/si";
import { IoChevronDown, IoChevronBack } from "react-icons/io5";
import TransactionConfirmation from "./TransactionConfirmation";
import ConfirmDelivery from "./ConfirmDelivery";
import { pendingTransactionProps } from "../../utils/types";
import { useRef } from "react";
import { useWallet } from "../../context/WalletContext";
import { WalletType, ConnectionMethod } from "../../utils/types/wallet.types";
import { useClickOutside } from "../../utils/hooks/useClickOutside";
import { useWalletBalance } from "../../utils/hooks/useWalletBalance";

export interface ConnectWalletProps {
  showAlternatives?: boolean;
  pendingTransaction?: pendingTransactionProps | null;
  onTransactionComplete?: (success: boolean) => void;
}

// Animation variants for better performance
const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" }
  },
  exit: { 
    opacity: 0, 
    y: -20,
    transition: { duration: 0.2, ease: "easeIn" }
  }
};

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? 300 : -300,
    opacity: 0
  })
};

// Memoized components for better performance
const ErrorMessage = memo(({ error, onDismiss }: { error: string; onDismiss?: () => void }) => (
  <motion.div
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-md mb-4 text-sm flex items-center justify-between"
  >
    <span>{error}</span>
    {onDismiss && (
      <button
        onClick={onDismiss}
        className="ml-2 text-red-400 hover:text-red-300 transition-colors"
      >
        ×
      </button>
    )}
  </motion.div>
));

const LoadingSpinner = memo(({ className = "" }: { className?: string }) => (
  <FaSpinner className={`animate-spin ${className}`} />
));

const WalletIcon = memo(({ type, className = "text-3xl" }: { type?: WalletType; className?: string }) => {
  const iconMap = {
    metamask: SiMetamask,
    smart: FaWallet,
    walletconnect: FaQrcode,
  };

  const Icon = type && iconMap[type] ? iconMap[type] : FaWallet;
  
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      transition={{ type: "spring", stiffness: 400, damping: 10 }}
      className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-Red/10 text-Red mb-4"
    >
      <Icon className={className} />
    </motion.div>
  );
});

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
          <motion.div
            animate={{ rotate: showCurrencyDropdown ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <IoChevronDown className="w-3 h-3 ml-1" />
          </motion.div>
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

const WalletButton = memo(({
  wallet,
  onClick,
  disabled,
  isLoading,
  className = ""
}: {
  wallet: any;
  onClick: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  className?: string;
}) => {
  const baseClass = `
    relative overflow-hidden py-3 px-4 rounded-lg transition-all duration-200 
    flex items-center justify-center font-medium
    ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-[0.98]'}
    ${className}
  `;

  return (
    <motion.button
      whileHover={!disabled ? { y: -1 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      onClick={onClick}
      disabled={disabled}
      className={baseClass}
    >
      <div className="flex items-center space-x-2">
        {isLoading ? (
          <LoadingSpinner className="w-4 h-4" />
        ) : (
          wallet.icon && <wallet.icon className="w-4 h-4" />
        )}
        <span>{wallet.name}</span>
      </div>
      {wallet.requiresDownload && (
        <FaExternalLinkAlt className="w-3 h-3 ml-2 opacity-60" />
      )}
    </motion.button>
  );
});

const ConnectWallet: FC<ConnectWalletProps> = ({
  showAlternatives = true,
  pendingTransaction = null,
  onTransactionComplete = () => {},
}) => {
  const {
    isConnected,
    account,
    chainId,
    isConnecting,
    error,
    clearError,
    availableWallets,
    recommendedWallet,
    deviceInfo,
    connectWallet,
    connectRecommended,
    disconnect,
    openWalletWithFallback,
  } = useWallet();

  const { balances, isLoading: balanceLoading } = useWalletBalance();

  // Local state
  const [activeView, setActiveView] = useState<"main" | "wallets" | "email" | "phone" | "verification">("main");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [authMethod, setAuthMethod] = useState<"email" | "phone" | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<WalletType | null>(null);
  const [direction, setDirection] = useState(0);

  const currencyDropdownRef = useRef<HTMLDivElement>(null);

  // Custom hooks
  useClickOutside(currencyDropdownRef, () => setShowCurrencyDropdown(false));

  // Memoized values
  const shortenedAddress = useMemo(
    () => (account ? `${account.slice(0, 6)}...${account.slice(-4)}` : ""),
    [account]
  );

  const displayBalance = useMemo(() => {
    if (balanceLoading) return "Loading...";
    
    switch (true) {
      case balances?.fiat && parseFloat(balances.fiat) > 0:
        return `₦${parseFloat(balances.fiat).toLocaleString()}`;
      case balances?.usdt && parseFloat(balances.usdt) > 0:
        return `${parseFloat(balances.usdt).toFixed(2)} USDT`;
      case balances?.celo && parseFloat(balances.celo) > 0:
        return `${parseFloat(balances.celo).toFixed(4)} CELO`;
      default:
        return "0.00";
    }
  }, [balances, balanceLoading]);

  // Handlers
  const handleConnect = useCallback(async (walletType: WalletType, method?: ConnectionMethod) => {
    try {
      setSelectedWallet(walletType);
      await connectWallet(walletType, method);
    } catch (error: any) {
      console.error("Connection failed:", error);
      if (error?.message?.includes("download") || error?.message?.includes("install")) {
        openWalletWithFallback(walletType);
      }
    } finally {
      setSelectedWallet(null);
    }
  }, [connectWallet, openWalletWithFallback]);

  const handleQuickConnect = useCallback(async () => {
    if (!recommendedWallet) return;
    await handleConnect(recommendedWallet.type, deviceInfo.preferredConnection);
  }, [recommendedWallet, deviceInfo.preferredConnection, handleConnect]);

  const handleEmailConnect = useCallback(async () => {
    if (!email.trim()) return;
    try {
      const result = await connectWallet("smart", "embedded");
      if (result.requiresVerification) {
        setAuthMethod("email");
        navigateToView("verification", 1);
      }
    } catch (error) {
      console.error("Email connection failed:", error);
    }
  }, [email, connectWallet]);

  const handlePhoneConnect = useCallback(async () => {
    if (!phone.trim()) return;
    try {
      const result = await connectWallet("smart", "embedded");
      if (result.requiresVerification) {
        setAuthMethod("phone");
        navigateToView("verification", 1);
      }
    } catch (error) {
      console.error("Phone connection failed:", error);
    }
  }, [phone, connectWallet]);

  const handleCopyAddress = useCallback(async () => {
    if (!account) return;
    
    try {
      await navigator.clipboard.writeText(account);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    } catch (err) {
      console.error("Failed to copy address:", err);
    }
  }, [account]);

  const navigateToView = useCallback((view: typeof activeView, dir: number = 0) => {
    setDirection(dir);
    setActiveView(view);
  }, []);

  const resetToMain = useCallback(() => {
    setAuthMethod(null);
    setEmail("");
    setPhone("");
    setVerificationCode("");
    navigateToView("main", -1);
    clearError();
  }, [clearError]);

  // Effects
  useEffect(() => {
    if (error) {
      const timer = setTimeout(clearError, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  // Connected state
  if (isConnected && account) {
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
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
                <p className="text-gray-400 text-sm mb-2">Address</p>
                <div 
                  className="flex items-center justify-between cursor-pointer group"
                  onClick={handleCopyAddress}
                >
                  <p className="text-white font-mono text-sm break-all group-hover:text-Red transition-colors">
                    {account}
                  </p>
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className="ml-2 text-gray-400 group-hover:text-Red transition-colors"
                  >
                    {copiedAddress ? (
                      <FaCheck className="w-4 h-4 text-green-400" />
                    ) : (
                      <FaCopy className="w-4 h-4" />
                    )}
                  </motion.div>
                </div>
              </div>

              <div className="bg-[#2A2D35] p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-gray-400 text-sm">Balance</p>
                  <CurrencyDropdown
                    displayCurrency="AUTO"
                    setDisplayCurrency={() => {}}
                    showCurrencyDropdown={showCurrencyDropdown}
                    setShowCurrencyDropdown={setShowCurrencyDropdown}
                    currencyDropdownRef={currencyDropdownRef}
                  />
                </div>
                <p className="text-white font-semibold text-lg">{displayBalance}</p>
                <p className="text-gray-500 text-xs mt-1">
                  Gas: {balances?.celo ? `${parseFloat(balances.celo).toFixed(4)} CELO` : "Loading..."}
                </p>
              </div>

              <div className="bg-[#2A2D35] p-4 rounded-lg">
                <p className="text-gray-400 text-sm">Network</p>
                <p className="text-white">
                  {chainId === 42220 ? "Celo Mainnet" : "Celo Alfajores Testnet"}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDetails(false)}
                  className="flex-1 py-3 bg-[#2A2D35] hover:bg-[#35383F] text-white rounded transition-colors"
                >
                  Hide Details
                </button>
                <button
                  onClick={disconnect}
                  disabled={isConnecting}
                  className="flex-1 py-3 bg-Red hover:bg-[#e02d37] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded transition-colors flex items-center justify-center"
                >
                  {isConnecting ? (
                    <LoadingSpinner className="w-4 h-4 mr-2" />
                  ) : (
                    <FaSignOutAlt className="mr-2" />
                  )}
                  Sign Out
                </button>
              </div>
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
              <div className="bg-[#2A2D35] p-4 rounded-lg text-center">
                <p className="text-white font-semibold text-lg mb-1">{displayBalance}</p>
                <p className="text-gray-400 text-sm">Available Balance</p>
              </div>

              <button
                onClick={() => setShowDetails(true)}
                className="w-full py-3 bg-[#2A2D35] hover:bg-[#35383F] text-white rounded transition-colors"
              >
                View Details
              </button>

              <button
                onClick={disconnect}
                disabled={isConnecting}
                className="w-full py-3 bg-Red hover:bg-[#e02d37] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded transition-colors flex items-center justify-center"
              >
                {isConnecting ? (
                  <LoadingSpinner className="w-4 h-4 mr-2" />
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

  // Main connection interface with multi-view support
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="max-w-md mx-auto bg-[#212428] p-6 md:p-8 rounded-lg shadow-lg overflow-hidden"
    >
      <AnimatePresence>
        {error && (
          <ErrorMessage 
            error={error} 
            onDismiss={clearError}
          />
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait" custom={direction}>
        {/* Main View */}
        {activeView === "main" && (
          <motion.div
            key="main"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="text-center mb-6">
              <WalletIcon />
              <h2 className="text-xl font-semibold mb-2">Connect Your Wallet</h2>
              <p className="text-gray-400 text-sm">
                {deviceInfo.isMobile 
                  ? "Choose your preferred connection method"
                  : "Connect your wallet to start trading digital assets securely"
                }
              </p>
            </div>

            <div className="space-y-3">
              {/* Quick Connect - Recommended Wallet */}
              {recommendedWallet && (
                <WalletButton
                  wallet={{
                    ...recommendedWallet,
                    name: `Connect with ${recommendedWallet.name}`,
                    icon: recommendedWallet.type === "metamask" ? SiMetamask : FaWallet
                  }}
                  onClick={handleQuickConnect}
                  disabled={isConnecting}
                  isLoading={isConnecting && selectedWallet === recommendedWallet.type}
                  className="w-full bg-Red hover:bg-[#e02d37] text-white"
                />
              )}

              {showAlternatives && (
                <>
                  <div className="relative flex items-center py-2">
                    <div className="flex-grow border-t border-[#3A3D45]"></div>
                    <span className="flex-shrink px-3 text-xs text-gray-400">
                      or choose another option
                    </span>
                    <div className="flex-grow border-t border-[#3A3D45]"></div>
                  </div>

                  {/* Social & Smart Wallet Options */}
                  <div className="grid grid-cols-2 gap-3">
                    <WalletButton
                      wallet={{ name: "Google", icon: FaGoogle }}
                      onClick={() => handleConnect("smart", "embedded")}
                      disabled={isConnecting}
                      isLoading={isConnecting && selectedWallet === "smart"}
                      className="bg-[#2A2D35] hover:bg-[#35383F] text-white"
                    />
                    
                    {deviceInfo.isIOS && (
                      <WalletButton
                        wallet={{ name: "Apple", icon: FaApple }}
                        onClick={() => handleConnect("smart", "embedded")}
                        disabled={isConnecting}
                        isLoading={isConnecting && selectedWallet === "smart"}
                        className="bg-[#2A2D35] hover:bg-[#35383F] text-white"
                      />
                    )}
                    
                    <WalletButton
                      wallet={{ name: "Email", icon: FaEnvelope }}
                      onClick={() => navigateToView("email", 1)}
                      disabled={isConnecting}
                      className="bg-[#2A2D35] hover:bg-[#35383F] text-white"
                    />
                    
                    <WalletButton
                      wallet={{ name: "Phone", icon: FaPhone }}
                      onClick={() => navigateToView("phone", 1)}
                      disabled={isConnecting}
                      className="bg-[#2A2D35] hover:bg-[#35383F] text-white"
                    />
                    
                    <WalletButton
                      wallet={{ name: "Passkey", icon: FaFingerprint }}
                      onClick={() => handleConnect("smart", "embedded")}
                      disabled={isConnecting}
                      isLoading={isConnecting && selectedWallet === "smart"}
                      className="bg-[#2A2D35] hover:bg-[#35383F] text-white"
                    />
                    
                    <WalletButton
                      wallet={{ name: "Guest", icon: FaUserSecret }}
                      onClick={() => handleConnect("smart", "embedded")}
                      disabled={isConnecting}
                      isLoading={isConnecting && selectedWallet === "smart"}
                      className="bg-[#2A2D35] hover:bg-[#35383F] text-white"
                    />
                  </div>

                  {/* All Wallets Button */}
                  {availableWallets.length > 1 && (
                    <button
                      onClick={() => navigateToView("wallets", 1)}
                      className="w-full py-3 bg-[#2A2D35] hover:bg-[#35383F] text-white rounded transition-colors flex items-center justify-center"
                    >
                      <FaWallet className="mr-2" />
                      All Wallets ({availableWallets.length})
                    </button>
                  )}
                </>
              )}
            </div>

            <p className="text-xs text-gray-500 mt-6 text-center">
              By connecting, you agree to our Terms of Service and Privacy Policy
            </p>
          </motion.div>
        )}

        {/* Wallets List View */}
        {activeView === "wallets" && (
          <motion.div
            key="wallets"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="flex items-center mb-6">
              <button
                onClick={() => navigateToView("main", -1)}
                className="mr-3 p-2 hover:bg-[#2A2D35] rounded-lg transition-colors"
              >
                <IoChevronBack className="w-5 h-5 text-gray-400" />
              </button>
              <div>
                <h2 className="text-xl font-semibold">All Wallets</h2>
                <p className="text-gray-400 text-sm">Choose your wallet</p>
              </div>
            </div>

            <div className="space-y-3">
              {availableWallets.map((wallet) => (
                <div key={wallet.type} className="relative">
                  <WalletButton
                    wallet={{
                      ...wallet,
                      icon: wallet.type === "metamask" ? SiMetamask : FaWallet
                    }}
                    onClick={() => handleConnect(wallet.type, wallet.supportedMethods[0])}
                    disabled={isConnecting}
                    isLoading={isConnecting && selectedWallet === wallet.type}
                    className={`
                      w-full justify-between
                      ${wallet.recommended 
                        ? "bg-Red/10 border border-Red/30 text-white hover:bg-Red/20" 
                        : "bg-[#2A2D35] hover:bg-[#35383F] text-white"
                      }
                    `}
                  />
                  {wallet.recommended && (
                    <div className="absolute -top-2 -right-2 bg-Red text-white text-xs px-2 py-1 rounded-full">
                      Recommended
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Email Connection View */}
        {activeView === "email" && (
          <motion.div
            key="email"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="flex items-center mb-6">
              <button
                onClick={() => navigateToView("main", -1)}
                className="mr-3 p-2 hover:bg-[#2A2D35] rounded-lg transition-colors"
              >
                <IoChevronBack className="w-5 h-5 text-gray-400" />
              </button>
              <div>
                <h2 className="text-xl font-semibold">Connect with Email</h2>
                <p className="text-gray-400 text-sm">We'll send you a verification code</p>
              </div>
            </div>

            <div className="space-y-4">
              <input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#2A2D35] border border-[#3A3D45] rounded-lg p-4 text-white focus:outline-none focus:border-Red focus:ring-1 focus:ring-Red transition-colors"
                disabled={isConnecting}
                autoFocus
              />

              <button
                onClick={handleEmailConnect}
                disabled={isConnecting || !email.trim()}
                className="w-full py-4 bg-Red hover:bg-[#e02d37] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center font-medium"
              >
                {isConnecting ? (
                  <LoadingSpinner className="w-4 h-4 mr-2" />
                ) : (
                  <FaEnvelope className="mr-2" />
                )}
                Continue with Email
              </button>
            </div>
          </motion.div>
        )}

        {/* Phone Connection View */}
        {activeView === "phone" && (
          <motion.div
            key="phone"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="flex items-center mb-6">
              <button
                onClick={() => navigateToView("main", -1)}
                className="mr-3 p-2 hover:bg-[#2A2D35] rounded-lg transition-colors"
              >
                <IoChevronBack className="w-5 h-5 text-gray-400" />
              </button>
              <div>
                <h2 className="text-xl font-semibold">Connect with Phone</h2>
                <p className="text-gray-400 text-sm">We'll send you a verification code via SMS</p>
              </div>
            </div>

            <div className="space-y-4">
              <input
                type="tel"
                placeholder="Enter your phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-[#2A2D35] border border-[#3A3