import { randomUUID } from 'crypto';
import {
  AuthRepository,
  CreateLoginAuditLogData,
  CreateRefreshTokenData,
  CreateUserData,
  DuplicateUserError,
  LoginAuditLogRecord,
  OneTimeTokenRecord,
  RefreshTokenRecord,
  RevokeReason,
  SessionSummary,
  UserPatch,
  UserRecord,
} from './auth.repository';

const clone = <T>(v: T): T => (v ? { ...v } : v);

/**
 * Development / test store with the same semantics as the Prisma repository.
 * Node runs JS on a single thread and none of these methods await between read and write,
 * so each compare-and-set below is atomic. Data is lost on restart by design.
 */
export class InMemoryAuthRepository implements AuthRepository {
  readonly kind = 'memory' as const;

  private users = new Map<string, UserRecord>();
  private refreshTokens = new Map<string, RefreshTokenRecord>();
  private verificationTokens = new Map<string, OneTimeTokenRecord>();
  private resetTokens = new Map<string, OneTimeTokenRecord>();

  async findUserById(id: string) {
    return clone(this.users.get(id) || null);
  }

  async listUsers() {
    return Array.from(this.users.values()).map((u) => clone(u));
  }

  async findUserByEmail(email: string) {
    for (const u of this.users.values()) {
      if (u.email === email && !u.deletedAt) return clone(u);
    }
    return null;
  }

  async findUserByPhone(phone: string) {
    for (const u of this.users.values()) {
      if (u.phone === phone) return clone(u);
    }
    return null;
  }

  async createUser(data: CreateUserData) {
    for (const u of this.users.values()) {
      if (u.email === data.email) throw new DuplicateUserError('email');
      if (u.phone === data.phone) throw new DuplicateUserError('phone');
    }
    const now = new Date();
    const user: UserRecord = {
      id: (data as any).id || randomUUID(),
      email: data.email,
      phone: data.phone,
      passwordHash: data.passwordHash,
      fullName: data.fullName,
      role: data.role || 'CUSTOMER',
      isVerified: data.isVerified ?? false,
      emailVerifiedAt: data.emailVerifiedAt ?? null,
      tokenVersion: 0,
      passwordChangedAt: null,
      failedLoginCount: 0,
      lockedUntil: null,
      lastLoginAt: null,
      deletedAt: null,
      dataConsentAt: data.dataConsentAt ?? null,
      dataConsentVersion: data.dataConsentVersion ?? null,
      createdAt: now,
      updatedAt: now,
    };
    this.users.set(user.id, user);
    return clone(user);
  }

  async updateUser(id: string, patch: UserPatch) {
    const user = this.mustGetUser(id);
    if (patch.phone && patch.phone !== user.phone) {
      for (const u of this.users.values()) {
        if (u.id !== id && u.phone === patch.phone) throw new DuplicateUserError('phone');
      }
    }
    Object.assign(user, patch, { updatedAt: new Date() });
    return clone(user);
  }

  async bumpTokenVersion(id: string, patch: UserPatch = {}) {
    const user = this.mustGetUser(id);
    Object.assign(user, patch, { tokenVersion: user.tokenVersion + 1, updatedAt: new Date() });
    return clone(user);
  }

  async softDeleteUser(id: string, unusablePasswordHash: string) {
    const user = this.mustGetUser(id);
    const now = new Date();
    Object.assign(user, {
      email: `deleted+${id}@anon.nutridaily.invalid`,
      phone: `deleted-${id}`,
      fullName: 'Akun dihapus',
      passwordHash: unusablePasswordHash,
      isVerified: false,
      tokenVersion: user.tokenVersion + 1,
      deletedAt: now,
      updatedAt: now,
    });
    for (const [k, t] of this.verificationTokens) if (t.userId === id) this.verificationTokens.delete(k);
    for (const [k, t] of this.resetTokens) if (t.userId === id) this.resetTokens.delete(k);
  }

  async createRefreshToken(data: CreateRefreshTokenData) {
    const record: RefreshTokenRecord = {
      id: randomUUID(),
      userId: data.userId,
      tokenHash: data.tokenHash,
      familyId: data.familyId,
      expiresAt: data.expiresAt,
      revokedAt: null,
      revokedReason: null,
      replacedById: null,
      userAgent: data.userAgent ?? null,
      ipAddress: data.ipAddress ?? null,
      createdAt: new Date(),
      lastUsedAt: null,
    };
    this.refreshTokens.set(record.id, record);
    return clone(record);
  }

  async findRefreshTokenByHash(tokenHash: string) {
    for (const t of this.refreshTokens.values()) {
      if (t.tokenHash === tokenHash) return clone(t);
    }
    return null;
  }

  async rotateRefreshToken(oldId: string, next: CreateRefreshTokenData, now: Date) {
    const old = this.refreshTokens.get(oldId);
    if (!old || old.revokedAt) return null;
    old.revokedAt = now;
    old.revokedReason = 'ROTATED';
    old.lastUsedAt = now;
    const created = await this.createRefreshToken(next);
    old.replacedById = created.id;
    return created;
  }

  async revokeRefreshTokenFamily(familyId: string, reason: RevokeReason, now: Date) {
    let n = 0;
    for (const t of this.refreshTokens.values()) {
      if (t.familyId === familyId && !t.revokedAt) {
        t.revokedAt = now;
        t.revokedReason = reason;
        n++;
      }
    }
    return n;
  }

  async revokeAllUserRefreshTokens(userId: string, reason: RevokeReason, now: Date) {
    let n = 0;
    for (const t of this.refreshTokens.values()) {
      if (t.userId === userId && !t.revokedAt) {
        t.revokedAt = now;
        t.revokedReason = reason;
        n++;
      }
    }
    return n;
  }

  async isSessionActive(familyId: string, now: Date) {
    for (const t of this.refreshTokens.values()) {
      if (t.familyId === familyId && !t.revokedAt && t.expiresAt > now) return true;
    }
    return false;
  }

  async listActiveSessions(userId: string, now: Date): Promise<SessionSummary[]> {
    const byFamily = new Map<string, SessionSummary>();
    for (const t of this.refreshTokens.values()) {
      if (t.userId !== userId || t.revokedAt || t.expiresAt <= now) continue;
      byFamily.set(t.familyId, {
        familyId: t.familyId,
        createdAt: t.createdAt,
        lastUsedAt: t.lastUsedAt ?? t.createdAt,
        expiresAt: t.expiresAt,
        userAgent: t.userAgent,
        ipAddress: t.ipAddress,
      });
    }
    return [...byFamily.values()].sort((a, b) => +b.createdAt - +a.createdAt);
  }

  async createEmailVerificationToken(userId: string, tokenHash: string, expiresAt: Date) {
    this.verificationTokens.set(tokenHash, {
      id: randomUUID(),
      userId,
      tokenHash,
      expiresAt,
      usedAt: null,
      createdAt: new Date(),
    });
  }

  async consumeEmailVerificationToken(tokenHash: string, now: Date) {
    return this.consume(this.verificationTokens, tokenHash, now);
  }

  async invalidateEmailVerificationTokens(userId: string, now: Date) {
    for (const t of this.verificationTokens.values()) if (t.userId === userId && !t.usedAt) t.usedAt = now;
  }

  async createPasswordResetToken(userId: string, tokenHash: string, expiresAt: Date) {
    this.resetTokens.set(tokenHash, {
      id: randomUUID(),
      userId,
      tokenHash,
      expiresAt,
      usedAt: null,
      createdAt: new Date(),
    });
  }

  async consumePasswordResetToken(tokenHash: string, now: Date) {
    return this.consume(this.resetTokens, tokenHash, now);
  }

  async invalidatePasswordResetTokens(userId: string, now: Date) {
    for (const t of this.resetTokens.values()) if (t.userId === userId && !t.usedAt) t.usedAt = now;
  }

  private loginLogs: LoginAuditLogRecord[] = [];

  async recordLoginAuditLog(data: CreateLoginAuditLogData): Promise<LoginAuditLogRecord> {
    const record: LoginAuditLogRecord = {
      id: randomUUID(),
      userId: data.userId || null,
      email: data.email,
      status: data.status,
      reason: data.reason || null,
      ipAddress: data.ipAddress || null,
      userAgent: data.userAgent || null,
      createdAt: new Date(),
    };
    this.loginLogs.unshift(record);
    return clone(record);
  }

  async getLoginHistory(userId: string, limit = 20): Promise<LoginAuditLogRecord[]> {
    return this.loginLogs
      .filter((l) => l.userId === userId)
      .slice(0, limit)
      .map(clone);
  }

  private consume(store: Map<string, OneTimeTokenRecord>, tokenHash: string, now: Date) {
    const t = store.get(tokenHash);
    if (!t || t.usedAt || t.expiresAt <= now) return null;
    t.usedAt = now;
    return clone(t);
  }

  private mustGetUser(id: string): UserRecord {
    const user = this.users.get(id);
    if (!user) throw new Error('User not found');
    return user;
  }
}
