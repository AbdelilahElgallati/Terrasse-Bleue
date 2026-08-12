import {
  CanActivate,
  ExecutionContext,
  HttpException,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';

type Bucket = { count: number; resetAt: number };

@Injectable()
export class AuthRateLimitGuard implements CanActivate {
  private readonly buckets = new Map<string, Bucket>();

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();
    const route = request.path;
    const { limit, windowMs } = this.policy(route);
    const now = Date.now();
    const key = `${request.ip ?? request.socket.remoteAddress ?? 'unknown'}:${route}`;
    const current = this.buckets.get(key);
    if (!current || current.resetAt <= now) {
      this.buckets.set(key, { count: 1, resetAt: now + windowMs });
      this.prune(now);
      return true;
    }
    if (current.count >= limit)
      throw new HttpException(
        'Trop de tentatives. Réessayez dans quelques instants.',
        429,
      );
    current.count += 1;
    return true;
  }

  private policy(route: string) {
    if (route.includes('register')) return { limit: 5, windowMs: 5 * 60_000 };
    if (route.includes('guest')) return { limit: 20, windowMs: 60_000 };
    if (route.includes('refresh')) return { limit: 20, windowMs: 60_000 };
    return { limit: 10, windowMs: 60_000 };
  }

  private prune(now: number) {
    if (this.buckets.size < 1_000) return;
    for (const [key, bucket] of this.buckets)
      if (bucket.resetAt <= now) this.buckets.delete(key);
  }
}
