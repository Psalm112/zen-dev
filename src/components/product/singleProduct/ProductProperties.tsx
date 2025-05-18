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
}

interface VariantProperties {
  [key: string]: PropertyOption[];
}

interface ProductPropertiesProps {
  product: Product;
  onVariantSelect?: (variant: ProductVariant) => void;
  selectedVariant?: ProductVariant;
}

// Helper function to get hex code for colors
const getColorHex = (color: string): string => {
  const colorMap: Record<string, string> = {
    // Basic colors
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
    // Additional colors
    terracotta: "#e2725b",
    "rose gold": "#b76e79",
    natural: "#e6d2b5",
    mixed: "#7986cb",
    cherry: "#8b4513",
    oak: "#deb887",
    walnut: "#5c4033",
    light: "#f5f5f5",
    dark: "#333333",
  };

  return colorMap[color.toLowerCase()] || "#cccccc";
};

// Define property display order
const propertyDisplayOrder: string[] = [
  "size",
  "color",
  "style",
  "material",
  "beadMaterial",
  "bandMaterial",
  "wood",
  "thickness",
  "weight",
  "formula",
  "scent",
  "ingredients",
  "wash",
  "burnTime",
  "batteryLife",
  "gripSize",
  "height",
  "design",
];

// Helper to format property name for display
const formatPropertyName = (name: string): string => {
  // Handle special cases
  const specialCases: Record<string, string> = {
    beadMaterial: "Bead Material",
    bandMaterial: "Band Material",
    burnTime: "Burn Time",
    batteryLife: "Battery Life",
    gripSize: "Grip Size",
  };

  if (specialCases[name]) {
    return specialCases[name];
  }

  // Capitalize first letter and handle camelCase
  return name
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase());
};

const ProductProperties = ({
  product,
  onVariantSelect,
  selectedVariant,
}: ProductPropertiesProps) => {
  // Extract unique properties from product variants
  const variantProperties = useMemo<VariantProperties>(() => {
    if (
      !product?.type ||
      !Array.isArray(product.type) ||
      product.type.length === 0
    ) {
      return {};
    }

    // Extract all unique property keys except "quantity"
    const propertyKeys = Array.from(
      new Set(
        product.type.flatMap((variant) =>
          Object.keys(variant).filter((key) => key !== "quantity")
        )
      )
    );

    // Sort property keys according to display order
    propertyKeys.sort((a, b) => {
      const indexA = propertyDisplayOrder.indexOf(a);
      const indexB = propertyDisplayOrder.indexOf(b);
      if (indexA === -1 && indexB === -1) return a.localeCompare(b);
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });

    // For each property key, extract all possible values
    const properties: VariantProperties = {};

    propertyKeys.forEach((key) => {
      const values = Array.from(
        new Set(
          product.type
            .filter((variant) => variant[key] !== undefined)
            .map((variant) => variant[key])
        )
      );

      properties[key] = values.map((value) => ({
        id: String(value),
        name: String(value),
        value: String(value),
        hex:
          key.toLowerCase() === "color" ||
          key.toLowerCase().includes("material") ||
          key.toLowerCase() === "wood" ||
          key.toLowerCase() === "wash"
            ? getColorHex(String(value))
            : undefined,
      }));
    });

    return properties;
  }, [product?.type]);

  // Track selected options and available variants
  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, string>
  >({});

  // Initialize with first available option for each property
  useEffect(() => {
    const initialSelection: Record<string, string> = {};
    Object.entries(variantProperties).forEach(([key, options]) => {
      if (options.length > 0) {
        initialSelection[key] = options[0].id;
      }
    });
    setSelectedOptions(initialSelection);
  }, [variantProperties]);

  // Update selected options when variant changes externally
  useEffect(() => {
    if (selectedVariant) {
      const newSelection: Record<string, string> = {};
      Object.entries(selectedVariant).forEach(([key, value]) => {
        if (key !== "quantity") {
          newSelection[key] = String(value);
        }
      });
      setSelectedOptions(newSelection);
    }
  }, [selectedVariant]);

  // Find and notify parent of variant changes
  useEffect(() => {
    if (onVariantSelect && product?.type) {
      const matchingVariant = product.type.find((variant) => {
        return Object.entries(selectedOptions).every(
          ([key, value]) => String(variant[key]) === value
        );
      });

      if (matchingVariant) {
        onVariantSelect(matchingVariant);
      }
    }
  }, [selectedOptions, product?.type, onVariantSelect]);

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

  return (
    <div className="space-y-5 sm:space-y-6">
      {Object.entries(variantProperties).map(([propertyId, options]) => (
        <div key={propertyId} className="space-y-2">
          <p className="text-white text-sm sm:text-base mb-2">
            {formatPropertyName(propertyId)}
          </p>

          {options[0]?.hex ? (
            // Color/Material selection
            <div className="flex gap-2 sm:gap-3">
              {options.map((option: PropertyOption) => {
                const isAvailable = product.type.some(
                  (variant) =>
                    String(variant[propertyId]) === option.id &&
                    variant.quantity > 0
                );

                return (
                  <button
                    key={option.id}
                    onClick={() => handleOptionSelect(propertyId, option.id)}
                    className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full relative transition-all ${
                      !isAvailable
                        ? "opacity-40 cursor-not-allowed"
                        : "hover:scale-110"
                    } ${
                      selectedOptions[propertyId] === option.id
                        ? "ring-2 ring-white ring-offset-1 ring-offset-[#212428]"
                        : ""
                    }`}
                    style={{ backgroundColor: option.hex }}
                    aria-label={`${option.name}`}
                    disabled={!isAvailable}
                  >
                    {selectedOptions[propertyId] === option.id && (
                      <span className="absolute inset-0 flex items-center justify-center text-white">
                        <MdCheck size={14} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            // Text-based selection
            <div className="flex flex-wrap gap-2 sm:gap-3">
              {options.map((option: PropertyOption) => {
                const isAvailable = product.type.some(
                  (variant) =>
                    String(variant[propertyId]) === option.id &&
                    variant.quantity > 0
                );

                return (
                  <button
                    key={option.id}
                    onClick={() => handleOptionSelect(propertyId, option.id)}
                    disabled={!isAvailable}
                    className={`px-3 py-1.5 text-sm rounded-md transition-all ${
                      selectedOptions[propertyId] === option.id
                        ? "bg-Red text-white"
                        : "text-white/70 hover:bg-gray-700/50"
                    } ${!isAvailable ? "opacity-40 cursor-not-allowed" : ""}`}
                  >
                    {option.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ))}

      {selectedVariant && (
        <div className="mt-4 pt-4 border-t border-gray-700/50">
          <p className="text-sm text-gray-400">
            {selectedVariant.quantity > 0 ? (
              selectedVariant.quantity < 10 ? (
                <span className="text-yellow-500">
                  Only {selectedVariant.quantity} left for this variant
                </span>
              ) : (
                <span className="text-green-500">
                  In stock ({selectedVariant.quantity} available)
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
