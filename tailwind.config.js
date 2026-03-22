import typography from "@tailwindcss/typography";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Fraunces", "Georgia", "serif"],
        body: ["\"Source Serif 4\"", "Georgia", "serif"],
        ui: ["\"Source Sans 3\"", "system-ui", "sans-serif"],
      },
      colors: {
        paper: {
          DEFAULT: "var(--paper)",
          dark: "var(--paper-dark)",
        },
        ink: {
          DEFAULT: "var(--ink)",
          light: "var(--ink-light)",
        },
        clay: {
          DEFAULT: "var(--clay)",
          light: "var(--clay-light)",
        },
        sun: "var(--sun)",
        sage: "var(--sage)",
        dusk: "var(--dusk)",
        blush: "var(--blush)",
        line: {
          DEFAULT: "var(--line)",
          strong: "var(--line-strong)",
        },
      },
      boxShadow: {
        soft: "0 12px 30px -18px rgba(26, 20, 16, 0.35)",
        lift: "0 20px 50px -30px rgba(26, 20, 16, 0.35)",
        glow: "0 0 30px -5px rgba(166, 93, 53, 0.25)",
        inner: "inset 0 2px 4px rgba(26, 20, 16, 0.06)",
      },
      backgroundImage: {
        papergrain:
          "radial-gradient(circle at 1px 1px, rgba(70, 50, 35, 0.06) 1px, transparent 0)",
        warmglow:
          "radial-gradient(1200px 600px at 20% -10%, rgba(226, 196, 168, 0.45), transparent 60%), radial-gradient(800px 400px at 90% 0%, rgba(205, 164, 126, 0.28), transparent 65%)",
      },
      animation: {
        floatIn: "floatIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        rise: "rise 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        fadeIn: "fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "slide-up": "slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards",
      },
      keyframes: {
        floatIn: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        rise: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        pulse: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      transitionTimingFunction: {
        "ease-out-expo": "cubic-bezier(0.16, 1, 0.3, 1)",
        "ease-in-out-expo": "cubic-bezier(0.65, 0, 0.35, 1)",
      },
      transitionDuration: {
        250: "250ms",
        400: "400ms",
      },
    },
  },
  plugins: [typography],
};
