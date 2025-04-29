import { createSelector } from "@reduxjs/toolkit";
import { RootState } from "../index";

export const selectUserProfile = (state: RootState) => state.user.profile;
export const selectUserLoading = (state: RootState) => state.user.loading;
export const selectUserError = (state: RootState) => state.user.error;

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
      name: profile.name,
      dob: "",
      email: profile.email,
      phone: "",
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
        total: profile.totalPoints,
        available: profile.availablePoints,
      }
    : { total: 0, available: 0 }
);
