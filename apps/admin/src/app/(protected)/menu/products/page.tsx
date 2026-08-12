"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Category, Page, Product } from "@/lib/types";
import {
  Empty,
  ErrorState,
  Loading,
  money,
  PageHeader,
  Toast,
} from "@/components/ui";
import { useAuth } from "@/components/providers";
import { ImagePickerField } from "@/components/image-picker-field";

type ProductForm = {
  categoryId: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  isAvailable: boolean;
  isFeatured: boolean;
};
export default function ProductsPage() {
  const searchParams = useSearchParams();
  const openedFromQuery = useRef(false);
  const { user } = useAuth();
  const canEdit = user?.role === "ADMIN" || user?.role === "MANAGER";
  const client = useQueryClient();
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const [available, setAvailable] = useState("");
  const [form, setForm] = useState<ProductForm>();
  const [message, setMessage] = useState("");
  const [imageError, setImageError] = useState("");
  const categories = useQuery({
    queryKey: ["admin-categories"],
    queryFn: () => api.get<Category[]>("/admin/categories"),
  });
  useEffect(() => {
    const first = categories.data?.[0];
    if (searchParams.get("create") === "1" && first && !openedFromQuery.current) { openedFromQuery.current = true; setForm({ categoryId: first.id, name: "", description: "", price: 0, imageUrl: "", isAvailable: true, isFeatured: false }); }
  }, [categories.data, form, searchParams]);
  const products = useQuery({
    queryKey: ["admin-products", category, search, available],
    queryFn: () =>
      api.get<Page<Product>>(
        `/admin/products?limit=100${category ? `&categoryId=${category}` : ""}${search.trim() ? `&search=${encodeURIComponent(search.trim())}` : ""}${available ? `&available=${available}` : ""}`,
      ),
  });
  const create = useMutation({
    mutationFn: (value: ProductForm) =>
      api.post<Product>("/admin/products", value),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ["admin-products"] });
      setForm(undefined);
      setMessage("Produit créé.");
      setTimeout(() => setMessage(""), 2200);
    },
  });
  const toggle = useMutation({
    mutationFn: (product: Product) =>
      api.patch(`/admin/products/${product.id}`, {
        isAvailable: !product.isAvailable,
      }),
    onSuccess: () => client.invalidateQueries({ queryKey: ["admin-products"] }),
  });
  function openCreate() {
    const first = categories.data?.[0];
    if (first)
      setForm({
        categoryId: first.id,
        name: "",
        description: "",
        price: 0,
        imageUrl: "",
        isAvailable: true,
        isFeatured: false,
      });
  }
  function submit(event: FormEvent) {
    event.preventDefault();
    if (!form) return;
    if (form.imageUrl && !form.imageUrl.startsWith("data:image/")) {
      try {
        const url = new URL(form.imageUrl);
        if (!['http:', 'https:'].includes(url.protocol)) throw new Error();
      } catch {
        setImageError("Collez une URL d’image HTTP ou HTTPS valide.");
        return;
      }
    }
    setImageError("");
    create.mutate(form);
  }
  return (
    <>
      <PageHeader
        eyebrow="CARTE"
        title="Produits"
        description="Recherchez, filtrez et gérez les produits réellement servis dans l’application."
        actions={
          canEdit ? (
            <button
              className="button primary"
              disabled={!categories.data?.length}
              onClick={openCreate}
            >
              ＋ Nouveau produit
            </button>
          ) : undefined
        }
      />
      <div className="filters">
        <div className="search">
          <span>⌕</span>
          <input
            placeholder="Rechercher un produit…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <select
          value={category}
          onChange={(event) => setCategory(event.target.value)}
        >
          <option value="">Toutes les catégories</option>
          {categories.data?.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
        <select
          value={available}
          onChange={(event) => setAvailable(event.target.value)}
        >
          <option value="">Toutes disponibilités</option>
          <option value="true">Disponibles</option>
          <option value="false">Indisponibles</option>
        </select>
      </div>
      {products.isLoading ? (
        <Loading />
      ) : products.isError || !products.data ? (
        <ErrorState retry={() => void products.refetch()} />
      ) : products.data.items.length ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Produit</th>
                <th>Catégorie</th>
                <th>Prix</th>
                <th>Options</th>
                <th>Disponible</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {products.data.items.map((product) => (
                <tr key={product.id}>
                  <td>
                    <strong>{product.name}</strong>
                    <br />
                    <small className="muted">
                      {product.description.slice(0, 65)}
                      {product.description.length > 65 ? "…" : ""}
                    </small>
                  </td>
                  <td>{product.category.name}</td>
                  <td className="money">{money(product.price)}</td>
                  <td>{product.options.length}</td>
                  <td>
                    {canEdit ? (
                      <button
                        aria-label={`${product.isAvailable ? "Désactiver" : "Activer"} ${product.name}`}
                        className={`toggle ${product.isAvailable ? "on" : ""}`}
                        onClick={() => toggle.mutate(product)}
                      />
                    ) : product.isAvailable ? (
                      "Oui"
                    ) : (
                      "Non"
                    )}
                  </td>
                  <td>
                    <Link
                      className="button small secondary"
                      href={`/menu/products/${product.id}`}
                    >
                      {canEdit ? "Modifier" : "Voir"}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty>Aucun produit ne correspond aux filtres.</Empty>
      )}
      {form ? (
        <div className="modal-backdrop">
          <form className="modal" onSubmit={submit}>
            <h2>Nouveau produit</h2>
            <div className="form-grid">
              <label>
                Nom
                <input
                  value={form.name}
                  onChange={(event) =>
                    setForm({ ...form, name: event.target.value })
                  }
                  required
                  minLength={2}
                />
              </label>
              <label>
                Catégorie
                <select
                  value={form.categoryId}
                  onChange={(event) =>
                    setForm({ ...form, categoryId: event.target.value })
                  }
                >
                  {categories.data?.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Prix (MAD)
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.price}
                  onChange={(event) =>
                    setForm({ ...form, price: Number(event.target.value) })
                  }
                  required
                />
              </label>
              <div><ImagePickerField value={form.imageUrl} onChange={(imageUrl) => setForm({ ...form, imageUrl })} /></div>
              {imageError ? <div className="form-error wide">{imageError}</div> : null}
              <label className="wide">
                Description
                <textarea
                  value={form.description}
                  onChange={(event) =>
                    setForm({ ...form, description: event.target.value })
                  }
                  required
                  minLength={2}
                />
              </label>
              <label>
                <span>Disponible</span>
                <input
                  type="checkbox"
                  checked={form.isAvailable}
                  onChange={(event) =>
                    setForm({ ...form, isAvailable: event.target.checked })
                  }
                />
              </label>
              <label>
                <span>Mis en avant</span>
                <input
                  type="checkbox"
                  checked={form.isFeatured}
                  onChange={(event) =>
                    setForm({ ...form, isFeatured: event.target.checked })
                  }
                />
              </label>
            </div>
            {create.isError ? (
              <div className="form-error">{create.error.message}</div>
            ) : null}
            <div className="modal-actions">
              <button
                type="button"
                className="button secondary"
                onClick={() => setForm(undefined)}
              >
                Annuler
              </button>
              <button className="button primary" disabled={create.isPending}>
                Créer le produit
              </button>
            </div>
          </form>
        </div>
      ) : null}
      <Toast message={message} />
    </>
  );
}
