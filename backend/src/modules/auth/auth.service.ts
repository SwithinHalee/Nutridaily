import { Inject, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';
import { authConfig } from '../../config/auth.config';
import { AuthErrors, ApiException } from '../../common/errors/api.exception';
import { PasswordHasherService } from '../../common/security/password-hasher.service';
import { RATE_LIMITS, RateLimiterService } from '../../common/security/rate-limiter.service';
import { generateOpaqueToken, hashToken, REFRESH_TOKEN_PATTERN } from '../../common/security/token.util';
import { MailService } from '../../common/mail/mail.service';
import { AccessTokenPayload } from '../../common/guards/jwt-auth.guard';
import {
  AUTH_REPOSITORY,
  AuthRepository,
  DuplicateUserError,
  RefreshTokenRecord,
  UserRecord,
} from './repository/auth.repository';
import { LoginInput, RegisterInput, ResetPasswordInput, passwordContainsPersonalData } from './auth.schemas';
import { RequestContext } from './auth-cookies';
import { HttpStatus } from '@nestjs/common';

export interface IssuedSession {
  accessToken: string;
  refreshToken: string;
  refreshExpiresAt: Date;
  sessionId: string;
}

export interface PublicUser {
  id: string;
  email: string;
  phone: string;
  fullName: string;
  role: string;
  isVerified: boolean;
  createdAt: string;
  passwordChangedAt: string | null;
}

export function toPublicUser(u: UserRecord): PublicUser {
  return {
    id: u.id,
    email: u.email,
    phone: u.phone,
    fullName: u.fullName,
    role: u.role,
    isVerified: u.isVerified,
    createdAt: u.createdAt.toISOString(),
    passwordChangedAt: u.passwordChangedAt ? u.passwordChangedAt.toISOString() : null,
  };
}

export const GENERIC_REGISTER_MESSAGE =
  'Pendaftaran diterima. Kami telah mengirim tautan verifikasi ke email Anda. Tautan berlaku 24 jam.';
export const GENERIC_FORGOT_MESSAGE =
  'Jika email terdaftar, tautan atur ulang kata sandi telah dikirim. Tautan berlaku 15 menit dan sekali pakai.';
export const GENERIC_RESEND_MESSAGE =
  'Jika akun ada dan belum diverifikasi, tautan verifikasi baru telah dikirim ke email tersebut.';

@Injectable()
export class AuthService {
  private readonly logger = new Logger('AuthService');

  constructor(
    @Inject(AUTH_REPOSITORY) private readonly repo: AuthRepository,
    private readonly jwt: JwtService,
    private readonly hasher: PasswordHasherService,
    private readonly limiter: RateLimiterService,
    private readonly mail: MailService,
  ) {}

  // ------------------------------------------------------------------ Registration

  /**
   * Always returns the same message whether or not the email/phone already exists, and always
   * pays the Argon2 cost first, so neither the response nor its timing enumerates accounts.
   * The real outcome is communicated only to the mailbox owner.
   */
  async register(input: RegisterInput, ctx: RequestContext): Promise<{ message: string }> {
    this.enforce(`register:ip:${ctx.ip}`, RATE_LIMITS.registerPerIp);

    const passwordHash = await this.hasher.hash(input.password);

    const existing = await this.repo.findUserByEmail(input.email);
    if (existing) {
      if (existing.isVerified) {
        this.mail.dispatch(
          this.mail.accountExistsEmail(existing.email, this.link('/account/login'), this.link('/account/forgot-password')),
        );
      } else if (this.limiter.consume(`verify-resend:email:${existing.email}`, 3, 15 * 60).allowed) {
        await this.sendVerificationEmail(existing);
      }
      return { message: GENERIC_REGISTER_MESSAGE };
    }

    try {
      const user = await this.repo.createUser({
        email: input.email,
        phone: input.phone,
        passwordHash,
        fullName: input.fullName,
      });
      await this.sendVerificationEmail(user);
      this.logger.log(`Registrasi baru user=${user.id} ip=${ctx.ip}`);
    } catch (err) {
      if (err instanceof DuplicateUserError) {
        if (err.field === 'phone') this.mail.dispatch(this.mail.phoneConflictEmail(input.email));
        // email race: another request created it a moment ago; same generic response.
      } else {
        throw err;
      }
    }
    return { message: GENERIC_REGISTER_MESSAGE };
  }

  async verifyEmail(token: string, ctx: RequestContext): Promise<{ message: string }> {
    this.enforce(`verify:ip:${ctx.ip}`, RATE_LIMITS.verifyTokenPerIp);
    const now = new Date();
    const record = await this.repo.consumeEmailVerificationToken(hashToken(token), now);
    if (!record) throw AuthErrors.invalidOneTimeToken();

    const user = await this.repo.findUserById(record.userId);
    if (!user || user.deletedAt) throw AuthErrors.invalidOneTimeToken();

    if (!user.isVerified) {
      await this.repo.updateUser(user.id, { isVerified: true, emailVerifiedAt: now });
    }
    await this.repo.invalidateEmailVerificationTokens(user.id, now);
    return { message: 'Email berhasil diverifikasi. Silakan masuk ke akun Anda.' };
  }

  async resendVerification(email: string, ctx: RequestContext): Promise<{ message: string }> {
    this.enforce(`verify-resend:ip:${ctx.ip}`, RATE_LIMITS.resendVerificationPerIp);
    const perEmail = this.limiter.consume(
      `verify-resend:email:${email}`,
      RATE_LIMITS.resendVerificationPerEmail.limit,
      RATE_LIMITS.resendVerificationPerEmail.windowSeconds,
    );
    if (perEmail.allowed) {
      const user = await this.repo.findUserByEmail(email);
      if (user && !user.isVerified) await this.sendVerificationEmail(user);
    }
    return { message: GENERIC_RESEND_MESSAGE };
  }

  // ------------------------------------------------------------------ Login / sessions

  async login(input: LoginInput, ctx: RequestContext): Promise<{ user: PublicUser; session: IssuedSession }> {
    this.enforce(`login:ip:${ctx.ip}`, RATE_LIMITS.loginPerIp);

    // Per-identifier failure budget. Applies to unknown emails too, so lockout behaviour
    // itself does not reveal whether an account exists.
    const failureKey = `login-fail:email:${input.email}`;
    const budget = this.limiter.peek(failureKey, RATE_LIMITS.loginFailuresPerEmail.limit);
    if (!budget.allowed) throw AuthErrors.tooManyAttempts(budget.retryAfterSeconds);

    const now = new Date();
    const user = await this.repo.findUserByEmail(input.email);

    if (!user) {
      await this.hasher.verifyDummy(input.password);
      this.recordLoginFailure(failureKey);
      await this.repo.recordLoginAuditLog({
        userId: null,
        email: input.email,
        status: 'FAILED',
        reason: 'INVALID_CREDENTIALS',
        ipAddress: ctx.ip,
        userAgent: ctx.userAgent,
      });
      this.logger.warn(`Login gagal: email tidak ditemukan email=${input.email} ip=${ctx.ip}`);
      throw AuthErrors.invalidCredentials();
    }

    if (user.lockedUntil && user.lockedUntil > now) {
      await this.repo.recordLoginAuditLog({
        userId: user.id,
        email: input.email,
        status: 'FAILED',
        reason: 'ACCOUNT_LOCKED',
        ipAddress: ctx.ip,
        userAgent: ctx.userAgent,
      });
      this.logger.warn(`Login ditolak: akun dikunci sementara user=${user.id} ip=${ctx.ip}`);
      throw AuthErrors.tooManyAttempts(Math.ceil((user.lockedUntil.getTime() - now.getTime()) / 1000));
    }

    const valid = await this.hasher.verify(user.passwordHash, input.password);
    if (!valid) {
      this.recordLoginFailure(failureKey);
      const failed = user.failedLoginCount + 1;
      const lock = failed >= authConfig.lockout.maxFailedAttempts;
      await this.repo.updateUser(user.id, {
        failedLoginCount: lock ? 0 : failed,
        lockedUntil: lock ? new Date(now.getTime() + authConfig.lockout.lockSeconds * 1000) : user.lockedUntil,
      });
      await this.repo.recordLoginAuditLog({
        userId: user.id,
        email: input.email,
        status: 'FAILED',
        reason: 'INVALID_CREDENTIALS',
        ipAddress: ctx.ip,
        userAgent: ctx.userAgent,
      });
      if (lock) this.logger.warn(`Akun dikunci sementara user=${user.id} ip=${ctx.ip}`);
      throw AuthErrors.invalidCredentials();
    }

    // Correct password from here on. Only now is it safe to reveal verification status.
    if (!user.isVerified) {
      await this.repo.recordLoginAuditLog({
        userId: user.id,
        email: input.email,
        status: 'FAILED',
        reason: 'EMAIL_NOT_VERIFIED',
        ipAddress: ctx.ip,
        userAgent: ctx.userAgent,
      });
      throw AuthErrors.emailNotVerified();
    }

    this.limiter.reset(failureKey);
    const patch: Parameters<AuthRepository['updateUser']>[1] = {
      failedLoginCount: 0,
      lockedUntil: null,
      lastLoginAt: now,
    };
    if (this.hasher.needsRehash(user.passwordHash)) {
      patch.passwordHash = await this.hasher.hash(input.password);
    }
    const updated = await this.repo.updateUser(user.id, patch);
    const session = await this.issueSession(updated, ctx);

    await this.repo.recordLoginAuditLog({
      userId: updated.id,
      email: updated.email,
      status: 'SUCCESS',
      ipAddress: ctx.ip,
      userAgent: ctx.userAgent,
    });
    this.logger.log(`Login berhasil user=${updated.id} email=${updated.email} ip=${ctx.ip}`);

    return { user: toPublicUser(updated), session };
  }

  async getLoginHistory(userId: string, limit = 20) {
    return this.repo.getLoginHistory(userId, limit);
  }

  /**
   * Refresh token rotation with reuse detection.
   * - Valid active token: revoke it and issue a successor in the same family.
   * - Revoked token presented again: if it was rotated seconds ago this is a benign multi-tab
   *   race; otherwise it is a replay of a stolen token, so the entire family is revoked.
   */
  async refresh(rawToken: string | undefined, ctx: RequestContext): Promise<IssuedSession> {
    this.enforce(`refresh:ip:${ctx.ip}`, RATE_LIMITS.refreshPerIp);
    if (!rawToken || !REFRESH_TOKEN_PATTERN.test(rawToken)) throw AuthErrors.refreshInvalid();

    const now = new Date();
    const record = await this.repo.findRefreshTokenByHash(hashToken(rawToken));
    if (!record) throw AuthErrors.refreshInvalid();

    if (record.revokedAt) {
      const ageMs = now.getTime() - record.revokedAt.getTime();
      if (record.revokedReason === 'ROTATED' && ageMs <= authConfig.refresh.reuseGraceSeconds * 1000) {
        throw AuthErrors.refreshRace();
      }
      if (record.revokedReason === 'ROTATED') {
        const n = await this.repo.revokeRefreshTokenFamily(record.familyId, 'REUSE_DETECTED', now);
        this.logger.warn(
          `Refresh token reuse terdeteksi. family=${record.familyId} user=${record.userId} ip=${ctx.ip} revoked=${n}`,
        );
      }
      throw AuthErrors.refreshInvalid();
    }

    if (record.expiresAt <= now) throw AuthErrors.refreshInvalid();

    const user = await this.repo.findUserById(record.userId);
    if (!user || user.deletedAt || !user.isVerified) {
      await this.repo.revokeRefreshTokenFamily(record.familyId, 'USER_INVALID', now);
      throw AuthErrors.refreshInvalid();
    }

    const nextRaw = generateOpaqueToken(48);
    const rotated = await this.repo.rotateRefreshToken(
      record.id,
      {
        userId: user.id,
        tokenHash: hashToken(nextRaw),
        familyId: record.familyId,
        // Absolute lifetime: the successor inherits the family's original expiry.
        expiresAt: record.expiresAt,
        userAgent: ctx.userAgent,
        ipAddress: ctx.ip,
      },
      now,
    );
    if (!rotated) throw AuthErrors.refreshRace();

    return {
      accessToken: await this.signAccessToken(user, record.familyId),
      refreshToken: nextRaw,
      refreshExpiresAt: rotated.expiresAt,
      sessionId: record.familyId,
    };
  }

  /** Idempotent: always succeeds so the client can always clear its cookies. */
  async logout(rawToken: string | undefined): Promise<void> {
    if (!rawToken || !REFRESH_TOKEN_PATTERN.test(rawToken)) return;
    const record = await this.repo.findRefreshTokenByHash(hashToken(rawToken));
    if (record) await this.repo.revokeRefreshTokenFamily(record.familyId, 'LOGOUT', new Date());
  }

  async logoutAll(userId: string): Promise<void> {
    const now = new Date();
    await this.repo.revokeAllUserRefreshTokens(userId, 'LOGOUT_ALL', now);
    await this.repo.bumpTokenVersion(userId);
  }

  async issueSession(user: UserRecord, ctx: RequestContext, existing?: RefreshTokenRecord): Promise<IssuedSession> {
    const familyId = existing?.familyId ?? randomUUID();
    const refreshToken = generateOpaqueToken(48);
    const refreshExpiresAt = new Date(Date.now() + authConfig.refresh.ttlSeconds * 1000);
    await this.repo.createRefreshToken({
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      familyId,
      expiresAt: refreshExpiresAt,
      userAgent: ctx.userAgent,
      ipAddress: ctx.ip,
    });
    return {
      accessToken: await this.signAccessToken(user, familyId),
      refreshToken,
      refreshExpiresAt,
      sessionId: familyId,
    };
  }

  // ------------------------------------------------------------------ Password recovery

  async forgotPassword(email: string, ctx: RequestContext): Promise<{ message: string }> {
    this.enforce(`forgot:ip:${ctx.ip}`, RATE_LIMITS.forgotPerIp);
    const perEmail = this.limiter.consume(
      `forgot:email:${email}`,
      RATE_LIMITS.forgotPerEmail.limit,
      RATE_LIMITS.forgotPerEmail.windowSeconds,
    );
    // Over the per-email budget: silently skip sending, but answer identically.
    if (!perEmail.allowed) return { message: GENERIC_FORGOT_MESSAGE };

    const user = await this.repo.findUserByEmail(email);
    if (user) {
      const now = new Date();
      await this.repo.invalidatePasswordResetTokens(user.id, now);
      const token = generateOpaqueToken();
      const ttl = authConfig.tokens.passwordResetTtlSeconds;
      await this.repo.createPasswordResetToken(user.id, hashToken(token), new Date(now.getTime() + ttl * 1000), ctx.ip);
      const link = this.link(`/account/reset-password?token=${token}`);
      this.mail.dispatch(this.mail.passwordResetEmail(user.email, user.fullName, link, Math.round(ttl / 60)), link);
    }
    return { message: GENERIC_FORGOT_MESSAGE };
  }

  async resetPassword(input: ResetPasswordInput, ctx: RequestContext): Promise<{ message: string }> {
    this.enforce(`reset:ip:${ctx.ip}`, RATE_LIMITS.resetTokenPerIp);
    const now = new Date();
    const record = await this.repo.consumePasswordResetToken(hashToken(input.token), now);
    if (!record) throw AuthErrors.invalidOneTimeToken();

    const user = await this.repo.findUserById(record.userId);
    if (!user || user.deletedAt) throw AuthErrors.invalidOneTimeToken();

    const personal = passwordContainsPersonalData(input.password, user);
    if (personal) {
      throw new ApiException(HttpStatus.BAD_REQUEST, 'VALIDATION_FAILED', personal);
    }

    const passwordHash = await this.hasher.hash(input.password);
    // Reset via the mailbox proves email ownership, so it also verifies the address.
    await this.repo.bumpTokenVersion(user.id, {
      passwordHash,
      passwordChangedAt: now,
      failedLoginCount: 0,
      lockedUntil: null,
      isVerified: true,
      emailVerifiedAt: user.emailVerifiedAt ?? now,
    });
    const revoked = await this.repo.revokeAllUserRefreshTokens(user.id, 'PASSWORD_RESET', now);
    await this.repo.invalidatePasswordResetTokens(user.id, now);
    this.limiter.reset(`login-fail:email:${user.email}`);

    this.logger.log(`Password reset user=${user.id} ip=${ctx.ip} sessionsRevoked=${revoked}`);
    this.mail.dispatch(this.mail.passwordChangedEmail(user.email, user.fullName, this.link('/account/forgot-password')));
    return { message: 'Kata sandi berhasil diperbarui. Semua sesi lama telah dikeluarkan. Silakan masuk kembali.' };
  }

  // ------------------------------------------------------------------ Helpers

  private async sendVerificationEmail(user: UserRecord): Promise<void> {
    const now = new Date();
    await this.repo.invalidateEmailVerificationTokens(user.id, now);
    const token = generateOpaqueToken();
    const ttl = authConfig.tokens.emailVerificationTtlSeconds;
    await this.repo.createEmailVerificationToken(user.id, hashToken(token), new Date(now.getTime() + ttl * 1000));
    const link = this.link(`/account/verify-email?token=${token}`);
    this.mail.dispatch(this.mail.verificationEmail(user.email, user.fullName, link, Math.round(ttl / 3600)), link);
  }

  private signAccessToken(user: UserRecord, sessionId: string): Promise<string> {
    const payload: AccessTokenPayload = { sub: user.id, role: user.role, tv: user.tokenVersion, sid: sessionId };
    return this.jwt.signAsync(payload, {
      secret: authConfig.jwt.accessSecret,
      algorithm: 'HS256',
      expiresIn: authConfig.jwt.accessTtlSeconds,
      issuer: authConfig.jwt.issuer,
      audience: authConfig.jwt.audience,
      jwtid: randomUUID(),
    });
  }

  private recordLoginFailure(key: string): void {
    this.limiter.consume(key, RATE_LIMITS.loginFailuresPerEmail.limit, RATE_LIMITS.loginFailuresPerEmail.windowSeconds);
  }

  private enforce(key: string, policy: { limit: number; windowSeconds: number }): void {
    const result = this.limiter.consume(key, policy.limit, policy.windowSeconds);
    if (!result.allowed) throw AuthErrors.tooManyAttempts(result.retryAfterSeconds);
  }

  private link(pathAndQuery: string): string {
    return `${authConfig.frontendUrl}${pathAndQuery}`;
  }
}
