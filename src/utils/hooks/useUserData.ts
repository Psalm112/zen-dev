import { useEffect, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "./redux";
import {
  fetchUserProfile,
  updateUserProfile,
} from "../../store/slices/userSlice";
import {
  selectUserProfile,
  selectUserLoading,
  selectUserError,
  selectFormattedProfile,
} from "../../store/selectors/userSelectors";
import { useSnackbar } from "../../context/SnackbarContext";
import { api } from "../services/apiService";
import { debounce } from "../helpers";

export const useUserData = () => {
  const dispatch = useAppDispatch();
  const { showSnackbar } = useSnackbar();
  //   const abortControllerRef = useRef<AbortController | null>(null);

  const profile = useAppSelector(selectUserProfile);
  const loading = useAppSelector(selectUserLoading);
  const error = useAppSelector(selectUserError);
  const formattedProfile = useAppSelector(selectFormattedProfile);

  // Debounced update function
  const debouncedUpdate = useCallback(
    debounce(async (data: any) => {
      try {
        await dispatch(updateUserProfile(data)).unwrap();
        showSnackbar("Profile updated successfully", "success");
        return true;
      } catch (err) {
        showSnackbar((err as string) || "Failed to update profile", "error");
        return false;
      }
    }, 500),
    [dispatch, showSnackbar]
  );

  const fetchProfile = useCallback(
    async (showNotifications = true, forceRefresh = false) => {
      try {
        await dispatch(fetchUserProfile(forceRefresh)).unwrap();
        if (showNotifications) {
          showSnackbar("Profile loaded successfully", "success");
        }
        return true;
      } catch (err) {
        if (showNotifications) {
          showSnackbar((err as string) || "Failed to load profile", "error");
        }
        return false;
      }
    },
    [dispatch, showSnackbar]
  );

  const updateProfile = useCallback(
    async (data: any) => {
      return debouncedUpdate(data);
    },
    [debouncedUpdate]
  );

  // Cancel in-flight requests when component unmounts
  useEffect(() => {
    return () => {
      api.cancelRequest("/users/profile");
    };
  }, []);

  // Fetch profile on mount if not available
  useEffect(() => {
    if (!profile && loading === "idle") {
      fetchProfile(false);
    }
  }, [profile, loading, fetchProfile]);

  return {
    profile,
    formattedProfile,
    isLoading: loading === "pending",
    error,
    fetchProfile,
    updateProfile,
    isError: loading === "failed" && error !== null,
    isSuccess: loading === "succeeded",
  };
};
