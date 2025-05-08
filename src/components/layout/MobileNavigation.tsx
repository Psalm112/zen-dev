import { NavLink } from "react-router-dom";
import { AiOutlineHome } from "react-icons/ai";
import { BiPackage } from "react-icons/bi";
import { IoSwapHorizontalOutline } from "react-icons/io5";
import { BsPeople } from "react-icons/bs";
import { RiUser3Line } from "react-icons/ri";
import { useAppSelector } from "../../utils/hooks/redux";
import { selectTotalUnreadMessages } from "../../store/selectors/chatSelectors";
import { IoChatbubbleOutline } from "react-icons/io5";

const MobileNavigation = () => {
  const totalUnreadChats = useAppSelector(selectTotalUnreadMessages);
  const navItems = [
    { icon: <AiOutlineHome size={24} />, label: "Home", path: "/" },
    { icon: <BiPackage size={24} />, label: "Product", path: "/product" },
    {
      icon: <IoSwapHorizontalOutline size={24} />,
      label: "Trade",
      path: "/trades",
    },
    {
      icon: <IoChatbubbleOutline size={24} />,
      label: "Chat",
      path: "/chat",
      badge: totalUnreadChats > 0 ? totalUnreadChats : undefined,
    },
    { icon: <BsPeople size={24} />, label: "Community", path: "/community" },
    { icon: <RiUser3Line size={24} />, label: "Account", path: "/account" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#212428] flex justify-evenly items-center px-4 py-2 sm:hidden z-50">
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) => `
            flex flex-col items-center text-xs p-2
            ${isActive ? "text-Red" : "text-[#545456]"}
          `}
        >
          {item.icon}
          <span className="mt-1">{item.label}</span>
          {item.badge && (
            <span className="absolute top-1 right-0 bg-Red text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center">
              {item.badge > 9 ? "9+" : item.badge}
            </span>
          )}
        </NavLink>
      ))}
    </div>
  );
};

export default MobileNavigation;
