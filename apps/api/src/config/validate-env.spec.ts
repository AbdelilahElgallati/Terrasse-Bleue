import { validateEnvironment } from './validate-env';

const valid = {
  NODE_ENV: 'production',
  DATABASE_URL: 'postgresql://user:password@example.com:5432/database',
  JWT_ACCESS_SECRET: 'a'.repeat(48),
  JWT_REFRESH_SECRET: 'b'.repeat(48),
  CORS_ORIGIN: 'https://admin.example.com,https://menu.example.com',
};

describe('validateEnvironment', () => {
  it('accepts an explicit production configuration', () => {
    expect(validateEnvironment({ ...valid })).toMatchObject(valid);
  });

  it('rejects identical JWT secrets', () => {
    expect(() => validateEnvironment({ ...valid, JWT_REFRESH_SECRET: valid.JWT_ACCESS_SECRET })).toThrow('must be different');
  });

  it('rejects wildcard or insecure production origins', () => {
    expect(() => validateEnvironment({ ...valid, CORS_ORIGIN: '*' })).toThrow('explicit HTTPS');
    expect(() => validateEnvironment({ ...valid, CORS_ORIGIN: 'http://admin.example.com' })).toThrow('explicit HTTPS');
  });
});
