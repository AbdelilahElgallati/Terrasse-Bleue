'use client';

import Link from 'next/link';
import { type FormEvent, useCallback, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AccessibleDialog } from '@/components/accessible-dialog';
import { useAuth } from '@/components/providers';
import { ImagePickerField } from '@/components/image-picker-field';
import { Empty, ErrorState, Loading, money, PageHeader, Toast } from '@/components/ui';
import { api } from '@/lib/api';
import type { Category, Page, Product } from '@/lib/types';

const PAGE_SIZE = 12;
type ProductForm = { categoryId: string; name: string; description: string; price: number; imageUrl: string; isAvailable: boolean; isFeatured: boolean };
type CategoryForm = { id?: string; name: string; description: string; imageUrl: string; sortOrder: number; isActive: boolean };

function Pagination({ page, pages, total, onPage }: { page: number; pages: number; total: number; onPage: (value: number) => void }) {
  if (pages <= 1) return null;
  return <nav className="table-pagination" aria-label="Pagination"><span>{total} éléments · page {page} sur {pages}</span><div><button disabled={page === 1} onClick={() => onPage(page - 1)}>Précédent</button>{Array.from({ length: pages }, (_, index) => index + 1).map((number) => <button key={number} className={number === page ? 'active' : ''} aria-current={number === page ? 'page' : undefined} onClick={() => onPage(number)}>{number}</button>)}<button disabled={page === pages} onClick={() => onPage(page + 1)}>Suivant</button></div></nav>;
}

export default function MenuPage() {
  const [tab, setTab] = useState<'products' | 'categories'>('products');
  const [productPage, setProductPage] = useState(1);
  const [categoryPage, setCategoryPage] = useState(1);
  const [productForm, setProductForm] = useState<ProductForm>();
  const [categoryForm, setCategoryForm] = useState<CategoryForm>();
  const [message, setMessage] = useState('');
  const { user } = useAuth();
  const canEdit = user?.role === 'ADMIN' || user?.role === 'MANAGER';
  const client = useQueryClient();
  const products = useQuery({ queryKey: ['admin-products', 'menu-workspace', productPage], queryFn: () => api.get<Page<Product>>(`/admin/products?limit=${PAGE_SIZE}&page=${productPage}`) });
  const categories = useQuery({ queryKey: ['admin-categories'], queryFn: () => api.get<Category[]>('/admin/categories') });
  const categoryPages = Math.max(1, Math.ceil((categories.data?.length ?? 0) / PAGE_SIZE));
  const visibleCategories = categories.data?.slice((categoryPage - 1) * PAGE_SIZE, categoryPage * PAGE_SIZE) ?? [];
  const refresh = () => Promise.all([client.invalidateQueries({ queryKey: ['admin-products'] }), client.invalidateQueries({ queryKey: ['admin-categories'] })]);
  const notify = (text: string) => { setMessage(text); setTimeout(() => setMessage(''), 2200); };
  const createProduct = useMutation({ mutationFn: (body: ProductForm) => api.post<Product>('/admin/products', body), onSuccess: async () => { await refresh(); setProductForm(undefined); setProductPage(1); notify('Produit créé.'); } });
  const saveCategory = useMutation({ mutationFn: (body: CategoryForm) => body.id ? api.patch<Category>(`/admin/categories/${body.id}`, body) : api.post<Category>('/admin/categories', body), onSuccess: async () => { await refresh(); setCategoryForm(undefined); setCategoryPage(1); notify('Catégorie enregistrée.'); } });
  const toggleProduct = useMutation({ mutationFn: (item: Product) => api.patch(`/admin/products/${item.id}`, { isAvailable: !item.isAvailable }), onSuccess: refresh });
  const toggleCategory = useMutation({ mutationFn: (item: Category) => api.patch(`/admin/categories/${item.id}`, { isActive: !item.isActive }), onSuccess: refresh });
  const openProduct = () => { const category = categories.data?.[0]; if (category) setProductForm({ categoryId: category.id, name: '', description: '', price: 0, imageUrl: '', isAvailable: true, isFeatured: false }); };
  const openCategory = (item?: Category) => setCategoryForm(item ? { id: item.id, name: item.name, description: item.description ?? '', imageUrl: item.imageUrl ?? '', sortOrder: item.sortOrder, isActive: item.isActive } : { name: '', description: '', imageUrl: '', sortOrder: categories.data?.length ?? 0, isActive: true });
  const activeQuery = tab === 'products' ? products : categories;

  return <>
    <PageHeader eyebrow="GESTION DE LA CARTE" title="Carte & menu" description="Gérez directement les produits et catégories. Les options et suppléments restent dans la fiche de chaque produit." />
    <div className="menu-workspace-tabs" role="tablist" aria-label="Gestion de la carte">
      <button id="products-tab" role="tab" aria-selected={tab === 'products'} aria-controls="menu-workspace-panel" className={tab === 'products' ? 'active' : ''} onClick={() => { setTab('products'); setProductPage(1); }}><strong>Produits</strong><small>{products.data?.meta.total ?? '—'}</small></button>
      <button id="categories-tab" role="tab" aria-selected={tab === 'categories'} aria-controls="menu-workspace-panel" className={tab === 'categories' ? 'active' : ''} onClick={() => { setTab('categories'); setCategoryPage(1); }}><strong>Catégories</strong><small>{categories.data?.length ?? '—'}</small></button>
    </div>
    <section id="menu-workspace-panel" role="tabpanel" aria-labelledby={tab === 'products' ? 'products-tab' : 'categories-tab'} className="menu-workspace">
      <div className="workspace-heading"><div><span className="eyebrow">{tab === 'products' ? 'CATALOGUE' : 'ORGANISATION'}</span><h2>{tab === 'products' ? 'Tous les produits' : 'Toutes les catégories'}</h2><p>{tab === 'products' ? `${PAGE_SIZE} produits par page` : `${PAGE_SIZE} catégories par page`}</p></div>{canEdit ? <button className="button primary" onClick={() => tab === 'products' ? openProduct() : openCategory()}>{tab === 'products' ? 'Nouveau produit' : 'Nouvelle catégorie'}</button> : null}</div>
      {activeQuery.isLoading ? <Loading /> : activeQuery.isError ? <ErrorState retry={() => void activeQuery.refetch()} /> : tab === 'products' ? products.data?.items.length ? <><div className="table-wrap workspace-table"><table><thead><tr><th>Produit</th><th>Catégorie</th><th>Prix</th><th>Options</th><th>Disponible</th><th /></tr></thead><tbody>{products.data.items.map((item) => <tr key={item.id}><td><strong>{item.name}</strong><br /><small className="muted">{item.description.slice(0, 70)}{item.description.length > 70 ? '…' : ''}</small></td><td>{item.category.name}</td><td className="money">{money(item.price)}</td><td>{item.options.length}</td><td>{canEdit ? <button className={`toggle ${item.isAvailable ? 'on' : ''}`} role="switch" aria-checked={item.isAvailable} aria-label={`${item.isAvailable ? 'Masquer' : 'Afficher'} ${item.name}`} onClick={() => toggleProduct.mutate(item)} /> : null}</td><td><Link className="button small secondary" href={`/menu/products/${item.id}`}>{canEdit ? 'Modifier' : 'Voir'}</Link></td></tr>)}</tbody></table></div><Pagination page={productPage} pages={products.data.meta.pages} total={products.data.meta.total} onPage={setProductPage} /></> : <Empty>Aucun produit.</Empty> : categories.data?.length ? <><div className="table-wrap workspace-table"><table><thead><tr><th>Ordre</th><th>Catégorie</th><th>Produits</th><th>Visible</th><th /></tr></thead><tbody>{visibleCategories.map((item) => <tr key={item.id}><td>{item.sortOrder}</td><td><strong>{item.name}</strong><br /><small className="muted">{item.description || 'Sans description'}</small></td><td>{item._count?.products ?? 0}</td><td>{canEdit ? <button className={`toggle ${item.isActive ? 'on' : ''}`} role="switch" aria-checked={item.isActive} aria-label={`${item.isActive ? 'Masquer' : 'Afficher'} ${item.name}`} onClick={() => toggleCategory.mutate(item)} /> : null}</td><td>{canEdit ? <button className="button small secondary" onClick={() => openCategory(item)}>Modifier</button> : null}</td></tr>)}</tbody></table></div><Pagination page={categoryPage} pages={categoryPages} total={categories.data.length} onPage={setCategoryPage} /></> : <Empty>Aucune catégorie.</Empty>}
    </section>
    <EditorModal product={productForm} category={categoryForm} categories={categories.data ?? []} productPending={createProduct.isPending} categoryPending={saveCategory.isPending} error={createProduct.error ?? saveCategory.error} onProduct={setProductForm} onCategory={setCategoryForm} onSaveProduct={(event) => { event.preventDefault(); if (productForm) createProduct.mutate(productForm); }} onSaveCategory={(event) => { event.preventDefault(); if (categoryForm) saveCategory.mutate(categoryForm); }} />
    <Toast message={message} />
  </>;
}

function EditorModal({ product, category, categories, productPending, categoryPending, error, onProduct, onCategory, onSaveProduct, onSaveCategory }: { product?: ProductForm; category?: CategoryForm; categories: Category[]; productPending: boolean; categoryPending: boolean; error: Error | null; onProduct: (value?: ProductForm) => void; onCategory: (value?: CategoryForm) => void; onSaveProduct: (event: FormEvent) => void; onSaveCategory: (event: FormEvent) => void }) {
  const close = useCallback(() => { onProduct(undefined); onCategory(undefined); }, [onProduct, onCategory]);
  if (!product && !category) return null;
  const title = product ? 'Nouveau produit' : category?.id ? 'Modifier la catégorie' : 'Nouvelle catégorie';
  return <AccessibleDialog title={title} description="Formulaire de gestion de la carte" onClose={close}>
    <form onSubmit={product ? onSaveProduct : onSaveCategory}>
      <div className="modal-title"><div><span className="eyebrow">{product ? 'PRODUIT' : 'CATÉGORIE'}</span><h2>{title}</h2></div><button type="button" className="modal-close" aria-label="Fermer" title="Fermer" onClick={close}>×</button></div>
      {product ? <div className="form-grid"><label>Nom<input required minLength={2} value={product.name} onChange={(event) => onProduct({ ...product, name: event.target.value })} /></label><label>Catégorie<select value={product.categoryId} onChange={(event) => onProduct({ ...product, categoryId: event.target.value })}>{categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label>Prix (MAD)<input type="number" min={0} step="0.01" value={product.price} onChange={(event) => onProduct({ ...product, price: Number(event.target.value) })} /></label><label className="wide">Description<textarea required minLength={2} value={product.description} onChange={(event) => onProduct({ ...product, description: event.target.value })} /></label><div className="wide"><span className="field-section-title">Image du produit</span><ImagePickerField value={product.imageUrl} onChange={(imageUrl) => onProduct({ ...product, imageUrl })} /></div><label className="check-field"><input type="checkbox" checked={product.isAvailable} onChange={(event) => onProduct({ ...product, isAvailable: event.target.checked })} />Disponible</label><label className="check-field"><input type="checkbox" checked={product.isFeatured} onChange={(event) => onProduct({ ...product, isFeatured: event.target.checked })} />Mis en avant</label></div> : category ? <div className="form-grid"><label>Nom<input required minLength={2} value={category.name} onChange={(event) => onCategory({ ...category, name: event.target.value })} /></label><label>Ordre<input type="number" min={0} value={category.sortOrder} onChange={(event) => onCategory({ ...category, sortOrder: Number(event.target.value) })} /></label><label className="wide">Description<textarea value={category.description} onChange={(event) => onCategory({ ...category, description: event.target.value })} /></label><div className="wide"><span className="field-section-title">Image de la catégorie</span><ImagePickerField value={category.imageUrl} onChange={(imageUrl) => onCategory({ ...category, imageUrl })} /></div><label className="check-field"><input type="checkbox" checked={category.isActive} onChange={(event) => onCategory({ ...category, isActive: event.target.checked })} />Visible dans la carte</label></div> : null}
      {error ? <div className="form-error" role="alert">{error.message}</div> : null}
      <div className="modal-actions"><button type="button" className="button secondary" onClick={close}>Annuler</button><button className="button primary" disabled={productPending || categoryPending}>{productPending || categoryPending ? 'Enregistrement…' : 'Enregistrer'}</button></div>
    </form>
  </AccessibleDialog>;
}
