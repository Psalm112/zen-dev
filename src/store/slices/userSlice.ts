import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { UserProfile } from "../../utils/types";
import { api } from "../../utils/services/apiService";

interface UserState {
  profile: UserProfile | null;
  loading: "idle" | "pending" | "succeeded" | "failed";
  error: string | null;
}

const initialState: UserState = {
  profile: null,
  loading: "idle",
  error: null,
};

export const fetchUserProfile = createAsyncThunk<
  UserProfile,
  void,
  { rejectValue: string }
>("user/fetchProfile", async (_arg, { rejectWithValue }) => {
  try {
    const response = await api.getUserProfile();

    if (!response.ok) {
      return rejectWithValue(response.error || "Failed to fetch profile");
    }

    return response.data;
  } catch (error) {
    return rejectWithValue("An error occurred while fetching profile");
  }
});
export const updateUserProfile = createAsyncThunk(
  "user/updateProfile",
  async (profileData: Partial<UserProfile>, { rejectWithValue }) => {
    try {
      const response = await api.updateUserProfile(profileData);

      if (!response.ok) {
        return rejectWithValue(response.error || "Failed to update profile");
      }

      return response.data;
    } catch (error) {
      return rejectWithValue("An error occurred while updating profile");
    }
  }
);

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    clearUserProfile: (state) => {
      state.profile = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserProfile.pending, (state) => {
        state.loading = "pending";
        state.error = null;
      })
      .addCase(
        fetchUserProfile.fulfilled,
        (state, action: PayloadAction<UserProfile>) => {
          state.profile = action.payload;
          state.loading = "succeeded";
        }
      )
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.loading = "failed";
        state.error = (action.payload as string) || "Unknown error occurred";
      })
      .addCase(updateUserProfile.pending, (state) => {
        state.loading = "pending";
        state.error = null;
      })
      .addCase(
        updateUserProfile.fulfilled,
        (state, action: PayloadAction<UserProfile>) => {
          state.profile = action.payload;
          state.loading = "succeeded";
        }
      )
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.loading = "failed";
        state.error = (action.payload as string) || "Unknown error occurred";
      });
  },
});

export const { clearUserProfile } = userSlice.actions;
export default userSlice.reducer;
