'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  AuthShell,
  FormAlert,
  SubmitButton,
  TextField,
} from '@/components/auth/auth-ui';
import { ApiError, authApi } from '@/lib/api-client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim()) return;

    setSubmitting(true);
    try {
      await authApi.forgotPassword(email.trim());
      setSubmitted(true);
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Terjadi kendala saat mengajukan pemulihan kata sandi. Silakan coba lagi.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Pemulihan akses"
      title="Lupa kata sandi akun"
      description="Masukkan alamat email akun NutriDaily Anda untuk menerima tautan pemulihan kata sandi aman."
      footer={
        <div className="flex items-center justify-between">
          <span>Ingat kata sandi Anda?</span>
          <Link
            href="/account/login"
            className="font-semibold text-forest hover:text-forest-hover transition-colors underline"
          >
            Masuk ke akun
          </Link>
        </div>
      }
    >
      {submitted ? (
        <div className="space-y-4">
          <FormAlert tone="info">
            <p className="font-semibold text-warm-black">Permintaan pemulihan telah diproses.</p>
            <p className="mt-1 text-xs text-warm-neutral">
              Jika alamat email <strong className="font-semibold">{email}</strong> terdaftar pada sistem
              kami, kami telah mengirimkan tautan reset kata sandi berkekuatan satu kali pakai yang
              berlaku selama 15 menit.
            </p>
          </FormAlert>

          <div className="p-4 bg-tebu-50 border border-warm-border rounded-lg text-xs space-y-2 text-warm-muted leading-relaxed">
            <p className="font-semibold text-warm-black">Langkah berikutnya:</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>Periksa kotak masuk utama atau folder promosi/spam email Anda.</li>
              <li>Klik tautan &ldquo;Atur ulang kata sandi&rdquo; sebelum masa berlaku 15 menit berakhir.</li>
              <li>Demi keamanan, seluruh sesi aktif lama akan otomatis dibatalkan setelah sandi berhasil diubah.</li>
            </ul>
          </div>

          <div className="pt-2">
            <Link
              href="/account/login"
              className="w-full inline-flex items-center justify-center px-4 py-2.5 rounded-md bg-warm-black hover:bg-forest text-tebu-50 text-sm font-semibold transition-colors shadow-natural text-center"
            >
              Kembali ke halaman masuk
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMessage && <FormAlert tone="error">{errorMessage}</FormAlert>}

          <TextField
            label="Alamat email akun"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nama@domain.id"
            hint="Tautan pemulihan akan dikirimkan ke alamat ini"
            disabled={submitting}
          />

          <div className="pt-2">
            <SubmitButton loading={submitting} loadingLabel="Memproses permintaan...">
              Kirim tautan pemulihan sandi
            </SubmitButton>
          </div>
        </form>
      )}
    </AuthShell>
  );
}
