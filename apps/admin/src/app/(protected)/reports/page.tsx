"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ReportsData } from "@/lib/types";
import {
  ErrorState,
  Loading,
  money,
  PageHeader,
  StatusBadge,
} from "@/components/ui";

export default function ReportsPage() {
  const query = useQuery({
    queryKey: ["admin-reports"],
    queryFn: () => api.get<ReportsData>("/admin/reports"),
  });
  if (query.isLoading) return <Loading />;
  if (query.isError || !query.data)
    return <ErrorState retry={() => void query.refetch()} />;
  const data = query.data;
  const maxStatus = Math.max(...data.ordersByStatus.map((row) => row.count), 1);
  const maxQuantity = Math.max(...data.bestSellingProducts.map((row) => row.quantity), 1);
  return (
    <>
      <PageHeader
        eyebrow="ACTIVITÉ"
        title="Performance du restaurant"
        description="Une lecture claire des ventes, du rythme de service et des produits qui attirent vos clients."
        actions={
          <button
            className="button secondary"
            onClick={() => void query.refetch()}
          >
            ↻ Actualiser
          </button>
        }
      />
      <div className="stats-grid">
        <article className="stat-card">
          <div className="stat-top">
            Commandes aujourd’hui<span className="stat-icon">▤</span>
          </div>
          <strong>{data.ordersToday}</strong>
          <small>Depuis minuit</small>
        </article>
        <article className="stat-card">
          <div className="stat-top">
            Commandes cette semaine<span className="stat-icon">▦</span>
          </div>
          <strong>{data.ordersWeek}</strong>
          <small>Depuis lundi</small>
        </article>
        <article className="stat-card">
          <div className="stat-top">
            Revenu aujourd’hui<span className="stat-icon">MAD</span>
          </div>
          <strong>{money(data.revenueToday)}</strong>
          <small>Commandes terminées</small>
        </article>
        <article className="stat-card">
          <div className="stat-top">
            Revenu cette semaine<span className="stat-icon">↗</span>
          </div>
          <strong>{money(data.revenueWeek)}</strong>
          <small>Commandes terminées</small>
        </article>
      </div>
      <div className="dashboard-grid">
        <section className="panel report-panel">
          <div className="panel-header">
            <div><h2>Flux des commandes</h2><p>Répartition depuis lundi</p></div>
            <span className="report-total">{data.ordersWeek} au total</span>
          </div>
          <div className="panel-body">
            <div className="report-bars">
              {data.ordersByStatus.map((row) => (
                <div className="report-bar-row" key={row.status}>
                  <div className="report-bar-label"><StatusBadge status={row.status} /><strong>{row.count}</strong></div>
                  <div className="report-bar-track"><span className={`report-bar-fill status-fill-${row.status}`} style={{ width: `${(row.count / maxStatus) * 100}%` }} /></div>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="panel report-panel">
          <div className="panel-header">
            <div><h2>Meilleures ventes</h2><p>Classement par quantité · semaine</p></div>
            <span className="report-total">Top {data.bestSellingProducts.length}</span>
          </div>
          <div className="panel-body">
            {data.bestSellingProducts.length ? (
              <div className="best-sellers best-sellers-scroll">
                {data.bestSellingProducts.map((product, index) => (
                  <div className="best-seller" key={product.name}>
                    <span className={`seller-rank ${index < 3 ? "top" : ""}`}>{index + 1}</span>
                    <div className="seller-copy">
                      <strong title={product.name}>{product.name}</strong>
                      <span>{product.quantity} vendu{product.quantity > 1 ? "s" : ""}</span>
                      <div className="seller-track"><span style={{ width: `${(product.quantity / maxQuantity) * 100}%` }} /></div>
                    </div>
                    <strong className="seller-revenue">{money(product.revenue)}</strong>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty">Pas encore de ventes cette semaine.</div>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
