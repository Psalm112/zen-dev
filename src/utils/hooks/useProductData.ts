import { useEffect, useState, useCallback } from "react";
import { useSnackbar } from "../../context/SnackbarContext";
import { api } from "../services/apiService";
import { Product } from "../types";

export const useProductData = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [product, setProduct] = useState<Product | null>(null);
  const [sponsoredProducts, setSponsoredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { showSnackbar } = useSnackbar();

  const fetchAllProducts = useCallback(
    async (showNotification = false) => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.getProducts();
        if (response.ok) {
          setProducts(response.data);
          if (showNotification) {
            showSnackbar("Products loaded successfully", "success");
          }
        } else {
          setError(response.error || "Failed to fetch products");
          if (showNotification) {
            showSnackbar(response.error || "Failed to fetch products", "error");
          }
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "An error occurred";
        setError(errorMessage);
        if (showNotification) {
          showSnackbar(errorMessage, "error");
        }
      } finally {
        setLoading(false);
      }
    },
    [showSnackbar]
  );

  const fetchProductById = useCallback(
    async (id: string, showNotification = false) => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.getProductById(id);
        if (response.ok) {
          setProduct(response.data);
          if (showNotification) {
            showSnackbar("Product loaded successfully", "success");
          }
          return response.data;
        } else {
          setError(response.error || "Failed to fetch product");
          if (showNotification) {
            showSnackbar(response.error || "Failed to fetch product", "error");
          }
          return null;
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "An error occurred";
        setError(errorMessage);
        if (showNotification) {
          showSnackbar(errorMessage, "error");
        }
        return null;
      } finally {
        setLoading(false);
      }
    },
    [showSnackbar]
  );

  const searchProducts = useCallback(
    async (query: string, showNotification = false) => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.searchProducts(query);
        if (response.ok) {
          setProducts(response.data);
          if (showNotification) {
            showSnackbar("Search completed successfully", "success");
          }
          return response.data;
        } else {
          setError(response.error || "Failed to search products");
          if (showNotification) {
            showSnackbar(
              response.error || "Failed to search products",
              "error"
            );
          }
          return [];
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "An error occurred";
        setError(errorMessage);
        if (showNotification) {
          showSnackbar(errorMessage, "error");
        }
        return [];
      } finally {
        setLoading(false);
      }
    },
    [showSnackbar]
  );

  const fetchSponsoredProducts = useCallback(
    async (showNotification = false) => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.getSponsoredProducts();
        if (response.ok) {
          setSponsoredProducts(response.data);
          if (showNotification) {
            showSnackbar("Featured products loaded successfully", "success");
          }
        } else {
          setError(response.error || "Failed to fetch featured products");
          if (showNotification) {
            showSnackbar(
              response.error || "Failed to fetch featured products",
              "error"
            );
          }
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "An error occurred";
        setError(errorMessage);
        if (showNotification) {
          showSnackbar(errorMessage, "error");
        }
      } finally {
        setLoading(false);
      }
    },
    [showSnackbar]
  );

  // Clean up on unmount
  useEffect(() => {
    return () => {
      api.cancelRequest("/products");
      api.cancelRequest("/products/sponsored");
    };
  }, []);

  return {
    products,
    product,
    sponsoredProducts,
    loading,
    error,
    fetchAllProducts,
    fetchProductById,
    searchProducts,
    fetchSponsoredProducts,
  };
};
