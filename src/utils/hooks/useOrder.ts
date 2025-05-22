import { useCallback, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "./redux";
import {
  createOrder,
  fetchUserOrders,
  fetchSellerOrders,
  fetchOrderById,
  updateOrderStatus,
  raiseOrderDispute,
  clearOrderState,
} from "../../store/slices/orderSlice";
import {
  selectAllOrders,
  selectSellerOrders,
  selectCurrentOrder,
  selectOrderLoading,
  selectOrderError,
  selectFormattedOrders,
  selectFormattedSellerOrders,
  selectFormattedCurrentOrder,
  selectOrdersByStatus,
  selectOrderStats,
} from "../../store/selectors/orderSelectors";
import { useSnackbar } from "../../context/SnackbarContext";
import { useEffect } from "react";
import { api } from "../services/apiService";
import { OrderStatus, Order } from "../types";
import { useCurrencyConverter } from "./useCurrencyConverter";
import { useCurrency } from "../../context/CurrencyContext";

export const useOrderData = () => {
  const { secondaryCurrency } = useCurrency();
  const dispatch = useAppDispatch();
  const { showSnackbar } = useSnackbar();
  const { convertPrice, formatPrice } = useCurrencyConverter();

  const orders = useAppSelector(selectAllOrders);
  const sellerOrders = useAppSelector(selectSellerOrders);
  const currentOrder = useAppSelector(selectCurrentOrder);
  const formattedOrders = useAppSelector(selectFormattedOrders);
  const formattedSellerOrders = useAppSelector(selectFormattedSellerOrders);
  const formattedCurrentOrder = useAppSelector(selectFormattedCurrentOrder);
  const orderStats = useAppSelector(selectOrderStats);
  const loading = useAppSelector(selectOrderLoading);
  const error = useAppSelector(selectOrderError);

  const formatOrderWithCurrencies = useCallback(
    (order: Order) => {
      if (!order || !order.product) return null;

      const productPrice = order.product.price;
      const totalAmount = productPrice * (order.quantity || 1);

      const celoPrice = convertPrice(productPrice, "USDT", "CELO");
      const fiatPrice = convertPrice(productPrice, "USDT", "FIAT");
      const celoTotal = convertPrice(totalAmount, "USDT", "CELO");
      const fiatTotal = convertPrice(totalAmount, "USDT", "FIAT");

      return {
        ...order,
        formattedDate: new Date(order.createdAt).toLocaleDateString(),
        formattedAmount: formatPrice(totalAmount, "USDT"),
        formattedCeloAmount: formatPrice(celoTotal, "CELO"),
        formattedFiatAmount: formatPrice(fiatTotal, "FIAT"),
        formattedProductPrice: formatPrice(productPrice, "USDT"),
        formattedCeloPrice: formatPrice(celoPrice, "CELO"),
        formattedFiatPrice: formatPrice(fiatPrice, "FIAT"),
        product: {
          ...order.product,
          formattedPrice: formatPrice(productPrice, "USDT"),
          formattedCeloPrice: formatPrice(celoPrice, "CELO"),
          formattedFiatPrice: formatPrice(fiatPrice, "FIAT"),
        },
      };
    },
    [convertPrice, formatPrice]
  );

  const enhancedOrders = useMemo(() => {
    return orders.map(formatOrderWithCurrencies).filter(Boolean);
  }, [orders, formatOrderWithCurrencies]);

  const enhancedSellerOrders = useMemo(() => {
    return sellerOrders.map(formatOrderWithCurrencies).filter(Boolean);
  }, [sellerOrders, formatOrderWithCurrencies]);

  const enhancedCurrentOrder = useMemo(() => {
    if (!currentOrder) return null;
    return formatOrderWithCurrencies(currentOrder);
  }, [currentOrder, formatOrderWithCurrencies]);

  const placeOrder = useCallback(
    async (
      orderData: {
        product: string;
        quantity: number;
        logisticsProviderWalletAddress: string;
        // seller: string;
        // amount: string;
      },
      showNotification = true
    ) => {
      try {
        const result = await dispatch(createOrder(orderData)).unwrap();
        if (showNotification) {
          showSnackbar("Order placed successfully", "success");
        }
        return result;
      } catch (err) {
        if (showNotification) {
          showSnackbar((err as string) || "Failed to place order", "error");
        }
        return null;
      }
    },
    [dispatch, showSnackbar]
  );

  const fetchBuyerOrders = useCallback(
    async (showNotification = false, forceRefresh = false) => {
      try {
        const result = await dispatch(fetchUserOrders(forceRefresh)).unwrap();
        if (showNotification) {
          showSnackbar("Orders loaded successfully", "success");
        }
        return result;
      } catch (err) {
        if (showNotification) {
          showSnackbar((err as string) || "Failed to load orders", "error");
        }
        return [];
      }
    },
    [dispatch, showSnackbar]
  );

  const fetchMerchantOrders = useCallback(
    async (showNotification = false, forceRefresh = false) => {
      try {
        const result = await dispatch(fetchSellerOrders(forceRefresh)).unwrap();
        if (showNotification) {
          showSnackbar("Seller orders loaded successfully", "success");
        }
        return result;
      } catch (err) {
        if (showNotification) {
          showSnackbar(
            (err as string) || "Failed to load seller orders",
            "error"
          );
        }
        return [];
      }
    },
    [dispatch, showSnackbar]
  );

  const getOrderById = useCallback(
    async (orderId: string, showNotification = false) => {
      try {
        const result = await dispatch(fetchOrderById(orderId)).unwrap();
        if (showNotification) {
          showSnackbar("Order details loaded successfully", "success");
        }
        return result;
      } catch (err) {
        if (showNotification) {
          showSnackbar(
            (err as string) || "Failed to load order details",
            "error"
          );
        }
        return null;
      }
    },
    [dispatch, showSnackbar]
  );

  const changeOrderStatus = useCallback(
    async (orderId: string, status: OrderStatus, showNotification = true) => {
      try {
        const result = await dispatch(
          updateOrderStatus({ orderId, status })
        ).unwrap();
        if (showNotification) {
          showSnackbar("Order status updated successfully", "success");
        }
        return result;
      } catch (err) {
        if (showNotification) {
          showSnackbar(
            (err as string) || "Failed to update order status",
            "error"
          );
        }
        return null;
      }
    },
    [dispatch, showSnackbar]
  );

  const raiseDispute = useCallback(
    async (orderId: string, reason: string, showNotification = true) => {
      try {
        const result = await dispatch(
          raiseOrderDispute({ orderId, reason })
        ).unwrap();
        if (showNotification) {
          showSnackbar("Dispute raised successfully", "success");
        }
        return result;
      } catch (err) {
        if (showNotification) {
          showSnackbar((err as string) || "Failed to raise dispute", "error");
        }
        return null;
      }
    },
    [dispatch, showSnackbar]
  );

  const getOrdersByStatus = useCallback(
    (status: string) => {
      return selectOrdersByStatus(
        { orders: { orders: enhancedOrders } } as any,
        status
      );
    },
    [enhancedOrders]
  );

  const clearOrder = useCallback(() => {
    dispatch(clearOrderState());
  }, [dispatch]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      api.cancelRequest("/orders");
    };
  }, []);

  return {
    orders: enhancedOrders,
    sellerOrders: enhancedSellerOrders,
    currentOrder: enhancedCurrentOrder,
    formattedOrders,
    formattedSellerOrders,
    formattedCurrentOrder,
    orderStats,
    loading,
    error,
    placeOrder,
    fetchBuyerOrders,
    fetchMerchantOrders,
    getOrderById,
    changeOrderStatus,
    raiseDispute,
    getOrdersByStatus,
    clearOrder,
    secondaryCurrency,
  };
};
