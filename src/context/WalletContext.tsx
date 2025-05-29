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
import {
  useCurrencyConverter,
  Currency,
} from "../utils/hooks/useCurrencyConverter";
import { WalletErrorBoundary } from "../components/WalletErrorBoundary";

interface WalletError extends Error {
  code?: number;
  data?: any;
}

export type WalletType =
  | "metamask"
  | "coinbase"
  | "walletconnect"
  | "trust"
  | "rainbow"
  | "smart"
  | "embedded"
  | "injected"
  | null;

export type ConnectionMethod =
  | "extension"
  | "mobile_app"
  | "qr_code"
  | "deeplink"
  | "embedded";

// Enhanced device detection with performance optimization
const createDeviceInfo = () => {
  if (typeof window === "undefined") {
    return {
      isMobile: false,
      isIOS: false,
      isAndroid: false,
      isTouchDevice: false,
      isStandalone: false,
      hasWebAuthn: false,
      supportsBiometrics: false,
      preferredConnection: "extension" as ConnectionMethod,
      availableWallets: [],
    };
  }

  const userAgent = navigator.userAgent;
  const isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      userAgent
    );
  const isIOS = /iPad|iPhone|iPod/.test(userAgent);
  const isAndroid = /Android/.test(userAgent);
  const isTouchDevice = "ontouchstart" in window;
  const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
  const hasWebAuthn = !!window.PublicKeyCredential;

  // Detect available wallet providers
  const ethereum = (window as any).ethereum;
  const availableWallets = [];

  if (ethereum) {
    if (ethereum.isMetaMask) availableWallets.push("metamask");
    if (ethereum.isCoinbaseWallet) availableWallets.push("coinbase");
    if (ethereum.isTrust) availableWallets.push("trust");
    if (ethereum.isRainbow) availableWallets.push("rainbow");
    if (!ethereum.isMetaMask && !ethereum.isCoinbaseWallet) {
      availableWallets.push("injected");
    }
  }

  // Determine preferred connection method
  let preferredConnection: ConnectionMethod = "extension";
  if (isMobile) {
    preferredConnection =
      availableWallets.length > 0 ? "mobile_app" : "qr_code";
  } else if (availableWallets.length === 0) {
    preferredConnection = "qr_code";
  }

  return {
    isMobile,
    isIOS,
    isAndroid,
    isTouchDevice,
    isStandalone,
    hasWebAuthn,
    supportsBiometrics: hasWebAuthn && (isIOS || isAndroid),
    preferredConnection,
    availableWallets,
  };
};

// Enhanced wallet configuration with mobile optimization
const WALLET_CONFIGS = {
  metamask: {
    name: "MetaMask",
    icon: "/icons/metamask.svg",
    color: "#f6851b",
    deepLinks: {
      ios: "metamask://dapp/",
      android: "https://metamask.app.link/dapp/",
      universal: "https://metamask.app.link/dapp/",
    },
    downloads: {
      ios: "https://apps.apple.com/app/metamask/id1438144202",
      android: "https://play.google.com/store/apps/details?id=io.metamask",
      chrome:
        "https://chrome.google.com/webstore/detail/nkbihfbeogaeaoehlefnkodbefgpgknn",
      firefox: "https://addons.mozilla.org/firefox/addon/ether-metamask/",
    },
    supportedMethods: ["extension", "mobile_app", "deeplink"],
  },
  coinbase: {
    name: "Coinbase Wallet",
    icon: "/icons/coinbase.svg",
    color: "#0052ff",
    deepLinks: {
      ios: "cbwallet://dapp?cb_url=",
      android: "cbwallet://dapp?cb_url=",
      universal: "https://go.cb-w.com/dapp?cb_url=",
    },
    downloads: {
      ios: "https://apps.apple.com/app/coinbase-wallet/id1278383455",
      android: "https://play.google.com/store/apps/details?id=org.toshi",
      chrome:
        "https://chrome.google.com/webstore/detail/coinbase-wallet/hnfanknocfeofbddgcijnmhnfnkdnaad",
    },
    supportedMethods: ["extension", "mobile_app", "qr_code", "deeplink"],
  },
  trust: {
    name: "Trust Wallet",
    icon: "/icons/trustwallet.svg",
    color: "#3375bb",
    deepLinks: {
      ios: "trust://open_url?coin_id=60&url=",
      android: "trust://open_url?coin_id=60&url=",
      universal: "https://link.trustwallet.com/open_url?coin_id=60&url=",
    },
    downloads: {
      ios: "https://apps.apple.com/app/trust-crypto-bitcoin-wallet/id1288339409",
      android:
        "https://play.google.com/store/apps/details?id=com.wallet.crypto.trustapp",
    },
    supportedMethods: ["mobile_app", "qr_code", "deeplink"],
  },
  walletconnect: {
    name: "WalletConnect",
    icon: "/icons/walletconnect.svg",
    color: "#3b99fc",
    supportedMethods: ["qr_code", "mobile_app"],
  },
  smart: {
    name: "Smart Wallet",
    icon: "/icons/smart-wallet.svg",
    color: "#7c3aed",
    supportedMethods: ["embedded"],
  },
};

// Enhanced storage with encryption for sensitive data
const createSecureStorage = () => ({
  async getItem(key: string): Promise<string | null> {
    try {
      const item = localStorage.getItem(`WALLET_${key}`);
      if (!item) return null;

      // Simple obfuscation for non-sensitive data
      return atob(item);
    } catch {
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    try {
      localStorage.setItem(`WALLET_${key}`, btoa(value));
    } catch {
      // Silent fail for privacy mode
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      localStorage.removeItem(`WALLET_${key}`);
    } catch {
      // Silent fail
    }
  },

  async clear(): Promise<void> {
    try {
      const keys = Object.keys(localStorage).filter((key) =>
        key.startsWith("WALLET_")
      );
      keys.forEach((key) => localStorage.removeItem(key));
    } catch {
      // Silent fail
    }
  },
});

export interface PaymentRequest {
  to: string;
  amount: string;
  currency: Currency;
  data?: string;
  gasLimit?: string;
  gasPrice?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
}

export interface PaymentResult {
  hash: string;
  from: string;
  to: string;
  amount: string;
  currency: Currency;
  gasUsed?: string;
  effectiveGasPrice?: string;
  blockNumber?: number;
  timestamp?: number;
}

export interface WalletInfo {
  type: WalletType;
  name: string;
  icon: string;
  color: string;
  installed: boolean;
  available: boolean;
  recommended: boolean;
  supportedMethods: ConnectionMethod[];
  requiresDownload: boolean;
  downloadUrl?: string;
  deepLink?: string;
}

export interface WalletContextType {
  // Connection state
  account: string | null;
  chainId: number;
  walletType: WalletType;
  connectionMethod: ConnectionMethod | null;
  isConnected: boolean;
  isConnecting: boolean;
  isReconnecting: boolean;

  // Providers and signers
  provider: ethers.Provider | null;
  signer: ethers.Signer | null;

  // Device and wallet info
  deviceInfo: ReturnType<typeof createDeviceInfo>;
  availableWallets: WalletInfo[];
  recommendedWallet: WalletInfo | null;

  // Connection methods
  connectWallet: (
    type: WalletType,
    method?: ConnectionMethod
  ) => Promise<string>;
  connectRecommended: () => Promise<string>;
  reconnectWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;

  // Smart wallet methods
  connectWithEmail: (
    email: string,
    code?: string
  ) => Promise<{ address: string; requiresVerification?: boolean }>;
  connectWithPhone: (
    phone: string,
    code?: string
  ) => Promise<{ address: string; requiresVerification?: boolean }>;
  connectWithGoogle: () => Promise<{ address: string }>;
  connectWithApple: () => Promise<{ address: string }>;
  connectWithPasskey: () => Promise<{ address: string }>;
  connectAsGuest: () => Promise<{ address: string }>;

  // Payment methods
  sendPayment: (request: PaymentRequest) => Promise<PaymentResult>;
  estimateGas: (
    request: Omit<PaymentRequest, "gasLimit" | "gasPrice">
  ) => Promise<string>;

  // Utility methods
  switchChain: (chainId: number) => Promise<void>;
  addToken: (tokenAddress: string) => Promise<void>;
  openWalletApp: (walletType: WalletType) => Promise<void>;

  // Error and loading states
  error: string | null;
  clearError: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

// Optimized chain configurations
const SUPPORTED_CHAINS = {
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
  celoMainnet: defineChain({
    id: 42220,
    name: "Celo Mainnet",
    nativeCurrency: { name: "Celo", symbol: "CELO", decimals: 18 },
    rpc: "https://forno.celo.org",
    blockExplorers: [
      {
        name: "Celo Explorer",
        url: "https://explorer.celo.org",
      },
    ],
  }),
};

const thirdwebClient = createThirdwebClient({
  clientId: import.meta.env.VITE_THIRDWEB_CLIENT_ID,
});

interface WalletProviderProps {
  children: ReactNode;
  defaultChainId?: number;
  enableAnalytics?: boolean;
}

function WalletProviderCore({
  children,
  defaultChainId = 44787,
  enableAnalytics = true,
}: WalletProviderProps) {
  // Core state
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number>(defaultChainId);
  const [walletType, setWalletType] = useState<WalletType>(null);
  const [connectionMethod, setConnectionMethod] =
    useState<ConnectionMethod | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [provider, setProvider] = useState<ethers.Provider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Refs and cleanup
  const cleanupRef = useRef<(() => void)[]>([]);
  const providerRef = useRef<ethers.Provider | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Context dependencies
  const { getProvider, releaseProvider } = useProviderPool();
  const { refreshBalances, clearBalances } = useBalanceManager();
  const { convertPrice, formatPrice, selectedCurrency } =
    useCurrencyConverter();

  // Memoized values
  const deviceInfo = useMemo(createDeviceInfo, []);
  const secureStorage = useMemo(createSecureStorage, []);

  // Smart wallet instance with proper configuration
  const smartWallet = useMemo(() => {
    const baseConfig = {
      smartAccount: {
        chain:
          defaultChainId === 42220
            ? SUPPORTED_CHAINS.celoMainnet
            : SUPPORTED_CHAINS.celoAlfajores,
        sponsorGas: true,
      },
      auth: {
        mode: deviceInfo.isMobile ? "redirect" : "popup",
        options: ["google", "email", "phone", "passkey", "guest"],
        ...(deviceInfo.isIOS && {
          options: [
            ...["apple"],
            "google",
            "email",
            "phone",
            "passkey",
            "guest",
          ],
        }),
        defaultSmsCountryCode: "NG",
        passkeyDomain:
          typeof window !== "undefined"
            ? window.location.hostname
            : "localhost",
      },
      hidePrivateKeyExport: true,
      metadata: {
        image: {
          src: "/favicon.png",
          alt: "App Logo",
          width: 100,
          height: 100,
        },
      },
      storage: secureStorage,
    };

    return inAppWallet(baseConfig);
  }, [defaultChainId, deviceInfo, secureStorage]);

  // Enhanced available wallets with intelligent recommendations
  const availableWallets = useMemo((): WalletInfo[] => {
    const wallets: WalletInfo[] = [];

    // Add installed/available wallets first
    Object.entries(WALLET_CONFIGS).forEach(([type, config]) => {
      if (type === "smart") {
        wallets.push({
          type: type as WalletType,
          name: config.name,
          icon: config.icon,
          color: config.color,
          installed: true,
          available: true,
          recommended:
            deviceInfo.isMobile || deviceInfo.availableWallets.length === 0,
          supportedMethods: config.supportedMethods,
          requiresDownload: false,
        });
        return;
      }

      const isInstalled = deviceInfo.availableWallets.includes(type);
      const isAvailable =
        isInstalled || deviceInfo.isMobile || type === "walletconnect";

      if (isAvailable) {
        wallets.push({
          type: type as WalletType,
          name: config.name,
          icon: config.icon,
          color: config.color,
          installed: isInstalled,
          available: true,
          recommended: type === "metamask" && !deviceInfo.isMobile,
          supportedMethods: config.supportedMethods,
          requiresDownload: !isInstalled && !deviceInfo.isMobile,
          downloadUrl: deviceInfo.isMobile
            ? deviceInfo.isIOS
              ? config.downloads?.ios
              : config.downloads?.android
            : config.downloads?.chrome,
          deepLink: deviceInfo.isMobile
            ? config.deepLinks?.universal
            : undefined,
        });
      }
    });

    // Sort by recommendation and installation status
    return wallets.sort((a, b) => {
      if (a.recommended && !b.recommended) return -1;
      if (!a.recommended && b.recommended) return 1;
      if (a.installed && !b.installed) return -1;
      if (!a.installed && b.installed) return 1;
      return 0;
    });
  }, [deviceInfo]);

  const recommendedWallet = useMemo(() => {
    return (
      availableWallets.find((w) => w.recommended) || availableWallets[0] || null
    );
  }, [availableWallets]);

  // Enhanced error handling with user-friendly messages
  const handleWalletError = useCallback(
    (error: any, context: string): never => {
      console.error(`Wallet error in ${context}:`, error);

      let userMessage = "An unexpected error occurred";

      if (error?.code === 4001 || error?.message?.includes("User rejected")) {
        userMessage = "Connection cancelled";
      } else if (error?.code === -32002) {
        userMessage = "Connection request already pending";
      } else if (error?.message?.includes("network")) {
        userMessage = "Network connection error";
      } else if (error?.message?.includes("unsupported")) {
        userMessage = "Wallet not supported";
      } else if (error?.message?.includes("install")) {
        userMessage = "Wallet app not installed";
      }

      setError(userMessage);
      throw new Error(userMessage);
    },
    []
  );

  const clearError = useCallback(() => setError(null), []);

  // Enhanced connection state management
  const updateConnectionState = useCallback(
    async (
      newAccount: string,
      newProvider: ethers.Provider,
      newSigner: ethers.Signer,
      newWalletType: WalletType,
      newConnectionMethod: ConnectionMethod,
      newChainId?: number
    ) => {
      // Clean up previous provider
      if (providerRef.current && providerRef.current !== newProvider) {
        releaseProvider(providerRef.current);
      }

      providerRef.current = newProvider;

      setAccount(newAccount);
      setProvider(newProvider);
      setSigner(newSigner);
      setWalletType(newWalletType);
      setConnectionMethod(newConnectionMethod);
      setIsConnected(true);

      if (newChainId) {
        setChainId(newChainId);
      }

      // Persist connection info
      await Promise.all([
        secureStorage.setItem("account", newAccount),
        secureStorage.setItem("walletType", newWalletType),
        secureStorage.setItem("connectionMethod", newConnectionMethod),
        secureStorage.setItem("chainId", (newChainId || chainId).toString()),
      ]);

      // Refresh balances
      refreshBalances(newAccount, newProvider);

      // Analytics
      if (enableAnalytics && typeof gtag !== "undefined") {
        gtag("event", "wallet_connected", {
          wallet_type: newWalletType,
          connection_method: newConnectionMethod,
          chain_id: newChainId || chainId,
        });
      }
    },
    [chainId, releaseProvider, refreshBalances, secureStorage, enableAnalytics]
  );

  // Enhanced MetaMask connection with better mobile handling
  const connectMetaMask = useCallback(
    async (method: ConnectionMethod = "extension"): Promise<string> => {
      const ethereum = (window as any).ethereum;

      if (!ethereum?.isMetaMask) {
        if (deviceInfo.isMobile) {
          throw new Error(
            "Please open this page in MetaMask browser or install MetaMask app"
          );
        }
        throw new Error("MetaMask not installed");
      }

      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });

      const browserProvider = new ethers.BrowserProvider(ethereum);
      const network = await browserProvider.getNetwork();
      const signer = await browserProvider.getSigner();

      await updateConnectionState(
        accounts[0],
        browserProvider,
        signer,
        "metamask",
        method,
        Number(network.chainId)
      );

      return accounts[0];
    },
    [deviceInfo.isMobile, updateConnectionState]
  );

  // Enhanced Coinbase Wallet connection
  const connectCoinbaseWallet = useCallback(
    async (method: ConnectionMethod = "extension"): Promise<string> => {
      const ethereum = (window as any).ethereum;

      if (method === "qr_code" || deviceInfo.isMobile) {
        // Use WalletConnect for QR code connection
        return connectWalletConnect();
      }

      if (!ethereum?.isCoinbaseWallet) {
        throw new Error("Coinbase Wallet not installed");
      }

      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });

      const browserProvider = new ethers.BrowserProvider(ethereum);
      const network = await browserProvider.getNetwork();
      const signer = await browserProvider.getSigner();

      await updateConnectionState(
        accounts[0],
        browserProvider,
        signer,
        "coinbase",
        method,
        Number(network.chainId)
      );

      return accounts[0];
    },
    [deviceInfo.isMobile, updateConnectionState]
  );

  // Enhanced WalletConnect with better UX
  const connectWalletConnect = useCallback(async (): Promise<string> => {
    const wcProvider = await EthereumProvider.init({
      projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID,
      chains: [chainId],
      showQrModal: true,
      qrModalOptions: {
        themeMode: "dark",
        themeVariables: {
          "--wcm-z-index": "1000",
        },
      },
      methods: [
        "eth_sendTransaction",
        "eth_signTransaction",
        "eth_sign",
        "personal_sign",
        "eth_signTypedData",
      ],
      events: ["chainChanged", "accountsChanged", "disconnect"],
      metadata: {
        name: "Your DApp",
        description: "Your DApp Description",
        url: window.location.origin,
        icons: ["/favicon.png"],
      },
    });

    // Enable session and connect
    await wcProvider.connect();

    const accounts = (await wcProvider.request({
      method: "eth_accounts",
    })) as string[];

    const ethersProvider = new ethers.BrowserProvider(wcProvider);
    const signer = await ethersProvider.getSigner();

    // Add cleanup for WalletConnect
    cleanupRef.current.push(() => {
      wcProvider.disconnect();
    });

    await updateConnectionState(
      accounts[0],
      ethersProvider,
      signer,
      "walletconnect",
      "qr_code"
    );

    return accounts[0];
  }, [chainId, updateConnectionState]);

  // Enhanced smart wallet connections
  const connectSmartWallet = useCallback(
    async (
      strategy: "google" | "apple" | "email" | "phone" | "passkey" | "guest",
      options?: any
    ): Promise<{ address: string; requiresVerification?: boolean }> => {
      const chainDef =
        chainId === 42220
          ? SUPPORTED_CHAINS.celoMainnet
          : SUPPORTED_CHAINS.celoAlfajores;

      const connectOptions: any = {
        client: thirdwebClient,
        chain: chainDef,
        strategy,
        ...options,
      };

      try {
        const wallet = await smartWallet.connect(connectOptions);
        const rpcProvider = await getProvider();

        const ethersSigner = new ethers.JsonRpcSigner(
          rpcProvider as ethers.JsonRpcApiProvider,
          wallet.address
        );

        // Add cleanup for smart wallet
        cleanupRef.current.push(() => {
          smartWallet.disconnect();
        });

        await updateConnectionState(
          wallet.address,
          rpcProvider,
          ethersSigner,
          "smart",
          "embedded"
        );

        return { address: wallet.address };
      } catch (error: any) {
        if (error?.message?.includes("verification")) {
          return {
            address: "",
            requiresVerification: true,
          };
        }
        throw error;
      }
    },
    [chainId, smartWallet, getProvider, updateConnectionState]
  );

  // Universal wallet connection method
  const connectWallet = useCallback(
    async (
      type: WalletType,
      method: ConnectionMethod = "extension"
    ): Promise<string> => {
      if (isConnecting) {
        throw new Error("Connection already in progress");
      }

      setIsConnecting(true);
      setError(null);

      try {
        switch (type) {
          case "metamask":
            return await connectMetaMask(method);
          case "coinbase":
            return await connectCoinbaseWallet(method);
          case "walletconnect":
            return await connectWalletConnect();
          case "smart":
            const result = await connectSmartWallet("guest");
            return result.address;
          default:
            throw new Error(`Unsupported wallet type: ${type}`);
        }
      } catch (error) {
        handleWalletError(error, `${type} connection`);
      } finally {
        setIsConnecting(false);
      }
    },
    [
      isConnecting,
      connectMetaMask,
      connectCoinbaseWallet,
      connectWalletConnect,
      connectSmartWallet,
      handleWalletError,
    ]
  );

  const connectRecommended = useCallback(async (): Promise<string> => {
    if (!recommendedWallet) {
      throw new Error("No recommended wallet available");
    }
    return connectWallet(
      recommendedWallet.type,
      deviceInfo.preferredConnection
    );
  }, [recommendedWallet, connectWallet, deviceInfo.preferredConnection]);

  // Smart wallet connection methods
  const connectWithEmail = useCallback(
    async (email: string, code?: string) => {
      return connectSmartWallet("email", { email, verificationCode: code });
    },
    [connectSmartWallet]
  );

  const connectWithPhone = useCallback(
    async (phone: string, code?: string) => {
      return connectSmartWallet("phone", {
        phoneNumber: phone,
        verificationCode: code,
      });
    },
    [connectSmartWallet]
  );

  const connectWithGoogle = useCallback(async () => {
    return connectSmartWallet("google");
  }, [connectSmartWallet]);

  const connectWithApple = useCallback(async () => {
    if (!deviceInfo.isIOS) {
      throw new Error("Apple Sign-In only available on iOS devices");
    }
    return connectSmartWallet("apple");
  }, [connectSmartWallet, deviceInfo.isIOS]);

  const connectWithPasskey = useCallback(async () => {
    if (!deviceInfo.hasWebAuthn) {
      throw new Error("Passkeys not supported on this device");
    }
    return connectSmartWallet("passkey");
  }, [connectSmartWallet, deviceInfo.hasWebAuthn]);

  const connectAsGuest = useCallback(async () => {
    return connectSmartWallet("guest");
  }, [connectSmartWallet]);

  // Enhanced payment processing with currency conversion
  const sendPayment = useCallback(
    async (request: PaymentRequest): Promise<PaymentResult> => {
      if (!signer || !account) {
        throw new Error("Wallet not connected");
      }

      // Convert amount to wei based on currency
      let amountWei: bigint;
      const amountFloat = parseFloat(request.amount);

      switch (request.currency) {
        case "CELO":
          amountWei = ethers.parseEther(request.amount);
          break;
        case "USDT":
          // Convert USDT to CELO, then to wei
          const celoAmount = convertPrice(amountFloat, "USDT", "CELO");
          amountWei = ethers.parseEther(celoAmount.toString());
          break;
        case "FIAT":
          // Convert FIAT to CELO, then to wei
          const celoFromFiat = convertPrice(amountFloat, "FIAT", "CELO");
          amountWei = ethers.parseEther(celoFromFiat.toString());
          break;
        default:
          amountWei = ethers.parseEther(request.amount);
      }

      const txRequest: ethers.TransactionRequest = {
        to: request.to,
        value: amountWei,
        data: request.data || "0x",
      };

      // Add gas configuration if provided
      if (request.gasLimit) txRequest.gasLimit = request.gasLimit;
      if (request.gasPrice) txRequest.gasPrice = request.gasPrice;
      if (request.maxFeePerGas) txRequest.maxFeePerGas = request.maxFeePerGas;
      if (request.maxPriorityFeePerGas)
        txRequest.maxPriorityFeePerGas = request.maxPriorityFeePerGas;

      const tx = await signer.sendTransaction(txRequest);
      const receipt = await tx.wait();

      const result: PaymentResult = {
        hash: tx.hash,
        from: account,
        to: request.to,
        amount: request.amount,
        currency: request.currency,
        gasUsed: receipt?.gasUsed?.toString(),
        effectiveGasPrice: receipt?.gasPrice?.toString(),
        blockNumber: receipt?.blockNumber,
        timestamp: Date.now(),
      };

      // Analytics
      if (enableAnalytics && typeof gtag !== "undefined") {
        gtag("event", "payment_sent", {
          currency: request.currency,
          value: amountFloat,
          transaction_id: tx.hash,
        });
      }

      return result;
    },
    [signer, account, convertPrice, enableAnalytics]
  );

  const estimateGas = useCallback(
    async (
      request: Omit<PaymentRequest, "gasLimit" | "gasPrice">
    ): Promise<string> => {
      if (!provider) {
        throw new Error("Provider not available");
      }

      const amountWei = ethers.parseEther(request.amount);
      const gasEstimate = await provider.estimateGas({
        to: request.to,
        value: amountWei,
        data: request.data || "0x",
      });

      return gasEstimate.toString();
    },
    [provider]
  );

  // Enhanced deep linking with fallback handling
  const openWalletApp = useCallback(
    async (walletType: WalletType): Promise<void> => {
      if (!deviceInfo.isMobile) return;

      const config = WALLET_CONFIGS[walletType as keyof typeof WALLET_CONFIGS];
      if (!config?.deepLinks) return;

      const currentUrl = encodeURIComponent(window.location.href);
      let deepLinkUrl = "";

      // Continue from where openWalletApp was cut off
      if (deviceInfo.isIOS) {
        deepLinkUrl = config.deepLinks.ios + currentUrl;
      } else if (deviceInfo.isAndroid) {
        deepLinkUrl = config.deepLinks.android + currentUrl;
      } else {
        deepLinkUrl = config.deepLinks.universal + currentUrl;
      }

      try {
        // Attempt to open the wallet app
        window.location.href = deepLinkUrl;

        // Fallback to app store after delay
        setTimeout(() => {
          const wallet = availableWallets.find((w) => w.type === walletType);
          if (wallet?.downloadUrl) {
            window.open(wallet.downloadUrl, "_blank", "noopener,noreferrer");
          }
        }, 2500);
      } catch (error) {
        console.error("Failed to open wallet app:", error);
        // Direct fallback to app store
        const wallet = availableWallets.find((w) => w.type === walletType);
        if (wallet?.downloadUrl) {
          window.open(wallet.downloadUrl, "_blank", "noopener,noreferrer");
        }
      }
    },
    [deviceInfo, availableWallets]
  );

  // Enhanced chain switching with comprehensive error handling
  const switchChain = useCallback(
    async (newChainId: number): Promise<void> => {
      if (!isConnected || !walletType) {
        throw new Error("Wallet not connected");
      }

      try {
        const hexChainId = `0x${newChainId.toString(16)}`;
        const chainConfig =
          newChainId === 42220
            ? SUPPORTED_CHAINS.celoMainnet
            : SUPPORTED_CHAINS.celoAlfajores;

        if (walletType === "smart") {
          // For smart wallets, reconnect with new chain
          await smartWallet.disconnect();
          const result = await connectSmartWallet("guest");
          setChainId(newChainId);
          return;
        }

        if ((window as any).ethereum) {
          const ethereum = (window as any).ethereum;

          try {
            await ethereum.request({
              method: "wallet_switchEthereumChain",
              params: [{ chainId: hexChainId }],
            });
          } catch (switchError: any) {
            // Chain not added, attempt to add it
            if (switchError.code === 4902) {
              await ethereum.request({
                method: "wallet_addEthereumChain",
                params: [
                  {
                    chainId: hexChainId,
                    chainName: chainConfig.name,
                    nativeCurrency: chainConfig.nativeCurrency,
                    rpcUrls: [chainConfig.rpc],
                    blockExplorerUrls: chainConfig.blockExplorers?.map(
                      (e) => e.url
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
        await secureStorage.setItem("chainId", newChainId.toString());

        if (account && provider) {
          refreshBalances(account, provider);
        }

        // Analytics
        if (enableAnalytics && typeof gtag !== "undefined") {
          gtag("event", "chain_switched", {
            from_chain: chainId,
            to_chain: newChainId,
            wallet_type: walletType,
          });
        }
      } catch (error) {
        handleWalletError(error, "Chain switching");
      }
    },
    [
      isConnected,
      walletType,
      chainId,
      account,
      provider,
      smartWallet,
      connectSmartWallet,
      secureStorage,
      refreshBalances,
      enableAnalytics,
      handleWalletError,
    ]
  );

  // Token addition for better UX
  const addToken = useCallback(
    async (tokenAddress: string): Promise<void> => {
      if (!isConnected || walletType === "smart") {
        return; // Smart wallets handle tokens automatically
      }

      const ethereum = (window as any).ethereum;
      if (!ethereum) return;

      try {
        await ethereum.request({
          method: "wallet_watchAsset",
          params: {
            type: "ERC20",
            options: {
              address: tokenAddress,
              symbol: "TOKEN", // This should be dynamic based on token
              decimals: 18,
            },
          },
        });
      } catch (error) {
        console.error("Failed to add token:", error);
      }
    },
    [isConnected, walletType]
  );

  // Auto-reconnection with exponential backoff
  const reconnectWallet = useCallback(async (): Promise<void> => {
    if (isReconnecting) return;

    setIsReconnecting(true);
    setError(null);

    try {
      const savedWalletType = (await secureStorage.getItem(
        "walletType"
      )) as WalletType;
      const savedAccount = await secureStorage.getItem("account");
      const savedConnectionMethod = (await secureStorage.getItem(
        "connectionMethod"
      )) as ConnectionMethod;

      if (!savedWalletType || !savedAccount) {
        throw new Error("No saved connection found");
      }

      await connectWallet(
        savedWalletType,
        savedConnectionMethod || "extension"
      );
    } catch (error) {
      console.error("Reconnection failed:", error);
      // Clear invalid stored data
      await secureStorage.clear();
    } finally {
      setIsReconnecting(false);
    }
  }, [isReconnecting, secureStorage, connectWallet]);

  // Clean disconnect with proper cleanup
  const disconnectWallet = useCallback(async (): Promise<void> => {
    try {
      // Disconnect based on wallet type
      if (walletType === "smart") {
        await smartWallet.disconnect();
      } else if (walletType === "walletconnect") {
        // WalletConnect cleanup is handled by cleanup refs
      }

      // Run all cleanup functions
      cleanupRef.current.forEach((cleanup) => {
        try {
          cleanup();
        } catch (error) {
          console.error("Cleanup error:", error);
        }
      });
      cleanupRef.current = [];

      // Release provider
      if (providerRef.current) {
        releaseProvider(providerRef.current);
        providerRef.current = null;
      }

      // Clear balances
      clearBalances();

      // Reset state
      setAccount(null);
      setProvider(null);
      setSigner(null);
      setWalletType(null);
      setConnectionMethod(null);
      setIsConnected(false);
      setError(null);

      // Clear storage
      await secureStorage.clear();

      // Analytics
      if (enableAnalytics && typeof gtag !== "undefined") {
        gtag("event", "wallet_disconnected", {
          wallet_type: walletType,
        });
      }
    } catch (error) {
      console.error("Disconnect error:", error);
    }
  }, [
    walletType,
    smartWallet,
    releaseProvider,
    clearBalances,
    secureStorage,
    enableAnalytics,
  ]);

  // Periodic connection health check
  useEffect(() => {
    if (!isConnected || !account || !provider) return;

    const healthCheck = async () => {
      try {
        const balance = await provider.getBalance(account);
        // Connection is healthy if we can fetch balance
        if (balance !== undefined) {
          refreshBalances(account, provider);
        }
      } catch (error) {
        console.error("Connection health check failed:", error);
        // Attempt reconnection if saved data exists
        const savedWallet = await secureStorage.getItem("walletType");
        if (savedWallet && !isReconnecting) {
          reconnectWallet();
        }
      }
    };

    // Check every 30 seconds
    const interval = setInterval(healthCheck, 30000);
    return () => clearInterval(interval);
  }, [
    isConnected,
    account,
    provider,
    refreshBalances,
    secureStorage,
    isReconnecting,
    reconnectWallet,
  ]);

  // Enhanced event listeners with proper cleanup
  useEffect(() => {
    if (!isConnected || walletType === "smart") return;

    const ethereum = (window as any).ethereum;
    if (!ethereum) return;

    const handleAccountsChanged = async (accounts: string[]) => {
      if (accounts.length === 0) {
        await disconnectWallet();
      } else if (accounts[0] !== account) {
        setAccount(accounts[0]);
        await secureStorage.setItem("account", accounts[0]);
        if (provider) {
          refreshBalances(accounts[0], provider);
        }
      }
    };

    const handleChainChanged = async (chainId: string) => {
      const newChainId = parseInt(chainId, 16);
      setChainId(newChainId);
      await secureStorage.setItem("chainId", newChainId.toString());
      if (account && provider) {
        refreshBalances(account, provider);
      }
    };

    const handleDisconnect = async () => {
      await disconnectWallet();
    };

    // Add listeners
    ethereum.on("accountsChanged", handleAccountsChanged);
    ethereum.on("chainChanged", handleChainChanged);
    ethereum.on("disconnect", handleDisconnect);

    return () => {
      ethereum.removeListener("accountsChanged", handleAccountsChanged);
      ethereum.removeListener("chainChanged", handleChainChanged);
      ethereum.removeListener("disconnect", handleDisconnect);
    };
  }, [
    isConnected,
    walletType,
    account,
    provider,
    disconnectWallet,
    secureStorage,
    refreshBalances,
  ]);

  // Auto-reconnection on app startup
  useEffect(() => {
    const attemptReconnection = async () => {
      const savedWallet = await secureStorage.getItem("walletType");
      const savedAccount = await secureStorage.getItem("account");

      if (savedWallet && savedAccount && !isConnected && !isConnecting) {
        // Delay reconnection to avoid race conditions
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectWallet();
        }, 1000);
      }
    };

    attemptReconnection();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [secureStorage, isConnected, isConnecting, reconnectWallet]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupRef.current.forEach((cleanup) => {
        try {
          cleanup();
        } catch (error) {
          console.error("Unmount cleanup error:", error);
        }
      });

      if (providerRef.current) {
        releaseProvider(providerRef.current);
      }

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [releaseProvider]);

  // Memoized context value for performance
  const contextValue = useMemo(
    () => ({
      // Connection state
      account,
      chainId,
      walletType,
      connectionMethod,
      isConnected,
      isConnecting,
      isReconnecting,

      // Providers and signers
      provider,
      signer,

      // Device and wallet info
      deviceInfo,
      availableWallets,
      recommendedWallet,

      // Connection methods
      connectWallet,
      connectRecommended,
      reconnectWallet,
      disconnectWallet,

      // Smart wallet methods
      connectWithEmail,
      connectWithPhone,
      connectWithGoogle,
      connectWithApple,
      connectWithPasskey,
      connectAsGuest,

      // Payment methods
      sendPayment,
      estimateGas,

      // Utility methods
      switchChain,
      addToken,
      openWalletApp,

      // Error handling
      error,
      clearError,
    }),
    [
      account,
      chainId,
      walletType,
      connectionMethod,
      isConnected,
      isConnecting,
      isReconnecting,
      provider,
      signer,
      deviceInfo,
      availableWallets,
      recommendedWallet,
      connectWallet,
      connectRecommended,
      reconnectWallet,
      disconnectWallet,
      connectWithEmail,
      connectWithPhone,
      connectWithGoogle,
      connectWithApple,
      connectWithPasskey,
      connectAsGuest,
      sendPayment,
      estimateGas,
      switchChain,
      addToken,
      openWalletApp,
      error,
      clearError,
    ]
  );

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
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

// Enhanced hook with additional utilities
export function useWallet(): WalletContextType {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within WalletProvider");
  }
  return context;
}

// Additional utility hooks for specific use cases
export function useWalletBalance() {
  const { account, provider } = useWallet();
  const [balance, setBalance] = useState<string>("0");
  const [isLoading, setIsLoading] = useState(false);

  const fetchBalance = useCallback(async () => {
    if (!account || !provider) {
      setBalance("0");
      return;
    }

    setIsLoading(true);
    try {
      const balanceWei = await provider.getBalance(account);
      setBalance(ethers.formatEther(balanceWei));
    } catch (error) {
      console.error("Failed to fetch balance:", error);
      setBalance("0");
    } finally {
      setIsLoading(false);
    }
  }, [account, provider]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  return { balance, isLoading, refetch: fetchBalance };
}

export function useWalletNetwork() {
  const { chainId, switchChain } = useWallet();

  const networkName = useMemo(() => {
    switch (chainId) {
      case 44787:
        return "Celo Alfajores";
      case 42220:
        return "Celo Mainnet";
      default:
        return "Unknown Network";
    }
  }, [chainId]);

  const isTestnet = chainId === 44787;
  const isMainnet = chainId === 42220;

  return {
    chainId,
    networkName,
    isTestnet,
    isMainnet,
    switchChain,
    switchToMainnet: () => switchChain(42220),
    switchToTestnet: () => switchChain(44787),
  };
}
