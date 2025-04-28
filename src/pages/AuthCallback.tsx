import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Loadscreen from "./Loadscreen";

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { handleAuthCallback } = useAuth();
  const [error, setError] = useState<string | null>(null);

  //   useEffect(() => {
  //     const processAuth = async () => {
  //       try {
  //         const token = searchParams.get("token");
  //         const userData = searchParams.get("user");

  //         if (!token || !userData) {
  //           throw new Error("Authentication failed: Missing token or user data");
  //         }

  //         const parsedUserData = JSON.parse(decodeURIComponent(userData));

  //         handleAuthCallback(token, parsedUserData);

  //         navigate("/", { replace: true });
  //       } catch (err) {
  //         console.error("Auth callback error:", err);
  //         setError(err instanceof Error ? err.message : "Authentication failed");
  //       }
  //     };

  //     processAuth();
  //   }, [searchParams, handleAuthCallback, navigate]);

  useEffect(() => {
    const processAuth = async () => {
      try {
        const token = searchParams.get("token");
        const userData = searchParams.get("user");

        if (!token || !userData) {
          throw new Error("Authentication failed: Missing token or user data");
        }

        console.log("Raw userData:", userData);

        let parsedUserData;
        try {
          parsedUserData = JSON.parse(decodeURIComponent(userData));
        } catch (parseErr) {
          console.error("Parse error:", parseErr);
          try {
            parsedUserData = JSON.parse(userData);
          } catch {
            throw new Error("Failed to parse user data");
          }
        }
        console.log(parsedUserData);
        handleAuthCallback(token, parsedUserData);
        navigate("/", { replace: true });
      } catch (err) {
        console.error("Auth callback error:", err);
        setError(err instanceof Error ? err.message : "Authentication failed");
      }
    };

    processAuth();
  }, [searchParams, handleAuthCallback, navigate]);

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

  return <Loadscreen />;
};

export default AuthCallback;

// import { useEffect, useState } from "react";
// import { useNavigate, useSearchParams } from "react-router-dom";
// import { useAuth } from "../context/AuthContext";
// import Loadscreen from "./Loadscreen";

// const AuthCallback = () => {
//   const [searchParams] = useSearchParams();
//   const navigate = useNavigate();
//   const { handleAuthCallback } = useAuth();
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     const processAuth = async () => {
//       try {
//         const token = searchParams.get("token");
//         const userData = searchParams.get("user");

//         if (!token || !userData) {
//           throw new Error("Authentication failed: Missing token or user data");
//         }

//         // Debug the raw data
//         console.log("Processing auth callback with token:", token);
//         console.log("Processing auth callback with userData:", userData);

//         // Try different parsing approaches
//         let parsedUserData;
//         try {
//           // First try normal JSON parse
//           parsedUserData = JSON.parse(userData);
//         } catch (parseError) {
//           console.error("First parse attempt failed:", parseError);

//           try {
//             // Try decoding URL encoding first
//             parsedUserData = JSON.parse(decodeURIComponent(userData));
//           } catch (decodeError) {
//             console.error("Second parse attempt failed:", decodeError);

//             // Last resort - try to handle the string directly
//             // This is a fallback if the data is malformed
//             try {
//               // For the case where the JSON is double-encoded
//               parsedUserData = JSON.parse(
//                 decodeURIComponent(decodeURIComponent(userData))
//               );
//             } catch (finalError) {
//               console.error("All parsing attempts failed:", finalError);
//               throw new Error("Failed to parse user data");
//             }
//           }
//         }

//         console.log("Successfully parsed user data:", parsedUserData);

//         // Store auth data
//         handleAuthCallback(token, parsedUserData);

//         // Redirect to previous page or home
//         const redirectPath = localStorage.getItem("auth_redirect") || "/";
//         localStorage.removeItem("auth_redirect"); // Clean up
//         navigate(redirectPath, { replace: true });
//       } catch (err) {
//         console.error("Auth callback error:", err);
//         setError(err instanceof Error ? err.message : "Authentication failed");
//       }
//     };

//     processAuth();
//   }, [searchParams, handleAuthCallback, navigate]);

//   if (error) {
//     return (
//       <div className="flex flex-col items-center justify-center h-screen bg-Dark">
//         <div className="bg-[#292B30] p-8 rounded-lg shadow-lg max-w-md w-full">
//           <h2 className="text-Red text-2xl font-bold mb-4">
//             Authentication Error
//           </h2>
//           <p className="text-white mb-6">{error}</p>
//           <button
//             onClick={() => navigate("/login")}
//             className="bg-Red text-white px-4 py-2 rounded hover:bg-opacity-90 transition-all w-full"
//           >
//             Back to Login
//           </button>
//         </div>
//       </div>
//     );
//   }

//   return <Loadscreen />;
// };

// export default AuthCallback;
