// import { useState, useRef, useEffect } from "react";
// import { HiOutlineBell } from "react-icons/hi";
// import { BiLogIn, BiWallet } from "react-icons/bi";
// import { FullLogo, Logo } from "../../pages";
// import { Link, NavLink, useNavigate } from "react-router-dom";
// import Container from "../common/Container";
// import { useNotifications } from "../../utils/hooks/useNotifications";
// import NotificationBadge from "../notifications/NotificationBadge";
// import { useAuth } from "../../context/AuthContext";
// import Button from "../common/Button";
// import Modal from "../common/Modal";
// import ConnectWallet from "../trade/ConnectWallet";
// import { useChat } from "../../utils/hooks/useChat";
// import CurrencyToggle from "../common/CurrencyToggle";
// import { useWallet } from "../../context/WalletContext";

// const NavList = [
//   { title: "Home", path: "/" },
//   { title: "Product", path: "/product" },
//   { title: "Trade", path: "/trades" },
//   // { title: "Chat", path: "/chat" },
//   { title: "Community", path: "/community" },
// ];

// const Header = () => {
//   const navigate = useNavigate();
//   const { user, isAuthenticated, logout } = useAuth();
//   const { isConnected, account, disconnect } = useWallet();
//   const [showUserMenu, setShowUserMenu] = useState(false);
//   const [showWallet, setShowWallet] = useState(false);
//   const userMenuRef = useRef<HTMLDivElement>(null);
//   const { unreadCount, fetchUserUnreadCount } = useNotifications();
//   const { loadConversations, totalUnreadMessages } = useChat();

//   // Shortened address for wallet display
//   const shortenedAddress = account
//     ? `${account.slice(0, 4)}...${account.slice(-3)}`
//     : "";

//   useEffect(() => {
//     const fetchData = (silent = false) => {
//       fetchUserUnreadCount(false, silent);
//       loadConversations(false, silent);
//     };

//     // Initial load
//     fetchData();

//     const interval = setInterval(() => fetchData(true), 30000);

//     return () => clearInterval(interval);
//   }, [fetchUserUnreadCount, loadConversations]);

//   useEffect(() => {
//     const handleClickOutside = (event: MouseEvent) => {
//       if (
//         userMenuRef.current &&
//         !userMenuRef.current.contains(event.target as Node)
//       ) {
//         setShowUserMenu(false);
//       }
//     };

//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   const handleLogout = async () => {
//     try {
//       await disconnect();
//       logout();
//       navigate("/");
//       setShowUserMenu(false);
//     } catch (err) {
//       console.error("Error during logout:", err);
//     }
//   };

//   return (
//     <header className="w-full py-2 md:py-3 bg-[#212428] shadow-md sticky top-0 z-50">
//       <Container className="flex items-center justify-between py-0">
//         {/* Logo */}
//         <Link
//           to="/"
//           className="flex items-center group transition-transform hover:scale-105"
//           aria-label="DezenMart Home"
//         >
//           <div className="w-8 h-8 md:w-9 md:h-9 relative overflow-hidden">
//             <img
//               src={FullLogo}
//               className="w-full md:hidden transition-transform group-hover:scale-110 object-cover object-[25%_25%]"
//               alt="dezenmart logo"
//             />
//             <img
//               src={Logo}
//               className="w-full hidden md:block transition-transform group-hover:scale-110 object-cover object-[25%_25%]"
//               alt="dezenmart logo"
//             />
//           </div>
//           <span className="ml-2 text-white font-medium hidden md:inline transition-opacity group-hover:opacity-90">
//             DezenMart
//           </span>
//         </Link>

//         {/* Desktop Navigation - more responsive breakpoints */}
//         <nav className="hidden md:flex items-center max-lg:gap-4 lg:gap-8 xl:gap-10">
//           {NavList.map(({ title, path }) => (
//             <NavLink
//               key={path}
//               to={path}
//               className={({ isActive }) =>
//                 `font-semibold text-sm lg:text-md transition-all relative ${
//                   isActive
//                     ? "text-Red after:content-[''] after:absolute after:bottom-[-6px] after:left-0 after:w-full after:h-0.5 after:bg-Red after:rounded-full"
//                     : "text-[#545456] hover:text-white"
//                 }`
//               }
//             >
//               {title}
//               {title === "Chat" && totalUnreadMessages > 0 && (
//                 <span
//                   className="absolute -top-2 -right-4 bg-Red text-white text-xs rounded-full h-5 w-5 flex items-center justify-center"
//                   aria-label={`${totalUnreadMessages} unread messages`}
//                 >
//                   {totalUnreadMessages > 9 ? "9+" : totalUnreadMessages}
//                 </span>
//               )}
//             </NavLink>
//           ))}
//         </nav>

//         {/* Right Actions - more responsive */}
//         <div className="flex items-center gap-2 md:gap-3">
//           <CurrencyToggle />

//           {/* Wallet button - simplified on smaller screens */}
//           <button
//             onClick={() => setShowWallet(true)}
//             className="flex items-center gap-1 md:gap-1.5 bg-[#292B30] text-white px-2 md:px-3 py-1.5 rounded-md hover:bg-[#33363b] transition-all"
//             aria-label={isConnected ? "Wallet connected" : "Connect wallet"}
//           >
//             <BiWallet className="text-lg" />
//             <span className="text-xs md:text-sm font-medium hidden xs:inline">
//               {isConnected ? shortenedAddress : "Connect"}
//             </span>
//           </button>

//           {isAuthenticated ? (
//             <>
//               <button
//                 aria-label={`Notifications ${
//                   unreadCount > 0 ? ", " + unreadCount + " unread" : ""
//                 }`}
//                 className="p-1.5 rounded-full hover:bg-[#292B30] transition-colors relative"
//                 onClick={() => navigate("/notifications")}
//               >
//                 <HiOutlineBell className="text-xl text-white" />
//                 <NotificationBadge count={unreadCount} />
//               </button>

//               {/* User menu dropdown */}
//               <div className="relative" ref={userMenuRef}>
//                 <button
//                   onClick={() => setShowUserMenu(!showUserMenu)}
//                   className="focus:outline-none focus:ring-2 focus:ring-Red focus:ring-opacity-50 rounded-full"
//                   aria-expanded={showUserMenu}
//                   aria-haspopup="true"
//                   aria-label="User menu"
//                 >
//                   <img
//                     src={
//                       typeof user?.profileImage === "string"
//                         ? user?.profileImage
//                         : `https://avatar.iran.liara.run/username?username=[${
//                             user?.name?.split(" ")[0] || ""
//                           }+${user?.name?.split(" ")[1] || ""}]`
//                     }
//                     alt=""
//                     className="w-8 h-8 rounded-full ring-2 ring-[#292B30] hover:ring-Red transition-all"
//                   />
//                 </button>

//                 {showUserMenu && (
//                   <div
//                     className="absolute right-0 mt-2 w-48 bg-[#212428] rounded-md shadow-lg py-1 z-50 border border-[#292B30]"
//                     role="menu"
//                     aria-orientation="vertical"
//                   >
//                     <Link
//                       to="/account"
//                       className="block px-4 py-2 text-sm text-white hover:bg-[#292B30]"
//                       onClick={() => setShowUserMenu(false)}
//                       role="menuitem"
//                     >
//                       My Account
//                     </Link>
//                     <button
//                       onClick={handleLogout}
//                       className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-[#292B30]"
//                       role="menuitem"
//                     >
//                       Sign Out
//                     </button>
//                   </div>
//                 )}
//               </div>
//             </>
//           ) : (
//             <Button
//               title="Sign In"
//               className="bg-Red text-white px-2 md:pl-2 md:pr-3 py-1.5 md:py-2 rounded-md hover:bg-opacity-90 transition-all"
//               onClick={() => navigate("/login")}
//               icon={<BiLogIn className="text-lg" />}
//               iconPosition="start"
//               aria-label="Sign in"
//             />
//           )}
//         </div>
//       </Container>

//       {/* Connect wallet modal */}
//       {showWallet && (
//         <Modal onClose={() => setShowWallet(false)} isOpen>
//           <ConnectWallet
//           // showAlternatives
//           />
//         </Modal>
//       )}
//     </header>
//   );
// };

// export default Header;

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { HiOutlineBell } from "react-icons/hi";
import { BiLogIn, BiWallet } from "react-icons/bi";
import { FullLogo, Logo } from "../../pages";
import { Link, NavLink, useNavigate } from "react-router-dom";
import Container from "../common/Container";
import { useNotifications } from "../../utils/hooks/useNotifications";
import NotificationBadge from "../notifications/NotificationBadge";
import { useAuth } from "../../context/AuthContext";
import Button from "../common/Button";
import Modal from "../common/Modal";
import ConnectWallet from "../trade/ConnectWallet";
import { useChat } from "../../utils/hooks/useChat";
import CurrencyToggle from "../common/CurrencyToggle";
import { useWallet, useWalletBalance } from "../../context/WalletContext";

const NavList = [
  { title: "Home", path: "/" },
  { title: "Product", path: "/product" },
  { title: "Trade", path: "/trades" },
  // { title: "Chat", path: "/chat" },
  { title: "Community", path: "/community" },
] as const;

const Header = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const {
    account,
    isConnected,
    isConnecting,
    walletType,
    disconnectWallet,
    error: walletError,
    clearError,
  } = useWallet();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showWallet, setShowWallet] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { unreadCount, fetchUserUnreadCount } = useNotifications();
  const { loadConversations, totalUnreadMessages } = useChat();

  // Memoized shortened address for performance
  const shortenedAddress = useMemo(
    () => (account ? `${account.slice(0, 4)}...${account.slice(-3)}` : ""),
    [account]
  );

  // Memoized wallet display text
  const walletDisplayText = useMemo(() => {
    if (isConnecting) return "Connecting...";
    if (isConnected && account) return shortenedAddress;
    return "Connect";
  }, [isConnecting, isConnected, account, shortenedAddress]);

  // Optimized data fetching with error handling
  const fetchData = useCallback(
    async (silent = false) => {
      try {
        await Promise.all([
          fetchUserUnreadCount(false, silent),
          loadConversations(false, silent),
        ]);
      } catch (error) {
        if (!silent) {
          console.error("Failed to fetch header data:", error);
        }
      }
    },
    [fetchUserUnreadCount, loadConversations]
  );

  // Initial data load and polling
  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Click outside handler with performance optimization
  useEffect(() => {
    if (!showUserMenu) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current?.contains(event.target as Node)) return;
      setShowUserMenu(false);
    };

    // Use passive listener for better performance
    document.addEventListener("mousedown", handleClickOutside, {
      passive: true,
    });
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showUserMenu]);

  // Enhanced logout with proper wallet disconnection
  const handleLogout = useCallback(async () => {
    setShowUserMenu(false);

    try {
      // Disconnect wallet first if connected
      if (isConnected) {
        await disconnectWallet();
      }

      // Then logout user
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
      // Force navigation even if logout fails
      navigate("/");
    }
  }, [isConnected, disconnectWallet, logout, navigate]);

  // Wallet button click handler with error management
  const handleWalletClick = useCallback(() => {
    if (walletError) {
      clearError();
    }
    setShowWallet(true);
  }, [walletError, clearError]);

  // Memoized wallet button props for performance
  const walletButtonProps = useMemo(
    () => ({
      onClick: handleWalletClick,
      disabled: isConnecting,
      className: `flex items-center gap-1 md:gap-1.5 bg-[#292B30] text-white px-2 md:px-3 py-1.5 rounded-md transition-all ${
        isConnecting
          ? "opacity-70 cursor-not-allowed"
          : "hover:bg-[#33363b] active:scale-95"
      } ${isConnected ? "ring-1 ring-green-500/30" : ""}`,
      "aria-label": isConnected
        ? `Wallet connected: ${shortenedAddress}`
        : isConnecting
        ? "Connecting wallet..."
        : "Connect wallet",
    }),
    [handleWalletClick, isConnecting, isConnected, shortenedAddress]
  );

  // Memoized user avatar with fallback optimization
  const userAvatarSrc = useMemo(() => {
    if (typeof user?.profileImage === "string" && user.profileImage) {
      return user.profileImage;
    }

    const firstName = user?.name?.split(" ")[0] || "";
    const lastName = user?.name?.split(" ")[1] || "";
    return `https://avatar.iran.liara.run/username?username=[${firstName}+${lastName}]`;
  }, [user?.profileImage, user?.name]);

  return (
    <header className="w-full py-2 md:py-3 bg-[#212428] shadow-md sticky top-0 z-50">
      <Container className="flex items-center justify-between py-0">
        {/* Logo - optimized with better loading */}
        <Link
          to="/"
          className="flex items-center group transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-Red focus:ring-opacity-50 rounded-md"
          aria-label="DezenMart Home"
        >
          <div className="w-8 h-8 md:w-9 md:h-9 relative overflow-hidden">
            <img
              src={FullLogo}
              className="w-full md:hidden transition-transform group-hover:scale-110 object-cover object-[25%_25%]"
              alt="dezenmart logo"
              loading="eager"
              decoding="async"
            />
            <img
              src={Logo}
              className="w-full hidden md:block transition-transform group-hover:scale-110 object-cover object-[25%_25%]"
              alt="dezenmart logo"
              loading="eager"
              decoding="async"
            />
          </div>
          <span className="ml-2 text-white font-medium hidden md:inline transition-opacity group-hover:opacity-90">
            DezenMart
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav
          className="hidden md:flex items-center max-lg:gap-4 lg:gap-8 xl:gap-10"
          role="navigation"
        >
          {NavList.map(({ title, path }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `font-semibold text-sm lg:text-md transition-all relative focus:outline-none focus:ring-2 focus:ring-Red focus:ring-opacity-50 rounded px-1 ${
                  isActive
                    ? "text-Red after:content-[''] after:absolute after:bottom-[-6px] after:left-0 after:w-full after:h-0.5 after:bg-Red after:rounded-full"
                    : "text-[#545456] hover:text-white"
                }`
              }
            >
              {title}
              {/* {title === "Chat" && totalUnreadMessages > 0 && (
                <span
                  className="absolute -top-2 -right-4 bg-Red text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse"
                  aria-label={`${totalUnreadMessages} unread messages`}
                  role="status"
                >
                  {totalUnreadMessages > 9 ? "9+" : totalUnreadMessages}
                </span>
              )} */}
            </NavLink>
          ))}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2 md:gap-3">
          <CurrencyToggle />

          {/* Enhanced Wallet Button */}
          <button {...walletButtonProps}>
            <BiWallet
              className={`text-lg transition-transform ${
                isConnecting ? "animate-pulse" : ""
              }`}
            />
            <span className="text-xs md:text-sm font-medium hidden xs:inline">
              {walletDisplayText}
            </span>
            {walletError && (
              <span
                className="w-2 h-2 bg-red-500 rounded-full animate-pulse"
                aria-label="Wallet error"
              />
            )}
          </button>

          {isAuthenticated ? (
            <>
              {/* Notifications */}
              <button
                aria-label={`Notifications${
                  unreadCount > 0 ? `, ${unreadCount} unread` : ""
                }`}
                className="p-1.5 rounded-full hover:bg-[#292B30] transition-colors relative focus:outline-none focus:ring-2 focus:ring-Red focus:ring-opacity-50"
                onClick={() => navigate("/notifications")}
              >
                <HiOutlineBell className="text-xl text-white" />
                <NotificationBadge count={unreadCount} />
              </button>

              {/* User Menu */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="focus:outline-none focus:ring-2 focus:ring-Red focus:ring-opacity-50 rounded-full transition-transform hover:scale-105 active:scale-95"
                  aria-expanded={showUserMenu}
                  aria-haspopup="true"
                  aria-label="User menu"
                >
                  <img
                    src={userAvatarSrc}
                    alt={`${user?.name || "User"} profile`}
                    className="w-8 h-8 rounded-full ring-2 ring-[#292B30] hover:ring-Red transition-all"
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      // Fallback to initials avatar on error
                      const target = e.target as HTMLImageElement;
                      const initials =
                        user?.name
                          ?.split(" ")
                          .map((n) => n[0])
                          .join("") || "U";
                      target.src = `https://avatar.iran.liara.run/username?username=${initials}`;
                    }}
                  />
                </button>

                {showUserMenu && (
                  <div
                    className="absolute right-0 mt-2 w-48 bg-[#212428] rounded-md shadow-lg py-1 z-50 border border-[#292B30] animate-in fade-in slide-in-from-top-2 duration-200"
                    role="menu"
                    aria-orientation="vertical"
                  >
                    <Link
                      to="/account"
                      className="block px-4 py-2 text-sm text-white hover:bg-[#292B30] transition-colors focus:outline-none focus:bg-[#292B30]"
                      onClick={() => setShowUserMenu(false)}
                      role="menuitem"
                    >
                      My Account
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-[#292B30] transition-colors focus:outline-none focus:bg-[#292B30]"
                      role="menuitem"
                      disabled={isConnecting}
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <Button
              title="Sign In"
              className="bg-Red text-white px-2 md:pl-2 md:pr-3 py-1.5 md:py-2 rounded-md hover:bg-opacity-90 transition-all focus:outline-none focus:ring-2 focus:ring-Red focus:ring-opacity-50 active:scale-95"
              onClick={() => navigate("/login")}
              icon={<BiLogIn className="text-lg" />}
              iconPosition="start"
              aria-label="Sign in"
            />
          )}
        </div>
      </Container>

      {/* Connect Wallet Modal - optimized mounting */}
      {showWallet && (
        <Modal onClose={() => setShowWallet(false)} isOpen={showWallet}>
          <ConnectWallet
          // showAlternatives
          />
        </Modal>
      )}
    </header>
  );
};

export default Header;
