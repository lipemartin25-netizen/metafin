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
                'brand-subtle': 'var(--brand-subtle)',
                surface: {
                    primary: 'var(--bg-primary)',
                    secondary: 'var(--bg-secondary)',
                    card: 'var(--bg-card)',
                },
                content: {
                    primary: 'var(--text-primary)',
                    secondary: 'var(--text-secondary)',
                    muted: 'var(--text-muted)',
                },
            },
            borderRadius: {
                'card': '16px',
                'card-lg': '20px',
            },
            boxShadow: {
                'card': 'var(--shadow-sm)',
                'card-hover': 'var(--shadow-md)',
                'elevated': 'var(--shadow-md)',
                'elevated-hover': 'var(--shadow-hover)',
            },
        },
    },
    plugins: [],
}
