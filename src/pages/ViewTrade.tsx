import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Container from "../components/common/Container";
import Title from "../components/common/Title";
import { TradeTab } from "../utils/types";
import ProductListingSkeleton from "../components/trade/ProductListingSkeleton";
import ActiveTradeCard from "../components/trade/view/ActiveTradeCard";
import CompletedTradeCard from "../components/trade/view/CompletedTradeCard";
import ConnectWallet from "../components/trade/ConnectWallet";
import Tab from "../components/trade/Tab";
import EmptyState from "../components/trade/view/EmptyState";
import { useNavigate } from "react-router-dom";
import { useWallet } from "../context/WalletContext";
import { useOrderData } from "../utils/hooks/useOrder";

const ViewTrade = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TradeTab>("active");
  const [isLoading, setIsLoading] = useState(true);
  const { isConnected } = useWallet();
  const {
    activeTrades,
    completedTrades,
    fetchBuyerOrders,
    fetchMerchantOrders,
    loading: orderLoading,
  } = useOrderData();

  // Fetch orders when component mounts and wallet is connected
  useEffect(() => {
    let isMounted = true;

    const loadOrders = async () => {
      if (!isConnected) return;

      setIsLoading(true);
      try {
        // Fetch both buyer and seller orders
        await Promise.all([
          fetchBuyerOrders(false, true),
          fetchMerchantOrders(false, true),
        ]);
      } catch (error) {
        console.error("Failed to load orders:", error);
      } finally {
        if (isMounted) {
          // Add a minimum loading time for smooth UX
          setTimeout(() => {
            setIsLoading(false);
          }, 600);
        }
      }
    };

    loadOrders();

    return () => {
      isMounted = false;
    };
  }, [isConnected, fetchBuyerOrders, fetchMerchantOrders]);

  // Update loading state when order loading changes
  useEffect(() => {
    if (!orderLoading && isConnected) {
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [orderLoading, isConnected]);

  // const handleTradeClick = (tradeId: string, status: string) => {
  //   navigate(`/trades/viewtrades/${tradeId}?status=${status}`);
  // };
  const handleTradeClick = (tradeId: string) => {
    navigate(`/orders/${tradeId}`);
  };

  if (!isConnected) {
    return (
      <div className="bg-Dark min-h-screen text-white">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <Title text="Trade" className="text-center my-8 text-3xl" />
          </motion.div>
          <ConnectWallet showAlternatives={true} />
        </Container>
      </div>
    );
  }

  return (
    <div className="bg-Dark min-h-screen text-white relative">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <Title text="Trade" className="text-center my-8 text-3xl" />
        </motion.div>

        {/* Tab Navigation */}
        <div className="max-w-screen-lg mx-auto bg-[#212428] rounded-lg overflow-hidden">
          <div className="flex max-xxs:flex-wrap border-b border-[#292B30] bg-[#292B30] w-full items-center">
            <Tab
              text="Active Trades"
              isActive={activeTab === "active"}
              onClick={() => setActiveTab("active")}
              count={activeTrades?.length || 0}
              className="w-full"
            />
            <Tab
              text="Completed"
              isActive={activeTab === "completed"}
              onClick={() => setActiveTab("completed")}
              count={completedTrades?.length || 0}
              className="w-full"
            />
          </div>

          {/* Content Area */}
          <div className="py-4">
            <AnimatePresence mode="wait">
              {isLoading ? (
                <ProductListingSkeleton key="loading" />
              ) : (
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  {activeTab === "active" && (
                    <>
                      {activeTrades && activeTrades.length > 0 ? (
                        activeTrades
                          .filter((trade) => trade && trade.product) // Add this filter
                          .map((trade) => (
                            <div
                              key={trade._id}
                              onClick={() => handleTradeClick(trade._id)}
                              className="cursor-pointer"
                            >
                              <ActiveTradeCard trade={trade} />
                            </div>
                          ))
                      ) : (
                        <EmptyState
                          title="No Active Trades"
                          message="Once you start a trade, you'll see it here."
                        />
                      )}
                    </>
                  )}

                  {activeTab === "completed" && (
                    <>
                      {completedTrades && completedTrades.length > 0 ? (
                        completedTrades
                          .filter((trade) => trade && trade.product) // Add this filter
                          .map((trade) => (
                            <div
                              key={trade._id}
                              onClick={() => handleTradeClick(trade._id)}
                              className="cursor-pointer"
                            >
                              <CompletedTradeCard trade={trade} />
                            </div>
                          ))
                      ) : (
                        <EmptyState
                          title="No Completed Trades"
                          message="Your completed trades will appear here."
                        />
                      )}
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default ViewTrade;
