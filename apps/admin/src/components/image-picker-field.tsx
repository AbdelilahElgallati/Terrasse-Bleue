"use client";

import { ChangeEvent, useState } from "react";
import Image from "next/image";

export function ImagePickerField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [error, setError] = useState("");
  async function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError("Format accepté : JPG, PNG ou WebP.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("L’image ne doit pas dépasser 2 Mo.");
      return;
    }
    try {
      const source = await createImageBitmap(file);
      const scale = Math.min(1, 1200 / Math.max(source.width, source.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(source.width * scale));
      canvas.height = Math.max(1, Math.round(source.height * scale));
      canvas.getContext('2d')?.drawImage(source, 0, 0, canvas.width, canvas.height);
      source.close();
      const optimized = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', .8));
      const selected = optimized && optimized.size < file.size ? optimized : file;
      const reader = new FileReader();
      reader.onload = () => { onChange(String(reader.result)); setError(""); };
      reader.onerror = () => setError("Impossible de lire ce fichier.");
      reader.readAsDataURL(selected);
    } catch {
      setError("Impossible de préparer cette image.");
    }
  }
  const previewable = value.startsWith('http://') || value.startsWith('https://') || value.startsWith('data:image/');
  const urlValue = value.startsWith('http://') || value.startsWith('https://') ? value : '';
  return <div className="image-picker"><div className="image-picker-grid"><label className="file-drop"><input type="file" accept="image/png,image/jpeg,image/webp" onChange={chooseFile} /><span className="file-icon">↑</span><strong>Choisir un fichier</strong><small>JPG, PNG ou WebP · 2 Mo max.</small></label><div className="image-or"><span>ou</span></div><label className="url-choice"><span>Coller une URL valide</span><input type="url" inputMode="url" placeholder="https://exemple.com/image.jpg" value={urlValue} onChange={(event) => { onChange(event.target.value); setError(""); }} /></label></div>{previewable ? <div className="image-preview"><Image unoptimized width={64} height={64} src={value} alt="Aperçu de l’image sélectionnée" /><div><strong>Image sélectionnée</strong><button type="button" onClick={() => onChange('')}>Retirer</button></div></div> : value ? <small className="legacy-image-note">Image actuelle du catalogue : {value}. Choisissez un fichier ou collez une URL pour la remplacer.</small> : null}{error ? <div className="form-error">{error}</div> : null}</div>;
}
