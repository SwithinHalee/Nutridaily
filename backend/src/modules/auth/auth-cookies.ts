import { CookieOptions, Request, Response } from 'express';
import { authConfig } from '../../config/auth.config';

export interface RequestContext {
  ip: string | null;
  userAgent: string | null;
}

export function requestContext(req: Request): RequestContext {
  const ua = req.headers['user-agent'];
  return {
    ip: (req.ip || req.socket?.remoteAddress || null)?.slice(0, 64) ?? null,
    userAgent: typeof ua === 'string' ? ua.slice(0, 256) : null,
  };
}

function baseCookie(): CookieOptions {
  return {
    httpOnly: true,
    secure: authConfig.cookies.secure,
    // Strict: the browser never attaches these cookies to cross-site requests, which is the
    // primary CSRF defence. The signed double-submit token is the second layer.
    sameSite: 'strict',
    domain: authConfig.cookies.domain,
  };
}

export function setSessionCookies(
  res: Response,
  tokens: { accessToken: string; refreshToken: string; refreshExpiresAt: Date },
): void {
  const { accessName, refreshName, refreshPath } = authConfig.cookies;
  res.cookie(accessName, tokens.accessToken, {
    ...baseCookie(),
    path: '/',
    maxAge: authConfig.jwt.accessTtlSeconds * 1000,
  });
  res.cookie(refreshName, tokens.refreshToken, {
    ...baseCookie(),
    path: refreshPath,
    expires: tokens.refreshExpiresAt,
  });
}

export function clearSessionCookies(res: Response): void {
  const { accessName, refreshName, refreshPath } = authConfig.cookies;
  res.clearCookie(accessName, { ...baseCookie(), path: '/' });
  res.clearCookie(refreshName, { ...baseCookie(), path: refreshPath });
}

export function setCsrfCookie(res: Response, token: string): void {
  res.cookie(authConfig.cookies.csrfName, token, {
    ...baseCookie(),
    // Readable by JS on same-host deployments. Cross-host frontends receive it in the JSON body.
    httpOnly: false,
    path: '/',
    maxAge: authConfig.csrf.ttlSeconds * 1000,
  });
}

export function readCookie(req: Request, name: string): string | undefined {
  const value = (req.cookies as Record<string, unknown> | undefined)?.[name];
  return typeof value === 'string' && value.length > 0 && value.length <= 4096 ? value : undefined;
}
