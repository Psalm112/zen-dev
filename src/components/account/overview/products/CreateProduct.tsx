import {
  useState,
  useRef,
  ChangeEvent,
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiImage, FiX, FiPlus, FiVideo, FiTag } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useProductData } from "../../../../utils/hooks/useProduct";
import LoadingSpinner from "../../../common/LoadingSpinner";
import Button from "../../../common/Button";
import { useCurrencyConverter } from "../../../../utils/hooks/useCurrencyConverter";
import { useContractData } from "../../../../utils/hooks/useContract";
import { LogisticsProvider } from "../../../../utils/types";
// import { toast } from "react-toastify";

interface FormErrors {
  name?: string;
  description?: string;
  category?: string;
  price?: string;
  media?: string;
  stock?: string;
  logistics?: string;
  variants?: string;
  sellerWalletAddress?: string;
}

interface MediaFile {
  file: File;
  preview: string;
  type: "image" | "video";
}

interface ProductVariant {
  id: string;
  properties: {
    name: string;
    value: string;
  }[];
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
const MAX_FILES = 5;

const logisticsProviders: LogisticsProvider[] = [
  {
    address: "0xF46F1B3Bea9cdd4102105EE9bAefc83db333354B",
    name: "Fast Delivery Co.",
    location: "Ikeja, Lagos, Nigeria",
    cost: 1,
  },
  {
    address: "0x3207D4728c32391405C7122E59CCb115A4af31eA",
    name: "Global Logistics Ltd.",
    location: "Maitama, Abuja, Nigeria",
    cost: 1,
  },
  {
    address: "0x7A1c3b09298C227D910E90CD55985300bd1032F3",
    name: "Express Shipping Inc.",
    location: "Kano",
    cost: 2,
  },
  {
    address: "0xF46F1B3Bea9cdd4102105EE9bAefc83db333354B",
    name: "Fast Delivery Co.",
    location: "Ikeja, Lagos, Nigeria",
    cost: 1,
  },
  {
    address: "0x3207D4728c32391405C7122E59CCb115A4af31eA",
    name: "Global Logistics Ltd.",
    location: "Maitama, Abuja, Nigeria",
    cost: 1,
  },
  {
    address: "0x7A1c3b09298C227D910E90CD55985300bd1032F3",
    name: "Express Shipping Inc.",
    location: "Kano",
    cost: 2,
  },
  {
    address: "0xF46F1B3Bea9cdd4102105EE9bAefc83db333354B",
    name: "Fast Delivery Co.",
    location: "Ikeja, Lagos, Nigeria",
    cost: 1,
  },
  {
    address: "0x3207D4728c32391405C7122E59CCb115A4af31eA",
    name: "Global Logistics Ltd.",
    location: "Maitama, Abuja, Nigeria",
    cost: 1,
  },
  {
    address: "0x7A1c3b09298C227D910E90CD55985300bd1032F3",
    name: "Express Shipping Inc.",
    location: "Kano",
    cost: 2,
  },
];

const CreateProduct = () => {
  const navigate = useNavigate();
  const { createProduct, loading } = useProductData();
  const { initiateTradeContract } = useContractData();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { convertPrice, userCountry } = useCurrencyConverter();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [priceInUSDT, setPriceInUSDT] = useState("");
  const [priceInFiat, setPriceInFiat] = useState("");
  const [inputFocus, setInputFocus] = useState<"USDT" | "FIAT" | null>(null);
  const [stock, setStock] = useState("");
  const [sellerWalletAddress, setSellerWalletAddress] = useState("");
  const [selectedLogistics, setSelectedLogistics] = useState<
    LogisticsProvider[]
  >([]);
  const [searchLogistics, setSearchLogistics] = useState("");

  // Product variants
  const [variants, setVariants] = useState<ProductVariant[]>([
    { id: `variant-${Date.now()}`, properties: [] },
  ]);
  const [currentVariantProperty, setCurrentVariantProperty] = useState({
    variantIndex: 0,
    name: "",
    value: "",
  });
  // filter logistics providers

  const categories = [
    "Electronics",
    "Clothing",
    "Home & Garden",
    "Beauty & Personal Care",
    "Sports & Outdoors",
    "Art Work",
    "Accessories",
    "Other",
  ];

  // Handle conversion between USDT and local currency
  const handleUSDTChange = useCallback(
    (value: string) => {
      setPriceInUSDT(value);

      if (value.trim() === "") {
        setPriceInFiat("");
        return;
      }

      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        const fiatValue = convertPrice(numValue, "USDT", "FIAT");
        setPriceInFiat(fiatValue.toFixed(2));
      }
    },
    [convertPrice]
  );

  const handleFiatChange = useCallback(
    (value: string) => {
      setPriceInFiat(value);

      if (value.trim() === "") {
        setPriceInUSDT("");
        return;
      }

      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        const usdtValue = convertPrice(numValue, "FIAT", "USDT");
        setPriceInUSDT(usdtValue.toFixed(2));
      }
    },
    [convertPrice]
  );

  // clear price error when either price field changes
  useEffect(() => {
    if (priceInUSDT || priceInFiat) {
      setErrors((prev) => ({ ...prev, price: undefined }));
    }
  }, [priceInUSDT, priceInFiat]);

  // Clear stock error when stock changes
  useEffect(() => {
    if (stock) {
      setErrors((prev) => ({ ...prev, stock: undefined }));
    }
  }, [stock]);

  // Clear wallet address error when it changes
  useEffect(() => {
    if (sellerWalletAddress) {
      setErrors((prev) => ({ ...prev, sellerWalletAddress: undefined }));
    }
  }, [sellerWalletAddress]);

  const handleMediaChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const newFiles = Array.from(e.target.files);

    // Check if adding new files would exceed the limit
    if (mediaFiles.length + newFiles.length > MAX_FILES) {
      setErrors((prev) => ({
        ...prev,
        media: `You can only upload a maximum of ${MAX_FILES} files`,
      }));
      return;
    }

    // Filter out files that are too large and process valid ones
    const validFiles: MediaFile[] = [];
    const oversizedFiles: string[] = [];

    newFiles.forEach((file) => {
      if (file.size > MAX_FILE_SIZE) {
        oversizedFiles.push(file.name);
        return;
      }

      const fileType = file.type.startsWith("image/")
        ? "image"
        : file.type.startsWith("video/")
        ? "video"
        : null;

      if (!fileType) return; // Skip unsupported file types

      validFiles.push({
        file,
        preview: URL.createObjectURL(file),
        type: fileType,
      });
    });

    if (oversizedFiles.length > 0) {
      setErrors((prev) => ({
        ...prev,
        media: `Some files exceed the 5MB limit: ${oversizedFiles.join(", ")}`,
      }));

      if (validFiles.length === 0) return;
    } else {
      setErrors((prev) => ({ ...prev, media: undefined }));
    }

    // Combine existing and new media files
    setMediaFiles((prev) => [...prev, ...validFiles].slice(0, MAX_FILES));
  };

  const removeMedia = (index: number) => {
    setMediaFiles(mediaFiles.filter((_, i) => i !== index));
    setErrors((prev) => ({ ...prev, media: undefined }));
  };

  // Clean up object URLs when component unmounts or files change
  useEffect(() => {
    return () => {
      mediaFiles.forEach((media) => URL.revokeObjectURL(media.preview));
    };
  }, [mediaFiles]);

  // Add new variant property pair
  const addVariantProperty = () => {
    if (!currentVariantProperty.name || !currentVariantProperty.value) return;

    const newVariants = [...variants];
    newVariants[currentVariantProperty.variantIndex].properties.push({
      name: currentVariantProperty.name,
      value: currentVariantProperty.value,
    });

    setVariants(newVariants);
    setCurrentVariantProperty({
      ...currentVariantProperty,
      name: "",
      value: "",
    });
  };

  // Add new variant
  const addNewVariant = () => {
    setVariants([...variants, { id: `variant-${Date.now()}`, properties: [] }]);
    // Set active variant to the newly added one
    setCurrentVariantProperty({
      variantIndex: variants.length,
      name: "",
      value: "",
    });
  };

  // Remove a variant
  const removeVariant = (index: number) => {
    if (variants.length <= 1) return; // Keep at least one variant

    const newVariants = variants.filter((_, i) => i !== index);
    setVariants(newVariants);

    // Update current variant index if needed
    if (currentVariantProperty.variantIndex >= newVariants.length) {
      setCurrentVariantProperty({
        ...currentVariantProperty,
        variantIndex: Math.max(newVariants.length - 1, 0),
      });
    }
  };

  // Remove a property from a variant
  const removeProperty = (variantIndex: number, propertyIndex: number) => {
    const newVariants = [...variants];
    newVariants[variantIndex].properties.splice(propertyIndex, 1);
    setVariants(newVariants);
  };
  // Format variants to string for backend
  const formatVariantsForBackend = (): string => {
    const validVariants = variants.filter(
      (variant) => variant.properties.length > 0
    );

    if (validVariants.length === 0) return "";

    return validVariants
      .map((variant) => {
        return variant.properties
          .map((prop) => `${prop.name}:${prop.value}`)
          .join("_");
      })
      .join(", ");
  };

  const filteredLogistics = useMemo(() => {
    return logisticsProviders.filter(
      (provider) =>
        provider.name.toLowerCase().includes(searchLogistics.toLowerCase()) ||
        provider.location.toLowerCase().includes(searchLogistics.toLowerCase())
    );
  }, [searchLogistics]);
  // handle logistics selection
  const toggleLogisticsProvider = (provider: LogisticsProvider) => {
    if (selectedLogistics.some((p) => p.address === provider.address)) {
      setSelectedLogistics(
        selectedLogistics.filter((p) => p.address !== provider.address)
      );
    } else {
      setSelectedLogistics([...selectedLogistics, provider]);
    }
  };
  // Fix variants validation and responsiveness
  const validateForm = () => {
    const newErrors: FormErrors = {};

    if (!name.trim()) newErrors.name = "Product name is required";
    if (!description.trim()) newErrors.description = "Description is required";
    if (!category) newErrors.category = "Category is required";
    if (!priceInUSDT.trim()) {
      newErrors.price = "Price is required";
    } else if (isNaN(parseFloat(priceInUSDT)) || parseFloat(priceInUSDT) <= 0) {
      newErrors.price = "Price must be a positive number";
    }

    if (!stock.trim()) {
      newErrors.stock = "Stock quantity is required";
    } else if (isNaN(Number(stock)) || Number(stock) <= 0) {
      newErrors.stock = "Stock must be a positive number";
    }

    if (!sellerWalletAddress.trim()) {
      newErrors.sellerWalletAddress = "Seller wallet address is required";
    }

    // Add logistics provider validation
    if (selectedLogistics.length === 0) {
      newErrors.logistics = "Please select at least one logistics provider";
    }

    // Check for empty variants (excluding when there's only one empty variant)
    const nonEmptyVariants = variants.filter((v) => v.properties.length > 0);
    if (variants.length > 1 && nonEmptyVariants.length < variants.length) {
      newErrors.variants = "Please fill all variants or remove empty ones";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description);
    formData.append("category", category);
    formData.append("price", priceInUSDT);
    formData.append("stock", stock);
    formData.append("sellerWalletAddress", sellerWalletAddress);
    // Add logistics provider addresses and costs
    if (selectedLogistics.length > 0) {
      const addresses = selectedLogistics.map((provider) => provider.address);
      const costs = selectedLogistics.map(
        (provider) => provider.cost * Math.pow(10, 18)
      );
      console.log({
        logisticsProvider: JSON.stringify(addresses),
        logisticsCost: JSON.stringify(costs),
      });
      formData.append("logisticsProvider", JSON.stringify(addresses));
      formData.append("logisticsCost", JSON.stringify(costs));
    }

    // Add type (variants) if available
    const variantsString = formatVariantsForBackend();
    if (variantsString) {
      formData.append("type", variantsString);
    }
    console.log({
      name: name,
      description: description,
      category: category,
      price: priceInUSDT,
      stock: stock,
      sellerWalletAddress: sellerWalletAddress,
      type: variantsString,
    });

    // mediaFiles.forEach((media) => {
    //   formData.append("mediaFiles", media.file);
    //   formData.append("mediaTypes", media.type);
    // });

    try {
      const result = await createProduct(formData);
      if (result) {
        navigate(`/product/${result._id}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      className="w-full mx-auto py-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.form
        onSubmit={handleSubmit}
        className="bg-[#292B30] rounded-lg p-4 md:p-8 w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="space-y-6">
          {/* Product Media Files */}
          <div>
            <label className="block text-white mb-2">
              Product Media (Images & Videos)
            </label>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-4 mb-2">
              <AnimatePresence>
                {mediaFiles.map((media, index) => (
                  <motion.div
                    key={index}
                    className="relative aspect-square rounded-lg overflow-hidden bg-[#333]"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.3 }}
                    whileHover={{ scale: 1.05 }}
                  >
                    {media.type === "image" ? (
                      <img
                        src={media.preview}
                        alt={`Product preview ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="relative w-full h-full">
                        <video
                          src={media.preview}
                          className="w-full h-full object-cover"
                          muted
                          onMouseOver={(e) =>
                            (e.target as HTMLVideoElement).play()
                          }
                          onMouseOut={(e) => {
                            const video = e.target as HTMLVideoElement;
                            video.pause();
                            video.currentTime = 0;
                          }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <FiVideo className="text-white text-2xl opacity-80" />
                        </div>
                      </div>
                    )}
                    <motion.button
                      type="button"
                      className="absolute top-2 right-2 bg-Red rounded-full w-6 h-6 flex items-center justify-center text-white"
                      onClick={() => removeMedia(index)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <FiX size={16} />
                    </motion.button>
                  </motion.div>
                ))}
              </AnimatePresence>

              {mediaFiles.length < MAX_FILES && (
                <motion.button
                  type="button"
                  className="aspect-square rounded-lg border-2 border-dashed border-gray-600 flex flex-col items-center justify-center text-gray-400 hover:border-Red hover:text-Red transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="flex gap-2">
                    <FiImage size={20} />
                    <FiVideo size={20} />
                  </div>
                  <span className="text-xs mt-2">Add Media</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={handleMediaChange}
                    className="hidden"
                  />
                </motion.button>
              )}
            </div>
            {errors.media && (
              <p className="text-Red text-sm mt-1">{errors.media}</p>
            )}
            <p className="text-gray-400 text-xs mt-1">
              Upload up to 5 images or videos (max 5MB each). First file will be
              the main product preview.
            </p>
          </div>

          {/* Product Name */}
          <div>
            <label htmlFor="name" className="block text-white mb-2">
              Product Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setErrors((prev) => ({ ...prev, name: undefined }));
              }}
              className={`w-full bg-[#333] text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-Red transition-all ${
                errors.name ? "border border-Red" : ""
              }`}
              placeholder="Enter product name"
            />
            {errors.name && (
              <p className="text-Red text-sm mt-1">{errors.name}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-white mb-2">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setErrors((prev) => ({ ...prev, description: undefined }));
              }}
              rows={4}
              className={`w-full bg-[#333] text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-Red transition-all ${
                errors.description ? "border border-Red" : ""
              }`}
              placeholder="Describe your product"
            />
            {errors.description && (
              <p className="text-Red text-sm mt-1">{errors.description}</p>
            )}
          </div>

          {/* Category */}
          <div>
            <label htmlFor="category" className="block text-white mb-2">
              Category
            </label>
            <div className="relative">
              <select
                id="category"
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setErrors((prev) => ({ ...prev, category: undefined }));
                }}
                className={`w-full bg-[#333] text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-Red transition-all appearance-none ${
                  errors.category ? "border border-Red" : ""
                }`}
              >
                <option value="" disabled>
                  Select a category
                </option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  fill="currentColor"
                  viewBox="0 0 16 16"
                >
                  <path
                    fillRule="evenodd"
                    d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"
                  />
                </svg>
              </div>
            </div>
            {errors.category && (
              <p className="text-Red text-sm mt-1">{errors.category}</p>
            )}
          </div>

          {/* Product Stock/Quantity */}
          <div>
            <label htmlFor="stock" className="block text-white mb-2">
              Stock Quantity
            </label>
            <input
              id="stock"
              type="number"
              min="1"
              value={stock}
              onChange={(e) => {
                setStock(e.target.value);
                setErrors((prev) => ({ ...prev, stock: undefined }));
              }}
              className={`w-full bg-[#333] text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-Red transition-all ${
                errors.stock ? "border border-Red" : ""
              }`}
              placeholder="Enter available quantity"
            />
            {errors.stock && (
              <p className="text-Red text-sm mt-1">{errors.stock}</p>
            )}
          </div>

          {/* Seller Wallet Address */}
          <div>
            <label
              htmlFor="sellerWalletAddress"
              className="block text-white mb-2"
            >
              Wallet Address
            </label>
            <input
              id="sellerWalletAddress"
              type="text"
              value={sellerWalletAddress}
              onChange={(e) => {
                setSellerWalletAddress(e.target.value);
                setErrors((prev) => ({
                  ...prev,
                  sellerWalletAddress: undefined,
                }));
              }}
              className={`w-full bg-[#333] text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-Red transition-all ${
                errors.sellerWalletAddress ? "border border-Red" : ""
              }`}
              placeholder="Enter blockchain wallet address"
            />
            {errors.sellerWalletAddress && (
              <p className="text-Red text-sm mt-1">
                {errors.sellerWalletAddress}
              </p>
            )}
          </div>

          {/* Product Variants/Types */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-white">Product Variants</label>
              <Button
                title="Add Variant"
                type="button"
                className="bg-[#333] hover:bg-[#444] border-0 rounded-md px-3 py-1.5 text-white text-sm"
                onClick={addNewVariant}
                icon={<FiPlus size={14} />}
                iconPosition="start"
              />
            </div>

            {/* Variant guide */}
            {variants.length === 1 && variants[0].properties.length === 0 && (
              <div className="mb-3 bg-[#2A2C31] p-3 rounded-lg border border-[#444] text-sm">
                <p className="text-gray-300">
                  <span className="text-Red font-medium">Tip:</span> Add
                  variants for products with options like:
                </p>
                <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-gray-400">
                  <div>• Size: S, M, L, XL</div>
                  <div>• Color: Red, Blue, Black</div>
                  <div>• Material: Cotton, Silk</div>
                  <div>• Style: Classic, Modern</div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {/* Variant selector tabs - make responsive */}
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {variants.map((variant, idx) => (
                    <button
                      key={variant.id}
                      type="button"
                      className={`px-3 py-1 rounded text-sm transition-colors ${
                        currentVariantProperty.variantIndex === idx
                          ? "bg-Red text-white"
                          : "bg-[#333] text-gray-300 hover:bg-[#444]"
                      }`}
                      onClick={() =>
                        setCurrentVariantProperty({
                          ...currentVariantProperty,
                          variantIndex: idx,
                        })
                      }
                    >
                      Variant {idx + 1}
                      {idx > 0 && (
                        <span
                          className="ml-2 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeVariant(idx);
                          }}
                        >
                          ×
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Property input - make responsive */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={currentVariantProperty.name}
                    onChange={(e) =>
                      setCurrentVariantProperty((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    className="bg-[#333] text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-Red transition-all w-full sm:w-1/3"
                    placeholder="Property (e.g. size, color)"
                  />
                  <input
                    type="text"
                    value={currentVariantProperty.value}
                    onChange={(e) =>
                      setCurrentVariantProperty((prev) => ({
                        ...prev,
                        value: e.target.value,
                      }))
                    }
                    className="bg-[#333] text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-Red transition-all w-full sm:flex-1"
                    placeholder="Value (e.g. XL, red)"
                  />
                  <Button
                    title="Add"
                    type="button"
                    className="bg-[#333] hover:bg-[#444] border-0 rounded-md px-4 py-2 text-white"
                    onClick={addVariantProperty}
                    disabled={
                      !currentVariantProperty.name ||
                      !currentVariantProperty.value
                    }
                    icon={<FiPlus size={16} />}
                  />
                </div>
              </div>

              {/* Display error for empty variants */}
              {errors.variants && (
                <p className="text-Red text-sm">{errors.variants}</p>
              )}
              {/* Display variants */}
              <AnimatePresence>
                {variants.map((variant, variantIndex) => (
                  <motion.div
                    key={variant.id}
                    className={`bg-[#333] rounded-lg p-3 space-y-2 ${
                      currentVariantProperty.variantIndex === variantIndex
                        ? "ring-2 ring-Red"
                        : ""
                    }`}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex justify-between items-center">
                      <h4 className="text-white text-sm font-medium">
                        Variant {variantIndex + 1}
                      </h4>
                    </div>

                    {variant.properties.length > 0 ? (
                      <div className="space-y-2">
                        {variant.properties.map((prop, propIndex) => (
                          <div
                            key={`${variant.id}-${propIndex}`}
                            className="flex items-center justify-between bg-[#242529] rounded px-3 py-2"
                          >
                            <div className="text-white text-sm">
                              <span className="text-gray-400">
                                {prop.name}:
                              </span>{" "}
                              {prop.value}
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                removeProperty(variantIndex, propIndex)
                              }
                              className="text-gray-400 hover:text-Red transition-colors"
                            >
                              <FiX size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-400 text-sm italic">
                        No properties added yet
                      </p>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Price - Dual Currency Input */}
          <div>
            <label className="block text-white mb-2">Price</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* USDT Price */}
              <div className="relative">
                <input
                  id="priceUSDT"
                  type="text"
                  value={priceInUSDT}
                  onChange={(e) => handleUSDTChange(e.target.value)}
                  onFocus={() => setInputFocus("USDT")}
                  onBlur={() => setInputFocus(null)}
                  className={`w-full bg-[#333] text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-Red transition-all ${
                    errors.price ? "border border-Red" : ""
                  } ${inputFocus === "USDT" ? "ring-2 ring-Red" : ""}`}
                  placeholder="0.00"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                  USDT
                </div>
              </div>

              {/* Local Currency Price */}
              <div className="relative">
                <input
                  id="priceFiat"
                  type="text"
                  value={priceInFiat}
                  onChange={(e) => handleFiatChange(e.target.value)}
                  onFocus={() => setInputFocus("FIAT")}
                  onBlur={() => setInputFocus(null)}
                  className={`w-full bg-[#333] text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-Red transition-all ${
                    inputFocus === "FIAT" ? "ring-2 ring-Red" : ""
                  }`}
                  placeholder="0.00"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                  {userCountry}
                </div>
              </div>
            </div>

            {errors.price && (
              <p className="text-Red text-sm mt-1">{errors.price}</p>
            )}
            <p className="text-gray-400 text-xs mt-2">
              Enter the price in either USDT or your local currency. The
              conversion will happen automatically.
            </p>
          </div>

          {/* Logistics Providers */}
          <div>
            <label className="block text-white mb-2">
              Logistics Providers <span className="text-Red">*</span>
            </label>
            <div className="bg-[#333] rounded-lg overflow-hidden">
              <div className="p-3 border-b border-[#444]">
                <input
                  type="text"
                  value={searchLogistics}
                  onChange={(e) => setSearchLogistics(e.target.value)}
                  className="w-full bg-[#222] text-white px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-Red transition-all"
                  placeholder="Search by name or location..."
                />
              </div>

              <div className="max-h-60 overflow-y-auto">
                {filteredLogistics.length > 0 ? (
                  filteredLogistics.map((provider) => (
                    <div
                      key={provider.address}
                      className={`flex items-center justify-between p-3 hover:bg-[#3A3B3F] cursor-pointer ${
                        selectedLogistics.some(
                          (p) => p.address === provider.address
                        )
                          ? "bg-[#3A3B3F]"
                          : ""
                      }`}
                      onClick={() => toggleLogisticsProvider(provider)}
                    >
                      <div className="flex-1 min-w-0 mr-2">
                        <div className="text-white font-medium truncate">
                          {provider.name}
                        </div>
                        <div className="text-gray-400 text-sm truncate">
                          {provider.location}
                        </div>
                      </div>
                      <div className="flex items-center flex-shrink-0">
                        <span className="text-gray-400 text-sm mr-3 whitespace-nowrap">
                          {provider.cost} USDT
                        </span>
                        <div
                          className={`w-5 h-5 rounded border ${
                            selectedLogistics.some(
                              (p) => p.address === provider.address
                            )
                              ? "bg-Red border-Red"
                              : "border-gray-400"
                          } flex items-center justify-center`}
                        >
                          {selectedLogistics.some(
                            (p) => p.address === provider.address
                          ) && (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-3 w-3 text-white"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-3 text-gray-400 text-center">
                    No providers match your search
                  </div>
                )}
              </div>
            </div>

            {/* Selected logistics */}
            {selectedLogistics.length > 0 && (
              <div className="mt-2">
                <div className="text-gray-400 text-sm">
                  Selected providers: {selectedLogistics.length}
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedLogistics.map((provider) => (
                    <div
                      key={provider.address}
                      className="bg-[#3A3B3F] text-white text-sm px-3 py-1 rounded-full flex items-center"
                    >
                      <span className="truncate max-w-[150px]">
                        {provider.name}
                      </span>
                      <button
                        type="button"
                        className="ml-2 text-gray-400 hover:text-Red flex-shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleLogisticsProvider(provider);
                        }}
                      >
                        <FiX size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/*  error for logistics */}
            {errors.logistics && (
              <p className="text-Red text-sm mt-1">{errors.logistics}</p>
            )}
          </div>

          {/* Submit Button */}
          <motion.div
            className="pt-4"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              title={isSubmitting ? "Creating Product..." : "Create Product"}
              className="w-full bg-Red border-0 rounded text-white py-3 transition-colors hover:bg-[#e02d37] flex items-center justify-center items-center gap-2"
              type="submit"
              disabled={isSubmitting || loading}
              iconPosition="start"
              icon={
                isSubmitting ? (
                  <LoadingSpinner size="sm" color="white" />
                ) : (
                  <FiPlus />
                )
              }
            />
          </motion.div>
        </div>
      </motion.form>
    </motion.div>
  );
};

export default CreateProduct;
