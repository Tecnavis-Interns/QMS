import { nextui } from "@nextui-org/react";
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        customPurple: '#805DF6',
      },
      zIndex: {
        '-1': '-1',
      }
    },
  },
  darkMode: "class",
  plugins: [nextui(),
    require('tailwind-scrollbar-hide'),
  ]
}