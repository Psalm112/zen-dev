"use client";

import React, {
  createContext,
  useContext,
  useCallback,
  useRef,
  ReactNode,
  useMemo,
} from "react";
import { ethers } from "ethers";

interface ProviderPoolContextType {
  getProvider: () => Promise<ethers.Provider>;
  releaseProvider: (provider: ethers.Provider) => void;
  cleanup: () => void;
  getHealthStatus: () => ProviderHealth[];
}

interface ProviderHealth {
  url: string;
  isHealthy: boolean;
  lastCheck: number;
  responseTime?: number;
}

const ProviderPoolContext = createContext<ProviderPoolContextType | undefined>(
  undefined
);

const RPC_ENDPOINTS = [
  "https://alfajores-forno.celo-testnet.org",
  "https://celo-alfajores.infura.io/v3/" + import.meta.env.VITE_INFURA_KEY,
  "https://alfajores-forno.celo-testnet.org",
].filter(Boolean); // Remove any undefined endpoints

class ProviderPool {
  private providers: Map<string, ethers.JsonRpcProvider> = new Map();
  private activeConnections: Map<ethers.Provider, number> = new Map();
  private healthChecks: Map<
    string,
    { lastCheck: number; isHealthy: boolean; responseTime?: number }
  > = new Map();
  private readonly HEALTH_CHECK_INTERVAL = 30000; // 30 seconds
  private readonly MAX_RETRIES = 3;
  private readonly CONNECTION_TIMEOUT = 10000; // 10 seconds
  private healthCheckTimer?: NodeJS.Timeout;

  constructor() {
    this.startHealthMonitoring();
  }

  private startHealthMonitoring(): void {
    this.healthCheckTimer = setInterval(() => {
      this.performHealthChecks();
    }, this.HEALTH_CHECK_INTERVAL);
  }

  private async performHealthChecks(): Promise<void> {
    const healthPromises = Array.from(this.providers.entries()).map(
      async ([url, provider]) => {
        try {
          const startTime = Date.now();
          await Promise.race([
            provider.getBlockNumber(),
            new Promise((_, reject) =>
              setTimeout(
                () => reject(new Error("Timeout")),
                this.CONNECTION_TIMEOUT
              )
            ),
          ]);
          const responseTime = Date.now() - startTime;

          this.healthChecks.set(url, {
            lastCheck: Date.now(),
            isHealthy: true,
            responseTime,
          });
        } catch (error) {
          this.healthChecks.set(url, {
            lastCheck: Date.now(),
            isHealthy: false,
          });
          console.warn(`Health check failed for ${url}:`, error);
        }
      }
    );

    await Promise.allSettled(healthPromises);
  }

  async getProvider(): Promise<ethers.Provider> {
    // Try to reuse healthy provider with lowest connection count
    const healthyProviders = Array.from(this.providers.entries())
      .filter(([url]) => this.isProviderHealthy(url))
      .sort(([, a], [, b]) => {
        const connectionsA = this.activeConnections.get(a) || 0;
        const connectionsB = this.activeConnections.get(b) || 0;
        return connectionsA - connectionsB;
      });

    if (healthyProviders.length > 0) {
      const [, provider] = healthyProviders[0];
      const connections = this.activeConnections.get(provider) || 0;
      this.activeConnections.set(provider, connections + 1);
      return provider;
    }

    // Create new provider
    return this.createNewProvider();
  }

  private async createNewProvider(): Promise<ethers.Provider> {
    const errors: string[] = [];

    for (const rpcUrl of RPC_ENDPOINTS) {
      try {
        const provider = new ethers.JsonRpcProvider(rpcUrl, {
          name: "celo-alfajores",
          chainId: 44787,
        });

        // Test connectivity with timeout
        await Promise.race([
          provider.getBlockNumber(),
          new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error("Connection timeout")),
              this.CONNECTION_TIMEOUT
            )
          ),
        ]);

        this.providers.set(rpcUrl, provider);
        this.activeConnections.set(provider, 1);
        this.healthChecks.set(rpcUrl, {
          lastCheck: Date.now(),
          isHealthy: true,
          responseTime: Date.now() - Date.now(), // Will be updated in next health check
        });

        // Set up error handling
        provider.on("error", (error) => {
          console.error(`Provider error for ${rpcUrl}:`, error);
          this.healthChecks.set(rpcUrl, {
            lastCheck: Date.now(),
            isHealthy: false,
          });
        });

        return provider;
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : "Unknown error";
        errors.push(`${rpcUrl}: ${errorMsg}`);
        console.warn(`Failed to connect to RPC ${rpcUrl}:`, error);
        this.healthChecks.set(rpcUrl, {
          lastCheck: Date.now(),
          isHealthy: false,
        });
      }
    }

    throw new Error(`All RPC endpoints failed: ${errors.join(", ")}`);
  }

  private isProviderHealthy(url: string): boolean {
    const healthCheck = this.healthChecks.get(url);

    if (!healthCheck) return false;

    // Check if health check is recent
    if (Date.now() - healthCheck.lastCheck < this.HEALTH_CHECK_INTERVAL) {
      return healthCheck.isHealthy;
    }

    // If health check is stale, assume unhealthy until next check
    return false;
  }

  releaseProvider(provider: ethers.Provider): void {
    const connections = this.activeConnections.get(provider) || 0;
    if (connections <= 1) {
      this.activeConnections.delete(provider);
      // Don't destroy provider immediately, keep it for reuse
    } else {
      this.activeConnections.set(provider, connections - 1);
    }
  }

  getHealthStatus(): ProviderHealth[] {
    return Array.from(this.healthChecks.entries()).map(([url, health]) => ({
      url,
      isHealthy: health.isHealthy,
      lastCheck: health.lastCheck,
      responseTime: health.responseTime,
    }));
  }

  cleanup(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }

    this.providers.forEach((provider, url) => {
      try {
        provider.removeAllListeners();
        provider.destroy?.();
      } catch (error) {
        console.warn(`Error cleaning up provider ${url}:`, error);
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

  const cleanup = useCallback(() => {
    poolRef.current.cleanup();
  }, []);

  const getHealthStatus = useCallback(() => {
    return poolRef.current.getHealthStatus();
  }, []);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      poolRef.current.cleanup();
    };
  }, []);

  const value = useMemo(
    () => ({
      getProvider,
      releaseProvider,
      cleanup,
      getHealthStatus,
    }),
    [getProvider, releaseProvider, cleanup, getHealthStatus]
  );

  return (
    <ProviderPoolContext.Provider value={value}>
      {children}
    </ProviderPoolContext.Provider>
  );
}

export function useProviderPool(): ProviderPoolContextType {
  const context = useContext(ProviderPoolContext);
  if (!context) {
    throw new Error("useProviderPool must be used within ProviderPoolProvider");
  }
  return context;
}
