/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
        extend: {
                fontFamily: {
                    sans: ['Manrope', 'sans-serif'],
                    serif: ['Playfair Display', 'serif'],
                    mono: ['JetBrains Mono', 'monospace'],
                },
                colors: {
                        background: '#020204',
                        foreground: '#EDEDED',
                        card: {
                                DEFAULT: '#0D0D10',
                                foreground: '#EDEDED'
                        },
                        primary: {
                                DEFAULT: '#D4AF37', // Gold
                                foreground: '#000000'
                        },
                        secondary: {
                                DEFAULT: '#102A20',
                                foreground: '#FFFFFF'
                        },
                        muted: {
                                DEFAULT: '#52525B',
                                foreground: '#A1A1AA'
                        },
                        border: 'rgba(255, 255, 255, 0.08)',
                        input: 'rgba(255, 255, 255, 0.05)',
                        ring: '#D4AF37',
                }
        }
  },
  plugins: [require("tailwindcss-animate")],
};
