/**
 * Skip Links para navegação por teclado
 * Melhora acessibilidade permitindo pular para conteúdo principal
 */

export default function SkipLinks() {
    const links = [
        { href: '#main-content', label: 'Ir para conteúdo principal' },
        { href: '#main-navigation', label: 'Ir para navegação' },
        { href: '#search', label: 'Ir para busca' },
    ];

    return (
        <nav
            className="fixed top-0 left-0 z-[200]"
            aria-label="Links de acessibilidade"
        >
            {links.map((link) => (
                <a
                    key={link.href}
                    href={link.href}
                    className="
                        sr-only focus:not-sr-only
                        focus:absolute focus:top-4 focus:left-4
                        focus:z-[200] focus:px-4 focus:py-2
                        focus:bg-emerald-600 focus:text-white
                        focus:rounded-lg focus:shadow-lg
                        focus:outline-none focus:ring-2 focus:ring-white
                        font-medium text-sm
                    "
                >
                    {link.label}
                </a>
            ))}
        </nav>
    );
}
