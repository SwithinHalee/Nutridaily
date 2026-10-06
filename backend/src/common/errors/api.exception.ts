import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Application error with a stable machine-readable `code` (for the frontend to branch on) and
 * a safe, user-facing Indonesian `message`. Never put internal details in either field.
 */
export class ApiException extends HttpException {
  constructor(
    status: HttpStatus,
    public readonly code: string,
    message: string,
    public readonly details?: Record<string, unknown>,
    public readonly headers?: Record<string, string>,
  ) {
    super({ code, message, details }, status);
  }
}

export const AuthErrors = {
  invalidCredentials: () =>
    new ApiException(HttpStatus.UNAUTHORIZED, 'INVALID_CREDENTIALS', 'Email atau kata sandi tidak sesuai.'),
  emailNotVerified: () =>
    new ApiException(
      HttpStatus.FORBIDDEN,
      'EMAIL_NOT_VERIFIED',
      'Email belum diverifikasi. Buka tautan verifikasi yang kami kirim ke kotak masuk Anda.',
    ),
  tooManyAttempts: (retryAfterSeconds: number) =>
    new ApiException(
      HttpStatus.TOO_MANY_REQUESTS,
      'TOO_MANY_ATTEMPTS',
      `Terlalu banyak percobaan. Coba lagi dalam ${Math.max(1, Math.ceil(retryAfterSeconds / 60))} menit.`,
      { retryAfterSeconds },
      { 'Retry-After': String(Math.max(1, retryAfterSeconds)) },
    ),
  unauthenticated: () =>
    new ApiException(HttpStatus.UNAUTHORIZED, 'UNAUTHENTICATED', 'Sesi Anda tidak valid. Silakan masuk kembali.'),
  accessTokenExpired: () =>
    new ApiException(HttpStatus.UNAUTHORIZED, 'ACCESS_TOKEN_EXPIRED', 'Sesi akses kedaluwarsa.'),
  refreshInvalid: () =>
    new ApiException(HttpStatus.UNAUTHORIZED, 'REFRESH_TOKEN_INVALID', 'Sesi Anda berakhir. Silakan masuk kembali.'),
  refreshRace: () =>
    new ApiException(HttpStatus.UNAUTHORIZED, 'REFRESH_RACE', 'Sesi sedang diperbarui di tab lain.'),
  invalidOneTimeToken: () =>
    new ApiException(
      HttpStatus.BAD_REQUEST,
      'TOKEN_INVALID_OR_EXPIRED',
      'Tautan tidak valid, sudah dipakai, atau sudah kedaluwarsa. Silakan minta tautan baru.',
    ),
  wrongCurrentPassword: () =>
    new ApiException(HttpStatus.BAD_REQUEST, 'WRONG_PASSWORD', 'Kata sandi saat ini tidak sesuai.'),
  csrfInvalid: () =>
    new ApiException(HttpStatus.FORBIDDEN, 'CSRF_INVALID', 'Permintaan ditolak. Muat ulang halaman lalu coba lagi.'),
  originForbidden: () =>
    new ApiException(HttpStatus.FORBIDDEN, 'ORIGIN_FORBIDDEN', 'Asal permintaan tidak diizinkan.'),
  phoneTaken: () =>
    new ApiException(
      HttpStatus.CONFLICT,
      'PHONE_TAKEN',
      'Nomor WhatsApp ini sudah terhubung dengan akun lain.',
    ),
};
