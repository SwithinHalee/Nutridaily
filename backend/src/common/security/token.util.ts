import { createHash, createHmac, randomBytes, timingSafeEqual } from 'crypto';

/** 32 random bytes => 43 char base64url string (256 bits of entropy). */
export function generateOpaqueToken(bytes = 32): string {
  return randomBytes(bytes).toString('base64url');
}

/**
 * Tokens are high-entropy random values, so a fast unsalted SHA-256 is the correct primitive
 * for storage (a slow KDF is only needed for low-entropy human passwords).
 */
export function hashToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex');
}

export function hmacSha256(secret: string, value: string): string {
  return createHmac('sha256', secret).update(value, 'utf8').digest('base64url');
}

/** Constant-time string comparison that does not leak length via early exit. */
export function safeEqual(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) {
    // Still burn a comparison so timing is independent of where the mismatch is.
    timingSafeEqual(bufA, bufA);
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

export const OPAQUE_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;
export const REFRESH_TOKEN_PATTERN = /^[A-Za-z0-9_-]{64}$/;
