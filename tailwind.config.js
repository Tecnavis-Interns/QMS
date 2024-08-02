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
      },
      animation: {
        'ping-slow': 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite',
      },
      keyframes: {
        ping: {
          '75%, 100%': {
            transform: 'scale(1.5)',
            opacity: '0',
          },
        },
      },
    },
  },
  variants: {
    extend: {
      animation: ['responsive', 'motion-safe', 'motion-reduce'],
    },
  },
  darkMode: "class",
  plugins: [nextui(),
    require('tailwind-scrollbar-hide'),
    function ({ addUtilities, theme, variants }) {
      const animationDelayUtilities = {
        '.animation-delay-300': { animationDelay: '300ms' },
      };
      addUtilities(animationDelayUtilities, variants('animationDelay'));
    },
  ]
}