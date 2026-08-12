import Link from 'next/link';
import type { Metadata } from 'next';
import { formatMAD, formatMADSupplement } from '@terrasse-bleue/types';
import { AppPromotion, ServerOrderNotice } from '@/components/app-promotion';
import { SafeMenuImage } from '@/components/safe-menu-image';
import { api } from '@/lib/api';
import { getAppInstallConfig } from '@/lib/app-install';
import type { Product } from '@/lib/types';

export async function generateMetadata({ params }: PageProps<'/menu/product/[id]'>): Promise<Metadata> {
  const { id } = await params;
  try {
    const product = await api<Product>(`/products/${id}`);
    const description = product.description || `Découvrez ${product.name} sur la carte de Terrasse Bleue à Essaouira.`;
    return { title: product.name, description, alternates: { canonical: `/menu/product/${id}` }, openGraph: { title: product.name, description, type: 'website', images: product.imageUrl?.startsWith('http') ? [product.imageUrl] : ['/terrasse-bleue-logo.png'] } };
  } catch {
    return { title: 'Produit', robots: { index: false, follow: true } };
  }
}

export default async function ProductPage({ params }: PageProps<'/menu/product/[id]'>) {
  const { id } = await params;
  let product: Product | undefined;
  let error = '';
  try { product = await api<Product>(`/products/${id}`); }
  catch (reason) { error = reason instanceof Error ? reason.message : 'Produit indisponible.'; }
  if (error || !product) return <main className="state"><h1>Produit indisponible</h1><p>{error || 'Ce produit n’est pas disponible actuellement.'}</p><Link className="button" href="/menu">Retour à la carte</Link></main>;
  return <main className="detail view-only-detail">
    <Link className="back" href="/menu">Retour à la carte</Link>
    <div className="detail-grid"><div className="detail-image"><SafeMenuImage value={product.imageUrl} alt={product.name} /></div><div className="detail-copy">
      <p className="eyebrow">Terrasse Bleue</p><h1>{product.name}</h1><strong className="detail-price">{formatMAD(product.price)}</strong><p className="description">{product.description}</p>
      {product.options.length ? <section className="product-options-info" aria-labelledby="options-title"><h2 id="options-title">Options disponibles</h2><p>Les choix et suppléments ci-dessous sont présentés à titre informatif.</p>{product.options.map((option) => <div className="option-group" key={option.id}><h3>{option.name}</h3><ul>{option.values.map((value) => <li key={value.id}><span>{value.label}</span>{Number(value.priceDelta) > 0 ? <b>{formatMADSupplement(value.priceDelta)}</b> : <small>Inclus</small>}</li>)}</ul></div>)}</section> : null}
      <ServerOrderNotice compact />
    </div></div>
    <div className="detail-app-promotion"><AppPromotion config={getAppInstallConfig()} /></div>
  </main>;
}
