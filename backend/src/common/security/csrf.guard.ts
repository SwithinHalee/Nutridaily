import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { authConfig } from '../../config/auth.config';
import { AuthErrors } from '../errors/api.exception';
import { generateOpaqueToken, hmacSha256, safeEqual } from './token.util';
import { readCookie } from '../../modules/auth/auth-cookies';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/** Signed token: `<nonce>.<issuedAtSeconds>.<hmac(nonce.issuedAt)>`. */
export function issueCsrfToken(now = Date.now()): string {
  const nonce = generateOpaqueToken(24);
  const issuedAt = Math.floor(now / 1000).toString(36);
  const payload = `${nonce}.${issuedAt}`;
  return `${payload}.${hmacSha256(authConfig.csrf.secret, payload)}`;
}

export function isCsrfTokenAuthentic(token: string, now = Date.now()): boolean {
  if (!token || token.length > 200) return false;
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  const [nonce, issuedAt, signature] = parts;
  if (!safeEqual(signature, hmacSha256(authConfig.csrf.secret, `${nonce}.${issuedAt}`))) return false;
  const issuedMs = parseInt(issuedAt, 36) * 1000;
  return Number.isFinite(issuedMs) && now - issuedMs <= authConfig.csrf.ttlSeconds * 1000 && issuedMs <= now + 60_000;
}

/**
 * CSRF protection for cookie-authenticated endpoints (signed double-submit cookie):
 * 1. If an Origin header is present on a state-changing request it must be allow-listed.
 * 2. The X-CSRF-Token header must equal the nd_csrf cookie (an attacker site cannot read it).
 * 3. The token must carry a valid HMAC and be unexpired (an attacker cannot mint one).
 */
@Injectable()
export class CsrfGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    if (SAFE_METHODS.has(req.method)) return true;

    const origin = req.headers.origin;
    if (origin && !authConfig.cors.allowedOrigins.includes(origin)) {
      throw AuthErrors.originForbidden();
    }

    const header = req.headers[authConfig.csrf.headerName];
    const headerToken = Array.isArray(header) ? header[0] : header;
    const cookieToken = readCookie(req, authConfig.cookies.csrfName);

    if (!headerToken || !cookieToken || !safeEqual(headerToken, cookieToken) || !isCsrfTokenAuthentic(headerToken)) {
      throw AuthErrors.csrfInvalid();
    }
    return true;
  }
}
