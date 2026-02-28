/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: 'class',
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                brand: 'var(--brand)',
                'brand-light': 'var(--brand-light)',
                'brand-subtle': 'var(--brand-soft)',
                surface: {
                    primary: 'var(--bg-base)',
                    secondary: 'var(--bg-elevated)',
                    card: 'var(--bg-glass)',
                },
                content: {
                    primary: 'var(--text-primary)',
                    secondary: 'var(--text-secondary)',
                    muted: 'var(--text-muted)',
                },
            }
        },
    },
    plugins: [],
}
