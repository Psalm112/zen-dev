import { useState, useEffect, FC, Suspense, lazy } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaExchangeAlt } from "react-icons/fa";
import Container from "../components/common/Container";
import Title from "../components/common/Title";
import BannerCarousel from "../components/common/BannerCarousel";
// import FloatingActionButton from "../components/common/FloatingActionButton";
import { Pen, Pen2 } from ".";
// import { useWallet } from "../utils/hooks/useWallet";
import { Product, TradeTab } from "../utils/types";
import ProductListingSkeleton from "../components/trade/ProductListingSkeleton";
// import IncomingOrderCard from "../components/trade/IncomingOrderCard";
// import OrderSummaryModal from "../components/trade/OrderSummary";
// import ProductCard from "../components/trade/ProductCard";
import ConnectWallet from "../components/trade/ConnectWallet";
import Tab from "../components/trade/Tab";
import LazyFloatingButton from "../components/common/LazyFloatingButton";
import { useWallet } from "../context/WalletContext";
const ProductCard = lazy(() => import("../components/trade/ProductCard"));
const IncomingOrderCard = lazy(
  () => import("../components/trade/IncomingOrderCard")
);

const ButtonPlaceholder: FC = () => (
  <motion.div
    className="fixed bottom-20 right-4 z-50 w-12 h-12 rounded-full bg-[#292B30]"
    animate={{ opacity: [0.5, 1, 0.5] }}
    transition={{ repeat: Infinity, duration: 1.5 }}
  />
);

const Trade = () => {
  const [activeTab, setActiveTab] = useState<TradeTab>("buy");
  const [isLoading, setIsLoading] = useState(true);
  const [isComponentMounted, setIsComponentMounted] = useState(false);
  const { isConnected } = useWallet();

  // Sample data for products
  const products: Product[] = [
    {
      _id: "68082c3efae576e05502c04b",
      name: "Test Product",
      description: "Testing product endpoint",
      price: 20000,
      category: "Item",
      seller: "680821b06eda53ead327e0ea",
      images: [],
      isSponsored: false,
      isActive: true,
      createdAt: "2025-04-22T23:54:38.445Z",
      updatedAt: "2025-04-22T23:54:38.445Z",
      type: [],
      stock: 100,
    },
    {
      _id: "68082f7a7d3f057ab0fafd5c",
      name: "Wood Carving",
      description: "Neat carved wood art works",
      price: 20000,
      category: "Art Work",
      seller: "680821b06eda53ead327e0ea",
      images: [
        "images-1745366906480-810449189.jpeg",
        "images-1745366906494-585992412.jpeg",
      ],
      isSponsored: false,
      isActive: true,
      createdAt: "2025-04-23T00:08:26.519Z",
      updatedAt: "2025-04-23T00:08:26.519Z",
      type: [],
      stock: 100,
    },
  ];

  // Sample data for incoming orders (sell)
  const incomingOrders: Product[] = [
    {
      _id: "68082f7a7d3f057ab0fafd5c",
      name: "Wood Carving",
      description: "Neat carved wood art works",
      price: 20000,
      category: "Art Work",
      seller: "680821b06eda53ead327e0ea",
      images: [
        "images-1745366906480-810449189.jpeg",
        "images-1745366906494-585992412.jpeg",
      ],
      isSponsored: false,
      isActive: true,
      createdAt: "2025-04-23T00:08:26.519Z",
      updatedAt: "2025-04-23T00:08:26.519Z",
      type: [],
      stock: 100,
    },
  ];

  // Banner data for the carousel
  const banners = [
    {
      title: "Smart Ecommerce for",
      subtitle: "creators",
      primaryImage: Pen,
      secondaryImage: Pen2,
      backgroundColor: "#ff3b3b",
      textColor: "white",
      isUppercase: true,
    },
    {
      title: "Special Offers for",
      subtitle: "new users",
      primaryImage: Pen,
      backgroundColor: "#ff3b3b",
      textColor: "white",
      isUppercase: true,
    },
    {
      title: "Smart Ecommerce for",
      subtitle: "creators",
      primaryImage: Pen,
      secondaryImage: Pen2,
      backgroundColor: "#ff3b3b",
      textColor: "white",
      isUppercase: true,
    },
    {
      title: "Special Offers for",
      subtitle: "new users",
      primaryImage: Pen,
      backgroundColor: "#ff3b3b",
      textColor: "white",
      isUppercase: true,
    },
    {
      title: "Smart Ecommerce for",
      subtitle: "creators",
      primaryImage: Pen,
      secondaryImage: Pen2,
      backgroundColor: "#ff3b3b",
      textColor: "white",
      isUppercase: true,
    },
    {
      title: "Special Offers for",
      subtitle: "new users",
      primaryImage: Pen,
      backgroundColor: "#ff3b3b",
      textColor: "white",
      isUppercase: true,
    },
    {
      title: "Smart Ecommerce for",
      subtitle: "creators",
      primaryImage: Pen,
      secondaryImage: Pen2,
      backgroundColor: "#ff3b3b",
      textColor: "white",
      isUppercase: true,
    },
    {
      title: "Special Offers for",
      subtitle: "new users",
      primaryImage: Pen,
      backgroundColor: "#ff3b3b",
      textColor: "white",
      isUppercase: true,
    },
  ];

  useEffect(() => {
    setIsComponentMounted(true);

    const loadTimer = setTimeout(() => {
      requestAnimationFrame(() => {
        setIsLoading(false);
      });
    }, 600);

    return () => {
      clearTimeout(loadTimer);
      setIsComponentMounted(false);
    };
  }, []);

  // Handle order rejection (for sellers)
  const handleRejectOrder = (product: Product) => {
    console.log("Order rejected:", product);
  };

  // Close order summary modal
  // const handleCloseOrderSummary = () => {
  //   setShowOrderSummary(false);
  //   setSelectedProduct(null);
  // };

  // Confirm order purchase
  // const handleConfirmPurchase = () => {
  //   console.log("Purchase confirmed for:", selectedProduct);
  //   setShowOrderSummary(false);
  //   setActiveTab("active");
  // };

  if (!isConnected) {
    return (
      <div className="bg-Dark min-h-screen text-white">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <Title text="P2P Trading" className="text-center my-8 text-3xl" />
          </motion.div>
          <ConnectWallet
          // showAlternatives={true}
          />
        </Container>
      </div>
    );
  }
  return (
    <div className="bg-Dark min-h-screen text-white relative">
      <Container className="relative pb-20 md:pb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <Title text="P2P Trading" className="text-center my-8 text-3xl" />
        </motion.div>

        <BannerCarousel
          banners={banners}
          autoRotate={true}
          className="mb-8"
          rotationInterval={6000}
        />

        <div className="max-w-screen-lg mx-auto bg-[#212428] rounded-lg overflow-hidden">
          <div className="flex flex-wrap border-b border-[#292B30]">
            <Tab
              text="Buy"
              isActive={activeTab === "buy"}
              onClick={() => setActiveTab("buy")}
              count={products.length}
            />
            <Tab
              text="Sell"
              isActive={activeTab === "sell"}
              onClick={() => setActiveTab("sell")}
              count={incomingOrders.length}
            />
          </div>

          <div className="p-4">
            <AnimatePresence mode="wait">
              {isLoading ? (
                <ProductListingSkeleton />
              ) : (
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  {activeTab === "buy" &&
                    products.map((product) => (
                      <Suspense
                        key={product._id}
                        fallback={
                          <div className="h-32 bg-[#292B30] rounded animate-pulse" />
                        }
                      >
                        <ProductCard
                          product={product}
                          actionType="buy"
                          isSellTab={false}
                        />
                      </Suspense>
                    ))}

                  {activeTab === "sell" &&
                    incomingOrders.map((order) => (
                      <Suspense
                        key={order._id}
                        fallback={
                          <div className="h-32 bg-[#292B30] rounded animate-pulse" />
                        }
                      >
                        <IncomingOrderCard
                          product={order}
                          onReject={() => handleRejectOrder(order)}
                        />
                      </Suspense>
                    ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </Container>

      {isComponentMounted && (
        <LazyFloatingButton
          icon={<FaExchangeAlt />}
          to="/trades/viewtrades"
          label="View Trades"
          position="bottom-right"
          color="primary"
        />
      )}
    </div>
  );
};

export default Trade;
