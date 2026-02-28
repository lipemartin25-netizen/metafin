/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{js,jsx}'],
    darkMode: 'class', // Habilita o modo escuro via classe 'dark' no html
    theme: {
        extend: {
            colors: {
                brand: {
                    primary: 'var(--brand-primary)',
                    dark: 'var(--brand-dark)',
                    glow: 'var(--brand-glow)',
                    DEFAULT: 'var(--brand-primary)',
                },
                mobills: {
                    purple: '#6515DD',
                    dark: '#2B1464',
                    yellow: '#FBB81B',
                    'yellow-hover': '#E5A410',
                    gray: '#4A5568',
                    light: '#F8F9FA'
                },
                'bg-deep': '#FFFFFF',
                surface: {
                    50: 'var(--surface-50)',
                    100: 'var(--surface-100)',
                    200: 'var(--surface-200)',
                    300: 'var(--surface-300)',
                    400: 'var(--surface-400)',
                    500: 'var(--surface-500)',
                    600: 'var(--surface-600)',
                    700: 'var(--surface-700)',
                    800: 'var(--surface-800)',
                    900: 'var(--surface-900)',
                    950: 'var(--surface-950)',
                },
            },
            fontFamily: {
                sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
                display: ['Outfit', 'sans-serif'],
            },
            animation: {
                'fade-in': 'fadeIn 0.5s ease-out forwards',
                'slide-up': 'slideUp 0.6s ease-out forwards',
                'pulse-slow': 'pulse 3s infinite',
                'float': 'float 6s ease-in-out infinite',
                'shake': 'shake 0.5s cubic-bezier(.36,.07,.19,.97) both',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-10px)' },
                },
                shake: {
                    '10%, 90%': { transform: 'translate3d(-1px, 0, 0)' },
                    '20%, 80%': { transform: 'translate3d(2px, 0, 0)' },
                    '30%, 50%, 70%': { transform: 'translate3d(-4px, 0, 0)' },
                    '40%, 60%': { transform: 'translate3d(4px, 0, 0)' }
                }
            },
        },
    },
    plugins: [],
};
