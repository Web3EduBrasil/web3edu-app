import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [
    require('daisyui'),
  ],
  daisyui: {
    themes: [
      {
        mytheme: {
          "primary": "#21a16b",
          "secondary": "#1a4476",
          "accent": "#f0bb20",
          "neutral": "#1a4476",
          "base-100": "#ffffff",
          "info": "#1a4476",
          "success": "#21a16b",
          "warning": "#f0bb20",
          "error": "#ff0000",
        },
      },
    ],
  },
};
export default config;
