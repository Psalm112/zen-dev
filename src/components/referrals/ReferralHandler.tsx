import { useEffect, useState } from "react";
import { useReferralData } from "../../utils/hooks/useReferral";
import { useAuth } from "../../context/AuthContext";
import {
  clearPendingReferralCode,
  getPendingReferralCode,
} from "../../utils/referralUtils";

const ReferralHandler: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { applyCode } = useReferralData();
  const [isProcessed, setIsProcessed] = useState(false);

  useEffect(() => {
    const handleStoredReferralCode = async () => {
      if (!isAuthenticated || isProcessed) return;

      const storedCode = getPendingReferralCode();
      if (!storedCode) return;

      try {
        // Apply the code and then remove it from storage
        await applyCode(storedCode);
      } catch (error) {
        console.error("Failed to apply referral code:", error);
      } finally {
        // Remove the code from storage regardless of success/failure
        clearPendingReferralCode();
        setIsProcessed(true);
      }
    };

    handleStoredReferralCode();
  }, [isAuthenticated, applyCode, isProcessed]);

  return null;
};

export default ReferralHandler;
