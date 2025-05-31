import React, { useState, useEffect, useRef } from "react";
import {
  HiArrowTopRightOnSquare,
  HiClipboardDocument,
  HiArrowsRightLeft,
  HiExclamationTriangle,
  HiChevronDown,
} from "react-icons/hi2";
import { FiLogOut } from "react-icons/fi";
import Modal from "../common/Modal";
import Button from "../common/Button";
import { useWeb3 } from "../../context/Web3Context";
import { TARGET_CHAIN } from "../../utils/config/web3.config";
import { truncateAddress, copyToClipboard } from "../../utils/web3.utils";
import { useSnackbar } from "../../context/SnackbarContext";

interface WalletDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type BalanceDisplayMode = "USDT" | "CELO" | "FIAT";

const WalletDetailsModal: React.FC<WalletDetailsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { showSnackbar } = useSnackbar();
  const { wallet, disconnectWallet, isCorrectNetwork, switchToCorrectNetwork } =
    useWeb3();

  const [balanceMode, setBalanceMode] = useState<BalanceDisplayMode>("USDT");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isDropdownOpen]);

  const handleCopyAddress = () => {
    if (wallet.address) {
      copyToClipboard(wallet.address);
      showSnackbar("Address copied to clipboard", "success");
    }
  };

  const handleDisconnect = () => {
    disconnectWallet();
    onClose();
  };

  const handleSwitchNetwork = async () => {
    try {
      await switchToCorrectNetwork();
    } catch (error) {
      // Error handled in context
    }
  };

  const getBalanceDisplay = () => {
    if (!wallet.usdtBalance) return "$0.00";

    switch (balanceMode) {
      case "USDT":
        return wallet.usdtBalance.usdt;
      case "CELO":
        return wallet.usdtBalance.celo;
      case "FIAT":
        return wallet.usdtBalance.fiat;
      default:
        return wallet.usdtBalance.usdt;
    }
  };

  const balanceOptions = [
    { mode: "USDT" as const, label: "USDT", symbol: "$" },
    { mode: "CELO" as const, label: "CELO", symbol: "◉" },
    { mode: "FIAT" as const, label: "USD", symbol: "$" },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Wallet Details"
      maxWidth="md:max-w-md"
    >
      <div className="space-y-6">
        {/* Wallet Address */}
        <div className="space-y-3">
          <h3 className="text-lg font-medium text-white">Connected Wallet</h3>
          <div className="flex items-center gap-3 p-3 bg-[#292B30] rounded-lg">
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-400">Address</p>
              <p className="font-mono text-white truncate">
                {wallet.address
                  ? truncateAddress(wallet.address)
                  : "Not connected"}
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Button
                title=""
                icon={<HiClipboardDocument className="w-4 h-4" />}
                onClick={handleCopyAddress}
                className="bg-[#212428] hover:bg-[#212428]/70  hover:shadow-md text-white p-2"
                disabled={!wallet.address}
              />
              <Button
                title=""
                icon={<HiArrowTopRightOnSquare className="w-4 h-4" />}
                path={`https://explorer.celo.org/alfajores/address/${wallet.address}`}
                className="bg-[#212428] hover:bg-[#212428]/70 hover:shadow-md text-white p-2"
                disabled={!wallet.address}
              />
            </div>
          </div>
        </div>

        {/* Network Status */}
        <div className="space-y-3">
          <h3 className="text-lg font-medium text-white">Network</h3>
          {!isCorrectNetwork ? (
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <div className="flex items-start gap-2">
                <HiExclamationTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-yellow-400 font-medium">Wrong Network</p>
                  <p className="text-sm text-yellow-300/80 mt-1">
                    Switch to {TARGET_CHAIN.name} to make purchases
                  </p>
                  <Button
                    title={`Switch to ${TARGET_CHAIN.name}`}
                    icon={<HiArrowsRightLeft className="w-4 h-4" />}
                    onClick={handleSwitchNetwork}
                    className="mt-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm px-3 py-1.5"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-green-400 font-medium">
                  {TARGET_CHAIN.name}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Balances */}
        <div className="space-y-3">
          <h3 className="text-lg font-medium text-white">Balances</h3>
          <div className="space-y-3">
            {/* USDT Balance with dropdown */}
            <div className="p-3 bg-[#292B30] rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">USDT</span>
                <div className="relative" ref={dropdownRef}>
                  {wallet.isConnecting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-gray-400">Loading...</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="flex items-center gap-2 font-mono text-white hover:text-gray-300 transition-colors bg-[#212428] hover:bg-[#212428]/70 px-3 py-1.5 rounded-md"
                      disabled={!wallet.usdtBalance}
                    >
                      <span className="min-w-0">{getBalanceDisplay()}</span>
                      <HiChevronDown
                        className={`w-4 h-4 transition-transform flex-shrink-0 ${
                          isDropdownOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                  )}

                  {isDropdownOpen && wallet.usdtBalance && (
                    <div className="absolute right-0 top-full mt-1 bg-[#1a1c20] border border-gray-600 rounded-lg shadow-xl z-20 min-w-[140px] overflow-hidden">
                      {balanceOptions.map((option) => (
                        <button
                          key={option.mode}
                          onClick={() => {
                            setBalanceMode(option.mode);
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full px-3 py-2.5 text-left hover:bg-gray-700 transition-colors ${
                            balanceMode === option.mode
                              ? "bg-gray-700 text-white"
                              : "text-gray-300"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-2">
                              <span className="text-xs opacity-60">
                                {option.symbol}
                              </span>
                              {option.label}
                            </span>
                            {balanceMode === option.mode && (
                              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {wallet.usdtBalance && (
                <div className="text-xs text-gray-500 mt-2 space-y-1">
                  <div className="flex justify-between">
                    <span>≈ {wallet.usdtBalance.celo}</span>
                    <span>≈ {wallet.usdtBalance.fiat}</span>
                  </div>
                </div>
              )}
            </div>

            {/* CELO Balance */}
            <div className="p-3 bg-[#292B30] rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">CELO</span>
                <span className="font-mono text-white">
                  {wallet.balance
                    ? `${parseFloat(wallet.balance).toFixed(4)} CELO`
                    : "0.0000 CELO"}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">For transaction fees</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="border-t border-gray-700/50 pt-4">
          <Button
            title="Disconnect Wallet"
            icon={<FiLogOut className="w-4 h-4" />}
            onClick={handleDisconnect}
            className="flex items-center justify-center w-full bg-red-600 hover:bg-red-700 text-white py-2.5"
          />
        </div>
      </div>
    </Modal>
  );
};

export default WalletDetailsModal;
