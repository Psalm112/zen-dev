import { IoMdSwap } from "react-icons/io";
import { useCurrency } from "../../context/CurrencyContext";
import { useCurrencyConverter } from "../../utils/hooks/useCurrencyConverter";

const CurrencyToggle = () => {
  const { secondaryCurrency, toggleSecondaryCurrency } = useCurrency();
  const { userCountry } = useCurrencyConverter();

  return (
    <button
      onClick={toggleSecondaryCurrency}
      className="flex items-center gap-1 px-2 py-1 rounded bg-[#373A3F] hover:bg-[#42464d] transition-colors"
      aria-label="Toggle secondary currency display"
    >
      <span className="text-xs text-white">
        {secondaryCurrency === "USDT" ? "USD" : userCountry}
      </span>
      <IoMdSwap className="text-white text-xs" />
    </button>
  );
};

export default CurrencyToggle;
