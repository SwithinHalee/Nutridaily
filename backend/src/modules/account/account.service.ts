import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { ApiException, AuthErrors } from '../../common/errors/api.exception';
import { PasswordHasherService } from '../../common/security/password-hasher.service';
import { RATE_LIMITS, RateLimiterService } from '../../common/security/rate-limiter.service';
import { MailService } from '../../common/mail/mail.service';
import { authConfig } from '../../config/auth.config';
import { AUTH_REPOSITORY, AuthRepository, DuplicateUserError, UserRecord } from '../auth/repository/auth.repository';
import { AuthService, IssuedSession, PublicUser, toPublicUser } from '../auth/auth.service';
import {
  ChangePasswordInput,
  DeleteAccountInput,
  UpdateProfileInput,
  passwordContainsPersonalData,
} from '../auth/auth.schemas';
import { RequestContext } from '../auth/auth-cookies';

export interface SessionView {
  id: string;
  current: boolean;
  device: string;
  ipAddress: string | null;
  createdAt: string;
  lastUsedAt: string | null;
  expiresAt: string;
}

/** Turns a raw user agent into a short, non-identifying label for the session list. */
function describeDevice(ua: string | null): string {
  if (!ua) return 'Perangkat tidak dikenal';
  const browser = /Edg\//.test(ua)
    ? 'Edge'
    : /Chrome\//.test(ua)
      ? 'Chrome'
      : /Firefox\//.test(ua)
        ? 'Firefox'
        : /Safari\//.test(ua)
          ? 'Safari'
          : 'Peramban';
  const os = /Windows/.test(ua)
    ? 'Windows'
    : /Android/.test(ua)
      ? 'Android'
      : /iPhone|iPad/.test(ua)
        ? 'iOS'
        : /Mac OS X/.test(ua)
          ? 'macOS'
          : /Linux/.test(ua)
            ? 'Linux'
            : 'OS lain';
  return `${browser} di ${os}`;
}

@Injectable()
export class AccountService {
  private readonly logger = new Logger('AccountService');

  constructor(
    @Inject(AUTH_REPOSITORY) private readonly repo: AuthRepository,
    private readonly hasher: PasswordHasherService,
    private readonly limiter: RateLimiterService,
    private readonly mail: MailService,
    private readonly auth: AuthService,
  ) {}

  async getProfile(userId: string): Promise<PublicUser> {
    return toPublicUser(await this.mustGetActiveUser(userId));
  }

  async updateProfile(userId: string, input: UpdateProfileInput): Promise<PublicUser> {
    const user = await this.mustGetActiveUser(userId);
    try {
      const updated = await this.repo.updateUser(user.id, {
        ...(input.fullName !== undefined ? { fullName: input.fullName } : {}),
        ...(input.phone !== undefined ? { phone: input.phone } : {}),
      });
      return toPublicUser(updated);
    } catch (err) {
      // The caller is authenticated, so telling them the phone is taken is acceptable here.
      if (err instanceof DuplicateUserError) throw AuthErrors.phoneTaken();
      throw err;
    }
  }

  /**
   * Re-authenticates with the current password, rotates the hash, bumps tokenVersion and revokes
   * every refresh token (all devices, including this one), then issues a fresh session for the
   * current device so the user stays signed in here only.
   */
  async changePassword(userId: string, input: ChangePasswordInput, ctx: RequestContext): Promise<IssuedSession> {
    const user = await this.mustGetActiveUser(userId);
    await this.confirmPassword(user, input.currentPassword);

    const personal = passwordContainsPersonalData(input.newPassword, user);
    if (personal) throw new ApiException(HttpStatus.BAD_REQUEST, 'VALIDATION_FAILED', personal);

    const now = new Date();
    const updated = await this.repo.bumpTokenVersion(user.id, {
      passwordHash: await this.hasher.hash(input.newPassword),
      passwordChangedAt: now,
    });
    const revoked = await this.repo.revokeAllUserRefreshTokens(user.id, 'PASSWORD_CHANGED', now);
    await this.repo.invalidatePasswordResetTokens(user.id, now);

    this.logger.log(`Password changed user=${user.id} ip=${ctx.ip} sessionsRevoked=${revoked}`);
    this.mail.dispatch(
      this.mail.passwordChangedEmail(user.email, user.fullName, `${authConfig.frontendUrl}/account/forgot-password`),
    );
    return this.auth.issueSession(updated, ctx);
  }

  async deleteAccount(userId: string, input: DeleteAccountInput, ctx: RequestContext): Promise<void> {
    const user = await this.mustGetActiveUser(userId);
    await this.confirmPassword(user, input.password);

    // Capture contact details before they are anonymised.
    const { email, fullName } = user;
    await this.repo.softDeleteUser(user.id, await this.hasher.unusableHash());
    await this.repo.revokeAllUserRefreshTokens(user.id, 'ACCOUNT_DELETED', new Date());

    this.logger.log(`Account soft-deleted user=${user.id} ip=${ctx.ip}`);
    this.mail.dispatch(this.mail.accountDeletedEmail(email, fullName));
  }

  async listSessions(userId: string, currentSessionId: string): Promise<SessionView[]> {
    const sessions = await this.repo.listActiveSessions(userId, new Date());
    return sessions.map((s) => ({
      id: s.familyId,
      current: s.familyId === currentSessionId,
      device: describeDevice(s.userAgent),
      ipAddress: s.ipAddress,
      createdAt: s.createdAt.toISOString(),
      lastUsedAt: s.lastUsedAt ? s.lastUsedAt.toISOString() : null,
      expiresAt: s.expiresAt.toISOString(),
    }));
  }

  async listLoginHistory(userId: string, limit = 20) {
    const logs = await this.auth.getLoginHistory(userId, limit);
    return logs.map((l) => ({
      id: l.id,
      status: l.status,
      reason: l.reason,
      device: describeDevice(l.userAgent),
      ipAddress: l.ipAddress,
      createdAt: l.createdAt.toISOString(),
    }));
  }

  private async confirmPassword(user: UserRecord, password: string): Promise<void> {
    const key = `confirm-password:user:${user.id}`;
    const budget = this.limiter.peek(key, RATE_LIMITS.passwordConfirmPerUser.limit);
    if (!budget.allowed) throw AuthErrors.tooManyAttempts(budget.retryAfterSeconds);

    if (!(await this.hasher.verify(user.passwordHash, password))) {
      this.limiter.consume(key, RATE_LIMITS.passwordConfirmPerUser.limit, RATE_LIMITS.passwordConfirmPerUser.windowSeconds);
      throw AuthErrors.wrongCurrentPassword();
    }
    this.limiter.reset(key);
  }

  private async mustGetActiveUser(userId: string): Promise<UserRecord> {
    const user = await this.repo.findUserById(userId);
    if (!user || user.deletedAt) throw AuthErrors.unauthenticated();
    return user;
  }
}
