import type { Metadata, Viewport } from 'next';
import { Manrope, Fraunces } from 'next/font/google';
import './globals.css';
import Link from 'next/link';
import { AuthProvider } from '@/lib/auth-context';
import { HeaderAuthStatus } from '@/components/auth/header-auth-status';
import { AppFooter } from '@/components/layout-footer';
import { ClickRay } from '@/components/click-ray';

import { BrandLogo } from '@/components/brand-logo';

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  weight: ['500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'NutriDaily Indonesia. Katering sehat dengan takaran gizi presisi',
  description:
    'Platform katering sehat terpersonalisasi berbasis langganan mingguan. Dihitung berdasarkan kebutuhan metabolisme tubuh dan diantar setiap hari kerja.',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/brand/logo-light.svg', type: 'image/svg+xml' },
      { url: '/icons/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: '/icons/icon-192x192.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#2C4A3E',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${manrope.variable} ${fraunces.variable}`}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className="min-h-[100dvh] bg-tebu-50 text-warm-black font-sans flex flex-col antialiased selection:bg-forest/15 selection:text-forest">
        <AuthProvider>
          {/* Semantic Landmark 1: Header (Sibling to main and footer) */}
          <header className="sticky top-0 z-40 bg-tebu-50/95 backdrop-blur-sm border-b border-warm-border">
            <div className="max-w-6xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2.5 group">
                <BrandLogo className="w-8 h-8 transition-transform group-hover:scale-105 flex-shrink-0" ariaLabel="NutriDaily" />
                <div className="flex flex-col">
                  <span className="font-display font-semibold text-lg tracking-tight leading-none text-warm-black">
                    NutriDaily
                  </span>
                  <span className="text-[11px] font-medium text-warm-muted leading-tight mt-0.5">
                    Indonesia
                  </span>
                </div>
              </Link>

              <nav aria-label="Navigasi utama pelanggan" className="hidden md:flex items-center gap-7 text-sm font-medium text-warm-neutral">
                <Link href="/#calculator" className="hover:text-forest transition-colors">
                  Kalkulator gizi
                </Link>
                <Link href="/dashboard" className="hover:text-forest transition-colors">
                  Atur langganan
                </Link>
                <Link href="/verify/ND-VERIFY-SALMON-2026" className="hover:text-forest transition-colors">
                  Verifikasi label
                </Link>
              </nav>

              <div className="flex items-center gap-3">
                <HeaderAuthStatus />
              </div>
            </div>
          </header>

          {/* Semantic Landmark 2: Main Content (Must NOT contain header or footer) */}
          <main id="main-content" className="flex-1 pb-16 md:pb-0">
            {children}
          </main>

          <AppFooter />
          <ClickRay />
        </AuthProvider>
      </body>
    </html>
  );
}
