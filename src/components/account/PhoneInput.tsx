// import { motion } from "framer-motion";
// import { RiPhoneLine } from "react-icons/ri";
// import { LiaAngleDownSolid } from "react-icons/lia";
// import { useRef, useState } from "react";

// interface PhoneInputProps {
//   register: any;
//   error?: string;
//   countryCode: string;
//   setCountryCode: React.Dispatch<React.SetStateAction<string>>;
//   delay: number;
// }

// const countryCodes = [
//   { code: "US", prefix: "+1", label: "United States" },
//   { code: "CA", prefix: "+1", label: "Canada" },
//   { code: "UK", prefix: "+44", label: "United Kingdom" },
//   { code: "AU", prefix: "+61", label: "Australia" },
//   // Add more countries as needed
// ];

// const PhoneInput: React.FC<PhoneInputProps> = ({
//   register,
//   error,
//   countryCode,
//   setCountryCode,
//   delay,
// }) => {
//   const [isOpen, setIsOpen] = useState(false);
//   const dropdownRef = useRef<HTMLDivElement>(null);

//   const handleClickOutside = (e: MouseEvent) => {
//     if (
//       dropdownRef.current &&
//       !dropdownRef.current.contains(e.target as Node)
//     ) {
//       setIsOpen(false);
//     }
//   };

//   // Set up click outside listener
//   useState(() => {
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => {
//       document.removeEventListener("mousedown", handleClickOutside);
//     };
//   });

//   const selectedCountry =
//     countryCodes.find((c) => c.code === countryCode) || countryCodes[0];

//   return (
//     <motion.div
//       className="flex flex-col"
//       initial={{ opacity: 0, y: 20 }}
//       animate={{ opacity: 1, y: 0 }}
//       transition={{ delay, duration: 0.3 }}
//     >
//       <label className="text-white text-sm mb-2 opacity-80">Phone Number</label>
//       <div className="flex">
//         <div className="relative" ref={dropdownRef}>
//           <motion.button
//             type="button"
//             className="bg-[#292B30] text-white py-3 px-4 rounded-l flex items-center gap-2 min-w-[106px] justify-between"
//             onClick={() => setIsOpen(!isOpen)}
//             whileHover={{ backgroundColor: "#343539" }}
//           >
//             <span>
//               {selectedCountry.prefix} ({selectedCountry.code})
//             </span>
//             <LiaAngleDownSolid
//               className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
//             />
//           </motion.button>

//           {isOpen && (
//             <motion.div
//               className="absolute top-full left-0 mt-1 w-full bg-[#292B30] rounded shadow-lg z-10 max-h-60 overflow-y-auto"
//               initial={{ opacity: 0, y: -10 }}
//               animate={{ opacity: 1, y: 0 }}
//               exit={{ opacity: 0, y: -10 }}
//               transition={{ duration: 0.2 }}
//             >
//               {countryCodes.map((country) => (
//                 <div
//                   key={country.code}
//                   className="py-2 px-4 hover:bg-[#343539] cursor-pointer text-white"
//                   onClick={() => {
//                     setCountryCode(country.code);
//                     setIsOpen(false);
//                   }}
//                 >
//                   {country.prefix} ({country.code}) {country.label}
//                 </div>
//               ))}
//             </motion.div>
//           )}
//         </div>

//         <div className="relative flex-1">
//           <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
//             <RiPhoneLine className="text-gray-400" />
//           </div>
//           <input
//             type="tel"
//             placeholder="Phone number"
//             className={`w-full bg-[#292B30] text-white py-3 pl-10 pr-4 rounded-r ${
//               error ? "border border-red-500" : ""
//             }`}
//             {...register}
//           />
//         </div>
//       </div>

//       {error && (
//         <motion.p
//           className="text-red-500 text-xs mt-1"
//           initial={{ opacity: 0 }}
//           animate={{ opacity: 1 }}
//         >
//           {error}
//         </motion.p>
//       )}
//     </motion.div>
//   );
// };

// export default PhoneInput;

// src/components/account/PhoneInput.tsx - updated
import { motion, AnimatePresence } from "framer-motion";
import { RiPhoneLine } from "react-icons/ri";
import { LiaAngleDownSolid } from "react-icons/lia";
import { useRef, useState, useEffect } from "react";
import { countryCodes } from "../../utils/CountryCodes";

interface PhoneInputProps {
  register: any;
  error?: string;
  countryCode: string;
  setCountryCode: React.Dispatch<React.SetStateAction<string>>;
  delay: number;
}

const PhoneInput: React.FC<PhoneInputProps> = ({
  register,
  error,
  countryCode,
  setCountryCode,
  delay,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleClickOutside = (e: MouseEvent) => {
    if (
      dropdownRef.current &&
      !dropdownRef.current.contains(e.target as Node)
    ) {
      setIsOpen(false);
    }
  };

  // Set up click outside listener
  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const selectedCountry =
    countryCodes.find((c) => c.code === countryCode) || countryCodes[0];

  return (
    <motion.div
      className="flex flex-col"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
    >
      <div className="flex">
        <div className="relative" ref={dropdownRef}>
          <motion.button
            type="button"
            className={`bg-[#292B30] text-white py-3 px-4 rounded-l flex items-center gap-2 min-w-[106px] justify-between border-y border-l ${
              error ? "border-red-500" : "border-white/20"
            }`}
            onClick={() => setIsOpen(!isOpen)}
            whileHover={{ backgroundColor: "#343539" }}
          >
            <span>
              {selectedCountry.prefix} ({selectedCountry.code})
            </span>
            <LiaAngleDownSolid
              className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
            />
          </motion.button>

          <AnimatePresence>
            {isOpen && (
              <motion.div
                className="absolute top-full left-0 mt-1 w-64 bg-[#292B30] rounded shadow-lg z-10 max-h-60 overflow-y-auto"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <div className="py-1">
                  {countryCodes.map((country) => (
                    <div
                      key={country.code}
                      className="py-2 px-4 hover:bg-[#343539] cursor-pointer text-white flex justify-between"
                      onClick={() => {
                        setCountryCode(country.code);
                        setIsOpen(false);
                      }}
                    >
                      <span>{country.label}</span>
                      <span className="text-gray-400">{country.prefix}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="relative flex-1">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
            <RiPhoneLine className="text-gray-400" />
          </div>
          <input
            type="tel"
            placeholder="Phone number"
            className={`w-full bg-[#292B30] text-white py-3 pl-10 pr-4 rounded-r border-y border-r ${
              error ? "border-red-500" : "border-white/20"
            } transition-colors focus:border-white outline-none`}
            {...register}
          />
        </div>
      </div>

      {error && (
        <motion.p
          className="text-red-500 text-xs mt-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {error}
        </motion.p>
      )}
    </motion.div>
  );
};

export default PhoneInput;
