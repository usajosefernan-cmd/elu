/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}"
    ],
    theme: {
        extend: {
            colors: {
                gold: '#D4AF37',
            },
            typography: (theme) => ({
                DEFAULT: {
                    css: {
                        color: theme('colors.white'),
                        a: {
                            color: '#D4AF37',
                            '&:hover': {
                                color: '#F5D76E',
                            },
                        },
                        h1: { color: theme('colors.white') },
                        h2: { color: theme('colors.white') },
                        h3: { color: theme('colors.white') },
                        h4: { color: theme('colors.white') },
                        strong: { color: theme('colors.white') },
                        code: { color: '#D4AF37' },
                        blockquote: { borderLeftColor: '#D4AF37' },
                    },
                },
            }),
        },
    },
    plugins: [
        require('@tailwindcss/typography'),
    ],
}
