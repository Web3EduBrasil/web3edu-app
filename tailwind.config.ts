import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        /* ── Cores de marca (estáticas) ── */
        cyellow: "#F6D87E",
        dyellow: "#F0BB20",
        ccblue: "#F5F7FD",
        cblue: "#41648D",
        blue: "#1A4476",
        dblue: "#123053",
        ddblue: "#102948",
        cgreen: "#7EC8A0",
        green: "#7EC8A0",
        dgreen: "#21A16B",
        ddgreen: "#17714B",
        dddgreen: "#146241",

        /* ── Cores de tema (mudam com light/dark via CSS vars) ── */
        neutralbg: "rgb(var(--neutralbg) / <alpha-value>)",
        neutral: "rgb(var(--neutral) / <alpha-value>)",
        gray: "rgb(var(--gray) / <alpha-value>)",
        dgray: "rgb(var(--dgray) / <alpha-value>)",
        cgray: "rgb(var(--cgray) / <alpha-value>)",
        ccgray: "rgb(var(--ccgray) / <alpha-value>)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [require("daisyui"), require("@tailwindcss/typography")],
  daisyui: {
    themes: ["light", "dark"],
  },
  darkMode: ["selector", '[data-theme="dark"]'],
};
export default config;
