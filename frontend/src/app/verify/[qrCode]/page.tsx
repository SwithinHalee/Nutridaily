'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldCheck,
  Award,
  Check,
  MapPin,
  Calendar,
  ChefHat,
  FileText,
  Scale,
  Leaf,
  QrCode,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import { CustomDropdown } from '@/components/custom-dropdown';
import { recipesApi } from '@/lib/api-client';
import { VerifiedMealItem } from '@/data/clean-label-data';
import { exportMealCertificatePdf } from '@/lib/pdf-certificate';

export default function CleanLabelVerificationPage({
  initialCode,
}: {
  initialCode?: string;
}) {
  const params = useParams();
  const router = useRouter();

  const activeCode = (params?.qrCode as string) || initialCode || 'ND-VERIFY-SALMON-2026';
  const [meals, setMeals] = useState<VerifiedMealItem[]>([]);
  const [selectedMeal, setSelectedMeal] = useState<VerifiedMealItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;
    recipesApi
      .getCleanLabel()
      .then((res) => {
        if (!mounted) return;
        if (Array.isArray(res.data) && res.data.length > 0) {
          setMeals(res.data);
          const found =
            res.data.find(
              (m: any) =>
                m.qrCode.toLowerCase() === activeCode.toLowerCase() ||
                m.skuCode.toLowerCase() === activeCode.toLowerCase()
            ) || res.data[0];
          setSelectedMeal(found);
        }
      })
      .catch((err) => {
        console.error('Gagal memuat verifikasi boks dari backend:', err);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [activeCode]);

  const handleSelectMeal = (qrCode: string) => {
    const meal = meals.find((m) => m.qrCode === qrCode);
    if (meal) {
      setSelectedMeal(meal);
      if (typeof window !== 'undefined') {
        window.history.replaceState(null, '', `/verify/${meal.qrCode}`);
      }
    }
  };

  const handleCopyLink = () => {
    if (!selectedMeal) return;
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/verify/${selectedMeal.qrCode}`;
      navigator.clipboard.writeText(url);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleDownloadPdf = () => {
    if (!selectedMeal) return;
    exportMealCertificatePdf(selectedMeal);
  };

  if (loading && !selectedMeal) {
    return (
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-16 space-y-6">
        <div className="p-8 bg-warm-surface border border-warm-border rounded-[18px] animate-pulse space-y-4">
          <div className="h-4 bg-tebu-200 rounded w-1/4" />
          <div className="h-8 bg-tebu-200 rounded w-3/4" />
          <div className="h-48 bg-tebu-100 rounded w-full" />
        </div>
      </div>
    );
  }

  if (!selectedMeal) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-10 space-y-6">
      {/* Back Link */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-warm-muted hover:text-warm-black transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke beranda
        </Link>
      </div>

      {/* Meal Switcher Selector (Allows switching across all verified meals) */}
      <div className="bg-warm-surface border border-warm-border rounded-[18px] p-4 grain-overlay-light shadow-natural space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <label
            htmlFor="verify-meal-select"
            className="text-xs font-semibold text-warm-black flex items-center gap-1.5"
          >
            <QrCode className="w-3.5 h-3.5 text-forest" />
            <span>Pilih sajian menu untuk diverifikasi:</span>
          </label>
          <span className="text-[11px] font-mono text-warm-stone">
            {meals.length} menu tersertifikasi
          </span>
        </div>
        <CustomDropdown<string>
          id="verify-meal-select"
          value={selectedMeal.qrCode}
          onChange={handleSelectMeal}
          options={meals.map((m) => ({
            value: m.qrCode,
            label: m.recipeTitle,
            description: `${m.skuCode} • ${m.category}`,
            badge: m.labCertification.laboratory.includes('SIG') ? 'SIG Lab' : 'Sucofindo',
          }))}
          variant="surface"
        />
      </div>

      {/* Top Banner (Flat Forest Green with Film Grain Overlay, No Gradient) */}
      <div className="bg-forest text-tebu-50 rounded-[18px] p-6 md:p-8 grain-overlay-panel space-y-4 shadow-natural">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-forest-border pb-3">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-forest-active text-tebu-300 text-[11px] font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-tebu-200" />
            <span>Label bersih terverifikasi</span>
          </div>
          <span className="text-xs text-tebu-300 font-mono">Kode QR: {selectedMeal.qrCode}</span>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-[12px] overflow-hidden border border-forest-border shrink-0 bg-forest-active">
            <img
              src={selectedMeal.imageUrl}
              alt={selectedMeal.shortTitle}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="space-y-1 min-w-0">
            <h1 className="font-display text-xl md:text-2xl text-tebu-50 leading-tight">
              {selectedMeal.recipeTitle}
            </h1>
            <p className="text-xs text-tebu-200">
              SKU: {selectedMeal.skuCode} • Kategori: {selectedMeal.category} • Bobot bersih: {selectedMeal.portionWeightGrams} gram (&plusmn; {selectedMeal.toleranceGrams}g)
            </p>
          </div>
        </div>

        <div className="pt-2 flex items-center gap-2 text-xs text-tebu-300 border-t border-forest-border/60">
          <Calendar className="w-3.5 h-3.5 text-tebu-300" />
          <span>Waktu kemas dapur: {selectedMeal.packagingTimestamp}</span>
        </div>
      </div>

      {/* Independent Laboratory Certification Card */}
      <div className="bg-warm-surface border border-warm-border rounded-[18px] p-6 grain-overlay-light space-y-4 shadow-natural">
        <div className="flex items-start gap-3.5 pb-4 border-b border-dashed border-warm-border">
          <div className="p-2.5 bg-forest-subtle border border-forest-border rounded-md text-forest shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h2 className="font-display font-semibold text-base text-warm-black">
                Hasil sertifikasi laboratorium independen
              </h2>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-forest text-tebu-50">
                Lulus uji
              </span>
            </div>
            <p className="text-xs font-medium text-warm-black">{selectedMeal.labCertification.laboratory}</p>
            <p className="text-[11px] font-mono text-warm-muted">
              Nomor sertifikat: {selectedMeal.labCertification.certificateNumber} (Diuji tanggal {selectedMeal.labCertification.testDate})
            </p>
          </div>
        </div>

        <div className="space-y-2 text-xs">
          <div className="p-3 bg-tebu-50 border border-warm-border rounded-md space-y-1">
            <div className="flex items-center gap-1.5 text-forest font-semibold text-xs">
              <Check className="w-4 h-4 shrink-0" />
              <span>{selectedMeal.labCertification.status}</span>
            </div>
            <p className="text-[11px] text-warm-muted leading-relaxed pl-5">
              {selectedMeal.labCertification.microbiology}. Tingkat kesesuaian nilai gizi: {selectedMeal.labCertification.accuracyRating}.
            </p>
          </div>
        </div>
      </div>

      {/* Precision Nutrition Facts */}
      <div className="bg-warm-surface border border-warm-border rounded-[18px] p-6 grain-overlay-light space-y-4 shadow-natural">
        <h2 className="font-display font-semibold text-base text-warm-black">
          Kandungan gizi presisi per porsi makan
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
          <div className="p-3 bg-tebu-50 rounded-md border border-warm-border">
            <span className="text-[11px] text-warm-stone block">Total energi</span>
            <p className="font-display font-bold text-lg text-warm-black">{selectedMeal.nutritionFacts.calories} kkal</p>
          </div>
          <div className="p-3 bg-tebu-50 rounded-md border border-warm-border">
            <span className="text-[11px] text-warm-stone block">Protein bersih</span>
            <p className="font-display font-bold text-lg text-warm-black">{selectedMeal.nutritionFacts.proteinGrams}g</p>
          </div>
          <div className="p-3 bg-tebu-50 rounded-md border border-warm-border">
            <span className="text-[11px] text-warm-stone block">Karbohidrat</span>
            <p className="font-display font-bold text-lg text-warm-black">{selectedMeal.nutritionFacts.carbsGrams}g</p>
          </div>
          <div className="p-3 bg-tebu-50 rounded-md border border-warm-border">
            <span className="text-[11px] text-warm-stone block">Lemak baik</span>
            <p className="font-display font-bold text-lg text-warm-black">{selectedMeal.nutritionFacts.fatGrams}g</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-1 text-center text-xs text-warm-muted border-t border-dashed border-warm-border">
          <div className="p-2 bg-tebu-50 rounded">Serat pangan: <strong className="text-warm-black font-semibold">{selectedMeal.nutritionFacts.fiberGrams}g</strong></div>
          <div className="p-2 bg-tebu-50 rounded">Natrium: <strong className="text-warm-black font-semibold">{selectedMeal.nutritionFacts.sodiumMg}mg</strong></div>
          <div className="p-2 bg-tebu-50 rounded">Indeks glikemik: <strong className="text-warm-black font-semibold">&lt; {selectedMeal.nutritionFacts.glycemicIndex} (Rendah)</strong></div>
        </div>
      </div>

      {/* Component Grammage Breakdown */}
      <div className="bg-warm-surface border border-warm-border rounded-[18px] p-6 grain-overlay-light space-y-3 shadow-natural">
        <div className="flex items-center gap-2">
          <Scale className="w-4 h-4 text-forest shrink-0" />
          <h2 className="font-display font-semibold text-base text-warm-black">
            Rincian gramatur komponen boks
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {selectedMeal.grammage.map((g, idx) => (
            <div key={idx} className="p-2.5 bg-tebu-50 rounded-md border border-warm-border text-center">
              <span className="text-[11px] text-warm-stone block truncate">{g.label}</span>
              <strong className="text-xs font-semibold text-warm-black">{g.weight}</strong>
            </div>
          ))}
        </div>
      </div>

      {/* Farm Origin Transparency */}
      <div className="bg-warm-surface border border-warm-border rounded-[18px] p-6 grain-overlay-light space-y-4 shadow-natural">
        <h2 className="font-display font-semibold text-base text-warm-black">
          Asal usul bahan dari petani mitra lokal
        </h2>

        <div className="space-y-3">
          {selectedMeal.ingredientsSourcing.map((item, idx) => (
            <div key={idx} className="p-3.5 bg-tebu-50 rounded-md border border-warm-border space-y-1">
              <div className="flex flex-wrap items-center justify-between gap-1">
                <h3 className="font-semibold text-xs text-warm-black">{item.name}</h3>
                <div className="flex flex-wrap gap-1">
                  {item.certifications.map((c, i) => (
                    <span key={i} className="text-[10px] bg-warm-surface text-warm-neutral font-medium px-1.5 py-0.5 rounded border border-warm-border">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
              <p className="text-xs text-warm-muted flex items-center gap-1.5 pt-0.5">
                <MapPin className="w-3.5 h-3.5 text-forest shrink-0" />
                <span>Asal: <strong className="text-warm-black font-medium">{item.origin}</strong></span>
              </p>
              <p className="text-[11px] text-warm-muted pl-5">{item.harvestMethod}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Chef Preparation Notes & Allergens */}
      <div className="bg-warm-surface border border-warm-border rounded-[18px] p-5 space-y-3 text-xs">
        <div className="flex items-start gap-2.5">
          <ChefHat className="w-4 h-4 text-forest shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="font-semibold text-warm-black">Catatan koki eksekutif</h3>
            <p className="text-warm-muted leading-relaxed">{selectedMeal.chefNotes}</p>
          </div>
        </div>

        <div className="pt-2 border-t border-dashed border-warm-border text-warm-muted flex flex-wrap items-center gap-2">
          <span className="font-semibold text-warm-black">Peringatan alergen:</span>
          <span>{selectedMeal.allergenWarning.join(', ')}.</span>
        </div>
      </div>

      {/* Outcome-Based Action Footer */}
      <div className="pt-2 flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={handleCopyLink}
          className="flex-1 py-3 px-4 rounded-md bg-warm-surface border border-warm-border hover:bg-tebu-100 text-warm-black text-xs font-semibold transition-colors text-center"
        >
          {isCopied ? 'Tautan verifikasi tersalin' : 'Salin tautan verifikasi ini'}
        </button>
        <button
          type="button"
          onClick={handleDownloadPdf}
          className="flex-1 py-3 px-4 rounded-md bg-forest hover:bg-forest-hover text-tebu-50 text-xs font-semibold transition-colors flex items-center justify-center gap-2"
        >
          <FileText className="w-4 h-4" />
          <span>Unduh sertifikat lab resmi (PDF)</span>
        </button>
      </div>
    </div>
  );
}
