/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",       // Scan your app folder
    "./pages/**/*.{js,ts,jsx,tsx}",     // Optional if using pages folder
    "./components/**/*.{js,ts,jsx,tsx}" // Optional if you have components
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
