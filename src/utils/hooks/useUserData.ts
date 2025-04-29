import { useEffect } from "react";
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

export const useUserData = () => {
  const dispatch = useAppDispatch();
  const { showSnackbar } = useSnackbar();

  const profile = useAppSelector(selectUserProfile);
  const loading = useAppSelector(selectUserLoading);
  const error = useAppSelector(selectUserError);
  const formattedProfile = useAppSelector(selectFormattedProfile);

  const fetchProfile = async (showNotifications = true) => {
    try {
      await dispatch(fetchUserProfile()).unwrap();
      if (showNotifications) {
        showSnackbar("Profile loaded successfully", "success");
      }
    } catch (err) {
      if (showNotifications) {
        showSnackbar((err as string) || "Failed to load profile", "error");
      }
      throw err;
    }
  };

  const updateProfile = async (data: any) => {
    try {
      await dispatch(updateUserProfile(data)).unwrap();
      showSnackbar("Profile updated successfully", "success");
      return true;
    } catch (err) {
      showSnackbar((err as string) || "Failed to update profile", "error");
      throw err;
    }
  };

  useEffect(() => {
    if (!profile && loading === "idle") {
      fetchProfile(false);
    }
  }, []);

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
