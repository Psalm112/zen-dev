// src/pages/ViewTradeDetail.tsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Container from "../components/common/Container";
import { TradeOrderDetails, TradeTransactionInfo, TradeStatusType } from "../utils/types";
import TradeStatus from "../components/trade/status/TradeStatus";

const ViewTradeDetail = () => {
  const { tradeId } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [tradeStatus, setTradeStatus] = useState<TradeStatusType>("pending");

  // Mock data for demonstration
  const orderDetails: TradeOrderDetails = {
    productName: "IPHONE 16",
    amount: "1,600,000",
    quantity: 2,
    orderTime: "2025-01-24 10:34:22",
    orderNo: "23435461580011",
    paymentMethod: "CRYPTO",
    tradeType: "SELL"
  };

  const transactionInfo: TradeTransactionInfo = {
    buyerName: "Femi Cole",
    goodRating: 88,
    completedOrders: 456,
    completionRate: 99,
    avgPaymentTime: 20
  };

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setIsLoading(false);
      
      // For demo purposes: toggle between statuses with buttons in UI
      if (location.search.includes('status=')) {
        const status = new URLSearchParams(location.search).get('status') as TradeStatusType;
        if (['cancelled', 'pending', 'release', 'completed'].includes(status)) {
          setTradeStatus(status);
        }
      }
    }, 800);
    
    return () => clearTimeout(timer);
  }, []);

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
    }, 1500);
  };

  if (isLoading) {
    return (
      <div className="bg-Dark min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-white"
        >
          <div className="w-16 h-16 border-4 border-gray-700 border-t-Red rounded-full animate-spin"></div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="bg-Dark min-h-screen py-8 text-white">
      <Container>
        {/* Status selector buttons (for demo purposes) */}
        <div className="mb-8 flex flex-wrap gap-2 justify-center">
          <button 
            className={`px-4 py-2 rounded ${tradeStatus === 'cancelled' ? 'bg-Red' : 'bg-gray-700'}`}
            onClick={() => {
              setTradeStatus('cancelled');
              navigate(`/trades/viewtrade/${tradeId}?status=cancelled`, { replace: true });
            }}
          >
            Show Cancelled
          </button>
          <button 
            className={`px-4 py-2 rounded ${tradeStatus === 'pending' ? 'bg-Red' : 'bg-gray-700'}`}
            onClick={() => {
              setTradeStatus('pending');
              navigate(`/trades/viewtrade/${tradeId}?status=pending`, { replace: true });
            }}
          >
            Show Pending
          </button>
          <button 
            className={`px-4 py-2 rounded ${tradeStatus === 'release' ? 'bg-Red' : 'bg-gray-700'}`}
            onClick={() => {
              setTradeStatus('release');
              navigate(`/trades/viewtrade/${tradeId}?status=release`, { replace: true });
            }}
          >
            Show Release
          </button>
          <button 
            className={`px-4 py-2 rounded ${tradeStatus === 'completed' ? 'bg-Red' : 'bg-gray-700'}`}
            onClick={() => {
              setTradeStatus('completed');
              navigate(`/trades/viewtrade/${tradeId}?status=completed`, { replace: true });
            }}
          >
            Show Completed
          </button>
        </div>
        
        <Tra