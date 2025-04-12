import { motion } from "framer-motion";
import { RiVerifiedBadgeFill } from "react-icons/ri";
import Button from "../common/Button";

interface DisputeItemProps {
  productImage: string;
  productName: string;
  vendor: string;
  disputeDate: string;
  disputeStatus: string;
}

const DisputeItem: React.FC<DisputeItemProps> = ({
  productImage,
  productName,
  vendor,
  disputeDate,
  disputeStatus,
}) => {
  return (
    <motion.div
      className="flex items-center gap-8 md:gap-16 p-6 md:px-[10%] lg:px-[20%] md:py-10 bg-[#292B30] mt-8 flex-col md:flex-row rounded-lg"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ scale: 1.01 }}
    >
      <motion.img
        src={productImage}
        className="w-[80%] md:w-[40%] h-auto rounded-md"
        alt="Product"
        whileHover={{ scale: 1.05 }}
        transition={{ type: "spring", stiffness: 300 }}
      />
      <div className="flex flex-col w-full md:w-auto">
        <h3 className="font-bold text-2xl text-white">{productName}</h3>
        <span className="flex items-center gap-2 text-[12px] text-[#AEAEB2] mb-6">
          By {vendor} <RiVerifiedBadgeFill className="text-[#4FA3FF] text-xs" />
        </span>
        <div className="flex justify-between mb-4">
          <h6 className="text-xs text-white">Dispute Raised:</h6>
          <h6 className="text-xs text-white">{disputeDate}</h6>
        </div>
        <div className="flex items-center justify-between mb-4">
          <h6 className="text-xs text-white">Dispute Status:</h6>
          <span className="text-xs text-white p-1 rounded-md bg-[#543A2E]">
            {disputeStatus}
          </span>
        </div>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            title="View Dispute"
            className="bg-Red border-0 rounded text-white px-8 md:px-24 py-[8px] mt-4 w-full transition-colors hover:bg-[#e02d37]"
            path=""
          />
        </motion.div>
      </div>
    </motion.div>
  );
};

export default DisputeItem;
