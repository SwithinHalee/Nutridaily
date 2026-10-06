'use client';

import React from 'react';
import Link from 'next/link';
import { User, LogIn } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export function HeaderAuthStatus() {
  const { status, user } = useAuth();

  if (status === 'loading') {
    return (
      <div className="h-8 w-24 bg-tebu-200/60 rounded-md animate-pulse" aria-hidden="true" />
    );
  }

  if (status === 'authenticated' && user) {
    const firstName = user.fullName.split(' ')[0] || 'Akun';
    return (
      <Link
        href="/account"
        className="inline-flex items-center gap-1.5 text-xs font-semibold bg-forest text-tebu-50 hover:bg-forest-hover px-3.5 py-2 rounded-md transition-colors shadow-natural"
      >
        <User className="w-3.5 h-3.5" aria-hidden="true" />
        <span className="truncate max-w-[120px]">{firstName}</span>
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/account/login"
        className="inline-flex items-center gap-1 text-xs font-semibold text-warm-neutral hover:text-forest px-3 py-2 rounded-md transition-colors"
      >
        <LogIn className="w-3.5 h-3.5" aria-hidden="true" />
        <span>Masuk</span>
      </Link>
      <Link
        href="/account/register"
        className="text-xs font-semibold bg-forest text-tebu-50 hover:bg-forest-hover px-3.5 py-2 rounded-md transition-colors shadow-natural"
      >
        Daftar
      </Link>
    </div>
  );
}
