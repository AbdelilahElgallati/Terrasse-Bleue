"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { RestaurantSettings, Role, StaffMember } from "@/lib/types";
import { ErrorState, Loading, PageHeader, Toast } from "@/components/ui";
import { useAuth } from "@/components/providers";

function Switch({ checked, onChange, label, description }: { checked: boolean; onChange: (value: boolean) => void; label: string; description: string }) {
  return <label className="setting-switch"><span><strong>{label}</strong><small>{description}</small></span><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /><i /></label>;
}

function playPreview() {
  const AudioContextClass = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return;
  const context = new AudioContextClass();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.frequency.setValueAtTime(740, context.currentTime);
  oscillator.frequency.setValueAtTime(920, context.currentTime + .12);
  gain.gain.setValueAtTime(.12, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(.001, context.currentTime + .35);
  oscillator.connect(gain); gain.connect(context.destination); oscillator.start(); oscillator.stop(context.currentTime + .35);
}

export default function SettingsPage() {
  const client = useQueryClient();
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const settingsQuery = useQuery({ queryKey: ["admin-settings"], queryFn: () => api.get<RestaurantSettings>("/admin/settings") });
  const staffQuery = useQuery({ queryKey: ["admin-staff"], queryFn: () => api.get<StaffMember[]>("/admin/staff"), enabled: user?.role === "ADMIN" });
  const [formDraft, setForm] = useState<RestaurantSettings>();
  const form = formDraft ?? settingsQuery.data;
  const [newStaff, setNewStaff] = useState({ name: "", email: "", phone: "", password: "", role: "STAFF" as "STAFF" | "MANAGER" });
  const [showStaffPassword, setShowStaffPassword] = useState(false);
  const save = useMutation({
    mutationFn: (value: RestaurantSettings) => api.patch<RestaurantSettings>("/admin/settings", { restaurantName: value.restaurantName, address: value.address, contactPhone: value.contactPhone, contactEmail: value.contactEmail, isOpen: value.isOpen, acceptsOrders: value.acceptsOrders, estimatedPrepMinutes: value.estimatedPrepMinutes, notificationSound: value.notificationSound }),
    onSuccess: (value) => { setForm(value); client.setQueryData(["admin-settings"], value); setMessage("Configuration enregistrée et synchronisée avec l’application mobile."); setTimeout(() => setMessage(""), 3500); },
  });
  const createStaff = useMutation({
    mutationFn: () => api.post<StaffMember>("/admin/staff", newStaff),
    onSuccess: async () => { setNewStaff({ name: "", email: "", phone: "", password: "", role: "STAFF" }); setShowStaffPassword(false); await client.invalidateQueries({ queryKey: ["admin-staff"] }); setMessage("Accès équipe créé. Communiquez le mot de passe temporaire de façon sécurisée."); },
  });
  const roleMutation = useMutation({ mutationFn: ({ id, role }: { id: string; role: Role }) => api.patch(`/admin/staff/${id}/role`, { role }), onSuccess: () => client.invalidateQueries({ queryKey: ["admin-staff"] }) });
  if (settingsQuery.isError) return <ErrorState retry={() => void settingsQuery.refetch()} />;
  if (settingsQuery.isLoading || !form) return <Loading />;
  const editable = user?.role === "ADMIN" || user?.role === "MANAGER";
  function submit(event: FormEvent) { event.preventDefault(); if (editable) save.mutate(form!); }
  return <>
    <PageHeader eyebrow="CONFIGURATION" title="Pilotage du restaurant" description="Gérez le service, les informations visibles par les clients et les accès de votre équipe." actions={<button className="button primary" disabled={!editable || save.isPending} onClick={() => save.mutate(form)}>{save.isPending ? "Enregistrement…" : "Enregistrer les changements"}</button>} />
    <div className={`service-banner ${form.isOpen && form.acceptsOrders ? "available" : "paused"}`}><span className="service-pulse" /><div><strong>{!form.isOpen ? "Restaurant fermé" : form.acceptsOrders ? "Restaurant ouvert · commandes actives" : "Restaurant ouvert · commandes en pause"}</strong><p>État actuellement communiqué à l’application mobile.</p></div></div>
    <form className="settings-layout" onSubmit={submit}>
      <div className="settings-main">
        <section className="settings-card"><div className="settings-heading"><span>01</span><div><h2>Disponibilité du service</h2><p>Ces changements prennent effet immédiatement côté mobile.</p></div></div><div className="settings-stack"><Switch checked={form.isOpen} onChange={(isOpen) => setForm({ ...form, isOpen })} label="Restaurant ouvert" description="Indique si l’établissement est actuellement ouvert." /><Switch checked={form.acceptsOrders} onChange={(acceptsOrders) => setForm({ ...form, acceptsOrders })} label="Accepter de nouvelles commandes" description="Mettez les commandes en pause sans fermer le restaurant." /><label className="field"><span>Temps de préparation estimé</span><div className="input-suffix"><input type="number" min={5} max={180} value={form.estimatedPrepMinutes} onChange={(event) => setForm({ ...form, estimatedPrepMinutes: Number(event.target.value) })} /><b>minutes</b></div><small>Visible avant la confirmation d’une commande.</small></label></div></section>
        <section className="settings-card"><div className="settings-heading"><span>02</span><div><h2>Informations client</h2><p>Coordonnées affichées dans l’application mobile.</p></div></div><div className="form-grid"><label className="field"><span>Nom du restaurant</span><input value={form.restaurantName} onChange={(event) => setForm({ ...form, restaurantName: event.target.value })} /></label><label className="field"><span>Adresse</span><input value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} /></label><label className="field"><span>Téléphone</span><input type="tel" placeholder="+212 …" value={form.contactPhone ?? ""} onChange={(event) => setForm({ ...form, contactPhone: event.target.value })} /></label><label className="field"><span>E-mail de contact</span><input type="email" placeholder="contact@restaurant.ma" value={form.contactEmail ?? ""} onChange={(event) => setForm({ ...form, contactEmail: event.target.value })} /></label></div></section>
      </div>
      <aside className="settings-side"><section className="settings-card"><div className="settings-heading compact"><span>♪</span><div><h2>Alertes</h2><p>Nouvelles commandes</p></div></div><Switch checked={form.notificationSound} onChange={(notificationSound) => setForm({ ...form, notificationSound })} label="Signal sonore" description="Joue un son discret à l’arrivée d’une commande." /><button type="button" className="button secondary full" onClick={playPreview}>▶ Tester le son</button></section><section className="settings-tip"><strong>Synchronisation active</strong><p>L’application mobile actualise ces informations automatiquement. Le serveur vérifie également la disponibilité avant chaque commande.</p></section></aside>
    </form>
    {user?.role === "ADMIN" ? <section className="settings-card team-section"><div className="settings-heading"><span>03</span><div><h2>Accès de l’équipe</h2><p>Créez les comptes qui peuvent traiter les commandes et administrer le menu.</p></div></div><div className="team-grid"><form className="team-create" onSubmit={(event) => { event.preventDefault(); createStaff.mutate(); }}><h3>Ajouter un membre</h3><label className="field"><span>Nom complet</span><input required minLength={2} value={newStaff.name} onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })} /></label><label className="field"><span>E-mail professionnel</span><input required type="email" value={newStaff.email} onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })} /></label><label className="field"><span>Téléphone</span><input type="tel" value={newStaff.phone} onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })} /></label><label className="field"><span>Mot de passe temporaire</span><span className="password-input"><input required type={showStaffPassword ? "text" : "password"} autoComplete="new-password" minLength={8} value={newStaff.password} onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })} /><button type="button" aria-label={showStaffPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"} aria-pressed={showStaffPassword} onClick={() => setShowStaffPassword((value) => !value)}>{showStaffPassword ? <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3l18 18M10.6 10.7a2 2 0 002.7 2.7M9.9 4.3A10.8 10.8 0 0112 4c5.5 0 9 5.2 9 5.2a16.8 16.8 0 01-3 3.5M6.2 6.2C4.1 7.6 3 9.2 3 9.2S6.5 16 12 16c1.1 0 2.1-.3 3-.7" /></svg> : <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6z" /><circle cx="12" cy="12" r="2.5" /></svg>}</button></span><small>8 caractères minimum, avec majuscule, minuscule et chiffre.</small></label><label className="field"><span>Rôle</span><select value={newStaff.role} onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value as "STAFF" | "MANAGER" })}><option value="STAFF">Équipe · commandes uniquement</option><option value="MANAGER">Manager · menu et configuration</option></select></label>{createStaff.isError ? <p className="form-error">{createStaff.error.message}</p> : null}<button className="button primary" disabled={createStaff.isPending}>{createStaff.isPending ? "Création…" : "Créer l’accès"}</button></form><div className="team-list"><h3>Membres autorisés</h3>{staffQuery.isLoading ? <Loading /> : staffQuery.data?.map((member) => <article className="team-member" key={member.id}><span className="user-avatar">{member.name.charAt(0).toUpperCase()}</span><div><strong>{member.name}</strong><small>{member.email}</small></div>{member.role === "ADMIN" ? <span className="status status-CONFIRMED">Administrateur</span> : <select value={member.role} disabled={roleMutation.isPending} onChange={(event) => roleMutation.mutate({ id: member.id, role: event.target.value as Role })}><option value="STAFF">Équipe</option><option value="MANAGER">Manager</option></select>}</article>)}</div></div></section> : null}
    {(save.isError || roleMutation.isError) ? <div className="error-box">{(save.error ?? roleMutation.error)?.message}</div> : null}<Toast message={message} />
  </>;
}
