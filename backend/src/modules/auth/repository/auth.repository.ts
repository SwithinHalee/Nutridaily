export type UserRole = 'CUSTOMER' | 'CHEF' | 'NUTRITIONIST' | 'ADMIN';

export interface UserRecord {
  id: string;
  email: string;
  phone: string;
  passwordHash: string;
  fullName: string;
  role: UserRole;
  isVerified: boolean;
  emailVerifiedAt: Date | null;
  tokenVersion: number;
  passwordChangedAt: Date | null;
  failedLoginCount: number;
  lockedUntil: Date | null;
  lastLoginAt: Date | null;
  deletedAt: Date | null;
  // UU PDP No. 27/2022 Bab 11.2: explicit consent for body and health data processing.
  dataConsentAt: Date | null;
  dataConsentVersion: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type RevokeReason =
  | 'ROTATED'
  | 'LOGOUT'
  | 'LOGOUT_ALL'
  | 'PASSWORD_CHANGED'
  | 'PASSWORD_RESET'
  | 'REUSE_DETECTED'
  | 'ACCOUNT_DELETED'
  | 'USER_INVALID';

export interface RefreshTokenRecord {
  id: string;
  userId: string;
  tokenHash: string;
  familyId: string;
  expiresAt: Date;
  revokedAt: Date | null;
  revokedReason: string | null;
  replacedById: string | null;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: Date;
  lastUsedAt: Date | null;
}

export interface OneTimeTokenRecord {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
}

export interface CreateUserData {
  email: string;
  phone: string;
  passwordHash: string;
  fullName: string;
  role?: UserRole;
  isVerified?: boolean;
  emailVerifiedAt?: Date | null;
  dataConsentAt?: Date | null;
  dataConsentVersion?: string | null;
}

export type UserPatch = Partial<
  Pick<
    UserRecord,
    | 'phone'
    | 'fullName'
    | 'passwordHash'
    | 'isVerified'
    | 'emailVerifiedAt'
    | 'tokenVersion'
    | 'passwordChangedAt'
    | 'failedLoginCount'
    | 'lockedUntil'
    | 'lastLoginAt'
    | 'dataConsentAt'
    | 'dataConsentVersion'
  >
>;

export interface CreateRefreshTokenData {
  userId: string;
  tokenHash: string;
  familyId: string;
  expiresAt: Date;
  userAgent?: string | null;
  ipAddress?: string | null;
}

export interface SessionSummary {
  familyId: string;
  createdAt: Date;
  lastUsedAt: Date | null;
  expiresAt: Date;
  userAgent: string | null;
  ipAddress: string | null;
}

export class DuplicateUserError extends Error {
  constructor(public readonly field: 'email' | 'phone') {
    super(`Duplicate user ${field}`);
  }
}

export interface LoginAuditLogRecord {
  id: string;
  userId: string | null;
  email: string;
  status: 'SUCCESS' | 'FAILED';
  reason: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
}

export interface CreateLoginAuditLogData {
  userId?: string | null;
  email: string;
  status: 'SUCCESS' | 'FAILED';
  reason?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

/**
 * Persistence contract for authentication. Every "consume"/"rotate" method MUST be atomic
 * (compare-and-set), so concurrent requests can never use the same one-time token twice.
 */
export interface AuthRepository {
  readonly kind: 'prisma' | 'memory';

  findUserById(id: string): Promise<UserRecord | null>;
  /** All user records (including soft-deleted) for internal admin dashboard. */
  listUsers(): Promise<UserRecord[]>;
  /** Active (non-deleted) user by normalised email. */
  findUserByEmail(email: string): Promise<UserRecord | null>;
  findUserByPhone(phone: string): Promise<UserRecord | null>;
  /** @throws DuplicateUserError */
  createUser(data: CreateUserData): Promise<UserRecord>;
  /** @throws DuplicateUserError when phone collides */
  updateUser(id: string, patch: UserPatch): Promise<UserRecord>;
  /** Atomically increments tokenVersion, invalidating every outstanding access token. */
  bumpTokenVersion(id: string, patch?: UserPatch): Promise<UserRecord>;
  /** Soft delete: anonymise PII, delete health data, keep row for invoice retention. */
  softDeleteUser(id: string, unusablePasswordHash: string): Promise<void>;

  createRefreshToken(data: CreateRefreshTokenData): Promise<RefreshTokenRecord>;
  findRefreshTokenByHash(tokenHash: string): Promise<RefreshTokenRecord | null>;
  /** Revokes `oldId` only if still active and inserts its successor. Returns null if lost the race. */
  rotateRefreshToken(oldId: string, next: CreateRefreshTokenData, now: Date): Promise<RefreshTokenRecord | null>;
  revokeRefreshTokenFamily(familyId: string, reason: RevokeReason, now: Date): Promise<number>;
  revokeAllUserRefreshTokens(userId: string, reason: RevokeReason, now: Date): Promise<number>;
  isSessionActive(familyId: string, now: Date): Promise<boolean>;
  listActiveSessions(userId: string, now: Date): Promise<SessionSummary[]>;

  createEmailVerificationToken(userId: string, tokenHash: string, expiresAt: Date): Promise<void>;
  consumeEmailVerificationToken(tokenHash: string, now: Date): Promise<OneTimeTokenRecord | null>;
  invalidateEmailVerificationTokens(userId: string, now: Date): Promise<void>;

  createPasswordResetToken(userId: string, tokenHash: string, expiresAt: Date, requestedIp: string | null): Promise<void>;
  consumePasswordResetToken(tokenHash: string, now: Date): Promise<OneTimeTokenRecord | null>;
  invalidatePasswordResetTokens(userId: string, now: Date): Promise<void>;

  recordLoginAuditLog(data: CreateLoginAuditLogData): Promise<LoginAuditLogRecord>;
  getLoginHistory(userId: string, limit?: number): Promise<LoginAuditLogRecord[]>;
}

export const AUTH_REPOSITORY = Symbol('AUTH_REPOSITORY');
