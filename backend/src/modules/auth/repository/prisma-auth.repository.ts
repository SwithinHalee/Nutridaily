import { Prisma, PrismaClient } from '@prisma/client';
import {
  AuthRepository,
  CreateLoginAuditLogData,
  CreateRefreshTokenData,
  CreateUserData,
  DuplicateUserError,
  LoginAuditLogRecord,
  RevokeReason,
  SessionSummary,
  UserPatch,
  UserRecord,
} from './auth.repository';

function mapDuplicate(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    const target = String((error.meta as { target?: string[] | string })?.target ?? '');
    throw new DuplicateUserError(target.includes('phone') ? 'phone' : 'email');
  }
  throw error;
}

/**
 * PostgreSQL implementation. All queries are parameterised by Prisma (no string-built SQL),
 * which removes SQL injection as a class. One-time tokens use conditional `updateMany`
 * (compare-and-set) so two concurrent requests cannot both consume the same token.
 */
export class PrismaAuthRepository implements AuthRepository {
  readonly kind = 'prisma' as const;

  constructor(private readonly prisma: PrismaClient) {}

  async findUserById(id: string) {
    return (await this.prisma.user.findUnique({ where: { id } })) as UserRecord | null;
  }

  async listUsers() {
    const rows = await this.prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
    return rows as UserRecord[];
  }

  async findUserByEmail(email: string) {
    return (await this.prisma.user.findFirst({ where: { email, deletedAt: null } })) as UserRecord | null;
  }

  async findUserByPhone(phone: string) {
    return (await this.prisma.user.findUnique({ where: { phone } })) as UserRecord | null;
  }

  async createUser(data: CreateUserData) {
    try {
      return (await this.prisma.user.create({
        data: {
          ...((data as any).id ? { id: (data as any).id } : {}),
          email: data.email,
          phone: data.phone,
          passwordHash: data.passwordHash,
          fullName: data.fullName,
          role: data.role ?? 'CUSTOMER',
          isVerified: data.isVerified ?? false,
          emailVerifiedAt: data.emailVerifiedAt ?? null,
          dataConsentAt: data.dataConsentAt ?? null,
          dataConsentVersion: data.dataConsentVersion ?? null,
        },
      })) as UserRecord;
    } catch (e) {
      mapDuplicate(e);
    }
  }

  async updateUser(id: string, patch: UserPatch) {
    try {
      return (await this.prisma.user.update({ where: { id }, data: patch })) as UserRecord;
    } catch (e) {
      mapDuplicate(e);
    }
  }

  async bumpTokenVersion(id: string, patch: UserPatch = {}) {
    const { tokenVersion: _ignored, ...rest } = patch;
    return (await this.prisma.user.update({
      where: { id },
      data: { ...rest, tokenVersion: { increment: 1 } },
    })) as UserRecord;
  }

  async softDeleteUser(id: string, unusablePasswordHash: string) {
    const now = new Date();
    await this.prisma.$transaction([
      this.prisma.healthProfile.deleteMany({ where: { userId: id } }),
      // Addresses may be referenced by historical orders, so they are scrubbed, not deleted.
      this.prisma.address.updateMany({
        where: { userId: id },
        data: { label: 'Dihapus', recipientName: 'Dihapus', phoneNumber: '-', fullAddress: 'Dihapus', notes: null, latitude: 0, longitude: 0 },
      }),
      this.prisma.emailVerificationToken.deleteMany({ where: { userId: id } }),
      this.prisma.passwordResetToken.deleteMany({ where: { userId: id } }),
      this.prisma.refreshToken.updateMany({
        where: { userId: id, revokedAt: null },
        data: { revokedAt: now, revokedReason: 'ACCOUNT_DELETED' },
      }),
      this.prisma.user.update({
        where: { id },
        data: {
          email: `deleted+${id}@anon.nutridaily.invalid`,
          phone: `deleted-${id}`,
          fullName: 'Akun dihapus',
          passwordHash: unusablePasswordHash,
          isVerified: false,
          tokenVersion: { increment: 1 },
          deletedAt: now,
        },
      }),
    ]);
  }

  async createRefreshToken(data: CreateRefreshTokenData) {
    return this.prisma.refreshToken.create({ data });
  }

  async findRefreshTokenByHash(tokenHash: string) {
    return this.prisma.refreshToken.findUnique({ where: { tokenHash } });
  }

  async rotateRefreshToken(oldId: string, next: CreateRefreshTokenData, now: Date) {
    return this.prisma.$transaction(async (tx) => {
      const claimed = await tx.refreshToken.updateMany({
        where: { id: oldId, revokedAt: null },
        data: { revokedAt: now, revokedReason: 'ROTATED', lastUsedAt: now },
      });
      if (claimed.count !== 1) return null;
      const created = await tx.refreshToken.create({ data: next });
      await tx.refreshToken.update({ where: { id: oldId }, data: { replacedById: created.id } });
      return created;
    });
  }

  async revokeRefreshTokenFamily(familyId: string, reason: RevokeReason, now: Date) {
    const r = await this.prisma.refreshToken.updateMany({
      where: { familyId, revokedAt: null },
      data: { revokedAt: now, revokedReason: reason },
    });
    return r.count;
  }

  async revokeAllUserRefreshTokens(userId: string, reason: RevokeReason, now: Date) {
    const r = await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: now, revokedReason: reason },
    });
    return r.count;
  }

  async isSessionActive(familyId: string, now: Date) {
    const t = await this.prisma.refreshToken.findFirst({
      where: { familyId, revokedAt: null, expiresAt: { gt: now } },
      select: { id: true },
    });
    return !!t;
  }

  async listActiveSessions(userId: string, now: Date): Promise<SessionSummary[]> {
    const rows = await this.prisma.refreshToken.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: now } },
      orderBy: { createdAt: 'desc' },
      select: { familyId: true, createdAt: true, lastUsedAt: true, expiresAt: true, userAgent: true, ipAddress: true },
    });
    return rows.map((r) => ({ ...r, lastUsedAt: r.lastUsedAt ?? r.createdAt }));
  }

  async createEmailVerificationToken(userId: string, tokenHash: string, expiresAt: Date) {
    await this.prisma.emailVerificationToken.create({ data: { userId, tokenHash, expiresAt } });
  }

  async consumeEmailVerificationToken(tokenHash: string, now: Date) {
    const r = await this.prisma.emailVerificationToken.updateMany({
      where: { tokenHash, usedAt: null, expiresAt: { gt: now } },
      data: { usedAt: now },
    });
    if (r.count !== 1) return null;
    return this.prisma.emailVerificationToken.findUnique({ where: { tokenHash } });
  }

  async invalidateEmailVerificationTokens(userId: string, now: Date) {
    await this.prisma.emailVerificationToken.updateMany({ where: { userId, usedAt: null }, data: { usedAt: now } });
  }

  async createPasswordResetToken(userId: string, tokenHash: string, expiresAt: Date, requestedIp: string | null) {
    await this.prisma.passwordResetToken.create({ data: { userId, tokenHash, expiresAt, requestedIp } });
  }

  async consumePasswordResetToken(tokenHash: string, now: Date) {
    const r = await this.prisma.passwordResetToken.updateMany({
      where: { tokenHash, usedAt: null, expiresAt: { gt: now } },
      data: { usedAt: now },
    });
    if (r.count !== 1) return null;
    return this.prisma.passwordResetToken.findUnique({ where: { tokenHash } });
  }

  async invalidatePasswordResetTokens(userId: string, now: Date) {
    await this.prisma.passwordResetToken.updateMany({ where: { userId, usedAt: null }, data: { usedAt: now } });
  }

  async recordLoginAuditLog(data: CreateLoginAuditLogData): Promise<LoginAuditLogRecord> {
    try {
      const row = await (this.prisma as any).loginAuditLog.create({
        data: {
          userId: data.userId || null,
          email: data.email,
          status: data.status,
          reason: data.reason || null,
          ipAddress: data.ipAddress || null,
          userAgent: data.userAgent || null,
        },
      });
      return row as LoginAuditLogRecord;
    } catch {
      return {
        id: 'log_' + Date.now(),
        userId: data.userId || null,
        email: data.email,
        status: data.status,
        reason: data.reason || null,
        ipAddress: data.ipAddress || null,
        userAgent: data.userAgent || null,
        createdAt: new Date(),
      };
    }
  }

  async getLoginHistory(userId: string, limit = 20): Promise<LoginAuditLogRecord[]> {
    try {
      const rows = await (this.prisma as any).loginAuditLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
      return rows as LoginAuditLogRecord[];
    } catch {
      return [];
    }
  }
}
