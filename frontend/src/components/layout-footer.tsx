'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Calculator, CalendarCheck, QrCode, ShieldCheck } from 'lucide-react';
import { BrandLogo } from '@/components/brand-logo';

const HIDE_FOOTER_ROUTES = new Set([
  '/account/login',
  '/account/register',
  '/account/forgot-password',
  '/account/reset-password',
  '/account/verify-email',
]);

export function AppFooter() {
  const pathname = usePathname();

  const isAuthPage = pathname ? HIDE_FOOTER_ROUTES.has(pathname) : false;

  if (isAuthPage) {
    return null;
  }

  return (
    <>
      {/* Semantic Landmark 3: Footer (Sibling to header and main) */}
      <footer className="border-t border-warm-border bg-warm-surface text-warm-muted text-xs py-10 px-4 md:px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-start gap-3">
            <BrandLogo className="w-8 h-8 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-warm-black text-sm">PT NutriDaily Pangan Sehat</p>
              <p>Dapur sentral Sudirman, Jakarta Selatan. Beroperasi sejak 2026.</p>
              <p className="text-warm-muted">Standar perlindungan data medis sesuai UU PDP No. 27/2022.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-5 text-warm-neutral font-medium">
            <Link href="/verify/ND-VERIFY-SALMON-2026" className="hover:text-forest">Uji laboratorium</Link>
            <Link href="/dashboard" className="hover:text-forest">Atur jadwal langganan</Link>
            <Link href="/account" className="hover:text-forest">Dashboard akun</Link>
            <Link href="/#calculator" className="hover:text-forest">Kalkulator TDEE</Link>
            <Link href="/privacy" className="hover:text-forest">Privasi</Link>
            <Link href="/privacy#privacy-dpo" className="hover:text-forest">Kontak DPO</Link>
          </div>
        </div>
      </footer>

      {/* One-Thumb Mobile Navigation Bar: Fixed 56px content bar */}
      <nav
        aria-label="Navigasi cepat ponsel"
        style={{ height: '56px' }}
        className="fixed bottom-0 inset-x-0 z-50 md:hidden bg-white/98 backdrop-blur-md border-t border-warm-border text-warm-neutral shadow-[0_-4px_20px_rgba(26,19,16,0.12)] select-none pointer-events-auto transform-gpu"
      >
        <div className="grid grid-cols-5 h-[56px] text-center text-[10px] font-medium items-stretch">
          <Link
            href="/"
            className={`flex flex-col items-center justify-center transition-colors h-[56px] tap-highlight-transparent ${
              pathname === '/' ? 'text-forest font-semibold' : 'text-warm-neutral hover:text-forest active:text-forest'
            }`}
          >
            <Home className="w-4 h-4 mb-0.5" />
            <span>Beranda</span>
          </Link>
          <Link
            href="/#calculator"
            className="flex flex-col items-center justify-center text-warm-neutral hover:text-forest active:text-forest transition-colors h-[56px] tap-highlight-transparent"
          >
            <Calculator className="w-4 h-4 mb-0.5" />
            <span>Kalkulator</span>
          </Link>
          <Link
            href="/dashboard"
            className={`flex flex-col items-center justify-center transition-colors h-[56px] tap-highlight-transparent ${
              pathname?.startsWith('/dashboard') ? 'text-forest font-semibold' : 'text-warm-neutral hover:text-forest active:text-forest'
            }`}
          >
            <CalendarCheck className="w-4 h-4 mb-0.5" />
            <span>Langganan</span>
          </Link>
          <Link
            href="/verify/ND-VERIFY-SALMON-2026"
            className={`flex flex-col items-center justify-center transition-colors h-[56px] tap-highlight-transparent ${
              pathname?.startsWith('/verify') ? 'text-forest font-semibold' : 'text-warm-neutral hover:text-forest active:text-forest'
            }`}
          >
            <QrCode className="w-4 h-4 mb-0.5" />
            <span>Label QR</span>
          </Link>
          <Link
            href="/account"
            className={`flex flex-col items-center justify-center transition-colors h-[56px] tap-highlight-transparent ${
              pathname?.startsWith('/account') ? 'text-forest font-semibold' : 'text-warm-neutral hover:text-forest active:text-forest'
            }`}
          >
            <ShieldCheck className="w-4 h-4 mb-0.5" />
            <span>Akun</span>
          </Link>
        </div>
        {/* Background extension under safe-area without altering the nav's 56px height */}
        <div
          aria-hidden="true"
          className="absolute top-full inset-x-0 h-10 bg-white border-t border-transparent pointer-events-none"
        />
      </nav>
    </>
  );
}
