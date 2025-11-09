/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
   theme: {
     extend: {
       keyframes: {
         "pulse-signal": {
           "0%, 100%": { opacity: "0.3", transform: "scale(0.9)" },
           "50%": { opacity: "0.8", transform: "scale(1.3)" },
         },
       },
       animation: {
         "pulse-signal": "pulse-signal 1.8s ease-in-out infinite",
       },
     },
   },
  plugins: [],
}
