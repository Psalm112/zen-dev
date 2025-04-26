import { FC, ReactNode } from "react";
import { motion } from "framer-motion";
import Container from "../../common/Container";
import Title from "../../common/Title";
import { Link } from "react-router-dom";

interface CheckoutLayoutProps {
  title: string;
  to?: string;
  children: ReactNode;
}

const CheckoutLayout: FC<CheckoutLayoutProps> = ({ title, to, children }) => {
  return (
    <div className="bg-Dark min-h-screen text-white">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-fit mx-auto"
        >
          {to ? (
            <Link to={to}>
              <Title text={title} className="text-center my-8 text-3xl" />
            </Link>
          ) : (
            <Title text={title} className="text-center my-8 text-3xl" />
          )}
        </motion.div>
        {children}
      </Container>
    </div>
  );
};

export default CheckoutLayout;
