import { CanActivate, ExecutionContext, Inject, Injectable, createParamDecorator } from '@nestjs/common';
import { JwtService, TokenExpiredError } from '@nestjs/jwt';
import { Request } from 'express';
import { authConfig } from '../../config/auth.config';
import { AuthErrors } from '../errors/api.exception';
import { AUTH_REPOSITORY, AuthRepository, UserRole } from '../../modules/auth/repository/auth.repository';
import { readCookie } from '../../modules/auth/auth-cookies';

export interface AccessTokenPayload {
  sub: string;
  role: UserRole;
  /** User.tokenVersion at issue time. */
  tv: number;
  /** Refresh token family id = session id. */
  sid: string;
}

export interface AuthenticatedUser {
  id: string;
  role: UserRole;
  sessionId: string;
}

export type AuthenticatedRequest = Request & { user?: AuthenticatedUser };

/**
 * Protects routes with the short-lived access token from the HTTP-only cookie.
 * A token is accepted only if ALL of the following hold:
 * - HS256 signature, issuer, audience and expiry verify;
 * - the user still exists, is not soft-deleted and has a verified email;
 * - its `tv` claim equals the user's current tokenVersion (password change / logout-all
 *   invalidate instantly instead of waiting for the 15 minute expiry);
 * - its session (refresh family) has not been revoked, so single-device logout is instant too.
 * Role checks are layered on top with the existing RolesGuard + @Roles().
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    @Inject(AUTH_REPOSITORY) private readonly repo: AuthRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = readCookie(req, authConfig.cookies.accessName);
    if (!token) throw AuthErrors.unauthenticated();

    let payload: AccessTokenPayload;
    try {
      payload = await this.jwt.verifyAsync<AccessTokenPayload>(token, {
        secret: authConfig.jwt.accessSecret,
        algorithms: ['HS256'],
        issuer: authConfig.jwt.issuer,
        audience: authConfig.jwt.audience,
      });
    } catch (err) {
      if (err instanceof TokenExpiredError) throw AuthErrors.accessTokenExpired();
      throw AuthErrors.unauthenticated();
    }

    if (typeof payload?.sub !== 'string' || typeof payload.tv !== 'number' || typeof payload.sid !== 'string') {
      throw AuthErrors.unauthenticated();
    }

    const user = await this.repo.findUserById(payload.sub);
    if (!user || user.deletedAt || !user.isVerified || user.tokenVersion !== payload.tv) {
      throw AuthErrors.unauthenticated();
    }
    if (!(await this.repo.isSessionActive(payload.sid, new Date()))) {
      throw AuthErrors.unauthenticated();
    }

    // Role is read from the database, not the token, so a demotion applies immediately.
    req.user = { id: user.id, role: user.role, sessionId: payload.sid };
    return true;
  }
}

export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
  return ctx.switchToHttp().getRequest<AuthenticatedRequest>().user;
});
