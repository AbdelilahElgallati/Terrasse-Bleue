import { HttpException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { AuthRateLimitGuard } from './auth-rate-limit.guard';

function context(path: string, ip = '127.0.0.1') {
  return {
    switchToHttp: () => ({ getRequest: () => ({ path, ip, socket: {} }) }),
  } as ExecutionContext;
}

describe('AuthRateLimitGuard', () => {
  it('limits login attempts per IP without affecting other auth routes', () => {
    const guard = new AuthRateLimitGuard();
    for (let index = 0; index < 10; index += 1)
      expect(guard.canActivate(context('/auth/login'))).toBe(true);
    expect(() => guard.canActivate(context('/auth/login'))).toThrow(
      HttpException,
    );
    expect(guard.canActivate(context('/auth/refresh'))).toBe(true);
  });

  it('uses a stricter registration threshold', () => {
    const guard = new AuthRateLimitGuard();
    for (let index = 0; index < 5; index += 1)
      expect(guard.canActivate(context('/auth/register', '10.0.0.2'))).toBe(
        true,
      );
    expect(() =>
      guard.canActivate(context('/auth/register', '10.0.0.2')),
    ).toThrow(HttpException);
  });
});
