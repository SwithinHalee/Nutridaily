import { JwtService } from '@nestjs/jwt';
import { ZodError } from 'zod';
import { AuthService } from '../modules/auth/auth.service';
import { InMemoryAuthRepository } from '../modules/auth/repository/in-memory-auth.repository';
import { PasswordHasherService } from '../common/security/password-hasher.service';
import { RateLimiterService } from '../common/security/rate-limiter.service';
import { MailService, escapeHtml } from '../common/mail/mail.service';
import { hashToken } from '../common/security/token.util';
import { issueCsrfToken, isCsrfTokenAuthentic } from '../common/security/csrf.guard';
import { loginSchema, registerSchema, normalizeIndonesianPhone } from '../modules/auth/auth.schemas';

const ctx = { ip: '203.0.113.7', userAgent: 'jest' };
const PASSWORD = 'Bayam#Merah2026';

/** Captures links instead of sending mail. */
class CapturingMail extends MailService {
  links: string[] = [];
  dispatch(_mail: unknown, link?: string): void {
    if (link) this.links.push(link);
  }
  lastToken(): string {
    return new URL(this.links[this.links.length - 1]).searchParams.get('token');
  }
}

function setup() {
  const repo = new InMemoryAuthRepository();
  const limiter = new RateLimiterService();
  const mail = new CapturingMail();
  const service = new AuthService(repo, new JwtService({}), new PasswordHasherService(), limiter, mail);
  return { repo, limiter, mail, service };
}

async function registeredVerifiedUser(s: ReturnType<typeof setup>, email = 'sari@example.com') {
  await s.service.register(
    registerSchema.parse({ fullName: 'Sari Wulandari', email, phone: '081234567890', password: PASSWORD, confirmPassword: PASSWORD }),
    ctx,
  );
  await s.service.verifyEmail(s.mail.lastToken(), ctx);
  return email;
}

describe('Auth input validation (Zod)', () => {
  const base = { fullName: 'Sari Wulandari', email: 'sari@example.com', phone: '081234567890', password: PASSWORD, confirmPassword: PASSWORD };

  it('rejects passwords missing any required character class', () => {
    for (const weak of ['short1!', 'alllowercase1!', 'ALLUPPERCASE1!', 'NoDigitsHere!', 'NoSymbols123']) {
      expect(() => registerSchema.parse({ ...base, password: weak, confirmPassword: weak })).toThrow(ZodError);
    }
  });

  it('rejects HTML/script in names and unknown keys such as role', () => {
    expect(() => registerSchema.parse({ ...base, fullName: '<img src=x onerror=alert(1)>' })).toThrow(ZodError);
    expect(() => registerSchema.parse({ ...base, role: 'ADMIN' })).toThrow(ZodError);
  });

  it('normalises email case, name whitespace and Indonesian phone formats', () => {
    const parsed = registerSchema.parse({ ...base, email: '  Sari@Example.COM ', fullName: ' Sari   Wulandari ' });
    expect(parsed.email).toBe('sari@example.com');
    expect(parsed.fullName).toBe('Sari Wulandari');
    expect(normalizeIndonesianPhone('0812-3456-7890')).toBe('+6281234567890');
    expect(normalizeIndonesianPhone('62 812 3456 7890')).toBe('+6281234567890');
  });

  it('escapes HTML in email templates', () => {
    expect(escapeHtml('<b>"x"&\'</b>')).toBe('&lt;b&gt;&quot;x&quot;&amp;&#39;&lt;/b&gt;');
  });
});

describe('AuthService security flows', () => {
  let s: ReturnType<typeof setup>;
  beforeEach(() => (s = setup()));
  afterEach(() => s.limiter.onModuleDestroy());

  it('stores Argon2id hashes and SHA-256 token hashes, never plaintext', async () => {
    const email = await registeredVerifiedUser(s);
    const user = await s.repo.findUserByEmail(email);
    expect(user.passwordHash.startsWith('$argon2id$')).toBe(true);
    expect(user.isVerified).toBe(true);

    const { session } = await s.service.login(loginSchema.parse({ email, password: PASSWORD }), ctx);
    const stored = await s.repo.findRefreshTokenByHash(hashToken(session.refreshToken));
    expect(stored).not.toBeNull();
    expect(stored.tokenHash).not.toContain(session.refreshToken);
  });

  it('blocks login until the email is verified', async () => {
    await s.service.register(
      registerSchema.parse({ fullName: 'Budi Santoso', email: 'budi@example.com', phone: '081311112222', password: PASSWORD, confirmPassword: PASSWORD }),
      ctx,
    );
    await expect(s.service.login({ email: 'budi@example.com', password: PASSWORD }, ctx)).rejects.toMatchObject({ code: 'EMAIL_NOT_VERIFIED' });
  });

  it('rotates refresh tokens and revokes the whole family on reuse', async () => {
    const email = await registeredVerifiedUser(s);
    const { session } = await s.service.login({ email, password: PASSWORD }, ctx);
    const rotated = await s.service.refresh(session.refreshToken, ctx);
    expect(rotated.refreshToken).not.toBe(session.refreshToken);

    // Age the revoked token past the grace window, then replay it like an attacker would.
    const old = await s.repo.findRefreshTokenByHash(hashToken(session.refreshToken));
    (s.repo as unknown as { refreshTokens: Map<string, { revokedAt: Date }> }).refreshTokens.get(old.id).revokedAt = new Date(Date.now() - 60_000);

    await expect(s.service.refresh(session.refreshToken, ctx)).rejects.toMatchObject({ code: 'REFRESH_TOKEN_INVALID' });
    await expect(s.service.refresh(rotated.refreshToken, ctx)).rejects.toMatchObject({ code: 'REFRESH_TOKEN_INVALID' });
  });

  it('password reset is single use and revokes every active session', async () => {
    const email = await registeredVerifiedUser(s);
    const { session } = await s.service.login({ email, password: PASSWORD }, ctx);
    await s.service.forgotPassword(email, ctx);
    const token = s.mail.lastToken();
    const next = 'Quinoa$Tiga9Warna';

    await s.service.resetPassword({ token, password: next, confirmPassword: next }, ctx);
    await expect(s.service.resetPassword({ token, password: next, confirmPassword: next }, ctx)).rejects.toMatchObject({ code: 'TOKEN_INVALID_OR_EXPIRED' });
    expect(await s.repo.isSessionActive(session.sessionId, new Date())).toBe(false);
    await expect(s.service.login({ email, password: PASSWORD }, ctx)).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' });
  });

  it('expires reset tokens after 15 minutes', async () => {
    const email = await registeredVerifiedUser(s);
    await s.service.forgotPassword(email, ctx);
    const token = s.mail.lastToken();
    const sixteenMinutesLater = new Date(Date.now() + 16 * 60 * 1000);
    expect(await s.repo.consumePasswordResetToken(hashToken(token), sixteenMinutesLater)).toBeNull();
  });

  it('answers identically for unknown and known emails (no enumeration)', async () => {
    const email = await registeredVerifiedUser(s);
    const known = await s.service.forgotPassword(email, ctx);
    const unknown = await s.service.forgotPassword('nobody@example.com', ctx);
    expect(unknown).toEqual(known);
    await expect(s.service.login({ email: 'nobody@example.com', password: PASSWORD }, ctx)).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' });
  });

  it('locks login after repeated failures, even for the correct password', async () => {
    const email = await registeredVerifiedUser(s);
    for (let i = 0; i < 5; i++) {
      await expect(s.service.login({ email, password: `Salah#${i}Sandi` }, ctx)).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' });
    }
    await expect(s.service.login({ email, password: PASSWORD }, ctx)).rejects.toMatchObject({ code: 'TOO_MANY_ATTEMPTS' });
  });
});

describe('CSRF token signing', () => {
  it('accepts its own tokens and rejects tampered or expired ones', () => {
    const token = issueCsrfToken();
    expect(isCsrfTokenAuthentic(token)).toBe(true);
    expect(isCsrfTokenAuthentic(token.slice(0, -2) + 'xx')).toBe(false);
    expect(isCsrfTokenAuthentic(issueCsrfToken(Date.now() - 13 * 60 * 60 * 1000))).toBe(false);
  });
});
