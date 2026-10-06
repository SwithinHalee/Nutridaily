'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  Clock,
  AlertCircle,
  Check,
  Pause,
  Play,
  RefreshCw,
  MapPin,
  Calendar,
  ShieldCheck,
  ChevronRight,
  X,
  ExternalLink,
  Lock,
  Loader2,
  Utensils,
  ArrowRight,
} from 'lucide-react';
import { CustomDropdown } from '@/components/custom-dropdown';
import { useAuth } from '@/lib/auth-context';
import { subscriptionApi, recipesApi, ApiError } from '@/lib/api-client';

const InteractivePinMap = dynamic(
  () => import('@/components/interactive-pin-map').then((mod) => mod.InteractivePinMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-56 rounded-lg border border-warm-border bg-tebu-100 flex items-center justify-center text-xs text-warm-muted animate-pulse">
        Memuat peta interaktif...
      </div>
    ),
  }
);

interface UpcomingOrder {
  id: string;
  orderDate: string;
  mealType: 'LUNCH' | 'DINNER';
  recipeId: string;
  recipeTitle: string;
  status: string;
}

interface SubscriptionData {
  id: string;
  userId: string;
  packageType: string;
  durationDays: number;
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'PAUSED' | 'CANCELLED';
  deliveryAddress: {
    id: string;
    label: string;
    fullAddress: string;
  };
  upcomingOrders: UpcomingOrder[];
}

interface CatalogMeal {
  id: string;
  sku: string;
  title: string;
  category: string;
  calories: number;
  proteinG: number;
  carbG: number;
  fatG: number;
  isAvailable: boolean;
}

// Dapur tutup Sabtu dan Minggu. Tanggal pengiriman selalu hari kerja Senin sampai Jumat.
function nextDeliveryDateStr(from: Date = new Date()): string {
  const cursor = new Date(from.getTime() + 86400000);
  while (cursor.getDay() === 0 || cursor.getDay() === 6) {
    cursor.setDate(cursor.getDate() + 1);
  }
  return cursor.toISOString().split('T')[0];
}

export default function SubscriptionControlPage() {
  const { user, status } = useAuth();

  // Subscription state from backend
  const [subData, setSubData] = useState<SubscriptionData | null>(null);
  const [loadingSub, setLoadingSub] = useState<boolean>(true);
  const [subStatus, setSubStatus] = useState<'ACTIVE' | 'PAUSED'>('ACTIVE');
  const [currentAddress, setCurrentAddress] = useState<string>('');
  const [selectedTomorrowMeal, setSelectedTomorrowMeal] = useState<string>('');
  const [tomorrowDate, setTomorrowDate] = useState<string>('');

  // Modals & Feedback
  const [isAddressModalOpen, setIsAddressModalOpen] = useState<boolean>(false);
  const [isSwapModalOpen, setIsSwapModalOpen] = useState<boolean>(false);
  const [isServiceRecoveryOpen, setIsServiceRecoveryOpen] = useState<boolean>(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Catalog meals for swap dropdown
  const [catalogMeals, setCatalogMeals] = useState<CatalogMeal[]>([]);
  const [selectedSwapRecipeId, setSelectedSwapRecipeId] = useState<string>('');

  // Form input alamat baru
  const [addressLabel, setAddressLabel] = useState('Kantor');
  const [addressStreet, setAddressStreet] = useState('');
  const [addressCity, setAddressCity] = useState('Jakarta Selatan');
  const [addressNotes, setAddressNotes] = useState('Titip di resepsionis lobi');

  // Pin Map state (opsional akurasi lokasi)
  const [isPinMapActive, setIsPinMapActive] = useState<boolean>(false);
  const [isSyncingAddress, setIsSyncingAddress] = useState<boolean>(false);
  const [pinnedCoordinates, setPinnedCoordinates] = useState<{ lat: number; lng: number }>({
    lat: -6.2254,
    lng: 106.8091,
  });

  const reverseGeocodeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Helper untuk mencocokkan nama area ke opsi dropdown Jadetabek
  const matchJadetabekCity = (addressObj: any, displayName: string): string | null => {
    const fullText = (
      (addressObj?.city_district || '') + ' ' +
      (addressObj?.city || '') + ' ' +
      (addressObj?.municipality || '') + ' ' +
      (addressObj?.county || '') + ' ' +
      (addressObj?.state || '') + ' ' +
      displayName
    ).toLowerCase();

    if (fullText.includes('selatan') && (fullText.includes('tangerang') || fullText.includes('tangsel'))) return 'Tangerang Selatan';
    if (fullText.includes('tangerang')) return 'Tangerang Kota';
    if (fullText.includes('bekasi')) return 'Bekasi';
    if (fullText.includes('depok')) return 'Depok';
    if (fullText.includes('jakarta selatan')) return 'Jakarta Selatan';
    if (fullText.includes('jakarta pusat')) return 'Jakarta Pusat';
    if (fullText.includes('jakarta barat')) return 'Jakarta Barat';
    if (fullText.includes('jakarta timur')) return 'Jakarta Timur';
    if (fullText.includes('jakarta utara')) return 'Jakarta Utara';
    if (fullText.includes('jakarta')) return 'Jakarta Selatan';
    return null;
  };

  const formatStreetAddress = (addressObj: any, displayName: string): string => {
    if (!addressObj) {
      return displayName.split(',').slice(0, 3).join(',').trim();
    }
    const parts: string[] = [];
    if (addressObj.road) {
      parts.push(addressObj.house_number ? `${addressObj.road} No. ${addressObj.house_number}` : addressObj.road);
    } else if (addressObj.pedestrian || addressObj.highway || addressObj.building) {
      parts.push(addressObj.pedestrian || addressObj.highway || addressObj.building);
    }
    if (addressObj.neighbourhood) parts.push(addressObj.neighbourhood);
    if (addressObj.suburb && addressObj.suburb !== addressObj.city_district) parts.push(addressObj.suburb);
    if (addressObj.city_district) parts.push(addressObj.city_district);

    if (parts.length > 0) {
      return parts.join(', ');
    }
    return displayName.split(',').slice(0, 3).join(',').trim();
  };

  const reverseGeocodeAndUpdateAddress = async (lat: number, lng: number, showToast = true) => {
    setIsSyncingAddress(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`, {
        headers: { 'User-Agent': 'NutriDaily-Client/1.0' },
      });
      const data = await res.json();
      if (data) {
        const matched = matchJadetabekCity(data.address, data.display_name || '');
        if (matched) {
          setAddressCity(matched);
        }
        const street = formatStreetAddress(data.address, data.display_name || '');
        if (street) {
          setAddressStreet(street);
        }
        if (showToast) {
          setFeedbackMessage({
            type: 'success',
            text: `Pin peta dan detail alamat diselaraskan otomatis: ${street} (${matched || 'Jadetabek'}).`,
          });
        }
      }
    } catch {
      // Pin koordinat tetap tersimpan jika jaringan geocode offline
    } finally {
      setIsSyncingAddress(false);
    }
  };

  const handleMapPinChange = (newLat: number, newLng: number) => {
    setPinnedCoordinates({ lat: newLat, lng: newLng });
    if (reverseGeocodeTimeoutRef.current) {
      clearTimeout(reverseGeocodeTimeoutRef.current);
    }
    reverseGeocodeTimeoutRef.current = setTimeout(() => {
      reverseGeocodeAndUpdateAddress(newLat, newLng, true);
    }, 450);
  };

  // Time calculation in WIB (UTC+7)
  const [wibHour, setWibHour] = useState<number>(14);
  const [wibMinute, setWibMinute] = useState<number>(30);
  const [wibSecond, setWibSecond] = useState<number>(0);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const utc = now.getTime() + now.getTimezoneOffset() * 60000;
      const wib = new Date(utc + 3600000 * 7);
      setWibHour(wib.getHours());
      setWibMinute(wib.getMinutes());
      setWibSecond(wib.getSeconds());
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Cutoff status: modifications for tomorrow lock at 20:00:00 WIB
  const isCutoffPassed = wibHour >= 20;

  // Load subscription and catalog from backend API. Tanpa data contoh.
  // Pengunjung belum masuk melihat undangan masuk di balik buram.
  useEffect(() => {
    let mounted = true;

    // Fetch recipe catalog for menu swap choices
    recipesApi
      .getCatalog()
      .then((res) => {
        if (!mounted) return;
        if (res.data?.meals) {
          setCatalogMeals(res.data.meals);
          if (res.data.meals.length > 0) {
            setSelectedSwapRecipeId(res.data.meals[0].id);
          }
        }
      })
      .catch((err) => {
        console.error('Gagal memuat katalog resep:', err);
      });

    if (status !== 'authenticated') {
      setLoadingSub(false);
      return;
    }

    setLoadingSub(true);
    // Fetch live user subscription from backend
    subscriptionApi
      .getMySubscription()
      .then((res) => {
        if (!mounted) return;
        const sub: SubscriptionData = res.data;
        setSubData(sub);
        setSubStatus(sub.status === 'PAUSED' ? 'PAUSED' : 'ACTIVE');
        if (sub.deliveryAddress?.fullAddress) {
          setCurrentAddress(sub.deliveryAddress.fullAddress);
        }
        if (sub.upcomingOrders && sub.upcomingOrders.length > 0) {
          setSelectedTomorrowMeal(sub.upcomingOrders[0].recipeTitle);
          setTomorrowDate(sub.upcomingOrders[0].orderDate);
        }
      })
      .catch((err) => {
        console.error('Gagal memuat langganan dari backend:', err);
      })
      .finally(() => {
        if (mounted) setLoadingSub(false);
      });

    return () => {
      mounted = false;
    };
  }, [status]);

  // Handlers for subscription modifications via backend API
  const handlePauseResume = async () => {
    if (isCutoffPassed) {
      setFeedbackMessage({
        type: 'error',
        text: 'Batas waktu 20.00 WIB telah lewat. Perubahan jadwal untuk pengiriman besok telah ditutup oleh dapur sentral.',
      });
      return;
    }
    if (!subData) return;

    const next = subStatus === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    setIsSubmitting(true);
    try {
      const targetDate = tomorrowDate || nextDeliveryDateStr();
      if (next === 'PAUSED') {
        const res = await subscriptionApi.pause(subData.id, targetDate);
        setSubStatus('PAUSED');
        setFeedbackMessage({
          type: 'success',
          text: res.message || 'Langganan berhasil dijeda efektif mulai pengiriman besok.',
        });
      } else {
        const res = await subscriptionApi.resume(subData.id, targetDate);
        setSubStatus('ACTIVE');
        setFeedbackMessage({
          type: 'success',
          text: res.message || 'Langganan berhasil diaktifkan kembali mulai pengiriman besok.',
        });
      }
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Terjadi kendala saat mengubah status langganan.';
      setFeedbackMessage({ type: 'error', text: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isCutoffPassed) {
      setFeedbackMessage({
        type: 'error',
        text: 'Batas waktu 20.00 WIB telah lewat. Rute kurir untuk pengiriman besok telah dikunci oleh tim logistik.',
      });
      setIsAddressModalOpen(false);
      return;
    }
    if (!addressStreet.trim() || !subData) return;

    const pinSuffix = isPinMapActive && pinnedCoordinates ? ` • GPS: ${pinnedCoordinates.lat.toFixed(4)}, ${pinnedCoordinates.lng.toFixed(4)}` : '';
    const noteSuffix = addressNotes.trim() ? ` (${addressNotes.trim()})` : '';
    const fullAddr = `${addressLabel ? `${addressLabel}: ` : ''}${addressStreet.trim()}, ${addressCity}${noteSuffix}${pinSuffix}`;

    setIsSubmitting(true);
    try {
      const targetDate = tomorrowDate || nextDeliveryDateStr();
      const res = await subscriptionApi.updateAddress(
        subData.id,
        targetDate,
        'addr_custom',
        addressLabel,
        fullAddr
      );
      setCurrentAddress(fullAddr);
      setIsAddressModalOpen(false);
      setFeedbackMessage({
        type: 'success',
        text: res.message || `Alamat antar pengiriman besok berhasil diperbarui ke "${addressLabel}: ${addressStreet.trim()}".`,
      });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Gagal memperbarui alamat pengantaran.';
      setFeedbackMessage({ type: 'error', text: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmSwapMenu = async () => {
    if (isCutoffPassed) {
      setFeedbackMessage({
        type: 'error',
        text: 'Batas waktu 20.00 WIB telah lewat. Menu katering untuk besok telah memasuki proses preparasi dapur.',
      });
      setIsSwapModalOpen(false);
      return;
    }
    if (!subData) return;

    const chosen = catalogMeals.find((m) => m.id === selectedSwapRecipeId);
    if (!chosen) return;

    setIsSubmitting(true);
    try {
      const targetDate = tomorrowDate || nextDeliveryDateStr();
      const res = await subscriptionApi.swapMenu(subData.id, targetDate, chosen.id, chosen.title);
      setSelectedTomorrowMeal(chosen.title);
      setIsSwapModalOpen(false);
      setFeedbackMessage({
        type: 'success',
        text: res.message || `Menu untuk pengiriman besok berhasil ditukar dengan "${chosen.title}".`,
      });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Gagal menukar menu katering.';
      setFeedbackMessage({ type: 'error', text: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 1. Loading State (Sleek placeholder)
  if (status === 'loading') {
    return (
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-16 space-y-6">
        <div className="bg-warm-surface border border-warm-border rounded-[20px] p-8 space-y-4 animate-pulse">
          <div className="h-4 w-32 bg-tebu-200 rounded" />
          <div className="h-7 w-72 bg-tebu-200 rounded" />
          <div className="h-4 w-96 bg-tebu-100 rounded" />
          <div className="h-28 w-full bg-tebu-100 rounded-lg mt-6" />
        </div>
      </div>
    );
  }

  const isAuthenticated = status === 'authenticated' && !!user;

  return (
    <div className="relative min-h-[700px]">
      {/* Blurred Dashboard Content when unauthenticated */}
      <div
        className={`max-w-4xl mx-auto px-4 md:px-6 py-10 space-y-6 transition-all duration-300 ${
          !isAuthenticated
            ? 'filter blur-[7px] opacity-40 select-none pointer-events-none'
            : ''
        }`}
        aria-hidden={!isAuthenticated}
      >
        {/* Page Title & User Context */}
        <div className="space-y-1">
          <p className="eyebrow text-forest">Kontrol pesanan berkala</p>
          <h1 className="font-display text-2xl md:text-3xl text-warm-black">
            Atur jadwal dan menu langganan katering Anda.
          </h1>
          <p className="text-xs text-warm-muted">
            Halo, <strong className="text-warm-black font-medium">{user?.fullName || 'Pelanggan NutriDaily'}</strong>. Kelola jeda langganan, penukaran menu harian, dan alamat pengantaran sebelum batas waktu pukul 20.00 WIB.
          </p>
        </div>

      {/* 20.00 WIB Cutoff Indicator Banner (Flat color, no gradient) */}
      <div
        className={`p-4 rounded-[14px] border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          isCutoffPassed
            ? 'bg-warm-surface border-terracotta/40 text-warm-black'
            : 'bg-warm-surface border-forest/30 text-warm-black'
        }`}
      >
        <div className="flex items-start gap-3">
          <Clock className={`w-5 h-5 shrink-0 mt-0.5 ${isCutoffPassed ? 'text-terracotta' : 'text-forest'}`} />
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold">
                Jam sistem: {String(wibHour).padStart(2, '0')}:{String(wibMinute).padStart(2, '0')}:
                {String(wibSecond).padStart(2, '0')} WIB
              </span>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                  isCutoffPassed
                    ? 'bg-terracotta text-tebu-50'
                    : 'bg-forest text-tebu-50'
                }`}
              >
                {isCutoffPassed ? 'Batas H+1 telah ditutup' : 'Kontrol aktif sebelum 20.00 WIB'}
              </span>
            </div>
            <p className="text-xs text-warm-muted leading-relaxed">
              {isCutoffPassed
                ? 'Dapur sentral sedang memotong dan menimbang bahan untuk besok. Modifikasi baru berlaku untuk H+2.'
                : 'Anda memiliki kendali penuh untuk pause, tukar menu, atau ganti alamat sebelum jam 20.00 WIB malam ini.'}
            </p>
          </div>
        </div>
      </div>

      {/* Dynamic Feedback Message */}
      {feedbackMessage && (
        <div
          className={`p-3.5 rounded-md text-xs font-medium flex items-center justify-between border ${
            feedbackMessage.type === 'success'
              ? 'bg-forest-subtle text-forest border-forest-border'
              : 'bg-terracotta-subtle text-terracotta border-terracotta-border'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMessage.type === 'success' ? (
              <Check className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedbackMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackMessage(null)}
            className="text-xs font-semibold hover:underline ml-4"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Main Subscription Card (Concentric Radius: outer 20px, inner 6px) */}
      <div className="bg-warm-surface border border-warm-border rounded-[20px] p-6 md:p-8 grain-overlay-light space-y-6">
        {loadingSub ? (
          <div className="py-12 flex flex-col items-center justify-center text-xs text-warm-muted space-y-2">
            <Loader2 className="w-5 h-5 animate-spin text-forest" />
            <span>Sinkronisasi data langganan dari server dapur sentral...</span>
          </div>
        ) : (
          <>
            {/* Header Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-warm-border">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="font-display font-semibold text-lg text-warm-black">
                    Paket aktif: {subData?.packageType ? subData.packageType.replace(/_/g, ' ').toLowerCase() : 'Weight loss (lean & sculpt)'}
                  </h2>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                      subStatus === 'ACTIVE'
                        ? 'bg-forest-subtle text-forest border border-forest-border'
                        : 'bg-warm-border text-warm-muted'
                    }`}
                  >
                    {subStatus === 'ACTIVE' ? 'Status: Aktif' : 'Status: Dijeda (Paused)'}
                  </span>
                </div>
                <p className="text-xs text-warm-muted">
                  ID Langganan: <span className="font-mono">{subData?.id || 'sub_active'}</span> • Durasi: {subData?.durationDays || 20} hari kerja • Layanan katering Jadetabek
                </p>
              </div>

              <div>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handlePauseResume}
                  className={`px-4 py-2 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                    subStatus === 'ACTIVE'
                      ? 'bg-tebu-50 border border-warm-border text-warm-black hover:border-warm-neutral'
                      : 'bg-forest text-tebu-50 hover:bg-forest-hover'
                  }`}
                >
                  {isSubmitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : subStatus === 'ACTIVE' ? (
                    <>
                      <Pause className="w-3.5 h-3.5 text-warm-muted" /> Jeda langganan
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 text-tebu-50" /> Aktifkan kembali
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Scheduled Meal for Tomorrow (H+1) */}
            <div className="bg-tebu-50 border border-warm-border rounded-[14px] p-5 space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="eyebrow text-forest flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Jadwal pengiriman berikutnya ({tomorrowDate || 'H+1'})
                </span>
                <span className="font-mono text-warm-stone text-[11px]">Slot antar: 11.00 - 12.00 WIB</span>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="font-display font-semibold text-base text-warm-black leading-snug">
                    {selectedTomorrowMeal || 'Memuat sajian terjadwal...'}
                  </h3>
                  <p className="text-xs text-warm-muted">
                    Bahan dipetik subuh • Ditimbang presisi per gram gizi • Bebas pengawet sintetis
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsSwapModalOpen(true)}
                  className="px-3.5 py-2 rounded-md bg-warm-surface border border-warm-border hover:bg-tebu-100 text-warm-black text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-forest" />
                  <span>Tukar menu berikutnya</span>
                </button>
              </div>

              {/* Delivery Address Destination */}
              <div className="pt-3 border-t border-warm-border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5 text-warm-neutral">
                  <MapPin className="w-3.5 h-3.5 text-terracotta shrink-0" />
                  <span>Alamat antar: <strong className="text-warm-black font-medium">{currentAddress || 'Belum diatur'}</strong></span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddressModalOpen(true)}
                  className="text-forest hover:underline font-semibold text-xs text-left cursor-pointer"
                >
                  Ubah alamat
                </button>
              </div>
            </div>

            {/* Action Shortcuts: Clean Label Verification & 45-Min Guarantee */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <Link
                href="/verify"
                className="p-4 rounded-md border border-warm-border bg-tebu-50 hover:bg-tebu-100 flex items-center justify-between transition-colors group"
              >
                <div className="space-y-0.5">
                  <h4 className="font-semibold text-xs text-warm-black">Verifikasi label boks</h4>
                  <p className="text-[11px] text-warm-muted">Periksa laporan lab SIG dan panen petani</p>
                </div>
                <ChevronRight className="w-4 h-4 text-warm-stone group-hover:text-forest transition-colors" />
              </Link>

              <button
                type="button"
                onClick={() => setIsServiceRecoveryOpen(true)}
                className="p-4 rounded-md border border-warm-border bg-tebu-50 hover:bg-tebu-100 flex items-center justify-between transition-colors text-left group cursor-pointer"
              >
                <div className="space-y-0.5">
                  <h4 className="font-semibold text-xs text-warm-black">Garansi layanan 45 menit</h4>
                  <p className="text-[11px] text-warm-muted">Lapor kendala pengiriman atau kemasan rusak</p>
                </div>
                <ChevronRight className="w-4 h-4 text-warm-stone group-hover:text-terracotta transition-colors" />
              </button>
            </div>
          </>
        )}
      </div>

      {/* Modal 1: Swap Menu from Catalog */}
      {isSwapModalOpen && (
        <div className="fixed inset-0 z-50 bg-warm-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-warm-surface border border-warm-border rounded-[18px] max-w-lg w-full max-h-[90vh] flex flex-col shadow-natural-lg overflow-hidden">
            <div className="p-6 pb-3 border-b border-warm-border flex justify-between items-start shrink-0">
              <div>
                <h3 className="font-display font-semibold text-base text-warm-black">
                  Tukar menu untuk pengiriman besok
                </h3>
                <p className="text-xs text-warm-muted mt-0.5">
                  Pilih varian sajian pengganti dari katalog rotasi dapur sentral sebelum pukul 20.00 WIB.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsSwapModalOpen(false)}
                className="text-warm-stone hover:text-warm-black p-1 -mr-1"
                aria-label="Tutup formulir tukar menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 py-4 overflow-y-auto custom-pill-scrollbar flex-1 space-y-3">
              <label className="block text-xs font-semibold text-warm-black mb-1">
                Pilih menu katering pengganti:
              </label>

              {catalogMeals.map((meal) => {
                const isSelected = selectedSwapRecipeId === meal.id;
                return (
                  <button
                    key={meal.id}
                    type="button"
                    disabled={!meal.isAvailable}
                    onClick={() => setSelectedSwapRecipeId(meal.id)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                      !meal.isAvailable
                        ? 'opacity-40 cursor-not-allowed bg-tebu-100 border-warm-border'
                        : isSelected
                        ? 'border-forest bg-forest-subtle shadow-natural'
                        : 'border-warm-border bg-tebu-50 hover:bg-tebu-100'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-tebu-200 text-warm-black">
                          {meal.sku}
                        </span>
                        <span className="text-[10px] text-warm-muted">{meal.category}</span>
                      </div>
                      <h4 className="font-display font-semibold text-xs text-warm-black leading-snug">
                        {meal.title}
                      </h4>
                      <p className="text-[11px] text-warm-muted">
                        {meal.calories} kkal • Protein {meal.proteinG}g • Karbo {meal.carbG}g • Lemak {meal.fatG}g
                      </p>
                    </div>

                    <div className="shrink-0 mt-1">
                      {isSelected ? (
                        <div className="w-4 h-4 rounded-full bg-forest text-tebu-50 flex items-center justify-center">
                          <Check className="w-2.5 h-2.5" />
                        </div>
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-warm-border bg-warm-surface" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="p-4 px-6 border-t border-warm-border bg-warm-surface flex items-center gap-2 shrink-0">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmSwapMenu}
                className="flex-1 py-2.5 px-4 rounded-md bg-forest hover:bg-forest-hover text-tebu-50 text-xs font-semibold tracking-tight transition-colors shadow-natural cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Konfirmasi penukaran menu besok</span>
              </button>
              <button
                type="button"
                onClick={() => setIsSwapModalOpen(false)}
                className="py-2.5 px-4 rounded-md bg-warm-surface border border-warm-border hover:bg-tebu-100 text-warm-muted hover:text-warm-black text-xs font-medium transition-colors cursor-pointer"
              >
                Batalkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Change Address Form with Optional Pin Map */}
      {isAddressModalOpen && (
        <div className="fixed inset-0 z-50 bg-warm-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-warm-surface border border-warm-border rounded-[18px] max-w-lg w-full max-h-[90vh] flex flex-col shadow-natural-lg overflow-hidden">
            <div className="p-6 pb-3 border-b border-warm-border flex justify-between items-start shrink-0">
              <div>
                <h3 className="font-display font-semibold text-base text-warm-black">
                  Ubah alamat pengantaran
                </h3>
                <p className="text-xs text-warm-muted mt-0.5">
                  Masukkan detail alamat baru untuk jadwal pengiriman sebelum pukul 20.00 WIB.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddressModalOpen(false)}
                className="text-warm-stone hover:text-warm-black p-1 -mr-1"
                aria-label="Tutup formulir ubah alamat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAddress} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="p-6 py-4 overflow-y-auto custom-pill-scrollbar flex-1 space-y-3.5">
                {/* Row 1: Label Alamat & Kota / Area */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="address-label" className="block text-xs font-semibold text-warm-black mb-1.5">
                      Nama label alamat
                    </label>
                    <input
                      id="address-label"
                      type="text"
                      required
                      value={addressLabel}
                      onChange={(e) => setAddressLabel(e.target.value)}
                      placeholder="Contoh: Kantor, Rumah, Apartemen"
                      className="w-full text-xs p-2.5 rounded-lg border border-warm-border bg-tebu-50 text-warm-black focus:outline-none focus:border-forest shadow-natural"
                    />
                  </div>

                  <div>
                    <CustomDropdown<string>
                      id="address-city-select"
                      label="Area jangkauan Jadetabek"
                      value={addressCity}
                      onChange={(val) => setAddressCity(val)}
                      size="sm"
                      variant="default"
                      options={[
                        { value: 'Jakarta Selatan', label: 'Jakarta Selatan', badge: 'Slot 11.00' },
                        { value: 'Jakarta Pusat', label: 'Jakarta Pusat', badge: 'Slot 11.00' },
                        { value: 'Jakarta Barat', label: 'Jakarta Barat', badge: 'Slot 11.30' },
                        { value: 'Jakarta Timur', label: 'Jakarta Timur', badge: 'Slot 11.30' },
                        { value: 'Jakarta Utara', label: 'Jakarta Utara', badge: 'Slot 12.00' },
                        { value: 'Tangerang Selatan', label: 'Tangerang Selatan', badge: 'Slot 11.30' },
                        { value: 'Tangerang Kota', label: 'Tangerang Kota', badge: 'Slot 12.00' },
                        { value: 'Bekasi', label: 'Bekasi', badge: 'Slot 12.00' },
                        { value: 'Depok', label: 'Depok', badge: 'Slot 12.00' },
                      ]}
                    />
                  </div>
                </div>

                {/* Row 2: Alamat Lengkap */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="address-street" className="block text-xs font-semibold text-warm-black">
                      Alamat lengkap jalan dan nomor
                    </label>
                    {isSyncingAddress && (
                      <span className="text-[10px] text-forest font-medium animate-pulse">
                        Menyelaraskan dari pin...
                      </span>
                    )}
                  </div>
                  <textarea
                    id="address-street"
                    required
                    rows={2}
                    value={addressStreet}
                    onChange={(e) => setAddressStreet(e.target.value)}
                    placeholder="Nama jalan, nomor rumah atau gedung, lantai/unit, RT/RW, kelurahan"
                    className="w-full text-xs p-2.5 rounded-lg border border-warm-border bg-tebu-50 text-warm-black focus:outline-none focus:border-forest shadow-natural resize-none"
                  />
                </div>

                {/* Row 3: Catatan Pengantaran */}
                <div>
                  <label htmlFor="address-notes" className="block text-xs font-semibold text-warm-black mb-1.5">
                    Catatan untuk kurir (opsional)
                  </label>
                  <input
                    id="address-notes"
                    type="text"
                    value={addressNotes}
                    onChange={(e) => setAddressNotes(e.target.value)}
                    placeholder="Contoh: Titip di pos satpam, resepsionis lobi, atau unit lantai 18"
                    className="w-full text-xs p-2.5 rounded-lg border border-warm-border bg-tebu-50 text-warm-black focus:outline-none focus:border-forest shadow-natural"
                  />
                </div>

                {/* Row 4: Pin Map Section (Opsional) */}
                <div className="pt-2 border-t border-warm-border/80 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-forest" />
                      <div>
                        <span className="text-xs font-semibold text-warm-black block">
                          Titik akurasi peta (opsional)
                        </span>
                        <span className="text-[11px] text-warm-muted">
                          Bantu kurir motor menemukan pagar atau lobi secara presisi
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      role="switch"
                      aria-checked={isPinMapActive}
                      onClick={() => setIsPinMapActive((prev) => !prev)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors border cursor-pointer ${
                        isPinMapActive
                          ? 'bg-forest text-tebu-50 border-forest'
                          : 'bg-tebu-50 text-warm-muted border-warm-border hover:text-warm-black'
                      }`}
                    >
                      {isPinMapActive ? 'Pin aktif' : '+ Pasang pin'}
                    </button>
                  </div>

                  {isPinMapActive && (
                    <div className="space-y-3 p-3 bg-tebu-50 rounded-xl border border-warm-border animate-toast">
                      <InteractivePinMap
                        lat={pinnedCoordinates.lat}
                        lng={pinnedCoordinates.lng}
                        onChange={handleMapPinChange}
                      />

                      <div className="space-y-2.5 pt-1 border-t border-warm-border/60">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-lg bg-warm-surface border border-warm-border">
                          <div className="flex items-center gap-1.5 text-xs">
                            <span className="font-semibold text-warm-black shrink-0">Koordinat pin:</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="flex items-center rounded border border-warm-border bg-tebu-50 px-2 py-1 text-xs font-mono shadow-natural">
                              <span className="text-[10px] text-warm-stone font-sans mr-1.5 select-none">Lat</span>
                              <input
                                type="number"
                                step="0.0001"
                                value={pinnedCoordinates.lat}
                                onChange={(e) =>
                                  handleMapPinChange(
                                    parseFloat(e.target.value) || 0,
                                    pinnedCoordinates.lng
                                  )
                                }
                                className="w-20 bg-transparent text-warm-black font-semibold focus:outline-none"
                                aria-label="Latitude titik pengantaran"
                              />
                            </div>

                            <div className="flex items-center rounded border border-warm-border bg-tebu-50 px-2 py-1 text-xs font-mono shadow-natural">
                              <span className="text-[10px] text-warm-stone font-sans mr-1.5 select-none">Lng</span>
                              <input
                                type="number"
                                step="0.0001"
                                value={pinnedCoordinates.lng}
                                onChange={(e) =>
                                  handleMapPinChange(
                                    pinnedCoordinates.lat,
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                className="w-20 bg-transparent text-warm-black font-semibold focus:outline-none"
                                aria-label="Longitude titik pengantaran"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end">
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${pinnedCoordinates.lat},${pinnedCoordinates.lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full sm:w-auto py-2 px-3 rounded-lg bg-tebu-50 hover:bg-tebu-100 border border-warm-border text-forest text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-natural"
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-forest shrink-0" />
                            <span>Buka Google Maps</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Sticky Action Footer */}
              <div className="p-4 px-6 border-t border-warm-border bg-warm-surface flex items-center gap-2 shrink-0">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 px-4 rounded-md bg-forest hover:bg-forest-hover text-tebu-50 text-xs font-semibold tracking-tight transition-colors shadow-natural cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Simpan alamat pengantaran</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddressModalOpen(false)}
                  className="py-2.5 px-4 rounded-md bg-warm-surface border border-warm-border hover:bg-tebu-100 text-warm-muted hover:text-warm-black text-xs font-medium transition-colors cursor-pointer"
                >
                  Batalkan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: 45-Minute Service Recovery Claim */}
      {isServiceRecoveryOpen && (
        <div className="fixed inset-0 z-50 bg-warm-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-warm-surface border border-warm-border rounded-[18px] max-w-md w-full p-6 space-y-4 shadow-natural-lg">
            <div className="flex justify-between items-center pb-2 border-b border-warm-border">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-forest" />
                <h3 className="font-display font-semibold text-base text-warm-black">
                  Garansi layanan 45 menit
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsServiceRecoveryOpen(false)}
                className="text-warm-stone hover:text-warm-black cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-warm-muted leading-relaxed">
              Kami menjamin pengiriman tepat waktu dalam kondisi tersegel rapi. Jika pesanan terlambat lebih dari 45 menit atau mengalami kerusakan kemasan, koki kami akan segera memproses penggantian atau kompensasi kredit.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-warm-black mb-1">
                  Kategori kendala
                </label>
                <select className="w-full text-xs p-2.5 rounded-md border border-warm-border bg-tebu-50 text-warm-black">
                  <option>Segel boks rusak atau saus tumpah</option>
                  <option>Kurir terlambat lebih dari 45 menit dari slot jadwal</option>
                  <option>Porsi atau gramatur tidak sesuai pesanan</option>
                  <option>Salah varian menu katering</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-warm-black mb-1">
                  Unggah foto bukti boks katering
                </label>
                <input
                  type="file"
                  accept="image/*"
                  className="w-full text-xs text-warm-muted file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-medium file:bg-tebu-100 file:text-warm-black hover:file:bg-tebu-200"
                />
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  alert('Laporan kendala Anda telah diterima. Tim penjaminan mutu NutriDaily akan menindaklanjuti dalam 15 menit.');
                  setIsServiceRecoveryOpen(false);
                }}
                className="flex-1 py-2.5 bg-forest hover:bg-forest-hover text-tebu-50 text-xs font-semibold rounded-md transition-colors cursor-pointer"
              >
                Kirimkan laporan garansi
              </button>
              <button
                type="button"
                onClick={() => setIsServiceRecoveryOpen(false)}
                className="px-4 py-2.5 text-xs font-medium text-warm-muted hover:text-warm-black cursor-pointer"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
      </div>

      {/* Censor Overlay with Blur Background (mirip Rotasi jadwal mingguan) */}
      {!isAuthenticated && (
        <div className="absolute inset-0 z-20 flex items-start justify-center p-4 pt-24 md:pt-36">
          <div className="max-w-md w-full bg-warm-surface/95 backdrop-blur-md border border-warm-border rounded-[20px] p-6 md:p-8 text-center shadow-natural-lg grain-overlay-light space-y-4">
            <div className="w-12 h-12 rounded-full bg-forest-subtle border border-forest-border flex items-center justify-center mx-auto text-forest">
              <Lock className="w-5 h-5" aria-hidden="true" />
            </div>
            <div className="space-y-1.5">
              <p className="eyebrow text-forest">Akses khusus pelanggan</p>
              <h2 className="font-display font-semibold text-xl text-warm-black text-balance">
                Masuk untuk mengelola jadwal langganan
              </h2>
              <p className="text-xs text-warm-muted text-pretty">
                Fitur jeda langganan, penukaran varian menu harian, dan pembaruan rute kurir pengantaran hanya dapat diakses oleh pelanggan aktif NutriDaily.
              </p>
            </div>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
              <Link
                href="/account/login?next=/dashboard"
                className="w-full sm:w-auto px-5 py-2.5 rounded-md bg-forest hover:bg-forest-hover text-tebu-50 text-xs font-semibold transition-colors shadow-natural text-center"
              >
                Masuk ke akun sekarang
              </Link>
              <Link
                href="/account/register"
                className="w-full sm:w-auto px-5 py-2.5 rounded-md bg-tebu-50 border border-warm-border hover:bg-tebu-100 text-warm-black text-xs font-semibold transition-colors shadow-natural text-center"
              >
                Daftar akun baru
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
