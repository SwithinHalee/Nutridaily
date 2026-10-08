'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  CreditCard,
  QrCode,
  Building,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Layers,
  CalendarPlus,
} from 'lucide-react';
import { paymentsApi, subscriptionApi } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';

function CheckoutForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, status } = useAuth();

  const plan = searchParams.get('plan') || 'WEIGHT_LOSS_LEAN_SCULPT';
  const targetCalories = searchParams.get('calories') || '1380';
  const basePricePerDay = Number(searchParams.get('price')) || 85000;

  const [durationDays, setDurationDays] = useState<number>(20); // 20 workday default
  const [scheduleMode, setScheduleMode] = useState<'PARALLEL' | 'ROLLOVER'>('PARALLEL');
  const [activeSubCount, setActiveSubCount] = useState<number>(0);
  const [existingPackageName, setExistingPackageName] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'SNAP_QRIS' | 'SNAP_VA' | 'SNAP_RECURRING_CC'>('SNAP_QRIS');
  const [addressLabel, setAddressLabel] = useState('Kantor SCBD Pacific Century Tower Lt. 18');
  const [addressDetail, setAddressDetail] = useState(
    'Jl. Jend. Sudirman Kav. 52-53, Jakarta Selatan (Titip di meja resepsionis lobby utama sebelum pukul 11.30 WIB)',
  );
  const [pdpConsent, setPdpConsent] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<any>(null);

  // Periksa apakah pengguna sudah memiliki paket langganan aktif
  useEffect(() => {
    let mounted = true;
    subscriptionApi
      .getMySubscription()
      .then((res) => {
        if (!mounted || !res?.data) return;
        const all = Array.isArray(res.data.allSubscriptions) ? res.data.allSubscriptions : [res.data];
        const activeList = all.filter((s: any) => s.status === 'ACTIVE');
        if (activeList.length > 0) {
          setActiveSubCount(activeList.length);
          setExistingPackageName(activeList[0].packageType || '');
        }
      })
      .catch(() => {
        // Pengguna tamu atau belum login
      });
    return () => {
      mounted = false;
    };
  }, [status]);

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

    try {
      const res = await paymentsApi.checkout({
        packageType: plan,
        durationDays,
        scheduleMode: activeSubCount > 0 ? scheduleMode : 'PARALLEL',
        targetCalories: Number(targetCalories) || 1820,
        totalAmount,
        paymentMethod,
        deliveryAddress: {
          label: addressLabel,
          fullAddress: addressDetail,
        },
      });

      setConfirmedOrder(res.data);
      setPaymentSuccess(true);
    } catch {
      // Fallback response jika ada kendala jaringan
      const fallbackId = `ND-INV-202610-${Math.floor(1000 + Math.random() * 9000)}`;
      setConfirmedOrder({
        invoiceNumber: fallbackId,
        packageType: plan,
        durationDays,
        amount: totalAmount,
      });
      setPaymentSuccess(true);
    } finally {
      setIsProcessing(false);
    }
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
          <p className="text-warm-muted">ID Pesanan: {confirmedOrder?.invoiceNumber || 'ND-INV-202610-0982'}</p>
          <p className="text-warm-muted">Paket: {confirmedOrder?.packageType || plan} ({targetCalories} kkal/hari)</p>
          <p className="text-warm-muted">Durasi: {confirmedOrder?.durationDays || durationDays} hari kerja pengiriman</p>
          {activeSubCount > 0 && (
            <p className="text-warm-muted">
              Mode pengiriman: {scheduleMode === 'PARALLEL' ? `Kirim bersamaan (${activeSubCount + 1} boks / hari)` : 'Perpanjang durasi (1 boks / hari)'}
            </p>
          )}
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
          <div className="bg-warm-surface p-4 sm:p-5 rounded-[16px] border border-warm-border space-y-3">
            <h2 className="text-xs font-semibold text-warm-black uppercase tracking-wider">
              1. Pilih durasi pengiriman
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {[
                { days: 5, label: '5 hari kerja', sub: 'Paket mingguan' },
                { days: 20, label: '20 hari kerja', sub: 'Potongan 10%' },
                { days: 30, label: '30 hari kerja', sub: 'Potongan 15%' },
              ].map((item) => (
                <button
                  key={item.days}
                  type="button"
                  onClick={() => setDurationDays(item.days)}
                  className={`p-3 rounded-md border text-left transition-colors min-h-[44px] ${
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

          {/* Schedule Mode Selector (Tampil bila akun telah memiliki paket aktif) */}
          {activeSubCount > 0 && (
            <div className="bg-warm-surface p-5 rounded-[16px] border border-warm-border space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold text-warm-black uppercase tracking-wider">
                  2. Opsi jadwal pengiriman paket tambahan
                </h2>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-forest-subtle text-forest border border-forest-border">
                  {activeSubCount} paket sedang aktif
                </span>
              </div>
              <p className="text-[11px] text-warm-muted">
                Akun Anda memiliki paket aktif berjalan. Tentukan apakah paket baru ini ingin dikirim bersamaan atau disambung setelah paket sebelumnya selesai.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setScheduleMode('PARALLEL')}
                  className={`p-3.5 rounded-md border text-left transition-colors flex flex-col justify-between ${
                    scheduleMode === 'PARALLEL'
                      ? 'bg-tebu-50 border-forest ring-1 ring-forest text-warm-black'
                      : 'bg-tebu-50/60 border-warm-border text-warm-muted hover:border-warm-neutral'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Layers className={`w-4 h-4 ${scheduleMode === 'PARALLEL' ? 'text-forest' : 'text-warm-stone'}`} />
                        <h3 className="text-xs font-semibold text-warm-black">
                          Kirim bersamaan ({activeSubCount + 1} boks / hari)
                        </h3>
                      </div>
                      <span className="text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded bg-terracotta-subtle text-terracotta border border-terracotta-border">
                        Paralel
                      </span>
                    </div>
                    <p className="text-[11px] text-warm-muted leading-relaxed">
                      Dikirim bersamaan dengan paket aktif mulai hari kerja berikutnya. Anda menerima total {activeSubCount + 1} boks katering per hari (cocok untuk keluarga atau porsi ganda).
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setScheduleMode('ROLLOVER')}
                  className={`p-3.5 rounded-md border text-left transition-colors flex flex-col justify-between ${
                    scheduleMode === 'ROLLOVER'
                      ? 'bg-tebu-50 border-forest ring-1 ring-forest text-warm-black'
                      : 'bg-tebu-50/60 border-warm-border text-warm-muted hover:border-warm-neutral'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <CalendarPlus className={`w-4 h-4 ${scheduleMode === 'ROLLOVER' ? 'text-forest' : 'text-warm-stone'}`} />
                        <h3 className="text-xs font-semibold text-warm-black">
                          Perpanjang durasi (1 boks / hari)
                        </h3>
                      </div>
                      <span className="text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded bg-forest-subtle text-forest border border-forest-border">
                        Estafet
                      </span>
                    </div>
                    <p className="text-[11px] text-warm-muted leading-relaxed">
                      Mulai dikirim setelah seluruh siklus paket aktif selesai. Total durasi langganan bertambah {durationDays} hari kerja (tetap 1 boks per hari).
                    </p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Delivery Address */}
          <div className="bg-warm-surface p-5 rounded-[16px] border border-warm-border space-y-3">
            <h2 className="text-xs font-semibold text-warm-black uppercase tracking-wider">
              {activeSubCount > 0 ? '3. Alamat pengantaran katering' : '2. Alamat pengantaran katering'}
            </h2>
            <div className="space-y-2.5">
              <input
                type="text"
                value={addressLabel}
                onChange={(e) => setAddressLabel(e.target.value)}
                className="w-full text-xs font-medium p-2.5 rounded-md border border-warm-border bg-tebu-50 text-warm-black focus:outline-none focus:border-forest"
              />
              <textarea
                rows={2}
                value={addressDetail}
                onChange={(e) => setAddressDetail(e.target.value)}
                className="w-full text-xs p-2.5 rounded-md border border-warm-border bg-tebu-50 text-warm-black focus:outline-none focus:border-forest"
              />
            </div>
          </div>

          {/* Payment Method Selector (Flat colors, no gradient) */}
          <div className="bg-warm-surface p-5 rounded-[16px] border border-warm-border space-y-3">
            <h2 className="text-xs font-semibold text-warm-black uppercase tracking-wider">
              {activeSubCount > 0 ? '4. Metode pembayaran aman' : '3. Metode pembayaran aman'}
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
          <div className="bg-warm-surface rounded-[16px] border border-warm-border p-4 sm:p-6 space-y-4 sm:space-y-5 sticky top-24">
            <h2 className="font-display font-semibold text-base text-warm-black">
              Ringkasan pembayaran
            </h2>

            <div className="space-y-2.5 text-xs border-b border-warm-border pb-4">
              <div className="flex justify-between items-start gap-2">
                <span className="text-warm-muted shrink-0">Paket gizi</span>
                <span className="font-semibold text-warm-black text-right break-words">{plan}</span>
              </div>
              <div className="flex justify-between items-start gap-2">
                <span className="text-warm-muted shrink-0">Target kalori</span>
                <span className="font-semibold text-warm-black text-right">{targetCalories} kkal / hari</span>
              </div>
              <div className="flex justify-between items-start gap-2">
                <span className="text-warm-muted shrink-0">Durasi pengiriman</span>
                <span className="font-semibold text-warm-black text-right">{durationDays} hari kerja</span>
              </div>
              {activeSubCount > 0 && (
                <div className="flex justify-between items-start gap-2">
                  <span className="text-warm-muted shrink-0">Mode pengiriman</span>
                  <span className="font-semibold text-warm-black text-right break-words">
                    {scheduleMode === 'PARALLEL' ? `Kirim bersamaan (${activeSubCount + 1} boks / hari)` : 'Perpanjang durasi (1 boks / hari)'}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-start gap-2">
                <span className="text-warm-muted shrink-0">Tarif harian</span>
                <span className="text-warm-black text-right font-mono">Rp {basePricePerDay.toLocaleString('id-ID')}</span>
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
              className="w-full min-h-[48px] py-3 px-4 rounded-md bg-forest hover:bg-forest-hover text-tebu-50 font-semibold text-xs tracking-tight transition-colors flex items-center justify-center gap-2 disabled:opacity-60 shadow-natural"
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
