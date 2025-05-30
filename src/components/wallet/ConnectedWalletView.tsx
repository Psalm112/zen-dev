"use client";
import { useState, useRef, RefObject } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaSignOutAlt, FaWallet } from "react-icons/fa";
import { useWallet } from "../../context/WalletContext";
import {
  WalletIcon,
  CurrencyDropdown,
  CopyButton,
  ErrorMessage,
  SuccessMessage,
} from "./ui";
import WalletConnectionButton from "./buttons/WalletConnectionButton";

const ConnectedWalletView = () => {
  const wallet = useWallet();
  const { isConnected, isConnecting, account, walletType } = wallet;

  // Local state
  const [showDetails, setShowDetails] = useState(false);
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [displayCurrency, setDisplayCurrency] = useState<
    "USDT" | "CELO" | "FIAT"
  >("USDT");

  const currencyDropdownRef = useRef<HTMLDivElement>(
    null
  ) as RefObject<HTMLDivElement>;

  // Derived values
  const shortenedAddress = account
    ? `${account.slice(0, 6)}...${account.slice(-4)}`
    : "";

  const formattedBalance = "0.00 USDT"; // This would use actual wallet balance
  const gasBalance = "0.00 CELO"; // This would use actual gas balance

  // Handle disconnect
  const handleDisconnect = async () => {
    try {
      await wallet.disconnect();
      setSuccessMessage("Wallet disconnected successfully");
    } catch (error: any) {
      setLocalError(error.message || "Failed to disconnect wallet");
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
              <p className="text-white font-bold text-lg">{formattedBalance}</p>
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
                {wallet.chainId === 42220 ? "Celo Mainnet" : "Celo Alfajores"}
                <span className="text-gray-500 text-sm ml-2">
                  (Chain ID: {wallet.chainId})
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
                onClick={wallet.refreshBalance}
                disabled={wallet.isLoadingBalance}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center justify-center"
              >
                {wallet.isLoadingBalance ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  "Refresh"
                )}
              </button>
            </div>

            <WalletConnectionButton
              onClick={handleDisconnect}
              icon={FaSignOutAlt}
              variant="primary"
              loading={isConnecting}
              className="bg-red-500 hover:bg-red-600"
            >
              {isConnecting ? "Disconnecting..." : "Sign Out"}
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
              <p className="text-white font-bold text-xl">{formattedBalance}</p>
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
              loading={isConnecting}
              className="bg-red-500 hover:bg-red-600"
            >
              {isConnecting ? "Disconnecting..." : "Sign Out"}
            </WalletConnectionButton>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ConnectedWalletView;
