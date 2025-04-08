import { useState } from "react";
import Container from "./Container";
import { HiOutlineBell, HiMenu, HiX } from "react-icons/hi";
import { Avatar, Mainlogo } from "../pages";
import { Link, NavLink, useLocation } from "react-router-dom";

const NavList = [
  { title: "Home", path: "/" },
  { title: "Product", path: "/product" },
  { title: "Trade", path: "/trade" },
  { title: "Community", path: "/community" },
  { title: "Account", path: "/account" },
];

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <header className="w-full py-3 bg-[#212428] shadow-md sticky top-0 z-50">
      <Container className="flex items-center justify-between py-0">
        <Link to="/" className="flex items-center">
          <img src={Mainlogo} className="w-[35px]" alt="Dezennmart" />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-10">
          {NavList.map(({ title, path }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `font-semibold text-md transition-colors ${
                  isActive ? "text-Red" : "text-[#545456] hover:text-Red"
                }`
              }
            >
              {title}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <button
            aria-label="Notifications"
            className="hover:opacity-80 transition-opacity"
          >
            <HiOutlineBell className="text-xl text-white" />
          </button>
          <Link to="/account">
            <img
              src={Avatar}
              alt="User profile"
              className="w-8 h-8 rounded-full"
            />
          </Link>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-white"
            onClick={toggleMobileMenu}
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <HiX size={24} /> : <HiMenu size={24} />}
          </button>
        </div>
      </Container>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-[60px] left-0 right-0 bg-[#212428] shadow-lg z-40">
          <div className="flex flex-col p-4">
            {NavList.map(({ title, path }) => (
              <NavLink
                key={path}
                to={path}
                className={`py-3 px-4 font-semibold text-md ${
                  location.pathname === path ? "text-Red" : "text-[#545456]"
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {title}
              </NavLink>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
