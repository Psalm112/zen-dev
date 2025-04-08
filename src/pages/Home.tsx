import { Link } from "react-router-dom";
import { Browseproduct, Mywallet, Pen, Pen2, Trackorder } from ".";
import Container from "../ui/Container";
import ProductList from "../ui/ProductList";

const Home = () => {
  const quickActions = [
    {
      icon: Browseproduct,
      title: "Browse Products",
      path: "/product",
    },
    {
      icon: Trackorder,
      title: "Track Order",
      path: "/account",
    },
    {
      icon: Mywallet,
      title: "My Wallet",
      path: "/wallet",
    },
  ];

  return (
    <div className="bg-Dark min-h-screen">
      <Container className="">
        <h4 className="text-[20px] text-white mb-0">Welcome, Joe.</h4>
        <span className="text-[#C6C6C8] text-[13px]">
          What would you like to do today?
        </span>

        {/* Quick action buttons */}
        <div className="flex flex-wrap justify-center md:justify-start mt-12 md:mt-20 gap-6 md:gap-10">
          {quickActions.map((action, index) => (
            <Link
              key={index}
              to={action.path}
              className="flex flex-col items-center justify-center gap-3 group transition-transform hover:scale-105"
            >
              <span className="bg-[#292B30] rounded-full p-6 md:p-8 flex items-center justify-center transition-colors group-hover:bg-[#333]">
                <img src={action.icon} alt="" className="w-[24px] h-[24px]" />
              </span>
              <h3 className="text-[#AEAEB2] text-lg group-hover:text-white transition-colors">
                {action.title}
              </h3>
            </Link>
          ))}
        </div>

        <div className="flex justify-between items-center px-4 bg-Red rounded-lg mt-16 md:mt-28 overflow-hidden">
          <h5 className="text-white text-lg md:text-xl p-4">
            Smart Ecommerce for{" "}
            <span className="uppercase font-bold">creators</span>
          </h5>
          <div className="flex items-center justify-center">
            <img
              src={Pen}
              alt=""
              className="w-[70px] h-[70px] md:w-[90px] md:h-[90px]"
            />
            <img
              src={Pen2}
              alt=""
              className="w-[50px] h-[50px] md:w-[69px] md:h-[67px]"
            />
          </div>
        </div>

        <ProductList
          title="Featured Product"
          path="/product"
          className="mt-10"
        />
      </Container>
    </div>
  );
};

export default Home;
