import { useState, useCallback } from "react";
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

        // Small delay for UX
        await new Promise((resolve) => setTimeout(resolve, 1000));

        updateStep("complete", { status: "completed" });

        // Close modal after success
        setTimeout(() => {
          setIsModalOpen(false);
          setConnectionSteps([]);
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
    [wallet, updateStep]
  );

  return {
    connectionSteps,
    isModalOpen,
    setIsModalOpen,
    connectWallet,
    updateStep,
  };
}
