import React, { useState } from "react";
import { motion } from "framer-motion";
import { HiWallet } from "react-icons/hi2";
import { FiLogOut } from "react-icons/fi";
import Button from "../common/Button";
import Modal from "../common/Modal";
import WalletConnectionModal from "./WalletConnectionModal";
import WalletDetailsModal from "./WalletDetailsModal";
import { useWeb3 } from "../../context/Web3Context";
import { truncateAddress } from "../../utils/web3.utils";

const WalletConnectButton: React.FC = () => {
  const { wallet, disconnectWallet } = useWeb3();
  const [showConnectionModal, setShowConnectionModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  if (wallet.isConnected && wallet.address) {
    return (
      <>
        <Button
          title={truncateAddress(wallet.address)}
          icon={<HiWallet className="w-4 h-4" />}
          iconPosition="start"
          onClick={() => setShowDetailsModal(true)}
          className="bg-green-600 hover:bg-green-700 text-white border border-green-500"
        />

        <WalletDetailsModal
          isOpen={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
        />
      </>
    );
  }

  return (
    <>
      <Button
        title={wallet.isConnecting ? "Connecting..." : "Connect Wallet"}
        icon={<HiWallet className="w-4 h-4" />}
        iconPosition="start"
        onClick={() => setShowConnectionModal(true)}
        disabled={wallet.isConnecting}
        className="bg-blue-600 hover:bg-blue-700 text-white border border-blue-500"
      />

      <WalletConnectionModal
        isOpen={showConnectionModal}
        onClose={() => setShowConnectionModal(false)}
      />
    </>
  );
};

export default WalletConnectButton;
