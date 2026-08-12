type ApiEnvironment = Record<string, unknown>;

function required(environment: ApiEnvironment, key: string) {
  const value = String(environment[key] ?? '').trim();
  if (!value) throw new Error(`${key} is required.`);
  return value;
}

export function validateEnvironment(environment: ApiEnvironment) {
  const production = environment.NODE_ENV === 'production';
  const databaseUrl = required(environment, 'DATABASE_URL');
  if (!/^postgres(?:ql)?:\/\//i.test(databaseUrl)) {
    throw new Error('DATABASE_URL must be a PostgreSQL connection string.');
  }

  const accessSecret = required(environment, 'JWT_ACCESS_SECRET');
  const refreshSecret = required(environment, 'JWT_REFRESH_SECRET');
  if (accessSecret === refreshSecret) {
    throw new Error('JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be different.');
  }

  if (production) {
    if (accessSecret.length < 32 || refreshSecret.length < 32) {
      throw new Error('Production JWT secrets must contain at least 32 characters.');
    }
    if (/replace|secret|example/i.test(accessSecret + refreshSecret)) {
      throw new Error('Placeholder JWT secrets are forbidden in production.');
    }
    const origins = required(environment, 'CORS_ORIGIN')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean);
    if (!origins.length || origins.some((origin) => origin === '*' || !origin.startsWith('https://'))) {
      throw new Error('Production CORS_ORIGIN must contain explicit HTTPS origins only.');
    }
  }

  return environment;
}
