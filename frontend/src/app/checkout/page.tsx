'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  CreditCard,
  QrCode,
  Building,
  ShieldCheck,
  CheckCircle2,
  Lock,
} from 'lucide-react';

function CheckoutForm() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const plan = searchParams.get('plan') || 'WEIGHT_LOSS_LEAN_SCULPT';
  const targetCalories = searchParams.get('calories') || '1380';
  const basePricePerDay = Number(searchParams.get('price')) || 85000;

  const [durationDays, setDurationDays] = useState<number>(20); // 20 workday default
  const [paymentMethod, setPaymentMethod] = useState<'SNAP_QRIS' | 'SNAP_VA' | 'SNAP_RECURRING_CC'>('SNAP_QRIS');
  const [pdpConsent, setPdpConsent] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Price calculations
  const subtotal = basePricePerDay * durationDays;
  const discount = durationDays === 20 ? subtotal * 0.1 : durationDays === 30 ? subtotal * 0.15 : 0;
  const totalAmount = subtotal - discount;

  const handlePay = async () => {
    if (!pdpConsent) {
      alert('Mohon menyetujui persetujuan pemrosesan data kesehatan (UU PDP No. 27/2022).');
      return;
    }

    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      setPaymentSuccess(true);
    }, 1200);
  };

  if (paymentSuccess) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-left space-y-5">
        <div className="w-12 h-12 bg-forest-subtle text-forest rounded-full flex items-center justify-center">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h1 className="font-display text-2xl font-bold text-warm-black">
          Pembayaran langganan berhasil dikonfirmasi.
        </h1>
        <p className="text-xs text-warm-muted leading-relaxed">
          Terima kasih telah berlangganan NutriDaily Indonesia. Salinan faktur resmi dan rincian jadwal pengiriman telah dikirimkan ke nomor WhatsApp Anda.
        </p>

        <div className="p-4 bg-warm-surface rounded-md border border-warm-border text-xs space-y-1.5">
          <p className="font-semibold text-warm-black">Rincian transaksi:</p>
          <p className="text-warm-muted">ID Pesanan: ND-INV-202610-0982</p>
          <p className="text-warm-muted">Paket: {plan} ({targetCalories} kkal/hari)</p>
          <p className="text-warm-muted">Durasi: {durationDays} hari kerja pengiriman</p>
          <p className="text-warm-black font-semibold pt-1">Total: Rp {totalAmount.toLocaleString('id-ID')}</p>
        </div>

        <button
          type="button"
          onClick={() => router.push('/dashboard')}
          className="w-full py-3 bg-forest hover:bg-forest-hover text-tebu-50 font-semibold text-xs rounded-md transition-colors text-center"
        >
          Buka dashboard kontrol langganan
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-10">
      <div className="space-y-1.5 mb-8">
        <p className="eyebrow text-forest">Konfirmasi pemesanan</p>
        <h1 className="font-display text-2xl md:text-3xl text-warm-black">
          Selesaikan langganan paket katering sehat Anda.
        </h1>
        <p className="text-xs text-warm-muted">
          Standar penimbangan dapur presisi dengan perlindungan data kesehatan UU PDP No. 27/2022.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Form */}
        <div className="lg:col-span-7 space-y-6">
          {/* Duration Selector */}
          <div className="bg-warm-surface p-5 rounded-[16px] border border-warm-border space-y-3">
            <h2 className="text-xs font-semibold text-warm-black uppercase tracking-wider">
              1. Pilih durasi pengiriman
            </h2>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { days: 5, label: '5 hari kerja', sub: 'Paket mingguan' },
                { days: 20, label: '20 hari kerja', sub: 'Potongan 10%' },
                { days: 30, label: '30 hari kerja', sub: 'Potongan 15%' },
              ].map((item) => (
                <button
                  key={item.days}
                  type="button"
                  onClick={() => setDurationDays(item.days)}
                  className={`p-3 rounded-md border text-left transition-colors ${
                    durationDays === item.days
                      ? 'bg-tebu-50 border-forest text-warm-black ring-1 ring-forest'
                      : 'bg-tebu-50/60 border-warm-border text-warm-muted hover:border-warm-neutral'
                  }`}
                >
                  <p className="text-xs font-semibold text-warm-black">{item.label}</p>
                  <p className="text-[10px] text-warm-muted mt-0.5">{item.sub}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Delivery Address */}
          <div className="bg-warm-surface p-5 rounded-[16px] border border-warm-border space-y-3">
            <h2 className="text-xs font-semibold text-warm-black uppercase tracking-wider">
              2. Alamat pengantaran katering
            </h2>
            <div className="space-y-2.5">
              <input
                type="text"
                defaultValue="Kantor SCBD Pacific Century Tower Lt. 18"
                className="w-full text-xs font-medium p-2.5 rounded-md border border-warm-border bg-tebu-50 text-warm-black focus:outline-none focus:border-forest"
              />
              <textarea
                rows={2}
                defaultValue="Jl. Jend. Sudirman Kav. 52-53, Jakarta Selatan (Titip di meja resepsionis lobby utama sebelum pukul 11.30 WIB)"
                className="w-full text-xs p-2.5 rounded-md border border-warm-border bg-tebu-50 text-warm-black focus:outline-none focus:border-forest"
              />
            </div>
          </div>

          {/* Payment Method Selector (Flat colors, no gradient) */}
          <div className="bg-warm-surface p-5 rounded-[16px] border border-warm-border space-y-3">
            <h2 className="text-xs font-semibold text-warm-black uppercase tracking-wider">
              3. Metode pembayaran aman
            </h2>
            <div className="space-y-2">
              {[
                {
                  id: 'SNAP_QRIS',
                  title: 'QRIS real-time (BCA, GoPay, OVO, Dana, ShopeePay)',
                  desc: 'Pindai langsung dari aplikasi perbankan atau dompet digital Anda.',
                  icon: QrCode,
                },
                {
                  id: 'SNAP_VA',
                  title: 'Virtual Account otomatis (BCA, Mandiri, BNI, BRI)',
                  desc: 'Konfirmasi otomatis tanpa perlu kirim bukti transfer manual.',
                  icon: Building,
                },
                {
                  id: 'SNAP_RECURRING_CC',
                  title: 'Autodebet kartu kredit / debit (Tokenisasi berulang)',
                  desc: 'Perpanjangan langganan otomatis setiap siklus dengan standar PCI-DSS.',
                  icon: CreditCard,
                },
              ].map((m) => {
                const Icon = m.icon;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id as any)}
                    className={`w-full p-3 rounded-md border text-left transition-colors flex items-start gap-3 ${
                      paymentMethod === m.id
                        ? 'bg-tebu-50 border-forest ring-1 ring-forest'
                        : 'bg-tebu-50/60 border-warm-border hover:border-warm-neutral'
                    }`}
                  >
                    <Icon className="w-4 h-4 text-forest shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-xs font-semibold text-warm-black">{m.title}</h3>
                      <p className="text-[11px] text-warm-muted">{m.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* UU PDP Consent */}
          <div className="p-4 rounded-md bg-warm-surface border border-warm-border text-xs flex items-start gap-2.5">
            <input
              type="checkbox"
              id="pdp"
              checked={pdpConsent}
              onChange={(e) => setPdpConsent(e.target.checked)}
              className="mt-0.5 rounded border-warm-border text-forest focus:ring-forest"
            />
            <label htmlFor="pdp" className="text-warm-muted leading-relaxed cursor-pointer">
              Saya menyetujui pemrosesan data fisik dan riwayat kesehatan saya khusus untuk keperluan personalisasi porsi katering sesuai <strong className="text-warm-black font-semibold">UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP)</strong> dengan enkripsi AES-256-GCM.
            </label>
          </div>
        </div>

        {/* Right Summary Column */}
        <div className="lg:col-span-5">
          <div className="bg-warm-surface rounded-[16px] border border-warm-border p-6 space-y-5 sticky top-24">
            <h2 className="font-display font-semibold text-base text-warm-black">
              Ringkasan pembayaran
            </h2>

            <div className="space-y-2.5 text-xs border-b border-warm-border pb-4">
              <div className="flex justify-between">
                <span className="text-warm-muted">Paket gizi</span>
                <span className="font-semibold text-warm-black">{plan}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-warm-muted">Target kalori</span>
                <span className="font-semibold text-warm-black">{targetCalories} kkal / hari</span>
              </div>
              <div className="flex justify-between">
                <span className="text-warm-muted">Durasi pengiriman</span>
                <span className="font-semibold text-warm-black">{durationDays} hari kerja</span>
              </div>
              <div className="flex justify-between">
                <span className="text-warm-muted">Tarif harian</span>
                <span className="text-warm-black">Rp {basePricePerDay.toLocaleString('id-ID')}</span>
              </div>
            </div>

            <div className="space-y-2 text-xs border-b border-warm-border pb-4">
              <div className="flex justify-between">
                <span className="text-warm-muted">Subtotal ({durationDays} hari)</span>
                <span className="text-warm-black font-mono">Rp {subtotal.toLocaleString('id-ID')}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-forest font-semibold">
                  <span>Potongan durasi paket</span>
                  <span className="font-mono">- Rp {discount.toLocaleString('id-ID')}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-warm-muted">Ongkos kirim (Jabodetabek)</span>
                <span className="text-forest font-semibold">Gratis</span>
              </div>
            </div>

            <div className="flex justify-between items-baseline pt-1">
              <span className="text-xs font-semibold text-warm-black">Total pembayaran</span>
              <span className="font-display text-2xl font-bold text-warm-black">
                Rp {totalAmount.toLocaleString('id-ID')}
              </span>
            </div>

            {/* Outcome-Based CTA button (Flat color, no gradient) */}
            <button
              type="button"
              onClick={handlePay}
              disabled={isProcessing}
              className="w-full py-3 px-4 rounded-md bg-forest hover:bg-forest-hover text-tebu-50 font-semibold text-xs tracking-tight transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{isProcessing ? 'Menghubungkan gateway Midtrans...' : `Konfirmasi & bayar paket ${durationDays} hari`}</span>
            </button>

            <p className="text-[11px] text-center text-warm-muted">
              Data pembayaran dienkripsi dengan standar TLS 1.3 dan tokenisasi Midtrans.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-xs text-warm-muted">
        Memuat data formulir pembayaran...
      </div>
    }>
      <CheckoutForm />
    </Suspense>
  );
}
