
import { useAuth } from '../../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL;

export const createApiService = () => {
  const { getToken } = useAuth();
  
  const fetchWithAuth = async (endpoint: string, options: RequestInit = {}) => {
    const token = getToken();
    
    const headers = {
      'Content-Type': 'application/json',
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
          response
        };
      }

      const data = await response.json().catch(() => null);
      return { ok: true, status: response.status, data, response };
    }catch (error) {
      return { 
        ok: false, 
        status: 0, 
        error: error instanceof Error ? error.message : 'Unknown error',
        data: null,
        response: null
      };
    }

  };

  return { fetchWithAuth };
};

export const useApi = () => {
  const { fetchWithAuth } = createApiService();
  
  // const getCurrentUser = async () => {
  //   const response = await fetchWithAuth('/user/me');
  //   return response;
  // };
   const getUserProfile = async () => {
    const response = await fetchWithAuth('/users/profile');
    return response;
  };
  
  // const getProducts = async (category?: string) => {
  //   const endpoint = category 
  //     ? `/products?category=${encodeURIComponent(category)}` 
  //     : '/products';
  //   const response = await fetchWithAuth(endpoint);
  //   return response.json();
  // };
  const createOrder = async (orderData: any) => {
    return fetchWithAuth('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData)
    });
  };
  
  const createTrade = async (tradeData: any) => {
    return fetchWithAuth('/contracts/trades', {
      method: 'POST',
      body: JSON.stringify(tradeData)
    });
  };
  
  return {
    // getCurrentUser,
    getUserProfile,
     createOrder,
    createTrade
    // getProducts,
  };
};