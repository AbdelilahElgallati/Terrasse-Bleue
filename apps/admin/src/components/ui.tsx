"use client";

import Link from "next/link";
import { formatMAD, ORDER_STATUS_PRESENTATION } from "@terrasse-bleue/types";
import type { AdminOrder, OrderStatus } from "@/lib/types";

export const statusLabels = Object.fromEntries(
  Object.entries(ORDER_STATUS_PRESENTATION).map(([status, presentation]) => [status, presentation.adminLabel]),
) as Record<OrderStatus, string>;
export const nextActions: Partial<
  Record<OrderStatus, { status: OrderStatus; label: string }>
> = {
  PENDING: { status: "CONFIRMED", label: "Confirmer la commande" },
  CONFIRMED: { status: "PREPARING", label: "Démarrer la préparation" },
  PREPARING: { status: "READY", label: "Marquer comme prête" },
  READY: { status: "COMPLETED", label: "Remettre au client et encaisser" },
};
export function money(value: string | number) {
  return formatMAD(value);
}
export function dateTime(value: string) {
  return new Intl.DateTimeFormat("fr-MA", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}
export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`status status-${status}`} aria-label={ORDER_STATUS_PRESENTATION[status].explanation}>{statusLabels[status]}</span>
  );
}
export function OrderRow({
  order,
  urgent = false,
}: {
  order: AdminOrder;
  urgent?: boolean;
}) {
  return (
    <Link
      href={`/orders/${order.id}`}
      className={`order-row ${urgent ? "urgent" : ""}`}
    >
      <div className="order-primary">
        <strong>{order.orderNumber}</strong>
        <span>
          {dateTime(order.createdAt)} ·{" "}
          {order.items.reduce((sum, item) => sum + item.quantity, 0)} article(s)
        </span>
      </div>
      <div className="order-customer">
        <strong>{order.user.name}</strong>
        <span>
          {order.orderType === "DINE_IN" ? "Sur place" : order.orderType === "DELIVERY" ? "Livraison" : "À emporter"}
        </span>
      </div>
      <StatusBadge status={order.status} />
      <span className="money">{money(order.total)}</span>
    </Link>
  );
}
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="page-header">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        {description ? <p>{description}</p> : null}
      </div>
      {actions ? <div className="header-actions">{actions}</div> : null}
    </header>
  );
}
export function Loading() {
  return (
    <div className="screen-center" style={{ minHeight: 320 }}>
      <div className="spinner" />
      <p>Chargement…</p>
    </div>
  );
}
export function ErrorState({
  message = "Impossible de charger les données.",
  retry,
}: {
  message?: string;
  retry?: () => void;
}) {
  return (
    <div className="error-box">
      {message}
      {retry ? (
        <button
          className="button small danger"
          style={{ marginLeft: 12 }}
          onClick={retry}
        >
          Réessayer
        </button>
      ) : null}
    </div>
  );
}
export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="empty">{children}</div>;
}
export function Toast({ message }: { message?: string }) {
  return message ? (
    <div className="toast" role="status">
      {message}
    </div>
  ) : null;
}
