"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  ReactNode,
  useMemo,
} from "react";
import { ethers } from "ethers";

interface TokenBalance {
  address: string;
  symbol: string;
  name: string;
  balance: string;
  decimals: number;
  usdValue?: number;
}

interface BalanceState {
  nativeBalance: string;
  tokenBalances: TokenBalance[];
  totalUsdValue: number;
  isLoading: boolean;
  lastUpdated: number;
  error: string | null;
}

interface BalanceManagerContextType {
  balanceState: BalanceState;
  refreshBalances: (
    address: string,
    provider: ethers.Provider
  ) => Promise<void>;
  getTokenBalance: (tokenAddress: string) => TokenBalance | null;
  isStale: () => boolean;
  clearBalances: () => void;
}

const BalanceManagerContext = createContext<
  BalanceManagerContextType | undefined
>(undefined);

// Common token addresses for Celo Alfajores
const CELO_ALFAJORES_TOKENS = [
  {
    address: "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1",
    symbol: "cUSD",
    name: "Celo Dollar",
    decimals: 18,
  },
  {
    address: "0xF194afDf50B03e69Bd7D057c1Aa9e10c9954E4C9",
    symbol: "cEUR",
    name: "Celo Euro",
    decimals: 18,
  },
] as const;

// ERC-20 ABI for balance queries
const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
] as const;

interface BalanceManagerProviderProps {
  children: ReactNode;
  refreshInterval?: number;
}

export function BalanceManagerProvider({
  children,
  refreshInterval = 30000,
}: BalanceManagerProviderProps) {
  const [balanceState, setBalanceState] = useState<BalanceState>({
    nativeBalance: "0",
    tokenBalances: [],
    totalUsdValue: 0,
    isLoading: false,
    lastUpdated: 0,
    error: null,
  });

  // Refs for cleanup and optimization
  const abortControllerRef = useRef<AbortController | null>(null);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const cacheRef = useRef<Map<string, { balance: string; timestamp: number }>>(
    new Map()
  );

  // Memoized token contracts for reuse
  const tokenContracts = useMemo(() => new Map<string, ethers.Contract>(), []);

  // Price fetching with caching
  const fetchTokenPrices = useCallback(
    async (symbols: string[]): Promise<Record<string, number>> => {
      try {
        const response = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=celo,celo-dollar,celo-euro&vs_currencies=usd`,
          { signal: abortControllerRef.current?.signal }
        );

        if (!response.ok) return {};

        const data = await response.json();

        return {
          CELO: data.celo?.usd || 0,
          cUSD: data["celo-dollar"]?.usd || 1,
          cEUR: data["celo-euro"]?.usd || 1.1,
        };
      } catch (error) {
        console.warn("Failed to fetch token prices:", error);
        return {};
      }
    },
    []
  );

  // Optimized balance fetching with batching
  const fetchBalances = useCallback(
    async (
      address: string,
      provider: ethers.Provider
    ): Promise<Partial<BalanceState>> => {
      const cacheKey = `${address}-${Date.now()}`;
      const cached = cacheRef.current.get(address);

      // Return cached if fresh (within 10 seconds)
      if (cached && Date.now() - cached.timestamp < 10000) {
        return { nativeBalance: cached.balance };
      }

      try {
        // Batch all balance calls
        const [nativeBalance, ...tokenBalancePromises] =
          await Promise.allSettled([
            provider.getBalance(address),
            ...CELO_ALFAJORES_TOKENS.map(async (token) => {
              let contract = tokenContracts.get(token.address);
              if (!contract) {
                contract = new ethers.Contract(
                  token.address,
                  ERC20_ABI,
                  provider
                );
                tokenContracts.set(token.address, contract);
              }

              const balance = await contract.balanceOf(address);
              return {
                ...token,
                balance: ethers.formatUnits(balance, token.decimals),
              };
            }),
          ]);

        // Process native balance
        const nativeBalanceValue =
          nativeBalance.status === "fulfilled"
            ? ethers.formatEther(nativeBalance.value)
            : "0";

        // Cache native balance
        cacheRef.current.set(address, {
          balance: nativeBalanceValue,
          timestamp: Date.now(),
        });

        // Process token balances
        const tokenBalances: TokenBalance[] = tokenBalancePromises
          .map((result, index) => {
            if (result.status === "fulfilled") {
              return {
                address: CELO_ALFAJORES_TOKENS[index].address,
                ...result.value,
              };
            }
            return null;
          })
          .filter(Boolean) as TokenBalance[];

        // Fetch prices for USD values
        const symbols = ["CELO", ...tokenBalances.map((t) => t.symbol)];
        const prices = await fetchTokenPrices(symbols);

        // Calculate USD values
        const nativeUsdValue =
          parseFloat(nativeBalanceValue) * (prices.CELO || 0);
        let totalUsdValue = nativeUsdValue;

        const tokenBalancesWithUsd = tokenBalances.map((token) => {
          const usdValue =
            parseFloat(token.balance) * (prices[token.symbol] || 0);
          totalUsdValue += usdValue;
          return { ...token, usdValue };
        });

        return {
          nativeBalance: nativeBalanceValue,
          tokenBalances: tokenBalancesWithUsd,
          totalUsdValue,
          error: null,
        };
      } catch (error) {
        console.error("Failed to fetch balances:", error);
        return {
          error:
            error instanceof Error ? error.message : "Failed to fetch balances",
        };
      }
    },
    [tokenContracts, fetchTokenPrices]
  );

  // Main refresh function with debouncing
  const refreshBalances = useCallback(
    async (address: string, provider: ethers.Provider) => {
      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Clear previous timeout
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }

      abortControllerRef.current = new AbortController();

      setBalanceState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const balanceData = await fetchBalances(address, provider);

        setBalanceState((prev) => ({
          ...prev,
          ...balanceData,
          isLoading: false,
          lastUpdated: Date.now(),
        }));

        // Schedule next refresh
        refreshTimeoutRef.current = setTimeout(() => {
          refreshBalances(address, provider);
        }, refreshInterval);
      } catch (error) {
        if (error instanceof Error && error.name !== "AbortError") {
          setBalanceState((prev) => ({
            ...prev,
            isLoading: false,
            error: error.message,
          }));
        }
      }
    },
    [fetchBalances, refreshInterval]
  );

  // Get specific token balance
  const getTokenBalance = useCallback(
    (tokenAddress: string): TokenBalance | null => {
      return (
        balanceState.tokenBalances.find(
          (token) => token.address.toLowerCase() === tokenAddress.toLowerCase()
        ) || null
      );
    },
    [balanceState.tokenBalances]
  );

  // Check if data is stale
  const isStale = useCallback((): boolean => {
    return Date.now() - balanceState.lastUpdated > refreshInterval;
  }, [balanceState.lastUpdated, refreshInterval]);

  // Clear balances
  const clearBalances = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }

    cacheRef.current.clear();

    setBalanceState({
      nativeBalance: "0",
      tokenBalances: [],
      totalUsdValue: 0,
      isLoading: false,
      lastUpdated: 0,
      error: null,
    });
  }, []);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  const value = useMemo(
    () => ({
      balanceState,
      refreshBalances,
      getTokenBalance,
      isStale,
      clearBalances,
    }),
    [balanceState, refreshBalances, getTokenBalance, isStale, clearBalances]
  );

  return (
    <BalanceManagerContext.Provider value={value}>
      {children}
    </BalanceManagerContext.Provider>
  );
}

export function useBalanceManager(): BalanceManagerContextType {
  const context = useContext(BalanceManagerContext);
  if (!context) {
    throw new Error(
      "useBalanceManager must be used within BalanceManagerProvider"
    );
  }
  return context;
}
