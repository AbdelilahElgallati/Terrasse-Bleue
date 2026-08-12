import Image from 'next/image';
import Link from 'next/link';
import { getAppInstallConfig } from '@/lib/app-install';
import { Icon } from './icon';

export function SiteHeader() {
  const app = getAppInstallConfig();
  return <header className="site-header">
    <Link className="brand" href="/menu"><Image src="/terrasse-bleue-logo.png" alt="Terrasse Bleue" width={58} height={58} priority /><span><b>Terrasse Bleue</b><small>Essaouira · Cuisine méditerranéenne</small></span></Link>
    <nav className="header-actions" aria-label="Actions principales">
      <Link className="menu-link" href="/menu#carte">La carte</Link>
      {app.url ? <a className="header-app-link" href={app.url} target="_blank" rel="noopener noreferrer"><span>Notre application</span><Icon name="arrow-right" size={17} /></a> : null}
    </nav>
  </header>;
}
