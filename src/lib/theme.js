// ============================================
// MetaFin Design System — Theme Constants v1.0
// ============================================
// USO: import { theme, tw } from '@/lib/theme'
// NUNCA edite sem atualizar DESIGN_SYSTEM.md

export const theme = {
    // ── Cores ──────────────────────────────
    colors: {
        bg: {
            primary: '#06060a',
            secondary: 'rgba(17,24,39,0.8)',     // gray-900/80
            card: 'rgba(31,41,55,0.4)',           // gray-800/40
            cardHover: 'rgba(31,41,55,0.6)',      // gray-800/60
            cardElevated: 'rgba(31,41,55,0.7)',   // gray-800/70
            input: 'rgba(31,41,55,0.6)',          // gray-800/60
            overlay: 'rgba(0,0,0,0.5)',
        },
        brand: {
            purple: '#a855f7',
            fuchsia: '#d946ef',
            purpleLight: '#c084fc',
            gradient: 'linear-gradient(to right, #9333ea, #c026d3)',
            gradientHover: 'linear-gradient(to right, #a855f7, #d946ef)',
            gradientSoft: 'linear-gradient(to right, rgba(168,85,247,0.1), rgba(217,70,239,0.1))',
        },
        semantic: {
            success: '#34d399',       // emerald-400
            successBg: 'rgba(16,185,129,0.1)',
            danger: '#f87171',        // red-400
            dangerBg: 'rgba(239,68,68,0.1)',
            warning: '#fbbf24',       // amber-400
            warningBg: 'rgba(245,158,11,0.1)',
            info: '#60a5fa',          // blue-400
            infoBg: 'rgba(59,130,246,0.1)',
        },
        text: {
            primary: '#ffffff',
            secondary: '#9ca3af',     // gray-400
            muted: '#6b7280',         // gray-500
            disabled: '#4b5563',      // gray-600
            brand: '#c084fc',         // purple-400
        },
        border: {
            default: 'rgba(55,65,81,0.4)',     // gray-700/40
            subtle: 'rgba(55,65,81,0.2)',      // gray-700/20
            hover: 'rgba(168,85,247,0.4)',     // purple-500/40
            focus: '#a855f7',                   // purple-500
            divider: '#1f2937',                 // gray-800
        },
    },

    // ── Tipografia ─────────────────────────
    typography: {
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        sizes: {
            display: { size: '2.25rem', weight: 700, lineHeight: 1.2 },  // 36px
            h1: { size: '1.5rem', weight: 700, lineHeight: 1.3 },        // 24px
            h2: { size: '1.25rem', weight: 600, lineHeight: 1.4 },       // 20px
            h3: { size: '1.125rem', weight: 600, lineHeight: 1.4 },      // 18px
            body: { size: '1rem', weight: 400, lineHeight: 1.5 },         // 16px
            bodySmall: { size: '0.875rem', weight: 400, lineHeight: 1.5 },// 14px
            caption: { size: '0.75rem', weight: 500, lineHeight: 1.4 },   // 12px
        },
    },

    // ── Espaçamentos ───────────────────────
    spacing: {
        xs: '0.25rem',    // 4px
        sm: '0.5rem',     // 8px
        md: '0.75rem',    // 12px
        base: '1rem',     // 16px
        lg: '1.25rem',    // 20px
        xl: '1.5rem',     // 24px
        '2xl': '2rem',    // 32px
        '3xl': '2.5rem',  // 40px
        '4xl': '3rem',    // 48px
    },

    // ── Bordas ─────────────────────────────
    borderRadius: {
        sm: '0.375rem',   // 6px  - tooltips
        md: '0.5rem',     // 8px  - botões, inputs
        lg: '0.75rem',    // 12px - cards
        xl: '1rem',       // 16px - modais
        full: '9999px',   // badges, avatares
    },

    // ── Sombras ────────────────────────────
    shadows: {
        none: 'none',
        subtle: '0 10px 15px -3px rgba(0,0,0,0.1)',
        brandGlow: '0 10px 15px -3px rgba(168,85,247,0.1)',
        brandGlowStrong: '0 20px 25px -5px rgba(168,85,247,0.2)',
        dangerGlow: '0 10px 15px -3px rgba(239,68,68,0.1)',
        successGlow: '0 10px 15px -3px rgba(16,185,129,0.1)',
    },

    // ── Animações ──────────────────────────
    transitions: {
        fast: 'all 0.15s ease',
        base: 'all 0.2s ease',
        smooth: 'all 0.3s ease',
        slow: 'all 0.5s ease',
    },

    // ── Breakpoints ────────────────────────
    breakpoints: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px',
    },

    // ── Z-Index ────────────────────────────
    zIndex: {
        base: 0,
        dropdown: 10,
        sticky: 20,
        sidebar: 30,
        modal: 40,
        overlay: 50,
        toast: 60,
        tooltip: 70,
    },
};

// ── Tailwind Class Helpers ───────────────
// Use essas constantes nos componentes React

export const tw = {
    // Cards
    card: 'bg-gray-800/40 backdrop-blur-sm border border-gray-700/40 rounded-xl p-6 hover:bg-gray-800/60 hover:border-purple-500/30 transition-all duration-300',
    cardElevated: 'bg-gray-800/70 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 shadow-lg shadow-black/10',
    cardBrand: 'bg-gradient-to-br from-purple-500/10 to-fuchsia-500/10 backdrop-blur-sm border border-purple-500/20 rounded-xl p-6 shadow-lg shadow-purple-500/5',

    // Botões
    btnPrimary: 'bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white font-semibold px-6 py-3 rounded-lg shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 transition-all duration-300 active:scale-[0.98]',
    btnSecondary: 'bg-gray-800/60 border border-gray-700/40 hover:bg-gray-700/60 hover:border-purple-500/30 text-gray-300 hover:text-white font-medium px-5 py-2.5 rounded-lg transition-all duration-300',
    btnGhost: 'border border-purple-500/40 text-purple-400 hover:bg-purple-500/10 hover:border-purple-500/60 font-medium px-5 py-2.5 rounded-lg transition-all duration-300',
    btnDanger: 'bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 hover:border-red-500/50 font-medium px-5 py-2.5 rounded-lg transition-all duration-300',

    // Inputs
    input: 'w-full bg-gray-800/60 border border-gray-700/40 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 focus:outline-none transition-all duration-200',

    // Badges
    badgeSuccess: 'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    badgeWarning: 'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20',
    badgeDanger: 'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20',
    badgeInfo: 'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20',
    badgeBrand: 'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20',

    // Texto
    textPrimary: 'text-white',
    textSecondary: 'text-gray-400',
    textMuted: 'text-gray-500',
    textBrand: 'text-purple-400',

    // Layout
    pageContainer: 'p-6 md:p-8 max-w-7xl mx-auto space-y-6',
    sectionTitle: 'text-2xl font-bold text-white',
    sectionSubtitle: 'text-gray-400 mt-1',
};

export default theme;
