"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { AdminOrder, Page, RestaurantSettings } from "@/lib/types";
import { money } from "./ui";
import { Icon } from "./icon";

export function OrderNotifications() {
  const client = useQueryClient();
  const settings = useQuery({ queryKey: ["admin-settings"], queryFn: () => api.get<RestaurantSettings>("/admin/settings"), staleTime: 30_000 });
  const knownIds = useRef<Set<string>>(new Set());
  const initialized = useRef(false);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  useEffect(() => {
    let active = true;
    async function check() {
      try {
        const data = await api.get<Page<AdminOrder>>("/admin/orders?limit=10&page=1&status=PENDING");
        if (!active) return;
        if (!initialized.current) {
          data.items.forEach((item) => knownIds.current.add(item.id));
          initialized.current = true;
          return;
        }
        const unseen = data.items.filter((item) => !knownIds.current.has(item.id));
        data.items.forEach((item) => knownIds.current.add(item.id));
        if (unseen.length) {
          setOrders((current) => [...unseen.reverse(), ...current.filter((item) => !unseen.some((entry) => entry.id === item.id))]);
          if (settings.data?.notificationSound !== false) playOrderSound();
          void client.invalidateQueries({ queryKey: ["admin-orders"] });
          void client.invalidateQueries({ queryKey: ["admin-dashboard"] });
        }
      } catch { /* The global API state already exposes connectivity failures. */ }
    }
    void check();
    const timer = window.setInterval(() => void check(), 5_000);
    return () => { active = false; window.clearInterval(timer); };
  }, [client, settings.data?.notificationSound]);
  const order = orders[0];
  function acknowledge(id: string) { setOrders((current) => current.filter((item) => item.id !== id)); }
  return order ? <div className="order-alert" role="alert" aria-live="assertive"><span className="order-alert-icon">{orders.length}</span><div><strong>Nouvelle commande à traiter</strong><p>{order.orderNumber} · {order.user.name} · {money(order.total)}{orders.length > 1 ? ` · ${orders.length - 1} autre${orders.length > 2 ? "s" : ""}` : ""}</p></div><Link href={`/orders/${order.id}`} onClick={() => acknowledge(order.id)}>Ouvrir</Link><button aria-label={`Masquer l’alerte ${order.orderNumber}`} onClick={() => acknowledge(order.id)}><Icon name="cancelled" /></button></div> : null;
}

function playOrderSound() {
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
