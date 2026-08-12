import type { Metadata } from 'next';
import './globals.css';
import './polish.css';
import './header.css';
import './menu-redesign.css';
import './aligned-pages.css';
import './design-system.css';
import './view-only.css';
import { LegacyStorageCleanup } from '@/components/legacy-storage-cleanup';
import { SiteHeader } from '@/components/site-header';
const siteUrl = new URL(process.env.NEXT_PUBLIC_MENU_URL || 'http://localhost:3002');
export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: { default: 'Carte & menu | Terrasse Bleue Essaouira', template: '%s | Terrasse Bleue' },
  description: 'Découvrez la carte de Terrasse Bleue à Essaouira : cuisine méditerranéenne, plats, boissons, desserts et prix.',
  applicationName: 'Terrasse Bleue',
  keywords: ['Terrasse Bleue', 'restaurant Essaouira', 'café Essaouira', 'menu Essaouira', 'cuisine méditerranéenne'],
  alternates: { canonical: '/menu' },
  icons: { icon: [{ url: '/terrasse-bleue-logo.png', type: 'image/png' }], shortcut: '/terrasse-bleue-logo.png', apple: '/terrasse-bleue-logo.png' },
  openGraph: { type: 'website', locale: 'fr_MA', url: '/menu', siteName: 'Terrasse Bleue', title: 'Carte & menu | Terrasse Bleue Essaouira', description: 'Découvrez nos plats, boissons, desserts et prix à Essaouira.', images: [{ url: '/terrasse-bleue-logo.png', width: 512, height: 512, alt: 'Logo Terrasse Bleue' }] },
  twitter: { card: 'summary', title: 'Carte & menu | Terrasse Bleue Essaouira', description: 'Découvrez nos plats, boissons, desserts et prix à Essaouira.', images: ['/terrasse-bleue-logo.png'] },
  robots: { index: true, follow: true },
};
export default function RootLayout({ children }: { children: React.ReactNode }) { const restaurantSchema = { '@context': 'https://schema.org', '@type': 'Restaurant', name: 'Terrasse Bleue', address: { '@type': 'PostalAddress', addressLocality: 'Essaouira', addressCountry: 'MA' }, servesCuisine: ['Méditerranéenne', 'Marocaine'], url: new URL('/menu', siteUrl).toString(), menu: new URL('/menu', siteUrl).toString(), image: new URL('/terrasse-bleue-logo.png', siteUrl).toString() }; return <html lang="fr" data-scroll-behavior="smooth" suppressHydrationWarning><body suppressHydrationWarning><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(restaurantSchema).replace(/</g, '\\u003c') }} /><LegacyStorageCleanup /><SiteHeader />{children}<footer>Terrasse Bleue · Essaouira, Maroc</footer></body></html>; }
