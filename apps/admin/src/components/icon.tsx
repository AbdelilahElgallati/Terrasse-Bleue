export type AdminIconName = 'arrow' | 'cancelled' | 'check' | 'customers' | 'dashboard' | 'logout' | 'menu' | 'orders' | 'preparing' | 'products' | 'reports' | 'revenue' | 'settings';

const paths: Record<AdminIconName, React.ReactNode> = {
  arrow: <><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></>,
  cancelled: <><path d="m6 6 12 12" /><path d="M18 6 6 18" /></>,
  check: <path d="m5 12 4 4L19 6" />,
  customers: <><circle cx="9" cy="8" r="3" /><circle cx="17" cy="9" r="2" /><path d="M3 20a6 6 0 0 1 12 0M14 15a5 5 0 0 1 7 5" /></>,
  dashboard: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
  logout: <><path d="M10 17l5-5-5-5M15 12H3" /><path d="M14 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5" /></>,
  menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
  orders: <><path d="M6 3h12v18H6z" /><path d="M9 8h6M9 12h6M9 16h4" /></>,
  preparing: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  products: <><path d="M4 6h16M6 6l1 15h10l1-15M9 6a3 3 0 0 1 6 0" /></>,
  reports: <><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></>,
  revenue: <><rect x="3" y="6" width="18" height="12" rx="2" /><circle cx="12" cy="12" r="2.5" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" /></>,
};

export function Icon({ name, size = 20, label }: { name: AdminIconName; size?: number; label?: string }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden={label ? undefined : true} aria-label={label} role={label ? 'img' : undefined}>{paths[name]}</svg>;
}
