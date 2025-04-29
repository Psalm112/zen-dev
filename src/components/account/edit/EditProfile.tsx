import { motion } from "framer-motion";
import { LiaAngleLeftSolid } from "react-icons/lia";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import ProfilePicture from "../ProfilePicture";
import ProfileField from "./ProfileField";
import PhoneInput from "./PhoneInput";
import DatePickerField from "./DatePickerField";
import Button from "../../common/Button";
import { BsPlus } from "react-icons/bs";
import { IoCloseOutline } from "react-icons/io5";
import { useAppDispatch } from "../../../utils/hooks/redux";
import { useSnackbar } from "../../../context/SnackbarContext";
import { updateUserProfile } from "../../../store/slices/userSlice";

// Validation schema
const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters long"),
  dob: z
    .string()
    .regex(/^\d{2}\/\d{2}\/\d{4}$/, "Invalid date format (MM/DD/YYYY)"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Please enter a valid phone number"),
});

// Shipping address schema
const shippingAddressSchema = z.object({
  addressLine1: z.string().min(5, "Address must be at least 5 characters long"),
  addressLine2: z.string().optional(),
  city: z.string().min(2, "City must be at least 2 characters long"),
  state: z.string().min(2, "State must be at least 2 characters long"),
  zipCode: z.string().min(5, "Zip code must be at least 5 characters long"),
  country: z.string().min(2, "Country must be at least 2 characters long"),
});

type ProfileFormData = z.infer<typeof profileSchema>;
type ShippingAddressFormData = z.infer<typeof shippingAddressSchema>;

interface EditProfileProps {
  avatar: string;
  showEditProfile: React.Dispatch<React.SetStateAction<boolean>>;
  currentProfile: {
    name: string;
    dob: string;
    email: string;
    phone: string;
  };
}

const EditProfile: React.FC<EditProfileProps> = ({
  avatar,
  showEditProfile,
  currentProfile,
}) => {
  const dispatch = useAppDispatch();
  const { showSnackbar } = useSnackbar();
  const [countryCode, setCountryCode] = useState("US");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState({
    day: 1,
    month: "January",
    year: 1988,
  });
  const [addresses, setAddresses] = useState([
    "19, amore street, Ikeja, Lagos",
    "Plot VI, Ogudu GRA, Ogudu, Lagos",
  ]);
  const [showAddressForm, setShowAddressForm] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: currentProfile,
  });

  const {
    register: registerAddress,
    handleSubmit: handleSubmitAddress,
    formState: { errors: addressErrors },
    reset: resetAddressForm,
  } = useForm<ShippingAddressFormData>({
    resolver: zodResolver(shippingAddressSchema),
    defaultValues: {
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      zipCode: "",
      country: "Nigeria",
    },
  });

  const onDateSelect = (day: number, month: string, year: number) => {
    setSelectedDate({ day, month, year });
    // Format date as MM/DD/YYYY for form submission
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    const monthNum = months.indexOf(month) + 1;
    const formattedDate = `${monthNum.toString().padStart(2, "0")}/${day
      .toString()
      .padStart(2, "0")}/${year}`;
    setValue("dob", formattedDate);
    setShowDatePicker(false);
  };

  const onSubmit = async (data: ProfileFormData) => {
    console.log("Profile data submitted:", data);
    try {
      await dispatch(updateUserProfile(data)).unwrap();
      showSnackbar("Profile updated successfully", "success");
      showEditProfile(false);
    } catch (error) {
      showSnackbar((error as string) || "Failed to update profile", "error");
    }
  };

  const onAddressSubmit = (data: ShippingAddressFormData) => {
    const formattedAddress = `${data.addressLine1}${
      data.addressLine2 ? ", " + data.addressLine2 : ""
    }, ${data.city}, ${data.state}, ${data.zipCode}, ${data.country}`;
    setAddresses([...addresses, formattedAddress]);
    setShowAddressForm(false);
    resetAddressForm();
  };

  return (
    <motion.div
      className="mt-4 relative"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center gap-4 mb-8">
        <motion.button
          aria-label="Back to Profile"
          className="hover:opacity-80 transition-opacity"
          transition={{ type: "spring", stiffness: 300 }}
          onClick={() => showEditProfile(false)}
          whileHover={{ x: -3 }}
          whileTap={{ scale: 0.95 }}
        >
          <LiaAngleLeftSolid className="text-white text-2xl" />
        </motion.button>
        <h3 className="text-white text-2xl font-semibold">Edit Profile</h3>
      </div>

      <motion.form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-4"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        <ProfilePicture avatar={avatar} />

        <div className="space-y-4 mt-6">
          <ProfileField
            label=""
            icon="person"
            placeholder="Full Name"
            register={register("name")}
            error={errors.name?.message}
            delay={0.2}
          />

          <DatePickerField
            register={register("dob")}
            error={errors.dob?.message}
            showDatePicker={showDatePicker}
            setShowDatePicker={setShowDatePicker}
            selectedDate={selectedDate}
            onDateSelect={onDateSelect}
            delay={0.3}
          />

          <ProfileField
            label=""
            icon="email"
            placeholder="Email Address"
            register={register("email")}
            error={errors.email?.message}
            delay={0.4}
          />

          <PhoneInput
            register={register("phone")}
            error={errors.phone?.message}
            countryCode={countryCode}
            setCountryCode={setCountryCode}
            delay={0.5}
          />

          <motion.div
            className="mt-6 flex flex-col gap-y-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <h4 className="text-white font-medium">Shipping Addresses</h4>
            <div className="flex flex-col gap-y-3 w-full">
              {addresses.map((address, index) => (
                <div
                  key={index}
                  className="flex flex-col items-start w-full bg-[#292B30] border border-white/20 rounded text-white px-6 py-4 transition-colors hover:bg-[#343539]"
                >
                  <p className="w-full">{address}</p>
                </div>
              ))}
            </div>

            {showAddressForm ? (
              <motion.div
                className="bg-[#292B30] border border-white/20 rounded p-5 mt-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-white font-medium">Add New Address</h4>
                  <button
                    type="button"
                    onClick={() => setShowAddressForm(false)}
                    className="text-white/80 hover:text-white"
                  >
                    <IoCloseOutline className="w-6 h-6" />
                  </button>
                </div>

                <form
                  onSubmit={handleSubmitAddress(onAddressSubmit)}
                  className="flex flex-col gap-3"
                >
                  <div className="flex flex-col gap-1">
                    <input
                      {...registerAddress("addressLine1")}
                      placeholder="Address Line 1"
                      className="bg-[#212428] border border-white/20 rounded px-4 py-3 text-white placeholder:text-white/50 focus:outline-none focus:border-white/40"
                    />
                    {addressErrors.addressLine1 && (
                      <span className="text-Red text-sm">
                        {addressErrors.addressLine1.message}
                      </span>
                    )}
                  </div>

                  <input
                    {...registerAddress("addressLine2")}
                    placeholder="Address Line 2 (Optional)"
                    className="bg-[#212428] border border-white/20 rounded px-4 py-3 text-white placeholder:text-white/50 focus:outline-none focus:border-white/40"
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <input
                        {...registerAddress("city")}
                        placeholder="City"
                        className="bg-[#212428] border border-white/20 rounded px-4 py-3 text-white placeholder:text-white/50 focus:outline-none focus:border-white/40"
                      />
                      {addressErrors.city && (
                        <span className="text-Red text-sm">
                          {addressErrors.city.message}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col gap-1">
                      <input
                        {...registerAddress("state")}
                        placeholder="State"
                        className="bg-[#212428] border border-white/20 rounded px-4 py-3 text-white placeholder:text-white/50 focus:outline-none focus:border-white/40"
                      />
                      {addressErrors.state && (
                        <span className="text-Red text-sm">
                          {addressErrors.state.message}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <input
                        {...registerAddress("zipCode")}
                        placeholder="Zip Code"
                        className="bg-[#212428] border border-white/20 rounded px-4 py-3 text-white placeholder:text-white/50 focus:outline-none focus:border-white/40"
                      />
                      {addressErrors.zipCode && (
                        <span className="text-Red text-sm">
                          {addressErrors.zipCode.message}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col gap-1">
                      <input
                        {...registerAddress("country")}
                        placeholder="Country"
                        className="bg-[#212428] border border-white/20 rounded px-4 py-3 text-white placeholder:text-white/50 focus:outline-none focus:border-white/40"
                      />
                      {addressErrors.country && (
                        <span className="text-Red text-sm">
                          {addressErrors.country.message}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="mt-2 bg-Red text-white py-3 rounded font-medium hover:bg-[#e02d37] transition-colors"
                  >
                    Save Address
                  </button>
                </form>
              </motion.div>
            ) : (
              <Button
                title="Add More Shipping address"
                className="flex justify-between items-center w-full md:w-fit md:ml-auto bg-[#292B30] border border-white/20 rounded text-white px-6 py-4 transition-colors hover:bg-[#343539]"
                onClick={() => setShowAddressForm(true)}
                icon={<BsPlus className="w-6 h-6" />}
              />
            )}
          </motion.div>

          <motion.div
            className="mt-8 mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            <button
              type="submit"
              className="w-full bg-Red text-white py-3 rounded font-medium hover:bg-[#e02d37] transition-colors"
            >
              Update
            </button>
          </motion.div>
        </div>
      </motion.form>
    </motion.div>
  );
};

export default EditProfile;
