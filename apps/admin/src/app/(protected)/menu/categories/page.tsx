"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Category } from "@/lib/types";
import { Empty, ErrorState, Loading, PageHeader, Toast } from "@/components/ui";
import { useAuth } from "@/components/providers";
import { ImagePickerField } from "@/components/image-picker-field";

type Form = {
  id?: string;
  name: string;
  description: string;
  imageUrl: string;
  originalImageUrl?: string;
  sortOrder: number;
  isActive: boolean;
};
const empty: Form = {
  name: "",
  description: "",
  imageUrl: "",
  sortOrder: 0,
  isActive: true,
};
export default function CategoriesPage() {
  const searchParams = useSearchParams();
  const openedFromQuery = useRef(false);
  const { user } = useAuth();
  const canEdit = user?.role === "ADMIN" || user?.role === "MANAGER";
  const client = useQueryClient();
  const [form, setForm] = useState<Form>();
  const [message, setMessage] = useState("");
  const [imageError, setImageError] = useState("");
  useEffect(() => {
    if (searchParams.get("create") === "1" && !openedFromQuery.current) { openedFromQuery.current = true; setForm(empty); }
  }, [form, searchParams]);
  const query = useQuery({
    queryKey: ["admin-categories"],
    queryFn: () => api.get<Category[]>("/admin/categories"),
  });
  const save = useMutation({
    mutationFn: (value: Form) =>
      value.id
        ? api.patch<Category>(`/admin/categories/${value.id}`, value)
        : api.post<Category>("/admin/categories", value),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ["admin-categories"] });
      setForm(undefined);
      setMessage("Catégorie enregistrée.");
      setTimeout(() => setMessage(""), 2200);
    },
  });
  const toggle = useMutation({
    mutationFn: (category: Category) =>
      api.patch(`/admin/categories/${category.id}`, {
        isActive: !category.isActive,
      }),
    onSuccess: () =>
      client.invalidateQueries({ queryKey: ["admin-categories"] }),
  });
  function submit(event: FormEvent) {
    event.preventDefault();
    if (!form) return;
    if (form.imageUrl && form.imageUrl !== form.originalImageUrl && !form.imageUrl.startsWith("data:image/")) {
      try {
        const url = new URL(form.imageUrl);
        if (!['http:', 'https:'].includes(url.protocol)) throw new Error();
      } catch {
        setImageError("Collez une URL d’image HTTP ou HTTPS valide.");
        return;
      }
    }
    setImageError("");
    save.mutate(form);
  }
  return (
    <>
      <PageHeader
        eyebrow="CARTE"
        title="Catégories"
        description="Une catégorie masquée disparaît du menu client, sans supprimer ses produits ni l’historique."
        actions={
          canEdit ? (
            <button className="button primary" onClick={() => setForm(empty)}>
              ＋ Nouvelle catégorie
            </button>
          ) : undefined
        }
      />
      {query.isLoading ? (
        <Loading />
      ) : query.isError || !query.data ? (
        <ErrorState retry={() => void query.refetch()} />
      ) : query.data.length ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Ordre</th>
                <th>Nom</th>
                <th>Produits</th>
                <th>Référence image</th>
                <th>Visible</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {query.data.map((category) => (
                <tr key={category.id}>
                  <td>{category.sortOrder}</td>
                  <td>
                    <strong>{category.name}</strong>
                    <br />
                    <small className="muted">
                      {category.description || "Sans description"}
                    </small>
                  </td>
                  <td>{category._count?.products ?? 0}</td>
                  <td>{category.imageUrl || "—"}</td>
                  <td>
                    {canEdit ? (
                      <button
                        aria-label={`${category.isActive ? "Désactiver" : "Activer"} ${category.name}`}
                        className={`toggle ${category.isActive ? "on" : ""}`}
                        onClick={() => toggle.mutate(category)}
                      />
                    ) : category.isActive ? (
                      "Active"
                    ) : (
                      "Masquée"
                    )}
                  </td>
                  <td>
                    {canEdit ? (
                      <button
                        className="button small secondary"
                        onClick={() =>
                          setForm({
                            id: category.id,
                            name: category.name,
                            description: category.description ?? "",
                            imageUrl: category.imageUrl ?? "",
                            originalImageUrl: category.imageUrl ?? "",
                            sortOrder: category.sortOrder,
                            isActive: category.isActive,
                          })
                        }
                      >
                        Modifier
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty>Aucune catégorie.</Empty>
      )}
      {form ? (
        <div className="modal-backdrop">
          <form className="modal" onSubmit={submit}>
            <h2>{form.id ? "Modifier la catégorie" : "Nouvelle catégorie"}</h2>
            <div className="form-grid">
              <label>
                Nom
                <input
                  value={form.name}
                  onChange={(event) =>
                    setForm({ ...form, name: event.target.value })
                  }
                  minLength={2}
                  required
                />
              </label>
              <label>
                Ordre
                <input
                  type="number"
                  min={0}
                  value={form.sortOrder}
                  onChange={(event) =>
                    setForm({ ...form, sortOrder: Number(event.target.value) })
                  }
                />
              </label>
              <label className="wide">
                Description
                <textarea
                  value={form.description}
                  onChange={(event) =>
                    setForm({ ...form, description: event.target.value })
                  }
                />
              </label>
              <div className="wide"><ImagePickerField value={form.imageUrl} onChange={(imageUrl) => setForm({ ...form, imageUrl })} /></div>
              {imageError ? <div className="form-error wide">{imageError}</div> : null}
              <label>
                <span>Visible dans la carte</span>
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(event) =>
                    setForm({ ...form, isActive: event.target.checked })
                  }
                />
              </label>
            </div>
            {save.isError ? (
              <div className="form-error">{save.error.message}</div>
            ) : null}
            <div className="modal-actions">
              <button
                type="button"
                className="button secondary"
                onClick={() => setForm(undefined)}
              >
                Annuler
              </button>
              <button className="button primary" disabled={save.isPending}>
                {save.isPending ? "Enregistrement…" : "Enregistrer"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
      <Toast message={message} />
    </>
  );
}
