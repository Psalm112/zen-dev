
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

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(
        errorData?.message || `API error: ${response.status}`
      );
    }

    return response;
  };

  return { fetchWithAuth };
};

export const useApi = () => {
  const { fetchWithAuth } = createApiService();
  
  const getCurrentUser = async () => {
    const response = await fetchWithAuth('/user/me');
    return response.json();
  };
  
  // const getProducts = async (category?: string) => {
  //   const endpoint = category 
  //     ? `/products?category=${encodeURIComponent(category)}` 
  //     : '/products';
  //   const response = await fetchWithAuth(endpoint);
  //   return response.json();
  // };
  
  
  return {
    getCurrentUser,
    // getProducts,
  };
};