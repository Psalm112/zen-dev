import { api } from "./apiService";

export const useOrderService = () => {
  const createOrder = async (orderData: {
    product: string;
    buyer: string;
    seller: string;
    amount: number;
    status: string;
  }) => {
    const response = await api.fetchWithAuth("/orders", {
      method: "POST",
      body: JSON.stringify(orderData),
    });
    return response;
  };

  const getOrderById = async (orderId: string) => {
    const response = await api.fetchWithAuth(`/orders/${orderId}`);
    return response;
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    const response = await api.fetchWithAuth(`/orders/${orderId}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    return response;
  };

  return {
    createOrder,
    getOrderById,
    updateOrderStatus,
  };
};
