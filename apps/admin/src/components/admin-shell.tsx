'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Icon, type AdminIconName } from './icon';
import { useAuth } from './providers';
import { OrderNotifications } from './order-notifications';

const navigation: Array<{ href: string; label: string; icon: AdminIconName }> = [
  { href: '/dashboard', label: 'Vue d’ensemble', icon: 'dashboard' },
  { href: '/orders', label: 'Commandes', icon: 'orders' },
  { href: '/menu', label: 'Carte & menu', icon: 'products' },
  { href: '/customers', label: 'Clients', icon: 'customers' },
  { href: '/reports', label: 'Rapports', icon: 'reports' },
  { href: '/settings', label: 'Paramètres', icon: 'settings' },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, initialized, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const drawerRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const wasOpenRef = useRef(false);
  const health = useQuery({ queryKey: ['api-health'], queryFn: () => api.get<{ status: string }>('/health'), refetchInterval: 15_000, retry: 1 });
  useEffect(() => { if (initialized && !user) router.replace('/login'); }, [initialized, user, router]);
  useEffect(() => {
    if (!open) {
      document.body.style.overflow = '';
      if (wasOpenRef.current) menuButtonRef.current?.focus();
      wasOpenRef.current = false;
      return;
    }
    wasOpenRef.current = true;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const drawer = drawerRef.current;
    const focusable = drawer?.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])');
    focusable?.[0]?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') { event.preventDefault(); setOpen(false); return; }
      if (event.key !== 'Tab' || !focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener('keydown', onKeyDown); };
  }, [open]);
  if (!initialized || !user) return <div className="screen-center"><div className="spinner" role="status" aria-label="Vérification de la session" /><p>Vérification de la session…</p></div>;
  return <div className="admin-frame">
    <OrderNotifications />
    <aside ref={drawerRef} id="admin-navigation" className={`sidebar ${open ? 'sidebar-open' : ''}`} aria-label="Navigation de l’administration" aria-hidden={!open ? undefined : false}>
      <div className="brand"><Image src="/terrasse-bleue-mark-contrast.png" alt="Terrasse Bleue" width={72} height={72} priority /><div><strong>Terrasse Bleue</strong><span>Espace restaurant</span></div><button className="sidebar-close" aria-label="Fermer le menu" onClick={() => setOpen(false)}><span aria-hidden>×</span></button></div>
      <nav aria-label="Sections de l’administration">{navigation.map((item) => <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className={pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href)) ? 'nav-link active' : 'nav-link'}><span className="nav-icon"><Icon name={item.icon} /></span>{item.label}</Link>)}</nav>
      <div className="sidebar-user"><div className="user-avatar">{user.name.charAt(0).toUpperCase()}</div><div><strong>{user.name}</strong><span>{user.role === 'STAFF' ? 'Équipe' : 'Administration'}</span></div><button aria-label="Se déconnecter" onClick={() => void logout().then(() => router.replace('/login'))}><Icon name="logout" /></button></div>
    </aside>
    {open ? <button className="sidebar-backdrop" aria-label="Fermer le menu" onClick={() => setOpen(false)} /> : null}
    <div className="admin-main"><header className="topbar"><button ref={menuButtonRef} className="menu-toggle" onClick={() => setOpen(true)} aria-label="Ouvrir le menu" aria-expanded={open} aria-controls="admin-navigation"><Icon name="menu" /></button><div className="topbar-title"><span className="eyebrow">TERRASSE BLEUE</span><strong>Opérations restaurant</strong></div><div className={`online-dot ${health.isError ? 'offline' : health.data ? 'online' : 'checking'}`} role="status"><i /> <span>{health.isError ? 'Connexion à vérifier' : health.data ? 'API disponible' : 'Vérification…'}</span></div></header><main className="page-content" id="main-content">{children}</main></div>
  </div>;
}
