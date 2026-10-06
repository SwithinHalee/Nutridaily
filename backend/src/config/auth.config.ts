/**
 * Central auth & security configuration.
 * Every value is overridable via environment variables. In production the process refuses to
 * start with default secrets or without a database, so a misconfigured deploy fails loudly.
 */

const DEV_ACCESS_SECRET = 'dev-only-nutridaily-access-secret-change-me-0123456789';
const DEV_CSRF_SECRET = 'dev-only-nutridaily-csrf-secret-change-me-0123456789';

const isProduction = process.env.NODE_ENV === 'production';

function readInt(name: string, fallback: number): number {
  const raw = process.env[name];
  const parsed = raw ? Number.parseInt(raw, 10) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function readList(name: string, fallback: string[]): string[] {
  const raw = process.env[name];
  if (!raw) return fallback;
  return raw
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
}

export const authConfig = {
  isProduction,

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || DEV_ACCESS_SECRET,
    issuer: process.env.JWT_ISSUER || 'nutridaily-api',
    audience: process.env.JWT_AUDIENCE || 'nutridaily-web',
    accessTtlSeconds: readInt('ACCESS_TOKEN_TTL_SECONDS', 15 * 60),
  },

  refresh: {
    // Absolute session lifetime. Rotation keeps the family's original expiry (no infinite sliding).
    ttlSeconds: readInt('REFRESH_TOKEN_TTL_SECONDS', 30 * 24 * 60 * 60),
    // A just-rotated token presented again inside this window is treated as a benign
    // multi-tab race (no family revocation). Outside the window it is a theft signal.
    reuseGraceSeconds: readInt('REFRESH_REUSE_GRACE_SECONDS', 15),
  },

  tokens: {
    emailVerificationTtlSeconds: readInt('EMAIL_VERIFICATION_TTL_SECONDS', 24 * 60 * 60),
    passwordResetTtlSeconds: readInt('PASSWORD_RESET_TTL_SECONDS', 15 * 60),
  },

  argon2: {
    // OWASP Password Storage Cheat Sheet (2024): Argon2id, m=19 MiB, t=2, p=1.
    memoryCost: readInt('ARGON2_MEMORY_KIB', 19456),
    timeCost: readInt('ARGON2_TIME_COST', 2),
    parallelism: readInt('ARGON2_PARALLELISM', 1),
  },

  lockout: {
    maxFailedAttempts: readInt('LOGIN_MAX_FAILED_ATTEMPTS', 5),
    lockSeconds: readInt('LOGIN_LOCK_SECONDS', 15 * 60),
  },

  cookies: {
    accessName: 'nd_at',
    refreshName: 'nd_rt',
    csrfName: 'nd_csrf',
    // Refresh cookie is only ever sent to the auth endpoints, never to the rest of the API.
    refreshPath: '/api/v1/auth',
    // Chrome and Firefox accept Secure cookies on http://localhost. Set COOKIE_SECURE=false only
    // for browsers that do not (e.g. Safari on plain http during local development).
    secure: process.env.COOKIE_SECURE ? process.env.COOKIE_SECURE !== 'false' : true,
    domain: process.env.COOKIE_DOMAIN || undefined,
  },

  csrf: {
    secret: process.env.CSRF_SECRET || DEV_CSRF_SECRET,
    headerName: 'x-csrf-token',
    ttlSeconds: readInt('CSRF_TOKEN_TTL_SECONDS', 12 * 60 * 60),
  },

  cors: {
    allowedOrigins: readList('CORS_ORIGINS', ['http://localhost:3000', 'http://127.0.0.1:3000']),
  },

  frontendUrl: (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/+$/, ''),

  mail: {
    from: process.env.MAIL_FROM || 'NutriDaily Indonesia <no-reply@nutridaily.id>',
    smtpHost: process.env.SMTP_HOST,
    smtpPort: readInt('SMTP_PORT', 587),
    smtpUser: process.env.SMTP_USER,
    smtpPass: process.env.SMTP_PASS,
    smtpSecure: process.env.SMTP_SECURE === 'true',
    // Dev-only inspection endpoint for links that would have been emailed. Never in production.
    devOutboxEnabled: !isProduction && process.env.AUTH_DEV_MAIL_OUTBOX === 'true',
  },

  databaseUrl: process.env.DATABASE_URL,
};

/** Fails fast on insecure production configuration. Called once from bootstrap. */
export function assertSecureAuthConfig(): void {
  if (!authConfig.isProduction) return;

  const problems: string[] = [];
  if (authConfig.jwt.accessSecret === DEV_ACCESS_SECRET || authConfig.jwt.accessSecret.length < 32) {
    problems.push('JWT_ACCESS_SECRET must be set to a random value of at least 32 characters.');
  }
  if (authConfig.csrf.secret === DEV_CSRF_SECRET || authConfig.csrf.secret.length < 32) {
    problems.push('CSRF_SECRET must be set to a random value of at least 32 characters.');
  }
  if (!authConfig.databaseUrl) {
    problems.push('DATABASE_URL is required in production. The in-memory auth store is development only.');
  }
  if (!authConfig.cookies.secure) {
    problems.push('COOKIE_SECURE cannot be false in production.');
  }
  if (problems.length > 0) {
    throw new Error(`Insecure production configuration:\n- ${problems.join('\n- ')}`);
  }
}
