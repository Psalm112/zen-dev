// // import React, { useRef, useState } from "react";
// // import { Tabs, Tab } from "react-tabs-scrollable";
// // import "react-tabs-scrollable/dist/rts.css";
// import Container from '../ui/Container'
// import { IoSearch } from 'react-icons/io5'
// import ProductList from '../ui/ProductList'

// const Product =
//     () => {
//         // const [activeTab, setActiveTab] = React.useState(1);
//         // define a onClick function to bind the value on tab click
//         // const onTabClick = (e, index) => {
//         //     console.log(e);
//         //     setActiveTab(index);
//         // };
//         // const [isLeftArrowDisapled, setIsLeftArrowDisabled] = useState(false);
//         // const [isRightArrowDisapled, setIsRightArrowDisabled] = useState(false);

//         // const didReachEnd = (val: any) => setIsRightArrowDisabled(val);
//         // const didReachStart = (val: any) => setIsLeftArrowDisabled(val);
//         // const tabsRef = useRef();
//         return (
//             <div className="bg-Dark">
//                 <Container>
//                     <h2 className='text-white font-bold mb-6'>Browse Products</h2>
//                     <div className="flex justify-center items-center gap-3 bg-[#292B30] outline-none border-0 rounded-none px-4 py-[12px]">
//                         <IoSearch className='text-white text-xl' />
//                         <input type="text" placeholder='Search DezenMart' className='w-full rounded-none bg-[#292B30] outline-none text-white ' />
//                     </div>

//                     <div className="p-2 shadow-sm mt-10">

//                         {/* <div className="row mt-2">
//                         <div className="col-md-6 d-flex">
//                             <button
//                                 className="flex-fill btn rn___btn"
//                                 disabled={isLeftArrowDisapled}
//                                 onClick={() => tabsRef.current.onLeftNavBtnClick()}
//                             >
//                                 click me to move the tabs to left
//                             </button>
//                         </div>
//                         <div className="col-md-6 d-flex">
//                             <button
//                                 className="flex-fill btn rn___btn mt-md-0 mt-2"
//                                 disabled={isRightArrowDisapled}
//                                 onClick={() => tabsRef.current.onRightNavBtnClick()}
//                             >
//                                 click me to move the tabs to right
//                             </button>
//                         </div>
//                     </div> */}
//                     </div>

//                     <ProductList title="Clothing" path="/featured" className="-mt-10" />
//                     <ProductList title="Cosmetics" path="/cosmestics" className="-mt-20" />
//                 </Container>
//             </div>
//         )
//     }

// export default Product

import { useState } from "react";
import Container from "../ui/Container";
import { IoSearch } from "react-icons/io5";
import ProductList from "../ui/ProductList";

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

        {activeCategory === "All" || activeCategory === "Clothing" ? (
          <ProductList
            title="Clothing"
            path="/category/clothing"
            className="mt-8"
          />
        ) : null}

        {activeCategory === "All" || activeCategory === "Cosmetics" ? (
          <ProductList
            title="Cosmetics"
            path="/category/cosmetics"
            className="mt-16"
          />
        ) : null}

        {activeCategory === "All" || activeCategory === "Electronics" ? (
          <ProductList
            title="Electronics"
            path="/category/electronics"
            className="mt-16"
          />
        ) : null}
      </Container>
    </div>
  );
};

export default Product;
