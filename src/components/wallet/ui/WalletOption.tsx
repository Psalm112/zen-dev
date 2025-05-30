"use client";
import { motion } from "framer-motion";
import { memo, useCallback } from "react";
import { FaWallet, FaQrcode, FaEthereum } from "react-icons/fa";
import { FaUserSecret } from "react-icons/fa";
import { WalletInfo } from "../../../utils/types/wallet.types";

interface WalletOptionProps {
  wallet: WalletInfo;
  onConnect: () => void;
  isConnecting: boolean;
  deviceInfo: any;
}

const WalletOption = memo(
  ({ wallet, onConnect, isConnecting, deviceInfo }: WalletOptionProps) => {
    const getWalletIcon = useCallback((type: string | null) => {
      if (!type) return FaWallet;

      const iconMap: Record<string, any> = {
        metamask: FaEthereum,
        walletconnect: FaQrcode,
        coinbase: FaWallet,
        trust: FaWallet,
        rainbow: FaWallet,
        smart: FaUserSecret,
      };
      return iconMap[type] || FaWallet;
    }, []);

    const WalletIcon = getWalletIcon(wallet.type);

    return (
      <motion.button
        onClick={onConnect}
        disabled={isConnecting}
        className={`w-full p-3 rounded-lg border transition-all duration-200 flex items-center justify-between group ${
          wallet.recommended
            ? "bg-gradient-to-r from-red-500/10 to-orange-500/10 border-red-500/30 hover:border-red-500/50"
            : "bg-[#2A2D35] border-[#3A3D45] hover:border-[#4A4D55] hover:bg-[#35383F]"
        } ${isConnecting ? "opacity-50 cursor-not-allowed" : ""}`}
        whileHover={!isConnecting ? { scale: 1.02 } : {}}
        whileTap={!isConnecting ? { scale: 0.98 } : {}}
      >
        <div className="flex items-center">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
              wallet.installed
                ? "bg-green-500/20 text-green-400"
                : "bg-gray-500/20 text-gray-400"
            }`}
          >
            <WalletIcon className="w-4 h-4" />
          </div>

          <div className="text-left">
            <div className="flex items-center">
              <span className="text-white font-medium text-sm">
                {wallet.name}
              </span>
              {wallet.recommended && (
                <span className="ml-2 px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full">
                  Recommended
                </span>
              )}
            </div>

            <div className="flex items-center text-xs text-gray-500 mt-0.5">
              {wallet.installed ? (
                <span className="text-green-400">Installed</span>
              ) : wallet.requiresDownload ? (
                <span>Download required</span>
              ) : (
                <span>Available</span>
              )}

              {wallet.type === "walletconnect" && (
                <span className="ml-2 flex items-center">
                  <FaQrcode className="w-3 h-3 mr-1" />
                  QR Code
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center">
          {isConnecting ? (
            <div className="w-4 h-4 animate-spin rounded-full border-2 border-gray-400 border-t-white" />
          ) : (
            <motion.div
              className="text-gray-400 group-hover:text-white transition-colors"
              whileHover={{ x: 2 }}
            >
              →
            </motion.div>
          )}
        </div>
      </motion.button>
    );
  }
);

WalletOption.displayName = "WalletOption";
export default WalletOption;
