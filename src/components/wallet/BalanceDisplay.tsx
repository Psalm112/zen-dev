import { memo, useState, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { IoWallet, IoRefresh } from "react-icons/io5";
import { useWalletBalance } from "../../context/WalletContext";
import { CurrencyDropdown } from "./CurrencyDropdown";
// import { ANIMATION_VARIANTS } from "../../constants/animations";

interface BalanceDisplayProps {
  readonly variant: "compact" | "detailed";
}

export const BalanceDisplay = memo<BalanceDisplayProps>(({ variant }) => {
  const item = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
  };
  const { balances, isLoading, refetch, formatted } = useWalletBalance();
  const [selectedCurrency, setSelectedCurrency] = useState("USDT");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const displayBalance = useMemo(() => {
    switch (selectedCurrency) {
      case "USDT":
        return formatted.usdt;
      case "CELO":
        return formatted.celo;
      case "FIAT":
        return formatted.fiat;
      default:
        return formatted.usdt;
    }
  }, [selectedCurrency, formatted]);

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleDropdownToggle = useCallback(() => {
    setIsDropdownOpen((prev) => !prev);
  }, []);

  if (variant === "compact") {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <IoWallet className="text-[#ff343f]" size={16} />
          <span className="text-white font-semibold">{displayBalance}</span>
        </div>
        <CurrencyDropdown
          isOpen={isDropdownOpen}
          onToggle={handleDropdownToggle}
          selectedCurrency={selectedCurrency}
          onCurrencyChange={setSelectedCurrency}
        />
      </div>
    );
  }

  return (
    <motion.div
      variants={item}
      className="bg-[#2A2D35] rounded-xl p-4 space-y-4"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <IoWallet className="text-[#ff343f]" />
          Wallet Balance
        </h3>
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="p-2 hover:bg-[#3A3D45] rounded-lg transition-colors duration-200 disabled:opacity-50"
          aria-label="Refresh balance"
        >
          <IoRefresh
            className={`text-gray-400 ${isLoading ? "animate-spin" : ""}`}
            size={16}
          />
        </button>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 bg-[#212428] rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-xs font-bold text-white">$</span>
            </div>
            <div>
              <p className="text-white font-semibold">{formatted.usdt}</p>
              <p className="text-xs text-gray-400">USDT Balance</p>
            </div>
          </div>
          <CurrencyDropdown
            isOpen={isDropdownOpen}
            onToggle={handleDropdownToggle}
            selectedCurrency={selectedCurrency}
            onCurrencyChange={setSelectedCurrency}
          />
        </div>

        <div className="flex items-center justify-between p-3 bg-[#212428] rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
              <span className="text-xs font-bold text-white">C</span>
            </div>
            <div>
              <p className="text-white font-medium">{formatted.celo}</p>
              <p className="text-xs text-gray-400">CELO (Gas Fees)</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

BalanceDisplay.displayName = "BalanceDisplay";
