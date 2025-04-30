import { useState, useEffect } from "react";

export function useWallet() {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);

  // Check if wallet was previously connected
  useEffect(() => {
    const savedWalletState = localStorage.getItem("walletConnected");
    const savedAddress = localStorage.getItem("walletAddress");

    if (savedWalletState === "true" && savedAddress) {
      setIsConnected(true);
      setWalletAddress(savedAddress);
      // fetch the current balance
    }
  }, []);

  const connect = async () => {
    setIsConnecting(true);

    try {
      // Simulate connection delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // wallet connection logic

      // Example mock wallet address
      const mockAddress = "0x" + Math.random().toString(16).slice(2, 42);

      setWalletAddress(mockAddress);
      setBalance("100 cUSD");
      setIsConnected(true);

      // Save connection state
      localStorage.setItem("walletConnected", "true");
      localStorage.setItem("walletAddress", mockAddress);
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    setIsConnected(false);
    setWalletAddress(null);
    setBalance(null);
    localStorage.removeItem("walletConnected");
    localStorage.removeItem("walletAddress");
  };

  return {
    isConnected,
    isConnecting,
    walletAddress,
    balance,
    connect,
    disconnect,
  };
}
