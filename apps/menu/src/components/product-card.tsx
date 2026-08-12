'use client';

import Link from 'next/link';
import { useState } from 'react';
import { formatMAD } from '@terrasse-bleue/types';
import type { Product } from '@/lib/types';
import { imageSrc } from '@/lib/images';
import { Icon } from './icon';

export function ProductCard({ product }: { product: Product }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  return <article className="product-card view-only-card">
    <Link className="product-main" href={`/menu/product/${product.id}`} aria-label={`Voir le détail de ${product.name}`}>
      <div className={`product-image premium-image ${imageLoaded ? 'loaded' : ''}`}><span className="image-skeleton" /><img src={imageSrc(product.imageUrl)} alt={product.name} width={640} height={480} loading="lazy" decoding="async" onLoad={() => setImageLoaded(true)} onError={(event) => { event.currentTarget.src = '/menu-fallback.svg'; setImageLoaded(true); }} />{product.isFeatured && <span className="featured">Suggestion du chef</span>}</div>
      <div className="product-copy"><div className="product-heading"><h3>{product.name}</h3><strong>{formatMAD(product.price)}</strong></div><p>{product.description}</p>{product.options.length ? <small className="options-available">Options et suppléments disponibles</small> : null}</div>
    </Link>
    <Link className="view-detail-link" href={`/menu/product/${product.id}`}><span>Voir le détail</span><Icon name="arrow-right" size={17} /></Link>
  </article>;
}
