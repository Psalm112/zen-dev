import { useState, useEffect, useCallback } from "react";

export type Currency = "USDT" | "CELO" | "FIAT";

interface ExchangeRates {
  USDT_CELO: number;
  USDT_FIAT: number;
  CELO_FIAT: number;
}

export const useCurrencyConverter = () => {
  const [rates, setRates] = useState<ExchangeRates>({
    USDT_CELO: 0,
    USDT_FIAT: 0,
    CELO_FIAT: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [userCountry, setUserCountry] = useState<string>("USD");
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>("USDT");

  // Fetch exchange rates from CoinGecko API
  const fetchRates = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Get user's country/currency using IP geolocation
      const geoResponse = await fetch("https://ipapi.co/json/");
      const geoData = await geoResponse.json();
      const localCurrency = geoData.currency || "USD";
      setUserCountry(localCurrency);

      // Fetch exchange rates from CoinGecko API
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=tether,celo&vs_currencies=${localCurrency.toLowerCase()},usd`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch exchange rates");
      }

      const data = await response.json();

      // Calculate exchange rates
      const usdtToFiat =
        data.tether[localCurrency.toLowerCase()] || data.tether.usd;
      const celoToFiat =
        data.celo[localCurrency.toLowerCase()] || data.celo.usd;
      const usdtToCelo = data.tether.usd / data.celo.usd;

      setRates({
        USDT_CELO: usdtToCelo,
        USDT_FIAT: usdtToFiat,
        CELO_FIAT: celoToFiat,
      });
    } catch (err) {
      setError((err as Error).message || "Failed to fetch exchange rates");
      // Fallback rates if API fails
      setRates({
        USDT_CELO: 0.5,
        USDT_FIAT: 1,
        CELO_FIAT: 2,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Convert price between currencies
  const convertPrice = useCallback(
    (price: number, from: Currency, to: Currency): number => {
      if (from === to) return price;

      switch (`${from}_${to}`) {
        case "USDT_CELO":
          return price * rates.USDT_CELO;
        case "USDT_FIAT":
          return price * rates.USDT_FIAT;
        case "CELO_USDT":
          return price / rates.USDT_CELO;
        case "CELO_FIAT":
          return price * rates.CELO_FIAT;
        case "FIAT_USDT":
          return price / rates.USDT_FIAT;
        case "FIAT_CELO":
          return price / rates.CELO_FIAT;
        default:
          return price;
      }
    },
    [rates]
  );

  // Format price with currency symbol
  const formatPrice = useCallback(
    (price: number, currency: Currency): string => {
      if (currency === "USDT") return `$${price.toFixed(2)}`;
      if (currency === "CELO") return `${price.toFixed(4)} CELO`;

      // Format fiat with local currency symbol
      return new Intl.NumberFormat(navigator.language, {
        style: "currency",
        currency: userCountry,
      }).format(price);
    },
    [userCountry]
  );

  // Fetch rates on component mount and set up refresh interval
  useEffect(() => {
    fetchRates();

    // Refresh rates every 5 minutes
    const interval = setInterval(fetchRates, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [fetchRates]);

  return {
    rates,
    loading,
    error,
    userCountry,
    selectedCurrency,
    setSelectedCurrency,
    convertPrice,
    formatPrice,
  };
};
