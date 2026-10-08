import React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Mail,
  MapPin,
  Clock,
  FileText,
  Eye,
  PencilLine,
  Trash2,
  Lock,
  ArrowRight,
} from 'lucide-react';

export const metadata = {
  title: 'Kebijakan privasi dan kontak DPO - NutriDaily Indonesia',
  description:
    'Dasar hukum UU No. 27 Tahun 2022, persetujuan eksplisit data tubuh, enkripsi AES-256, hak pemilik data, dan kontak Petugas Perlindungan Data NutriDaily.',
};

const DATA_RIGHTS = [
  {
    icon: Eye,
    title: 'Hak akses data',
    desc: 'Lihat seluruh data diri, rekam gizi terenkripsi, dan riwayat faktur melalui dashboard akun kapan saja.',
  },
  {
    icon: PencilLine,
    title: 'Hak koreksi data',
    desc: 'Perbaiki nama, nomor WhatsApp, dan metrik tubuh lewat pengaturan akun atau kirim permintaan ke email DPO.',
  },
  {
    icon: Trash2,
    title: 'Hak hapus permanen',
    desc: 'Hapus akun permanen lewat tab keamanan dan sesi di pengaturan akun. Data pribadi dianonimkan, faktur pajak tetap disimpan.',
  },
];

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-10 space-y-6">
      <div className="space-y-2 pb-6 border-b border-warm-border">
        <p className="eyebrow text-forest">Privasi dan kepatuhan</p>
        <h1 className="font-display text-2xl md:text-3xl text-warm-black [text-wrap:balance]">
          Kebijakan privasi NutriDaily Indonesia.
        </h1>
        <p className="text-sm text-warm-muted [text-wrap:pretty] max-w-2xl">
          Dokumen ini menjelaskan dasar hukum pemrosesan data, persetujuan eksplisit yang Anda berikan saat
          mendaftar, cara kami melindungi rekam gizi, dan cara menghubungi petugas perlindungan data kami.
        </p>
      </div>

      <section
        aria-labelledby="privacy-law"
        className="bg-warm-surface border border-warm-border rounded-[18px] p-6 grain-overlay-light space-y-3 shadow-natural"
      >
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-forest-subtle border border-forest-border rounded-md text-forest shrink-0">
            <FileText className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h2 id="privacy-law" className="font-display font-semibold text-base text-warm-black">
              Dasar hukum dan persetujuan eksplisit
            </h2>
            <p className="text-xs text-warm-muted mt-0.5 [text-wrap:pretty]">
              Pemrosesan data pribadi mengacu pada UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi.
            </p>
          </div>
        </div>
        <ul className="text-xs text-warm-muted leading-relaxed space-y-2 list-disc pl-5 [text-wrap:pretty]">
          <li>
            Pendaftaran akun baru mewajibkan centang persetujuan penggunaan data tubuh untuk kalkulasi menu.
            Tanpa centang tersebut, pendaftaran ditolak sistem.
          </li>
          <li>
            Setiap persetujuan dicatat dengan stempel waktu dan versi kebijakan (versi aktif: pdp-2026-10)
            sehingga riwayat izin Anda dapat diaudit.
          </li>
          <li>
            Penyimpanan profil kesehatan dan catatan medis hanya berjalan bila akun memiliki catatan
            persetujuan yang valid.
          </li>
          <li>
            Kalkulator TDEE di beranda dihitung langsung di peramban Anda dan tidak dikirim atau disimpan ke
            server.
          </li>
        </ul>
      </section>

      <section
        aria-labelledby="privacy-security"
        className="bg-warm-surface border border-warm-border rounded-[18px] p-6 grain-overlay-light space-y-3 shadow-natural"
      >
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-forest-subtle border border-forest-border rounded-md text-forest shrink-0">
            <Lock className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h2 id="privacy-security" className="font-display font-semibold text-base text-warm-black">
              Enkripsi dan masa retensi data
            </h2>
            <p className="text-xs text-warm-muted mt-0.5 [text-wrap:pretty]">
              Data kesehatan mendapat lapisan proteksi tambahan di tingkat kolom database.
            </p>
          </div>
        </div>
        <ul className="text-xs text-warm-muted leading-relaxed space-y-2 list-disc pl-5 [text-wrap:pretty]">
          <li>Catatan medis dan rekam gizi dienkripsi dengan AES-256-GCM per kolom database.</li>
          <li>Kata sandi di-hash dengan Argon2id dan tidak pernah disimpan dalam bentuk teks asli.</li>
          <li>Sesi masuk memakai cookie HTTP-only dengan rotasi token berkala dan proteksi CSRF.</li>
          <li>
            Penghapusan akun menganonimkan identitas dan menghapus profil kesehatan. Riwayat faktur
            pembayaran tetap disimpan untuk keperluan pembukuan perpajakan resmi.
          </li>
        </ul>
      </section>

      <section
        aria-labelledby="privacy-rights"
        className="bg-warm-surface border border-warm-border rounded-[18px] p-6 grain-overlay-light space-y-4 shadow-natural"
      >
        <div>
          <h2 id="privacy-rights" className="font-display font-semibold text-base text-warm-black">
            Hak pemilik data
          </h2>
          <p className="text-xs text-warm-muted mt-0.5 [text-wrap:pretty]">
            Setiap pelanggan dapat memakai tiga hak berikut tanpa biaya.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {DATA_RIGHTS.map((right) => {
            const Icon = right.icon;
            return (
              <div key={right.title} className="p-4 bg-tebu-50 rounded-lg border border-warm-border space-y-2">
                <div className="w-8 h-8 rounded-md bg-forest-subtle border border-forest-border flex items-center justify-center text-forest">
                  <Icon className="w-4 h-4" aria-hidden="true" />
                </div>
                <h3 className="text-xs font-semibold text-warm-black">{right.title}</h3>
                <p className="text-[11px] text-warm-muted leading-relaxed [text-wrap:pretty]">{right.desc}</p>
              </div>
            );
          })}
        </div>
        <Link
          href="/account"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 min-h-[44px] rounded-md bg-warm-black hover:bg-forest text-tebu-50 text-xs font-semibold transition-colors shadow-natural"
        >
          <span>Buka pengaturan akun</span>
          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
        </Link>
      </section>

      <section
        aria-labelledby="privacy-dpo"
        className="bg-warm-dark text-tebu-100 rounded-[18px] p-6 grain-overlay-panel space-y-4 shadow-natural"
      >
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-forest-active rounded-md text-tebu-50 shrink-0">
            <ShieldCheck className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h2 id="privacy-dpo" className="font-display font-semibold text-base text-tebu-50">
              Kontak petugas perlindungan data (DPO)
            </h2>
            <p className="text-xs text-tebu-300 mt-0.5 [text-wrap:pretty]">
              Sampaikan pertanyaan privasi, permintaan akses, koreksi, atau penghapusan data melalui kanal
              resmi berikut.
            </p>
          </div>
        </div>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-lg border border-tebu-100/15 bg-warm-black/30 space-y-1">
            <dt className="text-[11px] text-tebu-300 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Nama petugas</span>
            </dt>
            <dd className="font-semibold text-tebu-50">Petugas Perlindungan Data NutriDaily</dd>
          </div>
          <div className="p-3.5 rounded-lg border border-tebu-100/15 bg-warm-black/30 space-y-1">
            <dt className="text-[11px] text-tebu-300 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Email resmi</span>
            </dt>
            <dd>
              <a href="mailto:dpo@nutridaily.id" className="font-semibold text-tebu-50 underline hover:text-tebu-200">
                dpo@nutridaily.id
              </a>
            </dd>
          </div>
          <div className="p-3.5 rounded-lg border border-tebu-100/15 bg-warm-black/30 space-y-1">
            <dt className="text-[11px] text-tebu-300 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Alamat surat</span>
            </dt>
            <dd className="font-medium text-tebu-100 leading-relaxed">
              PT NutriDaily Pangan Sehat, Jl. Puri Kembangan No. 18, Kembangan, Jakarta Barat 11610
            </dd>
          </div>
          <div className="p-3.5 rounded-lg border border-tebu-100/15 bg-warm-black/30 space-y-1">
            <dt className="text-[11px] text-tebu-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" aria-hidden="true" />
              <span>SLA respons</span>
            </dt>
            <dd className="font-medium text-tebu-100 leading-relaxed">
              Maksimal 2 hari kerja untuk pertanyaan umum dan 7 hari kerja untuk permintaan akses atau
              penghapusan data.
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
