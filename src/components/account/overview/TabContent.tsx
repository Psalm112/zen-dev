import { LazyMotion, domAnimation, m } from "framer-motion";
import OrderHistoryItem from "./OrderHistoryItem";
import DisputeItem from "./DisputeItem";
import EmptyState from "./EmptyState";
import SavedItem from "./SavedItem";
import { TabType } from "../../../utils/types";
import ReferralsTab from "./referrals";
import React, { useEffect, useState, lazy, Suspense } from "react";
import LoadingSpinner from "../../common/LoadingSpinner";
import { useOrderData } from "../../../utils/hooks/useOrder";
import { useWatchlist } from "../../../utils/hooks/useWatchlist";

const CreateProduct = lazy(() => import("./products/CreateProduct"));

interface TabContentProps {
  activeTab: TabType;
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
const TabContent: React.FC<TabContentProps> = React.memo(
  ({ activeTab }) => {
    const {
      fetchBuyerOrders,
      disputeOrders,
      nonDisputeOrders,
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

    const [isInitialLoad, setIsInitialLoad] = useState(true);

    useEffect(() => {
      if (activeTab === "1" && isInitialLoad) {
        fetchUserWatchlist(false, true);
        setIsInitialLoad(false);
      }
      if (activeTab === "2" && isInitialLoad) {
        const loadOrders = async () => {
          await fetchBuyerOrders(false, true);
          setIsInitialLoad(false);
        };
        loadOrders();
      }

      if (activeTab === "3" && isInitialLoad) {
        const loadOrders = async () => {
          await fetchBuyerOrders(false, true);
          setIsInitialLoad(false);
        };
        loadOrders();
      }
    }, [activeTab, fetchBuyerOrders, fetchUserWatchlist, isInitialLoad]);

    return (
      <LazyMotion features={domAnimation}>
        {activeTab === "1" && (
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
                  {watchlistItems
                    .filter((item) => item.product && item.product._id)
                    .map((item, index) => (
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
        {activeTab === "2" && (
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
              nonDisputeOrders.length > 0 &&
              nonDisputeOrders
                .filter(
                  (order): order is NonNullable<typeof order> =>
                    order !== null && order._id !== undefined
                )
                .map((order, index) => (
                  <OrderHistoryItem key={order?._id} {...order} index={index} />
                ))}
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

            {!orderLoading &&
              !orderError &&
              disputeOrders &&
              disputeOrders.length > 0 && (
                <div className="mt-6 space-y-4">
                  {disputeOrders
                    .filter(
                      (order): order is NonNullable<typeof order> =>
                        order !== null && order._id !== undefined
                    )
                    .map((order) => (
                      <DisputeItem
                        key={order._id}
                        disputeStatus={
                          order.dispute?.resolved === false
                            ? "Under Review"
                            : "Resolved"
                        }
                        order={order}
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
  },
  (prevProps, nextProps) => {
    return prevProps.activeTab === nextProps.activeTab;
  }
);

export default TabContent;
