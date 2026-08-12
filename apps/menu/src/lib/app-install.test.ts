import { afterEach, describe, expect, it } from 'vitest';
import { getAppInstallConfig } from './app-install';

const originalUrl = process.env.NEXT_PUBLIC_MOBILE_APP_URL;
const originalDistribution = process.env.NEXT_PUBLIC_MOBILE_APP_DISTRIBUTION;

afterEach(() => {
  if (originalUrl === undefined) delete process.env.NEXT_PUBLIC_MOBILE_APP_URL;
  else process.env.NEXT_PUBLIC_MOBILE_APP_URL = originalUrl;
  if (originalDistribution === undefined) delete process.env.NEXT_PUBLIC_MOBILE_APP_DISTRIBUTION;
  else process.env.NEXT_PUBLIC_MOBILE_APP_DISTRIBUTION = originalDistribution;
});

describe('getAppInstallConfig', () => {
  it('fails safely when the URL is absent or invalid', () => {
    delete process.env.NEXT_PUBLIC_MOBILE_APP_URL;
    expect(getAppInstallConfig()).toEqual({ isDemo: true });
    process.env.NEXT_PUBLIC_MOBILE_APP_URL = 'http://localhost/app';
    expect(getAppInstallConfig()).toEqual({ isDemo: true });
  });

  it('accepts an HTTPS demo distribution URL', () => {
    process.env.NEXT_PUBLIC_MOBILE_APP_URL = 'https://example.com/install';
    process.env.NEXT_PUBLIC_MOBILE_APP_DISTRIBUTION = 'demo';
    expect(getAppInstallConfig()).toEqual({ url: 'https://example.com/install', isDemo: true });
  });

  it('identifies a production installation landing page', () => {
    process.env.NEXT_PUBLIC_MOBILE_APP_URL = 'https://example.com/app';
    process.env.NEXT_PUBLIC_MOBILE_APP_DISTRIBUTION = 'production';
    expect(getAppInstallConfig()).toEqual({ url: 'https://example.com/app', isDemo: false });
  });
});

