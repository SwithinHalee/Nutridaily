'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  AuthShell,
  FormAlert,
  SubmitButton,
  TextField,
  readQueryParam,
  scrubQueryFromUrl,
} from '@/components/auth/auth-ui';
import { ApiError, authApi } from '@/lib/api-client';
import { Loader2 } from 'lucide-react';

export default function VerifyEmailPage() {
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Resend state for when token is expired/invalid
  const [resendEmail, setResendEmail] = useState('');
  const [resending, setResending] = useState(false);
  const [resendNotice, setResendNotice] = useState<string | null>(null);

  // Token sekali pakai tidak boleh ditembak dua kali. Effect jalan dua kali
  // pada StrictMode, jadi pengaman ini memastikan hanya satu panggilan API.
  const verifyAttemptedRef = useRef<string | null>(null);

  useEffect(() => {
    const token = readQueryParam('token');
    if (!token) {
      setLoading(false);
      setErrorMessage('Tautan verifikasi tidak lengkap atau tidak valid.');
      return;
    }
    if (verifyAttemptedRef.current === token) return;
    verifyAttemptedRef.current = token;

    let cancelled = false;
    authApi
      .verifyEmail(token)
      .then(() => {
        if (!cancelled) {
          setSuccess(true);
          setErrorMessage(null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setSuccess(false);
          setErrorMessage(
            err instanceof ApiError
              ? err.message
              : 'Tautan verifikasi sudah kedaluwarsa atau tidak valid. Silakan ajukan tautan baru.'
          );
        }
      })
      .finally(() => {
        // Bersihkan token dari URL hanya setelah respons selesai,
        // agar effect susulan tetap bisa membaca token yang sama.
        scrubQueryFromUrl();
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail.trim()) return;

    setResending(true);
    setResendNotice(null);
    try {
      const res = await authApi.resendVerification(resendEmail.trim());
      setResendNotice(res.message);
    } catch (err) {
      setResendNotice(
        err instanceof ApiError ? err.message : 'Gagal mengirim ulang tautan verifikasi.'
      );
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Verifikasi akun"
      title="Verifikasi alamat email Anda"
      description="Konfirmasi keabsahan identitas akun untuk mengaktifkan pemesanan katering sehat."
    >
      <div className="space-y-4">
        {loading && (
          <div className="p-8 text-center space-y-3">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-forest" aria-hidden="true" />
            <p className="text-sm font-medium text-warm-neutral">
              Memverifikasi token keamanan alamat email Anda...
            </p>
          </div>
        )}

        {!loading && success && (
          <div className="space-y-4">
            <FormAlert tone="success">
              <p className="font-semibold text-warm-black">Alamat email Anda berhasil diverifikasi.</p>
              <p className="mt-1 text-xs">
                Akun NutriDaily Anda kini telah aktif. Anda dapat langsung masuk untuk memilih paket
                katering gizi terpersonalisasi.
              </p>
            </FormAlert>

            <div className="pt-2">
              <Link
                href="/account/login"
                className="w-full inline-flex items-center justify-center px-4 py-2.5 rounded-md bg-forest hover:bg-forest-hover text-tebu-50 text-sm font-semibold transition-colors shadow-natural text-center"
              >
                Masuk ke akun sekarang
              </Link>
            </div>
          </div>
        )}

        {!loading && !success && (
          <div className="space-y-4">
            {errorMessage && <FormAlert tone="error">{errorMessage}</FormAlert>}

            {resendNotice && <FormAlert tone="info">{resendNotice}</FormAlert>}

            <div className="p-4 bg-tebu-50 border border-warm-border rounded-lg space-y-3">
              <div>
                <h2 className="font-semibold text-xs text-warm-black">
                  Kirim ulang tautan aktivasi baru
                </h2>
                <p className="text-[11px] text-warm-muted mt-0.5">
                  Masukkan alamat email yang terdaftar untuk menerima tautan aktivasi satu kali baru.
                </p>
              </div>

              <form onSubmit={handleResend} className="space-y-3">
                <TextField
                  label="Alamat email akun"
                  type="email"
                  required
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  placeholder="nama@domain.id"
                  disabled={resending}
                />

                <SubmitButton
                  loading={resending}
                  loadingLabel="Mengirimkan tautan..."
                  variant="dark"
                >
                  Kirim ulang tautan verifikasi
                </SubmitButton>
              </form>
            </div>

            <div className="text-center pt-2">
              <Link
                href="/account/login"
                className="text-xs font-semibold text-forest hover:text-forest-hover transition-colors underline"
              >
                Kembali ke halaman masuk
              </Link>
            </div>
          </div>
        )}
      </div>
    </AuthShell>
  );
}
