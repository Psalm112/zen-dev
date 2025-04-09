import { useState, useEffect } from "react";
import { MdVerified } from "react-icons/md";

const ProductAbout = () => {
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<any>(null);

  useEffect(() => {
    // future: API call
    const timer = setTimeout(() => {
      setProduct({
        name: "Vaseline Lotion",
        seller: "DanBike",
        verified: true,
        price: "0.0002 ETH",
      });
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="h-8 sm:h-10 w-full bg-gray-700/30 animate-pulse rounded"></div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base sm:text-xl text-white font-medium">
          {product.name}
        </h2>
        <span className="text-base sm:text-xl text-white font-medium">
          {product.price}
        </span>
      </div>
      <div className="flex items-center gap-1 sm:gap-2">
        <span className="text-xs sm:text-sm text-white/70">
          By {product.seller}
        </span>
        {product.verified && (
          // <span className="bg-blue-500 text-white text-xs rounded-full w-3 h-3 sm:w-4 sm:h-4 flex items-center justify-center">
          //   ✓
          // </span>
          <MdVerified className="text-blue-500 h-5 w-5" />
        )}
      </div>
    </div>
  );
};

export default ProductAbout;
