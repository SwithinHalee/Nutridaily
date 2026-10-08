import { z } from 'zod';
import { OPAQUE_TOKEN_PATTERN } from '../../common/security/token.util';

/**
 * Sanitisation strategy
 * 1. Normalise: Unicode NFKC, strip control and zero-width characters, collapse whitespace.
 * 2. Validate with allowlists (names: letters, marks, space, . ' -), never blocklists.
 * 3. Reject unknown keys with .strict() so clients cannot set role, isVerified, etc.
 * SQL injection is prevented independently by Prisma's parameterised queries, and XSS on
 * output by React's escaping plus HTML-escaping in email templates.
 */

// C0/C1 control characters, zero-width and bidi override characters.
const CONTROL_CHARS = /[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E\u2060-\u2064\uFEFF]/g;

export function normalizeText(value: string): string {
  return value.normalize('NFKC').replace(CONTROL_CHARS, '').replace(/\s+/g, ' ').trim();
}

/** Accepts 08xx, 628xx, +628xx with spaces, dashes or dots. Returns E.164 (+628...). */
export function normalizeIndonesianPhone(value: string): string {
  const digits = value.normalize('NFKC').replace(/[\s\-().]/g, '');
  if (digits.startsWith('+62')) return digits;
  if (digits.startsWith('62')) return `+${digits}`;
  if (digits.startsWith('0')) return `+62${digits.slice(1)}`;
  return digits;
}

export const emailSchema = z
  .string({ required_error: 'Email wajib diisi.', invalid_type_error: 'Email wajib berupa teks.' })
  .transform((v) => v.normalize('NFKC').replace(CONTROL_CHARS, '').trim().toLowerCase())
  .pipe(
    z
      .string()
      .min(1, 'Email wajib diisi.')
      .max(254, 'Email maksimal 254 karakter.')
      .email('Format email tidak valid. Contoh: nama@domain.com.')
      .refine((v) => !/[<>"'`\\]/.test(v), 'Email mengandung karakter yang tidak diizinkan.'),
  );

export const PASSWORD_RULES = [
  { test: (v: string) => v.length >= 8, message: 'Minimal 8 karakter.' },
  { test: (v: string) => /[a-z]/.test(v), message: 'Memuat huruf kecil (a-z).' },
  { test: (v: string) => /[A-Z]/.test(v), message: 'Memuat huruf besar (A-Z).' },
  { test: (v: string) => /[0-9]/.test(v), message: 'Memuat angka (0-9).' },
  { test: (v: string) => /[^A-Za-z0-9\s]/.test(v), message: 'Memuat simbol, misalnya ! @ # $ %.' },
] as const;

/**
 * Max 128 chars caps hashing cost (DoS guard). Passwords are NOT trimmed or normalised beyond
 * rejecting control characters, so what the user typed is exactly what is hashed.
 */
export const passwordSchema = z
  .string({ required_error: 'Kata sandi wajib diisi.', invalid_type_error: 'Kata sandi wajib berupa teks.' })
  .max(128, 'Kata sandi maksimal 128 karakter.')
  .superRefine((value, ctx) => {
    if (/[\u0000-\u001F\u007F]/.test(value)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Kata sandi mengandung karakter kontrol yang tidak diizinkan.' });
    }
    const failed = PASSWORD_RULES.filter((rule) => !rule.test(value));
    if (failed.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Kata sandi belum kuat: ${failed.map((r) => r.message.replace(/\.$/, '').toLowerCase()).join(', ')}.`,
      });
    }
  });

/** Login only checks presence and length: policy changes must never lock out existing users. */
const loginPasswordSchema = z
  .string({ required_error: 'Kata sandi wajib diisi.' })
  .min(1, 'Kata sandi wajib diisi.')
  .max(128, 'Kata sandi maksimal 128 karakter.');

export const fullNameSchema = z
  .string({ required_error: 'Nama lengkap wajib diisi.' })
  .transform(normalizeText)
  .pipe(
    z
      .string()
      .min(2, 'Nama lengkap minimal 2 karakter.')
      .max(80, 'Nama lengkap maksimal 80 karakter.')
      .regex(
        /^[\p{L}\p{M}][\p{L}\p{M} .'-]*$/u,
        "Nama hanya boleh berisi huruf, spasi, titik, apostrof ('), dan tanda hubung (-).",
      ),
  );

export const phoneSchema = z
  .string({ required_error: 'Nomor WhatsApp wajib diisi.' })
  .transform(normalizeIndonesianPhone)
  .pipe(
    z
      .string()
      .regex(/^\+628[1-9][0-9]{7,10}$/, 'Nomor WhatsApp tidak valid. Gunakan format 08xx atau +628xx (10 sampai 13 digit).'),
  );

export const oneTimeTokenSchema = z
  .string({ required_error: 'Token wajib diisi.' })
  .trim()
  .regex(OPAQUE_TOKEN_PATTERN, 'Format token tidak valid.');

function addPasswordContextChecks(
  ctx: z.RefinementCtx,
  password: string,
  context: { email?: string; fullName?: string },
  path: string,
) {
  const lower = password.toLowerCase();
  const local = context.email?.split('@')[0]?.toLowerCase();
  if (local && local.length >= 4 && lower.includes(local)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: [path], message: 'Kata sandi tidak boleh memuat bagian dari email Anda.' });
  }
  const nameParts = (context.fullName || '')
    .toLowerCase()
    .split(' ')
    .filter((p) => p.length >= 4);
  if (nameParts.some((p) => lower.includes(p))) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: [path], message: 'Kata sandi tidak boleh memuat nama Anda.' });
  }
}

export const registerSchema = z
  .object({
    fullName: fullNameSchema,
    email: emailSchema,
    phone: phoneSchema,
    password: passwordSchema,
    confirmPassword: z.string({ required_error: 'Konfirmasi kata sandi wajib diisi.' }).max(128),
    // UU PDP No. 27/2022 Bab 11.2: explicit consent for body and health data processing.
    dataConsent: z
      .boolean({
        required_error: 'Persetujuan penggunaan data wajib dicentang.',
        invalid_type_error: 'Persetujuan penggunaan data wajib dicentang.',
      })
      .refine((v) => v === true, {
        message: 'Centang persetujuan penggunaan data tubuh menurut UU PDP No. 27/2022 untuk mendaftar.',
      }),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['confirmPassword'], message: 'Konfirmasi kata sandi tidak sama.' });
    }
    addPasswordContextChecks(ctx, data.password, data, 'password');
  });

export const loginSchema = z
  .object({
    email: emailSchema,
    password: loginPasswordSchema,
  })
  .strict();

export const emailOnlySchema = z.object({ email: emailSchema }).strict();

export const verifyEmailSchema = z.object({ token: oneTimeTokenSchema }).strict();

export const resetPasswordSchema = z
  .object({
    token: oneTimeTokenSchema,
    password: passwordSchema,
    confirmPassword: z.string().max(128),
  })
  .strict()
  .refine((d) => d.password === d.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Konfirmasi kata sandi tidak sama.',
  });

export const updateProfileSchema = z
  .object({
    fullName: fullNameSchema.optional(),
    phone: phoneSchema.optional(),
  })
  .strict()
  .refine((d) => d.fullName !== undefined || d.phone !== undefined, {
    message: 'Tidak ada perubahan data yang dikirim.',
  });

export const changePasswordSchema = z
  .object({
    currentPassword: loginPasswordSchema,
    newPassword: passwordSchema,
    confirmPassword: z.string().max(128),
  })
  .strict()
  .superRefine((d, ctx) => {
    if (d.newPassword !== d.confirmPassword) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['confirmPassword'], message: 'Konfirmasi kata sandi tidak sama.' });
    }
    if (d.newPassword === d.currentPassword) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['newPassword'], message: 'Kata sandi baru harus berbeda dari kata sandi lama.' });
    }
  });

export const DELETE_CONFIRMATION_PHRASE = 'HAPUS AKUN SAYA';

/** Policy version stamped on User.dataConsentVersion at registration. */
export const DATA_CONSENT_VERSION = 'pdp-2026-10';

export const deleteAccountSchema = z
  .object({
    password: loginPasswordSchema,
    confirmation: z
      .string({ required_error: 'Ketik frasa konfirmasi.' })
      .transform(normalizeText)
      .pipe(z.literal(DELETE_CONFIRMATION_PHRASE, { errorMap: () => ({ message: `Ketik "${DELETE_CONFIRMATION_PHRASE}" untuk konfirmasi.` }) })),
  })
  .strict();

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;

/** Exposed so the user context check (no email/name in password) can run on change/reset too. */
export function passwordContainsPersonalData(password: string, context: { email?: string; fullName?: string }): string | null {
  const issues: string[] = [];
  addPasswordContextChecks(
    { addIssue: (i: { message?: string }) => issues.push(i.message || '') } as unknown as z.RefinementCtx,
    password,
    context,
    'password',
  );
  return issues[0] || null;
}
