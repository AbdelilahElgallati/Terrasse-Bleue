"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Customer } from "@/lib/types";
import {
  dateTime,
  Empty,
  ErrorState,
  Loading,
  money,
  PageHeader,
} from "@/components/ui";

export default function CustomersPage() {
  const query = useQuery({
    queryKey: ["admin-customers"],
    queryFn: () => api.get<Customer[]>("/admin/customers"),
  });
  return (
    <>
      <PageHeader
        eyebrow="CLIENTÈLE"
        title="Clients"
        description="Vue en lecture seule. Aucune donnée d’authentification sensible n’est exposée."
        actions={
          <button
            className="button secondary"
            onClick={() => void query.refetch()}
          >
            ↻ Actualiser
          </button>
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
                <th>Client</th>
                <th>Contact</th>
                <th>Inscription</th>
                <th>Commandes</th>
                <th>Terminées</th>
                <th>Revenu terminé</th>
              </tr>
            </thead>
            <tbody>
              {query.data.map((customer) => (
                <tr key={customer.id}>
                  <td>
                    <strong>{customer.name}</strong>
                  </td>
                  <td>
                    {customer.email}
                    <br />
                    <small className="muted">
                      {customer.phone ?? "Téléphone non renseigné"}
                    </small>
                  </td>
                  <td>{dateTime(customer.createdAt)}</td>
                  <td>{customer.orderCount}</td>
                  <td>{customer.completedOrderCount}</td>
                  <td className="money">{money(customer.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty>Aucun client enregistré.</Empty>
      )}
    </>
  );
}
