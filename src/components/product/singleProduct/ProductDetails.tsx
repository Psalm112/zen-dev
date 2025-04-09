import { useState } from "react";
import { IoIosArrowDown, IoIosArrowUp } from "react-icons/io";
import ProductAbout from "./ProductAbout";
import ProductProperties from "./ProductProperties";
import ProductDescription from "./ProductDescription";

type SectionType = "About this product" | "Properties" | "Description" | null;

const ProductDetails = () => {
  const [openSection, setOpenSection] = useState<SectionType>(null);

  const toggleSection = (section: SectionType) => {
    setOpenSection(openSection === section ? null : section);
  };

  return (
    <div className="space-y-px">
      {/* About This Product Section */}
      <div className="rounded-lg">
        <button
          className="bg-[#292B30] flex justify-between w-full text-left text-base sm:text-lg border-b-[0.1px] border-gray-700 px-3 sm:px-6 md:px-12 lg:px-20 py-2"
          onClick={() => toggleSection("About this product")}
        >
          <span className="py-3 sm:py-4 flex items-center justify-between w-full">
            About this product
            <span className="text-gray-400">
              {openSection === "About this product" ? (
                <IoIosArrowUp />
              ) : (
                <IoIosArrowDown />
              )}
            </span>
          </span>
        </button>
        {openSection === "About this product" && (
          <div className="mt-px text-gray-400 text-sm bg-[#212428] px-3 sm:px-6 md:px-12 lg:px-20 pt-4 sm:pt-6 md:pt-8 pb-4 sm:pb-6 md:pb-10 animate-fadeIn">
            <ProductAbout />
          </div>
        )}
      </div>

      {/* Properties Section */}
      <div className="rounded-lg">
        <button
          className="bg-[#292B30] flex justify-between w-full text-left text-base sm:text-lg border-b-[0.1px] border-gray-700 px-3 sm:px-6 md:px-12 lg:px-20 py-2"
          onClick={() => toggleSection("Properties")}
        >
          <span className="py-3 sm:py-4 flex items-center justify-between w-full">
            Properties
            <span className="text-gray-400">
              {openSection === "Properties" ? (
                <IoIosArrowUp />
              ) : (
                <IoIosArrowDown />
              )}
            </span>
          </span>
        </button>
        {openSection === "Properties" && (
          <div className="mt-px text-gray-400 text-sm bg-[#212428] px-3 sm:px-6 md:px-12 lg:px-20 pt-4 sm:pt-6 md:pt-8 pb-4 sm:pb-6 md:pb-10 animate-fadeIn">
            <ProductProperties />
          </div>
        )}
      </div>

      {/* Description Section */}
      <div className="rounded-lg">
        <button
          className="bg-[#292B30] flex justify-between w-full text-left text-base sm:text-lg border-b-[0.1px] border-gray-700 px-3 sm:px-6 md:px-12 lg:px-20 py-2"
          onClick={() => toggleSection("Description")}
        >
          <span className="py-3 sm:py-4 flex items-center justify-between w-full">
            Description
            <span className="text-gray-400">
              {openSection === "Description" ? (
                <IoIosArrowUp />
              ) : (
                <IoIosArrowDown />
              )}
            </span>
          </span>
        </button>
        {openSection === "Description" && (
          <div className="mt-px text-gray-400 text-sm bg-[#212428] px-3 sm:px-6 md:px-12 lg:px-20 pt-4 sm:pt-6 md:pt-8 pb-4 sm:pb-6 md:pb-10 animate-fadeIn">
            <ProductDescription />
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetails;
