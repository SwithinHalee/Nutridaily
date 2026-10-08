'use client';

import React, { useId, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, ArrowLeft, Check, CheckCircle2, Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react';
import { PASSWORD_RULES } from '@/lib/api-client';
import { BrandLogo } from '@/components/brand-logo';

/* ------------------------------------------------------------------ Shell */

const SECURITY_FACTS = [
  { value: 'Argon2id', label: 'Kata sandi di-hash dengan memori 19 MiB per percobaan, bukan disimpan.' },
  { value: '15 menit', label: 'Masa berlaku token akses. Diperbarui otomatis lewat cookie HTTP-only.' },
  { value: '5 kali', label: 'Batas salah sandi sebelum akun dikunci sementara selama 15 menit.' },
];

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
  footer,
}: {
  eyebrow: string;
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-12 min-h-[calc(100dvh-4rem)]">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-warm-muted hover:text-warm-black transition-colors mb-6"
      >
        <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
        <span>Kembali ke beranda</span>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        <section className="lg:col-span-7 bg-warm-card border border-warm-border rounded-[20px] p-6 md:p-8 grain-overlay-light shadow-natural">
          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-2.5">
              <BrandLogo className="w-6 h-6 flex-shrink-0" />
              <p className="eyebrow text-forest">{eyebrow}</p>
            </div>
            <h1 className="font-display text-2xl md:text-3xl text-warm-black [text-wrap:balance]">{title}</h1>
            {description && <p className="text-sm text-warm-muted [text-wrap:pretty]">{description}</p>}
          </div>
          {children}
          {footer && <div className="mt-6 pt-5 border-t border-warm-border text-xs text-warm-muted">{footer}</div>}
        </section>

        <aside className="lg:col-span-5 bg-warm-dark text-tebu-100 rounded-[20px] p-6 md:p-8 grain-overlay-panel flex flex-col">
          <div className="flex items-center justify-between gap-2 text-xs font-semibold text-tebu-200">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" aria-hidden="true" />
              <span>Perlindungan akun sesuai UU PDP No. 27/2022</span>
            </div>
            <BrandLogo className="w-5 h-5 flex-shrink-0 opacity-80" variant="dark" />
          </div>
          <dl className="mt-6 space-y-5">
            {SECURITY_FACTS.map((fact) => (
              <div key={fact.value} className="border-l-2 border-forest-border pl-4">
                <dt className="font-display text-xl text-tebu-50">{fact.value}</dt>
                <dd className="text-xs text-tebu-300 mt-1 [text-wrap:pretty]">{fact.label}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-auto pt-8 text-[11px] text-tebu-300 [text-wrap:pretty]">
            Tim NutriDaily tidak pernah meminta kata sandi atau kode verifikasi Anda lewat WhatsApp, telepon, atau email.
          </p>
        </aside>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ Alerts */

export function FormAlert({ tone, children }: { tone: 'error' | 'success' | 'info'; children: React.ReactNode }) {
  const styles = {
    error: 'bg-terracotta-subtle border-terracotta-border text-terracotta-active',
    success: 'bg-forest-subtle border-forest-border text-forest',
    info: 'bg-tebu-100 border-warm-border text-warm-neutral',
  }[tone];
  const Icon = tone === 'success' ? CheckCircle2 : AlertCircle;
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={`flex items-start gap-2 p-3 border rounded-lg text-xs ${styles}`}>
      <Icon className="w-4 h-4 shrink-0 mt-px" aria-hidden="true" />
      <div className="[text-wrap:pretty]">{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ Fields */

const inputClass =
  'w-full bg-tebu-50 border rounded-md px-3 py-2.5 text-sm text-warm-black font-medium placeholder:text-warm-stone focus:outline-none focus:border-forest focus:ring-2 focus:ring-forest/15 disabled:opacity-60 transition-colors';

export function TextField({
  label,
  error,
  hint,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string; hint?: string }) {
  const id = useId();
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-semibold text-warm-black mb-1">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={!!error}
        aria-describedby={describedBy}
        className={`${inputClass} ${error ? 'border-terracotta' : 'border-warm-border'}`}
        {...props}
      />
      {error ? (
        <p id={`${id}-error`} className="mt-1 text-[11px] font-medium text-terracotta-active">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1 text-[11px] text-warm-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function PasswordField({
  label,
  error,
  showRules = false,
  value,
  ...props
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label: string;
  error?: string;
  showRules?: boolean;
  value: string;
}) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-semibold text-warm-black mb-1">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : showRules ? `${id}-rules` : undefined}
          className={`${inputClass} pr-11 ${error ? 'border-terracotta' : 'border-warm-border'}`}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-pressed={visible}
          aria-label={visible ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded text-warm-stone hover:text-warm-black hover:bg-tebu-200/60 transition-colors"
        >
          {visible ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
        </button>
      </div>
      {error && (
        <p id={`${id}-error`} className="mt-1 text-[11px] font-medium text-terracotta-active">
          {error}
        </p>
      )}
      {showRules && (
        <ul id={`${id}-rules`} className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1" aria-label="Syarat kata sandi">
          {PASSWORD_RULES.map((rule) => {
            const ok = rule.test(value);
            return (
              <li key={rule.id} className={`flex items-center gap-1.5 text-[11px] ${ok ? 'text-forest font-medium' : 'text-warm-muted'}`}>
                <span
                  className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                    ok ? 'bg-forest border-forest text-tebu-50' : 'border-warm-border'
                  }`}
                  aria-hidden="true"
                >
                  {ok && <Check className="w-2.5 h-2.5" strokeWidth={3} />}
                </span>
                <span>
                  {rule.label}
                  <span className="sr-only">{ok ? ': terpenuhi' : ': belum terpenuhi'}</span>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ Buttons */

export function SubmitButton({
  loading,
  children,
  loadingLabel,
  variant = 'primary',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
  loadingLabel?: string;
  variant?: 'primary' | 'danger' | 'dark';
}) {
  const styles = {
    primary: 'bg-forest hover:bg-forest-hover text-tebu-50',
    danger: 'bg-terracotta hover:bg-terracotta-hover text-tebu-50',
    dark: 'bg-warm-black hover:bg-forest text-tebu-50',
  }[variant];
  return (
    <button
      type="submit"
      disabled={loading || props.disabled}
      aria-busy={loading}
      className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-semibold min-h-[44px] transition-colors shadow-natural disabled:opacity-60 disabled:cursor-not-allowed ${styles}`}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
      <span>{loading && loadingLabel ? loadingLabel : children}</span>
    </button>
  );
}

/** Reads a query parameter on the client without useSearchParams (keeps pages statically buildable). */
export function readQueryParam(name: string): string | null {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search).get(name);
}

/** Removes secrets such as one-time tokens from the address bar and browser history. */
export function scrubQueryFromUrl(): void {
  if (typeof window === 'undefined') return;
  window.history.replaceState(null, '', window.location.pathname);
}
