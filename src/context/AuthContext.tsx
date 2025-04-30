// import {
//   createContext,
//   useContext,
//   useState,
//   useEffect,
//   ReactNode,
// } from "react";
// import { jwtDecode } from "jwt-decode";

// interface User {
//   id: string;
//   email: string;
//   name?: string;
//   avatar?: string;
// }

// interface JwtPayload {
//   sub: string;
//   email: string;
//   name?: string;
//   exp: number;
// }

// interface AuthContextType {
//   user: User | null;
//   isAuthenticated: boolean;
//   isLoading: boolean;
//   login: (provider: string) => void;
//   handleAuthCallback: (token: string, userData: any) => void;
//   logout: () => void;
//   getToken: () => string | null;
// }

// const AuthContext = createContext<AuthContextType | undefined>(undefined);

// const storage = localStorage;

// export const AuthProvider = ({ children }: { children: ReactNode }) => {
//   const [user, setUser] = useState<User | null>(null);
//   const [isLoading, setIsLoading] = useState(true);

//   useEffect(() => {
//     const checkAuthStatus = async () => {
//       try {
//         const token = storage.getItem("auth_token");

//         if (token) {
//           // Verify token hasn't expired
//           try {
//             const decoded = jwtDecode<JwtPayload>(token);
//             const currentTime = Date.now() / 1000;

//             if (decoded.exp < currentTime) {
//               // Token expired
//               storage.removeItem("auth_token");
//               setUser(null);
//             } else {
//               // Valid token, set user
//               const userData: User = {
//                 id: decoded.sub,
//                 email: decoded.email,
//                 name: decoded.name,
//               };

//               setUser(userData);
//             }
//           } catch (error) {
//             console.error("Invalid token:", error);
//             storage.removeItem("auth_token");
//           }
//         }
//       } catch (error) {
//         console.error("Error checking auth status:", error);
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     checkAuthStatus();
//   }, []);

//   const login = (provider: string) => {
//     const API_URL = import.meta.env.VITE_API_URL;

//     if (provider === "google") {
//       window.location.href = `${API_URL}/auth/google`;
//     }
//   };

//   const handleAuthCallback = (token: string, userData: User) => {
//     storage.setItem("auth_token", token);
//     setUser(userData);
//   };

//   const logout = () => {
//     storage.removeItem("auth_token");
//     setUser(null);
//   };

//   const getToken = (): string | null => {
//     return storage.getItem("auth_token");
//   };

//   const value = {
//     user,
//     isAuthenticated: !!user,
//     isLoading,
//     login,
//     handleAuthCallback,
//     logout,
//     getToken,
//   };

//   return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
// };

// export const useAuth = () => {
//   const context = useContext(AuthContext);
//   if (context === undefined) {
//     throw new Error("useAuth must be used within an AuthProvider");
//   }
//   return context;
// };

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { jwtDecode } from "jwt-decode";
import { UserProfile } from "../utils/types";

// interface User {
//   id: string;
//   email: string;
//   name?: string;
//   avatar?: string;
//   googleId?: string;
//   profileImage?: string;
// }

interface JwtPayload {
  sub: string;
  email: string;
  name?: string;
  exp: number;
  id?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (provider: string) => void;
  handleAuthCallback: (token: string, userData: any) => void;
  logout: () => void;
  getToken: () => string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const storage = localStorage;
const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const token = storage.getItem(TOKEN_KEY);
        const storedUser = storage.getItem(USER_KEY);

        if (token && storedUser) {
          // Verify token hasn't expired
          try {
            const decoded = jwtDecode<JwtPayload>(token);
            const currentTime = Date.now() / 1000;

            if (decoded.exp < currentTime) {
              clearAuthState();
            } else {
              setUser(JSON.parse(storedUser));
            }
          } catch (error) {
            console.error("Invalid token:", error);
            clearAuthState();
          }
        }
      } catch (error) {
        console.error("Error checking auth status:", error);
        clearAuthState();
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const clearAuthState = () => {
    storage.removeItem(TOKEN_KEY);
    storage.removeItem(USER_KEY);
    setUser(null);
  };

  const login = (provider: string) => {
    const API_URL = import.meta.env.VITE_API_URL;
    const FRONTEND_URL = window.location.origin;

    if (provider === "google") {
      storage.setItem("auth_redirect", window.location.pathname);
      //localhost:5177/auth/google?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4MTIyZWRlMzVjODBlYzc0NWVjMzE4OSIsImVtYWlsIjoic2VhN2FtQGdtYWlsLmNvbSIsImlhdCI6MTc0NjAyMjExMCwiZXhwIjoxNzQ2NjI2OTEwfQ.gduRlRRSopEfh9cBPb7gw5rEICkM2XlT-gnfEAoHpdg&userId=68122ede35c80ec745ec3189

      window.location.href = `${API_URL}/auth/google?frontend=${FRONTEND_URL}`;
    }
  };

  const handleAuthCallback = (token: string, userData: UserProfile) => {
    storage.setItem(TOKEN_KEY, token);
    storage.setItem(USER_KEY, JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    clearAuthState();
  };

  const getToken = (): string | null => {
    return storage.getItem(TOKEN_KEY);
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    handleAuthCallback,
    logout,
    getToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("Error from useAuth");
  }
  return context;
};
