"use client";
import { useState, useRef, RefObject, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaSignOutAlt, FaWallet, FaSync } from "react-icons/fa";
import {
  useWallet,
  useWalletStatus,
  useWalletPayments,
} from "../../context/WalletContext";
import {
  WalletIcon,
  CurrencyDropdown,
  CopyButton,
  ErrorMessage,
  SuccessMessage,
} from "./ui";
import WalletConnectionButton from "./buttons/WalletConnectionButton";

const ConnectedWalletView = () => {
  const { disconnect, refreshBalance, clearError, chainId } = useWallet();
  const { account, walletType, error } = useWalletStatus();
  const { balances, isLoadingBalance } = useWalletPayments();

  // Local state
  const [showDetails, setShowDetails] = useState(false);
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [displayCurrency, setDisplayCurrency] = useState<
    "USDT" | "CELO" | "FIAT"
  >("USDT");
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const currencyDropdownRef = useRef<HTMLDivElement>(
    null
  ) as RefObject<HTMLDivElement>;

  // Memoized values
  const shortenedAddress = useMemo(
    () => (account ? `${account.slice(0, 6)}...${account.slice(-4)}` : ""),
    [account]
  );

  const formattedBalance = useMemo(() => {
    switch (displayCurrency) {
      case "USDT":
        return `${parseFloat(balances.usdt).toFixed(2)} USDT`;
      case "CELO":
        return `${parseFloat(balances.celo).toFixed(4)} CELO`;
      case "FIAT":
        return balances.fiat
          ? `$${parseFloat(balances.fiat).toFixed(2)}`
          : "N/A";
      default:
        return `${parseFloat(balances.usdt).toFixed(2)} USDT`;
    }
  }, [balances, displayCurrency]);

  const gasBalance = useMemo(
    () => `${parseFloat(balances.celo).toFixed(4)} CELO`,
    [balances.celo]
  );

  const networkName = useMemo(() => {
    switch (chainId) {
      case 42220:
        return "Celo Mainnet";
      case 44787:
        return "Celo Alfajores";
      default:
        return "Unknown Network";
    }
  }, [chainId]);

  // Handle disconnect with loading state
  const handleDisconnect = useCallback(async () => {
    setIsDisconnecting(true);
    setLocalError(null);

    try {
      await disconnect();
      setSuccessMessage("Wallet disconnected successfully");
    } catch (error: any) {
      setLocalError(error.message || "Failed to disconnect wallet");
    } finally {
      setIsDisconnecting(false);
    }
  }, [disconnect]);

  // Handle refresh balance
  const handleRefreshBalance = useCallback(async () => {
    setLocalError(null);
    try {
      await refreshBalance();
      setSuccessMessage("Balance refreshed successfully");
    } catch (error: any) {
      setLocalError(error.message || "Failed to refresh balance");
    }
  }, [refreshBalance]);

  // Auto-clear messages
  const clearMessages = useCallback(() => {
    setTimeout(() => {
      setLocalError(null);
      setSuccessMessage(null);
      clearError();
    }, 3000);
  }, [clearError]);

  // Clear messages when they appear
  if (localError || successMessage || error) {
    clearMessages();
  }

  return (
    <div className="max-h-[80vh] overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-md mx-auto bg-[#212428] p-6 md:p-8 rounded-xl shadow-2xl border border-[#2A2D35]"
      >
        <AnimatePresence>
          {(localError || error) && (
            <ErrorMessage error={localError || error || ""} />
          )}
          {successMessage && <SuccessMessage message={successMessage} />}
        </AnimatePresence>

        <div className="text-center mb-6">
          <WalletIcon />
          <p className="text-gray-400 text-sm mb-2">
            Connected as{" "}
            <span className="font-semibold text-white">{shortenedAddress}</span>
            <CopyButton text={account || ""} label="address" />
          </p>
          <h2 className="text-xl font-semibold text-white">Wallet Connected</h2>
          {walletType && (
            <p className="text-xs text-gray-500 mt-1 capitalize">
              via {walletType}
            </p>
          )}
        </div>

        <AnimatePresence mode="wait">
          {showDetails ? (
            <motion.div
              key="details"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <div className="bg-[#2A2D35] p-4 rounded-lg border border-[#35383F]">
                <p className="text-gray-400 text-sm mb-2">Wallet Address</p>
                <p className="text-white font-mono text-sm break-all flex items-center">
                  {account}
                  <CopyButton text={account || ""} label="address" />
                </p>
              </div>

              <div className="bg-[#2A2D35] p-4 rounded-lg border border-[#35383F]">
                <div className="flex justify-between items-center mb-3">
                  <p className="text-gray-400 text-sm">Main Balance</p>
                  <CurrencyDropdown
                    displayCurrency={displayCurrency}
                    setDisplayCurrency={setDisplayCurrency}
                    showCurrencyDropdown={showCurrencyDropdown}
                    setShowCurrencyDropdown={setShowCurrencyDropdown}
                    currencyDropdownRef={currencyDropdownRef}
                  />
                </div>
                <p className="text-white font-bold text-lg">
                  {formattedBalance}
                </p>
                <div className="mt-2 pt-2 border-t border-[#35383F]">
                  <p className="text-gray-500 text-xs flex justify-between">
                    <span>Gas Balance:</span>
                    <span className="text-gray-300">{gasBalance}</span>
                  </p>
                </div>
              </div>

              <div className="bg-[#2A2D35] p-4 rounded-lg border border-[#35383F]">
                <p className="text-gray-400 text-sm mb-2">Network</p>
                <p className="text-white flex items-center">
                  <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                  {networkName}
                  <span className="text-gray-500 text-sm ml-2">
                    (Chain ID: {chainId})
                  </span>
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDetails(false)}
                  className="flex-1 py-3 bg-[#2A2D35] hover:bg-[#35383F] text-white rounded-lg transition-colors border border-[#3A3D45]"
                >
                  Hide Details
                </button>
                <button
                  onClick={handleRefreshBalance}
                  disabled={isLoadingBalance}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center justify-center"
                >
                  {isLoadingBalance ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <FaSync className="mr-1" />
                  )}
                  {isLoadingBalance ? "Loading..." : "Refresh"}
                </button>
              </div>

              <WalletConnectionButton
                onClick={handleDisconnect}
                icon={FaSignOutAlt}
                variant="primary"
                loading={isDisconnecting}
                className="bg-red-500 hover:bg-red-600"
              >
                {isDisconnecting ? "Disconnecting..." : "Sign Out"}
              </WalletConnectionButton>
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
              <div className="bg-[#2A2D35] p-4 rounded-lg border border-[#35383F] text-center">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-400 text-sm">Balance</span>
                  <CurrencyDropdown
                    displayCurrency={displayCurrency}
                    setDisplayCurrency={setDisplayCurrency}
                    showCurrencyDropdown={showCurrencyDropdown}
                    setShowCurrencyDropdown={setShowCurrencyDropdown}
                    currencyDropdownRef={currencyDropdownRef}
                  />
                </div>
                <p className="text-white font-bold text-xl">
                  {formattedBalance}
                </p>
                <p className="text-gray-500 text-xs mt-1">Gas: {gasBalance}</p>
              </div>

              <WalletConnectionButton
                onClick={() => setShowDetails(true)}
                icon={FaWallet}
                variant="secondary"
              >
                View Details
              </WalletConnectionButton>

              <WalletConnectionButton
                onClick={handleDisconnect}
                icon={FaSignOutAlt}
                variant="primary"
                loading={isDisconnecting}
                className="bg-red-500 hover:bg-red-600"
              >
                {isDisconnecting ? "Disconnecting..." : "Sign Out"}
              </WalletConnectionButton>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default ConnectedWalletView;
