import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { UserProfile } from "../../utils/types";
import { api } from "../../utils/services/apiService";

interface UserState {
  profile: UserProfile | null;
  loading: "idle" | "pending" | "succeeded" | "failed";
  error: string | null;
  lastFetched: number | null;
}

const initialState: UserState = {
  profile: null,
  loading: "idle",
  error: null,
  lastFetched: null,
};

// Cache timeout (5 minutes)
const CACHE_TIMEOUT = 5 * 60 * 1000;

export const fetchUserProfile = createAsyncThunk<
  UserProfile,
  boolean | undefined,
  { rejectValue: string }
>(
  "user/fetchProfile",
  async (forceRefresh = false, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { user: UserState };
      const now = Date.now();

      // Skip fetching if data is fresh and not forcing refresh
      if (
        !forceRefresh &&
        state.user.profile &&
        state.user.lastFetched &&
        now - state.user.lastFetched < CACHE_TIMEOUT
      ) {
        return state.user.profile;
      }

      const response = await api.getUserProfile(forceRefresh);

      if (!response.ok) {
        return rejectWithValue(response.error || "Failed to fetch profile");
      }

      return response.data;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "An unknown error occurred";
      return rejectWithValue(message);
    }
  }
);

export const updateUserProfile = createAsyncThunk<
  UserProfile,
  Partial<UserProfile>,
  { rejectValue: string }
>("user/updateProfile", async (profileData, { rejectWithValue }) => {
  try {
    const response = await api.updateUserProfile(profileData);

    if (!response.ok) {
      return rejectWithValue(response.error || "Failed to update profile");
    }

    return response.data;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "An unknown error occurred";
    return rejectWithValue(message);
  }
});

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    clearUserProfile: (state) => {
      state.profile = null;
      state.lastFetched = null;
      // Also clear API cache
      api.clearCache();
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
          state.lastFetched = Date.now();
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
          state.lastFetched = Date.now();
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
