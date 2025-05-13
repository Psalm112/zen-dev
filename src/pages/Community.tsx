import { motion } from "framer-motion";
import Container from "../components/common/Container";
import Button from "../components/common/Button";
import { FormEvent, useState } from "react";
import {
  FaFacebookF,
  FaTwitter,
  // FaSnapchatGhost,
  FaInstagram,
  FaLinkedinIn,
  // FaGithub,
} from "react-icons/fa";

const Community = () => {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  const handleSubscribe = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (email.trim()) {
      console.log("Subscribing email:", email);
      setSubscribed(true);
      setEmail("");

      setTimeout(() => {
        setSubscribed(false);
      }, 5000);
    }
  };

  return (
    <div className="bg-Dark min-h-screen flex flex-col">
      <Container className="py-10 md:py-16 flex-grow flex flex-col items-center justify-center">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center w-full max-w-4xl mx-auto"
        >
          <motion.div
            variants={itemVariants}
            className="text-center mb-12 w-full"
          >
            <div className="flex justify-between items-center mb-10">
              <div className="flex-1">
                <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
                  All Good Things
                  <br />
                  Come to Those
                  <br />
                  who Wait...
                </h1>
              </div>
              <div className="hidden md:block">
                <div className="relative w-64 h-64">
                  <div className="bg-[#1E3A56] rounded-full w-full h-full flex items-center justify-center">
                    <div className="rocket-icon">
                      <img
                        src="/path-to-rocket-icon.svg"
                        alt="Rocket"
                        className="w-36 h-36"
                        onError={(e) => {
                          // Fallback if image doesn't load
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <motion.div variants={itemVariants} className="mt-8">
              <p className="text-[#C6C6C8] text-lg mb-10">
                Get notified when it launch
              </p>

              <form onSubmit={handleSubscribe} className="w-full">
                <Button
                  title="Subscribe"
                  className="bg-Red text-white px-12 py-4 rounded-md hover:bg-opacity-90 transition-all w-full sm:w-auto text-center"
                  type="submit"
                />
              </form>
            </motion.div>
          </motion.div>

          <motion.div variants={itemVariants} className="mt-auto w-full">
            <div className="flex justify-center space-x-6 mb-6">
              <SocialIcon icon={<FaFacebookF />} />
              <SocialIcon icon={<FaTwitter />} />
              {/* <SocialIcon icon={<FaSnapchatGhost />} /> */}
              <SocialIcon icon={<FaInstagram />} />
              <SocialIcon icon={<FaLinkedinIn />} />
              {/* <SocialIcon icon={<FaGithub />} /> */}
            </div>
            <p className="text-[#C6C6C8] text-sm text-center">
              © Copyrights Dezenmart| All Rights Reserved
            </p>
          </motion.div>
        </motion.div>
      </Container>
    </div>
  );
};

const SocialIcon = ({ icon }: { icon: React.ReactNode }) => {
  return (
    <motion.a
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      className="w-8 h-8 flex items-center justify-center text-white hover:text-Red transition-colors"
      href="#"
    >
      {icon}
    </motion.a>
  );
};

export default Community;
