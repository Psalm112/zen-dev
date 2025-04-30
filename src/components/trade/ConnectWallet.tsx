// import { FC } from "react";
// import { motion } from "framer-motion";
// import { BiWallet } from "react-icons/bi";
// import Button from "../common/Button";
// interface ConnectWalletProps {
//   onConnect: () => void;
//   isConnecting: boolean;
// }

// const ConnectWallet: FC<ConnectWalletProps> = ({ onConnect, isConnecting }) => {
//   return (
//     <motion.div
//       className="flex flex-col items-center justify-center p-10 bg-[#292B30] rounded-lg text-center"
//       initial={{ opacity: 0, y: 20 }}
//       animate={{ opacity: 1, y: 0 }}
//       transition={{ duration: 0.5 }}
//     >
//       <motion.div
//         whileHover={{ scale: 1.1, rotate: 15 }}
//         transition={{ type: "spring", stiffness: 400, damping: 10 }}
//         className="text-Red text-5xl mb-6"
//       >
//         <BiWallet />
//       </motion.div>
//       <h2 className="text-2xl font-medium mb-4">Connect Your Wallet</h2>
//       <p className="text-[#AEAEB2] mb-8">
//         You need to connect your crypto wallet to access P2P trading features.
//       </p>
//       <Button
//         title={isConnecting ? "Connecting..." : "Connect Wallet"}
//         className={`bg-Red border-0 rounded-lg text-white px-8 py-3 transition-colors ${
//           isConnecting ? "opacity-70" : "hover:bg-[#e02d37]"
//         }`}
//         path=""
//         onClick={onConnect}
//         disabled={isConnecting}
//       />
//     </motion.div>
//   );
// };

// export default ConnectWallet;



import { motion } from "framer-motion";
import {
  FaWallet,
  FaSpinner,
  FaGoogle,
  FaEnvelope,
  FaPhone,
  FaUser,
} from "react-icons/fa";
import { useState } from "react";

interface ConnectWalletProps {
  onConnect: () => Promise<void>;
  isConnecting: boolean;
  showAlternatives?: boolean;
}

const ConnectWallet = ({
  onConnect,
  isConnecting,
  showAlternatives = true,
}: ConnectWalletProps) => {
  const [error, setError] = useState<string | null>(null);
  const handleConnect = async () => {
    setError(null);
    try {
      await onConnect();
    } catch (err: any) {
      setError(err.message || "Failed to connect wallet");
    }
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="max-w-md mx-auto bg-[#212428] p-6 md:p-8 rounded-lg shadow-lg"
    >
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-md mb-4">
          {error}
        </div>
      )}

      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold mb-2">Connect Your Wallet</h2>
        <p className="text-gray-400 text-sm">
          Connect your wallet to start trading digital assets securely.
        </p>
      </div>
       <button
        onClick={handleConnect}
        disabled={isConnecting}
        className="w-full bg-Red hover:bg-[#
    </motion.div>
  );
};

export default ConnectWallet;
