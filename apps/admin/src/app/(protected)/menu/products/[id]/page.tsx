"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  Category,
  OptionValue,
  Product,
  ProductOption,
} from "@/lib/types";
import { ErrorState, Loading, money, PageHeader, Toast } from "@/components/ui";
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
export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const canEdit = user?.role === "ADMIN" || user?.role === "MANAGER";
  const client = useQueryClient();
  const [draft, setDraft] = useState<Partial<ProductForm>>({});
  const [optionName, setOptionName] = useState("");
  const [valueDraft, setValueDraft] = useState<{
    optionId: string;
    label: string;
    priceDelta: number;
  }>();
  const [message, setMessage] = useState("");
  const [imageError, setImageError] = useState("");
  const query = useQuery({
    queryKey: ["admin-product", id],
    queryFn: () => api.get<Product>(`/admin/products/${id}`),
  });
  const categories = useQuery({
    queryKey: ["admin-categories"],
    queryFn: () => api.get<Category[]>("/admin/categories"),
  });
  const form: ProductForm | undefined = query.data
    ? {
        categoryId: query.data.categoryId,
        name: query.data.name,
        description: query.data.description,
        price: Number(query.data.price),
        imageUrl: query.data.imageUrl ?? "",
        isAvailable: query.data.isAvailable,
        isFeatured: query.data.isFeatured,
        ...draft,
      }
    : undefined;
  const refresh = async () => {
    await Promise.all([
      client.invalidateQueries({ queryKey: ["admin-product", id] }),
      client.invalidateQueries({ queryKey: ["admin-products"] }),
    ]);
  };
  const saved = (text: string) => {
    setMessage(text);
    setTimeout(() => setMessage(""), 2200);
  };
  const update = useMutation({
    mutationFn: (value: ProductForm) =>
      api.patch<Product>(`/admin/products/${id}`, value),
    onSuccess: async () => {
      await refresh();
      saved("Produit enregistré.");
    },
  });
  const createOption = useMutation({
    mutationFn: () =>
      api.post<ProductOption>(`/admin/products/${id}/options`, {
        name: optionName,
      }),
    onSuccess: async () => {
      setOptionName("");
      await refresh();
      saved("Option ajoutée.");
    },
  });
  const patchOption = useMutation({
    mutationFn: ({
      optionId,
      body,
    }: {
      optionId: string;
      body: Partial<ProductOption>;
    }) => api.patch(`/admin/options/${optionId}`, body),
    onSuccess: refresh,
  });
  const createValue = useMutation({
    mutationFn: (draft: NonNullable<typeof valueDraft>) =>
      api.post<OptionValue>(`/admin/options/${draft.optionId}/values`, {
        label: draft.label,
        priceDelta: draft.priceDelta,
      }),
    onSuccess: async () => {
      setValueDraft(undefined);
      await refresh();
      saved("Supplément ajouté.");
    },
  });
  const patchValue = useMutation({
    mutationFn: ({
      valueId,
      body,
    }: {
      valueId: string;
      body: Partial<OptionValue>;
    }) => api.patch(`/admin/option-values/${valueId}`, body),
    onSuccess: refresh,
  });
  if (query.isLoading || !form) return <Loading />;
  if (query.isError || !query.data)
    return <ErrorState retry={() => void query.refetch()} />;
  function submit(event: FormEvent) {
    event.preventDefault();
    if (!form) return;
    if (form.imageUrl && form.imageUrl !== (query.data?.imageUrl ?? "") && !form.imageUrl.startsWith("data:image/")) {
      try {
        const url = new URL(form.imageUrl);
        if (!['http:', 'https:'].includes(url.protocol)) throw new Error();
      } catch {
        setImageError("Collez une URL d’image HTTP ou HTTPS valide.");
        return;
      }
    }
    setImageError("");
    update.mutate(form);
  }
  return (
    <>
      <PageHeader
        eyebrow="PRODUIT"
        title={query.data.name}
        description="Modifiez les informations commerciales et les choix proposés au client."
        actions={
          <Link className="button secondary" href="/menu/products">
            ← Produits
          </Link>
        }
      />
      <div className="detail-grid product-editor-grid">
        <form className="summary-card" onSubmit={submit}>
          <h2>Informations du produit</h2>
          <div className="form-grid">
            <label>
              Nom
              <input
                disabled={!canEdit}
                value={form.name}
                onChange={(event) =>
                  setDraft({ ...draft, name: event.target.value })
                }
              />
            </label>
            <label>
              Catégorie
              <select
                disabled={!canEdit}
                value={form.categoryId}
                onChange={(event) =>
                  setDraft({ ...draft, categoryId: event.target.value })
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
                disabled={!canEdit}
                type="number"
                min={0}
                step="0.01"
                value={form.price}
                onChange={(event) =>
                  setDraft({ ...draft, price: Number(event.target.value) })
                }
              />
            </label>
            <div className="wide"><span className="field-section-title">Image du produit</span>{canEdit ? <ImagePickerField value={form.imageUrl} onChange={(imageUrl) => setDraft({ ...draft, imageUrl })} /> : null}</div>
            {imageError ? <div className="form-error wide">{imageError}</div> : null}
            <label className="wide">
              Description
              <textarea
                disabled={!canEdit}
                value={form.description}
                onChange={(event) =>
                  setDraft({ ...draft, description: event.target.value })
                }
              />
            </label>
            <label>
              <span>Disponible</span>
              <input
                disabled={!canEdit}
                type="checkbox"
                checked={form.isAvailable}
                onChange={(event) =>
                  setDraft({ ...draft, isAvailable: event.target.checked })
                }
              />
            </label>
            <label>
              <span>Mis en avant</span>
              <input
                disabled={!canEdit}
                type="checkbox"
                checked={form.isFeatured}
                onChange={(event) =>
                  setDraft({ ...draft, isFeatured: event.target.checked })
                }
              />
            </label>
          </div>
          {update.isError ? (
            <div className="form-error">{update.error.message}</div>
          ) : null}
          {canEdit ? (
            <div className="modal-actions">
              <button className="button primary" disabled={update.isPending}>
                Enregistrer
              </button>
            </div>
          ) : null}
        </form>
        <aside className="summary-card">
          <h2>Résumé</h2>
          <div className="kv">
            <span>Prix actuel</span>
            <strong>{money(query.data.price)}</strong>
          </div>
          <div className="kv">
            <span>Catégorie</span>
            <strong>{query.data.category.name}</strong>
          </div>
          <div className="kv">
            <span>État</span>
            <strong>
              {query.data.isAvailable ? "Disponible" : "Indisponible"}
            </strong>
          </div>
          <div className="kv">
            <span>Options</span>
            <strong>{query.data.options.length}</strong>
          </div>
        </aside>
      </div>
      <section className="summary-card" style={{ marginTop: 18 }}>
        <h2>Options et suppléments</h2>
        {query.data.options.map((option) => (
          <div className="option-card" key={option.id}>
            <div className="option-head">
              <div>
                <strong>{option.name}</strong>
                <small className="muted" style={{ marginLeft: 8 }}>
                  {option.isActive ? "Active" : "Masquée"}
                </small>
              </div>
              {canEdit ? (
                <div className="inline-actions">
                  <button
                    className={`toggle ${option.isActive ? "on" : ""}`}
                    onClick={() =>
                      patchOption.mutate({
                        optionId: option.id,
                        body: { isActive: !option.isActive },
                      })
                    }
                  />
                  <button
                    className="button small secondary"
                    onClick={() =>
                      setValueDraft({
                        optionId: option.id,
                        label: "",
                        priceDelta: 0,
                      })
                    }
                  >
                    ＋ Supplément
                  </button>
                </div>
              ) : null}
            </div>
            {option.values.map((value) => (
              <div className="value-row" key={value.id}>
                <span>{value.label}</span>
                <strong>
                  {Number(value.priceDelta)
                    ? `+ ${money(value.priceDelta)}`
                    : "Inclus"}
                </strong>
                {canEdit ? (
                  <button
                    className={`toggle ${value.isActive ? "on" : ""}`}
                    onClick={() =>
                      patchValue.mutate({
                        valueId: value.id,
                        body: { isActive: !value.isActive },
                      })
                    }
                  />
                ) : null}
              </div>
            ))}
          </div>
        ))}
        {canEdit ? (
          <div className="inline-actions" style={{ marginTop: 16 }}>
            <input
              placeholder="Nom de la nouvelle option"
              value={optionName}
              onChange={(event) => setOptionName(event.target.value)}
            />
            <button
              className="button secondary"
              disabled={!optionName.trim() || createOption.isPending}
              onClick={() => createOption.mutate()}
            >
              Ajouter l’option
            </button>
          </div>
        ) : null}
      </section>
      {valueDraft ? (
        <div className="modal-backdrop">
          <form
            className="modal"
            onSubmit={(event) => {
              event.preventDefault();
              createValue.mutate(valueDraft);
            }}
          >
            <h2>Nouveau supplément</h2>
            <div className="form-grid">
              <label>
                Libellé
                <input
                  value={valueDraft.label}
                  onChange={(event) =>
                    setValueDraft({ ...valueDraft, label: event.target.value })
                  }
                  required
                />
              </label>
              <label>
                Supplément (MAD)
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={valueDraft.priceDelta}
                  onChange={(event) =>
                    setValueDraft({
                      ...valueDraft,
                      priceDelta: Number(event.target.value),
                    })
                  }
                />
              </label>
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="button secondary"
                onClick={() => setValueDraft(undefined)}
              >
                Annuler
              </button>
              <button className="button primary">Ajouter</button>
            </div>
          </form>
        </div>
      ) : null}
      <Toast message={message} />
    </>
  );
}
