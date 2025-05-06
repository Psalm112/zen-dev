// import { useState } from "react";
// import { FaWallet, FaSpinner } from "react-icons/fa";
// import { Product } from "../../../utils/types";
// import { useWallet } from "../../../context/WalletContext";
// import { useOrderData } from "../../../utils/hooks/useOrderData";
// import { useNavigate } from "react-router-dom";

// interface PurchaseSectionProps {
//   product?: Product;
// }

// const PurchaseSection = ({ product }: PurchaseSectionProps) => {
//   const navigate = useNavigate();
//   const { placeOrder } = useOrderData();
//   const [isProcessing, setIsProcessing] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const { isConnected, connectMetaMask, balance, account } = useWallet();

//   const handleConnectWallet = async () => {
//     setIsProcessing(true);
//     setError(null);

//     try {
//       await connectMetaMask();
//     } catch (err: any) {
//       console.error("Error connecting wallet:", err);
//       setError(`Failed to connect wallet: ${err.message || "Unknown error"}`);
//     } finally {
//       setIsProcessing(false);
//     }
//   };
//   const handlePurchase = async () => {
//     if (!product) return;

//     setIsProcessing(true);
//     setError(null);

//     try {
//       const order = await placeOrder({
//         product: product._id,
//         seller: product.seller,
//         amount: product.price,
//       });

//       if (order && order._id) {
//         navigate(`/orders/${order._id}?status=pending`);
//       } else {
//         setError("Failed to create order. Please try again.");
//       }
//     } catch (err) {
//       setError(`Transaction failed: ${(err as string) || "Please try again"}`);
//     } finally {
//       setIsProcessing(false);
//     }
//   };

//   return (
//     <div className="bg-[#212428] p-4 md:p-6 space-y-4">
//       {error && (
//         <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-2 rounded-md text-sm mb-3">
//           {error}
//         </div>
//       )}

//       <div className="flex gap-3 w-full">
//         <button
//           className="bg-Red text-white py-3 px-6 md:px-10 font-bold flex-1 rounded-md transition-all hover:bg-[#d52a33] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:bg-Red flex items-center justify-center gap-2"
//           onClick={isConnected ? handlePurchase : handleConnectWallet}
//           disabled={isProcessing || !product}
//         >
//           {isProcessing ? (
//             <span className="flex items-center justify-center gap-2">
//               <FaSpinner className="animate-spin text-lg" />
//               Processing...
//             </span>
//           ) : (
//             <>
//               <FaWallet className="text-lg" />
//               <span>{isConnected ? "Buy Now" : "Connect wallet to buy"}</span>
//             </>
//           )}
//         </button>
//       </div>

//       {isConnected && (
//         <div className="text-center text-xs text-gray-400">
//           {balance ? `Balance: ${balance}` : "Checking balance..."} ·{" "}
//           {account
//             ? `${account.substring(0, 6)}...${account.substring(
//                 account.length - 4
//               )}`
//             : ""}
//         </div>
//       )}
//     </div>
//   );
// };

// export default PurchaseSection;

import { useState } from "react";
import { FaWallet, FaSpinner } from "react-icons/fa";
import { Product } from "../../../utils/types";
import { useWallet } from "../../../context/WalletContext";
import { useOrderData } from "../../../utils/hooks/useOrderData";
import { useNavigate } from "react-router-dom";
import QuantitySelector from "./QuantitySelector";

interface PurchaseSectionProps {
  product?: Product;
}

const PurchaseSection = ({ product }: PurchaseSectionProps) => {
  const navigate = useNavigate();
  const { placeOrder, currentOrder } = useOrderData();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isConnected, connectMetaMask, balance, account } = useWallet();
  const [quantity, setQuantity] = useState(1);

  const handleConnectWallet = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      await connectMetaMask();
    } catch (err: any) {
      console.error("Error connecting wallet:", err);
      setError(`Failed to connect wallet: ${err.message || "Unknown error"}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePurchase = async () => {
    if (!product) return;

    setIsProcessing(true);
    setError(null);

    try {
      const order = await placeOrder({
        product: product._id,
        seller: product.seller,
        amount: product.price * quantity,
        // quantity: quantity,
      });

      if (order && order._id) {
        navigate(`/orders/${order._id}?status=pending`);
      } else {
        setError("Failed to create order. Please try again.");
      }
    } catch (err) {
      setError(`Transaction failed: ${(err as string) || "Please try again"}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleQuantityChange = (newQuantity: number) => {
    setQuantity(newQuantity);
  };

  return (
    <div className="bg-[#212428] p-4 md:p-6 space-y-4">
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-2 rounded-md text-sm mb-3">
          {error}
        </div>
      )}

      {/* Quantity Selector */}
      <div className="flex justify-between items-center">
        <QuantitySelector min={1} max={99} onChange={handleQuantityChange} />

        {/* {product?.stock && product.stock < 10 && (
          <span className="text-xs text-yellow-500">
            Only {product.stock} left in stock
          </span>
        )} */}
      </div>

      <div className="flex gap-3 w-full">
        <button
          className="bg-Red text-white py-3 px-6 md:px-10 font-bold flex-1 rounded-md transition-all hover:bg-[#d52a33] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:bg-Red flex items-center justify-center gap-2"
          onClick={isConnected ? handlePurchase : handleConnectWallet}
          disabled={isProcessing || !product}
        >
          {isProcessing ? (
            <span className="flex items-center justify-center gap-2">
              <FaSpinner className="animate-spin text-lg" />
              Processing...
            </span>
          ) : (
            <>
              <FaWallet className="text-lg" />
              <span>{isConnected ? "Buy Now" : "Connect wallet to buy"}</span>
            </>
          )}
        </button>
      </div>

      {isConnected && (
        <div className="text-center text-xs text-gray-400">
          {balance ? `Balance: ${balance}` : "Checking balance..."} ·{" "}
          {account
            ? `${account.substring(0, 6)}...${account.substring(
                account.length - 4
              )}`
            : ""}
        </div>
      )}
    </div>
  );
};

export default PurchaseSection;
