
"use client";

import React, { createContext, useContext, useCallback, useRef, ReactNode } from "react";
import { ethers } from "ethers";

interface ProviderPoolContextType {
  getProvider: () => Promise<ethers.Provider>;
  releaseProvider: (provider: ethers.Provider) => void;
  cleanup: () => void;
}

const ProviderPoolContext = createContext<ProviderPoolContextType | undefined>(undefined);

const RPC_ENDPOINTS = [
  "https://alfajores-forno.celo-testnet.org",
  "https://celo-alfajores.infura.io/v3/" + import.meta.env.VITE_INFURA_KEY,
  "https://alfajores-forno.celo-testnet.org",
];

class ProviderPool {
  private providers: Map<string, ethers.JsonRpcProvider> = new Map();
  private activeConnections: Map<ethers.Provider, number> = new Map();
  private healthChecks: Map<string, { lastCheck: number; isHealthy: boolean }> = new Map();
  private readonly HEALTH_CHECK_INTERVAL = 30000; // 30 seconds
  private readonly MAX_RETRIES = 3;

  async getProvider(): Promise<ethers.Provider> {
    // Try to reuse healthy provider
    for (const [url, provider] of this.providers) {
      if (await this.isProviderHealthy(url)) {
        const connections = this.activeConnections.get(provider) || 0;
        this.activeConnections.set(provider, connections + 1);
        return provider;
      }
    }

    // Create new provider
    return this.createNewProvider();
  }

  private async createNewProvider(): Promise<ethers.Provider> {
    for (const rpcUrl of RPC_ENDPOINTS) {
      try {
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        
        // Test connectivity
        await provider.getBlockNumber();
        
        this.providers.set(rpcUrl, provider);
        this.activeConnections.set(provider, 1);
        this.healthChecks.set(rpcUrl, { lastCheck: Date.now(), isHealthy: true });
        
        return provider;
      } catch (error) {
        console.warn(`Failed to connect to RPC ${rpcUrl}:`, error);
        this.healthChecks.set(rpcUrl, { lastCheck: Date.now(), isHealthy: false });
      }
    }

    throw new Error("All RPC endpoints failed");
  }

  private async isProviderHealthy(url: string): Promise<boolean> {
    const healthCheck = this.healthChecks.get(url);
    
    if (!healthCheck) return false;
    
    // Check if health check is recent
    if (Date.now() - healthCheck.lastCheck < this.HEALTH_CHECK_INTERVAL) {
      return healthCheck.isHealthy;
    }

    // Perform new health check
    try {
      const provider = this.providers.get(url);
      if (!provider) return false;

      await provider.getBlockNumber();
      this.healthChecks.set(url, { lastCheck: Date.now(), isHealthy: true });
      return true;
    } catch {
      this.healthChecks.set(url, { lastCheck: Date.now(), isHealthy: false });
      return false;
    }
  }

  releaseProvider(provider: ethers.Provider): void {
    const connections = this.activeConnections.get(provider) || 0;
    if (connections <= 1) {
      this.activeConnections.delete(provider);
    } else {
      this.activeConnections.set(provider, connections - 1);
    }
  }

  cleanup(): void {
    this.providers.forEach((provider) => {
      try {
        provider.destroy?.();
      } catch (error) {
        console.warn("Error cleaning up provider:", error);
      }
    });
    
    this.providers.clear();
    this.activeConnections.clear();
    this.healthChecks.clear();
  }
}

interface ProviderPoolProviderProps {
  children: ReactNode;
}

export function ProviderPoolProvider({ children }: ProviderPoolProviderProps) {
  const poolRef = useRef<ProviderPool>(new ProviderPool());

  const getProvider = useCallback(async () => {
    return poolRef.current.getProvider();
  }, []);

  const releaseProvider = useCallback((provider: ethers.Provider) => {
    poolRef.current.releaseProvider(provider);
  }, []);