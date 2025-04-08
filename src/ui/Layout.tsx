// import Header from "./Header.tsx"
// import Footer from "./Footer.tsx"
// import { useLocation } from "react-router-dom";

// const Layout = ({ children }: { children: React.ReactNode }) => {

//     const location = useLocation();

//     return (
//         <>
//             {location.pathname != "/login" && "/load" ? <Header /> : ""}
//             {children}
//             {location.pathname == "/login" && "/load" ? "" : <Footer />}
//         </>
//     );
// };

// export default Layout;

import Header from "./Header.tsx";
import Footer from "./Footer.tsx";
import { useLocation } from "react-router-dom";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const isAuthPage = ["/login", "/load"].includes(location.pathname);

  return (
    <>
      {!isAuthPage && <Header />}
      <main className="min-h-screen">{children}</main>
      {!isAuthPage && <Footer />}
    </>
  );
};

export default Layout;
