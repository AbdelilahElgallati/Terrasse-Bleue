import type { MetadataRoute } from 'next';
import { api } from '@/lib/api';
import type { Product } from '@/lib/types';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_MENU_URL || 'http://localhost:3002';
  const entries: MetadataRoute.Sitemap = [{ url: new URL('/menu', base).toString(), lastModified: new Date(), changeFrequency: 'daily', priority: 1 }];
  try {
    const result = await api<{ items: Product[] }>('/products?available=true&limit=100');
    entries.push(...result.items.map((product) => ({ url: new URL(`/menu/product/${product.id}`, base).toString(), lastModified: new Date(), changeFrequency: 'weekly' as const, priority: .7 })));
  } catch {
    // The menu page remains discoverable if the API is temporarily unavailable during a crawl.
  }
  return entries;
}
