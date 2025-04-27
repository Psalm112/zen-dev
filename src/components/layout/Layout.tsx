import Header from "./Header.tsx";
import Footer from "./Footer.tsx";
import MobileNavigation from "./MobileNavigation.tsx";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const isAuthPage = ["/login", "/load"].includes(location.pathname);

  const navigate = useNavigate();

  useEffect(() => {
    // Check if this is a redirect from Google auth
    if (location.pathname === "/auth/google/callback") {
      // Extract token from URL if present
      const params = new URLSearchParams(location.search);
      const token = params.get("token");
      const userData = params.get("user");

      if (token && userData) {
        // Redirect to our auth callback handler
        navigate(
          `/auth-callback?token=${token}&user=${encodeURIComponent(userData)}`,
          { replace: true }
        );
      } else {
        // Something went wrong, redirect to login
        navigate("/login", { replace: true });
      }
    }
  }, [location, navigate]);

  return (
    <>
      {!isAuthPage && <Header />}
      <main className="min-h-screen pb-16 md:pb-0">{children}</main>
      {!isAuthPage && (
        <>
          <MobileNavigation />
          <Footer />
        </>
      )}
    </>
  );
};

export default Layout;
