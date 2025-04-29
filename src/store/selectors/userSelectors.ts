import { createSelector } from "@reduxjs/toolkit";
import { RootState } from "../index";

export const selectUserProfile = (state: RootState) => state.user.profile;
export const selectUserLoading = (state: RootState) => state.user.loading;
export const selectUserError = (state: RootState) => state.user.error;

// Format date as MM/DD/YYYY
const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return "";

  try {
    const date = new Date(dateString);
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const year = date.getFullYear();

    return `${month}/${day}/${year}`;
  } catch (e) {
    return "";
  }
};

export const selectFormattedProfile = createSelector(
  [selectUserProfile],
  (profile) => {
    if (!profile)
      return {
        name: "",
        dob: "",
        email: "",
        phone: "",
      };

    return {
      name: profile.name || "",
      dob: formatDate(profile.dateOfBirth),
      email: profile.email || "",
      phone: profile.phoneNumber || "",
      address: profile.address || "",
      profileImage: profile.profileImage || "",
    };
  }
);

export const selectUserMilestones = createSelector(
  [selectUserProfile],
  (profile) => profile?.milestones || { sales: 0, purchases: 0 }
);

export const selectUserPoints = createSelector([selectUserProfile], (profile) =>
  profile
    ? {
        total: profile.totalPoints || 0,
        available: profile.availablePoints || 0,
      }
    : { total: 0, available: 0 }
);
