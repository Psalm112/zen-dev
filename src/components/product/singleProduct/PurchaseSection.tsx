import { useState, useEffect } from "react";
import { FaWallet, FaSpinner } from "react-icons/fa";
import { HiCurrencyDollar, HiSignal } from "react-icons/hi2";
import { Product, ProductVariant } from "../../../utils/types";
import { useWeb3 } from "../../../context/Web3Context";
import { useOrderData } from "../../../utils/hooks/useOrder";
import { useNavigate } from "react-router-dom";
import QuantitySelector from "./QuantitySelector";
import { useCurrency } from "../../../context/CurrencyContext";
import LogisticsSelector, { LogisticsProvider } from "./LogisticsSelector";
import { useAuth } from "../../../context/AuthContext";
import WalletConnectionModal from "../../web3/WalletConnectionModal";

interface PurchaseSectionProps {
  product?: Product;
  selectedVariant?: ProductVariant;
}

const PurchaseSection = ({
  product,
  selectedVariant,
}: PurchaseSectionProps) => {
  const navigate = useNavigate();
  const { placeOrder } = useOrderData();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const { secondaryCurrency } = useCurrency();
  const { isAuthenticated } = useAuth();
  const { wallet, connectWallet, isCorrectNetwork } = useWeb3();
  const [selectedLogistics, setSelectedLogistics] =
    useState<LogisticsProvider | null>(null);

  useEffect(() => {
    setQuantity(1);
  }, [selectedVariant]);

  const handleConnectWallet = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      await connectWallet();
    } catch (err: any) {
      console.error("Error connecting wallet:", err);
      setError(`Failed to connect wallet: ${err.message || "Unknown error"}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLogisticsSelect = (provider: LogisticsProvider) => {
    setSelectedLogistics(provider);
  };

  const handlePurchase = async () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    if (!product) return;
    if (!selectedLogistics) {
      setError("Please select a delivery method");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const order = await placeOrder({
        product: product._id,
        quantity: quantity,
        logisticsProviderWalletAddress: selectedLogistics.walletAddress,
      });

      if (order && order._id) {
        navigate(`/orders/${order._id}?status=pending`);
      } else {
        setError("Failed to create order. Please try again.");
      }
    } catch (err) {
      setError(`Transaction failed: ${(err as string) || "Please try again"}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleQuantityChange = (newQuantity: number) => {
    setQuantity(newQuantity);
  };

  const isOutOfStock = selectedVariant && selectedVariant.quantity <= 0;
  const availableQuantity = selectedVariant
    ? selectedVariant.quantity
    : product?.stock || 99;

  const handleButtonClick = () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    if (wallet.isConnected) {
      handlePurchase();
    } else {
      setShowWalletModal(true);
    }
  };

  return (
    <>
      <div className="bg-[#212428] p-4 md:p-6 space-y-4">
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-md text-sm mb-3 flex items-center gap-2">
            <HiSignal className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Quantity Selector */}
        <div className="flex justify-between items-center">
          <QuantitySelector
            min={1}
            max={99}
            onChange={handleQuantityChange}
            availableQuantity={availableQuantity as number}
          />

          {isOutOfStock ? (
            <span className="text-xs text-red-500 font-medium">
              Out of stock
            </span>
          ) : availableQuantity && Number(availableQuantity) < 10 ? (
            <span className="text-xs text-yellow-500 font-medium">
              Only {availableQuantity} left
            </span>
          ) : null}
        </div>

        {/* Logistics Selector */}
        <LogisticsSelector
          logisticsCost={product?.logisticsCost ?? []}
          logisticsProviders={product?.logisticsProviders ?? []}
          onSelect={handleLogisticsSelect}
          selectedProvider={selectedLogistics}
        />

        {/* Purchase Button */}
        <div className="flex gap-3 w-full">
          <button
            className="bg-Red text-white py-3 px-6 md:px-10 font-bold flex-1 rounded-md transition-all duration-200 hover:bg-Red/80 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-Red flex items-center justify-center gap-2 shadow-lg"
            onClick={handleButtonClick}
            disabled={isProcessing || !product || isOutOfStock}
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
                  {isOutOfStock
                    ? "Out of Stock"
                    : !isAuthenticated
                    ? "Login to buy"
                    : wallet.isConnected
                    ? "Buy Now"
                    : "Connect wallet to buy"}
                </span>
              </>
            )}
          </button>
        </div>

        {/* Wallet Balance Display */}
        {wallet.isConnected && (
          <div className="bg-Dark/30 border border-Red/20 rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <HiCurrencyDollar className="w-3 h-3" />
              <span>Wallet Balance</span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <div className="text-gray-400">USDT</div>
                <div className="text-white font-medium">
                  {wallet.usdtBalance?.usdt || "Loading..."}
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-gray-400">CELO (Gas)</div>
                <div className="text-white font-medium">
                  {wallet.balance
                    ? `${parseFloat(wallet.balance).toFixed(4)}`
                    : "0.0000"}
                </div>
              </div>
            </div>

            <div className="text-center pt-2 border-t border-Red/10">
              <div className="text-xs text-gray-500">
                {wallet.address
                  ? `${wallet.address.substring(
                      0,
                      6
                    )}...${wallet.address.substring(wallet.address.length - 4)}`
                  : ""}
              </div>
            </div>
          </div>
        )}
      </div>

      <WalletConnectionModal
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
      />
    </>
  );
};

export default PurchaseSection;
