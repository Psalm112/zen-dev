import { useState, useEffect } from "react";
import { Product1 } from "../../../pages";

interface ProductImageProps {
  productId?: string;
}

const ProductImage = ({ productId }: ProductImageProps) => {
  const [loading, setLoading] = useState(true);
  const [image, setImage] = useState<string>(Product1);

  useEffect(() => {
    // In a real app, you'd fetch product image based on productId
    const timer = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timer);
  }, [productId]);

  return (
    <div className="w-full flex justify-center items-center pt-10 pb-6 sm:py-8 relative">
      {loading ? (
        <div className="w-[65%] sm:w-[50%] md:w-[40%] lg:w-[30%] aspect-[1/2.5] bg-gray-700/30 animate-pulse rounded-lg"></div>
      ) : (
        <img
          src={image}
          className="w-[65%] sm:w-[50%] md:w-[40%] lg:w-[30%] object-contain transition-all duration-300"
          alt="Vaseline Cocoa Radiant Lotion"
          loading="lazy"
        />
      )}
      <div className="flex gap-1.5 absolute bottom-0 sm:bottom-2">
        {[1, 2, 3, 4].map((dot) => (
          <div
            key={dot}
            className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${
              dot === 4 ? "bg-white" : "bg-white/40"
            }`}
          ></div>
        ))}
      </div>
    </div>
  );
};

export default ProductImage;
