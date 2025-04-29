import { useState, useEffect, lazy, Suspense, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Container from "../components/common/Container";
import ProfileHeader from "../components/account/ProfileHeader";
import TabNavigation from "../components/account/overview/TabNavigation.tsx";
import { LiaAngleDownSolid } from "react-icons/lia";
import Button from "../components/common/Button";
import { useUserProfile } from "../utils/hooks/useUserProfile";
import LoadingSpinner from "../components/common/LoadingSpinner";

const TabContent = lazy(
  () => import("../components/account/overview/TabContent.tsx")
);
const EditProfile = lazy(
  () => import("../components/account/edit/EditProfile")
);
const Settings = lazy(() => import("../components/account/settings/Settings"));
import { Product1 } from ".";
import { TabOption, TabType } from "../utils/types";

const TAB_OPTIONS: TabOption[] = [
  { id: "1", label: "Order History" },
  { id: "2", label: "Saved Items" },
  { id: "3", label: "Dispute Center" },
  { id: "4", label: "Referrals" },
];

const Account = () => {
  const [tab, setTab] = useState<TabType>("1");
  const [showSettings, setShowSettings] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const {
    profile,
    isLoading: isProfileLoading,
    error: profileError,
  } = useUserProfile();
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPageLoading(false);
    }, 600);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [tab]);

  const handleShowEditProfile = useCallback(() => setShowEditProfile(true), []);

  if (isProfileLoading || pageLoading) {
    return (
      <div className="bg-Dark min-h-screen text-white flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="bg-Dark min-h-screen text-white flex items-center justify-center">
        <div className="text-center p-8 bg-[#292B30] rounded-lg">
          <h2 className="text-xl font-bold mb-4">Unable to load profile</h2>
          <p className="text-gray-400 mb-4">{profileError}</p>
          <Button
            title="Retry"
            onClick={() => window.location.reload()}
            className="mx-auto bg-Red hover:bg-[#e02d37] text-white px-6 py-2 rounded-lg transition-colors"
          />
        </div>
      </div>
    );
  }

  const formattedProfile = profile
    ? {
        name: profile.name,
        dob: "",
        email: profile.email,
        phone: "",
      }
    : {
        name: "",
        dob: "",
        email: "",
        phone: "",
      };

  return (
    <div className="bg-Dark min-h-screen text-white">
      <Container className="py-6 md:py-10">
        {showSettings ? (
          <Suspense fallback={<LoadingSpinner />}>
            <Settings
              showSettings={setShowSettings}
              profileData={formattedProfile}
            />
          </Suspense>
        ) : showEditProfile ? (
          <Suspense fallback={<LoadingSpinner />}>
            <EditProfile
              avatar={profile?.profileImage || ""}
              showEditProfile={setShowEditProfile}
              currentProfile={formattedProfile}
            />
          </Suspense>
        ) : (
          profile && (
            <>
              <ProfileHeader
                avatar={profile.profileImage}
                name={profile.name}
                email={profile.email}
                showSettings={setShowSettings}
              />

              <motion.div
                className="w-full max-w-[650px] mx-auto"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Button
                  title="Edit Profile"
                  icon={<LiaAngleDownSolid />}
                  path=""
                  onClick={handleShowEditProfile}
                  className="bg-white text-black text-lg font-bold h-11 rounded-none flex justify-center w-full border-none outline-none text-center my-2 hover:bg-gray-100 transition-colors"
                />
              </motion.div>

              <TabNavigation
                activeTab={tab}
                onTabChange={setTab}
                options={TAB_OPTIONS}
              />

              <AnimatePresence mode="wait">
                <Suspense fallback={<LoadingSpinner />}>
                  <TabContent
                    activeTab={tab}
                    productImage={Product1}
                    milestones={profile.milestones}
                    referralCode={profile.referralCode}
                    referralCount={profile.referralCount}
                    points={{
                      total: profile.totalPoints,
                      available: profile.availablePoints,
                    }}
                  />
                </Suspense>
              </AnimatePresence>
            </>
          )
        )}
      </Container>
    </div>
  );
};

export default Account;
