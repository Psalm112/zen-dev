// src/components/product/PurchaseSection.tsx
import { useState } from "react";

// interface PurchaseSectionProps {
//   price: string;
//   availability: number;
// }

const PurchaseSection = () => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePurchase = () => {
    setIsProcessing(true);
    // Simulate API call
    setTimeout(() => {
      setIsProcessing(false);
      // Show success notification
    }, 1500);
  };

  return (
    <div className="bg-[#212428] p-4 md:p-6 flex flex-col md:flex-row justify-between items-center gap-4">
      {/* <div>
        <h2 className="text-white text-xl font-bold">{price}</h2>
        <p className="text-[#AEAEB2] text-sm">{availability} items available</p>
      </div> */}
      <div className="flex gap-3 w-full md:w-auto">
        <button
          className="bg-Red text-white py-3 px-6 md:px-10 font-bold flex-1 md:flex-none transition-all hover:bg-[#d52a33] disabled:opacity-70"
          onClick={handlePurchase}
          disabled={isProcessing}
        >
          {isProcessing ? "Processing..." : "Connect wallet to buy"}
        </button>
        <button className="border border-Red text-Red py-3 px-6 flex-1 md:flex-none transition-all hover:bg-Red/10">
          Add to Cart
        </button>
      </div>
    </div>
  );
};

export default PurchaseSection;
