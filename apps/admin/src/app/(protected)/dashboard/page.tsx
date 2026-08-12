"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { DashboardData, OrderStatus } from "@/lib/types";
import { Icon, type AdminIconName } from "@/components/icon";
import {
  Empty,
  ErrorState,
  Loading,
  money,
  OrderRow,
  PageHeader,
  StatusBadge,
  statusLabels,
} from "@/components/ui";

const cards: {
  key: OrderStatus | "todayOrders" | "todayRevenue";
  label: string;
  icon: AdminIconName;
}[] = [
  { key: "todayOrders", label: "Commandes aujourd’hui", icon: "orders" },
  { key: "PENDING", label: "Nouvelles", icon: "orders" },
  { key: "PREPARING", label: "En préparation", icon: "preparing" },
  { key: "READY", label: "Prêtes", icon: "check" },
  { key: "COMPLETED", label: "Terminées", icon: "check" },
  { key: "CANCELLED", label: "Annulées", icon: "cancelled" },
  { key: "todayRevenue", label: "Chiffre du jour", icon: "revenue" },
  { key: "CONFIRMED", label: "Confirmées", icon: "check" },
];

export default function DashboardPage() {
  const query = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: () => api.get<DashboardData>("/admin/dashboard"),
    refetchInterval: 15_000,
  });
  if (query.isLoading) return <Loading />;
  if (query.isError || !query.data)
    return <ErrorState retry={() => void query.refetch()} />;
  const data = query.data;
  return (
    <>
      <PageHeader
        eyebrow="AUJOURD’HUI"
        title="Vue d’ensemble"
        description="Les informations essentielles du service, actualisées automatiquement."
        actions={
          <>
            <button
              className="button secondary"
              onClick={() => void query.refetch()}
            >
              ↻ Actualiser
            </button>
            <Link className="button primary" href="/orders">
              Voir les commandes
            </Link>
          </>
        }
      />
      <section className="stats-grid">
        {cards.map((card) => {
          const value =
            card.key === "todayRevenue"
              ? money(data.todayRevenue)
              : card.key === "todayOrders"
                ? data.todayOrders
                : data.counts[card.key];
          return (
            <article className="stat-card" key={card.key}>
              <div className="stat-top">
                <span>{card.label}</span>
                <span className="stat-icon"><Icon name={card.icon} /></span>
              </div>
              <strong>{value}</strong>
              <small>
                {card.key === "todayRevenue"
                  ? "Commandes terminées"
                  : card.key in statusLabels
                    ? statusLabels[card.key as OrderStatus]
                    : "Depuis minuit"}
              </small>
            </article>
          );
        })}
      </section>
      <section className="dashboard-grid">
        <div className="panel dashboard-panel">
          <div className="panel-header">
            <div><h2>Commandes récentes</h2><p>Les dernières commandes, de la plus récente à la plus ancienne</p></div>
            <Link className="panel-link" href="/orders">Tout voir <span>→</span></Link>
          </div>
          <div className="panel-body dashboard-scroll">
            {data.recentOrders.length ? (
              <div className="order-list">
                {data.recentOrders.map((order) => (
                  <OrderRow key={order.id} order={order} />
                ))}
              </div>
            ) : (
              <Empty>Aucune commande aujourd’hui.</Empty>
            )}
          </div>
          {data.recentOrders.length ? <div className="panel-footer"><span>{data.recentOrders.length} dernières affichées</span><Link href="/orders">Consulter toutes les commandes →</Link></div> : null}
        </div>
        <div className="panel dashboard-panel action-panel">
          <div className="panel-header">
            <div><h2>Priorités du service</h2><p>À traiter par l’équipe maintenant</p></div>
            <span className="status status-PENDING">
              {data.actionOrders.length}
            </span>
          </div>
          <div className="panel-body dashboard-scroll">
            {data.actionOrders.length ? (
              <div className="order-list">
                {data.actionOrders.map((order) => (
                  <Link className="action-order-card" href={`/orders/${order.id}`} key={order.id}>
                    <div className="action-order-top"><strong>{order.orderNumber}</strong><StatusBadge status={order.status} /></div>
                    <div className="action-order-meta"><span>{order.user.name}</span><span>{order.items.reduce((sum, item) => sum + item.quantity, 0)} article(s)</span></div>
                    <div className="action-order-bottom"><span>{new Intl.DateTimeFormat("fr-MA", { hour: "2-digit", minute: "2-digit" }).format(new Date(order.createdAt))}</span><strong>{money(order.total)}</strong><span className="action-order-arrow">Ouvrir →</span></div>
                  </Link>
                ))}
              </div>
            ) : (
              <Empty>Tout est à jour.</Empty>
            )}
          </div>
          {data.actionOrders.length ? <div className="panel-footer"><span>{data.actionOrders.length} commande{data.actionOrders.length > 1 ? "s" : ""} en attente d’action</span><Link href="/orders">Ouvrir la file →</Link></div> : null}
        </div>
      </section>
    </>
  );
}
