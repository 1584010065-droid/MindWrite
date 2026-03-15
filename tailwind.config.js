import typography from "@tailwindcss/typography";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Fraunces", "serif"],
        body: ["\"Source Serif 4\"", "serif"],
        ui: ["\"Source Sans 3\"", "sans-serif"],
      },
      colors: {
        paper: "var(--paper)",
        ink: "var(--ink)",
        clay: "var(--clay)",
        sun: "var(--sun)",
        sage: "var(--sage)",
        dusk: "var(--dusk)",
        blush: "var(--blush)",
        line: "var(--line)",
      },
      boxShadow: {
        soft: "0 12px 30px -18px rgba(33, 24, 19, 0.45)",
        lift: "0 20px 50px -30px rgba(33, 24, 19, 0.45)",
      },
      backgroundImage: {
        papergrain:
          "radial-gradient(circle at 1px 1px, rgba(70, 50, 35, 0.08) 1px, transparent 0)",
        warmglow:
          "radial-gradient(1200px 600px at 20% -10%, rgba(226, 196, 168, 0.55), transparent 60%), radial-gradient(800px 400px at 90% 0%, rgba(205, 164, 126, 0.35), transparent 65%)",
      },
      animation: {
        floatIn: "floatIn 0.8s ease-out forwards",
        rise: "rise 0.7s ease-out forwards",
      },
      keyframes: {
        floatIn: {
          "0%": { opacity: 0, transform: "translateY(16px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        rise: {
          "0%": { opacity: 0, transform: "translateY(24px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [typography],
};
