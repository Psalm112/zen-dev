// import { useState, useRef, ChangeEvent, FormEvent } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import { FiImage, FiX, FiPlus } from "react-icons/fi";
// import { useNavigate } from "react-router-dom";
// import { useProductData } from "../../../../utils/hooks/useProduct";
// import LoadingSpinner from "../../../common/LoadingSpinner";
// import Button from "../../../common/Button";

// interface FormErrors {
//   name?: string;
//   description?: string;
//   category?: string;
//   price?: string;
//   images?: string;
// }

// const CreateProduct = () => {
//   const navigate = useNavigate();
//   const { createProduct, loading } = useProductData();
//   const fileInputRef = useRef<HTMLInputElement>(null);

//   const [name, setName] = useState("");
//   const [description, setDescription] = useState("");
//   const [category, setCategory] = useState("");
//   const [price, setPrice] = useState("");
//   const [images, setImages] = useState<File[]>([]);
//   const [previews, setPreviews] = useState<string[]>([]);
//   const [errors, setErrors] = useState<FormErrors>({});
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   const categories = [
//     "Electronics",
//     "Clothing",
//     "Home & Garden",
//     "Beauty & Personal Care",
//     "Sports & Outdoors",
//     "Art Work",
//     "Accessories",
//     "Other",
//   ];

//   const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
//     if (!e.target.files) return;

//     const newFiles = Array.from(e.target.files);
//     const newPreviews: string[] = [];

//     const combinedFiles = [...images, ...newFiles].slice(0, 5);

//     combinedFiles.forEach((file) => {
//       const reader = new FileReader();
//       reader.onload = () => {
//         if (reader.result) {
//           newPreviews.push(reader.result.toString());
//           if (newPreviews.length === combinedFiles.length) {
//             setPreviews(newPreviews);
//           }
//         }
//       };
//       reader.readAsDataURL(file);
//     });

//     setImages(combinedFiles);
//     setErrors((prev) => ({ ...prev, images: undefined }));
//   };

//   const removeImage = (index: number) => {
//     setImages(images.filter((_, i) => i !== index));
//     setPreviews(previews.filter((_, i) => i !== index));
//   };

//   const validateForm = () => {
//     const newErrors: FormErrors = {};

//     if (!name.trim()) newErrors.name = "Product name is required";
//     if (!description.trim()) newErrors.description = "Description is required";
//     if (!category) newErrors.category = "Category is required";
//     if (!price.trim()) {
//       newErrors.price = "Price is required";
//     } else if (isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
//       newErrors.price = "Price must be a positive number";
//     }
//     // if (images.length === 0)
//     //   newErrors.images = "At least one image is required";

//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//   const handleSubmit = async (e: FormEvent) => {
//     e.preventDefault();

//     if (!validateForm()) return;

//     setIsSubmitting(true);

//     const formData = new FormData();
//     formData.append("name", name);
//     formData.append("description", description);
//     formData.append("category", category);
//     formData.append("price", price);

//     images.forEach((image) => {
//       formData.append("images", image);
//     });
//     // console.log(formData);
//     try {
//       const result = await createProduct(formData);
//       if (result) {
//         navigate(`/product/${result._id}`);
//       }
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   return (
//     <motion.div
//       className="w-full mx-auto py-4"
//       initial={{ opacity: 0, y: 20 }}
//       animate={{ opacity: 1, y: 0 }}
//       transition={{ duration: 0.5 }}
//     >
//       <motion.form
//         onSubmit={handleSubmit}
//         className="bg-[#292B30] rounded-lg p-4 md:p-8 w-full"
//         initial={{ opacity: 0, y: 20 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ delay: 0.3 }}
//       >
//         <div className="space-y-6">
//           {/* Product Images */}
//           <div>
//             <label className="block text-white mb-2">Product Images</label>
//             <div className="grid grid-cols-3 md:grid-cols-5 gap-4 mb-2">
//               <AnimatePresence>
//                 {previews.map((preview, index) => (
//                   <motion.div
//                     key={index}
//                     className="relative aspect-square rounded-lg overflow-hidden bg-[#333]"
//                     initial={{ opacity: 0, scale: 0.8 }}
//                     animate={{ opacity: 1, scale: 1 }}
//                     exit={{ opacity: 0, scale: 0.8 }}
//                     transition={{ duration: 0.3 }}
//                     whileHover={{ scale: 1.05 }}
//                   >
//                     <img
//                       src={preview}
//                       alt={`Product preview ${index + 1}`}
//                       className="w-full h-full object-cover"
//                     />
//                     <motion.button
//                       type="button"
//                       className="absolute top-2 right-2 bg-Red rounded-full w-6 h-6 flex items-center justify-center text-white"
//                       onClick={() => removeImage(index)}
//                       whileHover={{ scale: 1.1 }}
//                       whileTap={{ scale: 0.9 }}
//                     >
//                       <FiX size={16} />
//                     </motion.button>
//                   </motion.div>
//                 ))}
//               </AnimatePresence>

//               {previews.length < 5 && (
//                 <motion.button
//                   type="button"
//                   className="aspect-square rounded-lg border-2 border-dashed border-gray-600 flex flex-col items-center justify-center text-gray-400 hover:border-Red hover:text-Red transition-colors"
//                   onClick={() => fileInputRef.current?.click()}
//                   whileHover={{ scale: 1.05 }}
//                   whileTap={{ scale: 0.95 }}
//                 >
//                   <FiImage size={24} className="mb-2" />
//                   <span className="text-xs">Add Image</span>
//                   <input
//                     ref={fileInputRef}
//                     type="file"
//                     multiple
//                     accept="image/*"
//                     onChange={handleImageChange}
//                     className="hidden"
//                   />
//                 </motion.button>
//               )}
//             </div>
//             {errors.images && (
//               <p className="text-Red text-sm mt-1">{errors.images}</p>
//             )}
//             <p className="text-gray-400 text-xs mt-1">
//               Upload up to 5 images. First image will be the main product image.
//             </p>
//           </div>

//           {/* Product Name */}
//           <div>
//             <label htmlFor="name" className="block text-white mb-2">
//               Product Name
//             </label>
//             <input
//               id="name"
//               type="text"
//               value={name}
//               onChange={(e) => {
//                 setName(e.target.value);
//                 setErrors((prev) => ({ ...prev, name: undefined }));
//               }}
//               className={`w-full bg-[#333] text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-Red transition-all ${
//                 errors.name ? "border border-Red" : ""
//               }`}
//               placeholder="Enter product name"
//             />
//             {errors.name && (
//               <p className="text-Red text-sm mt-1">{errors.name}</p>
//             )}
//           </div>

//           {/* Description */}
//           <div>
//             <label htmlFor="description" className="block text-white mb-2">
//               Description
//             </label>
//             <textarea
//               id="description"
//               value={description}
//               onChange={(e) => {
//                 setDescription(e.target.value);
//                 setErrors((prev) => ({ ...prev, description: undefined }));
//               }}
//               rows={4}
//               className={`w-full bg-[#333] text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-Red transition-all ${
//                 errors.description ? "border border-Red" : ""
//               }`}
//               placeholder="Describe your product"
//             />
//             {errors.description && (
//               <p className="text-Red text-sm mt-1">{errors.description}</p>
//             )}
//           </div>

//           {/* Category */}
//           <div>
//             <label htmlFor="category" className="block text-white mb-2">
//               Category
//             </label>
//             <div className="relative">
//               <select
//                 id="category"
//                 value={category}
//                 onChange={(e) => {
//                   setCategory(e.target.value);
//                   setErrors((prev) => ({ ...prev, category: undefined }));
//                 }}
//                 className={`w-full bg-[#333] text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-Red transition-all appearance-none ${
//                   errors.category ? "border border-Red" : ""
//                 }`}
//               >
//                 <option value="" disabled>
//                   Select a category
//                 </option>
//                 {categories.map((cat) => (
//                   <option key={cat} value={cat}>
//                     {cat}
//                   </option>
//                 ))}
//               </select>
//               <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
//                 <svg
//                   xmlns="http://www.w3.org/2000/svg"
//                   width="16"
//                   height="16"
//                   fill="currentColor"
//                   viewBox="0 0 16 16"
//                 >
//                   <path
//                     fillRule="evenodd"
//                     d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"
//                   />
//                 </svg>
//               </div>
//             </div>
//             {errors.category && (
//               <p className="text-Red text-sm mt-1">{errors.category}</p>
//             )}
//           </div>

//           {/* Price */}
//           <div>
//             <label htmlFor="price" className="block text-white mb-2">
//               Price (cUSD)
//             </label>
//             <div className="relative">
//               <input
//                 id="price"
//                 type="text"
//                 value={price}
//                 onChange={(e) => {
//                   setPrice(e.target.value);
//                   setErrors((prev) => ({ ...prev, price: undefined }));
//                 }}
//                 className={`w-full bg-[#333] text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-Red transition-all ${
//                   errors.price ? "border border-Red" : ""
//                 }`}
//                 placeholder="0.00"
//               />
//               <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
//                 cUSD
//               </div>
//             </div>
//             {errors.price && (
//               <p className="text-Red text-sm mt-1">{errors.price}</p>
//             )}
//           </div>

//           {/* Submit Button */}
//           <motion.div
//             className="pt-4"
//             whileHover={{ scale: 1.02 }}
//             whileTap={{ scale: 0.98 }}
//           >
//             <Button
//               title={isSubmitting ? "Creating Product..." : "Create Product"}
//               className="w-full bg-Red border-0 rounded text-white py-3 transition-colors hover:bg-[#e02d37] flex items-center justify-center items-center gap-2"
//               type="submit"
//               disabled={isSubmitting || loading}
//               iconPosition="start"
//               icon={
//                 isSubmitting ? (
//                   <LoadingSpinner size="sm" color="white" />
//                 ) : (
//                   <FiPlus />
//                 )
//               }
//             />
//           </motion.div>
//         </div>
//       </motion.form>
//     </motion.div>
//   );
// };

// export default CreateProduct;

import {
  useState,
  useRef,
  ChangeEvent,
  FormEvent,
  useCallback,
  useEffect,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiImage, FiX, FiPlus, FiVideo } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useProductData } from "../../../../utils/hooks/useProduct";
import LoadingSpinner from "../../../common/LoadingSpinner";
import Button from "../../../common/Button";
import { useCurrencyConverter } from "../../../../utils/hooks/useCurrencyConverter";

interface FormErrors {
  name?: string;
  description?: string;
  category?: string;
  price?: string;
  media?: string;
}

interface MediaFile {
  file: File;
  preview: string;
  type: "image" | "video";
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
const MAX_FILES = 5;

const CreateProduct = () => {
  const navigate = useNavigate();
  const { createProduct, loading } = useProductData();
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
    // if (mediaFiles.length === 0)
    //   newErrors.media = "At least one image or video is required";

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
