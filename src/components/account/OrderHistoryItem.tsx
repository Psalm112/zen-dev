import { motion } from "framer-motion";
import { RiVerifiedBadgeFill } from "react-icons/ri";
import Button from "../common/Button";

interface OrderHistoryItemProps {
  productImage: string;
  productName: string;
  vendor: string;
  quantity: number;
  price: string;
  orderDate: string;
  status: "In Escrow" | "Shipped";
  index: number;
}

const OrderHistoryItem: React.FC<OrderHistoryItemProps> = ({
  productImage,
  productName,
  vendor,
  quantity,
  price,
  orderDate,
  status,
  index,
}) => {
  return (
    <motion.div
      className="flex flex-col md:flex-row gap-5 items-start md:items-center justify-between bg-[#292B30] p-4 md:p-8 rounded-lg"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 * index }}
      whileHover={{ scale: 1.01 }}
    >
      <div className="flex flex-col md:flex-row items-start md:items-center md:justify-center gap-4 md:gap-8 w-full md:w-auto">
        <motion.img
          src={productImage}
          alt="Product"
          className="w-full md:w-[35%] max-w-[120px] rounded-md"
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 300 }}
        />
        <div className="text-white">
          <h3 className="font-bold text-xl">{productName}</h3>
          <span className="flex items-center gap-2 text-[12px] text-[#AEAEB2]">
            By {vendor}{" "}
            <RiVerifiedBadgeFill className="text-[#4FA3FF] text-xs" />
          </span>
          <h6 className="text-[#AEAEB2] text-[12px]">
            {quantity} items Bought @{price} ETH
          </h6>
        </div>
      </div>
      <div className="flex flex-col text-white mt-4 md:mt-0">
        <span className="text-[12px]">Ordered: &nbsp; {orderDate}</span>
        <span className="text-[12px] my-2">
          Status:&nbsp;
          <span
            className={`p-1 rounded-md ${
              status === "In Escrow" ? "bg-[#62FF0033]" : "bg-[#543A2E]"
            }`}
          >
            {status}
          </span>
        </span>
      </div>
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Button
          title="View Details"
          className="bg-Red border-0 rounded text-white px-8 md:px-14 py-2 mt-4 md:mt-0 w-full md:w-auto transition-colors hover:bg-[#e02d37]"
          path=""
        />
      </motion.div>
    </motion.div>
  );
};

export default OrderHistoryItem;
