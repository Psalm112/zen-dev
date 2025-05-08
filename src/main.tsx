import { lazy, StrictMode, Suspense } from "react";
import "./index.css";
import { createBrowserRouter, Outlet, RouterProvider } from "react-router-dom";
import { createRoot } from "react-dom/client";
import { Configuration } from "@react-md/layout";
import Layout from "./components/layout/Layout.tsx";
import Loadscreen from "./pages/Loadscreen.tsx";
import { AuthProvider } from "./context/AuthContext.tsx";
import AuthCallback from "./pages/AuthCallback.tsx";
import ProtectedRoute from "./components/auth/ProtectedRoute.tsx";
import { SnackbarProvider } from "./context/SnackbarContext.tsx";
import { Provider } from "react-redux";
import { store } from "./store/store.ts";
import { WalletProvider } from "./context/WalletContext.tsx";
import ErrorBoundary from "./components/error/ErrorBoundary.tsx";
import NotFound from "./pages/NotFound.tsx";
import { setupGlobalErrorHandling } from "./utils/errorHandling";
import ReferralHandler from "./components/referrals/ReferralHandler.tsx";
// import GoogleCallback from "./pages/GoogleCallback.tsx";

const Login = lazy(() => import("./pages/Login.tsx"));
const Home = lazy(() => import("./pages/Home.tsx"));
const Product = lazy(() => import("./pages/Product.tsx"));
const SingleProduct = lazy(() => import("./pages/SingleProduct.tsx"));
const Account = lazy(() => import("./pages/Account.tsx"));
const Trade = lazy(() => import("./pages/Trade.tsx"));
const BuyCheckout = lazy(() => import("./pages/BuyCheckout.tsx"));
const SellCheckout = lazy(() => import("./pages/SellCheckout.tsx"));
const ViewTrade = lazy(() => import("./pages/ViewTrade.tsx"));
const ViewTradeDetail = lazy(() => import("./pages/ViewTradeDetail.tsx"));
const ViewOrderDetail = lazy(() => import("./pages/ViewOrderDetail.tsx"));
const Notifications = lazy(() => import("./pages/Notifications.tsx"));
const Community = lazy(() => import("./pages/Community.tsx"));
const ReferralLanding = lazy(() => import("./pages/ReferralLanding.tsx"));
// import About from "./pages/About.tsx";
// import Market from "./pages/Market.tsx";
// import Photos from "./pages/Photos.tsx";
// import Members from "./pages/Members.tsx";
// import Heros from "./pages/Heros.tsx";
// import Article from "./pages/Article.tsx";
// import Contact from "./pages/Contact.tsx";
// import Account from "./pages/Account.tsx";
// import NotFound from "./pages/NotFound.tsx";

setupGlobalErrorHandling();

const RouterLayout = () => {
  return (
    <Configuration>
      <Provider store={store}>
        <WalletProvider>
          <AuthProvider>
            <SnackbarProvider>
              <Layout>
                <Suspense fallback={<Loadscreen />}>
                  <Outlet />
                </Suspense>
                <ReferralHandler />
              </Layout>
            </SnackbarProvider>
          </AuthProvider>
        </WalletProvider>
      </Provider>
    </Configuration>
  );
};

const router = createBrowserRouter([
  {
    path: "/",
    element: <RouterLayout />,

    errorElement: (
      <ErrorBoundary>
        <NotFound />
      </ErrorBoundary>
    ),
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: "/login",
        element: <Login />,
      },
      {
        path: "/auth/google",
        element: <AuthCallback />,
      },
      // {
      //   path: "/api/v1/auth/google/callback",
      //   element: <GoogleCallback />,
      // },
      {
        element: <ProtectedRoute />,
        children: [
          {
            path: "/account",
            element: <Account />,
          },
          {
            path: "/notifications",
            element: <Notifications />,
          },
          {
            path: "/trades/viewtrades",
            element: <ViewTrade />,
          },
          {
            path: "/trades/buy/:productId",
            element: <BuyCheckout />,
          },
          {
            path: "/trades/sell/:productId",
            element: <SellCheckout />,
          },
          {
            path: "/trades/viewtrades/:tradeId",
            element: <ViewTradeDetail />,
          },
          {
            path: "/orders/:orderId",
            element: <ViewOrderDetail />,
          },
        ],
      },

      {
        path: "/product",
        element: <Product />,
      },
      {
        path: "/product/category/:categoryName",
        element: <Product />,
      },
      {
        path: "/product/:productId",
        element: <SingleProduct />,
      },
      {
        path: "/trades",
        element: <Trade />,
      },
      {
        path: "/community",
        element: <Community />,
      },
      {
        path: "/referral",
        element: <ReferralLanding />,
      },
      {
        path: "/load",
        element: <Loadscreen />,
      },

      // {
      //   path: "/member/:id",
      //   element: <Members />,
      // },
      // {
      //   path: "/heros",
      //   element: <Heros />,
      // },
      // {
      //   path: "/article",
      //   element: <Article />,
      // },
      // {
      //   path: "/article/:id",
      //   element: <Article />,
      // },
      // {
      //   path: "/contact",
      //   element: <Contact />,
      // },
      // {

      {
        path: "*",
        element: <NotFound />,
      },
    ],
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
