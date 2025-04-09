import { useState } from "react";
import Container from "../components/common/Container";
import { IoSearch } from "react-icons/io5";
import ProductList from "../components/product/ProductList";

// categories
const categories = [
  "All",
  "Clothing",
  "Cosmetics",
  "Electronics",
  "Home",
  "Accessories",
];

const Product = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  return (
    <div className="bg-Dark min-h-screen">
      <Container>
        <h2 className="text-white font-bold text-2xl mb-6">Browse Products</h2>
        {/* Search Bar */}
        <div className="flex justify-center items-center gap-3 bg-[#292B30] outline-none border-0 rounded-lg px-4 py-3">
          <IoSearch className="text-white text-xl" />
          <input
            type="text"
            placeholder="Search DezenMart"
            className="w-full rounded-none bg-[#292B30] outline-none text-white"
            value={searchQuery}
            onChange={handleSearch}
          />
        </div>
        {/* Categories */}
        <div className="mt-8 overflow-x-auto scrollbar-hide">
          <div className="flex space-x-4 py-2 min-w-max">
            {categories.map((category) => (
              <button
                key={category}
                className={`px-4 py-2 rounded-full transition-colors whitespace-nowrap ${
                  activeCategory === category
                    ? "bg-Red text-white"
                    : "bg-[#292B30] text-[#AEAEB2] hover:bg-[#343539]"
                }`}
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Content based on selected category */}
        {activeCategory === "All" ? (
          <>
            <ProductList
              title="Clothing"
              path="/category/clothing"
              className="mt-8"
              isCategoryView={false}
            />
            <ProductList
              title="Cosmetics"
              path="/category/cosmetics"
              className="mt-16"
              isCategoryView={false}
            />
            <ProductList
              title="Electronics"
              path="/category/electronics"
              className="mt-16"
              isCategoryView={false}
            />
          </>
        ) : (
          /* Category View Component */
          <>
            <h2 className="text-white font-bold text-xl mt-8 px-4 md:px-0">
              {activeCategory}
            </h2>
            {/* <CategoryView category={activeCategory} /> */}
            <ProductList
              title={activeCategory}
              path={`/category/${activeCategory}`}
              className="mt-8"
              isCategoryView={true}
            />
          </>
        )}
      </Container>
    </div>
  );
};

export default Product;
