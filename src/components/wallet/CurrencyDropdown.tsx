import { memo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";

interface Currency {
  readonly code: string;
  readonly symbol: string;
  readonly name: string;
}

interface CurrencyDropdownProps {
  readonly isOpen: boolean;
  readonly selectedCurrency: string;
  onToggle: () => void;
  onCurrencyChange: (currency: string) => void;
}

const CURRENCIES: readonly Currency[] = [
  { code: "USDT", symbol: "$", name: "US Dollar (USDT)" },
  { code: "CELO", symbol: "CELO", name: "Celo" },
  { code: "FIAT", symbol: "₦", name: "Nigerian Naira" },
] as const;

export const CurrencyDropdown = memo<CurrencyDropdownProps>(
  ({ isOpen, selectedCurrency, onToggle, onCurrencyChange }) => {
    const selectedCurrencyData = CURRENCIES.find(
      (c) => c.code === selectedCurrency
    );

    const handleCurrencySelect = useCallback(
      (currencyCode: string) => {
        onCurrencyChange(currencyCode);
        onToggle();
      },
      [onCurrencyChange, onToggle]
    );

    return (
      <div className="relative">
        <button
          onClick={onToggle}
          className="flex items-center gap-2 px-3 py-1.5 bg-[#2A2D35] rounded-lg hover:bg-[#3A3D45] transition-colors duration-200"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        >
          <span className="text-sm font-medium text-white">
            {selectedCurrencyData?.symbol}
          </span>
          {isOpen ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full mt-2 right-0 bg-[#2A2D35] rounded-lg shadow-xl border border-gray-700 z-50 min-w-[200px]"
              role="listbox"
            >
              {CURRENCIES.map((currency) => (
                <button
                  key={currency.code}
                  onClick={() => handleCurrencySelect(currency.code)}
                  className={`w-full px-4 py-3 text-left hover:bg-[#3A3D45] transition-colors duration-200 first:rounded-t-lg last:rounded-b-lg ${
                    selectedCurrency === currency.code
                      ? "bg-[#3A3D45] text-[#ff343f]"
                      : "text-white"
                  }`}
                  role="option"
                  aria-selected={selectedCurrency === currency.code}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{currency.symbol}</span>
                    <span className="text-sm text-gray-400">
                      {currency.name}
                    </span>
                  </div>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

CurrencyDropdown.displayName = "CurrencyDropdown";
