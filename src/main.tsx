import { lazy, StrictMode, Suspense } from "react";
import "./index.css";
import { createBrowserRouter, Outlet, RouterProvider } from "react-router-dom";
import { createRoot } from "react-dom/client";
import Layout from "./ui/Layout.tsx";
import { Configuration } from "@react-md/layout";

const Login = lazy(() => import("./pages/Login.tsx"));
const Home = lazy(() => import("./pages/Home.tsx"));
const Product = lazy(() => import("./pages/Product.tsx"));
const SingleProduct = lazy(() => import("./pages/SingleProduct.tsx"));
const Account = lazy(() => import("./pages/Account.tsx"));
// import About from "./pages/About.tsx";
// import Market from "./pages/Market.tsx";
// import Photos from "./pages/Photos.tsx";
// import Members from "./pages/Members.tsx";
// import Heros from "./pages/Heros.tsx";
// import Article from "./pages/Article.tsx";
// import Contact from "./pages/Contact.tsx";
// import Account from "./pages/Account.tsx";
// import NotFound from "./pages/NotFound.tsx";

const RouterLayout = () => {
  return (
    <Configuration>
      <Layout>
        <Suspense
          fallback={
            <div className="bg-Dark min-h-screen flex items-center justify-center text-white">
              Loading...
            </div>
          }
        >
          <Outlet />
        </Suspense>
      </Layout>
    </Configuration>
  );
};

const router = createBrowserRouter([
  {
    path: "/",
    element: <RouterLayout />,
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
        path: "/account",
        element: <Account />,
      },
      {
        path: "/product",
        element: <Product />,
      },
      {
        path: "/single-product/:id",
        element: <SingleProduct />,
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
      //   path: "/account",
      //   element: <Account />,
      // },
      // {
      //   path: "",
      //   element: <NotFound />,
      // },
    ],
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
