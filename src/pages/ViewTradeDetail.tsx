import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Container from "../components/common/Container";
import {
  TradeOrderDetails,
  TradeTransactionInfo,
  TradeStatusType,
} from "../utils/types";
import TradeStatus from "../components/trade/status/TradeStatus";

const ViewTradeDetail = () => {
  const { tradeId } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [tradeStatus, setTradeStatus] = useState<TradeStatusType>("pending");

  // Mock data
  const orderDetails: TradeOrderDetails = {
    productName: "IPHONE 16",
    amount: "1,600,000",
    quantity: 2,
    orderTime: "2025-01-24 10:34:22",
    orderNo: "23435461580011",
    paymentMethod: "CRYPTO",
    tradeType: "SELL",
  };

  const transactionInfo: TradeTransactionInfo = {
    buyerName: "Femi Cole",
    goodRating: 88,
    completedOrders: 456,
    completionRate: 99,
    avgPaymentTime: 20,
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);

      if (location.search.includes("status=")) {
        const status = new URLSearchParams(location.search).get(
          "status"
        ) as TradeStatusType;
        if (["cancelled", "pending", "release", "completed"].includes(status)) {
          setTradeStatus(status);
        }
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [location.search]);

  const handleContactSeller = () => {
    console.log("Contact seller clicked");
    // Implement contact seller functionality
  };

  const handleOrderDispute = () => {
    console.log("Order dispute clicked");
    // Implement dispute functionality
  };

  const handleReleaseNow = () => {
    console.log("Release now clicked");
    // Implement release functionality
    setTimeout(() => {
      // Simulate completion after release
      setTradeStatus("completed");
      navigate(`/trades/viewtrades/${tradeId}?status=completed`, {
        replace: true,
      });
    }, 1500);
  };

  if (isLoading) {
    return (
      <div className="bg-Dark min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center text-white"
        >
          <div className="w-16 h-16 border-4 border-gray-700 border-t-Red rounded-full animate-spin mb-4"></div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Loading trade details...
          </motion.p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="bg-Dark min-h-screen py-8 text-white">
      <Container>
        {/* Status selector buttons (for demo purposes) */}
        <motion.div
          className="mb-8 flex flex-wrap gap-2 justify-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <button
            className={`px-4 py-2 rounded transition-colors ${
              tradeStatus === "cancelled"
                ? "bg-Red"
                : "bg-gray-700 hover:bg-gray-600"
            }`}
            onClick={() => {
              setTradeStatus("cancelled");
              navigate(`/trades/viewtrades/${tradeId}?status=cancelled`, {
                replace: true,
              });
            }}
          >
            Show Cancelled
          </button>
          <button
            className={`px-4 py-2 rounded transition-colors ${
              tradeStatus === "pending"
                ? "bg-Red"
                : "bg-gray-700 hover:bg-gray-600"
            }`}
            onClick={() => {
              setTradeStatus("pending");
              navigate(`/trades/viewtrades/${tradeId}?status=pending`, {
                replace: true,
              });
            }}
          >
            Show Pending
          </button>
          <button
            className={`px-4 py-2 rounded transition-colors ${
              tradeStatus === "release"
                ? "bg-Red"
                : "bg-gray-700 hover:bg-gray-600"
            }`}
            onClick={() => {
              setTradeStatus("release");
              navigate(`/trades/viewtrades/${tradeId}?status=release`, {
                replace: true,
              });
            }}
          >
            Show Release
          </button>
          <button
            className={`px-4 py-2 rounded transition-colors ${
              tradeStatus === "completed"
                ? "bg-Red"
                : "bg-gray-700 hover:bg-gray-600"
            }`}
            onClick={() => {
              setTradeStatus("completed");
              navigate(`/trades/viewtrades/${tradeId}?status=completed`, {
                replace: true,
              });
            }}
          >
            Show Completed
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <TradeStatus
            status={tradeStatus}
            orderDetails={orderDetails}
            transactionInfo={transactionInfo}
            onContactSeller={handleContactSeller}
            onOrderDispute={handleOrderDispute}
            onReleaseNow={handleReleaseNow}
          />
        </motion.div>
      </Container>
    </div>
  );
};

export default ViewTradeDetail;
