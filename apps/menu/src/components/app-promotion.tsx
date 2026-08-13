import Image from 'next/image';
import type { AppInstallConfig } from '@/lib/app-install';
import { Icon } from './icon';

export function AppPromotion({ config }: { config: AppInstallConfig }) {
  return <section className="app-promotion" aria-labelledby="mobile-app-title">
    <div className="app-promotion-copy">
      <span className="app-mark"><Image src="/terrasse-bleue-logo.png" alt="" width={72} height={72} /></span>
      <div><p className="eyebrow">Application Terrasse Bleue</p><h2 id="mobile-app-title">Commandez aussi depuis l’application</h2><p>Livraison à Essaouira, commande à emporter, historique et suivi depuis votre téléphone.</p></div>
      {config.url ? <a className="button app-install-button" href={config.url} target="_blank" rel="noopener noreferrer"><span>Ouvrir ou installer l’application</span><Icon name="arrow-right" size={18} /></a> : <p className="app-coming-soon" role="status">Le lien d’installation sera disponible prochainement.</p>}
    </div>
    {config.url ? <div className="app-qr"><img src="/app-install-qr" alt="QR code pour ouvrir la page d’installation de l’application Terrasse Bleue" width={210} height={210} loading="lazy" decoding="async" /><small>Scannez avec un autre appareil</small></div> : null}
  </section>;
}

export function ServerOrderNotice({ compact = false }: { compact?: boolean }) {
  return <aside className={`server-order-notice ${compact ? 'compact' : ''}`} aria-labelledby={compact ? undefined : 'server-order-title'}>
    <span className="server-order-icon"><Icon name="dine-in" size={28} /></span>
    <div>{compact ? <strong>Pour commander au café</strong> : <h2 id="server-order-title">Prêt à commander ?</h2>}<p>Indiquez directement vos plats et vos éventuelles options à votre serveur.</p>{!compact ? <small>Cette carte en ligne sert à consulter nos produits, nos options et nos prix.</small> : null}</div>
  </aside>;
}
