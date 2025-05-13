import { LazyMotion, domAnimation, m } from "framer-motion";
import OrderHistoryItem from "./OrderHistoryItem";
import DisputeItem from "./DisputeItem";
import EmptyState from "./EmptyState";
import SavedItem from "./SavedItem";
import { Order, TabType } from "../../../utils/types";
import ReferralsTab from "./referrals";
import { useEffect, useState, lazy, Suspense, useMemo } from "react";
import LoadingSpinner from "../../common/LoadingSpinner";
import { useOrderData } from "../../../utils/hooks/useOrder";
import { useWatchlist } from "../../../utils/hooks/useWatchlist";

const CreateProduct = lazy(() => import("./products/CreateProduct"));

interface TabContentProps {
  activeTab: TabType;
  productImage: string;
  milestones?: {
    sales: number;
    purchases: number;
  };
  referralCode?: string;
  referralCount?: number;
  points?: {
    total: number;
    available: number;
  };
}
interface OrderProps extends Order {
  formattedDate: string;
  formattedAmount: string;
}
const TabContent: React.FC<TabContentProps> = ({ activeTab, productImage }) => {
  const {
    fetchBuyerOrders,
    formattedOrders,
    loading: orderLoading,
    error: orderError,
  } = useOrderData();

  const {
    watchlistItems,
    fetchUserWatchlist,
    removeProductFromWatchlist,
    isLoading: watchlistLoading,
    error: watchlistError,
  } = useWatchlist();

  // const [disputeOrders, setDisputeOrders] = useState<OrderProps[]>([]);
  // const [nonDisputeOrders, setNonDisputeOrders] = useState<OrderProps[]>([]);
  const disputeOrders = useMemo(
    () => formattedOrders?.filter((order) => order.status === "disputed") || [],
    [formattedOrders]
  );

  const nonDisputeOrders = useMemo(
    () => formattedOrders?.filter((order) => order.status !== "disputed") || [],
    [formattedOrders]
  );
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    if (activeTab === "1" && (isInitialLoad || !formattedOrders)) {
      const loadOrders = async () => {
        await fetchBuyerOrders(false, isInitialLoad);
        setIsInitialLoad(false);
      };

      loadOrders();
    }

    if (activeTab === "2" && (isInitialLoad || !watchlistItems)) {
      fetchUserWatchlist(false, isInitialLoad);
      setIsInitialLoad(false);
    }
  }, [activeTab, fetchBuyerOrders, fetchUserWatchlist, isInitialLoad]);

  // Filter orders when they change
  // useEffect(() => {
  //   if (formattedOrders?.length > 0) {
  //     const disputed = formattedOrders.filter(
  //       (order) => order.status === "disputed"
  //     );
  //     const nonDisputed = formattedOrders.filter(
  //       (order) => order.status !== "disputed"
  //     );

  //     setDisputeOrders(disputed);
  //     setNonDisputeOrders(nonDisputed);
  //   } else {
  //     setDisputeOrders([]);
  //     setNonDisputeOrders([]);
  //   }
  // }, [formattedOrders]);

  return (
    <LazyMotion features={domAnimation}>
      {activeTab === "1" && (
        <m.div
          className="mt-6 space-y-4"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.3 }}
        >
          {orderLoading && (
            <div className="flex justify-center items-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          )}

          {!orderLoading && orderError && (
            <div className="text-center py-8">
              <p className="text-Red mb-2">Error loading orders</p>
              <button
                onClick={() => fetchBuyerOrders(false, true)}
                className="text-white underline hover:text-gray-300"
              >
                Try Again
              </button>
            </div>
          )}

          {!orderLoading && !orderError && nonDisputeOrders?.length === 0 && (
            <EmptyState
              message="You haven't placed any orders yet."
              buttonText="Browse Products"
              buttonPath="/product"
            />
          )}

          {!orderLoading &&
            !orderError &&
            nonDisputeOrders?.length > 0 &&
            nonDisputeOrders.map((order, index) => (
              <OrderHistoryItem key={order._id} {...order} index={index} />
            ))}
        </m.div>
      )}

      {activeTab === "2" && (
        <m.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.3 }}
        >
          {watchlistLoading && (
            <div className="flex justify-center items-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          )}

          {!watchlistLoading && watchlistError && (
            <div className="text-center py-8">
              <p className="text-Red mb-2">Error loading saved items</p>
              <button
                onClick={() => fetchUserWatchlist(false, true)}
                className="text-white underline hover:text-gray-300"
              >
                Try Again
              </button>
            </div>
          )}

          {!watchlistLoading &&
            !watchlistError &&
            watchlistItems?.length === 0 && (
              <EmptyState
                message="Your wishlist is empty."
                buttonText="Browse Products"
                buttonPath="/product"
              />
            )}

          {!watchlistLoading &&
            !watchlistError &&
            watchlistItems?.length > 0 && (
              <div className="mt-6 space-y-4">
                {watchlistItems.map((item, index) => (
                  <SavedItem
                    key={item._id}
                    item={item}
                    index={index}
                    onRemove={removeProductFromWatchlist}
                  />
                ))}
              </div>
            )}
        </m.div>
      )}

      {activeTab === "3" && (
        <m.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.3 }}
        >
          {orderLoading && (
            <div className="flex justify-center items-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          )}

          {!orderLoading && orderError && (
            <div className="text-center py-8">
              <p className="text-Red mb-2">Error loading disputes</p>
              <button
                onClick={() => fetchBuyerOrders(false, true)}
                className="text-white underline hover:text-gray-300"
              >
                Try Again
              </button>
            </div>
          )}

          {!orderLoading && !orderError && disputeOrders?.length === 0 && (
            <EmptyState
              message="You haven't raised any disputes yet."
              buttonText="View Orders"
              buttonPath="/account"
            />
          )}

          {!orderLoading && !orderError && disputeOrders?.length > 0 && (
            <div className="mt-6 space-y-4">
              {disputeOrders.map((order, index) => (
                <DisputeItem
                  key={order._id}
                  productImage={order.product.images[0] || ""}
                  productName={order.product.name || "Product Unavailable"}
                  vendor={order.seller?.name || "Unknown Vendor"}
                  disputeDate={new Date(order.createdAt).toLocaleDateString(
                    "en-US",
                    { month: "short", day: "numeric", year: "numeric" }
                  )}
                  disputeStatus="Under Review"
                />
              ))}
            </div>
          )}
        </m.div>
      )}

      {activeTab === "4" && (
        <m.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.3 }}
        >
          <ReferralsTab />
        </m.div>
      )}

      {activeTab === "5" && (
        <m.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.3 }}
        >
          <Suspense
            fallback={
              <div className="flex justify-center items-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            }
          >
            <CreateProduct />
          </Suspense>
        </m.div>
      )}
    </LazyMotion>
  );
};

export default TabContent;
