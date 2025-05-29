"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
  useMemo,
} from "react";
import { ethers } from "ethers";
import { inAppWallet } from "thirdweb/wallets";
import { createThirdwebClient, defineChain } from "thirdweb";
import { useCurrencyConverter } from "../utils/hooks/useCurrencyConverter";

export type WalletType = "eoa" | "smart" | "walletConnect" | "coinbase" | null;

// device and browser detection
const isMobile = () => {
  if (typeof window === "undefined") return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

const isIOS = () => {
  if (typeof window === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
};

const isAndroid = () => {
  if (typeof window === "undefined") return false;
  return /Android/.test(navigator.userAgent);
};

const hasMetaMask = () => {
  if (typeof window === "undefined") return false;
  return !!(window as any).ethereum?.isMetaMask;
};

const hasCoinbaseWallet = () => {
  if (typeof window === "undefined") return false;
  return !!(window as any).ethereum?.isCoinbaseWallet;
};

const isTrustWallet = () => {
  if (typeof window === "undefined") return false;
  return !!(window as any).ethereum?.isTrust;
};

// deep link
const WALLET_DEEP_LINKS = {
  metamask: {
    ios: "metamask://",
    android: "metamask://",
    universal: "https://metamask.app.link/dapp/",
  },
  trustwallet: {
    ios: "trust://",
    android: "trust://",
    universal: "https://link.trustwallet.com/open_url?coin_id=60&url=",
  },
  coinbase: {
    ios: "cbwallet://",
    android: "cbwallet://",
    universal: "https://go.cb-w.com/dapp?cb_url=",
  },
  rainbow: {
    ios: "rainbow://",
    android: "rainbow://",
    universal: "https://rnbwapp.com/",
  },
};

const USDT_CONTRACT_ADDRESS = import.meta.env.VITE_USDT_CONTRACT_ADDRESS;

const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
];

const RPC_ENDPOINTS = [
  "https://alfajores-forno.celo-testnet.org",
  "https://celo-alfajores.infura.io/v3/" + import.meta.env.VITE_INFURA_KEY,
  "https://alfajores-forno.celo-testnet.org",
];
// Chain definitions with fallback RPCs
const supportedChains = {
  celoAlfajores: defineChain({
    id: 44787,
    name: "Celo Alfajores Testnet",
    nativeCurrency: { name: "Celo", symbol: "CELO", decimals: 18 },
    rpc: "https://alfajores-forno.celo-testnet.org",
    blockExplorers: [
      {
        name: "Celo Explorer",
        url: "https://alfajores-blockscout.celo-testnet.org",
      },
    ],
  }),
};

// storage
const walletStorage = {
  getItem: async (key: string) => {
    try {
      return localStorage.getItem(`WALLET_${key}`);
    } catch (error) {
      console.warn(`Failed to get item ${key} from storage:`, error);
      return null;
    }
  },
  setItem: async (key: string, value: string) => {
    try {
      localStorage.setItem(`WALLET_${key}`, value);
    } catch (error) {
      console.warn(`Failed to set item ${key} in storage:`, error);
    }
  },
  removeItem: async (key: string) => {
    try {
      localStorage.removeItem(`WALLET_${key}`);
    } catch (error) {
      console.warn(`Failed to remove item ${key} from storage:`, error);
    }
  },
};

// ThirdWeb client
const thirdwebClient = createThirdwebClient({
  clientId: import.meta.env.VITE_THIRDWEB_CLIENT_ID,
});

export interface WalletInfo {
  name: string;
  icon: string;
  installed: boolean;
  mobile: boolean;
  desktop: boolean;
  deepLink?: string;
  downloadUrl?: string;
}

export interface WalletContextType {
  account: string | null;
  chainId: number;
  balance: string | null;
  celoBalance: string | null;
  usdtBalance: string | null;
  walletType: WalletType;
  isConnected: boolean;
  isConnecting: boolean;
  provider: ethers.Provider | null;
  signer: ethers.Signer | null;
  displayCurrency: "USDT" | "CELO" | "FIAT";
  setDisplayCurrency: (currency: "USDT" | "CELO" | "FIAT") => void;
  formattedBalance: string;
  balanceInUSDT: string | null;
  balanceInCELO: string | null;
  balanceInFiat: string | null;
  availableWallets: WalletInfo[];
  deviceInfo: {
    isMobile: boolean;
    isIOS: boolean;
    isAndroid: boolean;
    hasMetaMask: boolean;
    hasCoinbaseWallet: boolean;
    isTrustWallet: boolean;
  };
  connectMetaMask: () => Promise<string>;
  connectCoinbaseWallet: () => Promise<string>;
  connectWalletConnect: () => Promise<string>;
  connectEmail: (
    email: string,
    code?: string
  ) => Promise<{ address: string; preAuth?: boolean; type?: string }>;
  connectPhone: (
    phone: string,
    code?: string
  ) => Promise<{ address: string; preAuth?: boolean; type?: string }>;
  connectGoogle: () => Promise<{
    address: string;
    preAuth?: boolean;
    type?: string;
  }>;
  connectPasskey: () => Promise<{
    address: string;
    preAuth?: boolean;
    type?: string;
  }>;
  connectGuest: () => Promise<{
    address: string;
    preAuth?: boolean;
    type?: string;
  }>;
  openWalletApp: (walletName: string) => Promise<void>;
  switchChain: (chainId: number) => Promise<void>;
  disconnect: () => void;
  connect: (walletType?: string) => Promise<
    | string
    | {
        address: string;
        preAuth?: boolean;
        type?: string;
      }
  >;
}

export const WalletContext = createContext<WalletContextType | undefined>(
  undefined
);

// Provider
interface WalletProviderProps {
  children: ReactNode;
  defaultChainId?: number;
}

export function WalletProvider({
  children,
  defaultChainId = 44787, // Default to Celo Alfajores
}: WalletProviderProps) {
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number>(defaultChainId);
  const [balance, setBalance] = useState<string | null>(null);
  const [celoBalance, setCeloBalance] = useState<string | null>(null);
  const [usdtBalance, setUsdtBalance] = useState<string | null>(null);
  const [walletType, setWalletType] = useState<WalletType>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [provider, setProvider] = useState<ethers.Provider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | any>(null);
  const [displayCurrency, setDisplayCurrency] = useState<
    "USDT" | "CELO" | "FIAT"
  >("USDT");
  const { convertPrice, formatPrice } = useCurrencyConverter();

  // Device information
  const deviceInfo = useMemo(
    () => ({
      isMobile: isMobile(),
      isIOS: isIOS(),
      isAndroid: isAndroid(),
      hasMetaMask: hasMetaMask(),
      hasCoinbaseWallet: hasCoinbaseWallet(),
      isTrustWallet: isTrustWallet(),
    }),
    []
  );

  // Available wallets based on device and environment
  const availableWallets = useMemo((): WalletInfo[] => {
    const wallets: WalletInfo[] = [];

    // MetaMask
    if (deviceInfo.isMobile) {
      wallets.push({
        name: "MetaMask",
        icon: "/icons/metamask.svg",
        installed: deviceInfo.hasMetaMask,
        mobile: true,
        desktop: false,
        deepLink: deviceInfo.isIOS
          ? WALLET_DEEP_LINKS.metamask.ios
          : WALLET_DEEP_LINKS.metamask.android,
        downloadUrl: deviceInfo.isIOS
          ? "https://apps.apple.com/app/metamask/id1438144202"
          : "https://play.google.com/store/apps/details?id=io.metamask",
      });
    } else {
      wallets.push({
        name: "MetaMask",
        icon: "/icons/metamask.svg",
        installed: deviceInfo.hasMetaMask,
        mobile: false,
        desktop: true,
        downloadUrl: "https://metamask.io/download/",
      });
    }

    // Coinbase Wallet
    wallets.push({
      name: "Coinbase Wallet",
      icon: "/icons/coinbase.svg",
      installed: deviceInfo.hasCoinbaseWallet,
      mobile: deviceInfo.isMobile,
      desktop: !deviceInfo.isMobile,
      deepLink: deviceInfo.isMobile
        ? deviceInfo.isIOS
          ? WALLET_DEEP_LINKS.coinbase.ios
          : WALLET_DEEP_LINKS.coinbase.android
        : undefined,
      downloadUrl: deviceInfo.isMobile
        ? deviceInfo.isIOS
          ? "https://apps.apple.com/app/coinbase-wallet/id1278383455"
          : "https://play.google.com/store/apps/details?id=org.toshi"
        : "https://wallet.coinbase.com/",
    });

    // Trust Wallet (mobile only)
    if (deviceInfo.isMobile) {
      wallets.push({
        name: "Trust Wallet",
        icon: "/icons/trustwallet.svg",
        installed: deviceInfo.isTrustWallet,
        mobile: true,
        desktop: false,
        deepLink: deviceInfo.isIOS
          ? WALLET_DEEP_LINKS.trustwallet.ios
          : WALLET_DEEP_LINKS.trustwallet.android,
        downloadUrl: deviceInfo.isIOS
          ? "https://apps.apple.com/app/trust-crypto-bitcoin-wallet/id1288339409"
          : "https://play.google.com/store/apps/details?id=com.wallet.crypto.trustapp",
      });

      // Rainbow Wallet
      wallets.push({
        name: "Rainbow",
        icon: "/icons/rainbow.svg",
        installed: false,
        mobile: true,
        desktop: false,
        deepLink: deviceInfo.isIOS
          ? WALLET_DEEP_LINKS.rainbow.ios
          : WALLET_DEEP_LINKS.rainbow.android,
        downloadUrl: deviceInfo.isIOS
          ? "https://apps.apple.com/app/rainbow-ethereum-wallet/id1457119021"
          : "https://play.google.com/store/apps/details?id=me.rainbow",
      });
    }

    // WalletConnect (universal)
    wallets.push({
      name: "WalletConnect",
      icon: "/icons/walletconnect.svg",
      installed: true,
      mobile: true,
      desktop: true,
    });

    return wallets;
  }, [deviceInfo]);

  // inAppWallet
  const smartWallet = useMemo(
    () =>
      inAppWallet({
        smartAccount: {
          chain: supportedChains.celoAlfajores,
          sponsorGas: true,
        },
        auth: {
          mode: deviceInfo.isMobile ? "redirect" : "popup",
          options: ["google", "email", "phone", "passkey", "guest", "wallet"],
          defaultSmsCountryCode: "NG",
          passkeyDomain:
            typeof window !== "undefined"
              ? window.location.hostname
              : "localhost",
        },
        hidePrivateKeyExport: true,
        metadata: {
          image: { src: "/favicon.png", alt: "Logo", width: 100, height: 100 },
        },
        storage: walletStorage,
      }),
    [deviceInfo.isMobile]
  );

  // retry utility
  const withRetry = useCallback(
    async <T,>(
      fn: () => Promise<T>,
      maxRetries = 3,
      delay = 1000,
      backoff = 2
    ): Promise<T> => {
      let attempt = 0;
      let lastError: Error;

      while (attempt < maxRetries) {
        try {
          return await fn();
        } catch (err: any) {
          lastError = err;
          attempt++;

          // Don't retry on user rejection or certain errors
          if (
            err.code === 4001 || // User rejected
            err.code === -32002 || // Already pending
            err.message?.includes("User rejected") ||
            attempt >= maxRetries
          ) {
            throw err;
          }

          // Exponential backoff
          const waitTime = delay * Math.pow(backoff, attempt - 1);
          await new Promise((resolve) => setTimeout(resolve, waitTime));
        }
      }

      throw lastError!;
    },
    []
  );

  // provider creation with fallback RPCs
  const createProvider = useCallback(
    async (rpcUrls: string[]): Promise<ethers.Provider> => {
      for (const rpc of rpcUrls) {
        try {
          const provider = new ethers.JsonRpcProvider(rpc);
          await provider.getBlockNumber();
          return provider;
        } catch (error) {
          console.warn(`Failed to connect to RPC ${rpc}:`, error);
          continue;
        }
      }
      throw new Error("All RPC endpoints failed");
    },
    []
  );

  // Fetch USDT token balance
  const fetchUSDTBalance = useCallback(
    async (addr: string, prov: ethers.Provider): Promise<string> => {
      try {
        if (!USDT_CONTRACT_ADDRESS) {
          console.warn("USDT contract address not configured");
          return "0.00 USDT";
        }

        const usdtContract = new ethers.Contract(
          USDT_CONTRACT_ADDRESS,
          ERC20_ABI,
          prov
        );

        const [balance, decimals] = await Promise.all([
          usdtContract.balanceOf(addr),
          usdtContract.decimals(),
        ]);

        const formattedBalance = parseFloat(
          ethers.formatUnits(balance, decimals)
        ).toFixed(2);

        return `${formattedBalance} USDT`;
      } catch (error) {
        console.error("Error fetching USDT balance:", error);
        return "0.00 USDT";
      }
    },
    []
  );

  // Fetch native CELO balance
  const fetchCELOBalance = useCallback(
    async (addr: string, prov: ethers.Provider): Promise<string> => {
      try {
        const wei = await prov.getBalance(addr);
        const celo = parseFloat(ethers.formatEther(wei)).toFixed(4);
        return `${celo} CELO`;
      } catch (error) {
        console.error("Error fetching CELO balance:", error);
        return "0.0000 CELO";
      }
    },
    []
  );

  const fetchBalances = useCallback(
    async (addr: string, prov: ethers.Provider) => {
      try {
        const [usdtBal, celoBal] = await Promise.allSettled([
          withRetry(() => fetchUSDTBalance(addr, prov)),
          withRetry(() => fetchCELOBalance(addr, prov)),
        ]);

        const usdtBalance =
          usdtBal.status === "fulfilled" ? usdtBal.value : "0.00 USDT";
        const celoBalance =
          celoBal.status === "fulfilled" ? celoBal.value : "0.0000 CELO";

        setUsdtBalance(usdtBalance);
        setCeloBalance(celoBalance);
        setBalance(usdtBalance); // Primary balance is USDT
      } catch (error) {
        console.error("Error fetching balances:", error);
        setUsdtBalance("0.00 USDT");
        setCeloBalance("0.0000 CELO");
        setBalance("0.00 USDT");
      }
    },
    [fetchUSDTBalance, fetchCELOBalance, withRetry]
  );

  // Parse balance values for calculations
  const usdtBalanceValue = useMemo(() => {
    if (!usdtBalance) return 0;
    const balanceStr = usdtBalance.split(" ")[0];
    return parseFloat(balanceStr) || 0;
  }, [usdtBalance]);

  const celoBalanceValue = useMemo(() => {
    if (!celoBalance) return 0;
    const balanceStr = celoBalance.split(" ")[0];
    return parseFloat(balanceStr) || 0;
  }, [celoBalance]);

  // Balance conversions based on display currency
  const balanceInUSDT = useMemo(() => {
    if (usdtBalanceValue === 0) return "0.00 USDT";
    return formatPrice(usdtBalanceValue, "USDT");
  }, [usdtBalanceValue, formatPrice]);

  const balanceInCELO = useMemo(() => {
    if (usdtBalanceValue === 0) return "0.0000 CELO";
    const celoValue = convertPrice(usdtBalanceValue, "USDT", "CELO");
    return formatPrice(celoValue, "CELO");
  }, [usdtBalanceValue, convertPrice, formatPrice]);

  const balanceInFiat = useMemo(() => {
    if (usdtBalanceValue === 0) return formatPrice(0, "FIAT");
    const fiatValue = convertPrice(usdtBalanceValue, "USDT", "FIAT");
    return formatPrice(fiatValue, "FIAT");
  }, [usdtBalanceValue, convertPrice, formatPrice]);

  const formattedBalance = useMemo(() => {
    if (displayCurrency === "USDT") return balanceInUSDT || "Loading...";
    if (displayCurrency === "CELO") return balanceInCELO || "Loading...";
    return balanceInFiat || "Loading...";
  }, [displayCurrency, balanceInUSDT, balanceInCELO, balanceInFiat]);

  // Reset all wallet state
  const reset = useCallback(() => {
    setAccount(null);
    setBalance(null);
    setCeloBalance(null);
    setUsdtBalance(null);
    setProvider(null);
    setSigner(null);
    setWalletType(null);
    setIsConnected(false);
    walletStorage.removeItem("walletType");
    walletStorage.removeItem("account");
    walletStorage.removeItem("chainId");
  }, []);

  // Open wallet app on mobile
  const openWalletApp = useCallback(
    async (walletName: string): Promise<void> => {
      if (!deviceInfo.isMobile) return;

      const wallet = availableWallets.find((w) => w.name === walletName);
      if (!wallet?.deepLink) return;

      const currentUrl = window.location.href;
      let deepLinkUrl = "";

      switch (walletName) {
        case "MetaMask":
          deepLinkUrl = `${wallet.deepLink}${encodeURIComponent(currentUrl)}`;
          break;
        case "Trust Wallet":
          deepLinkUrl = `${
            WALLET_DEEP_LINKS.trustwallet.universal
          }${encodeURIComponent(currentUrl)}`;
          break;
        case "Coinbase Wallet":
          deepLinkUrl = `${
            WALLET_DEEP_LINKS.coinbase.universal
          }${encodeURIComponent(currentUrl)}`;
          break;
        default:
          deepLinkUrl = wallet.deepLink;
      }

      try {
        window.location.href = deepLinkUrl;

        // Fallback to app store after a delay
        setTimeout(() => {
          if (wallet.downloadUrl) {
            window.open(wallet.downloadUrl, "_blank");
          }
        }, 2000);
      } catch (error) {
        console.error("Failed to open wallet app:", error);
        if (wallet.downloadUrl) {
          window.open(wallet.downloadUrl, "_blank");
        }
      }
    },
    [deviceInfo.isMobile, availableWallets]
  );

  // MetaMask connection
  const connectMetaMask = useCallback(async (): Promise<string> => {
    setIsConnecting(true);
    try {
      if (deviceInfo.isMobile && !deviceInfo.hasMetaMask) {
        await openWalletApp("MetaMask");
        throw new Error("Please open MetaMask app and try again");
      }

      if (!(window as any).ethereum) {
        throw new Error("MetaMask not installed");
      }

      const ethereum = (window as any).ethereum;

      // accounts response
      const accounts = (await withRetry(() =>
        ethereum.request({ method: "eth_requestAccounts" })
      )) as string[];

      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts found");
      }

      const bp = new ethers.BrowserProvider(ethereum);
      const network = await bp.getNetwork();
      const signer = await bp.getSigner();

      setProvider(bp);
      setSigner(signer);
      setAccount(accounts[0]);
      setChainId(Number(network.chainId));
      setWalletType("eoa");
      setIsConnected(true);

      await walletStorage.setItem("walletType", "eoa");
      await walletStorage.setItem("account", accounts[0]);
      await walletStorage.setItem("chainId", network.chainId.toString());

      await fetchBalances(accounts[0], bp);
      return accounts[0];
    } finally {
      setIsConnecting(false);
    }
  }, [deviceInfo, openWalletApp, withRetry, fetchBalances]);

  // Coinbase Wallet connection
  const connectCoinbaseWallet = useCallback(async (): Promise<string> => {
    setIsConnecting(true);
    try {
      if (deviceInfo.isMobile && !deviceInfo.hasCoinbaseWallet) {
        await openWalletApp("Coinbase Wallet");
        throw new Error("Please open Coinbase Wallet app and try again");
      }

      const ethereum = (window as any).ethereum;
      if (!ethereum?.isCoinbaseWallet) {
        throw new Error("Coinbase Wallet not installed");
      }

      const accounts = (await withRetry(() =>
        ethereum.request({ method: "eth_requestAccounts" })
      )) as string[];

      const bp = new ethers.BrowserProvider(ethereum);
      const network = await bp.getNetwork();
      const signer = await bp.getSigner();

      setProvider(bp);
      setSigner(signer);
      setAccount(accounts[0]);
      setChainId(Number(network.chainId));
      setWalletType("coinbase");
      setIsConnected(true);

      await walletStorage.setItem("walletType", "coinbase");
      await walletStorage.setItem("account", accounts[0]);
      await walletStorage.setItem("chainId", network.chainId.toString());

      await fetchBalances(accounts[0], bp);
      return accounts[0];
    } finally {
      setIsConnecting(false);
    }
  }, [deviceInfo, openWalletApp, withRetry, fetchBalances]);

  // WalletConnect integration
  const connectWalletConnect = useCallback(async (): Promise<string> => {
    setIsConnecting(true);
    try {
      // This would typically use @walletconnect/web3-provider
      // For now, we'll use the smart wallet as fallback
      return (await connectGuest()).address;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  // Initialize from localStorage
  useEffect(() => {
    (async () => {
      try {
        const storedWalletType = await walletStorage.getItem("walletType");
        const storedAccount = await walletStorage.getItem("account");
        const storedChainId = await walletStorage.getItem("chainId");

        if (storedWalletType && storedAccount) {
          setWalletType(storedWalletType as WalletType);
          setAccount(storedAccount);
          setChainId(storedChainId ? parseInt(storedChainId) : defaultChainId);
          setIsConnected(true);

          if (storedWalletType === "eoa" && (window as any).ethereum) {
            const bp = new ethers.BrowserProvider((window as any).ethereum);
            const signer = await bp.getSigner();
            setProvider(bp);
            setSigner(signer);
            await fetchBalances(storedAccount, bp);
          } else if (storedWalletType === "smart") {
            const rp = await createProvider(RPC_ENDPOINTS);
            setProvider(rp);
            await fetchBalances(storedAccount, rp);
          }
        }
      } catch (error) {
        console.error("Failed to initialize wallet from storage:", error);
        reset();
      } finally {
        setIsInitialized(true);
      }
    })();
  }, [defaultChainId, fetchBalances, createProvider, reset]);

  // MetaMask event handlers
  useEffect(() => {
    if (walletType !== "eoa" || !(window as any).ethereum) return;

    const ethereum = (window as any).ethereum;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        reset();
      } else {
        setAccount(accounts[0]);
        walletStorage.setItem("account", accounts[0]);
      }
    };

    const handleChainChanged = (chainId: string) => {
      const newChainId = parseInt(chainId, 16);
      setChainId(newChainId);
      walletStorage.setItem("chainId", newChainId.toString());
    };

    const handleDisconnect = () => {
      reset();
    };

    ethereum.on("accountsChanged", handleAccountsChanged);
    ethereum.on("chainChanged", handleChainChanged);
    ethereum.on("disconnect", handleDisconnect);

    return () => {
      ethereum.removeListener("accountsChanged", handleAccountsChanged);
      ethereum.removeListener("chainChanged", handleChainChanged);
      ethereum.removeListener("disconnect", handleDisconnect);
    };
  }, [walletType, reset]);

  // Smart wallet connection methods
  const smartConnect = useCallback(
    async (
      strategy: "google" | "email" | "phone" | "passkey" | "guest",
      opts?: any
    ): Promise<{ address: string; preAuth?: boolean; type?: string }> => {
      setIsConnecting(true);
      try {
        const chainDef = supportedChains.celoAlfajores;

        const connOpts: any = {
          client: thirdwebClient,
          chain: chainDef,
          strategy,
        };

        if (strategy === "email") {
          connOpts.email = opts.email;
          if (opts.verificationCode) {
            connOpts.verificationCode = opts.verificationCode;
          }
        }
        if (strategy === "phone") {
          connOpts.phoneNumber = opts.phoneNumber;
          if (opts.verificationCode) {
            connOpts.verificationCode = opts.verificationCode;
          }
        }

        const wallet = await withRetry(() => smartWallet.connect(connOpts));
        const rp = await createProvider(RPC_ENDPOINTS);

        setProvider(rp);
        setSigner(wallet);
        setAccount(wallet.address);
        setWalletType("smart");
        setIsConnected(true);

        await walletStorage.setItem("walletType", "smart");
        await walletStorage.setItem("account", wallet.address);
        await walletStorage.setItem("chainId", chainDef.id.toString());

        await fetchBalances(wallet.address, rp);
        return { address: wallet.address };
      } finally {
        setIsConnecting(false);
      }
    },
    [fetchBalances, smartWallet, withRetry, createProvider]
  );

  const connectGoogle = useCallback(
    () => smartConnect("google"),
    [smartConnect]
  );

  const connectEmail = useCallback(
    (email: string, code?: string) =>
      smartConnect("email", { email, verificationCode: code }),
    [smartConnect]
  );

  const connectPhone = useCallback(
    (phone: string, code?: string) =>
      smartConnect("phone", { phoneNumber: phone, verificationCode: code }),
    [smartConnect]
  );

  const connectPasskey = useCallback(
    () => smartConnect("passkey"),
    [smartConnect]
  );

  const connectGuest = useCallback(() => smartConnect("guest"), [smartConnect]);

  // universal connect
  const connect = useCallback(
    async (
      walletType?: string
    ): Promise<
      string | { address: string; preAuth?: boolean; type?: string }
    > => {
      if (walletType) {
        switch (walletType) {
          case "metamask":
            return connectMetaMask();
          case "coinbase":
            return connectCoinbaseWallet();
          case "walletconnect":
            return connectWalletConnect();
          case "google":
            return connectGoogle();
          case "email":
            throw new Error(
              "Email connection requires email parameter. Use connectEmail directly."
            );
          case "phone":
            throw new Error(
              "Phone connection requires phone parameter. Use connectPhone directly."
            );
          case "passkey":
            return connectPasskey();
          case "guest":
            return connectGuest();
          default:
            throw new Error(`Unsupported wallet type: ${walletType}`);
        }
      }

      if (deviceInfo.isMobile) {
        if (deviceInfo.hasMetaMask) {
          return connectMetaMask();
        } else if (deviceInfo.hasCoinbaseWallet) {
          return connectCoinbaseWallet();
        } else {
          return connectGuest();
        }
      } else {
        if (deviceInfo.hasMetaMask) {
          return connectMetaMask();
        } else if (deviceInfo.hasCoinbaseWallet) {
          return connectCoinbaseWallet();
        } else {
          return connectGuest();
        }
      }
    },
    [
      deviceInfo,
      connectMetaMask,
      connectCoinbaseWallet,
      connectWalletConnect,
      connectGoogle,
      connectPasskey,
      connectGuest,
    ]
  );

  // chain switching
  const switchChain = useCallback(
    async (newChainId: number) => {
      if (!isConnected) {
        throw new Error("Wallet not connected");
      }

      try {
        if (walletType === "eoa" && (window as any).ethereum) {
          const ethereum = (window as any).ethereum;
          const hexChainId = `0x${newChainId.toString(16)}`;

          try {
            await ethereum.request({
              method: "wallet_switchEthereumChain",
              params: [{ chainId: hexChainId }],
            });
          } catch (switchError: any) {
            if (switchError.code === 4902) {
              const chainConfig = supportedChains.celoAlfajores;

              await ethereum.request({
                method: "wallet_addEthereumChain",
                params: [
                  {
                    chainId: hexChainId,
                    chainName: chainConfig.name,
                    nativeCurrency: chainConfig.nativeCurrency,
                    rpcUrls: RPC_ENDPOINTS, // Use RPC array
                    blockExplorerUrls: chainConfig.blockExplorers?.map(
                      (explorer) => explorer.url
                    ),
                  },
                ],
              });
            } else {
              throw switchError;
            }
          }
        }

        setChainId(newChainId);
        await walletStorage.setItem("chainId", newChainId.toString());

        if (account && provider) {
          await fetchBalances(account, provider);
        }
      } catch (error) {
        console.error("Failed to switch chain:", error);
        throw error;
      }
    },
    [walletType, isConnected, account, provider, fetchBalances]
  );

  const disconnect = useCallback(async () => {
    try {
      // Disconnect smart wallet if connected
      if (walletType === "smart") {
        await smartWallet.disconnect();
      }

      // Clear ethereum listeners if EOA wallet
      if (walletType === "eoa" && (window as any).ethereum) {
        const ethereum = (window as any).ethereum;
      }
    } catch (error) {
      console.error("Error during wallet disconnect:", error);
    } finally {
      reset();
      setIsConnecting(false);
    }
  }, [walletType, smartWallet, reset]);

  // Auto-refresh balances periodically
  useEffect(() => {
    if (!isConnected || !account || !provider) return;

    const refreshBalances = async () => {
      try {
        await fetchBalances(account, provider);
      } catch (error) {
        console.error("Failed to refresh balances:", error);
      }
    };

    // Refresh balances every 30 seconds
    const interval = setInterval(refreshBalances, 30000);

    return () => clearInterval(interval);
  }, [isConnected, account, provider, fetchBalances]);

  // Network connectivity check
  useEffect(() => {
    const handleOnline = () => {
      if (isConnected && account && provider) {
        fetchBalances(account, provider);
      }
    };

    const handleOffline = () => {
      console.warn("Network connection lost");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [isConnected, account, provider, fetchBalances]);

  // Context value
  const value = useMemo(
    () => ({
      account,
      chainId,
      balance,
      celoBalance,
      usdtBalance,
      walletType,
      isConnected,
      isConnecting,
      provider,
      signer,
      displayCurrency,
      setDisplayCurrency,
      formattedBalance,
      balanceInUSDT,
      balanceInCELO,
      balanceInFiat,
      availableWallets,
      deviceInfo,
      connectMetaMask,
      connectCoinbaseWallet,
      connectWalletConnect,
      connectEmail,
      connectPhone,
      connectGoogle,
      connectPasskey,
      connectGuest,
      openWalletApp,
      switchChain,
      disconnect,
      connect,
    }),
    [
      account,
      chainId,
      balance,
      celoBalance,
      usdtBalance,
      walletType,
      isConnected,
      isConnecting,
      provider,
      signer,
      displayCurrency,
      formattedBalance,
      balanceInUSDT,
      balanceInCELO,
      balanceInFiat,
      availableWallets,
      deviceInfo,
      connectMetaMask,
      connectCoinbaseWallet,
      connectWalletConnect,
      connectEmail,
      connectPhone,
      connectGoogle,
      connectPasskey,
      connectGuest,
      openWalletApp,
      switchChain,
      disconnect,
      connect,
    ]
  );

  // Loading
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-screen bg-Dark">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-Red border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Initializing wallet...</p>
        </div>
      </div>
    );
  }

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
}

export function useWallet(): WalletContextType {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within WalletProvider");
  }
  return context;
}

// wallet recommendations
export function useWalletRecommendations() {
  const { deviceInfo, availableWallets } = useWallet();

  const getRecommendedWallets = useCallback(() => {
    const installed = availableWallets.filter((w) => w.installed);
    const notInstalled = availableWallets.filter((w) => !w.installed);

    // Prioritize installed wallets
    const recommendations = [...installed, ...notInstalled];

    // Smart wallet options for users without any wallet
    if (installed.length === 0) {
      const smartWalletOptions = [
        { name: "Email", type: "email", icon: "/icons/email.svg" },
        { name: "Google", type: "google", icon: "/icons/google.svg" },
        { name: "Phone", type: "phone", icon: "/icons/phone.svg" },
      ];

      if (deviceInfo.isMobile) {
        smartWalletOptions.push({
          name: "Passkey",
          type: "passkey",
          icon: "/icons/passkey.svg",
        });
      }

      return {
        wallets: recommendations,
        smartWalletOptions,
        hasInstalledWallets: false,
      };
    }

    return {
      wallets: recommendations,
      smartWalletOptions: [],
      hasInstalledWallets: true,
    };
  }, [availableWallets, deviceInfo]);

  return { getRecommendedWallets };
}

// Error boundary for wallet operations
export class WalletErrorBoundary extends React.Component<
  { children: ReactNode; fallback?: ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: ReactNode; fallback?: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("Wallet error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="text-red-500 text-6xl mb-4">⚠️</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Wallet Connection Error
              </h3>
              <p className="text-gray-600 mb-4">
                Something went wrong with the wallet connection.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Reload Page
              </button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
