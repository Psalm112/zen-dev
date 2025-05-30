// hooks/useWalletBalance.ts
import { useState, useCallback, useEffect } from "react";
import { ethers } from "ethers";
import { useConnection } from "../../context/WalletConnectionContext";
import { useCurrencyConverter } from "./useCurrencyConverter";
import { USDT_CONTRACT_ADDRESS, USDT_ABI } from "../config/wallet.config";

export function useWalletBalance() {
  const { account, provider } = useConnection();
  const { convertPrice, formatPrice } = useCurrencyConverter();

  const [balances, setBalances] = useState({
    celo: "0",
    usdt: "0",
    fiat: "0",
  });
  const [isLoading, setIsLoading] = useState(false);

  const fetchBalance = useCallback(async () => {
    if (!account || !provider) {
      setBalances({ celo: "0", usdt: "0", fiat: "0" });
      return;
    }

    setIsLoading(true);
    try {
      // Fetch CELO balance
      const celoBalanceWei = await provider.getBalance(account);
      const celoBalance = ethers.formatEther(celoBalanceWei);

      // Fetch USDT balance if contract exists
      let usdtBalance = "0";
      if (USDT_CONTRACT_ADDRESS) {
        const usdtContract = new ethers.Contract(
          USDT_CONTRACT_ADDRESS,
          USDT_ABI,
          provider
        );
        const usdtBalanceWei = await usdtContract.balanceOf(account);
        usdtBalance = ethers.formatUnits(usdtBalanceWei, 6);
      }

      // Convert to fiat
      const celoInFiat = convertPrice(parseFloat(celoBalance), "CELO", "FIAT");
      const usdtInFiat = convertPrice(parseFloat(usdtBalance), "USDT", "FIAT");
      const totalFiat = (celoInFiat + usdtInFiat).toString();

      setBalances({
        celo: celoBalance,
        usdt: usdtBalance,
        fiat: totalFiat,
      });
    } catch (error) {
      console.error("Failed to fetch balances:", error);
      setBalances({ celo: "0", usdt: "0", fiat: "0" });
    } finally {
      setIsLoading(false);
    }
  }, [account, provider, convertPrice]);

  // Auto-refresh on account/provider change
  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  return {
    balances,
    isLoading,
    refetch: fetchBalance,
  };
}
