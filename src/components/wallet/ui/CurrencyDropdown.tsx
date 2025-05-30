"use client";
import { IoChevronDown } from "react-icons/io5";
import { motion, AnimatePresence } from "framer-motion";
import { memo, useMemo, RefObject } from "react";

interface CurrencyDropdownProps {
  displayCurrency: "USDT" | "CELO" | "FIAT";
  setDisplayCurrency: (currency: "USDT" | "CELO" | "FIAT") => void;
  showCurrencyDropdown: boolean;
  setShowCurrencyDropdown: (show: boolean) => void;
  currencyDropdownRef: RefObject<HTMLDivElement>;
}

const CurrencyDropdown = memo(
  ({
    displayCurrency,
    setDisplayCurrency,
    showCurrencyDropdown,
    setShowCurrencyDropdown,
    currencyDropdownRef,
  }: CurrencyDropdownProps) => {
    const currencies = useMemo(
      () =>
        [
          { value: "USDT", label: "USDT", primary: true },
          { value: "CELO", label: "CELO", primary: false },
          { value: "FIAT", label: "FIAT", primary: false },
        ] as const,
      []
    );

    return (
      <div className="relative" ref={currencyDropdownRef}>
        <button
          onClick={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
          className="text-xs px-3 py-1.5 bg-[#35383F] hover:bg-[#3F4249] rounded-md text-gray-300 flex items-center transition-all duration-200 min-w-[70px] justify-between"
          aria-expanded={showCurrencyDropdown}
          aria-haspopup="listbox"
        >
          <span className="font-medium">{displayCurrency}</span>
          <motion.div
            animate={{ rotate: showCurrencyDropdown ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <IoChevronDown className="w-3 h-3 ml-1" />
          </motion.div>
        </button>

        <AnimatePresence>
          {showCurrencyDropdown && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 mt-2 w-28 bg-[#35383F] rounded-lg shadow-xl z-20 border border-[#3F4249] overflow-hidden"
              role="listbox"
            >
              {currencies.map((currency) => (
                <button
                  key={currency.value}
                  onClick={() => {
                    setDisplayCurrency(currency.value);
                    setShowCurrencyDropdown(false);
                  }}
                  className={`block w-full text-left px-3 py-2.5 text-xs transition-colors ${
                    displayCurrency === currency.value
                      ? "bg-red-500/20 text-red-400"
                      : "text-gray-300 hover:bg-[#3F4249]"
                  }`}
                  role="option"
                  aria-selected={displayCurrency === currency.value}
                >
                  <span className="font-medium">{currency.label}</span>
                  {currency.primary && (
                    <span className="text-xs text-gray-500 ml-1">(Main)</span>
                  )}
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
export default CurrencyDropdown;
