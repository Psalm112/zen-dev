import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import CheckoutLayout from "../components/trade/checkout/CheckoutLayout";
import ProductInfo from "../components/trade/checkout/ProductInfo";
import PaymentMethod from "../components/trade/checkout/PaymentMethod";
import TransactionInfo from "../components/trade/checkout/TransactionInfo";
import { Product } from "../utils/types";

const BuyCheckout = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [product, setProduct] = useState<Product | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(190);
  const [paymentMethod, setPaymentMethod] = useState<string>("crypto");

  // future: fetch from API based on productId
  useEffect(() => {
    const fetchProduct = async () => {
      setTimeout(() => {
        // Sample data
        const productData: Product = {
          id: productId || "1",
          name: "Car",
          image: "/images/product1.svg",
          price: "₦1,200",
          quantity: "100 Cars",
          minCost: "1M - 20M NGN",
          description: "A wine Benz",
          orders: 129,
          rating: 99,
          seller: "DanBike",
          paymentDuration: "18Min(s)",
        };

        setProduct(productData);
        setIsLoading(false);
      }, 600);
    };

    fetchProduct();
  }, [productId]);

  const handleBuy = () => {
    //purchase logic
    console.log("Purchase initiated for:", product);
    console.log("Payment amount:", paymentAmount);
    console.log("Payment method:", paymentMethod);

    // success message
    // process the payment then redirect
    setTimeout(() => {
      navigate("/trades/viewtrades"); // Redirect to view trades page
    }, 1000);
  };

  if (isLoading || !product) {
    return (
      <CheckoutLayout title="Buy Car">
        <div className="flex justify-center items-center min-h-[50vh]">
          <motion.div
            className="w-16 h-16 border-4 border-Red border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        </div>
      </CheckoutLayout>
    );
  }

  return (
    <CheckoutLayout title={`Buy ${product.name}`} to="/trades/viewtrades">
      <div className="max-w-4xl mx-auto">
        <ProductInfo product={product} />

        <PaymentMethod onMethodChange={setPaymentMethod} />

        <motion.div
          className="mt-6 bg-[#292B30] rounded-lg p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="flex justify-between items-center">
            <span className="text-red-400">I will buy: 190 usdt</span>
            <div className="flex space-x-2">
              <button className="bg-[#212428] px-3 py-1 rounded-md">
                USDT
              </button>
              <button className="bg-Red text-white px-3 py-1 rounded-md">
                ALL
              </button>
            </div>
          </div>

          <div className="mt-6">
            <input
              type="number"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(Number(e.target.value))}
              className="w-full bg-[#212428] text-white p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-Red"
            />
          </div>

          <motion.button
            className="w-full bg-Red text-white py-4 rounded-md mt-6 font-medium"
            onClick={handleBuy}
            whileHover={{ backgroundColor: "#e02d37" }}
            whileTap={{ scale: 0.98 }}
          >
            BUY
          </motion.button>

          <p className="text-sm text-[#AEAEB2] mt-4 text-center">
            If there is a risk, the withdrawals may be delayed by up to 24
            hours.
          </p>
        </motion.div>
        <motion.div
          className="mt-6 bg-[#292B30] rounded-lg p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="mt-6 p-4 rounded-md">
            <h4 className="font-medium mb-3">Advertiser Terms</h4>
            <p className="text-sm text-[#AEAEB2]">
              If you are seeing my ad, I'm active.
              <br />
              If there is kobo in your amount, make sure you pay it fully.
              <br />
              No telling payers to cancel time.
              <br />
              Please leave me a review.
              <br />
              Thanks. Don't pay with flutter wave or pocket app.
            </p>
          </div>
        </motion.div>

        <TransactionInfo
          sellerName="Femi Cole"
          rating={88}
          completedOrders={456}
          completionRate={99}
          avgPaymentTime="20 Minute(s)"
        />
      </div>
    </CheckoutLayout>
  );
};

export default BuyCheckout;
