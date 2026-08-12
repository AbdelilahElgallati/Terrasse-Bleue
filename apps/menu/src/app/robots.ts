import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_MENU_URL || 'http://localhost:3002';
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/cart', '/checkout', '/order/'] },
    sitemap: new URL('/sitemap.xml', base).toString(),
  };
}
