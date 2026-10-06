'use client';

import { useEffect } from 'react';

const RAY_COUNT = 8;
const MAX_NODES = 24;
const LIFETIME_MS = 260;

/**
 * Indikator klik global: semburan berkas sinar garis (ray lines) presisi.
 * Menghasilkan garis-garis sinar tipis yang meluncur memancar keluar dari titik klik.
 * Menghormati prefers-reduced-motion dan tidak menangkap pointer.
 */
export function ClickRay() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    function spawn(x: number, y: number) {
      if (reduceMotion.matches) return;
      const host = document.createElement('div');
      host.className = 'click-burst';
      host.style.left = `${x}px`;
      host.style.top = `${y}px`;
      host.setAttribute('aria-hidden', 'true');

      // Berkas garis sinar (ray lines) memancar keluar
      for (let i = 0; i < RAY_COUNT; i++) {
        const beam = document.createElement('span');
        beam.className = 'click-burst-beam';
        beam.style.setProperty('--beam-rot', `${i * 45}deg`);
        host.appendChild(beam);
      }

      document.body.appendChild(host);
      while (document.querySelectorAll('.click-burst').length > MAX_NODES) {
        document.querySelector('.click-burst')?.remove();
      }
      window.setTimeout(() => host.remove(), LIFETIME_MS);
    }

    function onPointerDown(e: PointerEvent) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      spawn(e.clientX, e.clientY);
    }

    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, []);

  return null;
}

