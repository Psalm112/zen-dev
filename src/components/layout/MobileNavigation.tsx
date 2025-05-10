// import { NavLink } from "react-router-dom";
// import { AiOutlineHome } from "react-icons/ai";
// import { BiPackage } from "react-icons/bi";
// import { IoSwapHorizontalOutline } from "react-icons/io5";
// import { BsPeople } from "react-icons/bs";
// import { RiUser3Line } from "react-icons/ri";
// import { IoChatbubbleOutline } from "react-icons/io5";
// import { useChat } from "../../utils/hooks/useChat";
// import { useEffect } from "react";

// const MobileNavigation = () => {
//   const { loadConversations, totalUnreadMessages } = useChat();

//   useEffect(() => {
//     loadConversations();

//     const interval = setInterval(() => {
//       loadConversations(false, true);
//     }, 60000);

//     return () => clearInterval(interval);
//   }, [loadConversations]);

//   const navItems = [
//     { icon: <AiOutlineHome size={24} />, label: "Home", path: "/" },
//     { icon: <BiPackage size={24} />, label: "Product", path: "/product" },
//     {
//       icon: <IoSwapHorizontalOutline size={24} />,
//       label: "Trade",
//       path: "/trades",
//     },
//     {
//       icon: <IoChatbubbleOutline size={24} />,
//       label: "Chat",
//       path: "/chat",
//       badge: totalUnreadMessages > 0 ? totalUnreadMessages : undefined,
//     },
//     { icon: <BsPeople size={24} />, label: "Community", path: "/community" },
//     { icon: <RiUser3Line size={24} />, label: "Account", path: "/account" },
//   ];

//   return (
//     <div className="fixed bottom-0 left-0 right-0 bg-[#212428] flex justify-evenly items-center px-4 py-2 sm:hidden z-50">
//       {navItems.map((item) => (
//         <NavLink
//           key={item.path}
//           to={item.path}
//           className={({ isActive }) => `
//             relative flex flex-col items-center text-xs p-2
//             ${isActive ? "text-Red" : "text-[#545456]"}
//           `}
//         >
//           {item.icon}
//           <span className="mt-1">{item.label}</span>
//           {item.badge && (
//             <span className="absolute top-1 right-0 bg-Red text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center">
//               {item.badge > 9 ? "9+" : item.badge}
//             </span>
//           )}
//         </NavLink>
//       ))}
//     </div>
//   );
// };

// export default MobileNavigation;

import { memo } from "react";
import { NavLink } from "react-router-dom";
import { AiOutlineHome } from "react-icons/ai";
import { BiPackage } from "react-icons/bi";
import { IoSwapHorizontalOutline } from "react-icons/io5";
import { BsPeople } from "react-icons/bs";
import { RiUser3Line } from "react-icons/ri";
import { IoChatbubbleOutline } from "react-icons/io5";
import { useChat } from "../../utils/hooks/useChat";

const navItems = [
  { icon: <AiOutlineHome size={22} />, label: "Home", path: "/" },
  { icon: <BiPackage size={22} />, label: "Product", path: "/product" },
  {
    icon: <IoSwapHorizontalOutline size={22} />,
    label: "Trade",
    path: "/trades",
  },
  {
    icon: <IoChatbubbleOutline size={22} />,
    label: "Chat",
    path: "/chat",
    badgeKey: "totalUnreadMessages",
  },
  { icon: <BsPeople size={22} />, label: "Community", path: "/community" },
  { icon: <RiUser3Line size={22} />, label: "Account", path: "/account" },
];

const MobileNavigation = () => {
  const { totalUnreadMessages } = useChat();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#212428] flex justify-evenly items-center px-2 py-1.5 sm:hidden z-50 border-t border-[#292B30]">
      {navItems.map((item) => {
        const badge =
          item.badgeKey === "totalUnreadMessages"
            ? totalUnreadMessages
            : undefined;
        return (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              relative flex flex-col items-center text-xs p-1.5
              ${isActive ? "text-Red" : "text-[#545456]"}
            `}
            aria-label={item.label + (badge ? ` (${badge} unread)` : "")}
          >
            {item.icon}
            <span className="mt-0.5 text-[10px]">{item.label}</span>
            {badge && badge > 0 && (
              <span className="absolute top-0 right-0 bg-Red text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center">
                {badge > 9 ? "9+" : badge}
              </span>
            )}
          </NavLink>
        );
      })}
    </nav>
  );
};

export default memo(MobileNavigation);
