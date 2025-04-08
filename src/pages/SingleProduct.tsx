import { LiaAngleLeftSolid } from "react-icons/lia";
import Container from "../ui/Container";
import { FaRegCommentDots, FaRegHeart } from "react-icons/fa";
import { Comment, Detail, Product1 } from ".";
import { useState } from "react";
import { IoIosArrowDown, IoIosArrowUp } from "react-icons/io";
import { MdOutlineStar } from "react-icons/md";
import { BiSolidQuoteRight } from "react-icons/bi";
import { Link, useParams, useNavigate } from "react-router-dom";

type TabType = "details" | "reviews";
type SectionType = "About this product" | "Properties" | "Description" | null;

const SingleProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>("details");
  const [openSection, setOpenSection] = useState<SectionType>(null);

  const toggleSection = (section: SectionType) => {
    setOpenSection(openSection === section ? null : section);
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="bg-Dark min-h-screen">
      <div className="bg-gradient-to-b from-[#855d43] via-[#352f2d]/4 to-[#352f2d]/2 py-8">
        <Container className="relative flex flex-col items-center">
          <div className="flex items-center justify-between w-full absolute top-4">
            <button
              onClick={handleGoBack}
              aria-label="Go back"
              className="hover:opacity-80 transition-opacity"
            >
              <LiaAngleLeftSolid className="text-2xl text-white" />
            </button>
            <button
              aria-label="Add to favorites"
              className="hover:opacity-80 transition-opacity"
            >
              <FaRegHeart className="text-2xl text-white" />
            </button>
          </div>
          <img
            src={Product1}
            className="w-[60%] md:w-[40%] lg:w-[25%] object-contain"
            alt="Product"
          />
        </Container>
      </div>

      <div>
        <Container className="">
          <div className="bg-[#292B30] shadow-xl text-white w-full max-w-4xl mx-auto rounded-t-lg">
            {/* Tabs */}
            <div className="flex items-center justify-between border-b border-gray-700 px-4 md:px-20 pt-4 overflow-x-auto scrollbar-hide">
              <button
                className={`flex items-center justify-center gap-2 text-lg md:text-xl font-bold px-4 ${
                  activeTab === "details" ? "text-Red" : "text-gray-400"
                }`}
                onClick={() => setActiveTab("details")}
              >
                <span>
                  <span className="flex items-center gap-2 mb-4">
                    <img src={Detail} alt="" className="w-5 h-5" />
                    Details
                  </span>
                  {activeTab === "details" && (
                    <span className="flex items-center justify-center bg-Red text-whitText rounded-full w-full h-1 -mb-[2px]"></span>
                  )}
                </span>
              </button>
              <button
                className={`flex items-center gap-2 text-lg md:text-xl font-bold px-4 ${
                  activeTab === "reviews" ? "text-Red" : "text-gray-400"
                }`}
                onClick={() => setActiveTab("reviews")}
              >
                <span>
                  <span className="flex items-center justify-center gap-2 mb-4">
                    <img src={Comment} alt="" className="w-5 h-5" />
                    Customer Reviews
                  </span>
                  {activeTab === "reviews" && (
                    <span className="flex items-center justify-center bg-Red text-whitText rounded-full w-full h-1 -mb-[5px]"></span>
                  )}
                </span>
              </button>
            </div>

            {/* Content */}
            {activeTab === "details" && (
              <div className="space-y-2">
                {(
                  ["About this product", "Properties", "Description"] as const
                ).map((section) => (
                  <div key={section} className="rounded-lg">
                    <button
                      className="bg-[#292B30] flex justify-between w-full text-left text-lg border-b-[0.1px] border-gray-700 px-4 md:px-20 py-2"
                      onClick={() => toggleSection(section)}
                    >
                      <span className="py-4 flex items-center justify-between w-full">
                        {section}
                        <span className="text-gray-400">
                          {openSection === section ? (
                            <IoIosArrowUp />
                          ) : (
                            <IoIosArrowDown />
                          )}
                        </span>
                      </span>
                    </button>
                    {openSection === section && (
                      <div className="mt-2 text-gray-400 text-sm bg-[#212428] px-4 md:px-20 pt-6 md:pt-10 pb-8 md:pb-16 animate-fadeIn">
                        <p>
                          This is the content for {section}. You can add more
                          details here. Lorem ipsum dolor sit amet, consectetur
                          adipiscing elit. Sed euismod, nunc sit amet aliquam
                          tincidunt, nisl nisl aliquam nisl, eget aliquam nisl
                          nisl sit amet nisl.
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeTab === "reviews" && (
              <div className="text-gray-400 px-4 md:px-20 py-5">
                <div className="bg-[#212428] p-4 md:p-6 rounded-lg">
                  <BiSolidQuoteRight className="text-white text-xl mb-3" />
                  <p className="text-sm md:text-base">
                    "I can't thank this app enough for saving me during busy
                    days. The variety of restaurants is outstanding, and the
                    discounts are a nice bonus. The app is user-friendly, and
                    the delivery is consistently punctual. They even throw in
                    some exclusive deals now and then. It's my food delivery
                    superhero!"
                  </p>
                  <div className="flex items-center justify-between my-4 flex-wrap gap-2">
                    <div>
                      // src/pages/SingleProduct.tsx (continued)
                      <h6 className="font-medium text-white">Bessie Cooper</h6>
                      <span className="text-xs text-[#6D6D6D]">
                        Order Jan 24, 2024
                      </span>
                    </div>
                    <div className="flex items-center bg-[#2f3137] shadow-xl px-2 py-1 rounded-md">
                      <MdOutlineStar className="text-Red mr-1" />
                      <span className="text-white">5.0</span>
                    </div>
                  </div>
                </div>

                {/* Add more reviews here */}
                <div className="mt-4 text-center">
                  <button className="text-Red hover:underline">
                    View more reviews
                  </button>
                </div>
              </div>
            )}

            {/* Product Actions */}
            <div className="bg-[#212428] p-4 md:p-6 flex flex-col md:flex-row justify-between items-center gap-4">
              <div>
                <h2 className="text-white text-xl font-bold">0.0002 ETH</h2>
                <p className="text-[#AEAEB2] text-sm">300 items available</p>
              </div>
              <div className="flex gap-3 w-full md:w-auto">
                <button className="bg-Red text-white py-3 px-6 md:px-10 font-bold flex-1 md:flex-none">
                  Buy Now
                </button>
                <button className="border border-Red text-Red py-3 px-6 flex-1 md:flex-none">
                  Add to Cart
                </button>
              </div>
            </div>
          </div>
        </Container>
      </div>
    </div>
  );
};

export default SingleProduct;
