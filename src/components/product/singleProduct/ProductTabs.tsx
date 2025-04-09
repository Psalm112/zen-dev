import { Detail, Comment } from "../../../pages";

interface ProductTabsProps {
  activeTab: "details" | "reviews";
  setActiveTab: (tab: "details" | "reviews") => void;
}

const ProductTabs = ({ activeTab, setActiveTab }: ProductTabsProps) => {
  return (
    <div className="flex items-center justify-between border-b border-gray-700 px-3 sm:px-6 md:px-12 lg:px-20 pt-2 sm:pt-4 overflow-x-auto scrollbar-hide">
      {/* Details Tab */}
      <button
        className={`flex items-center justify-center gap-1 sm:gap-2 text-base sm:text-lg md:text-xl font-bold px-2 sm:px-4 transition-colors ${
          activeTab === "details"
            ? "text-Red"
            : "text-gray-400 hover:text-gray-200"
        }`}
        onClick={() => setActiveTab("details")}
      >
        <span>
          <span className="flex items-center gap-1 sm:gap-2 mb-3 sm:mb-4">
            <img src={Detail} alt="" className="w-4 h-4 sm:w-5 sm:h-5" />
            Details
          </span>
          {activeTab === "details" && (
            <span className="flex items-center justify-center bg-Red text-whitText rounded-full w-full h-1 -mb-[2px]"></span>
          )}
        </span>
      </button>

      {/* Reviews Tab */}
      <button
        className={`flex items-center gap-1 sm:gap-2 text-base sm:text-lg md:text-xl font-bold px-2 sm:px-4 transition-colors ${
          activeTab === "reviews"
            ? "text-Red"
            : "text-gray-400 hover:text-gray-200"
        }`}
        onClick={() => setActiveTab("reviews")}
      >
        <span>
          <span className="flex items-center justify-center gap-1 sm:gap-2 mb-3 sm:mb-4">
            <img src={Comment} alt="" className="w-4 h-4 sm:w-5 sm:h-5" />
            Customer Reviews
          </span>
          {activeTab === "reviews" && (
            <span className="flex items-center justify-center bg-Red text-whitText rounded-full w-full h-1 -mb-[5px]"></span>
          )}
        </span>
      </button>
    </div>
  );
};

export default ProductTabs;
