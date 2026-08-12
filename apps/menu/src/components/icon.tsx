type IconName = 'arrow-down' | 'arrow-right' | 'arrow-up' | 'category' | 'close' | 'dine-in' | 'search';

const paths: Record<IconName, React.ReactNode> = {
  'arrow-down': <><path d="M12 5v14" /><path d="m19 12-7 7-7-7" /></>,
  'arrow-right': <><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></>,
  'arrow-up': <><path d="M12 19V5" /><path d="m5 12 7-7 7 7" /></>,
  category: <><rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="4" width="6" height="6" rx="1" /><rect x="4" y="14" width="6" height="6" rx="1" /><rect x="14" y="14" width="6" height="6" rx="1" /></>,
  close: <><path d="m6 6 12 12" /><path d="M18 6 6 18" /></>,
  'dine-in': <><path d="M7 3v8M4 3v5a3 3 0 0 0 6 0V3M7 11v10M15 3v18M15 3c4 2 4 8 0 10" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
};

export function Icon({ name, size = 20, label }: { name: IconName; size?: number; label?: string }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden={label ? undefined : true} aria-label={label} role={label ? 'img' : undefined}>{paths[name]}</svg>;
}
