"use client";

import React, {
  createContext,
  useContext,
  useMemo,
  useCallback,
  useRef,
  useEffect,
  useState,
} from "react";
import { ethers } from "ethers";

interface ProviderEndpoint {
  url: string;
  priority: number;
  weight: number;
  isHealthy: boolean;
  lastChecked: number;
  responseTime: number;
  errorCount: number;
  successCount: number;
}

interface ProviderHealth {
  endpoint: string;
  isHealthy: boolean;
  responseTime: number;
  blockNumber?: number;
  lastChecked: number;
}

interface ProviderPoolState {
  primaryProvider: ethers.JsonRpcProvider | null;
  activeEndpoint: string | null;
  isHealthy: boolean;
  lastHealthCheck: number;
  failoverCount: number;
  totalRequests: number;
  avgResponseTime: number;
}

interface ProviderPoolContextType {
  getProvider: () => Promise<ethers.JsonRpcProvider>;
  getReadOnlyProvider: () => ethers.JsonRpcProvider;
  healthCheck: () => Promise<ProviderHealth[]>;
  switchToEndpoint: (url: string) => Promise<void>;
  getProviderStats: () => ProviderPoolState;
  refreshEndpoints: () => Promise<void>;
}

const ProviderPoolContext = createContext<ProviderPoolContextType | null>(null);

// RPC endpoint configurations with fallbacks
const RPC_ENDPOINTS: Record<number, ProviderEndpoint[]> = {
  // Celo Alfajores Testnet
  44787: [
    {
      url: "https://alfajores-forno.celo-testnet.org",
      priority: 1,
      weight: 100,
      isHealthy: true,
      lastChecked: 0,
      responseTime: 0,
      errorCount: 0,
      successCount: 0,
    },
    {
      url: `https://celo-alfajores.infura.io/v3/${
        import.meta.env.VITE_INFURA_KEY
      }`,
      priority: 2,
      weight: 80,
      isHealthy: true,
      lastChecked: 0,
      responseTime: 0,
      errorCount: 0,
      successCount: 0,
    },
    {
      url: "https://alfajores-forno.celo-testnet.org",
      priority: 3,
      weight: 60,
      isHealthy: true,
      lastChecked: 0,
      responseTime: 0,
      errorCount: 0,
      successCount: 0,
    },
  ],
  // Celo Mainnet
  42220: [
    {
      url: "https://forno.celo.org",
      priority: 1,
      weight: 100,
      isHealthy: true,
      lastChecked: 0,
      responseTime: 0,
      errorCount: 0,
      successCount: 0,
    },
    {
      url:
        "https://celo-mainnet.infura.io/v3/" + import.meta.env.VITE_INFURA_KEY,
      priority: 2,
      weight: 80,
      isHealthy: true,
      lastChecked: 0,
      responseTime: 0,
      errorCount: 0,
      successCount: 0,
    },
    {
      url: "https://rpc.ankr.com/celo",
      priority: 3,
      weight: 70,
      isHealthy: true,
      lastChecked: 0,
      responseTime: 0,
      errorCount: 0,
      successCount: 0,
    },
  ],
};

const HEALTH_CHECK_INTERVAL = 30000; // 30 seconds
const PROVIDER_TIMEOUT = 10000; // 10 seconds
const MAX_ERROR_COUNT = 5;
const HEALTH_CHECK_TIMEOUT = 5000; // 5 seconds

interface ProviderPoolProviderProps {
  children: React.ReactNode;
  chainId?: number;
  autoHealthCheck?: boolean;
  enableMetrics?: boolean;
}

export function ProviderPoolProvider({
  children,
  chainId = 44787,
  autoHealthCheck = true,
  enableMetrics = true,
}: ProviderPoolProviderProps) {
  const [endpoints, setEndpoints] = useState<ProviderEndpoint[]>(
    RPC_ENDPOINTS[chainId] || RPC_ENDPOINTS[44787]
  );

  const [poolState, setPoolState] = useState<ProviderPoolState>({
    primaryProvider: null,
    activeEndpoint: null,
    isHealthy: false,
    lastHealthCheck: 0,
    failoverCount: 0,
    totalRequests: 0,
    avgResponseTime: 0,
  });

  // Provider cache with WeakMap for memory efficiency
  const providerCache = useRef<Map<string, ethers.JsonRpcProvider>>(new Map());
  const healthCheckInterval = useRef<NodeJS.Timeout | undefined>(undefined);
  const metricsBuffer = useRef<number[]>([]);

  // Create provider with enhanced configuration
  const createProvider = useCallback(
    (endpoint: ProviderEndpoint): ethers.JsonRpcProvider => {
      const cached = providerCache.current.get(endpoint.url);
      if (cached) return cached;

      const provider = new ethers.JsonRpcProvider(endpoint.url, chainId, {
        staticNetwork: ethers.Network.from(chainId),
        batchMaxCount: 100,
        batchMaxSize: 1024 * 1024,
        batchStallTime: 10,
        cacheTimeout: 300000, // 5 minutes
      });

      // Configure timeouts and retry logic
      provider.pollingInterval = 4000;

      // Add request interceptor for metrics
      if (enableMetrics) {
        const originalSend = provider.send.bind(provider);
        provider.send = async (method: string, params: any[]) => {
          const startTime = performance.now();

          try {
            const result = await originalSend(method, params);
            const responseTime = performance.now() - startTime;

            // Update metrics
            updateEndpointMetrics(endpoint.url, true, responseTime);
            updateGlobalMetrics(responseTime);

            return result;
          } catch (error) {
            const responseTime = performance.now() - startTime;
            updateEndpointMetrics(endpoint.url, false, responseTime);
            throw error;
          }
        };
      }

      providerCache.current.set(endpoint.url, provider);
      return provider;
    },
    [chainId, enableMetrics]
  );

  // Update endpoint metrics
  const updateEndpointMetrics = useCallback(
    (url: string, success: boolean, responseTime: number) => {
      setEndpoints((prev) =>
        prev.map((endpoint) => {
          if (endpoint.url === url) {
            const newEndpoint = { ...endpoint };

            if (success) {
              newEndpoint.successCount++;
              newEndpoint.errorCount = Math.max(0, newEndpoint.errorCount - 1);
            } else {
              newEndpoint.errorCount++;
            }

            newEndpoint.responseTime =
              (newEndpoint.responseTime + responseTime) / 2;
            newEndpoint.lastChecked = Date.now();
            newEndpoint.isHealthy = newEndpoint.errorCount < MAX_ERROR_COUNT;

            return newEndpoint;
          }
          return endpoint;
        })
      );
    },
    []
  );

  // Update global metrics
  const updateGlobalMetrics = useCallback((responseTime: number) => {
    metricsBuffer.current.push(responseTime);

    // Keep only last 100 measurements for rolling average
    if (metricsBuffer.current.length > 100) {
      metricsBuffer.current.shift();
    }

    const avgResponseTime =
      metricsBuffer.current.reduce((a, b) => a + b, 0) /
      metricsBuffer.current.length;

    setPoolState((prev) => ({
      ...prev,
      totalRequests: prev.totalRequests + 1,
      avgResponseTime,
    }));
  }, []);

  // Get best available endpoint using weighted selection
  const getBestEndpoint = useCallback((): ProviderEndpoint | null => {
    const healthyEndpoints = endpoints.filter((ep) => ep.isHealthy);

    if (healthyEndpoints.length === 0) {
      // Fallback to any endpoint if all are unhealthy
      console.warn("No healthy endpoints available, using fallback");
      return endpoints[0] || null;
    }

    // Sort by priority first, then by performance
    healthyEndpoints.sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }

      // Secondary sort by performance score
      const scoreA = a.weight * (1000 / Math.max(a.responseTime, 1));
      const scoreB = b.weight * (1000 / Math.max(b.responseTime, 1));

      return scoreB - scoreA;
    });

    return healthyEndpoints[0];
  }, [endpoints]);

  // Perform health check on all endpoints
  const healthCheck = useCallback(async (): Promise<ProviderHealth[]> => {
    const results: ProviderHealth[] = [];

    const checkPromises = endpoints.map(async (endpoint) => {
      const startTime = performance.now();

      try {
        const provider = createProvider(endpoint);

        // Use Promise.race for timeout
        const blockNumberPromise = provider.getBlockNumber();
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(
            () => reject(new Error("Health check timeout")),
            HEALTH_CHECK_TIMEOUT
          );
        });

        const blockNumber = await Promise.race([
          blockNumberPromise,
          timeoutPromise,
        ]);
        const responseTime = performance.now() - startTime;

        results.push({
          endpoint: endpoint.url,
          isHealthy: true,
          responseTime,
          blockNumber,
          lastChecked: Date.now(),
        });

        updateEndpointMetrics(endpoint.url, true, responseTime);
      } catch (error) {
        const responseTime = performance.now() - startTime;

        results.push({
          endpoint: endpoint.url,
          isHealthy: false,
          responseTime,
          lastChecked: Date.now(),
        });

        updateEndpointMetrics(endpoint.url, false, responseTime);
      }
    });

    await Promise.allSettled(checkPromises);

    setPoolState((prev) => ({
      ...prev,
      lastHealthCheck: Date.now(),
      isHealthy: results.some((r) => r.isHealthy),
    }));

    return results;
  }, [endpoints, createProvider, updateEndpointMetrics]);

  // Get primary provider with automatic failover
  const getProvider = useCallback(async (): Promise<ethers.JsonRpcProvider> => {
    const bestEndpoint = getBestEndpoint();

    if (!bestEndpoint) {
      throw new Error("No available RPC endpoints");
    }

    // Check if we need to switch providers
    if (poolState.activeEndpoint !== bestEndpoint.url) {
      const provider = createProvider(bestEndpoint);

      setPoolState((prev) => ({
        ...prev,
        primaryProvider: provider,
        activeEndpoint: bestEndpoint.url,
        failoverCount: prev.activeEndpoint ? prev.failoverCount + 1 : 0,
      }));

      return provider;
    }

    return poolState.primaryProvider || createProvider(bestEndpoint);
  }, [
    getBestEndpoint,
    poolState.activeEndpoint,
    poolState.primaryProvider,
    createProvider,
  ]);

  // Get read-only provider (cached, no failover)
  const getReadOnlyProvider = useCallback((): ethers.JsonRpcProvider => {
    const bestEndpoint = getBestEndpoint();

    if (!bestEndpoint) {
      throw new Error("No available RPC endpoints");
    }

    return createProvider(bestEndpoint);
  }, [getBestEndpoint, createProvider]);

  // Switch to specific endpoint
  const switchToEndpoint = useCallback(
    async (url: string): Promise<void> => {
      const endpoint = endpoints.find((ep) => ep.url === url);

      if (!endpoint) {
        throw new Error(`Endpoint ${url} not found`);
      }

      const provider = createProvider(endpoint);

      // Test the endpoint before switching
      try {
        await provider.getBlockNumber();

        setPoolState((prev) => ({
          ...prev,
          primaryProvider: provider,
          activeEndpoint: url,
        }));
      } catch (error) {
        throw new Error(`Failed to connect to endpoint ${url}: ${error}`);
      }
    },
    [endpoints, createProvider]
  );

  // Refresh all endpoints
  const refreshEndpoints = useCallback(async (): Promise<void> => {
    await healthCheck();

    // Clear provider cache to force recreation
    providerCache.current.clear();

    // Reset to best endpoint
    const provider = await getProvider();

    setPoolState((prev) => ({
      ...prev,
      primaryProvider: provider,
    }));
  }, [healthCheck, getProvider]);

  // Get provider stats
  const getProviderStats = useCallback(
    (): ProviderPoolState => poolState,
    [poolState]
  );

  // Initialize primary provider on mount
  useEffect(() => {
    const initializeProvider = async () => {
      try {
        await getProvider();
      } catch (error) {
        console.error("Failed to initialize provider pool:", error);
      }
    };

    initializeProvider();
  }, [chainId]);

  // Setup automatic health checks
  useEffect(() => {
    if (!autoHealthCheck) return;

    const runHealthCheck = async () => {
      try {
        await healthCheck();
      } catch (error) {
        console.error("Health check failed:", error);
      }
    };

    // Initial health check
    runHealthCheck();

    // Setup interval
    healthCheckInterval.current = setInterval(
      runHealthCheck,
      HEALTH_CHECK_INTERVAL
    );

    return () => {
      if (healthCheckInterval.current) {
        clearInterval(healthCheckInterval.current);
      }
    };
  }, [autoHealthCheck, healthCheck]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clean up providers
      for (const provider of providerCache.current.values()) {
        provider.removeAllListeners();
      }
      providerCache.current.clear();

      if (healthCheckInterval.current) {
        clearInterval(healthCheckInterval.current);
      }
    };
  }, []);

  // Update endpoints when chainId changes
  useEffect(() => {
    const newEndpoints = RPC_ENDPOINTS[chainId] || RPC_ENDPOINTS[44787];
    setEndpoints(newEndpoints);

    // Clear cache for chain switch
    providerCache.current.clear();

    setPoolState((prev) => ({
      ...prev,
      primaryProvider: null,
      activeEndpoint: null,
      failoverCount: 0,
    }));
  }, [chainId]);

  // Memoized context value
  const contextValue = useMemo<ProviderPoolContextType>(
    () => ({
      getProvider,
      getReadOnlyProvider,
      healthCheck,
      switchToEndpoint,
      getProviderStats,
      refreshEndpoints,
    }),
    [
      getProvider,
      getReadOnlyProvider,
      healthCheck,
      switchToEndpoint,
      getProviderStats,
      refreshEndpoints,
    ]
  );

  return (
    <ProviderPoolContext.Provider value={contextValue}>
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

// Optional: Export provider health monitoring hook
export function useProviderHealth() {
  const { healthCheck, getProviderStats } = useProviderPool();
  const [healthData, setHealthData] = useState<ProviderHealth[]>([]);
  const [isChecking, setIsChecking] = useState(false);

  const checkHealth = useCallback(async () => {
    setIsChecking(true);
    try {
      const results = await healthCheck();
      setHealthData(results);
    } catch (error) {
      console.error("Health check failed:", error);
    } finally {
      setIsChecking(false);
    }
  }, [healthCheck]);

  const stats = getProviderStats();

  return {
    healthData,
    isChecking,
    checkHealth,
    stats,
  };
}
