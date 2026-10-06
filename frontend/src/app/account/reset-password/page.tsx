'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AuthShell,
  FormAlert,
  PasswordField,
  SubmitButton,
  readQueryParam,
  scrubQueryFromUrl,
} from '@/components/auth/auth-ui';
import { ApiError, authApi } from '@/lib/api-client';

export default function ResetPasswordPage() {
  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const raw = readQueryParam('token');
    if (raw) {
      setToken(raw);
      scrubQueryFromUrl();
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setFieldErrors({});

    if (!token) {
      setErrorMessage(
        'Token pengaturan ulang kata sandi tidak ditemukan atau tidak valid. Silakan ajukan tautan baru.'
      );
      return;
    }

    if (password !== confirmPassword) {
      setFieldErrors({ confirmPassword: 'Konfirmasi kata sandi tidak cocok.' });
      return;
    }

    setSubmitting(true);
    try {
      await authApi.resetPassword(token, password, confirmPassword);
      setSuccess(true);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.fieldErrors.length > 0) {
          const map: Record<string, string> = {};
          for (const fe of err.fieldErrors) {
            map[fe.field] = fe.message;
          }
          setFieldErrors(map);
        }
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Terjadi kendala saat mengatur ulang kata sandi. Silakan coba lagi.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Pemulihan akses"
      title="Atur ulang kata sandi Anda"
      description="Buat kata sandi baru yang kuat untuk melindungi akun dan riwayat gizi medis Anda."
      footer={
        <div className="flex items-center justify-between">
          <span>Tautan kedaluwarsa?</span>
          <Link
            href="/account/forgot-password"
            className="font-semibold text-forest hover:text-forest-hover transition-colors underline"
          >
            Minta tautan baru
          </Link>
        </div>
      }
    >
      {success ? (
        <div className="space-y-4">
          <FormAlert tone="success">
            <p className="font-semibold text-warm-black">Kata sandi berhasil diperbarui.</p>
            <p className="mt-1 text-xs">
              Seluruh sesi login sebelumnya pada semua perangkat telah dibatalkan demi keamanan. Silakan
              masuk kembali menggunakan kata sandi baru Anda.
            </p>
          </FormAlert>

          <div className="pt-2">
            <Link
              href="/account/login"
              className="w-full inline-flex items-center justify-center px-4 py-2.5 rounded-md bg-forest hover:bg-forest-hover text-tebu-50 text-sm font-semibold transition-colors shadow-natural text-center"
            >
              Masuk dengan kata sandi baru
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMessage && <FormAlert tone="error">{errorMessage}</FormAlert>}

          {!token && (
            <FormAlert tone="error">
              Tautan tidak memiliki token pemulihan. Pastikan Anda membuka tautan lengkap yang dikirimkan
              ke email Anda, atau minta tautan pemulihan baru di bawah.
            </FormAlert>
          )}

          <PasswordField
            label="Kata sandi baru"
            autoComplete="new-password"
            required
            showRules
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimal 8 karakter berkombinasi"
            error={fieldErrors.password}
            disabled={submitting || !token}
          />

          <PasswordField
            label="Ulangi kata sandi baru"
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Ketik ulang kata sandi baru"
            error={fieldErrors.confirmPassword}
            disabled={submitting || !token}
          />

          <div className="pt-2">
            <SubmitButton
              loading={submitting}
              loadingLabel="Memperbarui kata sandi..."
              disabled={!token}
            >
              Simpan kata sandi baru
            </SubmitButton>
          </div>
        </form>
      )}
    </AuthShell>
  );
}
