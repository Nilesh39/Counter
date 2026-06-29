/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        spiritual: {
          saffron: {
            DEFAULT: '#EA580C', // Deep spiritual saffron
            light: '#F97316',   // Bright saffron accent
            dark: '#C2410C',    // Shadowed saffron
            glow: '#FF8A4D'     // Luminous saffron
          },
          amber: {
            DEFAULT: '#D97706',  // Amber highlight
            light: '#F59E0B',    // Light amber glow
            dark: '#B45309'     // Muted wood amber
          },
          cream: {
            DEFAULT: '#FDFBF7',  // Primary soft spiritual background
            dark: '#F3EDE4',     // Darker cream for card borders/backgrounds
            shadow: '#DDD5C7',   // Darker shade for neumorphic inset/outset shadow
            glow: '#FFFFFF'      // Pure white for neumorphic light highlight
          },
          charcoal: {
            DEFAULT: '#2D2622',  // Primary text color for high readability
            light: '#544A45',    // Secondary body text
            dark: '#1C1714'      // Dark theme background
          }
        }
      }
    },
  },
  plugins: [],
}
