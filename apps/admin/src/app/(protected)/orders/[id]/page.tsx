"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/lib/api";
import type { AdminOrder, OrderStatus } from "@/lib/types";
import {
  dateTime,
  ErrorState,
  Loading,
  money,
  nextActions,
  PageHeader,
  StatusBadge,
  statusLabels,
  Toast,
} from "@/components/ui";

const paymentStatusLabels: Record<string, string> = {
  PENDING: "À encaisser sur place",
  PAID: "Payé",
  FAILED: "Échec",
  REFUNDED: "Remboursé",
};

function optionsLabel(value: unknown) {
  if (Array.isArray(value))
    return value
      .map((entry) => {
        const item = entry as {
          optionName?: string;
          valueLabel?: string;
          priceDelta?: string;
        };
        return `${item.optionName ?? "Option"} : ${item.valueLabel ?? "Sélection"}${Number(item.priceDelta) ? ` (+${money(item.priceDelta ?? 0)})` : ""}`;
      })
      .join(" · ");
  if (value && typeof value === "object")
    return Object.values(value as Record<string, string>).join(" · ");
  return "";
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const client = useQueryClient();
  const [message, setMessage] = useState("");
  const query = useQuery({
    queryKey: ["admin-order", id],
    queryFn: () => api.get<AdminOrder>(`/admin/orders/${id}`),
    refetchInterval: 8_000,
  });
  const mutation = useMutation({
    mutationFn: (status: OrderStatus) =>
      api.patch<AdminOrder>(`/admin/orders/${id}/status`, { status }),
    onSuccess: async (order) => {
      client.setQueryData(["admin-order", id], order);
      await Promise.all([
        client.invalidateQueries({ queryKey: ["admin-orders"] }),
        client.invalidateQueries({ queryKey: ["admin-dashboard"] }),
      ]);
      setMessage(order.status === "COMPLETED" ? "Commande remise au client · paiement enregistré comme payé." : `Commande ${statusLabels[order.status].toLowerCase()} · l’équipe et le client voient maintenant ce statut.`);
      setTimeout(() => setMessage(""), 2500);
    },
  });
  if (query.isLoading) return <Loading />;
  if (query.isError || !query.data)
    return <ErrorState retry={() => void query.refetch()} />;
  const order = query.data;
  const action = nextActions[order.status];
  function transition(status: OrderStatus) {
    const destructive = status === "CANCELLED";
    if (
      !destructive ||
      window.confirm(
        "Annuler cette commande ? Cette action ne peut pas être inversée.",
      )
    )
      mutation.mutate(status);
  }
  return (
    <>
      <PageHeader
        eyebrow="COMMANDE"
        title={order.orderNumber}
        description={`Créée le ${dateTime(order.createdAt)}`}
        actions={
          <>
            <Link href="/orders" className="button secondary">
              ← Retour
            </Link>
            <button
              className="button secondary"
              onClick={() => void query.refetch()}
            >
              ↻ Actualiser
            </button>
          </>
        }
      />
      <div className="detail-grid">
        <div className="detail-stack">
          <section className="summary-card">
            <div
              className="panel-header"
              style={{ padding: 0, border: 0, minHeight: 40 }}
            >
              <h2>Détail de la commande</h2>
              <StatusBadge status={order.status} />
            </div>
            {order.items.map((item) => (
              <div className="item-line" key={item.id}>
                <div>
                  <strong>
                    {item.quantity} × {item.productNameSnapshot}
                  </strong>
                  {optionsLabel(item.selectedOptions) ? (
                    <p>{optionsLabel(item.selectedOptions)}</p>
                  ) : null}
                </div>
                <strong>{money(item.subtotal)}</strong>
              </div>
            ))}
            <div className="kv">
              <span>Sous-total</span>
              <strong>{money(order.subtotal)}</strong>
            </div>
            {Number(order.deliveryFee) > 0 ? <div className="kv"><span>Frais de livraison</span><strong>{money(order.deliveryFee)}</strong></div> : null}
            <div className="kv">
              <span>Total</span>
              <strong className="money">{money(order.total)}</strong>
            </div>
            {order.notes ? (
              <div style={{ marginTop: 15 }}>
                <span className="muted">Note client</span>
                <p>{order.notes}</p>
              </div>
            ) : null}
          </section>
          <section className="summary-card">
            <h2>Historique du statut</h2>
            <div className="timeline">
              {order.statusHistory.map((entry) => (
                <div className="timeline-item" key={entry.id}>
                  <strong>{statusLabels[entry.newStatus]}</strong>
                  <span>
                    {dateTime(entry.createdAt)}
                    {entry.changedBy
                      ? ` · ${entry.changedBy.name}`
                      : " · Système"}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
        <aside className="detail-stack">
          <section className="action-box">
            <StatusBadge status={order.status} />
            <h2 style={{ marginTop: 14 }}>Action suivante</h2>
            {action ? (
              <>
                <p>
                  {order.status === "READY" ? "Confirmez uniquement après avoir remis la commande et reçu le paiement." : "Cette action met immédiatement à jour le suivi visible par l’équipe et le client."}
                </p>
                <button
                  className="button terracotta"
                  disabled={mutation.isPending}
                  onClick={() => transition(action.status)}
                >
                  {mutation.isPending ? "Mise à jour…" : action.label}
                </button>
                {order.status === "PENDING" || order.status === "CONFIRMED" ? (
                  <button
                    className="button danger"
                    disabled={mutation.isPending}
                    onClick={() => transition("CANCELLED")}
                  >
                    Annuler / rejeter
                  </button>
                ) : null}
              </>
            ) : (
              <p>Aucune action disponible pour cette commande.</p>
            )}
            {mutation.isError ? (
              <p style={{ color: "#ffd0c9" }}>{mutation.error.message}</p>
            ) : null}
          </section>
          <section className="summary-card">
            <h2>Client</h2>
            <div className="kv">
              <span>Nom</span>
              <strong>{order.user.name}</strong>
            </div>
            <div className="kv">
              <span>E-mail</span>
              <strong>{order.user.email}</strong>
            </div>
            <div className="kv">
              <span>Téléphone</span>
              <strong>{order.user.phone ?? "Non renseigné"}</strong>
            </div>
          </section>
          <section className="summary-card">
            <h2>Commande & paiement</h2>
            <div className="kv">
              <span>Service</span>
              <strong>
                {order.orderType === "DINE_IN" ? "Sur place" : order.orderType === "DELIVERY" ? "Livraison" : "À emporter"}
              </strong>
            </div>
            <div className="kv">
              <span>Méthode</span>
              <strong>
                {order.payment?.method === "CASH" ? "Paiement en espèces" : "Paiement en ligne"}
              </strong>
            </div>
            <div className="kv">
              <span>Paiement</span>
              <strong>{order.payment?.status ? paymentStatusLabels[order.payment.status] ?? order.payment.status : "Non renseigné"}</strong>
            </div>
            {order.deliveryAddress ? <><div className="kv"><span>Destinataire</span><strong>{order.deliveryAddress.recipientName} · {order.deliveryAddress.phone}</strong></div><div className="kv"><span>Adresse de livraison</span><strong>{order.deliveryAddress.addressLine}{order.deliveryAddress.neighborhood ? ` · ${order.deliveryAddress.neighborhood}` : ''} · {order.deliveryAddress.city}</strong></div>{order.deliveryAddress.landmark ? <div className="kv"><span>Point de repère</span><strong>{order.deliveryAddress.landmark}</strong></div> : null}{order.deliveryAddress.instructions ? <div className="kv"><span>Instructions</span><strong>{order.deliveryAddress.instructions}</strong></div> : null}</> : null}
          </section>
        </aside>
      </div>
      <Toast message={message} />
    </>
  );
}
