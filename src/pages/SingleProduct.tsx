import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { LiaAngleLeftSolid } from "react-icons/lia";
import { FaRegHeart } from "react-icons/fa";
import Container from "../components/common/Container";
import ProductImage from "../components/product/singleProduct/ProductImage";
import ProductTabs from "../components/product/singleProduct/ProductTabs";
import ProductDetails from "../components/product/singleProduct/ProductDetails";
import CustomerReviews from "../components/product/singleProduct/CustomerReviews";
import PurchaseSection from "../components/product/singleProduct/PurchaseSection";

type TabType = "details" | "reviews";

const SingleProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>("details");
  const [isFavorite, setIsFavorite] = useState(false);

  const handleGoBack = () => navigate(-1);
  const toggleFavorite = () => setIsFavorite(!isFavorite);

  return (
    <div className="bg-Dark min-h-screen pb-8 sm:pb-16">
      {/* Product Image Section with Gradient Background */}
      <div className="bg-gradient-to-b from-[#855d43] via-[#352f2d]/4 to-[#352f2d]/2 py-4 sm:py-8">
        <Container className="relative flex flex-col items-center">
          {/* Navigation Controls */}
          <div className="flex items-center justify-between w-full absolute top-0 sm:top-4 px-2 sm:px-0">
            <button
              onClick={handleGoBack}
              aria-label="Go back"
              className="hover:opacity-80 transition-opacity p-2"
            >
              <LiaAngleLeftSolid className="text-xl sm:text-2xl text-white" />
            </button>
            <button
              onClick={toggleFavorite}
              aria-label={
                isFavorite ? "Remove from favorites" : "Add to favorites"
              }
              className="hover:opacity-80 transition-opacity p-2"
            >
              <FaRegHeart
                className={`text-xl sm:text-2xl ${
                  isFavorite ? "text-Red" : "text-white"
                }`}
              />
            </button>
          </div>

          {/* Product Image */}
          <ProductImage productId={id} />
        </Container>
      </div>

      {/* Product Info and Tabs Section */}
      <Container className="px-2 sm:px-4">
        <div className="bg-[#292B30] shadow-xl text-white w-full max-w-4xl mx-auto rounded-t-lg overflow-hidden">
          <ProductTabs activeTab={activeTab} setActiveTab={setActiveTab} />

          {activeTab === "details" ? <ProductDetails /> : <CustomerReviews />}

          <PurchaseSection />
        </div>
      </Container>
    </div>
  );
};

export default SingleProduct;
