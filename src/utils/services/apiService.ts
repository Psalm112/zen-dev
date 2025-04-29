import { UserProfile } from "../types";

const API_URL = import.meta.env.VITE_API_URL;

export const fetchWithAuth = async (
  endpoint: string,
  options: RequestInit = {}
) => {
  const token = localStorage.getItem("auth_token");

  const headers = {
    ...(options.headers || {}),
    ...(token && { Authorization: `Bearer ${token}` }),
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
        error: errorData?.message || `Error: ${response.status}`,
        data: null,
      };
    }

    const data = await response.json().catch(() => null);
    return { ok: true, status: response.status, data, error: null };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      error: error instanceof Error ? error.message : "Unknown error",
      data: null,
    };
  }
};

const requestCache = new Map();
const cacheKey = (endpoint: string, options?: RequestInit) =>
  `${endpoint}:${options?.method || "GET"}`;

// Abort controller map for cancellation
const abortControllers = new Map();

export const api = {
  getUserProfile: async (skipCache = false) => {
    const key = cacheKey("/users/profile");

    if (!skipCache && requestCache.has(key)) {
      return requestCache.get(key);
    }

    // Cancel any existing request
    if (abortControllers.has(key)) {
      abortControllers.get(key).abort();
    }

    const controller = new AbortController();
    abortControllers.set(key, controller);

    const result = await fetchWithAuth("/users/profile", {
      signal: controller.signal,
    });

    if (result.ok) {
      requestCache.set(key, result);
    }

    return result;
  },

  updateUserProfile: async (profileData: Partial<UserProfile>) => {
    // Clear cache on update
    requestCache.delete(cacheKey("/users/profile"));

    // Handle form data
    const formData = new FormData();

    if (profileData.name) formData.append("name", profileData.name);
    if (profileData.dateOfBirth)
      formData.append("dateOfBirth", profileData.dateOfBirth);
    if (profileData.phoneNumber)
      formData.append("phoneNumber", profileData.phoneNumber);
    if (profileData.address) formData.append("address", profileData.address);

    if (profileData.profileImage instanceof File) {
      formData.append("profileImage", profileData.profileImage);
    }

    return fetchWithAuth("/users/profile", {
      method: "PUT",
      body: formData,
    });
  },

  clearCache: () => {
    requestCache.clear();
  },

  cancelRequest: (endpoint: string, method = "GET") => {
    const key = cacheKey(endpoint, { method });
    if (abortControllers.has(key)) {
      abortControllers.get(key).abort();
      abortControllers.delete(key);
    }
  },
};
