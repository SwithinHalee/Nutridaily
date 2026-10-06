import { Injectable, OnModuleDestroy } from '@nestjs/common';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

interface Bucket {
  count: number;
  resetAt: number;
}

/**
 * Fixed-window rate limiter keyed by arbitrary identifiers (IP, normalised email, user id).
 *
 * Single-process in-memory store. For horizontally scaled deployments, swap the Map for Redis
 * (INCR + PEXPIRE) behind this same interface; ioredis is already a project dependency.
 */
@Injectable()
export class RateLimiterService implements OnModuleDestroy {
  private readonly buckets = new Map<string, Bucket>();
  private readonly sweeper: NodeJS.Timeout;

  constructor() {
    this.sweeper = setInterval(() => this.sweep(), 60_000);
    this.sweeper.unref();
  }

  /** Counts one hit against the key and reports whether it is still within the limit. */
  consume(key: string, limit: number, windowSeconds: number, now = Date.now()): RateLimitResult {
    const bucket = this.getActiveBucket(key, windowSeconds, now);
    bucket.count += 1;
    return this.toResult(bucket, limit, now);
  }

  /** Reports state without counting a hit. */
  peek(key: string, limit: number, now = Date.now()): RateLimitResult {
    const bucket = this.buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      return { allowed: true, remaining: limit, retryAfterSeconds: 0 };
    }
    return {
      allowed: bucket.count < limit,
      remaining: Math.max(0, limit - bucket.count),
      retryAfterSeconds: bucket.count < limit ? 0 : Math.ceil((bucket.resetAt - now) / 1000),
    };
  }

  reset(key: string): void {
    this.buckets.delete(key);
  }

  onModuleDestroy(): void {
    clearInterval(this.sweeper);
  }

  private getActiveBucket(key: string, windowSeconds: number, now: number): Bucket {
    const existing = this.buckets.get(key);
    if (existing && existing.resetAt > now) return existing;
    const fresh: Bucket = { count: 0, resetAt: now + windowSeconds * 1000 };
    this.buckets.set(key, fresh);
    return fresh;
  }

  private toResult(bucket: Bucket, limit: number, now: number): RateLimitResult {
    const allowed = bucket.count <= limit;
    return {
      allowed,
      remaining: Math.max(0, limit - bucket.count),
      retryAfterSeconds: allowed ? 0 : Math.ceil((bucket.resetAt - now) / 1000),
    };
  }

  private sweep(now = Date.now()): void {
    for (const [key, bucket] of this.buckets) {
      if (bucket.resetAt <= now) this.buckets.delete(key);
    }
  }
}

/** Named policies so limits live in one place. */
export const RATE_LIMITS = {
  loginPerIp: { limit: 20, windowSeconds: 15 * 60 },
  loginFailuresPerEmail: { limit: 5, windowSeconds: 15 * 60 },
  registerPerIp: { limit: 5, windowSeconds: 60 * 60 },
  forgotPerIp: { limit: 5, windowSeconds: 15 * 60 },
  forgotPerEmail: { limit: 3, windowSeconds: 15 * 60 },
  resendVerificationPerIp: { limit: 5, windowSeconds: 15 * 60 },
  resendVerificationPerEmail: { limit: 3, windowSeconds: 15 * 60 },
  verifyTokenPerIp: { limit: 20, windowSeconds: 15 * 60 },
  resetTokenPerIp: { limit: 10, windowSeconds: 15 * 60 },
  refreshPerIp: { limit: 120, windowSeconds: 15 * 60 },
  passwordConfirmPerUser: { limit: 5, windowSeconds: 15 * 60 },
} as const;
