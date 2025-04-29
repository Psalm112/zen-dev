import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./slices/userSlice";
import productReducer from "./slices/productSlice";

export const store = configureStore({
  reducer: {
    user: userReducer,
    products: productReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      // serializableCheck: false,
      serializableCheck: {
        ignoredActions: [
          "products/fetchAll/fulfilled",
          "products/fetchById/fulfilled",
        ],
        ignoredPaths: ["products.currentProduct", "products.products"],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
