import { MdOutlineStar } from "react-icons/md";
import { BiSolidQuoteRight } from "react-icons/bi";

const CustomerReviews = () => {
  const reviews = [
    {
      id: 1,
      text: "I can't thank this app enough for saving me during busy days. The variety of restaurants is outstanding, and the discounts are a nice bonus. The app is user-friendly, and the delivery is consistently punctual.",
      name: "Bessie Cooper",
      date: "Jan 24, 2024",
      rating: 5.0,
    },
    {
      id: 2,
      text: "I can't thank this app enough for saving me during busy days. The variety of restaurants is outstanding, and the discounts are a nice bonus.",
      name: "Bessie Cooper",
      date: "Jan 24, 2024",
      rating: 5.0,
    },
  ];

  return (
    <div className="text-gray-400 px-3 sm:px-6 md:px-12 lg:px-20 py-3 sm:py-5">
      {reviews.map((review) => (
        <div
          key={review.id}
          className="bg-[#212428] p-3 sm:p-4 md:p-6 rounded-lg mb-3 sm:mb-4"
        >
          <BiSolidQuoteRight className="text-white text-lg sm:text-xl mb-2 sm:mb-3" />
          <p className="text-xs sm:text-sm md:text-base">"{review.text}"</p>
          <div className="flex items-center justify-between my-3 sm:my-4 flex-wrap gap-2">
            <div>
              <h6 className="font-medium text-white text-sm sm:text-base">
                {review.name}
              </h6>
              <span className="text-xs text-[#6D6D6D]">
                Order {review.date}
              </span>
            </div>
            <div className="flex items-center bg-[#2f3137] shadow-xl px-2 py-1 rounded-md">
              <MdOutlineStar className="text-Red mr-1" />
              <span className="text-white text-sm">{review.rating}</span>
            </div>
          </div>
        </div>
      ))}

      <div className="mt-4 text-center">
        <button className="text-Red hover:underline text-sm sm:text-base transition-colors">
          View more reviews
        </button>
      </div>
    </div>
  );
};

export default CustomerReviews;
