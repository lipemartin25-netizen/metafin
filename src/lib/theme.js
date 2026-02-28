// src/lib/theme.js — CLEAN VERSION
export const tw = {
 // Cards
 card: 'bg-surface-card border border-[var(--border)] rounded-[16px] shadow-card hover:shadow-card-hover hover:border-[var(--border-hover)] hover:-translate-y-[1px] transition-all duration-200',

 cardElevated: 'bg-surface-card border border-[var(--brand-border)] rounded-[20px] shadow-elevated hover:shadow-elevated-hover hover:border-brand hover:-translate-y-[2px] transition-all duration-250',

 // Typography
 heading: 'text-content-primary font-bold',
 text: 'text-content-secondary',
 muted: 'text-content-muted text-sm',

 // Buttons
 btnPrimary: 'bg-brand text-content-primary rounded-xl px-5 py-2.5 font-semibold hover:opacity-90 hover:-translate-y-[1px] transition-all duration-200',
 btnSecondary: 'bg-surface-secondary text-content-primary border border-[var(--border)] rounded-xl px-5 py-2.5 font-medium hover:border-[var(--border-hover)] transition-all duration-200',

 // Layout
 page: 'min-h-screen bg-surface-primary p-6 md:p-8',

 // Inputs
 input: 'bg-surface-secondary border border-[var(--border)] rounded-[10px] px-4 py-2.5 text-content-primary focus:border-brand focus:ring-2 focus:ring-brand-subtle outline-none transition-all duration-200',
};
