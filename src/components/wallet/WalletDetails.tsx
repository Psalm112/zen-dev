import { memo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaWallet,
  FaChevronUp,
  FaChevronDown,
  FaCopy,
  FaCheck,
  FaExternalLinkAlt,
} from "react-icons/fa";
import { useWallet, useWalletNetwork } from "../../context/WalletContext";

interface WalletDetailsProps {
  readonly isOpen: boolean;
  onToggle: () => void;
}

export const WalletDetails = memo<WalletDetailsProps>(
  ({ isOpen, onToggle }) => {
    const item = {
      hidden: { opacity: 0, x: -20 },
      visible: { opacity: 1, x: 0 },
    };
    const { account, walletType, switchChain } = useWallet();
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

    const handleSwitchToMainnet = useCallback(() => {
      switchChain(42220);
    }, [switchChain]);

    if (!account) return null;

    return (
      <motion.div
        variants={item}
        className="bg-[#2A2D35] rounded-xl overflow-hidden"
      >
        <button
          onClick={onToggle}
          className="w-full p-4 flex items-center justify-between hover:bg-[#3A3D45] transition-colors duration-200"
          aria-expanded={isOpen}
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

                <div className="flex items-center justify-between p-3 bg-[#212428] rounded-lg">
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide">
                      Network
                    </p>
                    <p className="text-white font-medium">{networkName}</p>
                  </div>
                  {isTestnet && (
                    <button
                      onClick={handleSwitchToMainnet}
                      className="px-3 py-1.5 bg-[#ff343f] text-white text-xs font-medium rounded-lg hover:bg-[#e6303a] transition-colors duration-200"
                    >
                      Switch to Mainnet
                    </button>
                  )}
                </div>

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
  }
);

WalletDetails.displayName = "WalletDetails";
