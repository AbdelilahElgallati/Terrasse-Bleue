"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/lib/api";
import type { AdminOrder, OrderStatus, Page } from "@/lib/types";
import {
  Empty,
  ErrorState,
  Loading,
  money,
  PageHeader,
  StatusBadge,
  dateTime,
  statusLabels,
} from "@/components/ui";
import Link from "next/link";

const paymentStatusLabels: Record<string, string> = {
  PENDING: "À encaisser",
  PAID: "Payé",
  FAILED: "Échec",
  REFUNDED: "Remboursé",
};

const statuses: Array<OrderStatus | "ALL"> = [
  "ALL",
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "READY",
  "COMPLETED",
  "CANCELLED",
];
export default function OrdersPage() {
  const [status, setStatus] = useState<OrderStatus | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: ["admin-orders", status, search, page],
    queryFn: () =>
      api.get<Page<AdminOrder>>(
        `/admin/orders?limit=12&page=${page}${status === "ALL" ? "" : `&status=${status}`}${search.trim() ? `&search=${encodeURIComponent(search.trim())}` : ""}`,
      ),
    refetchInterval: 10_000,
  });
  return (
    <>
      <PageHeader
        eyebrow="OPÉRATIONS"
        title="Commandes"
        description="Pilotez le service et ouvrez une commande pour mettre à jour son statut."
        actions={
          <button
            className="button secondary"
            onClick={() => void query.refetch()}
          >
            ↻ Actualiser
          </button>
        }
      />
      <div className="tabs">
        {statuses.map((item) => (
          <button
            key={item}
            className={`tab ${status === item ? "active" : ""}`}
            onClick={() => { setStatus(item); setPage(1); }}
          >
            {item === "ALL" ? "Toutes" : statusLabels[item]}
          </button>
        ))}
      </div>
      <div className="filters">
        <div className="search">
          <span>⌕</span>
          <input
            placeholder="N° de commande, client ou e-mail…"
            value={search}
            onChange={(event) => { setSearch(event.target.value); setPage(1); }}
          />
        </div>
        <select
          value={status}
          onChange={(event) =>
            { setStatus(event.target.value as OrderStatus | "ALL"); setPage(1); }
          }
        >
          <option value="ALL">Tous les statuts</option>
          {statuses.slice(1).map((item) => (
            <option key={item} value={item}>
              {statusLabels[item as OrderStatus]}
            </option>
          ))}
        </select>
        <button
          className="button secondary"
          onClick={() => {
            setSearch("");
            setStatus("ALL");
            setPage(1);
          }}
        >
          Effacer
        </button>
      </div>
      {query.isLoading ? (
        <Loading />
      ) : query.isError || !query.data ? (
        <ErrorState retry={() => void query.refetch()} />
      ) : query.data.items.length ? (
        <div className="table-wrap orders-table-wrap">
          <table className="orders-table">
            <colgroup>
              <col className="orders-col-number" />
              <col className="orders-col-customer" />
              <col className="orders-col-time" />
              <col className="orders-col-items" />
              <col className="orders-col-payment" />
              <col className="orders-col-status" />
              <col className="orders-col-total" />
              <col className="orders-col-action" />
            </colgroup>
            <thead>
              <tr>
                <th>Commande</th>
                <th>Client</th>
                <th>Heure</th>
                <th>Articles</th>
                <th>Paiement</th>
                <th>Statut</th>
                <th>Total</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {query.data.items.map((order) => (
                <tr key={order.id}>
                  <td>
                    <strong>{order.orderNumber}</strong>
                  </td>
                  <td className="orders-customer-cell">
                    {order.user.name}
                    <br />
                    <small className="muted">{order.user.email}</small>
                  </td>
                  <td>{dateTime(order.createdAt)}</td>
                  <td>
                    {order.items.reduce((sum, item) => sum + item.quantity, 0)}
                  </td>
                  <td>
                    {order.payment?.method === "CASH" ? "Espèces" : "En ligne"} ·{" "}
                    {order.payment?.status ? paymentStatusLabels[order.payment.status] ?? order.payment.status : "—"}
                  </td>
                  <td>
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="money">{money(order.total)}</td>
                  <td>
                    <Link
                      className="button small secondary"
                      href={`/orders/${order.id}`}
                    >
                      Ouvrir
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="pagination">
            <span>{query.data.meta.total} commande{query.data.meta.total > 1 ? "s" : ""} · page {query.data.meta.page} sur {Math.max(query.data.meta.pages, 1)}</span>
            <div><button className="button small secondary" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>← Précédente</button><button className="button small secondary" disabled={page >= query.data.meta.pages} onClick={() => setPage((value) => value + 1)}>Suivante →</button></div>
          </div>
        </div>
      ) : (
        <Empty>Aucune commande ne correspond à ces filtres.</Empty>
      )}
    </>
  );
}
