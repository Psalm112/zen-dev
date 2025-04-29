import { store } from "../../store";
import { useAuth } from "../../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL;
const { getToken } = useAuth();
export const api = {
  fetchWithAuth: async (endpoint: string, options: RequestInit = {}) => {
    // Get token from localStorage or other auth storage
    const token = getToken();

    const headers = {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        return {
          ok: false,
          status: response.status,
          data: errorData,
          response,
        };
      }

      const data = await response.json().catch(() => null);
      return { ok: true, status: response.status, data, response };
    } catch (error) {
      return {
        ok: false,
        status: 0,
        error: error instanceof Error ? error.message : "Unknown error",
        data: null,
        response: null,
      };
    }
  },
  getUserProfile: async () => {
    return await api.fetchWithAuth("/users/profile");
  },
  updateUserProfile: async (profileData: any) => {
    return await api.fetchWithAuth("/users/profile", {
      method: "PUT",
      body: JSON.stringify(profileData),
    });
  },
  createOrder: async (orderData: any) => {
    return await api.fetchWithAuth("/orders", {
      method: "POST",
      body: JSON.stringify(orderData),
    });
  },

  createTrade: async (tradeData: any) => {
    return await api.fetchWithAuth("/contracts/trades", {
      method: "POST",
      body: JSON.stringify(tradeData),
    });
  },
};
