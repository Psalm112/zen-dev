import { motion } from "framer-motion";
import { LiaAngleLeftSolid } from "react-icons/lia";
import {
  RiEdit2Fill,
  RiContactsBookFill,
  RiShieldKeyholeFill,
  RiShieldUserFill,
  RiKey2Fill,
  RiQuestionFill,
  RiLogoutBoxRFill,
} from "react-icons/ri";

interface SettingItemProps {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  delay: number;
}

const SettingItem = ({ icon, label, onClick, delay }: SettingItemProps) => {
  return (
    <motion.button
      className="flex items-center gap-4 w-full px-4 py-3 hover:bg-[#3A3A3C] rounded-lg"
      onClick={onClick}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.3 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="bg-Red p-2 rounded-full">{icon}</div>
      <span className="text-white">{label}</span>
    </motion.button>
  );
};

const Settings = ({
  showSettings,
}: {
  showSettings: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const settingSections = [
    {
      items: [
        {
          icon: <RiEdit2Fill className="text-white" />,
          label: "Edit Profile",
          delay: 0.1,
        },
        {
          icon: <RiContactsBookFill className="text-white" />,
          label: "Contacts",
          delay: 0.2,
        },
      ],
    },
    {
      items: [
        {
          icon: <RiShieldKeyholeFill className="text-white" />,
          label: "Privacy",
          delay: 0.3,
        },
        {
          icon: <RiShieldUserFill className="text-white" />,
          label: "Safety",
          delay: 0.4,
        },
        {
          icon: <RiKey2Fill className="text-white" />,
          label: "Two-Factor Authentication",
          delay: 0.5,
        },
      ],
    },
    {
      items: [
        {
          icon: <RiQuestionFill className="text-white" />,
          label: "Help",
          delay: 0.6,
        },
        {
          icon: <RiShieldUserFill className="text-white" />,
          label: "Safety",
          delay: 0.7,
        },
        {
          icon: <RiLogoutBoxRFill className="text-white" />,
          label: "Log Out",
          delay: 0.8,
        },
      ],
    },
  ];

  return (
    <motion.div
      className="mt-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex gap-10 mb-4">
        <motion.button
          aria-label="Settings"
          className="hover:opacity-80 transition-opacity"
          // whileHover={{ rotate: 90 }}
          transition={{ type: "spring", stiffness: 300 }}
          onClick={() => showSettings(false)}
        >
          <LiaAngleLeftSolid className="text-white text-2xl" />
        </motion.button>
        <h3 className="text-white text-4xl font-semibold">Settings</h3>
      </div>

      {settingSections.map((section, sectionIndex) => (
        <motion.div
          key={sectionIndex}
          className="bg-[#292B30] rounded-lg mb-4 py-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: sectionIndex * 0.1 }}
        >
          {section.items.map((item) => (
            <SettingItem
              key={item.label}
              icon={item.icon}
              label={item.label}
              delay={item.delay}
            />
          ))}
        </motion.div>
      ))}
    </motion.div>
  );
};

export default Settings;
