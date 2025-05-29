import { useState, useCallback, useRef, useMemo } from "react";
import { useWallet } from "../../context/WalletContext";

export interface ConnectionStep {
  id: string;
  title: string;
  description: string;
  status: "pending" | "active" | "completed" | "error";
  error?: string;
}

export function useWalletConnection() {
  const wallet = useWallet();
  const [connectionSteps, setConnectionSteps] = useState<ConnectionStep[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const updateStep = useCallback(
    (stepId: string, updates: Partial<ConnectionStep>) => {
      setConnectionSteps((prev) =>
        prev.map((step) =>
          step.id === stepId ? { ...step, ...updates } : step
        )
      );
    },
    []
  );

  const resetConnection = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setConnectionSteps([]);
    setIsModalOpen(false);
  }, []);

  const connectWallet = useCallback(
    async (walletType: string) => {
      const steps: ConnectionStep[] = [
        {
          id: "initialize",
          title: "Initialize Connection",
          description: "Preparing wallet connection...",
          status: "active",
        },
        {
          id: "authenticate",
          title: "Authenticate",
          description: "Please confirm in your wallet",
          status: "pending",
        },
        {
          id: "complete",
          title: "Complete Setup",
          description: "Finalizing connection...",
          status: "pending",
        },
      ];

      setConnectionSteps(steps);
      setIsModalOpen(true);

      try {
        updateStep("initialize", { status: "completed" });
        updateStep("authenticate", { status: "active" });

        const result = await wallet.connect(walletType);

        updateStep("authenticate", { status: "completed" });
        updateStep("complete", { status: "active" });

        await new Promise((resolve) => setTimeout(resolve, 500));
        updateStep("complete", { status: "completed" });

        timeoutRef.current = setTimeout(() => {
          resetConnection();
        }, 1500);

        return result;
      } catch (error: any) {
        const activeStep = steps.find((s) => s.status === "active");
        if (activeStep) {
          updateStep(activeStep.id, {
            status: "error",
            error: error.message,
          });
        }
        throw error;
      }
    },
    [wallet.connect, updateStep, resetConnection]
  );

  return useMemo(
    () => ({
      connectionSteps,
      isModalOpen,
      setIsModalOpen: resetConnection,
      connectWallet,
      updateStep,
      resetConnection,
    }),
    [connectionSteps, isModalOpen, connectWallet, updateStep, resetConnection]
  );
}

// Enhanced hook for wallet operations
export function useWalletOperations() {
  const {
    isConnecting,
    isConnected,
    account,
    disconnect,
    connectMetaMask,
    connectGoogle,
    connectEmail,
    connectPhone,
    connectPasskey,
    connectGuest,
  } = useWallet();

  const [operationState, setOperationState] = useState<{
    loading: boolean;
    error: string | null;
    success: boolean;
  }>({
    loading: false,
    error: null,
    success: false,
  });

  const resetState = useCallback(() => {
    setOperationState({ loading: false, error: null, success: false });
  }, []);

  const executeOperation = useCallback(
    async <T>(operation: () => Promise<T>): Promise<T | null> => {
      setOperationState({ loading: true, error: null, success: false });

      try {
        const result = await operation();
        setOperationState({ loading: false, error: null, success: true });
        return result;
      } catch (error: any) {
        setOperationState({
          loading: false,
          error: error.message || "Operation failed",
          success: false,
        });
        return null;
      }
    },
    []
  );

  return useMemo(
    () => ({
      ...operationState,
      isConnecting,
      isConnected,
      account,
      resetState,
      executeOperation,
      disconnect: () =>
        executeOperation(async () => {
          disconnect();
        }),
      connectMetaMask: () => executeOperation(connectMetaMask),
      connectGoogle: () => executeOperation(connectGoogle),
      connectEmail: (email: string, code?: string) =>
        executeOperation(() => connectEmail(email, code)),
      connectPhone: (phone: string, code?: string) =>
        executeOperation(() => connectPhone(phone, code)),
      connectPasskey: () => executeOperation(connectPasskey),
      connectGuest: () => executeOperation(connectGuest),
    }),
    [
      operationState,
      isConnecting,
      isConnected,
      account,
      resetState,
      executeOperation,
      disconnect,
      connectMetaMask,
      connectGoogle,
      connectEmail,
      connectPhone,
      connectPasskey,
      connectGuest,
    ]
  );
}
