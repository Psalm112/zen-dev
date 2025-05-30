import { useCallback, useState } from "react";
import { ethers } from "ethers";
import { useConnection } from "../../context/WalletConnectionContext";
import { useCurrencyConverter } from "../hooks/useCurrencyConverter";
import {
  PaymentRequest,
  PaymentResult,
  EscrowTransaction,
} from "../types/wallet.types";
import { USDT_CONTRACT_ADDRESS, USDT_ABI } from "../config/wallet.config";

// Add these to your config file
const ESCROW_CONTRACT_ADDRESS = import.meta.env.VITE_ESCROW_CONTRACT_ADDRESS;
const ESCROW_ABI = [
  "function depositUSDT(string orderId, address seller, uint256 amount) external",
  "function depositCELO(string orderId, address seller) external payable",
] as const;

export function usePaymentProcessor() {
  const { account, signer, provider } = useConnection();
  const { convertPrice } = useCurrencyConverter();
  const [pendingTransactions, setPendingTransactions] = useState<
    Map<string, PaymentResult>
  >(new Map());

  // Enhanced gas estimation with buffer
  const estimateGasWithBuffer = useCallback(
    async (txRequest: any, bufferPercentage: number = 20): Promise<string> => {
      if (!provider) throw new Error("Provider not available");

      try {
        const gasEstimate = await provider.estimateGas(txRequest);
        const gasWithBuffer =
          (gasEstimate * BigInt(100 + bufferPercentage)) / BigInt(100);
        return gasWithBuffer.toString();
      } catch (error) {
        console.error("Gas estimation failed:", error);
        // Fallback gas limits
        return txRequest.data === "0x" ? "21000" : "100000";
      }
    },
    [provider]
  );

  // Monitor transaction status
  const monitorTransaction = useCallback(
    async (
      txHash: string,
      timeoutMs: number = 300000
    ): Promise<PaymentResult> => {
      if (!provider) throw new Error("Provider not available");

      let receipt = null;
      let attempts = 0;
      const maxAttempts = Math.floor(timeoutMs / 5000); // 5 second intervals

      while (!receipt && attempts < maxAttempts) {
        try {
          receipt = await provider.getTransactionReceipt(txHash);
          if (receipt) break;

          // Update pending transaction status
          setPendingTransactions((prev) => {
            const updated = new Map(prev);
            const existing = updated.get(txHash);
            if (existing) {
              updated.set(txHash, { ...existing, timestamp: Date.now() });
            }
            return updated;
          });
        } catch (error) {
          console.warn(
            `Transaction check attempt ${attempts + 1} failed:`,
            error
          );
        }

        await new Promise((resolve) => setTimeout(resolve, 5000));
        attempts++;
      }

      if (!receipt) {
        throw new Error("Transaction not confirmed within timeout period");
      }

      const result: PaymentResult = {
        hash: txHash,
        from: receipt.from,
        to: receipt.to || "",
        amount: "0", // Will be filled by caller
        currency: "USDT", // Will be filled by caller
        gasUsed: receipt.gasUsed?.toString(),
        effectiveGasPrice: receipt.gasPrice?.toString(),
        blockNumber: receipt.blockNumber,
        timestamp: Date.now(),
      };

      // Remove from pending
      setPendingTransactions((prev) => {
        const updated = new Map(prev);
        updated.delete(txHash);
        return updated;
      });

      return result;
    },
    [provider]
  );

  // Send to escrow contract
  const sendToEscrow = useCallback(
    async (
      request: PaymentRequest & { orderId: string }
    ): Promise<PaymentResult> => {
      if (!signer || !account) throw new Error("Wallet not connected");
      if (!ESCROW_CONTRACT_ADDRESS)
        throw new Error("Escrow contract not configured");

      const escrowContract = new ethers.Contract(
        ESCROW_CONTRACT_ADDRESS,
        ESCROW_ABI,
        signer
      );

      let tx: ethers.TransactionResponse;
      const amountFloat = parseFloat(request.amount);

      try {
        if (request.currency === "USDT" && USDT_CONTRACT_ADDRESS) {
          // USDT escrow flow
          const usdtContract = new ethers.Contract(
            USDT_CONTRACT_ADDRESS,
            USDT_ABI,
            signer
          );
          const amountInUSDT = ethers.parseUnits(request.amount, 6);

          // Check current allowance
          const currentAllowance = await usdtContract.allowance(
            account,
            ESCROW_CONTRACT_ADDRESS
          );

          if (currentAllowance < amountInUSDT) {
            // Approve USDT spending
            const approveTx = await usdtContract.approve(
              ESCROW_CONTRACT_ADDRESS,
              amountInUSDT
            );
            await approveTx.wait();
          }

          // Deposit to escrow
          tx = await escrowContract.depositUSDT(
            request.orderId,
            request.to,
            amountInUSDT,
            {
              gasLimit: await estimateGasWithBuffer({
                to: ESCROW_CONTRACT_ADDRESS,
                data: escrowContract.interface.encodeFunctionData(
                  "depositUSDT",
                  [request.orderId, request.to, amountInUSDT]
                ),
              }),
            }
          );
        } else {
          // CELO escrow flow (convert other currencies to CELO)
          let amountWei: bigint;

          switch (request.currency) {
            case "CELO":
              amountWei = ethers.parseEther(request.amount);
              break;
            case "FIAT":
              const celoFromFiat = convertPrice(amountFloat, "FIAT", "CELO");
              amountWei = ethers.parseEther(celoFromFiat.toString());
              break;
            default:
              amountWei = ethers.parseEther(request.amount);
          }

          tx = await escrowContract.depositCELO(request.orderId, request.to, {
            value: amountWei,
            gasLimit: await estimateGasWithBuffer({
              to: ESCROW_CONTRACT_ADDRESS,
              value: amountWei,
              data: escrowContract.interface.encodeFunctionData("depositCELO", [
                request.orderId,
                request.to,
              ]),
            }),
          });
        }

        // Add to pending transactions
        const pendingResult: PaymentResult = {
          hash: tx.hash,
          from: account,
          to: request.to,
          amount: request.amount,
          currency: request.currency,
          isEscrow: true,
          orderId: request.orderId,
          timestamp: Date.now(),
        };

        setPendingTransactions(
          (prev) => new Map(prev.set(tx.hash, pendingResult))
        );

        // Monitor the transaction
        const finalResult = await monitorTransaction(tx.hash);

        return {
          ...finalResult,
          ...pendingResult,
        };
      } catch (error: any) {
        console.error("Escrow transaction failed:", error);
        throw new Error(`Escrow transaction failed: ${error.message}`);
      }
    },
    [signer, account, convertPrice, estimateGasWithBuffer, monitorTransaction]
  );

  // Regular payment (non-escrow)
  const sendPayment = useCallback(
    async (request: PaymentRequest): Promise<PaymentResult> => {
      if (!signer || !account) throw new Error("Wallet not connected");

      const amountFloat = parseFloat(request.amount);
      let tx: ethers.TransactionResponse;
      let amountWei: bigint;

      try {
        if (request.currency === "USDT" && USDT_CONTRACT_ADDRESS) {
          // Direct USDT transfer
          const usdtContract = new ethers.Contract(
            USDT_CONTRACT_ADDRESS,
            USDT_ABI,
            signer
          );
          const amountInUSDT = ethers.parseUnits(request.amount, 6);

          tx = await usdtContract.transfer(request.to, amountInUSDT, {
            gasLimit: await estimateGasWithBuffer({
              to: USDT_CONTRACT_ADDRESS,
              data: usdtContract.interface.encodeFunctionData("transfer", [
                request.to,
                amountInUSDT,
              ]),
            }),
          });
        } else {
          // Native CELO transfer or convert other currencies
          switch (request.currency) {
            case "CELO":
              amountWei = ethers.parseEther(request.amount);
              break;
            case "FIAT":
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
            gasLimit:
              request.gasLimit ||
              (await estimateGasWithBuffer({
                to: request.to,
                value: amountWei,
                data: request.data || "0x",
              })),
            gasPrice: request.gasPrice,
            maxFeePerGas: request.maxFeePerGas,
            maxPriorityFeePerGas: request.maxPriorityFeePerGas,
          };

          tx = await signer.sendTransaction(txRequest);
        }

        // Monitor transaction
        const result = await monitorTransaction(tx.hash);

        return {
          ...result,
          from: account,
          to: request.to,
          amount: request.amount,
          currency: request.currency,
          orderId: request.orderId,
          isEscrow: request.isEscrow || false,
        };
      } catch (error: any) {
        console.error("Payment failed:", error);
        throw new Error(`Payment failed: ${error.message}`);
      }
    },
    [signer, account, convertPrice, estimateGasWithBuffer, monitorTransaction]
  );

  // gas estimation
  const estimateGas = useCallback(
    async (
      request: Omit<PaymentRequest, "gasLimit" | "gasPrice">
    ): Promise<string> => {
      if (!provider) throw new Error("Provider not available");

      try {
        if (request.currency === "USDT" && USDT_CONTRACT_ADDRESS) {
          const usdtContract = new ethers.Contract(
            USDT_CONTRACT_ADDRESS,
            USDT_ABI,
            provider
          );
          const amountInUSDT = ethers.parseUnits(request.amount, 6);

          return await estimateGasWithBuffer({
            to: USDT_CONTRACT_ADDRESS,
            data: usdtContract.interface.encodeFunctionData("transfer", [
              request.to,
              amountInUSDT,
            ]),
          });
        } else {
          const amountWei = ethers.parseEther(request.amount);
          return await estimateGasWithBuffer({
            to: request.to,
            value: amountWei,
            data: request.data || "0x",
          });
        }
      } catch (error: any) {
        console.error("Gas estimation failed:", error);
        return "100000"; // Fallback gas limit
      }
    },
    [provider, estimateGasWithBuffer]
  );

  return {
    sendPayment,
    sendToEscrow,
    estimateGas,
    pendingTransactions: Array.from(pendingTransactions.values()),
    monitorTransaction,
  };
}
