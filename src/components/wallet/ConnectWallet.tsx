"use client";
import { FC, useState } from "react";
import { useWalletStatus } from "../../context/WalletContext";
import { pendingTransactionProps } from "../../utils/types";
import TransactionConfirmation from "../trade/TransactionConfirmation";
import ConfirmDelivery from "../trade/ConfirmDelivery";
import ConnectedWalletView from "./ConnectedWalletView";
import MainConnectionView from "./MainConnectionView";
import EmailConnectionForm from "./forms/EmailConnectionForm";
import PhoneConnectionForm from "./forms/PhoneConnectionForm";
import VerificationForm from "./forms/VerificationForm";

export interface ConnectWalletProps {
  showAlternatives?: boolean;
  pendingTransaction?: pendingTransactionProps | null;
  onTransactionComplete?: (success: boolean) => void;
}

const ConnectWallet: FC<ConnectWalletProps> = ({
  showAlternatives = true,
  pendingTransaction = null,
  onTransactionComplete = () => {},
}) => {
  const { isConnected, account } = useWalletStatus();

  // Local state
  const [activeTab, setActiveTab] = useState<"main" | "email" | "phone">(
    "main"
  );
  const [authMethod, setAuthMethod] = useState<"email" | "phone" | null>(null);

  // Handle pending transactions
  if (pendingTransaction) {
    if (
      pendingTransaction.type === "escrow" &&
      pendingTransaction.contractAddress &&
      pendingTransaction.amount
    ) {
      return (
        <TransactionConfirmation
          contractAddress={pendingTransaction.contractAddress}
          amount={pendingTransaction.amount}
          onComplete={onTransactionComplete}
        />
      );
    }

    if (pendingTransaction.type === "delivery" && pendingTransaction.tradeId) {
      return (
        <ConfirmDelivery
          tradeId={pendingTransaction.tradeId}
          onComplete={() => onTransactionComplete(true)}
        />
      );
    }
  }

  // Connected state
  if (isConnected && account) {
    return <ConnectedWalletView />;
  }

  // Verification step
  if (authMethod) {
    return (
      <VerificationForm
        authMethod={authMethod}
        onBack={() => setAuthMethod(null)}
      />
    );
  }

  // Email connection tab
  if (activeTab === "email") {
    return <EmailConnectionForm onBack={() => setActiveTab("main")} />;
  }

  // Phone connection tab
  if (activeTab === "phone") {
    return <PhoneConnectionForm onBack={() => setActiveTab("main")} />;
  }

  // Main connection screen
  return (
    <MainConnectionView
      showAlternatives={showAlternatives}
      setActiveTab={setActiveTab}
    />
  );
};

export default ConnectWallet;
