import { useState, useRef, useEffect } from "react";
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
import { useWallet } from "../../context/WalletContext";

const NavList = [
  { title: "Home", path: "/" },
  { title: "Product", path: "/product" },
  { title: "Trade", path: "/trades" },
  // { title: "Chat", path: "/chat" },
  { title: "Community", path: "/community" },
];

const Header = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const { isConnected, account, disconnect } = useWallet();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showWallet, setShowWallet] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { unreadCount, fetchUserUnreadCount } = useNotifications();
  const { loadConversations, totalUnreadMessages } = useChat();

  // Shortened address for wallet display
  const shortenedAddress = account
    ? `${account.slice(0, 4)}...${account.slice(-3)}`
    : "";

  useEffect(() => {
    const fetchData = (silent = false) => {
      fetchUserUnreadCount(false, silent);
      loadConversations(false, silent);
    };

    // Initial load
    fetchData();

    const interval = setInterval(() => fetchData(true), 30000);

    return () => clearInterval(interval);
  }, [fetchUserUnreadCount, loadConversations]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await disconnect();
      logout();
      navigate("/");
      setShowUserMenu(false);
    } catch (err) {
      console.error("Error during logout:", err);
    }
  };

  return (
    <header className="w-full py-2 md:py-3 bg-[#212428] shadow-md sticky top-0 z-50">
      <Container className="flex items-center justify-between py-0">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center group transition-transform hover:scale-105"
          aria-label="DezenMart Home"
        >
          <div className="w-8 h-8 md:w-9 md:h-9 relative overflow-hidden">
            <img
              src={FullLogo}
              className="w-full md:hidden transition-transform group-hover:scale-110 object-cover object-[25%_25%]"
              alt="dezenmart logo"
            />
            <img
              src={Logo}
              className="w-full hidden md:block transition-transform group-hover:scale-110 object-cover object-[25%_25%]"
              alt="dezenmart logo"
            />
          </div>
          <span className="ml-2 text-white font-medium hidden md:inline transition-opacity group-hover:opacity-90">
            DezenMart
          </span>
        </Link>

        {/* Desktop Navigation - more responsive breakpoints */}
        <nav className="hidden md:flex items-center max-lg:gap-4 lg:gap-8 xl:gap-10">
          {NavList.map(({ title, path }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `font-semibold text-sm lg:text-md transition-all relative ${
                  isActive
                    ? "text-Red after:content-[''] after:absolute after:bottom-[-6px] after:left-0 after:w-full after:h-0.5 after:bg-Red after:rounded-full"
                    : "text-[#545456] hover:text-white"
                }`
              }
            >
              {title}
              {title === "Chat" && totalUnreadMessages > 0 && (
                <span
                  className="absolute -top-2 -right-4 bg-Red text-white text-xs rounded-full h-5 w-5 flex items-center justify-center"
                  aria-label={`${totalUnreadMessages} unread messages`}
                >
                  {totalUnreadMessages > 9 ? "9+" : totalUnreadMessages}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Right Actions - more responsive */}
        <div className="flex items-center gap-2 md:gap-3">
          <CurrencyToggle />

          {/* Wallet button - simplified on smaller screens */}
          <button
            onClick={() => setShowWallet(true)}
            className="flex items-center gap-1 md:gap-1.5 bg-[#292B30] text-white px-2 md:px-3 py-1.5 rounded-md hover:bg-[#33363b] transition-all"
            aria-label={isConnected ? "Wallet connected" : "Connect wallet"}
          >
            <BiWallet className="text-lg" />
            <span className="text-xs md:text-sm font-medium hidden xs:inline">
              {isConnected ? shortenedAddress : "Connect"}
            </span>
          </button>

          {isAuthenticated ? (
            <>
              <button
                aria-label={`Notifications ${
                  unreadCount > 0 ? ", " + unreadCount + " unread" : ""
                }`}
                className="p-1.5 rounded-full hover:bg-[#292B30] transition-colors relative"
                onClick={() => navigate("/notifications")}
              >
                <HiOutlineBell className="text-xl text-white" />
                <NotificationBadge count={unreadCount} />
              </button>

              {/* User menu dropdown */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="focus:outline-none focus:ring-2 focus:ring-Red focus:ring-opacity-50 rounded-full"
                  aria-expanded={showUserMenu}
                  aria-haspopup="true"
                  aria-label="User menu"
                >
                  <img
                    src={
                      typeof user?.profileImage === "string"
                        ? user?.profileImage
                        : `https://avatar.iran.liara.run/username?username=[${
                            user?.name?.split(" ")[0] || ""
                          }+${user?.name?.split(" ")[1] || ""}]`
                    }
                    alt=""
                    className="w-8 h-8 rounded-full ring-2 ring-[#292B30] hover:ring-Red transition-all"
                  />
                </button>

                {showUserMenu && (
                  <div
                    className="absolute right-0 mt-2 w-48 bg-[#212428] rounded-md shadow-lg py-1 z-50 border border-[#292B30]"
                    role="menu"
                    aria-orientation="vertical"
                  >
                    <Link
                      to="/account"
                      className="block px-4 py-2 text-sm text-white hover:bg-[#292B30]"
                      onClick={() => setShowUserMenu(false)}
                      role="menuitem"
                    >
                      My Account
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-[#292B30]"
                      role="menuitem"
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
              className="bg-Red text-white px-2 md:pl-2 md:pr-3 py-1.5 md:py-2 rounded-md hover:bg-opacity-90 transition-all"
              onClick={() => navigate("/login")}
              icon={<BiLogIn className="text-lg" />}
              iconPosition="start"
              aria-label="Sign in"
            />
          )}
        </div>
      </Container>

      {/* Connect wallet modal */}
      {showWallet && (
        <Modal onClose={() => setShowWallet(false)} isOpen>
          <ConnectWallet showAlternatives />
        </Modal>
      )}
    </header>
  );
};

export default Header;
