/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{vue,js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                orbit: {
                    bg: '#0f172a',
                    card: '#1e293b',
                    accent: '#38bdf8',
                    text: '#f1f5f9',
                }
            }
        },
    },
    plugins: [],
}
