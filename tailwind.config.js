// @type {import('tailwindcss').Config}

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        Dark: "#212428",
        Red: "#ff343f",
      },
      flex: {
        full: "0 0 100%",
      },
      animation: {
        loading: "loadingAnimation 1.5s infinite linear",
        fadeIn: "fadeIn 0.3s ease-in-out",
      },
      keyframes: {
        loadingAnimation: {
          "0%": { left: "-50%" },
          "100%": { left: "100%" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
