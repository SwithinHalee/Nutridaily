'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AuthShell,
  FormAlert,
  PasswordField,
  SubmitButton,
  TextField,
  readQueryParam,
} from '@/components/auth/auth-ui';
import { ApiError, authApi, safeNextPath } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';

export default function LoginPage() {
  const router = useRouter();
  const { status, setUser } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [lockCountdown, setLockCountdown] = useState<number | null>(null);

  // If already logged in, redirect immediately
  useEffect(() => {
    if (status === 'authenticated') {
      const target = safeNextPath(readQueryParam('next'), '/account');
      router.replace(target);
    }
  }, [status, router]);

  // Countdown timer for rate limiting / account lock
  useEffect(() => {
    if (lockCountdown === null || lockCountdown <= 0) return;
    const interval = setInterval(() => {
      setLockCountdown((prev) => {
        if (prev === null || prev <= 1) return null;
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [lockCountdown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setFieldErrors({});

    if (!email.trim()) {
      setFieldErrors({ email: 'Alamat email wajib diisi.' });
      return;
    }
    if (!password) {
      setFieldErrors({ password: 'Kata sandi wajib diisi.' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await authApi.login(email.trim(), password);
      setUser(res.user);
      const target = safeNextPath(readQueryParam('next'), '/account');
      router.push(target);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.retryAfterSeconds && err.retryAfterSeconds > 0) {
          setLockCountdown(err.retryAfterSeconds);
        }
        if (err.fieldErrors.length > 0) {
          const map: Record<string, string> = {};
          for (const fe of err.fieldErrors) {
            map[fe.field] = fe.message;
          }
          setFieldErrors(map);
        }
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Terjadi kendala saat menghubungi server. Silakan coba lagi.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Portal pelanggan"
      title="Masuk ke akun NutriDaily"
      description="Kelola jadwal katering sehat harian, konsultasi tele-gizi, dan pantau rekam medis klinis Anda."
      footer={
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <span>Belum memiliki akun langganan?</span>
          <Link
            href="/account/register"
            className="font-semibold text-forest hover:text-forest-hover transition-colors underline"
          >
            Daftar akun baru sekarang
          </Link>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <FormAlert tone="error">
            <p>{errorMessage}</p>
            {lockCountdown !== null && lockCountdown > 0 && (
              <p className="mt-1 font-mono font-semibold">
                Sisa waktu tunggu: {lockCountdown} detik
              </p>
            )}
          </FormAlert>
        )}

        <TextField
          label="Alamat email"
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="nama@domain.id"
          error={fieldErrors.email}
          disabled={submitting || (lockCountdown !== null && lockCountdown > 0)}
        />

        <div className="space-y-1">
          <PasswordField
            label="Kata sandi"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Masukkan kata sandi akun"
            error={fieldErrors.password}
            disabled={submitting || (lockCountdown !== null && lockCountdown > 0)}
          />
          <div className="flex justify-end pt-1">
            <Link
              href="/account/forgot-password"
              className="text-xs font-medium text-warm-muted hover:text-forest transition-colors"
            >
              Lupa kata sandi?
            </Link>
          </div>
        </div>

        <div className="pt-2">
          <SubmitButton
            loading={submitting}
            loadingLabel="Memeriksa kredensial..."
            disabled={lockCountdown !== null && lockCountdown > 0}
          >
            Masuk ke akun sekarang
          </SubmitButton>
        </div>
      </form>
    </AuthShell>
  );
}
