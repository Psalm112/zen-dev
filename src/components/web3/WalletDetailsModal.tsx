import React from "react";
import {
  HiArrowTopRightOnSquare,
  HiClipboardDocument,
  HiArrowsRightLeft,
  HiExclamationTriangle,
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

const WalletDetailsModal: React.FC<WalletDetailsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { showSnackbar } = useSnackbar();
  const { wallet, disconnectWallet, isCorrectNetwork, switchToCorrectNetwork } =
    useWeb3();

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
      // Error already handled in context
    }
  };

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
            <div className="flex-1">
              <p className="text-sm text-gray-400">Address</p>
              <p className="font-mono text-white">
                {wallet.address
                  ? truncateAddress(wallet.address)
                  : "Not connected"}
              </p>
            </div>
            <Button
              title=""
              icon={<HiClipboardDocument className="w-4 h-4" />}
              onClick={handleCopyAddress}
              className="bg-gray-700 hover:bg-gray-600 text-white p-2"
            />
            <Button
              title=""
              icon={<HiArrowTopRightOnSquare className="w-4 h-4" />}
              path={`https://explorer.celo.org/address/${wallet.address}`}
              className="bg-gray-700 hover:bg-gray-600 text-white p-2"
            />
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
                    Please switch to {TARGET_CHAIN.name} to make purchases
                  </p>
                  <Button
                    title={`Switch to ${TARGET_CHAIN.name}`}
                    icon={<HiArrowsRightLeft className="w-4 h-4" />}
                    onClick={handleSwitchNetwork}
                    className="mt-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
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
          <div className="space-y-2">
            {/* USDT Balance with conversions */}
            <div className="p-3 bg-[#292B30] rounded-lg space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">USDT</span>
                <span className="font-mono text-white">
                  {wallet.usdtBalance?.usdt || "$0.00"}
                </span>
              </div>
              {wallet.usdtBalance && (
                <div className="text-xs text-gray-500 space-y-1">
                  <div className="flex justify-between">
                    <span>≈ {wallet.usdtBalance.celo}</span>
                    <span>≈ {wallet.usdtBalance.fiat}</span>
                  </div>
                </div>
              )}
            </div>

            {/* CELO Balance for gas */}
            <div className="flex justify-between items-center p-3 bg-[#292B30] rounded-lg">
              <span className="text-gray-300">ETH (for gas fees)</span>
              <span className="font-mono text-white">
                {wallet.balance
                  ? `${parseFloat(wallet.balance).toFixed(4)} CELO`
                  : "0.0000 CELO"}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="border-t border-gray-700/50 pt-4">
          <Button
            title="Disconnect Wallet"
            icon={<FiLogOut className="w-4 h-4" />}
            onClick={handleDisconnect}
            className="flex items-center justify-center w-full bg-red-600 hover:bg-red-700 text-white"
          />
        </div>
      </div>
    </Modal>
  );
};

export default WalletDetailsModal;
