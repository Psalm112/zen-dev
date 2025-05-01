import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useUserManagement } from "../utils/hooks/useUserManagement";
import Loadscreen from "./Loadscreen";

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { handleAuthCallback } = useAuth();
  const { fetchUserById } = useUserManagement();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const processAuth = async () => {
      try {
        const token = searchParams.get("token");
        const userId = searchParams.get("userId");

        console.log("Auth callback received:", {
          token: token?.substring(0, 10) + "...",
          userId,
        });

        if (!token || !userId) {
          throw new Error("Authentication failed: Missing token or user ID");
        }

        localStorage.setItem("auth_token", token);
        setTimeout(() => {
          // Use the API directly with the token already in localStorage
          import("../utils/services/apiService").then(({ api }) => {
            api.getUserProfile(true).then((response) => {
              if (response) {
                // handleAuthCallback(token, response.data);
                // const redirectPath = "/";
                // localStorage.removeItem("auth_redirect");
                // navigate(redirectPath, { replace: true });
                console.log("Complete user profile loaded", response);
              }
            });
          });
        }, 100);

        // const success = await fetchUserById(userId, false);

        // if (!success) {
        //   throw new Error("Failed to fetch user data");
        // }

        // setTimeout(() => {
        //   handleAuthCallback(token, selectedUser);

        //   const redirectPath = "/";
        //   // localStorage.removeItem("auth_redirect");
        //   navigate(redirectPath, { replace: true });
        // }, 100);
      } catch (err) {
        console.error("Auth callback error:", err);
        setError(err instanceof Error ? err.message : "Authentication failed");
        setIsProcessing(false);
      }
    };

    processAuth();
  }, [searchParams, navigate, handleAuthCallback, fetchUserById]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-Dark">
        <div className="bg-[#292B30] p-8 rounded-lg shadow-lg max-w-md w-full">
          <h2 className="text-Red text-2xl font-bold mb-4">
            Authentication Error
          </h2>
          <p className="text-white mb-6">{error}</p>
          <button
            onClick={() => navigate("/login")}
            className="bg-Red text-white px-4 py-2 rounded hover:bg-opacity-90 transition-all w-full"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  if (isProcessing) {
    return <Loadscreen />;
  }

  return null;
};

export default AuthCallback;
