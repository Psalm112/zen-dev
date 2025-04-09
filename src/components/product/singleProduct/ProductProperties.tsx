import { useState } from "react";

const ProductProperties = () => {
  const [selectedType, setSelectedType] = useState<string>("Cream");
  const [selectedColor, setSelectedColor] = useState<string>("red");

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Type Selection */}
      <div className="space-y-2">
        <p className="text-white text-sm sm:text-base mb-2">Type</p>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          {["Cream", "Milk", "Almond"].map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-2 sm:px-3 py-1 text-sm rounded-md transition-colors ${
                selectedType === type
                  ? "bg-Red text-white"
                  : "text-white/70 hover:bg-gray-700/30"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Color Selection */}
      <div className="space-y-2">
        <p className="text-white text-sm sm:text-base mb-2">Color</p>
        <div className="flex gap-2 sm:gap-3">
          {[
            { name: "red", hex: "#ff343f" },
            { name: "blue", hex: "#3e66fb" },
            { name: "yellow", hex: "#ffb800" },
            { name: "green", hex: "#4caf50" },
          ].map((color) => (
            <button
              key={color.name}
              onClick={() => setSelectedColor(color.name)}
              className="w-6 h-6 sm:w-8 sm:h-8 rounded-full relative transition-transform hover:scale-110"
              style={{ backgroundColor: color.hex }}
              aria-label={`${color.name} color`}
            >
              {selectedColor === color.name && (
                <span className="absolute inset-0 flex items-center justify-center text-white text-xs sm:text-sm">
                  ✓
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductProperties;
