import { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Container from "../components/common/Container";
import { TradeStatusType } from "../utils/types";
import TradeStatus from "../components/trade/status/TradeStatus";
import { toast } from "react-toastify";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { useOrderData } from "../utils/hooks/useOrder";

const ViewOrderDetail = () => {
  const { orderId } = useParams<{ orderId: string }>();

  const location = useLocation();
  const navigate = useNavigate();
  const [orderStatus, setOrderStatus] = useState<TradeStatusType>("pending");
  //   const [isProcessing, setIsProcessing] = useState(false);

  const {
    getOrderById,
    currentOrder: orderDetails,
    loading,
    error,
    changeOrderStatus,
    raiseDispute,
  } = useOrderData();

  useEffect(() => {
    if (location.search.includes("status=")) {
      const statusParam = new URLSearchParams(location.search).get("status");
      if (
        statusParam &&
        ["cancelled", "pending", "release", "completed"].includes(statusParam)
      ) {
        setOrderStatus(statusParam as TradeStatusType);
      }
    }

    const fetchOrder = async () => {
      if (orderId) {
        await getOrderById(orderId);
      }
    };

    fetchOrder();
  }, [orderId, getOrderById, location.search]);

  useEffect(() => {
    if (orderDetails?.status) {
      const statusMapping: Record<string, TradeStatusType> = {
        pending: "pending",
        accepted: "pending",
        rejected: "cancelled",
        completed: "completed",
        disputed: "cancelled",
        refunded: "pending",
        delivery_confirmed: "completed",
      };

      setOrderStatus(
        statusMapping[orderDetails.status.toLowerCase()] || "pending"
      );
    }
  }, [orderDetails]);

  const transactionInfo =
    orderDetails?.buyer && orderDetails?.seller
      ? {
          buyerName:
            typeof orderDetails.buyer === "object"
              ? orderDetails.buyer.name
              : orderDetails.buyer,
          sellerName:
            typeof orderDetails.seller === "object"
              ? orderDetails.seller.name
              : orderDetails.seller,
          goodRating: 0,
          completedOrders: 0,
          completionRate: 0,
          avgPaymentTime: 0,
        }
      : {
          buyerName: "Unknown Buyer",
          sellerName: "Unknown Seller",
          goodRating: 0,
          completedOrders: 0,
          completionRate: 0,
          avgPaymentTime: 0,
        };

  const handleContactSeller = () => {
    toast.info("Opening chat with seller...");
    navigate(
      `/chat/${
        typeof orderDetails?.seller === "string"
          ? orderDetails?.seller
          : orderDetails?.seller?._id
      }`
    );
  };

  const handleContactBuyer = () => {
    toast.info("Opening chat with buyer...");
    // navigate(`/chat/${orderDetails?.buyer?._id}`);
  };
  const handleOrderDispute = async (reason: string): Promise<void> => {
    if (!orderId) return;

    try {
      const disputeRes = await raiseDispute(orderId, reason, false);
      const changeOrderRes = await changeOrderStatus(
        orderId,
        "disputed",
        false
      );

      if (disputeRes && changeOrderRes?.status === "disputed") {
        toast.success("Dispute has been filled successfully");
        navigate(`/trades/viewtrades/${orderId}?status=cancelled`, {
          replace: true,
        });
      }
    } catch (error) {
      toast.error("Failed to file dispute. Please try again.");
      // console.log(error);
    }
  };

  const handleReleaseNow = async () => {
    if (!orderId) return;

    try {
      navigate(`/trades/orders/${orderId}?status=release`, {
        replace: true,
      });
    } catch (error) {
      toast.error("Failed Release. Please try again.");
      // console.log(error);
    }
  };

  const handleConfirmDelivery = async () => {
    if (!orderId) return;

    // setIsProcessing(true);
    try {
      await changeOrderStatus(orderId, "completed");
      setOrderStatus("completed");
      navigate(`/trades/viewtrades/${orderId}?status=completed`, {
        replace: true,
      });
      toast.success("Order has been completed successfully!");
    } catch (error) {
      toast.error("Failed to complete the order. Please try again.");
      // console.log(error);
    } finally {
      //   setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-Dark min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center text-white"
        >
          <LoadingSpinner />
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Loading order details...
          </motion.p>
        </motion.div>
      </div>
    );
  }

  if (error || !orderDetails) {
    return (
      <div className="bg-Dark min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center text-white text-center px-4"
        >
          <div className="text-Red text-6xl mb-4">!</div>
          <h2 className="text-xl font-medium mb-2">Order Not Found</h2>
          <p className="text-gray-400 mb-6">
            Sorry, we couldn't find the order you're looking for.
          </p>
          <button
            onClick={() => navigate(`/product`)}
            className="bg-Red hover:bg-[#e02d37] text-white px-6 py-2 rounded-lg transition-colors"
          >
            Back to Products
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="bg-Dark min-h-screen py-8 text-white">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <TradeStatus
            status={orderStatus}
            orderDetails={orderDetails}
            transactionInfo={transactionInfo}
            onContactSeller={
              orderStatus !== "pending" ? handleContactSeller : undefined
            }
            onContactBuyer={
              orderStatus !== "pending" ? handleContactBuyer : undefined
            }
            onOrderDispute={handleOrderDispute}
            onReleaseNow={handleReleaseNow}
            onConfirmDelivery={handleConfirmDelivery}
            orderId={orderId}
            navigatePath={`/orders/${orderId}?status=release`}
          />
        </motion.div>
      </Container>
    </div>
  );
};

export default ViewOrderDetail;
