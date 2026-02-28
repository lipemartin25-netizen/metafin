// src/lib/theme.js
export const tw = {
    // === Cards ===
    card: 'glass-card p-6',
    cardElevated: 'glass-card-elevated p-6',
    cardCompact: 'glass-card p-4',

    // === Buttons ===
    btnPrimary: 'btn-brand',
    btnSecondary: 'btn-glass',

    // === Typography ===
    heading: 'text-[var(--text-primary)] font-bold tracking-tight',
    headingLg: 'text-[var(--text-primary)] font-bold tracking-tight text-2xl',
    text: 'text-[var(--text-secondary)]',
    muted: 'text-[var(--text-muted)] text-sm',
    brandText: 'text-[var(--brand)] font-semibold',

    // === Layout ===
    page: 'min-h-screen bg-[var(--bg-base)] p-6 md:p-8',

    // === Inputs ===
    input: 'input-glass w-full',

    // === Sidebar ===  
    sidebar: 'sidebar-glass',
    sidebarItem: 'px-4 py-3 rounded-xl text-[var(--text-secondary)] hover:bg-[var(--brand-soft)] hover:text-[var(--brand)] transition-all duration-200 cursor-pointer',
    sidebarItemActive: 'sidebar-item-active px-4 py-3',

    // === Navbar ===
    navbar: 'navbar-glass px-6 py-4',

    // === Badge ===
    badge: 'badge-brand',

    // === Table ===
    table: 'table-glass w-full',

    // === Bank Icon ===
    bankIcon: 'bank-icon',

    // === Divider ===
    divider: 'divider-glow',

    // === Animation ===
    fadeIn: 'animate-fade-in',
};
