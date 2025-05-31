import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useConnect } from "wagmi";
import { SiCoinbase } from "react-icons/si";
import {
  HiDevicePhoneMobile,
  HiQuestionMarkCircle,
  HiExclamationTriangle,
} from "react-icons/hi2";
import Modal from "../common/Modal";
import Button from "../common/Button";
import WalletEducationModal from "./WalletEducationModal";
import { useWeb3 } from "../../context/Web3Context";
import { useSnackbar } from "../../context/SnackbarContext";
import { metamaskLogo } from "../../pages";

interface WalletConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WalletConnectionModal: React.FC<WalletConnectionModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { showSnackbar } = useSnackbar();
  const { connectors, connect, isPending } = useConnect();
  const { wallet } = useWeb3();
  const [showEducation, setShowEducation] = useState(false);
  const [connectingWallet, setConnectingWallet] = useState<string | null>(null);

  const availableConnectors = useMemo(() => {
    return connectors.filter((connector) => {
      if (connector.name.toLowerCase().includes("walletconnect")) {
        return !!process.env.VITE_WALLETCONNECT_PROJECT_ID;
      }
      return true;
    });
  }, [connectors]);
  const handleClose = () => {
    setConnectingWallet(null);
    onClose();
  };

  const handleConnect = async (connector: any) => {
    try {
      setConnectingWallet(connector.name);
      await connect({ connector });
      handleClose();
      showSnackbar("Wallet connected successfully!", "success");
    } catch (error: any) {
      console.error("Connection failed:", error);

      if (error.message?.includes("User rejected")) {
        showSnackbar("Connection cancelled", "info");
      } else if (error.message?.includes("Project ID")) {
        showSnackbar("Wallet service temporarily unavailable", "error");
      } else {
        showSnackbar("Failed to connect wallet. Please try again.", "error");
      }
    } finally {
      setConnectingWallet(null);
    }
  };

  const getWalletIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case "metamask":
        return <img src={metamaskLogo} alt="Metamask" className="w-8 h-8" />;
      case "coinbase wallet":
        return <SiCoinbase className="w-8 h-8 text-blue-500" />;
      case "walletconnect":
        return <HiDevicePhoneMobile className="w-8 h-8 text-blue-400" />;
      default:
        return <HiDevicePhoneMobile className="w-8 h-8 text-gray-400" />;
    }
  };

  const getWalletDescription = (name: string) => {
    switch (name.toLowerCase()) {
      case "metamask":
        return "Popular browser extension wallet";
      case "coinbase wallet":
        return "Secure wallet from Coinbase exchange";
      case "walletconnect":
        return "Connect with mobile wallet apps";
      default:
        return "Connect with your preferred wallet";
    }
  };

  if (showEducation) {
    return (
      <WalletEducationModal
        isOpen={isOpen}
        onClose={() => setShowEducation(false)}
        onBack={() => setShowEducation(false)}
      />
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Connect Your Wallet"
      maxWidth="md:max-w-lg"
    >
      <div className="space-y-6">
        {/* Introduction */}
        <div className="text-center space-y-3">
          <p className="text-gray-300">
            Choose your preferred wallet to start shopping with crypto
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-yellow-400 bg-yellow-400/10 rounded-lg p-3">
            <HiExclamationTriangle className="w-4 h-4 flex-shrink-0" />
            <span>
              New to crypto wallets? We'll guide you through the setup.
            </span>
          </div>
        </div>

        {/* Wallet Options */}
        <div className="space-y-3">
          {connectors.map((connector) => (
            <motion.div
              key={connector.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <button
                onClick={() => handleConnect(connector)}
                disabled={isPending || connectingWallet !== null}
                className="w-full flex items-center gap-4 p-4 bg-[#292B30] hover:bg-[#323539] rounded-xl border border-gray-700/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {getWalletIcon(connector.name)}
                <div className="flex-1 text-left">
                  <h3 className="font-medium text-white">{connector.name}</h3>
                  <p className="text-sm text-gray-400">
                    {getWalletDescription(connector.name)}
                  </p>
                </div>
                {connectingWallet === connector.name ? (
                  <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                )}
              </button>
            </motion.div>
          ))}
        </div>

        {/* Help Section */}
        <div className="border-t border-gray-700/50 pt-4 space-y-3">
          <Button
            title="New to wallets? Learn the basics"
            icon={<HiQuestionMarkCircle className="w-4 h-4" />}
            onClick={() => setShowEducation(true)}
            className="flex items-center justify-center w-full bg-transparent border border-gray-600 text-gray-300 hover:bg-gray-700/30"
          />

          <p className="text-xs text-gray-500 text-center">
            Your wallet stays secure - we never store your private keys
          </p>
        </div>

        {/* Error Display */}
        <AnimatePresence>
          {wallet.error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg"
            >
              <p className="text-red-400 text-sm">{wallet.error}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Modal>
  );
};

export default WalletConnectionModal;
