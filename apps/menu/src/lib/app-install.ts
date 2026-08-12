export type AppInstallConfig = {
  url?: string;
  isDemo: boolean;
};

export function getAppInstallConfig(): AppInstallConfig {
  const value = process.env.NEXT_PUBLIC_MOBILE_APP_URL?.trim();
  if (!value) return { isDemo: true };
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:') return { isDemo: true };
    return {
      url: url.toString(),
      isDemo: process.env.NEXT_PUBLIC_MOBILE_APP_DISTRIBUTION !== 'production',
    };
  } catch {
    return { isDemo: true };
  }
}

