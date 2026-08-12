'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Category, Product } from '@/lib/types';
import type { AppInstallConfig } from '@/lib/app-install';
import { Icon } from './icon';
import { AppPromotion, ServerOrderNotice } from './app-promotion';
import { ProductCard } from './product-card';

type SortMode = 'menu' | 'price-asc' | 'price-desc';
const CATEGORIES_PER_PAGE = 4;

export function MenuExperience({ categories, products, appInstall, legacyNotice }: { categories: Category[]; products: Product[]; appInstall: AppInstallConfig; legacyNotice?: boolean }) {
  const [activeId, setActiveId] = useState(categories[0]?.id || '');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortMode>('menu');
  const [showTop, setShowTop] = useState(false);
  const [page, setPage] = useState(0);
  const pillsRef = useRef<HTMLDivElement>(null);
  const normalized = query.trim().toLocaleLowerCase('fr');
  const filtered = useMemo(() => products.filter((product) => !normalized || `${product.name} ${product.description}`.toLocaleLowerCase('fr').includes(normalized)).sort((a, b) => sort === 'price-asc' ? Number(a.price) - Number(b.price) : sort === 'price-desc' ? Number(b.price) - Number(a.price) : 0), [products, normalized, sort]);
  const visibleCategories = categories.filter((category) => filtered.some((product) => product.categoryId === category.id));
  const categorySource = normalized ? visibleCategories : categories;
  const pageCount = Math.max(1, Math.ceil(categorySource.length / CATEGORIES_PER_PAGE));
  const safePage = Math.min(page, pageCount - 1);
  const pagedCategories = categorySource.slice(safePage * CATEGORIES_PER_PAGE, (safePage + 1) * CATEGORIES_PER_PAGE);
  const firstVisibleId = pagedCategories[0]?.id;
  const activeIndex = Math.max(0, categories.findIndex((category) => category.id === activeId));

  useEffect(() => {
    const sections = categories.map((category) => document.getElementById(`category-${category.id}`)).filter(Boolean) as HTMLElement[];
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) setActiveId(visible.target.id.replace('category-', ''));
    }, { rootMargin: '-30% 0px -58% 0px', threshold: [0, 0.1, 0.5] });
    sections.forEach((section) => observer.observe(section));
    const onScroll = () => setShowTop(window.scrollY > 700);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { observer.disconnect(); window.removeEventListener('scroll', onScroll); };
  }, [categories, normalized]);
  useEffect(() => { queueMicrotask(() => setPage(0)); }, [normalized]);
  useEffect(() => { if (firstVisibleId) queueMicrotask(() => setActiveId(firstVisibleId)); }, [safePage, firstVisibleId]);
  useEffect(() => { pillsRef.current?.querySelector<HTMLElement>(`[data-category="${activeId}"]`)?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' }); }, [activeId]);
  function jump(id: string) {
    const index = categorySource.findIndex((category) => category.id === id);
    const targetPage = Math.max(0, Math.floor(index / CATEGORIES_PER_PAGE));
    setPage(targetPage); setActiveId(id);
    window.setTimeout(() => document.getElementById(`category-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
  }
  function changePage(next: number) { setPage(next); }

  return <>
    <section className="hero premium-hero"><div className="hero-texture" /><div className="hero-content"><p className="eyebrow">Terrasse Bleue · Essaouira</p><h1><span>Les saveurs de la médina,</span> au cœur d’Essaouira</h1><p>Une carte méditerranéenne généreuse, préparée au rythme de votre table.</p><button className="hero-cta" onClick={() => document.getElementById('menu-tools')?.scrollIntoView({ behavior: 'smooth' })}><span>Explorer la carte</span><b><Icon name="arrow-down" size={19} /></b></button></div><div className="hero-stamp"><span>Cuisine</span><b>Maison</b><small>Essaouira</small></div></section>
    {legacyNotice ? <div className="legacy-order-notice" role="status"><strong>Les commandes en ligne sont disponibles dans l’application Terrasse Bleue.</strong><span>Au café, adressez-vous directement à votre serveur.</span></div> : null}
    <div id="menu-tools" className="menu-navigation"><div className="menu-tools"><label className="menu-search"><span aria-hidden="true"><Icon name="search" /></span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher un plat, une saveur…" aria-label="Rechercher dans la carte" />{query && <button onClick={() => setQuery('')} aria-label="Effacer la recherche"><Icon name="close" /></button>}</label><label className="sort-control"><span>Trier</span><select value={sort} onChange={(event) => setSort(event.target.value as SortMode)}><option value="menu">Ordre de la carte</option><option value="price-asc">Prix croissant</option><option value="price-desc">Prix décroissant</option></select></label><div className="section-progress"><span>{String(activeIndex + 1).padStart(2, '0')} / {String(categories.length).padStart(2, '0')}</span><b>{categories[activeIndex]?.name}</b></div></div><div className="category-pills" ref={pillsRef}>{(normalized ? visibleCategories : categories).map((category) => <button type="button" data-category={category.id} className={activeId === category.id ? 'active' : ''} onClick={() => jump(category.id)} key={category.id}><span><Icon name="category" size={17} /></span>{category.name}</button>)}</div><div className="scroll-progress"><i style={{ width: `${((activeIndex + 1) / Math.max(1, categories.length)) * 100}%` }} /></div></div>
    <div id="carte" className="menu-sections redesigned-sections">{pagedCategories.length ? pagedCategories.map((category) => { const categoryIndex = categories.findIndex((entry) => entry.id === category.id); const entries = filtered.filter((product) => product.categoryId === category.id); return <section id={`category-${category.id}`} className={`menu-section tone-${categoryIndex % 3}`} key={category.id}><div className="section-title redesigned-title"><span className="category-icon"><Icon name="category" size={25} /></span><div><p>{String(categoryIndex + 1).padStart(2, '0')} · La carte</p><h2>{category.name}</h2>{category.description && <span>{category.description}</span>}</div><i /></div><div className="product-grid redesigned-grid">{entries.map((product) => <ProductCard product={product} key={product.id} />)}</div></section>; }) : <section className="state search-empty"><span><Icon name="search" size={45} /></span><h2>Aucun plat trouvé</h2><p>Essayez un autre nom ou revenez à toute la carte.</p><button className="button" onClick={() => setQuery('')}>Afficher toute la carte</button></section>}</div>
    {categorySource.length > CATEGORIES_PER_PAGE ? <nav className="menu-pagination" aria-label="Pages de catégories"><button disabled={safePage === 0} onClick={() => changePage(safePage - 1)}>Précédent</button><span>Page <b>{safePage + 1}</b> sur {pageCount}</span><button disabled={safePage === pageCount - 1} onClick={() => changePage(safePage + 1)}>Suivant</button></nav> : null}
    <div className="menu-closing"><ServerOrderNotice /><AppPromotion config={appInstall} /></div>
    <button className={`back-to-top ${showTop ? 'visible' : ''}`} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="Retour en haut"><Icon name="arrow-up" size={19} /></button>
  </>;
}
