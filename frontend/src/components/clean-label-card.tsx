'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { ShieldCheck, MapPin, FileText, QrCode, ExternalLink, Check, Copy } from 'lucide-react';
import { CustomDropdown } from './custom-dropdown';
import { recipesApi } from '@/lib/api-client';
import { exportMealCertificatePdf } from '@/lib/pdf-certificate';

interface CleanLabelItem {
  id: string;
  sku: string;
  qrCode: string;
  isActive: boolean;
  batchCode: string;
  ticketNumber: string;
  shortTitle: string;
  title: string;
  category: string;
  labName: string;
  labNameShort: string;
  labCertNumber: string;
  labNotes: string;
  imageUrl: string;
  imageCaption: string;
  grammage: Array<{ label: string; weight: string }>;
  farms: Array<{
    name: string;
    harvestDate: string;
    location: string;
    certifications: string;
  }>;
  rawMeal?: any;
}

function mapVerifiedMealToItem(meal: any): CleanLabelItem {
  return {
    id: meal.id,
    sku: meal.skuCode,
    qrCode: meal.qrCode,
    isActive: meal.isActive !== false,
    batchCode: meal.batchCode,
    ticketNumber: meal.ticketNumber,
    shortTitle: meal.shortTitle,
    title: meal.recipeTitle,
    category: meal.category,
    labName: meal.labCertification?.laboratory || 'PT Saraswanti Indo Genetech (SIG Laboratory)',
    labNameShort: meal.labCertification?.laboratory?.includes('SIG') ? 'SIG Lab' : 'Sucofindo',
    labCertNumber: meal.labCertification?.certificateNumber || 'SIG-LAB/2026/08942-ND',
    labNotes: meal.labCertification?.status || '',
    imageUrl: meal.imageUrl,
    imageCaption: meal.imageCaption,
    grammage: meal.grammage || [],
    farms: (meal.ingredientsSourcing || []).map((s: any) => ({
      name: s.name,
      harvestDate: s.harvestMethod,
      location: s.origin,
      certifications: Array.isArray(s.certifications) ? s.certifications.join(', ') : '',
    })),
    rawMeal: meal,
  };
}

interface CleanLabelProps {
  initialSku?: string;
}

export default function CleanLabelCard({ initialSku }: CleanLabelProps) {
  const [items, setItems] = useState<CleanLabelItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const shouldReduceMotion = useReducedMotion();

  const fetchCleanLabel = useCallback(() => {
    setLoading(true);
    setFetchError(null);
    recipesApi
      .getCleanLabel()
      .then((res) => {
        if (Array.isArray(res.data) && res.data.length > 0) {
          const mapped = res.data.map(mapVerifiedMealToItem);
          setItems(mapped);
          if (initialSku) {
            const idx = mapped.findIndex((m) => m.sku === initialSku);
            if (idx >= 0) setSelectedIndex(idx);
          }
        } else {
          setItems([]);
        }
      })
      .catch((err) => {
        console.error('Gagal memuat data Clean Label dari backend:', err);
        setFetchError('Tidak dapat terhubung ke repositori sertifikasi lab dapur sentral.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [initialSku]);

  useEffect(() => {
    fetchCleanLabel();
  }, [fetchCleanLabel]);

  const activeItem = items[selectedIndex] || items[0] || null;

  // Urutan tampil: kartu aktif selalu paling atas tanpa animasi geser.
  const orderedItems = useMemo(() => {
    if (!activeItem) return items;
    return [activeItem, ...items.filter((item) => item.id !== activeItem.id)];
  }, [items, activeItem]);

  const handleCopyCode = async () => {
    if (!activeItem) return;
    const code = activeItem.qrCode;
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      const area = document.createElement('textarea');
      area.value = code;
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      document.body.removeChild(area);
    }
    setIsCopied(true);
    window.setTimeout(() => setIsCopied(false), 2000);
  };

  useEffect(() => {
    setIsCopied(false);
  }, [selectedIndex]);

  return (
    <section
      id="transparansi"
      className="py-12 border-t border-warm-border"
    >
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        {/* Master-Detail Split Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Column (5 cols): Context, Guidelines & Vertical Meal Directory */}
          <div className="lg:col-span-5 flex flex-col h-full min-h-0">
            <div className="space-y-2 shrink-0 mb-4 sm:mb-5">
              <p className="eyebrow text-forest">Transparansi rantai pasok</p>
              <h2 className="font-display text-2xl md:text-3xl text-warm-black text-balance">
                Tiket verifikasi bahan pangan dan hasil uji laboratorium.
              </h2>
              <p className="text-xs sm:text-sm text-warm-muted text-pretty">
                Setiap boks katering NutriDaily disertai tiket fisik dengan kode QR unik. Pilih sajian di bawah ini untuk memeriksa sertifikat keaslian panen, gramatur presisi, dan uji laboratorium independen:
              </p>
            </div>

            {loading && !activeItem ? (
              <div className="space-y-3 py-2 flex-1">
                <div className="h-10 bg-tebu-200/60 rounded-[12px] animate-pulse" />
                <div className="h-16 bg-tebu-200/60 rounded-[12px] animate-pulse" />
                <div className="h-16 bg-tebu-200/60 rounded-[12px] animate-pulse" />
                <div className="h-16 bg-tebu-200/60 rounded-[12px] animate-pulse" />
              </div>
            ) : !activeItem ? (
              <div className="p-6 rounded-[12px] bg-warm-surface border border-warm-border text-center space-y-3 my-auto shadow-natural-sm">
                <p className="text-xs text-warm-muted">
                  {fetchError || 'Katalog verifikasi Clean Label sedang disiapkan dari dapur sentral.'}
                </p>
                <button
                  type="button"
                  onClick={fetchCleanLabel}
                  className="px-4 py-2 rounded-md bg-forest hover:bg-forest-hover text-tebu-50 text-xs font-semibold transition-colors inline-flex items-center gap-1.5 shadow-natural"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
                  <span>Muat ulang verifikasi</span>
                </button>
              </div>
            ) : (
              <>
                {/* Mobile View Only: Custom Dropdown Picker */}
                <div className="lg:hidden shrink-0 mb-4">
                  <CustomDropdown<number>
                    id="meal-select-mobile"
                    label="Pilih sajian menu untuk diverifikasi:"
                    value={selectedIndex}
                    onChange={(newVal) => setSelectedIndex(newVal)}
                    searchable
                    searchPlaceholder="Cari SKU, nama, atau kategori..."
                    size="lg"
                    options={items.map((item, idx) => ({
                      value: idx,
                      label: item.title,
                      description: `${item.sku} • ${item.category}`,
                      badge: item.labNameShort,
                      keywords: `${item.sku} ${item.shortTitle} ${item.category} ${item.qrCode} ${item.labName}`,
                      icon: (
                        <Image
                          src={item.imageUrl}
                          alt=""
                          aria-hidden="true"
                          width={80}
                          height={80}
                          sizes="80px"
                          quality={60}
                          loading="lazy"
                          className="h-10 w-10 shrink-0 rounded-[8px] border border-warm-border/60 bg-tebu-200 object-cover"
                        />
                      ),
                    }))}
                  />
                </div>

                {/* Desktop View Only: Vertical Master Directory List */}
                <div className="hidden lg:flex flex-col flex-1 min-h-0 space-y-2">
                  <div className="flex items-center justify-between text-xs pb-1 shrink-0">
                    <span className="font-semibold text-warm-black">Daftar boks katering teruji:</span>
                    <span className="font-mono text-[11px] text-warm-stone">{items.length} menu</span>
                  </div>

                  <div
                    className="space-y-2 max-h-[710px] overflow-y-auto pr-1.5 custom-pill-scrollbar"
                  >
                    {orderedItems.map((item) => {
                      const isSelected = activeItem?.id === item.id;

                      return (
                        <motion.button
                          key={item.id}
                          layout={!shouldReduceMotion}
                          initial={shouldReduceMotion ? false : { opacity: 0, y: 28 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: shouldReduceMotion ? 0 : 0.38, ease: [0.16, 1, 0.3, 1] }}
                          type="button"
                          onClick={() => {
                            const originalIdx = items.findIndex((entry) => entry.id === item.id);
                            if (originalIdx >= 0) setSelectedIndex(originalIdx);
                          }}
                          className={`w-full p-3 rounded-[12px] border text-left flex items-center gap-3 cursor-pointer transition-colors duration-300 ${
                            isSelected
                              ? 'sticky top-0 z-10 bg-forest text-tebu-50 border-forest shadow-natural'
                              : 'bg-warm-surface text-warm-black border-warm-border hover:bg-tebu-100/70 hover:border-warm-neutral'
                          }`}
                        >
                          <div className="w-12 h-12 rounded-[8px] overflow-hidden border border-warm-border/60 shrink-0 bg-tebu-200">
                            <Image
                              src={item.imageUrl}
                              alt={item.shortTitle}
                              width={96}
                              height={96}
                              sizes="96px"
                              quality={60}
                              loading="lazy"
                              className="h-full w-full object-cover"
                            />
                          </div>

                          <div className="min-w-0 flex-1 space-y-0.5">
                            <div className="flex items-center gap-1.5 text-[10px]">
                              <span className={`font-mono ${isSelected ? 'text-tebu-200' : 'text-warm-stone'}`}>
                                {item.sku}
                              </span>
                              <span>•</span>
                              <span className={`font-semibold ${isSelected ? 'text-tebu-100' : 'text-forest'}`}>
                                {item.labNameShort}
                              </span>
                            </div>

                            <h3 className="text-xs sm:text-sm font-semibold truncate leading-tight">
                              {item.title}
                            </h3>

                            <p className={`text-[11px] ${isSelected ? 'text-tebu-200' : 'text-warm-muted'}`}>
                              {item.category} • {item.grammage[0]?.weight || 'Porsi standar'}
                            </p>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

          {/* Clean Label Physical Guarantee Card at Bottom */}
          <div className="hidden lg:block mt-auto pt-3 shrink-0">
            <div className="p-4 rounded-xl bg-warm-surface border border-warm-border space-y-2.5 shadow-natural">
              <div className="flex items-center gap-2 text-forest">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span className="text-xs font-semibold text-warm-black">Standar audit Clean Label NutriDaily</span>
              </div>
              <p className="text-[11px] text-warm-muted leading-relaxed text-pretty">
                Seluruh bahan baku dipasok oleh petani mitra terverifikasi tanpa perantara. Hasil uji mikrobiologi dan residu kimia diperbarui setiap siklus panen mingguan.
              </p>
              <div className="pt-2 border-t border-warm-border/70 flex items-center justify-between text-[10px] text-warm-stone font-mono">
                <span>Akreditasi KAN LP-001-IDN</span>
                <span>100% Bebas formalin</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (7 cols): Tactile Physical Receipt/Ticket Container */}
        <div className="lg:col-span-7 flex flex-col h-full">
          {loading && !activeItem ? (
            <div className="p-8 bg-warm-surface border border-warm-border rounded-[18px] animate-pulse space-y-5 h-[520px]">
              <div className="h-5 bg-tebu-200/70 rounded w-1/3" />
              <div className="h-36 bg-tebu-100 rounded w-full" />
              <div className="space-y-2">
                <div className="h-4 bg-tebu-200/70 rounded w-3/4" />
                <div className="h-4 bg-tebu-100 rounded w-1/2" />
              </div>
            </div>
          ) : !activeItem ? (
            <div className="p-8 bg-warm-surface border border-warm-border rounded-[18px] text-center flex flex-col items-center justify-center h-full min-h-[360px] space-y-3 shadow-natural-sm">
              <ShieldCheck className="w-10 h-10 text-forest/40" />
              <h3 className="font-display text-base font-semibold text-warm-black">
                Verifikasi boks katering siap diperiksa
              </h3>
              <p className="text-xs text-warm-muted max-w-sm">
                Tekan tombol muat ulang untuk mengambil sertifikat uji laboratorium SIG Lab dan Sucofindo.
              </p>
            </div>
          ) : (
            <div className="bg-warm-surface border border-warm-border rounded-[18px] grain-overlay-light p-4 sm:p-6 md:p-7 shadow-natural-md relative h-full flex flex-col justify-between overflow-hidden">
              {/* Konten tiket dengan animasi transisi mulus */}
              <div
                key={activeItem.id}
                className="animate-card-fade flex-1 flex flex-col justify-between"
              >
                {/* Ticket Header & Batch Identifier */}
              <div className="border-b border-dashed border-warm-border pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="space-y-1">
                  <span className="eyebrow text-warm-stone">{activeItem.ticketNumber}</span>
                  <h3 className="font-display font-semibold text-lg text-warm-black leading-snug">
                    {activeItem.title}
                  </h3>
                  <p className="text-xs text-warm-muted font-mono">
                    SKU: {activeItem.sku} • Batch olah: {activeItem.batchCode}
                  </p>
                </div>

                {/* Verification Stamp Badge (Flat, No Gradient, No Outline/BG) */}
                <div className="text-forest text-[11px] font-semibold flex items-center gap-1.5 shrink-0">
                  <ShieldCheck className="w-4 h-4 text-forest" />
                  <span>{activeItem.labNameShort} Terverifikasi</span>
                </div>
                {!activeItem.isActive && (
                  <div className="border border-warm-border text-warm-muted bg-warm-surface px-3 py-1.5 rounded text-[11px] font-semibold shrink-0">
                    <span>Nonaktif katalog</span>
                  </div>
                )}
              </div>

              {/* Photo of Actual Meal Box Packaging */}
              <div className="py-3 border-b border-dashed border-warm-border">
                <div className="relative aspect-[16/9] w-full overflow-hidden rounded-md border border-warm-border/80 bg-tebu-200">
                  <Image
                    src={activeItem.imageUrl}
                    alt={activeItem.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 640px, 640px"
                    quality={70}
                    loading="lazy"
                    className="object-cover"
                  />
                  <div className="absolute bottom-2 left-2 rounded bg-warm-black/85 backdrop-blur-sm px-2.5 py-1 text-[10px] text-tebu-50">
                    {activeItem.imageCaption}
                  </div>
                </div>
              </div>

              {/* Precision Grammage Table */}
              <div className="py-4 border-b border-dashed border-warm-border space-y-2.5">
                <div className="flex justify-between items-center text-xs font-semibold text-warm-black">
                  <span>Rincian gramatur penimbangan</span>
                  <span className="font-mono text-warm-stone">Toleransi &plusmn; 4.2 gram</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  {activeItem.grammage.map((g, idx) => (
                    <div key={idx} className="p-2.5 bg-tebu-50 border border-warm-border rounded">
                      <span className="text-[10px] text-warm-stone block">{g.label}</span>
                      <span className="font-mono font-semibold text-warm-black">{g.weight}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Local Farm Partner Sourcing Details */}
              <div className="py-4 border-b border-dashed border-warm-border space-y-3">
                <h4 className="text-xs font-semibold text-warm-black uppercase tracking-wider">
                  Asal usul bahan dari petani mitra
                </h4>

                <div className="space-y-2.5 text-xs">
                  {activeItem.farms.map((f, idx) => (
                    <div key={idx} className="p-3 bg-tebu-50 border border-warm-border rounded-md space-y-1">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-1 sm:gap-2">
                        <strong className="text-warm-black break-words">{f.name}</strong>
                        <span className="text-[11px] font-mono text-warm-stone shrink-0">{f.harvestDate}</span>
                      </div>
                      <p className="text-warm-muted flex items-start gap-1.5 leading-relaxed break-words">
                        <MapPin className="w-3.5 h-3.5 text-forest shrink-0 mt-0.5" />
                        <span>{f.location} {f.certifications}</span>
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Third-Party Laboratory Certification */}
              <div className="py-4 border-b border-dashed border-warm-border space-y-2.5">
                <h4 className="text-xs font-semibold text-warm-black uppercase tracking-wider">
                  Uji laboratorium independen
                </h4>
                <div className="p-3 bg-forest-subtle border border-forest-border text-forest text-xs rounded-md space-y-1.5">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2">
                    <span className="font-semibold break-words">{activeItem.labName}</span>
                    <span className="font-mono text-[11px] shrink-0 break-all">{activeItem.labCertNumber}</span>
                  </div>
                  <p className="text-[11px] text-forest/90 leading-relaxed break-words">
                    {activeItem.labNotes}
                  </p>
                </div>
              </div>

              {/* Ticket Footer: QR Verification & Outcome-Based CTAs */}
              <div className="pt-4 mt-auto border-t border-warm-border/80 flex flex-col md:flex-row md:items-center justify-between gap-3.5">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 bg-tebu-50 border border-warm-border rounded-lg flex items-center justify-center text-forest shrink-0 shadow-natural-sm">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handleCopyCode}
                        title="Klik kode untuk menyalin"
                        aria-label={`Salin kode verifikasi ${activeItem.qrCode}`}
                        aria-live="polite"
                        className={`inline-flex items-center gap-1.5 font-mono text-xs font-semibold tracking-wide px-0 py-0.5 select-all transition-colors cursor-pointer whitespace-nowrap ${
                          isCopied ? 'text-forest' : 'text-warm-black hover:text-forest'
                        }`}
                      >
                        <span className="whitespace-nowrap">{activeItem.qrCode}</span>
                        {isCopied ? (
                          <Check className="w-3 h-3 stroke-[2.5] shrink-0" aria-hidden="true" />
                        ) : (
                          <Copy className="w-3 h-3 text-warm-stone shrink-0" aria-hidden="true" />
                        )}
                        {isCopied && (
                          <span className="font-sans text-[11px] font-medium whitespace-nowrap">Tersalin</span>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => {
                      exportMealCertificatePdf(activeItem.rawMeal || activeItem);
                    }}
                    className="flex-1 sm:flex-none px-3.5 py-2.5 rounded-md bg-warm-surface border border-warm-border hover:bg-tebu-100 text-warm-black text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-natural-sm cursor-pointer min-h-[44px]"
                    title="Unduh sertifikat hasil uji laboratorium resmi (PDF)"
                  >
                    <FileText className="w-3.5 h-3.5 text-forest" />
                    <span>Unduh hasil lab</span>
                  </button>

                  <Link
                    href={`/verify/${activeItem.qrCode}`}
                    className="flex-1 sm:flex-none px-3.5 py-2.5 rounded-md bg-forest hover:bg-forest-hover text-tebu-50 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-natural cursor-pointer min-h-[44px]"
                  >
                    <span>Halaman publik</span>
                    <ExternalLink className="w-3.5 h-3.5 text-tebu-50" />
                  </Link>
                </div>
              </div>
            </div>
            </div>
          )}
        </div>
        </div>
      </div>
    </section>
  );
}
