import React, { useState } from "react";
import { HiWallet } from "react-icons/hi2";
import Button from "../common/Button";
import WalletConnectionModal from "./WalletConnectionModal";
import WalletDetailsModal from "./WalletDetailsModal";
import { useWeb3 } from "../../context/Web3Context";
import { truncateAddress } from "../../utils/web3.utils";

const WalletConnectButton: React.FC = () => {
  const { wallet } = useWeb3();
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
          className="flex items-center justify-center bg-[#292B30] hover:bg-[#33363b] text-white"
          aria-label="Wallet connected"
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
        className="flex items-center justify-center bg-[#292B30] text-white"
        aria-label="Connect wallet"
      />

      <WalletConnectionModal
        isOpen={showConnectionModal}
        onClose={() => setShowConnectionModal(false)}
      />
    </>
  );
};

export default WalletConnectButton;
