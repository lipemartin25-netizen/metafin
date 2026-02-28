import { useEffect } from 'react';

/**
 * Componente para gerenciar meta tags dinamicamente
 * Melhora SEO e compartilhamento social
 */

const DEFAULT_META = {
 title: 'MetaFin — Inteligência Financeira Brasileira',
 description: 'Controle seu dinheiro de forma inteligente com insights gerados por IA. Importe CSV, categorize automaticamente e tenha insights poderosos do seu dinheiro.',
 image: '/og-image.png',
 url: 'https://metafin-app.vercel.app',
};

export default function SEO({
 title,
 description,
 image,
 url,
 type = 'website',
 noIndex = false,
}) {
 const fullTitle = title
 ? `${title} | MetaFin`
 : DEFAULT_META.title;

 const finalDescription = description || DEFAULT_META.description;
 const finalImage = image || DEFAULT_META.image;
 const finalUrl = url || DEFAULT_META.url;

 useEffect(() => {
 // Title
 document.title = fullTitle;

 // Meta tags mapping
 const metaTags = {
 'description': finalDescription,

 // Open Graph
 'og:title': fullTitle,
 'og:description': finalDescription,
 'og:image': finalImage,
 'og:url': finalUrl,
 'og:type': type,

 // Twitter
 'twitter:title': fullTitle,
 'twitter:description': finalDescription,
 'twitter:image': finalImage,
 'twitter:card': 'summary_large_image',
 };

 // Atualizar ou criar meta tags
 Object.entries(metaTags).forEach(([name, content]) => {
 let meta = document.querySelector(`meta[property="${name}"], meta[name="${name}"]`);

 if (!meta) {
 meta = document.createElement('meta');
 const isOg = name.startsWith('og:') || name.startsWith('twitter:');
 meta.setAttribute(isOg ? 'property' : 'name', name);
 document.head.appendChild(meta);
 }

 meta.setAttribute('content', content);
 });

 // Robots
 let robotsMeta = document.querySelector('meta[name="robots"]');
 if (!robotsMeta) {
 robotsMeta = document.createElement('meta');
 robotsMeta.setAttribute('name', 'robots');
 document.head.appendChild(robotsMeta);
 }
 robotsMeta.setAttribute('content', noIndex ? 'noindex, nofollow' : 'index, follow');

 // Canonical URL
 let canonical = document.querySelector('link[rel="canonical"]');
 if (!canonical) {
 canonical = document.createElement('link');
 canonical.setAttribute('rel', 'canonical');
 document.head.appendChild(canonical);
 }
 canonical.setAttribute('href', finalUrl);

 }, [fullTitle, finalDescription, finalImage, finalUrl, type, noIndex]);

 return null; // Não renderiza nada visualmente
}

/**
 * Hook para usar SEO imperativamente
 */
export function useSEO(options) {
 useEffect(() => {
 const { title, description } = options;

 if (title) {
 document.title = `${title} | MetaFin`;
 }

 if (description) {
 const meta = document.querySelector('meta[name="description"]');
 if (meta) {
 meta.setAttribute('content', description);
 }
 }
 }, [options]);
}
