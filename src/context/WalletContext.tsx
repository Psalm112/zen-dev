import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { ethers } from "ethers";
import { inAppWallet, authenticate, preAuthenticate } from "thirdweb/wallets";
import { createThirdwebClient, defineChain } from "thirdweb";

// Chain definitions
const liskSepolia = defineChain({
  id: 4202,
  name: "Lisk Sepolia Testnet",
  nativeCurrency: { name: "Lisk Sepolia ETH", symbol: "ETH", decimals: 18 },
  rpc: "https://rpc.sepolia-api.lisk.com",
  blockExplorers: [
    { name: "Lisk Explorer", url: "https://sepolia-blockscout.lisk.com" },
  ],
});

const celoAlfajores = defineChain({
  id: 44787,
  name: "Celo Alfajores Testnet",
  nativeCurrency: { name: "Celo", symbol: "CELO", decimals: 18 },
  rpc: ["https://alfajores-forno.celo-testnet.org"],
  blockExplorers: [
    {
      name: "Celo Explorer",
      url: "https://alfajores-blockscout.celo-testnet.org",
    },
  ],
});

// Custom storage for thirdweb
const customStorage = {
  getItem: async (key: string) => localStorage.getItem(`WALLET_STORAGE_${key}`),
  setItem: async (key: string, value: string) =>
    localStorage.setItem(`WALLET_STORAGE_${key}`, value),
  removeItem: async (key: string) =>
    localStorage.removeItem(`WALLET_STORAGE_${key}`),
};

// Thirdweb client initialization
const thirdwebClient = createThirdwebClient({
  clientId: "b81c12c8d9ae57479a26c52be1d198eb",
});

export type WalletType = "eoa" | "smart" | null;

interface WalletContextType {
  account: string | null;
  chainId: number | null;
  balance: string | null;
  walletType: WalletType;
  isConnected: boolean;
  isConnecting: boolean;
  isInitialized: boolean;
  provider: ethers.Provider | null;
  signer: any | null;
  connectMetaMask: () => Promise<void>;
  connectEmail: (
    email: string,
    verificationCode?: string
  ) => Promise<{ preAuth?: boolean; type?: string } | void>;
  connectPhone: (
    phone: string,
    verificationCode?: string
  ) => Promise<{ preAuth?: boolean; type?: string } | void>;
  connectGoogle: () => Promise<void>;
  connectGuest: () => Promise<void>;
  connectPasskey: () => Promise<void>;
  disconnect: () => void;
  switchChain: (chainId: number) => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

interface WalletProviderProps {
  children: ReactNode;
  defaultChainId?: number;
}

export function WalletProvider({
  children,
  defaultChainId = 4202,
}: WalletProviderProps) {
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(defaultChainId);
  const [balance, setBalance] = useState<string | null>(null);
  const [walletType, setWalletType] = useState<WalletType>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [provider, setProvider] = useState<ethers.Provider | null>(null);
  const [signer, setSigner] = useState<any | null>(null);

  // Create wallet instance
  const wallet = inAppWallet({
    smartAccount: {
      chain: chainId === 44787 ? celoAlfajores : liskSepolia,
      sponsorGas: true,
    },
    auth: {
      mode: "popup",
      options: ["google", "email", "phone", "passkey", "guest", "wallet"],
      defaultSmsCountryCode: "NG",
      passkeyDomain:
        typeof window !== "undefined" ? window.location.hostname : "localhost",
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
    storage: customStorage,
  });

  // Retry logic for API calls
  async function withRetry<T>(
    fn: () => Promise<T>,
    maxRetries = 3,
    delay = 1000
  ): Promise<T> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error: any) {
        if (
          attempt === maxRetries ||
          !error.message?.includes("Failed to fetch")
        ) {
          throw error;
        }
        console.warn(`Retry ${attempt}/${maxRetries} failed: ${error.message}`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
    throw new Error("Retry failed"); // TypeScript needs this
  }

  // Initialize wallet from local storage
  useEffect(() => {
    const initWallet = async () => {
      try {
        const savedWalletType = localStorage.getItem("walletType");
        const savedAccount = localStorage.getItem("walletAddress");
        const savedChainId = localStorage.getItem("walletChainId");

        if (savedWalletType && savedAccount) {
          setWalletType(savedWalletType as WalletType);
          setAccount(savedAccount);
          setChainId(savedChainId ? parseInt(savedChainId) : defaultChainId);
          setIsConnected(true);

          // Reconnect with the correct provider based on wallet type
          if (savedWalletType === "eoa" && window.ethereum) {
            const browserProvider = new ethers.BrowserProvider(window.ethereum);
            const userSigner = await browserProvider.getSigner();
            setProvider(browserProvider);
            setSigner(userSigner);
            await fetchBalance(savedAccount, browserProvider);
          } else if (savedWalletType === "smart") {
            // For smart wallets, we need to reconnect on page load
            // This is just a placeholder - in a real app, you'd have reconnection logic
            const currentChain =
              savedChainId === "44787" ? celoAlfajores : liskSepolia;
            const rpcUrl = currentChain.rpc[0];
            const jsonRpcProvider = new ethers.JsonRpcProvider(rpcUrl);
            setProvider(jsonRpcProvider);
            // We can't restore the signer without authentication
            await fetchBalance(savedAccount, jsonRpcProvider);
          }
        }
      } catch (error) {
        console.error("Failed to initialize wallet:", error);
        resetWalletState();
      } finally {
        setIsInitialized(true);
      }
    };

    initWallet();
  }, [defaultChainId]);

  // Handle MetaMask events
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !window.ethereum ||
      walletType !== "eoa"
    )
      return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect();
      } else if (account !== accounts[0]) {
        setAccount(accounts[0]);
        localStorage.setItem("walletAddress", accounts[0]);
        if (provider) fetchBalance(accounts[0], provider);
      }
    };

    const handleChainChanged = (chainIdHex: string) => {
      const newChainId = parseInt(chainIdHex, 16);
      setChainId(newChainId);
      localStorage.setItem("walletChainId", newChainId.toString());
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      if (window.ethereum?.removeListener) {
        window.ethereum.removeListener(
          "accountsChanged",
          handleAccountsChanged
        );
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      }
    };
  }, [account, provider, walletType]);

  // Fetch wallet balance
  async function fetchBalance(
    walletAddress: string,
    providerInstance: ethers.Provider
  ) {
    if (!walletAddress || !providerInstance) {
      setBalance(null);
      return;
    }

    try {
      const balanceWei = await providerInstance.getBalance(walletAddress);
      const balanceEther = ethers.formatEther(balanceWei);
      const symbol = chainId === 44787 ? "CELO" : "ETH";
      setBalance(`${parseFloat(balanceEther).toFixed(4)} ${symbol}`);
    } catch (error) {
      console.error("Error fetching balance:", error);
      setBalance("Error fetching balance");
    }
  }

  // Reset wallet state
  function resetWalletState() {
    setAccount(null);
    setBalance(null);
    setProvider(null);
    setSigner(null);
    setWalletType(null);
    setIsConnected(false);
    localStorage.removeItem("walletType");
    localStorage.removeItem("walletAddress");
    localStorage.removeItem("walletChainId");
  }

  // Connect to MetaMask
  async function connectMetaMask() {
    if (typeof window === "undefined" || !window.ethereum) {
      throw new Error("Please install MetaMask to use this app");
    }

    setIsConnecting(true);
    try {
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      const network = await browserProvider.getNetwork();
      const currentChainId = Number(network.chainId);
      const userSigner = await browserProvider.getSigner();

      setProvider(browserProvider);
      setSigner(userSigner);
      setAccount(accounts[0]);
      setChainId(currentChainId);
      setWalletType("eoa");
      setIsConnected(true);

      localStorage.setItem("walletType", "eoa");
      localStorage.setItem("walletAddress", accounts[0]);
      localStorage.setItem("walletChainId", currentChainId.toString());

      await fetchBalance(accounts[0], browserProvider);
    } catch (error) {
      console.error("Failed to connect MetaMask:", error);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  }

  // Connect with Google
  async function connectGoogle() {
    setIsConnecting(true);
    try {
      const currentChain = chainId === 44787 ? celoAlfajores : liskSepolia;
      const walletAccount = await withRetry(() =>
        wallet.connect({
          client: thirdwebClient,
          chain: currentChain,
          strategy: "google",
        })
      );

      const rpcUrl = currentChain.rpc[0];
      const jsonRpcProvider = new ethers.JsonRpcProvider(rpcUrl);

      setProvider(jsonRpcProvider);
      setSigner(walletAccount);
      setAccount(walletAccount.address);
      setWalletType("smart");
      setIsConnected(true);

      localStorage.setItem("walletType", "smart");
      localStorage.setItem("walletAddress", walletAccount.address);
      localStorage.setItem("walletChainId", currentChain.id.toString());

      await fetchBalance(walletAccount.address, jsonRpcProvider);
    } catch (error) {
      console.error("Failed to connect with Google:", error);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  }

  // Connect with Email
  async function connectEmail(email: string, verificationCode?: string) {
    setIsConnecting(true);
    try {
      const currentChain = chainId === 44787 ? celoAlfajores : liskSepolia;

      if (!verificationCode) {
        await withRetry(() =>
          preAuthenticate({
            client: thirdwebClient,
            strategy: "email",
            email,
          })
        );
        return { preAuth: true, type: "email" };
      }

      const walletAccount = await withRetry(() =>
        wallet.connect({
          client: thirdwebClient,
          chain: currentChain,
          strategy: "email",
          email,
          verificationCode,
        })
      );

      const rpcUrl = currentChain.rpc[0];
      const jsonRpcProvider = new ethers.JsonRpcProvider(rpcUrl);

      setProvider(jsonRpcProvider);
      setSigner(walletAccount);
      setAccount(walletAccount.address);
      setWalletType("smart");
      setIsConnected(true);

      localStorage.setItem("walletType", "smart");
      localStorage.setItem("walletAddress", walletAccount.address);
      localStorage.setItem("walletChainId", currentChain.id.toString());

      await fetchBalance(walletAccount.address, jsonRpcProvider);
    } catch (error) {
      console.error("Failed to connect with Email:", error);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  }

  // Connect with Phone
  async function connectPhone(phoneNumber: string, verificationCode?: string) {
    setIsConnecting(true);
    try {
      const currentChain = chainId === 44787 ? celoAlfajores : liskSepolia;

      if (!verificationCode) {
        await withRetry(() =>
          preAuthenticate({
            client: thirdwebClient,
            strategy: "phone",
            phoneNumber,
          })
        );
        return { preAuth: true, type: "phone" };
      }

      const walletAccount = await withRetry(() =>
        wallet.connect({
          client: thirdwebClient,
          chain: currentChain,
          strategy: "phone",
          phoneNumber,
          verificationCode,
        })
      );

      const rpcUrl = currentChain.rpc[0];
      const jsonRpcProvider = new ethers.JsonRpcProvider(rpcUrl);

      setProvider(jsonRpcProvider);
      setSigner(walletAccount);
      setAccount(walletAccount.address);
      setWalletType("smart");
      setIsConnected(true);

      localStorage.setItem("walletType", "smart");
      localStorage.setItem("walletAddress", walletAccount.address);
      localStorage.setItem("walletChainId", currentChain.id.toString());

      await fetchBalance(walletAccount.address, jsonRpcProvider);
    } catch (error) {
      console.error("Failed to connect with Phone:", error);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  }

  // Connect with Passkey
  async function connectPasskey() {
    setIsConnecting(true);
    try {
      const currentChain = chainId === 44787 ? celoAlfajores : liskSepolia;
      let walletAccount;

      try {
        walletAccount = await withRetry(() =>
          authenticate({
            client: thirdwebClient,
            strategy: "passkey",
            type: "sign-up",
          })
        );
      } catch (error) {
        console.log("Passkey sign-up failed, trying sign-in:", error);
        walletAccount = await authenticate({
          client: thirdwebClient,
          strategy: "passkey",
          type: "sign-in",
        });
      }

      const rpcUrl = currentChain.rpc[0];
      const jsonRpcProvider = new ethers.JsonRpcProvider(rpcUrl);

      setProvider(jsonRpcProvider);
      setSigner(walletAccount);
      setAccount(walletAccount.address);
      setWalletType("smart");
      setIsConnected(true);

      localStorage.setItem("walletType", "smart");
      localStorage.setItem("walletAddress", walletAccount.address);
      localStorage.setItem("walletChainId", currentChain.id.toString());

      await fetchBalance(walletAccount.address, jsonRpcProvider);
    } catch (error) {
      console.error("Failed to connect with Passkey:", error);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  }

  // Connect as Guest
  async function connectGuest() {
    setIsConnecting(true);
    try {
      const currentChain = chainId === 44787 ? celoAlfajores : liskSepolia;

      const walletAccount = await withRetry(() =>
        wallet.connect({
          client: thirdwebClient,
          chain: currentChain,
          strategy: "guest",
        })
      );

      const rpcUrl = currentChain.rpc[0];
      const jsonRpcProvider = new ethers.JsonRpcProvider(rpcUrl);

      setProvider(jsonRpcProvider);
      setSigner(walletAccount);
      setAccount(walletAccount.address);
      setWalletType("smart");
      setIsConnected(true);

      localStorage.setItem("walletType", "smart");
      localStorage.setItem("walletAddress", walletAccount.address);
      localStorage.setItem("walletChainId", currentChain.id.toString());

      await fetchBalance(walletAccount.address, jsonRpcProvider);
    } catch (error) {
      console.error("Failed to connect as Guest:", error);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  }

  // Switch blockchain network
  async function switchChain(newChainId: number) {
    if (!isConnected) {
      setChainId(newChainId);
      return;
    }

    if (walletType === "eoa" && window.ethereum) {
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: `0x${newChainId.toString(16)}` }],
        });
        // The chainChanged event will handle the state update
      } catch (switchError: any) {
        // Chain doesn't exist in wallet
        if (switchError.code === 4902) {
          const chainData = newChainId === 44787 ? celoAlfajores : liskSepolia;
          try {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: `0x${newChainId.toString(16)}`,
                  chainName: chainData.name,
                  nativeCurrency: chainData.nativeCurrency,
                  rpcUrls: chainData.rpc,
                  blockExplorerUrls: chainData.blockExplorers.map(
                    (explorer) => explorer.url
                  ),
                },
              ],
            });
            // The chainChanged event will handle the state update
          } catch (error) {
            console.error("Failed to add chain to wallet:", error);
            throw error;
          }
        } else {
          console.error("Failed to switch chain:", switchError);
          throw switchError;
        }
      }
    } else if (walletType === "smart") {
      // For smart wallets, we need to re-authenticate with new chain
      try {
        setChainId(newChainId);
        localStorage.setItem("walletChainId", newChainId.toString());

        // Re-initialize provider with new chain
        const newChain = newChainId === 44787 ? celoAlfajores : liskSepolia;
        const rpcUrl = newChain.rpc[0];
        const jsonRpcProvider = new ethers.JsonRpcProvider(rpcUrl);
        setProvider(jsonRpcProvider);

        // Update balance with new chain
        if (account) {
          await fetchBalance(account, jsonRpcProvider);
        }
      } catch (error) {
        console.error("Failed to switch chain for smart wallet:", error);
        throw error;
      }
    }
  }

  // Disconnect wallet
  function disconnect() {
    resetWalletState();
    if (wallet) {
      wallet.disconnect();
    }
  }

  // Fallback UI if not initialized
  if (!isInitialized) {
    return <div>Loading Wallet Provider...</div>;
  }

  return (
    <WalletContext.Provider
      value={{
        account,
        chainId,
        balance,
        walletType,
        isConnected,
        isConnecting,
        isInitialized,
        provider,
        signer,
        connectMetaMask,
        connectEmail,
        connectPhone,
        connectGoogle,
        connectGuest,
        connectPasskey,
        disconnect,
        switchChain,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}
