"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { ethers } from "ethers";
import { inAppWallet } from "thirdweb/wallets";
import { createThirdwebClient, defineChain } from "thirdweb";
import { EthereumProvider } from "@walletconnect/ethereum-provider";
import { useBalanceManager } from "./BalanceContext";
import { useProviderPool } from "./ProviderPoolContext";
import { WalletErrorBoundary } from "../components/WalletErrorBoundary";

export type WalletType = "eoa" | "smart" | "walletConnect" | "coinbase" | null;

// Device detection with memoization
const createDeviceInfo = () => {
  if (typeof window === "undefined") {
    return {
      isMobile: false,
      isIOS: false,
      isAndroid: false,
      hasMetaMask: false,
      hasCoinbaseWallet: false,
      isTrustWallet: false,
    };
  }

  const userAgent = navigator.userAgent;
  return {
    isMobile:
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        userAgent
      ),
    isIOS: /iPad|iPhone|iPod/.test(userAgent),
    isAndroid: /Android/.test(userAgent),
    hasMetaMask: !!(window as any).ethereum?.isMetaMask,
    hasCoinbaseWallet: !!(window as any).ethereum?.isCoinbaseWallet,
    isTrustWallet: !!(window as any).ethereum?.isTrust,
  };
};

// Optimized storage with error boundaries
const createWalletStorage = () => ({
  getItem: async (key: string): Promise<string | null> => {
    try {
      return localStorage.getItem(`WALLET_${key}`);
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      localStorage.setItem(`WALLET_${key}`, value);
    } catch {
      // Silent fail for privacy mode
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      localStorage.removeItem(`WALLET_${key}`);
    } catch {
      // Silent fail
    }
  },
});

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
} as const;

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
  walletType: WalletType;
  isConnected: boolean;
  isConnecting: boolean;
  provider: ethers.Provider | null;
  signer: ethers.Signer | null;
  availableWallets: WalletInfo[];
  deviceInfo: ReturnType<typeof createDeviceInfo>;
  connectMetaMask: () => Promise<string>;
  connectCoinbaseWallet: () => Promise<string>;
  connectWalletConnect: () => Promise<string>;
  connectEmail: (
    email: string,
    code?: string
  ) => Promise<{ address: string; preAuth?: boolean }>;
  connectPhone: (
    phone: string,
    code?: string
  ) => Promise<{ address: string; preAuth?: boolean }>;
  connectGoogle: () => Promise<{ address: string; preAuth?: boolean }>;
  connectPasskey: () => Promise<{ address: string; preAuth?: boolean }>;
  connectGuest: () => Promise<{ address: string; preAuth?: boolean }>;
  openWalletApp: (walletName: string) => Promise<void>;
  switchChain: (chainId: number) => Promise<void>;
  disconnect: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

// Optimized chain configuration
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

// Memoized ThirdWeb client
const thirdwebClient = createThirdwebClient({
  clientId: import.meta.env.VITE_THIRDWEB_CLIENT_ID,
});

interface WalletProviderProps {
  children: ReactNode;
  defaultChainId?: number;
}

function WalletProviderCore({
  children,
  defaultChainId = 44787,
}: WalletProviderProps) {
  // Core state with proper initialization
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number>(defaultChainId);
  const [walletType, setWalletType] = useState<WalletType>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [provider, setProvider] = useState<ethers.Provider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);

  // Refs for cleanup
  const cleanupRef = useRef<(() => void)[]>([]);
  const providerRef = useRef<ethers.Provider | null>(null);

  // Contexts
  const { getProvider, releaseProvider } = useProviderPool();
  const { refreshBalances } = useBalanceManager();

  // Memoized values
  const deviceInfo = useMemo(createDeviceInfo, []);
  const walletStorage = useMemo(createWalletStorage, []);

  // Memoized smart wallet with proper dependencies
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
    [deviceInfo.isMobile, walletStorage]
  );

  // Debounced error handler
  const handleError = useCallback((error: Error, context: string) => {
    console.error(`Wallet error in ${context}:`, error);

    // User-friendly error mapping
    if (error.code === 4001) {
      throw new Error("Connection cancelled by user");
    }
    if (error.code === -32002) {
      throw new Error("Connection request already pending");
    }
    if (error.message?.includes("User rejected")) {
      throw new Error("Connection rejected by user");
    }

    throw error;
  }, []);

  // Available wallets with proper memoization
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
    }

    // WalletConnect
    wallets.push({
      name: "WalletConnect",
      icon: "/icons/walletconnect.svg",
      installed: true,
      mobile: true,
      desktop: true,
    });

    return wallets;
  }, [deviceInfo]);

  // Reset function with proper cleanup
  const reset = useCallback(() => {
    // Clean up providers
    if (providerRef.current) {
      releaseProvider(providerRef.current);
      providerRef.current = null;
    }

    // Run cleanup functions
    cleanupRef.current.forEach((cleanup) => cleanup());
    cleanupRef.current = [];

    // Reset state
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setWalletType(null);
    setIsConnected(false);

    // Clear storage
    walletStorage.removeItem("walletType");
    walletStorage.removeItem("account");
    walletStorage.removeItem("chainId");
  }, [releaseProvider, walletStorage]);

  // MetaMask connection with proper error handling
  const connectMetaMask = useCallback(async (): Promise<string> => {
    if (isConnecting)
      return Promise.reject(new Error("Connection already in progress"));

    setIsConnecting(true);
    try {
      if (deviceInfo.isMobile && !deviceInfo.hasMetaMask) {
        throw new Error("MetaMask not installed on mobile device");
      }

      if (!(window as any).ethereum) {
        throw new Error("MetaMask not installed");
      }

      const ethereum = (window as any).ethereum;
      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });

      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts found");
      }

      const browserProvider = new ethers.BrowserProvider(ethereum);
      const network = await browserProvider.getNetwork();
      const signer = await browserProvider.getSigner();

      // Store provider reference for cleanup
      providerRef.current = browserProvider;

      setProvider(browserProvider);
      setSigner(signer);
      setAccount(accounts[0]);
      setChainId(Number(network.chainId));
      setWalletType("eoa");
      setIsConnected(true);

      // Storage
      await walletStorage.setItem("walletType", "eoa");
      await walletStorage.setItem("account", accounts[0]);
      await walletStorage.setItem("chainId", network.chainId.toString());

      // Refresh balances
      refreshBalances(accounts[0], browserProvider);

      return accounts[0];
    } catch (error) {
      handleError(error as Error, "MetaMask connection");
      throw error;
    } finally {
      setIsConnecting(false);
    }
  }, [isConnecting, deviceInfo, walletStorage, refreshBalances, handleError]);

  // Coinbase Wallet connection
  const connectCoinbaseWallet = useCallback(async (): Promise<string> => {
    if (isConnecting)
      return Promise.reject(new Error("Connection already in progress"));

    setIsConnecting(true);
    try {
      if (deviceInfo.isMobile && !deviceInfo.hasCoinbaseWallet) {
        throw new Error("Coinbase Wallet not installed on mobile device");
      }

      const ethereum = (window as any).ethereum;
      if (!ethereum?.isCoinbaseWallet) {
        throw new Error("Coinbase Wallet not installed");
      }

      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });
      const browserProvider = new ethers.BrowserProvider(ethereum);
      const network = await browserProvider.getNetwork();
      const signer = await browserProvider.getSigner();

      providerRef.current = browserProvider;

      setProvider(browserProvider);
      setSigner(signer);
      setAccount(accounts[0]);
      setChainId(Number(network.chainId));
      setWalletType("coinbase");
      setIsConnected(true);

      await walletStorage.setItem("walletType", "coinbase");
      await walletStorage.setItem("account", accounts[0]);
      await walletStorage.setItem("chainId", network.chainId.toString());

      refreshBalances(accounts[0], browserProvider);
      return accounts[0];
    } catch (error) {
      handleError(error as Error, "Coinbase Wallet connection");
      throw error;
    } finally {
      setIsConnecting(false);
    }
  }, [isConnecting, deviceInfo, walletStorage, refreshBalances, handleError]);

  // WalletConnect with proper cleanup
  const connectWalletConnect = useCallback(async (): Promise<string> => {
    if (isConnecting)
      return Promise.reject(new Error("Connection already in progress"));

    setIsConnecting(true);
    try {
      const wcProvider = await EthereumProvider.init({
        projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID,
        chains: [44787],
        showQrModal: true,
        methods: ["eth_sendTransaction", "personal_sign"],
        events: ["chainChanged", "accountsChanged"],
        metadata: {
          name: "Your App Name",
          description: "Your App Description",
          url: window.location.origin,
          icons: ["/favicon.png"],
        },
      });

      await wcProvider.connect();
      const accounts = await wcProvider.request({ method: "eth_accounts" });

      const ethersProvider = new ethers.BrowserProvider(wcProvider);
      const signer = await ethersProvider.getSigner();

      providerRef.current = ethersProvider;

      setProvider(ethersProvider);
      setSigner(signer);
      setAccount(accounts[0]);
      setWalletType("walletConnect");
      setIsConnected(true);

      await walletStorage.setItem("walletType", "walletConnect");
      await walletStorage.setItem("account", accounts[0]);

      // Add cleanup for WalletConnect
      cleanupRef.current.push(() => {
        wcProvider.disconnect();
      });

      refreshBalances(accounts[0], ethersProvider);
      return accounts[0];
    } catch (error) {
      handleError(error as Error, "WalletConnect connection");
      throw error;
    } finally {
      setIsConnecting(false);
    }
  }, [isConnecting, walletStorage, refreshBalances, handleError]);

  // Smart wallet connections with proper error boundaries
  const smartConnect = useCallback(
    async (
      strategy: "google" | "email" | "phone" | "passkey" | "guest",
      opts?: any
    ): Promise<{ address: string; preAuth?: boolean }> => {
      if (isConnecting)
        return Promise.reject(new Error("Connection already in progress"));

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

        const wallet = await smartWallet.connect(connOpts);
        const rpcProvider = await getProvider();

        providerRef.current = rpcProvider;

        setProvider(rpcProvider);
        setSigner(wallet);
        setAccount(wallet.address);
        setWalletType("smart");
        setIsConnected(true);

        await walletStorage.setItem("walletType", "smart");
        await walletStorage.setItem("account", wallet.address);
        await walletStorage.setItem("chainId", chainDef.id.toString());

        // Add cleanup for smart wallet
        cleanupRef.current.push(() => {
          smartWallet.disconnect();
        });

        refreshBalances(wallet.address, rpcProvider);
        return { address: wallet.address };
      } catch (error) {
        handleError(error as Error, `Smart wallet ${strategy} connection`);
        throw error;
      } finally {
        setIsConnecting(false);
      }
    },
    [
      isConnecting,
      smartWallet,
      getProvider,
      walletStorage,
      refreshBalances,
      handleError,
    ]
  );

  // Individual smart wallet methods
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

  // Open wallet app with proper error handling
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

  // Chain switching with proper error handling
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
                    rpcUrls: [chainConfig.rpc],
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
          refreshBalances(account, provider);
        }
      } catch (error) {
        handleError(error as Error, "Chain switching");
        throw error;
      }
    },
    [
      walletType,
      isConnected,
      account,
      provider,
      walletStorage,
      refreshBalances,
      handleError,
    ]
  );

  // Disconnect with proper cleanup
  const disconnect = useCallback(async () => {
    try {
      if (walletType === "smart") {
        await smartWallet.disconnect();
      }
    } catch (error) {
      console.error("Error during wallet disconnect:", error);
    } finally {
      reset();
    }
  }, [walletType, smartWallet, reset]);

  // MetaMask event listeners with proper cleanup
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

    const handleDisconnect = () => reset();

    ethereum.on("accountsChanged", handleAccountsChanged);
    ethereum.on("chainChanged", handleChainChanged);
    ethereum.on("disconnect", handleDisconnect);

    return () => {
      ethereum.removeListener("accountsChanged", handleAccountsChanged);
      ethereum.removeListener("chainChanged", handleChainChanged);
      ethereum.removeListener("disconnect", handleDisconnect);
    };
  }, [walletType, reset, walletStorage]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupRef.current.forEach((cleanup) => cleanup());
      if (providerRef.current) {
        releaseProvider(providerRef.current);
      }
    };
  }, [releaseProvider]);

  // Context value with proper memoization
  const value = useMemo(
    () => ({
      account,
      chainId,
      walletType,
      isConnected,
      isConnecting,
      provider,
      signer,
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
    }),
    [
      account,
      chainId,
      walletType,
      isConnected,
      isConnecting,
      provider,
      signer,
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
    ]
  );

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
}

// Main provider with error boundary
export function WalletProvider(props: WalletProviderProps) {
  return (
    <WalletErrorBoundary>
      <WalletProviderCore {...props} />
    </WalletErrorBoundary>
  );
}

export function useWallet(): WalletContextType {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within WalletProvider");
  }
  return context;
}
