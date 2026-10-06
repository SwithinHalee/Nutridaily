'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  AuthShell,
  FormAlert,
  PasswordField,
  SubmitButton,
  TextField,
} from '@/components/auth/auth-ui';
import { ApiError, authApi } from '@/lib/api-client';

export default function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [resendNotice, setResendNotice] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setFieldErrors({});

    if (password !== confirmPassword) {
      setFieldErrors({ confirmPassword: 'Konfirmasi kata sandi tidak cocok.' });
      return;
    }

    setSubmitting(true);
    try {
      await authApi.register({
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
        confirmPassword,
      });
      setRegisteredEmail(email.trim());
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
        setErrorMessage('Terjadi kendala saat mendaftarkan akun. Silakan coba lagi.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!registeredEmail) return;
    setResending(true);
    setResendNotice(null);
    try {
      const res = await authApi.resendVerification(registeredEmail);
      setResendNotice(res.message);
    } catch (err) {
      setResendNotice(
        err instanceof ApiError ? err.message : 'Gagal mengirim ulang tautan verifikasi.'
      );
    } finally {
      setResending(false);
    }
  };

  if (registeredEmail) {
    return (
      <AuthShell
        eyebrow="Verifikasi akun"
        title="Tautan verifikasi telah dikirim"
        description="Demi keamanan rekam medis dan privasi data Anda, kami perlu memverifikasi kepemilikan alamat email ini sebelum akun dapat digunakan."
      >
        <div className="space-y-4">
          <FormAlert tone="success">
            <p>
              Tautan aktivasi satu kali telah dikirim ke{' '}
              <strong className="font-semibold text-warm-black">{registeredEmail}</strong>.
              Tautan berlaku selama 24 jam.
            </p>
          </FormAlert>

          {resendNotice && <FormAlert tone="info">{resendNotice}</FormAlert>}

          <div className="p-4 bg-tebu-50 border border-warm-border rounded-lg text-xs space-y-2 text-warm-muted leading-relaxed">
            <p className="font-semibold text-warm-black">Petunjuk aktivasi:</p>
            <ol className="list-decimal pl-4 space-y-1">
              <li>Periksa kotak masuk utama atau folder spam email Anda.</li>
              <li>Klik tombol atau tautan bertuliskan &ldquo;Verifikasi alamat email&rdquo;.</li>
              <li>Setelah terverifikasi, Anda dapat langsung masuk dan memesan paket katering.</li>
            </ol>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link
              href="/account/login"
              className="flex-1 inline-flex items-center justify-center px-4 py-2.5 rounded-md bg-forest hover:bg-forest-hover text-tebu-50 text-sm font-semibold transition-colors shadow-natural text-center"
            >
              Masuk ke akun sekarang
            </Link>
            <button
              type="button"
              disabled={resending}
              onClick={handleResend}
              className="px-4 py-2.5 rounded-md bg-warm-surface border border-warm-border hover:bg-tebu-100 text-warm-black text-xs font-semibold transition-colors disabled:opacity-60 cursor-pointer"
            >
              {resending ? 'Mengirim ulang...' : 'Kirim ulang tautan verifikasi'}
            </button>
          </div>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="Registrasi akun baru"
      title="Daftar akun NutriDaily Indonesia"
      description="Nikmati katering sehat terpersonalisasi, konsultasi ahli gizi, dan transparansi bahan bersertifikat."
      footer={
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <span>Sudah memiliki akun terdaftar?</span>
          <Link
            href="/account/login"
            className="font-semibold text-forest hover:text-forest-hover transition-colors underline"
          >
            Masuk ke akun Anda
          </Link>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && <FormAlert tone="error">{errorMessage}</FormAlert>}

        <TextField
          label="Nama lengkap"
          type="text"
          autoComplete="name"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Nama sesuai identitas"
          error={fieldErrors.fullName}
          disabled={submitting}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextField
            label="Alamat email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nama@domain.id"
            error={fieldErrors.email}
            disabled={submitting}
          />

          <TextField
            label="Nomor WhatsApp"
            type="tel"
            autoComplete="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="0812-xxxx-xxxx"
            hint="Format Indonesia (08xx atau +62xx)"
            error={fieldErrors.phone}
            disabled={submitting}
          />
        </div>

        <PasswordField
          label="Kata sandi baru"
          autoComplete="new-password"
          required
          showRules
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Minimal 8 karakter berkombinasi"
          error={fieldErrors.password}
          disabled={submitting}
        />

        <PasswordField
          label="Ulangi kata sandi"
          autoComplete="new-password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Ketik ulang kata sandi"
          error={fieldErrors.confirmPassword}
          disabled={submitting}
        />

        <p className="text-[11px] text-warm-muted leading-relaxed [text-wrap:pretty]">
          Dengan mendaftar, Anda menyetujui penyimpanan rekam gizi dan data kesehatan sesuai regulasi
          perlindungan data pribadi UU PDP No. 27/2022.
        </p>

        <div className="pt-2">
          <SubmitButton loading={submitting} loadingLabel="Membuat akun terenkripsi...">
            Daftar akun sekarang
          </SubmitButton>
        </div>
      </form>
    </AuthShell>
  );
}
