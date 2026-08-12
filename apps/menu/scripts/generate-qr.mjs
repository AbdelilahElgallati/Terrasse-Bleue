import QRCode from 'qrcode';
import { fileURLToPath } from 'node:url';

function validateUrl(value, variable) {
  if (!value) throw new Error(`${variable} est requis.`);
  const parsed = new URL(value);
  if (['localhost', '127.0.0.1', '::1'].includes(parsed.hostname)) throw new Error(`${variable} doit utiliser une URL accessible, jamais localhost.`);
  return parsed.toString();
}

async function writeQr(filename, url) {
  await QRCode.toFile(fileURLToPath(new URL(`../public/${filename}`, import.meta.url)), url, {
    errorCorrectionLevel: 'H', width: 1600, margin: 4,
    color: { dark: '#123B4A', light: '#F7F1E5' },
  });
}

const menuUrl = validateUrl(process.env.NEXT_PUBLIC_MENU_URL, 'NEXT_PUBLIC_MENU_URL');
await writeQr('menu-qr.png', menuUrl);
console.log(`Menu QR generated for ${menuUrl}`);

if (process.env.NEXT_PUBLIC_MOBILE_APP_URL) {
  const appUrl = validateUrl(process.env.NEXT_PUBLIC_MOBILE_APP_URL, 'NEXT_PUBLIC_MOBILE_APP_URL');
  if (!appUrl.startsWith('https://')) throw new Error('NEXT_PUBLIC_MOBILE_APP_URL doit utiliser HTTPS.');
  await writeQr('app-install-qr.png', appUrl);
  console.log(`Application QR generated for ${appUrl}`);
} else {
  console.log('Application QR skipped: NEXT_PUBLIC_MOBILE_APP_URL is not configured.');
}
