import { useState, useEffect, useMemo } from "react";
import { MdCheck } from "react-icons/md";
import { Product } from "../../../utils/types";

interface ProductPropertiesProps {
  product: Product;
}

// Define type for property options
interface PropertyOption {
  id: string;
  name: string;
  value: string;
  hex?: string;
}

// Define a type for the color map
interface ColorMap {
  [key: string]: string;
}

const ProductProperties = ({ product }: ProductPropertiesProps) => {
  // Extract unique properties from product variants
  const variantProperties = useMemo(() => {
    if (
      !product?.type ||
      !Array.isArray(product.type) ||
      product.type.length === 0
    ) {
      return {} as Record<string, PropertyOption[]>;
    }

    // Extract all unique property keys except "quantity"
    const propertyKeys = Array.from(
      new Set(
        product.type.flatMap((variant) =>
          Object.keys(variant).filter((key) => key !== "quantity")
        )
      )
    );

    // For each property key, extract all possible values
    const properties: Record<string, PropertyOption[]> = {};
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
          key.toLowerCase().includes("color") ||
          key.toLowerCase().includes("colour")
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
  const [availableVariant, setAvailableVariant] = useState<
    (typeof product.type)[0] | null
  >(null);

  // Initialize with first available option for each property
  useEffect(() => {
    if (Object.keys(variantProperties).length > 0) {
      const initialSelection: Record<string, string> = {};
      Object.keys(variantProperties).forEach((key) => {
        if (variantProperties[key].length > 0) {
          initialSelection[key] = variantProperties[key][0].id;
        }
      });
      setSelectedOptions(initialSelection);
    }
  }, [variantProperties]);

  // Find available variant based on current selection
  useEffect(() => {
    if (!product?.type || Object.keys(selectedOptions).length === 0) {
      setAvailableVariant(null);
      return;
    }

    const matchingVariant = product.type.find((variant) => {
      return Object.entries(selectedOptions).every(
        ([key, value]) => String(variant[key]) === value
      );
    });

    setAvailableVariant(matchingVariant || null);
  }, [selectedOptions, product?.type]);

  const handleOptionSelect = (propertyId: string, optionId: string) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [propertyId]: optionId,
    }));
  };

  // Helper function to get hex code for colors
  const getColorHex = (color: string): string => {
    const colorMap: ColorMap = {
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
      "rose gold": "#b76e79",
      natural: "#e6d2b5",
    };

    return colorMap[color.toLowerCase()] || "#cccccc";
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
          <p className="text-white text-sm sm:text-base mb-2 capitalize">
            {propertyId}
          </p>

          {options[0]?.hex ? (
            // Color selection
            <div className="flex gap-2 sm:gap-3">
              {options.map((option) => {
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
                    aria-label={`${option.name} color`}
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
            // Text-based selection (Type, Size, etc.)
            <div className="flex flex-wrap gap-2 sm:gap-3">
              {options.map((option) => {
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

      {availableVariant && (
        <div className="mt-4 pt-4 border-t border-gray-700/50">
          <p className="text-sm text-gray-400">
            {availableVariant.quantity > 0 ? (
              availableVariant.quantity < 10 ? (
                <span className="text-yellow-500">
                  Only {availableVariant.quantity} left for this variant
                </span>
              ) : (
                <span className="text-green-500">
                  In stock ({availableVariant.quantity} available)
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
