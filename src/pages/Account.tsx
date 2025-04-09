import { RiSettings3Fill, RiVerifiedBadgeFill } from "react-icons/ri";
import { Avatar2, Product1 } from ".";
import Button from "../components/common/Button";
import Container from "../components/common/Container";
import { MdOutlineCheckCircleOutline } from "react-icons/md";
import { LiaAngleDownSolid } from "react-icons/lia";
import { useState } from "react";

type TabType = "1" | "2" | "3";

const Account = () => {
  const [tab, setTab] = useState<TabType>("1");

  return (
    <div className="bg-Dark min-h-screen">
      <Container className="">
        <div className="flex items-center justify-between w-full mb-10">
          <h1 className="text-white font-bold text-xl">Profile</h1>
          <button
            aria-label="Settings"
            className="hover:opacity-80 transition-opacity"
          >
            <RiSettings3Fill className="text-white text-2xl" />
          </button>
        </div>
        <div className="flex flex-col items-center justify-center mt-10">
          <img
            src={Avatar2}
            className="w-[121px] mb-3 rounded-full"
            alt="User profile"
          />
          <h2 className="text-white text-2xl font-bold">Albert Flores</h2>
          <div className="flex items-center justify-center gap-1">
            <h3 className="text-white text-xl my-2">albertflores@mail.com</h3>
            <MdOutlineCheckCircleOutline className="text-[#1FBE42] text-2xl" />
          </div>
          <Button
            title="Edit Profile"
            icon={<LiaAngleDownSolid />}
            path=""
            className="bg-white text-black text-lg font-bold h-11 rounded-none flex justify-center max-w-[650px] w-full border-none outline-none text-center my-2"
          />
        </div>

        <div className="flex bg-[#292B30] items-center gap-8 mt-40 p-2 w-full md:w-[38%] overflow-x-auto scrollbar-hide">
          {[
            { id: "1", label: "Order History" },
            { id: "2", label: "Saved Items" },
            { id: "3", label: "Dispute Center" },
          ].map(({ id, label }) => (
            <button
              key={id}
              className={`${
                tab === id ? "bg-[#FF343F]" : ""
              } text-white rounded-lg px-4 py-2 font-bold whitespace-nowrap`}
              onClick={() => setTab(id as TabType)}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {tab === "1" && (
          <div className="mt-8 space-y-8">
            {Array(2)
              .fill(null)
              .map((_, index) => (
                <div
                  key={index}
                  className="flex flex-col md:flex-row gap-5 items-start md:items-center justify-between bg-[#292B30] p-4 md:p-8"
                >
                  <div className="flex flex-col md:flex-row items-start md:items-center md:justify-center gap-4 md:gap-8 w-full md:w-auto">
                    <img
                      src={Product1}
                      alt="Product"
                      className="w-full md:w-[35%] max-w-[120px]"
                    />
                    <div className="text-white">
                      <h3 className="font-bold text-xl">Vaseline Lotion</h3>
                      <span className="flex items-center gap-2 text-[12px] text-[#AEAEB2]">
                        By DanBike{" "}
                        <RiVerifiedBadgeFill className="text-[#4FA3FF] text-xs" />
                      </span>
                      <h6 className="text-[#AEAEB2] text-[12px]">
                        300 items Bought @0.0002 ETH
                      </h6>
                    </div>
                  </div>
                  <div className="flex flex-col text-white mt-4 md:mt-0">
                    <span className="text-[12px]">
                      Ordered: &nbsp; Jan 20, 2025
                    </span>
                    <span className="text-[12px] my-2">
                      Status:&nbsp;
                      <span
                        className={`p-1 rounded-md ${
                          index === 0 ? "bg-[#62FF0033]" : "bg-[#543A2E]"
                        }`}
                      >
                        {index === 0 ? "In Escrow" : "Shipped"}
                      </span>
                    </span>
                  </div>
                  <Button
                    title="View Details"
                    className="bg-[#ff343f] border-0 rounded-none text-white px-8 md:px-14 py-2 mt-4 md:mt-0 w-full md:w-auto"
                    path=""
                  />
                </div>
              ))}
          </div>
        )}

        {tab === "2" && (
          <div className="flex items-center gap-8 md:gap-48 p-6 md:px-[20%] md:py-10 bg-[#292B30] mt-8 flex-col md:flex-row">
            <img
              src={Product1}
              className="w-[80%] md:w-[40%] h-auto"
              alt="Product"
            />
            <div className="flex flex-col w-full md:w-auto">
              <h3 className="font-bold text-2xl text-white">Vaseline Lotion</h3>
              <span className="flex items-center gap-2 text-[12px] text-[#AEAEB2] mb-6">
                By DanBike{" "}
                <RiVerifiedBadgeFill className="text-[#4FA3FF] text-xs" />
              </span>
              <div className="flex justify-between mb-4">
                <h6 className="text-xs text-white">Dispute Raised:</h6>
                <h6 className="text-xs text-white">Jan 15, 2025</h6>
              </div>
              <div className="flex items-center justify-between mb-4">
                <h6 className="text-xs text-white">Dispute Status:</h6>
                <span className="text-xs text-white p-1 rounded-md bg-[#543A2E]">
                  {" "}
                  Under Review
                </span>
              </div>
              <Button
                title="View Dispute"
                className="bg-[#ff343f] border-0 rounded-none text-white px-8 md:px-24 py-[8px] mt-4 w-full"
                path=""
              />
            </div>
          </div>
        )}

        {tab === "3" && (
          <div className="flex flex-col gap-12 md:gap-24 items-center justify-center px-6 md:px-11 py-12 md:py-24 bg-[#292B30] mt-8">
            <h1 className="text-white text-xl md:text-2xl font-semibold text-center">
              Your wishlist is empty.
            </h1>
            <Button
              title="Browse Products"
              className="bg-[#ff343f] border-0 rounded-none text-white px-8 md:px-14 py-2 w-full md:w-auto"
              path="/product"
            />
          </div>
        )}
      </Container>
    </div>
  );
};

export default Account;
