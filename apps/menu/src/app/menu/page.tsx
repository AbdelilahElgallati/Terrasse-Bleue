import { api } from '@/lib/api';
import type { Category, Product } from '@/lib/types';
import { MenuExperience } from '@/components/menu-experience';
import { getAppInstallConfig } from '@/lib/app-install';
export const dynamic = 'force-dynamic';
export default async function MenuPage({ searchParams }: PageProps<'/menu'>) {
  let categories: Category[] = []; let products: Product[] = []; let error = '';
  try { [categories, products] = await Promise.all([api<Category[]>('/categories'), api<{ items: Product[] }>('/products?available=true&limit=100').then((result) => result.items)]); } catch (reason) { error = reason instanceof Error ? reason.message : 'Menu indisponible.'; }
  if (error) return <main><section className="state"><h1>La carte prend une courte pause</h1><p>{error}</p><a className="button" href="/menu">Réessayer</a></section></main>;
  const params = await searchParams;
  return <main><MenuExperience categories={categories} products={products} appInstall={getAppInstallConfig()} legacyNotice={params.notice === 'ordering-moved' || params.notice === 'use-mobile-app'} /></main>;
}
