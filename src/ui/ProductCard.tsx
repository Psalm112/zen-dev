// import { FaRegHeart } from 'react-icons/fa'
// import { Product1 } from '../pages'
// import { RiVerifiedBadgeFill } from 'react-icons/ri'
// import { Link } from 'react-router-dom'
// import { BsCart3 } from 'react-icons/bs'

// const ProductCard = () => {
//     return (
//         <Link to="/single-product/1" className='bg-[#292B30] rounded-lg relative flex flex-col justify-center items-center overflow-hidden group'>
//             <div className="mb-10">
//                 <div className='text-white text-sm bg-[#2563eb]  rounded-xl py-1 px-2 absolute top-4 left-4'>New</div>
//                 <Link to="">
//                     <FaRegHeart className='text-2xl text-white absolute top-4 right-4' />
//                 </Link>
//             </div>
//             {/* img  */}
//             <img src={Product1} alt="" className='py-7 w-[70%]' />
//             <div className="flex flex-col">
//                 <h4 className='text-white text-lg font-bold px-6'>Vaseline Lotion</h4>
//                 <h4 className='flex items-center gap-1 text-sm text-[#AEAEB2] py-1 px-6'>By DanBike<RiVerifiedBadgeFill className='text-[#4FA3FF]' /></h4>
//                 <h4 className='text-white text-sm py-0 px-6'>This non-greasy body lotion </h4>
//                 <h4 className='text-[#AEAEB2] text-sm py-3 px-6 group-hover:hidden'>300 items 0.0002 ETH</h4>
//                 <Link to="" className="mt-[5px] lg:px-8 gap-3 lg:gap-7 font-bold text-white bg-Red py-2 hidden group-hover:flex">
//                     <div>Buy Now</div>
//                     <BsCart3 className='font-bolder text-2xl' />
//                     <BsCart3 className='font-bolder text-2xl' />
//                 </Link>
//             </div>
//         </Link>
//     )
// }

// export default ProductCard

import { FaRegHeart } from "react-icons/fa";
import { RiVerifiedBadgeFill } from "react-icons/ri";
import { Link } from "react-router-dom";
import { BsCart3 } from "react-icons/bs";

interface ProductCardProps {
  id: string | number;
  image: string;
  title: string;
  seller: string;
  isVerified?: boolean;
  description: string;
  price: string;
  quantity: number;
  isNew?: boolean;
}

const ProductCard = ({
  id,
  image,
  title,
  seller,
  isVerified = true,
  description,
  price,
  quantity,
  isNew = false,
}: ProductCardProps) => {
  return (
    <Link
      to={`/single-product/${id}`}
      className="bg-[#292B30] rounded-lg relative flex flex-col justify-center items-center overflow-hidden group h-full"
    >
      <div className="mb-10 w-full flex justify-between p-4">
        {isNew && (
          <div className="text-white text-sm bg-[#2563eb] rounded-xl py-1 px-2">
            New
          </div>
        )}
        <button
          className="ml-auto"
          aria-label="Add to favorites"
          onClick={(e) => {
            e.preventDefault();
            // Add wishlist logic here
          }}
        >
          <FaRegHeart className="text-2xl text-white hover:text-Red transition-colors" />
        </button>
      </div>

      <img
        src={image}
        alt={title}
        className="py-4 w-[70%] object-contain"
        loading="lazy"
      />

      <div className="flex flex-col w-full p-6">
        <h4 className="text-white text-lg font-bold truncate">{title}</h4>
        <h4 className="flex items-center gap-1 text-sm text-[#AEAEB2] py-1">
          By {seller}
          {isVerified && <RiVerifiedBadgeFill className="text-[#4FA3FF]" />}
        </h4>
        <h4 className="text-white text-sm py-0 line-clamp-1">{description}</h4>
        <h4 className="text-[#AEAEB2] text-sm py-3 group-hover:hidden">
          {quantity} items {price}
        </h4>
        <button
          className="mt-[5px] gap-3 lg:gap-7 font-bold text-white bg-Red py-2 hidden group-hover:flex justify-center items-center w-full transition-all duration-300"
          onClick={(e) => {
            e.preventDefault();
            // Add to cart logic here
          }}
        >
          <div>Buy Now</div>
          <BsCart3 className="font-bold text-xl" />
        </button>
      </div>
    </Link>
  );
};

export default ProductCard;
