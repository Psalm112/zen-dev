import { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "./redux";
import {
  fetchAllProducts,
  fetchProductById,
  fetchSponsoredProducts,
  searchProducts,
  clearCurrentProduct,
  clearSearchResults,
} from "../../store/slices/productSlice";
import {
  selectAllProducts,
  selectCurrentProduct,
  selectSponsoredProducts,
  selectProductLoading,
  selectProductError,
  selectSearchResults,
  selectProductsByCategory,
  selectRelatedProducts,
  selectFormattedProduct,
} from "../../store/selectors/productSelectors";
import { useSnackbar } from "../../context/SnackbarContext";
import { useEffect } from "react";
import { api } from "../services/apiService";

export const useProductData = () => {
  const dispatch = useAppDispatch();
  const { showSnackbar } = useSnackbar();

  const products = useAppSelector(selectAllProducts);
  const product = useAppSelector(selectCurrentProduct);
  const formattedProduct = useAppSelector(selectFormattedProduct);
  const sponsoredProducts = useAppSelector(selectSponsoredProducts);
  const loading = useAppSelector(selectProductLoading) === "pending";
  const error = useAppSelector(selectProductError);
  const searchResults = useAppSelector(selectSearchResults);
  const relatedProducts = useAppSelector(selectRelatedProducts);

  const fetchAllProductsAsync = useCallback(
    async (showNotification = false, forceRefresh = false) => {
      try {
        await dispatch(fetchAllProducts(forceRefresh)).unwrap();
        if (showNotification) {
          showSnackbar("Products loaded successfully", "success");
        }
        return true;
      } catch (err) {
        if (showNotification) {
          showSnackbar((err as string) || "Failed to load products", "error");
        }
        return false;
      }
    },
    [dispatch, showSnackbar]
  );

  const fetchProductByIdAsync = useCallback(
    async (id: string, showNotification = false) => {
      try {
        const result = await dispatch(fetchProductById(id)).unwrap();
        if (showNotification) {
          showSnackbar("Product loaded successfully", "success");
        }
        return result;
      } catch (err) {
        if (showNotification) {
          showSnackbar((err as string) || "Failed to load product", "error");
        }
        return null;
      }
    },
    [dispatch, showSnackbar]
  );

  const fetchSponsoredProductsAsync = useCallback(
    async (showNotification = false, forceRefresh = false) => {
      try {
        await dispatch(fetchSponsoredProducts(forceRefresh)).unwrap();
        if (showNotification) {
          showSnackbar("Featured products loaded successfully", "success");
        }
        return true;
      } catch (err) {
        if (showNotification) {
          showSnackbar(
            (err as string) || "Failed to load featured products",
            "error"
          );
        }
        return false;
      }
    },
    [dispatch, showSnackbar]
  );

  const searchProductsAsync = useCallback(
    async (query: string, showNotification = false) => {
      if (!query.trim()) {
        dispatch(clearSearchResults());
        return [];
      }

      try {
        const result = await dispatch(searchProducts(query)).unwrap();
        if (showNotification) {
          showSnackbar("Search completed successfully", "success");
        }
        return result.results;
      } catch (err) {
        if (showNotification) {
          showSnackbar((err as string) || "Failed to search products", "error");
        }
        return [];
      }
    },
    [dispatch, showSnackbar]
  );

  const getProductsByCategory = useCallback(
    (category: string) => {
      return selectProductsByCategory(
        { products: { products } } as any,
        category
      );
    },
    [products]
  );

  const clearProduct = useCallback(() => {
    dispatch(clearCurrentProduct());
  }, [dispatch]);

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
    formattedProduct,
    sponsoredProducts,
    searchResults,
    relatedProducts,

    loading,
    error,

    fetchAllProducts: fetchAllProductsAsync,
    fetchProductById: fetchProductByIdAsync,
    fetchSponsoredProducts: fetchSponsoredProductsAsync,
    searchProducts: searchProductsAsync,
    getProductsByCategory,
    clearProduct,
  };
};
