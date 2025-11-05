import type { Config } from "tailwindcss";

const config: Config = {
  // Use class-based dark mode so toggling the `.dark` class updates Tailwind variants
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
};

export default config;
