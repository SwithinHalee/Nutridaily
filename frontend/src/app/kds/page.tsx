'use client';

import React from 'react';
import Link from 'next/link';
import { ChefHat, ArrowUpRight, ArrowLeft, ShieldAlert } from 'lucide-react';

export default function KitchenDisplaySystemNoticePage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <div className="bg-warm-surface border border-warm-border rounded-xl p-8 space-y-6 shadow-natural">
        <div className="w-12 h-12 rounded-lg bg-forest text-tebu-50 flex items-center justify-center">
          <ChefHat className="w-6 h-6" />
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-terracotta/15 text-terracotta border border-terracotta/30">
              Sistem internal koki
            </span>
            <span className="text-[11px] font-mono text-warm-muted">Server Port 4000</span>
          </div>
          <h1 className="text-2xl font-display font-bold text-warm-black tracking-tight">
            Layar dapur sentral telah dipindahkan ke server backend internal
          </h1>
          <p className="text-sm text-warm-muted leading-relaxed">
            Sesuai arsitektur operasional NutriDaily, antarmuka layar dapur sentral (KDS) dan kendali masak koki dijalankan secara mandiri pada server internal backend (Port 4000) untuk menjamin pemisahan akses dengan portal pelanggan.
          </p>
        </div>

        <div className="p-4 rounded-lg bg-tebu-50 border border-warm-border space-y-2 text-xs text-warm-neutral">
          <div className="flex items-center gap-2 font-semibold text-warm-black">
            <ShieldAlert className="w-4 h-4 text-forest" />
            <span>Alamat akses tablet dapur sentral:</span>
          </div>
          <p className="font-mono text-xs text-forest font-bold">
            http://localhost:4000/kds
          </p>
          <p className="text-warm-muted">
            Dilengkapi gateway WebSocket real-time (<code className="font-mono">ws://localhost:4000/kds</code>), filter stasiun masak, dan notifikasi audio tablet dapur.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <a
            href="http://localhost:4000/kds"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-md bg-forest hover:bg-forest-hover active:bg-forest-active text-tebu-50 text-xs font-semibold uppercase tracking-wider transition-colors"
          >
            <span>Buka layar dapur kds (Port 4000)</span>
            <ArrowUpRight className="w-4 h-4" />
          </a>

          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-md border border-warm-border bg-tebu-50 hover:bg-tebu-100 text-warm-black text-xs font-semibold transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-warm-muted" />
            <span>Kembali ke beranda pelanggan</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
