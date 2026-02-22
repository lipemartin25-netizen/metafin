/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{js,jsx}'],
    darkMode: 'class', // Habilita o modo escuro via classe 'dark' no html
    theme: {
        extend: {
            colors: {
                brand: {
                    50: '#ecfeff',
                    100: '#cffafe',
                    200: '#a5f3fc',
                    300: '#67e8f9',
                    400: '#22d3ee',
                    500: '#06b6d4', // Cyan Neon Accent
                    600: '#0891b2',
                    700: '#0e7490',
                    800: '#155e75',
                    900: '#164e63',
                    DEFAULT: '#06b6d4', // The new MetaFin Cyberpunk Cyan
                },
                accent: {
                    DEFAULT: '#39ff14', // Hacker Green / Toxic Green for highlights
                    glow: 'rgba(57, 255, 20, 0.4)'
                },
                surface: {
                    50: '#f8fafc',
                    100: '#cbd5e1',
                    200: '#94a3b8',
                    300: '#64748b',
                    400: '#475569',
                    500: '#334155',
                    600: '#1e293b',
                    700: '#0f172a',
                    800: '#0a0a0a', // Almost black
                    900: '#050505', // Void
                    950: '#000000', // Pure Black
                },
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
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
