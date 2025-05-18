import { useCallback, useMemo, useState, useEffect } from "react";
import { FaWallet, FaSpinner } from "react-icons/fa";
import { Product, ProductVariant } from "../../../utils/types";
import { useWallet } from "../../../context/WalletContext";
import { useOrderData } from "../../../utils/hooks/useOrder";
import { useNavigate } from "react-router-dom";
import QuantitySelector from "./QuantitySelector";
import { useCurrency } from "../../../context/CurrencyContext";
import LogisticsSelector, { LogisticsProvider } from "./LogisticsSelector";

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
  const { secondaryCurrency } = useCurrency();
  const {
    isConnected,
    connectMetaMask,
    account,
    formattedBalance,
    balanceInCELO,
    setDisplayCurrency,
  } = useWallet();
  const [selectedLogistics, setSelectedLogistics] =
    useState<LogisticsProvider | null>(null);

  // Reset quantity when variant changes
  useEffect(() => {
    setQuantity(1);
  }, [selectedVariant]);

  const handleConnectWallet = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      await connectMetaMask();
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
    if (!product) return;
    if (!selectedLogistics) {
      setError("Please select a delivery method");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const variantInfo = selectedVariant
        ? {
            variantId: selectedVariant.id,
            variantProperties: Object.fromEntries(
              Object.entries(selectedVariant).filter(
                ([key]) => key !== "quantity"
              )
            ),
          }
        : undefined;

      const order = await placeOrder({
        product: product._id,
        quantity: quantity,
        logisticsProviderWalletAddress: selectedLogistics.walletAddress,
        // seller:
        //   typeof product.seller === "object"
        //     ? product.seller._id
        //     : product.seller,
        // amount: (product.price * quantity).toString(),
        // type: selectedVariant,
        // quantity: quantity,
        // variantInfo,
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

  const balance = useMemo(() => {
    setDisplayCurrency(secondaryCurrency);
    return formattedBalance;
  }, [secondaryCurrency, formattedBalance, setDisplayCurrency]);

  const isOutOfStock = selectedVariant && selectedVariant.quantity <= 0;
  const availableQuantity = selectedVariant
    ? selectedVariant.quantity
    : product?.stock || 99;

  return (
    <div className="bg-[#212428] p-4 md:p-6 space-y-4">
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-2 rounded-md text-sm mb-3">
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
          <span className="text-xs text-red-500">Out of stock</span>
        ) : availableQuantity && Number(availableQuantity) < 10 ? (
          <span className="text-xs text-yellow-500">
            Only {availableQuantity} left in stock
          </span>
        ) : null}
      </div>

      {/* Logistics Selector */}
      <LogisticsSelector
        onSelect={handleLogisticsSelect}
        selectedProvider={selectedLogistics}
      />

      <div className="flex gap-3 w-full">
        <button
          className="bg-Red text-white py-3 px-6 md:px-10 font-bold flex-1 rounded-md transition-all hover:bg-[#d52a33] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:bg-Red flex items-center justify-center gap-2"
          onClick={isConnected ? handlePurchase : handleConnectWallet}
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
                  : isConnected
                  ? "Buy Now"
                  : "Connect wallet to buy"}
              </span>
            </>
          )}
        </button>
      </div>

      {isConnected && (
        <div className="text-center text-xs text-gray-400">
          {formattedBalance && balanceInCELO
            ? `Balance: ${balanceInCELO}  ·  ${balance}`
            : "Checking balance..."}
          <br />
          {account
            ? `${account.substring(0, 6)}...${account.substring(
                account.length - 4
              )}`
            : ""}
        </div>
      )}
    </div>
  );
};

export default PurchaseSection;
