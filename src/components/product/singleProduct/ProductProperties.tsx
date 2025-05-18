import { useState, useEffect, useMemo } from "react";
import { MdCheck } from "react-icons/md";
import { Product } from "../../../utils/types";

interface ProductVariant {
  quantity: number;
  [key: string]: any;
}

interface PropertyOption {
  id: string;
  name: string;
  value: string;
  hex?: string;
  isAvailable: boolean;
}

interface VariantProperties {
  [key: string]: PropertyOption[];
}

interface ProductPropertiesProps {
  product: Product;
  onVariantSelect?: (variant: ProductVariant) => void;
  selectedVariant?: ProductVariant;
}

const getColorHex = (color: string): string => {
  const colorMap: Record<string, string> = {
    red: "#ff343f",
    blue: "#3e66fb",
    yellow: "#ffb800",
    green: "#4caf50",
    purple: "#9c27b0",
    black: "#000000",
    white: "#ffffff",
    brown: "#795548",
    pink: "#e91e63",
    orange: "#ff9800",
    tan: "#d2b48c",
    gray: "#9e9e9e",
    silver: "#c0c0c0",
    gold: "#ffd700",
    terracotta: "#e2725b",
    natural: "#e6d2b5",
    "rose gold": "#b76e79",
    mixed: "#7986cb",
    cherry: "#8b4513",
    oak: "#deb887",
    walnut: "#5c4033",
    light: "#f5f5f5",
    dark: "#333333",
  };

  return colorMap[color.toLowerCase()] || "#cccccc";
};

const ProductProperties = ({
  product,
  onVariantSelect,
  selectedVariant,
}: ProductPropertiesProps) => {
  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, string>
  >({});
  const isColorOrMaterialKey = (key: string): boolean => {
    return (
      key.toLowerCase() === "color" ||
      key.toLowerCase().includes("material") ||
      key.toLowerCase() === "wood" ||
      key.toLowerCase() === "wash"
    );
  };

  // Normalize property keys for consistent display (color/colour)
  const normalizeKey = (key: string): string => {
    const keyMap: Record<string, string> = {
      colour: "color",
    };
    return keyMap[key.toLowerCase()] || key;
  };

  // Extract and process variant properties
  const variantProperties = useMemo<VariantProperties>(() => {
    if (
      !product?.type ||
      !Array.isArray(product.type) ||
      product.type.length === 0
    ) {
      return {};
    }

    const properties: VariantProperties = {};
    const propertyKeys = Array.from(
      new Set(
        product.type.flatMap((variant) =>
          Object.keys(variant).filter((key) => key !== "quantity")
        )
      )
    );

    propertyKeys.forEach((key) => {
      const normalizedKey = normalizeKey(key);
      const values = Array.from(
        new Set(
          product.type
            .filter((variant) => variant[key] !== undefined)
            .map((variant) => variant[key])
        )
      );

      properties[normalizedKey] = values.map((value) => {
        const isAvailable = product.type.some(
          (variant) =>
            String(variant[key]) === String(value) && variant.quantity > 0
        );

        return {
          id: String(value),
          name: String(value),
          value: String(value),
          isAvailable,
          hex: isColorOrMaterialKey(normalizedKey)
            ? getColorHex(String(value))
            : undefined,
        };
      });
    });

    return properties;
  }, [product?.type]);

  // Find a matching variant based on selected options
  const findMatchingVariant = (): ProductVariant | undefined => {
    if (!product?.type) return undefined;

    return product.type.find((variant) => {
      return Object.entries(selectedOptions).every(([key, value]) => {
        const variantKey =
          key === "color" && variant["colour"] !== undefined ? "colour" : key;
        return String(variant[variantKey]) === value;
      });
    });
  };

  // Initialize with first available variant
  useEffect(() => {
    if (Object.keys(variantProperties).length === 0) return;

    const initialOptions: Record<string, string> = {};

    // Try to find first available variant
    const availableVariant = product?.type?.find(
      (variant) => variant.quantity > 0
    );

    if (availableVariant) {
      Object.entries(availableVariant).forEach(([key, value]) => {
        if (key !== "quantity") {
          const normalizedKey = normalizeKey(key);
          initialOptions[normalizedKey] = String(value);
        }
      });
    } else {
      // Fallback to first option of each property
      Object.entries(variantProperties).forEach(([key, options]) => {
        if (options.length > 0) {
          initialOptions[key] = options[0].id;
        }
      });
    }

    setSelectedOptions(initialOptions);
  }, [variantProperties, product?.type]);

  // Update selected options when variant changes externally
  useEffect(() => {
    if (selectedVariant) {
      const newSelection: Record<string, string> = {};
      Object.entries(selectedVariant).forEach(([key, value]) => {
        if (key !== "quantity") {
          const normalizedKey = normalizeKey(key);
          newSelection[normalizedKey] = String(value);
        }
      });
      setSelectedOptions(newSelection);
    }
  }, [selectedVariant]);

  // Notify parent when selection changes

  useEffect(() => {
    if (
      onVariantSelect &&
      product?.type &&
      Object.keys(selectedOptions).length > 0
    ) {
      // First check if we need to update anything
      if (selectedVariant) {
        const areOptionsEqual = Object.entries(selectedOptions).every(
          ([key, value]) => {
            const variantKey =
              key === "color" && selectedVariant["colour"] !== undefined
                ? "colour"
                : key;
            return String(selectedVariant[variantKey]) === value;
          }
        );

        if (areOptionsEqual) return;
      }

      const matchingVariant = findMatchingVariant();
      if (matchingVariant) {
        console.log("matchingVariant", matchingVariant);
        onVariantSelect(matchingVariant);
      }
    }
  }, [selectedOptions, product?.type, onVariantSelect, selectedVariant]);

  const handleOptionSelect = (propertyId: string, optionId: string) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [propertyId]: optionId,
    }));
  };

  if (
    !product?.type ||
    !Array.isArray(product.type) ||
    product.type.length === 0
  ) {
    return <div className="text-gray-400">No product variants available.</div>;
  }

  // Current selected variant
  const currentVariant = findMatchingVariant();

  return (
    <div className="space-y-5 sm:space-y-6">
      {Object.entries(variantProperties).map(([propertyId, options]) => (
        <div key={propertyId} className="space-y-2">
          <p className="text-white text-sm sm:text-base mb-2 capitalize">
            {propertyId}
          </p>

          {options[0]?.hex ? (
            <div className="flex gap-2 sm:gap-3">
              {options.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleOptionSelect(propertyId, option.id)}
                  className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full relative transition-all ${
                    !option.isAvailable
                      ? "opacity-40 cursor-not-allowed"
                      : "hover:scale-110"
                  } ${
                    selectedOptions[propertyId] === option.id
                      ? "ring-2 ring-white ring-offset-1 ring-offset-[#212428]"
                      : ""
                  }`}
                  style={{ backgroundColor: option.hex }}
                  aria-label={`${option.name}`}
                  disabled={!option.isAvailable}
                >
                  {selectedOptions[propertyId] === option.id && (
                    <span className="absolute inset-0 flex items-center justify-center text-white">
                      <MdCheck size={14} />
                    </span>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 sm:gap-3">
              {options.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleOptionSelect(propertyId, option.id)}
                  disabled={!option.isAvailable}
                  className={`px-3 py-1.5 text-sm rounded-md transition-all ${
                    selectedOptions[propertyId] === option.id
                      ? "bg-Red text-white"
                      : "text-white/70 hover:bg-gray-700/50"
                  } ${
                    !option.isAvailable ? "opacity-40 cursor-not-allowed" : ""
                  }`}
                >
                  {option.name}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}

      {currentVariant && (
        <div className="mt-4 pt-4 border-t border-gray-700/50">
          <p className="text-sm">
            {currentVariant.quantity > 0 ? (
              currentVariant.quantity < 10 ? (
                <span className="text-yellow-500">
                  Only {currentVariant.quantity} left for this variant
                </span>
              ) : (
                <span className="text-green-500">
                  In stock ({currentVariant.quantity} available)
                </span>
              )
            ) : (
              <span className="text-red-500">Out of stock</span>
            )}
          </p>
        </div>
      )}
    </div>
  );
};

export default ProductProperties;
