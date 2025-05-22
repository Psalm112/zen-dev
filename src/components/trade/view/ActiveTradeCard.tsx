import { useState, FC, useMemo } from "react";
import { motion } from "framer-motion";
import Button from "../../common/Button";
import TradeCardBase from "./TradeCardBase";
import TradeDetailRow from "./TradeDetailRow";
import { FaCopy } from "react-icons/fa";
import { LuMessageSquare } from "react-icons/lu";
import { Order } from "../../../utils/types";
import { useCurrency } from "../../../context/CurrencyContext";

interface ActiveTradeCardProps {
  trade: Order & {
    formattedUsdtAmount: string;
    formattedCeloAmount: string;
    formattedFiatAmount: string;
    formattedDate: string;
  };
}

const ActiveTradeCard: FC<ActiveTradeCardProps> = ({ trade }) => {
  const [copied, setCopied] = useState(false);
  const { secondaryCurrency } = useCurrency();

  const secondaryPrice = useMemo(() => {
    switch (secondaryCurrency) {
      case "USDT":
        return trade.formattedUsdtAmount;
      default:
        return trade.formattedFiatAmount;
    }
  }, [secondaryCurrency, trade]);

  const copyOrderId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  // const getSellerInfo = () => {
  //   if (typeof trade?.seller === "object" && trade.seller) {
  //     return trade.seller.name;
  //   }
  //   return "Unknown Seller";
  // };

  const getTradeType = () => {
    // trade?.type ||
    return "BUY";
  };

  // const getFormattedAmount = () => {
  //   return trade?.formattedUsdtAmount || trade?.amount?.toFixed(2) || "0.00";
  // };

  // const getFormattedDate = () => {
  //   return trade?.formattedDate || new Date(trade?.createdAt).toLocaleString();
  // };

  const getStatusColor = () => {
    switch (trade?.status) {
      case "pending":
        return "bg-yellow-500";
      case "accepted":
        return "bg-blue-500";
      case "disputed":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <TradeCardBase className="mt-8 px-6 md:px-12 py-2">
      <div className="py-4 flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="w-fit flex flex-col gap-2">
          <div className="w-full flex gap-4">
            <motion.h3
              className="font-medium text-xl text-white"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              {trade.product.name.toUpperCase()}
            </motion.h3>
            <motion.span
              className={`bg-Red text-white text-xs px-3 py-1 rounded-full`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {getTradeType()}
            </motion.span>
          </div>
          <span className="text-gray-400 text-sm">{trade.formattedDate}</span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Button
            title="Contact Seller"
            className="bg-transparent hover:bg-gray-700 text-white text-sm px-4 py-2 border border-Red rounded-2xl transition-colors flex items-center gap-x-2 justify-center"
            path={`/chat/${
              typeof trade?.seller === "object" && trade.seller
                ? trade.seller._id
                : trade?.seller
            }`}
            icon={<LuMessageSquare className="w-5 h-5 text-Red" />}
            iconPosition="start"
          />
        </motion.div>
      </div>

      <div className="border-t border-gray-700 py-10">
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">Amount</span>
            <span className="flex flex-col gap-2 text-right">
              <span className="text-red-500 text-xl font-bold">
                {/* {getFormattedAmount()} */}

                {trade.formattedCeloAmount}
              </span>
              <span className="text-gray-400 text-sm">{secondaryPrice}</span>
            </span>
          </div>

          <div className="space-y-2">
            <TradeDetailRow
              label="Total Quantity"
              value={trade?.quantity?.toString() || "1"}
            />
            <TradeDetailRow label="Order Time" value={trade.formattedDate} />
            <TradeDetailRow
              label="Status"
              value={
                <span className="capitalize text-red-400">
                  {trade?.status || "pending"}
                </span>
              }
            />
            <TradeDetailRow
              label="Order No."
              value={
                <div className="flex items-center">
                  <span className="mr-2">
                    {trade?._id?.slice(-12) || "N/A"}
                  </span>
                  <motion.button
                    onClick={() => copyOrderId(trade?._id || "")}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <FaCopy className="text-gray-400 hover:text-white transition-colors" />
                  </motion.button>
                </div>
              }
              bottomNote={
                copied && (
                  <motion.p
                    className="text-green-400 text-center mt-2 text-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    Code copied to clipboard!
                  </motion.p>
                )
              }
            />
          </div>
        </motion.div>
      </div>
    </TradeCardBase>
  );
};

export default ActiveTradeCard;
