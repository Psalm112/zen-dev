import { useCallback } from "react";
import { ethers } from "ethers";
import { useConnection } from "../../context/WalletConnectionContext";
import { useCurrencyConverter } from "../hooks/useCurrencyConverter";
import { PaymentRequest, PaymentResult } from "../types/wallet.types";
import { USDT_CONTRACT_ADDRESS, USDT_ABI } from "../config/wallet.config";

export function usePaymentProcessor() {
  const { account, signer } = useConnection();
  const { convertPrice } = useCurrencyConverter();

  const sendPayment = useCallback(
    async (request: PaymentRequest): Promise<PaymentResult> => {
      if (!signer || !account) {
        throw new Error("Wallet not connected");
      }

      const amountFloat = parseFloat(request.amount);
      let tx: ethers.TransactionResponse;
      let amountWei: bigint;

      if (request.currency === "USDT" && USDT_CONTRACT_ADDRESS) {
        // USDT token transfer
        const usdtContract = new ethers.Contract(
          USDT_CONTRACT_ADDRESS,
          USDT_ABI,
          signer
        );
        const amountInUSDT = ethers.parseUnits(request.amount, 6);
        const txData = request.data ? { value: request.data } : {};
        tx = await usdtContract.transfer(request.to, amountInUSDT, txData);
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
          gasLimit: request.gasLimit,
          gasPrice: request.gasPrice,
          maxFeePerGas: request.maxFeePerGas,
          maxPriorityFeePerGas: request.maxPriorityFeePerGas,
        };

        tx = await signer.sendTransaction(txRequest);
      }

      const receipt = await tx.wait();

      return {
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
    },
    [signer, account, convertPrice]
  );

  const estimateGas = useCallback(
    async (
      request: Omit<PaymentRequest, "gasLimit" | "gasPrice">
    ): Promise<string> => {
      const { provider } = useConnection();
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
    []
  );

  return { sendPayment, estimateGas };
}
