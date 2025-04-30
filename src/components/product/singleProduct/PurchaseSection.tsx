import { useState, useEffect } from "react";
import { FaWallet, FaSpinner } from "react-icons/fa";
import { Product } from "../../../utils/types";

interface PurchaseSectionProps {
  product?: Product;
}

const PurchaseSection = ({ product }: PurchaseSectionProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if wallet is already connected (placeholder for real implementation)
    const checkWalletConnection = async () => {
      try {
        //wallet connection check
        const connected = localStorage.getItem("walletConnected") === "true";
        setWalletConnected(connected);
      } catch (err) {
        console.error("Error checking wallet connection:", err);
        setWalletConnected(false);
      }
    };

    checkWalletConnection();
  }, []);

  const handleConnectWallet = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      // Simulating wallet connection process
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // In a real implementation this would connect to MetaMask or other wallet
      localStorage.setItem("walletConnected", "true");
      setWalletConnected(true);
    } catch (err) {
      console.error("Error connecting wallet:", err);
      setError("Failed to connect wallet. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePurchase = async () => {
    if (!product) return;

    setIsProcessing(true);
    setError(null);

    try {
      // Simulating purchase process
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // In a real implementation this would send a transaction
      // Show success notification or redirect
    } catch (err) {
      console.error("Error processing purchase:", err);
      setError("Transaction failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-[#212428] p-4 md:p-6 space-y-4">
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-2 rounded-md text-sm mb-3">
          {error}
        </div>
      )}

      <div className="flex gap-3 w-full">
        <button
          className="bg-Red text-white py-3 px-6 md:px-10 font-bold flex-1 rounded-md transition-all hover:bg-[#d52a33] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:bg-Red flex items-center justify-center gap-2"
          onClick={walletConnected ? handlePurchase : handleConnectWallet}
          disabled={isProcessing || !product}
        >
          {isProcessing ? (
            <span className="flex items-center justify-center gap-2">
              <FaSpinner className="animate-spin text-lg" />
              Processing...
            </span>
          ) : (
            <>
              <FaWallet className="text-lg" />
              <span>
                {walletConnected ? "Buy Now" : "Connect wallet to buy"}
              </span>
            </>
          )}
        </button>
      </div>

      {walletConnected && (
        <div className="text-center text-xs text-gray-400">
          Connected to wallet. Make sure you have enough ETH for this purchase.
        </div>
      )}
    </div>
  );
};

export default PurchaseSection;
