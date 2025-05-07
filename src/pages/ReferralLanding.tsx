import { useEffect } from "react";
import { useSearchParams, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Logo } from ".";
import Login from "./Login";
import { storeReferralCode } from "../utils/referralUtils";
// import { useReferralData } from "../utils/hooks/useReferralData";
// import { useAuth } from "../context/AuthContext";

const ReferralLanding = () => {
  const [searchParams] = useSearchParams();
  //   const { isAuthenticated } = useAuth();
  //   const { applyCode } = useReferralData();

  useEffect(() => {
    const referralCode = searchParams.get("code");

    if (referralCode) {
      storeReferralCode(referralCode);
    }
  }, [searchParams]);

  //   if (isAuthenticated) {
  //     return <Navigate to="/" />;
  //   }

  return (
    <motion.div
      className="bg-Dark min-h-screen flex flex-col items-center pt-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="w-full max-w-md px-6 md:px-10">
        <motion.div
          className="mb-8 text-center"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <img
            src={Logo}
            alt="Logo"
            className="w-[75px] h-[75px] mx-auto mb-6"
          />
          <h1 className="text-2xl font-bold text-white mb-2">
            You've been invited!
          </h1>
          <p className="text-gray-400">
            Sign up to receive points on your first purchase
          </p>
        </motion.div>

        <Login isFromReferral={true} />
      </div>
    </motion.div>
  );
};

export default ReferralLanding;
