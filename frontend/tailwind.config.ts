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
        background: "#0F1117",
        surface: "#1A1D27",
        accent: "#6366F1",
        success: "#10B981",
        warning: "#F59E0B",
        danger: "#EF4444",
        foreground: "#F1F5F9",
        border: "#2E3347", // added for borders
      },
    },
  },
  plugins: [],
};
export default config;
