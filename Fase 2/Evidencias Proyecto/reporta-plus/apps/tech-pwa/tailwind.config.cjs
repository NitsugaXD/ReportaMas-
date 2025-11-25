/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Color base del proyecto
        base: {
          light: "#F7F7FA",
          dark: "#05060A",
        },

        // Tarjetas / contenedores
        card: {
          light: "#FFFFFF",
          dark: "#0B0F18",
        },

        // Bordes
        borderc: {
          light: "#E2E4EF",
          dark: "#1E2535",
        },

        // Textos
        tmain: {
          light: "#1F2933",
          dark: "#F9FAFB",
        },
        tmuted: {
          light: "#6B7280",
          dark: "#9CA3AF",
        },

        // Paleta corporativa R+
        brand: {
          primary: "#F07020",
          hover: "#D95E07",
          soft: "#FFE4CC",

          darkPrimary: "#F38B1F",
          darkHover: "#D96A00",
          darkSoft: "#3A2410",
        },

        // Acento
        accent: {
          light: "#F0B040",
          dark: "#F3C049",
        },
      },
    },
  },
  plugins: [],
}