import { Link } from "react-router-dom";
import { Browseproduct, Mywallet, Pen, Pen2, Trackorder } from ".";
import { RiVerifiedBadgeFill } from "react-icons/ri";
import Container from "../components/common/Container";
import ProductList from "../components/product/ProductList";
import BannerCarousel from "../components/common/BannerCarousel";
import { useState, useMemo, useCallback } from "react";
import ConnectWallet from "../components/wallet";
import Modal from "../components/common/Modal";
import { useAuth } from "../context/AuthContext";

// Static data to prevent re-creation on each render
const QUICK_ACTIONS_CONFIG = [
  {
    icon: Browseproduct,
    title: "Browse Products",
    path: "/product",
    isWalletAction: false,
  },
  {
    icon: Trackorder,
    title: "Track Order",
    path: "/account",
    isWalletAction: false,
  },
  {
    icon: Mywallet,
    title: "My Wallet",
    isWalletAction: true,
    path: undefined,
  },
] as const;

const BANNERS_DATA = [
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
] as const;

const Home = () => {
  const { user, isAuthenticated } = useAuth();
  const [showWallet, setShowWallet] = useState(false);

  // Memoized wallet modal handlers
  const handleWalletOpen = useCallback(() => {
    setShowWallet(true);
  }, []);

  const handleWalletClose = useCallback(() => {
    setShowWallet(false);
  }, []);

  // Memoized quick actions with proper click handlers
  const quickActions = useMemo(() => {
    return QUICK_ACTIONS_CONFIG.map((action) => ({
      ...action,
      onclick: action.isWalletAction ? handleWalletOpen : undefined,
    }));
  }, [handleWalletOpen]);

  // Memoized display name for mobile view
  const displayName = useMemo(() => {
    if (!isAuthenticated || !user?.name) return "User";

    if (typeof user.name === "string") {
      const nameParts = user.name.split(" ");
      return nameParts.length > 1
        ? `${nameParts[0]} ${nameParts[nameParts.length - 1]}`
        : nameParts[0];
    }
    return "User";
  }, [isAuthenticated, user?.name]);

  // Memoized user greeting
  const userGreeting = useMemo(() => {
    if (!isAuthenticated) return "User";
    return user?.name || "User";
  }, [isAuthenticated, user?.name]);

  return (
    <div className="bg-Dark min-h-screen">
      <Container className="py-6 md:py-20">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-[20px] text-white mb-0">
              Welcome,&nbsp;
              {isAuthenticated ? (
                <>
                  <span className="max-xs:hidden">{userGreeting}</span>
                  <span className="xs:hidden">{displayName}</span>
                </>
              ) : (
                "User"
              )}
              .
            </h4>
            <span className="text-[#C6C6C8] text-[13px]">
              What would you like to do today?
            </span>
          </div>
          <div className="flex md:hidden items-center">
            <RiVerifiedBadgeFill className="text-[#4FA3FF] text-xl" />
          </div>
        </div>

        {/* Quick action buttons */}
        <div className="flex justify-evenly md:justify-start mt-6 md:mt-20 gap-4 md:gap-10">
          {quickActions.map((action, index) =>
            action.path ? (
              <Link
                key={index}
                to={action.path}
                className="flex flex-col items-center justify-center gap-2 group transition-transform hover:scale-105 active:scale-95"
                prefetch="intent"
              >
                <span className="bg-[#292B30] rounded-full p-4 md:p-8 flex items-center justify-center transition-colors group-hover:bg-[#33363b]">
                  <img
                    src={action.icon}
                    alt=""
                    className="w-[20px] h-[20px] md:w-[24px] md:h-[24px]"
                    loading="lazy"
                  />
                </span>
                <h3 className="text-[#AEAEB2] text-sm md:text-lg group-hover:text-white transition-colors">
                  {action.title}
                </h3>
              </Link>
            ) : (
              <button
                key={index}
                onClick={action.onclick}
                className="flex flex-col items-center justify-center gap-2 group transition-transform hover:scale-105 active:scale-95"
                type="button"
              >
                <span className="bg-[#292B30] rounded-full p-4 md:p-8 flex items-center justify-center transition-colors group-hover:bg-[#33363b]">
                  <img
                    src={action.icon}
                    alt=""
                    className="w-[20px] h-[20px] md:w-[24px] md:h-[24px]"
                    loading="lazy"
                  />
                </span>
                <h3 className="text-[#AEAEB2] text-sm md:text-lg group-hover:text-white transition-colors">
                  {action.title}
                </h3>
              </button>
            )
          )}
        </div>

        {/* Banner Carousel */}
        <BannerCarousel
          banners={[...BANNERS_DATA]}
          autoRotate={true}
          rotationInterval={6000}
        />

        {/* Featured Products Section */}
        <ProductList
          title="Featured Products"
          path="/product"
          className="mt-6 md:mt-10"
          isCategoryView={false}
          isFeatured={true}
          showViewAll={true}
        />

        {/* All Products Section */}
        <ProductList
          title="Recent Products"
          path="/product"
          className="mt-6 md:mt-10"
          isCategoryView={false}
          maxItems={4}
          showViewAll={true}
        />
      </Container>

      {/* Wallet modal */}
      {showWallet && (
        <Modal onClose={handleWalletClose} isOpen>
          <ConnectWallet />
        </Modal>
      )}
    </div>
  );
};

export default Home;
