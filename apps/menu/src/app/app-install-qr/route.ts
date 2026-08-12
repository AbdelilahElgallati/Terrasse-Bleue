import QRCode from 'qrcode';
import { getAppInstallConfig } from '@/lib/app-install';

export async function GET() {
  const { url } = getAppInstallConfig();
  if (!url) return new Response('Application installation URL is not configured.', { status: 404 });
  const svg = await QRCode.toString(url, {
    type: 'svg', errorCorrectionLevel: 'H', margin: 3,
    color: { dark: '#123B4A', light: '#F7F1E5' },
  });
  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, must-revalidate',
      'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'",
    },
  });
}
