'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, RefreshCw, AlertCircle, Check, Clock, X, Lock } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { recipesApi, subscriptionApi } from '@/lib/api-client';

interface MenuItem {
  id: string;
  sku: string;
  title: string;
  category: string;
  calories: number;
  proteinG: number;
  carbG: number;
  fatG: number;
  cookingMethod: string;
  farmerPartner: string;
  imageUrl: string;
  isAvailable: boolean;
  availableFrom?: string | null;
  availableUntil?: string | null;
  availableDays?: string[] | null;
}

interface WeeklyDay {
  dayName: string;
  dateNum: string;
  fullDate: string;
  isToday: boolean;
}

const DAY_NAMES = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
];

// Jadwal Senin sampai Jumat berdasarkan tanggal nyata WIB.
// Akhir pekan menampilkan minggu berikutnya tanpa penanda hari ini.
// weekOffset menggeser tampilan per minggu (1 untuk minggu depan).
function buildWeeklyDays(from: Date = new Date(), weekOffset = 0): WeeklyDay[] {
  const shifted = new Date(from.getTime() + weekOffset * 7 * 86400000);
  const utc = shifted.getTime() + shifted.getTimezoneOffset() * 60000;
  const wib = new Date(utc + 3600000 * 7);
  const pad = (n: number) => String(n).padStart(2, '0');
  const todayStr = `${wib.getFullYear()}-${pad(wib.getMonth() + 1)}-${pad(wib.getDate())}`;
  const todayDow = new Date(Date.UTC(wib.getFullYear(), wib.getMonth(), wib.getDate())).getUTCDay();

  const monday = new Date(Date.UTC(wib.getFullYear(), wib.getMonth(), wib.getDate()));
  if (todayDow === 0) {
    monday.setUTCDate(monday.getUTCDate() + 1);
  } else if (todayDow === 6) {
    monday.setUTCDate(monday.getUTCDate() + 2);
  } else {
    monday.setUTCDate(monday.getUTCDate() - (todayDow - 1));
  }

  return DAY_NAMES.map((dayName, idx) => {
    const cursor = new Date(monday.getTime() + idx * 86400000);
    const fullDate = `${cursor.getUTCFullYear()}-${pad(cursor.getUTCMonth() + 1)}-${pad(cursor.getUTCDate())}`;
    return {
      dayName,
      dateNum: `${pad(cursor.getUTCDate())} ${MONTH_SHORT[cursor.getUTCMonth()]}`,
      fullDate,
      isToday: fullDate === todayStr,
    };
  });
}

function defaultSelectedIndex(days: WeeklyDay[]): number {
  const todayIdx = days.findIndex((d) => d.isToday);
  return todayIdx >= 0 ? todayIdx : 0;
}

const DEFAULT_DAYS: WeeklyDay[] = buildWeeklyDays();

const CATEGORIES = [
  { id: 'ALL', label: 'Semua program' },
  { id: 'Weight loss', label: 'Weight loss' },
  { id: 'Muscle gain', label: 'Muscle gain' },
  { id: 'Therapeutic DASH', label: 'Therapeutic DASH' },
  { id: 'Vitality', label: 'Vitality' },
];

// Paket langganan mengunci rotasi ke kategorinya. Tanpa paket, semua tampil.
function packageToCategory(packageType: string | null | undefined): string | null {
  if (packageType === 'WEIGHT_LOSS_LEAN_SCULPT') return 'Weight loss';
  if (packageType === 'MUSCLE_GAIN_FIT_BUILD') return 'Muscle gain';
  if (packageType === 'THERAPEUTIC_DIET') return 'Therapeutic DASH';
  if (packageType === 'MAINTENANCE_VITALITY_DAILY') return 'Vitality';
  return null;
}

function filterByCategory(meals: MenuItem[], category: string): MenuItem[] {
  if (category === 'ALL') return meals;
  return meals.filter((meal) => meal.category.toLowerCase().includes(category.toLowerCase()));
}

// Jadwal harian memakai cakupan tayang nyata tiap makanan, bukan urutan
// putar. Daftar hari eksplisit lebih utama daripada jendela dari sampai.
function mealCoversDay(meal: MenuItem, fullDate: string): boolean {
  if (Array.isArray(meal.availableDays) && meal.availableDays.length > 0) {
    return meal.availableDays.indexOf(fullDate) !== -1;
  }
  const from = (meal.availableFrom || '').slice(0, 10);
  const until = (meal.availableUntil || '').slice(0, 10);
  if (from && from > fullDate) return false;
  if (until && until < fullDate) return false;
  return true;
}

// Waktu WIB tanpa dipende zona waktu perangkat. WIB selalu UTC+7 tanpa DST.
function getWibParts(from: Date = new Date()): { dateStr: string; hour: number } {
  const utc = from.getTime() + from.getTimezoneOffset() * 60000;
  const wib = new Date(utc + 3600000 * 7);
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    dateStr: `${wib.getFullYear()}-${pad(wib.getMonth() + 1)}-${pad(wib.getDate())}`,
    hour: wib.getHours(),
  };
}

function addDaysKey(dateStr: string, delta: number): string {
  const parts = dateStr.split('-').map((v) => parseInt(v, 10));
  const base = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2] + delta));
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${base.getUTCFullYear()}-${pad(base.getUTCMonth() + 1)}-${pad(base.getUTCDate())}`;
}

// Status kunci per hari mengikuti aturan backend (CutoffValidator): pesanan
// hari ini dan sebelumnya terkunci, H+1 terkunci lewat 20.00 WIB.
function getDayLock(fullDate: string, now: Date): { locked: boolean; reason: string | null } {
  const wib = getWibParts(now);
  if (fullDate <= wib.dateStr) {
    return { locked: true, reason: 'Pesanan hari ini telah masuk proses dapur dan tidak dapat diubah.' };
  }
  if (fullDate === addDaysKey(wib.dateStr, 1) && wib.hour >= 20) {
    return { locked: true, reason: 'Batas 20.00 WIB telah lewat. Dapur sedang menyiapkan menu besok.' };
  }
  return { locked: false, reason: null };
}

export default function MenuSwapper() {
  const { status } = useAuth();
  const isAuthenticated = status === 'authenticated';

  const [weeklyDays, setWeeklyDays] = useState<WeeklyDay[]>(DEFAULT_DAYS);
  const [menuOptions, setMenuOptions] = useState<MenuItem[]>([]);
  const [loadingMenu, setLoadingMenu] = useState<boolean>(true);
  const [weekOffset, setWeekOffset] = useState<0 | 1>(0);
  const [reloadNonce, setReloadNonce] = useState<number>(0);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(() => defaultSelectedIndex(DEFAULT_DAYS));
  const [weeklySchedule, setWeeklySchedule] = useState<Record<string, string>>({});
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [lockedCategory, setLockedCategory] = useState<string | null>(null);
  const [viewState, setViewState] = useState<'DEFAULT' | 'LOADING' | 'EMPTY' | 'ERROR'>('DEFAULT');
  const [swapFeedback, setSwapFeedback] = useState<string | null>(null);
  const feedbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Jam berjalan agar status kunci 20.00 WIB segar tanpa muat ulang halaman.
  // Null sampai mount agar render server dan hidrasi pertama selalu sama.
  const [nowTick, setNowTick] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoadingMenu(true);
    const fallbackDays = buildWeeklyDays(new Date(), weekOffset);
    const catalogRequest = recipesApi.getCatalog(weekOffset === 1 ? 'next' : 'current');
    const packageRequest = isAuthenticated
      ? subscriptionApi.getMySubscription().then(
          (res) => packageToCategory(res.data?.packageType),
          () => null,
        )
      : Promise.resolve(null);
    Promise.all([catalogRequest, packageRequest])
      .then(([res, locked]) => {
        if (!mounted) return;
        const days = res.data?.days;
        const meals = res.data?.meals;
        const hasSchedule =
          Array.isArray(days) && days.length > 0 && Array.isArray(meals) && meals.length > 0;
        if (hasSchedule) {
          setWeeklyDays(days);
          setMenuOptions(meals);
          setSelectedDayIndex(defaultSelectedIndex(days));
          setLockedCategory(locked);
          setSelectedCategory(locked || 'ALL');
          const pool = locked ? filterByCategory(meals, locked) : meals;
          const initialSchedule: Record<string, string> = {};
          days.forEach((d: WeeklyDay) => {
            const covering = pool.filter((m) => mealCoversDay(m, d.fullDate));
            const m = covering.length > 0 ? covering[0] : undefined;
            if (m) initialSchedule[d.fullDate] = m.id;
          });
          setWeeklySchedule(initialSchedule);
          setViewState('DEFAULT');
        } else {
          setWeeklyDays(fallbackDays);
          setSelectedDayIndex(defaultSelectedIndex(fallbackDays));
          setMenuOptions([]);
          setWeeklySchedule({});
          setLockedCategory(locked);
          setSelectedCategory(locked || 'ALL');
          setViewState('EMPTY');
        }
      })
      .catch((err) => {
        console.error('Gagal memuat katalog menu dari backend:', err);
        if (mounted) {
          setWeeklyDays(fallbackDays);
          setSelectedDayIndex(defaultSelectedIndex(fallbackDays));
          setMenuOptions([]);
          setWeeklySchedule({});
          setViewState('ERROR');
        }
      })
      .finally(() => {
        if (mounted) setLoadingMenu(false);
      });

    return () => {
      mounted = false;
      if (feedbackTimeoutRef.current) {
        clearTimeout(feedbackTimeoutRef.current);
      }
    };
  }, [weekOffset, isAuthenticated, reloadNonce]);

  useEffect(() => {
    setNowTick(Date.now());
    const id = setInterval(() => setNowTick(Date.now()), 60000);
    return () => clearInterval(id);
  }, []);

  const getMealShortName = (mealId: string): string => {
    const found = menuOptions.find((m) => m.id === mealId);
    if (!found) return 'Pilih menu';
    const words = found.title.split(' ');
    return words.slice(0, 2).join(' ');
  };

  const formatStartDate = (isoDate: string | null | undefined): string | null => {
    if (!isoDate) return null;
    const parts = isoDate.slice(0, 10).split('-');
    if (parts.length !== 3) return null;
    const monthIdx = parseInt(parts[1], 10) - 1;
    if (monthIdx < 0 || monthIdx > 11) return null;
    return `${parseInt(parts[2], 10)} ${MONTH_SHORT[monthIdx]}`;
  };

  const selectedDay = weeklyDays[selectedDayIndex] || weeklyDays[0] || DEFAULT_DAYS[0];
  // Sebelum mount, anggap semua hari terbuka agar cocok dengan HTML prerender.
  const lockFor = (fullDate: string): { locked: boolean; reason: string | null } =>
    nowTick == null ? { locked: false, reason: null } : getDayLock(fullDate, new Date(nowTick));
  const selectedLock = lockFor(selectedDay.fullDate);
  const effectiveCategory = lockedCategory || selectedCategory;
  const packageMeals = filterByCategory(menuOptions, effectiveCategory);
  // Zona detail dan daftar pengganti mengikuti hari tampil. Hari tanpa
  // jadwal dapur tidak boleh memakai fallback daftar seminggu.
  const isDayScheduled = Boolean(weeklySchedule[selectedDay.fullDate]);
  const firstScheduledIndex = weeklyDays.findIndex((d) => weeklySchedule[d.fullDate]);
  const currentMealId =
    weeklySchedule[selectedDay.fullDate] || packageMeals[0]?.id || menuOptions[0]?.id || 'm1';
  const currentActiveMeal =
    menuOptions.find((m) => m.id === currentMealId) || packageMeals[0] || menuOptions[0] || null;

  const filteredMeals = packageMeals
    .slice()
    .sort((a, b) => {
      if (a.id === currentMealId) return -1;
      if (b.id === currentMealId) return 1;
      return 0;
    });

  // Status tampil turunan. Data kosong atau gagal fetch wajib jatuh ke EMPTY atau ERROR,
  // tidak boleh terjebak di skeleton loading selamanya.
  const effectiveView =
    loadingMenu || viewState === 'LOADING'
      ? 'LOADING'
      : viewState === 'DEFAULT' && !currentActiveMeal
        ? 'EMPTY'
        : viewState;

  const handleSwap = (meal: MenuItem) => {
    if (!meal.isAvailable) return;
    if (getDayLock(selectedDay.fullDate, new Date()).locked) {
      if (feedbackTimeoutRef.current) {
        clearTimeout(feedbackTimeoutRef.current);
      }
      setSwapFeedback(`Hari ${selectedDay.dayName} telah terkunci. Batas ubah menu pukul 20.00 WIB telah lewat.`);
      feedbackTimeoutRef.current = setTimeout(() => {
        setSwapFeedback(null);
      }, 4500);
      return;
    }
    setWeeklySchedule((prev) => ({
      ...prev,
      [selectedDay.fullDate]: meal.id,
    }));
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
    }
    setSwapFeedback(`Menu untuk hari ${selectedDay.dayName} berhasil dialihkan ke: ${meal.title}.`);
    feedbackTimeoutRef.current = setTimeout(() => {
      setSwapFeedback(null);
    }, 4500);
  };

  return (
    <section id="menu-catalog" className="py-12 border-t border-warm-border">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        {/* Section Header with State Toggles */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
          <div className="space-y-2 max-w-xl">
            <p className="eyebrow text-terracotta">Rotasi jadwal mingguan</p>
            <h2 className="font-display text-2xl md:text-3xl text-warm-black text-balance">
              Atur menu harian Anda untuk 5 hari kerja.
            </h2>
            <p className="text-sm text-warm-muted text-pretty">
              Pilih hari yang ingin Anda sesuaikan, lalu tentukan sajian pengganti sesuai target nutrisi Anda sebelum batas waktu pukul 20.00 WIB.
            </p>
          </div>

          {isAuthenticated ? (
            /* Interactive State Switcher for UX audit inspection */
            <div className="flex items-center gap-1.5 p-1 bg-warm-surface border border-warm-border rounded-md text-xs font-medium">
              <span className="text-[11px] text-warm-muted px-2">Status komponen:</span>
              {(['DEFAULT', 'LOADING', 'EMPTY', 'ERROR'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setViewState(st)}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    viewState === st
                      ? 'bg-forest text-tebu-50'
                      : 'text-warm-muted hover:text-warm-black'
                  }`}
                >
                  {st.toLowerCase()}
                </button>
              ))}
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-forest-subtle border border-forest-border text-forest text-xs font-semibold">
              <Lock className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Akses khusus pelanggan</span>
            </div>
          )}
        </div>

        {/* Content Container (Blurred when unauthenticated) */}
        <div className="relative">
          <div
            className={`transition-all duration-300 ${
              !isAuthenticated
                ? 'filter blur-[7px] opacity-40 select-none pointer-events-none'
                : ''
            }`}
            aria-hidden={!isAuthenticated}
          >

        {/* Week Switcher: Minggu ini vs Minggu depan */}
        <div className="flex items-center gap-1.5 p-1 bg-warm-surface border border-warm-border rounded-md text-xs font-medium w-fit mb-3" role="tablist" aria-label="Pilih minggu jadwal">
          {([
            { value: 0, label: 'Minggu ini' },
            { value: 1, label: 'Minggu depan' },
          ] as const).map((tab) => (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={weekOffset === tab.value}
              onClick={() => setWeekOffset(tab.value)}
              className={`px-3 py-1.5 rounded transition-colors ${
                weekOffset === tab.value
                  ? 'bg-forest text-tebu-50'
                  : 'text-warm-muted hover:text-warm-black'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 5-Day Weekly Selector Bar with Assigned Meal Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 mb-6">
          {weeklyDays.map((d, idx) => {
            const isDaySelected = selectedDayIndex === idx;
            const dayMealId = weeklySchedule[d.fullDate] || 'm1';
            const shortName = getMealShortName(dayMealId);
            const dayLock = lockFor(d.fullDate);

            return (
              <button
                key={d.fullDate}
                type="button"
                onClick={() => setSelectedDayIndex(idx)}
                title={dayLock.locked ? `Hari ${d.dayName} telah terkunci (batas 20.00 WIB)` : undefined}
                aria-label={`${d.dayName}, ${d.dateNum} - ${shortName}${dayLock.locked ? ' (Terkunci)' : ''}`}
                className={`relative overflow-hidden p-3 rounded-lg border text-left transition-all ${
                  isDaySelected
                    ? 'bg-forest text-tebu-50 border-forest shadow-natural'
                    : 'bg-warm-surface text-warm-black border-warm-border hover:bg-tebu-100/70 hover:border-warm-neutral'
                }`}
              >
                {/* Background Level Lock Icon: Centered & Rotated */}
                {dayLock.locked && (
                  <div
                    aria-hidden="true"
                    className={`absolute inset-0 flex items-center justify-center pointer-events-none select-none transition-opacity ${
                      isDaySelected ? 'text-tebu-50/15' : 'text-warm-muted/15'
                    }`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 640 640"
                      fill="currentColor"
                      className="w-12 h-12 -rotate-12"
                      aria-hidden="true"
                    >
                      <path d="M256 160L256 224L384 224L384 160C384 124.7 355.3 96 320 96C284.7 96 256 124.7 256 160zM192 224L192 160C192 89.3 249.3 32 320 32C390.7 32 448 89.3 448 160L448 224C483.3 224 512 252.7 512 288L512 512C512 547.3 483.3 576 448 576L192 576C156.7 576 128 547.3 128 512L128 288C128 252.7 156.7 224 192 224z" />
                    </svg>
                  </div>
                )}

                <div className="relative z-10">
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className={`font-semibold ${isDaySelected ? 'text-tebu-200' : 'text-warm-muted'}`}>
                      {d.dayName}
                    </span>
                    {d.isToday ? (
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold ${isDaySelected ? 'bg-forest-active text-tebu-50' : 'bg-tebu-200 text-warm-black'}`}>
                        Besok
                      </span>
                    ) : (
                      <span className={`text-[10px] ${isDaySelected ? 'text-tebu-300' : 'text-warm-stone'}`}>
                        {d.dateNum}
                      </span>
                    )}
                  </div>

                  <div className="font-semibold text-xs truncate">
                    {shortName}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* State 1: LOADING SKELETON */}
        {effectiveView === 'LOADING' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            <div className="lg:col-span-5 bg-warm-surface border border-warm-border rounded-[16px] p-6 space-y-4 animate-pulse h-full">
              <div className="h-4 bg-tebu-200 rounded w-1/3"></div>
              <div className="aspect-[16/10] bg-tebu-200 rounded-lg w-full"></div>
              <div className="h-5 bg-tebu-200 rounded w-3/4"></div>
              <div className="h-4 bg-tebu-200 rounded w-full"></div>
              <div className="grid grid-cols-4 gap-2 pt-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-10 bg-tebu-200 rounded"></div>
                ))}
              </div>
            </div>
            <div className="lg:col-span-7 bg-warm-surface border border-warm-border rounded-[16px] p-6 space-y-4 animate-pulse h-full">
              <div className="h-5 bg-tebu-200 rounded w-1/4"></div>
              <div className="flex gap-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-7 w-20 bg-tebu-200 rounded-full"></div>
                ))}
              </div>
              <div className="space-y-3 pt-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-tebu-200 rounded-lg w-full"></div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* State 2: EMPTY STATE */}
        {effectiveView === 'EMPTY' && (
          <div className="bg-warm-surface border border-warm-border rounded-md p-10 text-center space-y-3">
            <Clock className="w-8 h-8 text-warm-stone mx-auto" />
            {weekOffset === 1 && menuOptions.length === 0 ? (
              <>
                <h3 className="font-display text-lg text-warm-black">Jadwal minggu depan belum tersedia</h3>
                <p className="text-xs text-warm-muted max-w-md mx-auto">
                  Dapur sentral belum menyusun rotasi menu untuk minggu depan. Kembali ke minggu ini atau coba muat ulang nanti.
                </p>
                <div className="flex items-center justify-center gap-4 pt-1">
                  <button
                    type="button"
                    onClick={() => setWeekOffset(0)}
                    className="mt-2 text-xs font-medium text-forest hover:underline"
                  >
                    Kembali ke minggu ini
                  </button>
                  <button
                    type="button"
                    onClick={() => setReloadNonce((n) => n + 1)}
                    className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-forest hover:underline"
                  >
                    <RefreshCw className="w-3 h-3" /> Coba muat ulang
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 className="font-display text-lg text-warm-black">Tidak ada jadwal pengiriman pada hari ini</h3>
                <p className="text-xs text-warm-muted max-w-md mx-auto">
                  Dapur sentral kami libur operasional pada hari libur nasional atau akhir pekan. Pengiriman reguler beroperasi setiap hari Senin sampai Jumat.
                </p>
                {menuOptions.length === 0 ? (
                  <button
                    type="button"
                    onClick={() => setReloadNonce((n) => n + 1)}
                    className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-forest hover:underline"
                  >
                    <RefreshCw className="w-3 h-3" /> Coba muat ulang
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setViewState('DEFAULT')}
                    className="mt-2 text-xs font-medium text-forest hover:underline"
                  >
                    Kembali ke jadwal reguler
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {/* State 3: ERROR STATE */}
        {effectiveView === 'ERROR' && (
          <div className="bg-warm-surface border border-terracotta/40 rounded-md p-8 text-left space-y-3">
            <div className="flex items-center gap-2 text-terracotta">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <h3 className="font-semibold text-sm text-warm-black">Gagal memuat jadwal menu</h3>
            </div>
            <p className="text-xs text-warm-muted max-w-lg">
              Koneksi ke server katering terputus saat mengambil data stok bahan baku dapur. Silakan periksa jaringan internet Anda atau muat ulang komponen.
            </p>
            <button
              type="button"
              onClick={() => setReloadNonce((n) => n + 1)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-warm-black text-tebu-50 hover:bg-forest text-xs font-medium rounded transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Muat ulang data menu
            </button>
          </div>
        )}

        {/* State 4: DEFAULT UNCLUTTERED BENTO PLANNER */}
        {effectiveView === 'DEFAULT' && isDayScheduled && currentActiveMeal && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Zone 1 (Col-span-5): Active Scheduled Meal for Selected Day */}
            <div className="lg:col-span-5 bg-warm-surface border border-warm-border rounded-[16px] p-5 md:p-6 shadow-natural flex flex-col justify-between h-full">
              <div>
                {/* Active Meal Header */}
                <div className="flex items-center justify-between gap-2 pb-3 border-b border-warm-border/80">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-forest text-tebu-50 text-[10px] font-semibold tracking-wide">
                      Jadwal aktif
                    </span>
                    <span className="text-xs font-semibold text-warm-black">
                      {selectedDay.dayName}, {selectedDay.dateNum}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-warm-muted font-mono">
                    <Clock className="w-3 h-3 text-warm-stone" />
                    <span>Batas 20.00 WIB</span>
                  </div>
                </div>

                {/* Food Image Feature Box */}
                <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[10px] border border-warm-border/60 bg-tebu-200 mt-4">
                  <img
                    src={currentActiveMeal.imageUrl}
                    alt={currentActiveMeal.title}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute top-2.5 right-2.5 rounded bg-warm-black/85 backdrop-blur-sm px-2.5 py-1 font-mono text-[11px] font-semibold text-tebu-50">
                    {currentActiveMeal.calories} kkal
                  </div>
                  <div className="absolute bottom-2.5 left-2.5 rounded bg-forest/90 backdrop-blur-sm px-2.5 py-0.5 text-[10px] font-medium text-tebu-50">
                    {currentActiveMeal.category}
                  </div>
                </div>

                {/* SKU & Identification */}
                <div className="flex items-center justify-between text-xs pt-3">
                  <span className="font-mono text-[11px] text-warm-stone font-medium">{currentActiveMeal.sku}</span>
                  <span className="text-[11px] text-warm-muted">Takar gramatur presisi</span>
                </div>

                {/* Meal Title */}
                <h3 className="font-display font-semibold text-base sm:text-lg text-warm-black mt-1.5 leading-snug">
                  {currentActiveMeal.title}
                </h3>

                {/* Cooking Technique & Farm Source */}
                <p className="text-xs text-warm-muted mt-2 leading-relaxed">
                  {currentActiveMeal.cookingMethod}. {currentActiveMeal.farmerPartner}.
                </p>

                {/* Nutrition Grid */}
                <div className="grid grid-cols-4 gap-2 pt-3 mt-3 border-t border-warm-border text-center text-xs">
                  <div className="p-2 bg-tebu-50 rounded border border-warm-border/80">
                    <span className="text-[10px] text-warm-stone block">Kalori</span>
                    <strong className="text-warm-black">{currentActiveMeal.calories} kkal</strong>
                  </div>
                  <div className="p-2 bg-tebu-50 rounded border border-warm-border/80">
                    <span className="text-[10px] text-warm-stone block">Protein</span>
                    <strong className="text-warm-black">{currentActiveMeal.proteinG}g</strong>
                  </div>
                  <div className="p-2 bg-tebu-50 rounded border border-warm-border/80">
                    <span className="text-[10px] text-warm-stone block">Karbo</span>
                    <strong className="text-warm-black">{currentActiveMeal.carbG}g</strong>
                  </div>
                  <div className="p-2 bg-tebu-50 rounded border border-warm-border/80">
                    <span className="text-[10px] text-warm-stone block">Lemak</span>
                    <strong className="text-warm-black">{currentActiveMeal.fatG}g</strong>
                  </div>
                </div>
              </div>

              {/* Status Indicator Banner */}
              <div className="mt-auto pt-5">
                {selectedLock.locked ? (
                  <div className="p-3 rounded-md bg-terracotta/10 border border-terracotta/40 text-warm-black text-xs font-medium flex items-center gap-2">
                    <Lock className="w-4 h-4 text-terracotta shrink-0" aria-hidden="true" />
                    <span>Terkunci. {selectedLock.reason}</span>
                  </div>
                ) : (
                  <div className="p-3 rounded-md bg-forest-subtle border border-forest-border text-forest text-xs font-medium flex items-center gap-2">
                    <Check className="w-4 h-4 text-forest shrink-0" />
                    <span>Sajian aktif siap dikirim untuk hari {selectedDay.dayName}.</span>
                  </div>
                )}
              </div>
            </div>

            {/* Zone 2 (Col-span-7): Easy Alternative Menu Picker */}
            <div className="lg:col-span-7 bg-warm-surface border border-warm-border rounded-[16px] p-5 md:p-6 shadow-natural flex flex-col justify-between h-full">
              <div className="flex flex-col flex-1 min-h-0">
                {/* Header with Title & Summary */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-3 border-b border-warm-border/80 shrink-0">
                  <div>
                    <h3 className="font-display font-semibold text-base text-warm-black">
                      Pilihan menu pengganti
                    </h3>
                    <p className="text-xs text-warm-muted">
                      Sesuaikan sajian untuk hari {selectedDay.dayName} dengan memilih opsi di bawah:
                    </p>
                  </div>
                  <span className="text-[11px] font-mono text-warm-stone font-medium">
                    {filteredMeals.length} opsi tersedia
                  </span>
                </div>

                {/* Diet Program Category Filter Tabs */}
                {lockedCategory ? (
                  <div className="flex items-center gap-2 py-3 shrink-0">
                    <span className="shrink-0 px-3 py-1 rounded-full text-xs font-semibold bg-warm-black text-tebu-50">
                      {lockedCategory}
                    </span>
                    <span className="text-[11px] text-warm-muted">
                      Menu disesuaikan paket {lockedCategory} Anda.
                    </span>
                  </div>
                ) : (
                <div className="flex items-center gap-1.5 overflow-x-auto py-3 shrink-0">
                  {CATEGORIES.map((cat) => {
                    const isActive = selectedCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          isActive
                            ? 'bg-warm-black text-tebu-50'
                            : 'bg-tebu-50 text-warm-muted hover:text-warm-black border border-warm-border'
                        }`}
                      >
                        {cat.label}
                      </button>
                    );
                  })}
                </div>
                )}

                {/* Compact Menu Cards List */}
                <div className="space-y-2.5 flex-1 min-h-0 overflow-y-auto pr-2 custom-pill-scrollbar max-h-[460px]">
                  {filteredMeals.map((meal) => {
                    const isCurrent = meal.id === currentMealId;

                    return (
                      <div
                        key={meal.id}
                        className={`p-3 rounded-[12px] border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          isCurrent
                            ? 'bg-tebu-50 border-forest'
                            : meal.isAvailable
                            ? 'bg-warm-surface border-warm-border hover:border-warm-neutral hover:bg-tebu-50/50'
                            : 'bg-warm-surface/40 border-warm-border/50 opacity-60'
                        }`}
                      >
                        {/* Left: Thumbnail & Concise Info */}
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-16 h-16 rounded-[8px] overflow-hidden border border-warm-border/70 shrink-0 bg-tebu-200">
                            <img
                              src={meal.imageUrl}
                              alt={meal.title}
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                          </div>

                          <div className="min-w-0 space-y-0.5">
                            <div className="flex items-center gap-1.5 text-[10px] flex-wrap">
                              <span className="font-mono text-warm-stone">{meal.sku}</span>
                              <span className="text-warm-stone">•</span>
                              <span className="font-medium text-forest">{meal.category}</span>
                              {formatStartDate(meal.availableFrom) && (
                                <span className="px-1.5 py-0.5 rounded bg-forest-subtle border border-forest-border text-forest font-semibold">
                                  Mulai {formatStartDate(meal.availableFrom)}
                                </span>
                              )}
                            </div>

                            <h4 className="text-xs sm:text-sm font-semibold text-warm-black leading-snug line-clamp-1">
                              {meal.title}
                            </h4>

                            <div className="flex items-center gap-2 text-[11px] text-warm-muted">
                              <span className="font-semibold text-warm-black">{meal.calories} kkal</span>
                              <span>•</span>
                              <span>P: {meal.proteinG}g</span>
                              <span>•</span>
                              <span>C: {meal.carbG}g</span>
                              <span>•</span>
                              <span>F: {meal.fatG}g</span>
                            </div>
                          </div>
                        </div>

                        {/* Right: Outcome-Based Action Button */}
                        <div className="shrink-0 flex items-center justify-end sm:pl-2">
                          {isCurrent ? (
                            <div className="px-3 py-1.5 rounded-md bg-forest text-tebu-50 text-xs font-semibold flex items-center gap-1.5">
                              <Check className="w-3.5 h-3.5 text-tebu-50" />
                              <span>Terpilih</span>
                            </div>
                          ) : meal.isAvailable ? (
                            selectedLock.locked ? (
                              <span className="px-3 py-1.5 rounded-md bg-tebu-200 text-warm-muted text-xs font-semibold inline-flex items-center gap-1.5 cursor-not-allowed">
                                <Lock className="w-3.5 h-3.5" aria-hidden="true" />
                                <span>Terkunci</span>
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleSwap(meal)}
                                className="px-3 py-1.5 rounded-md bg-warm-black hover:bg-forest text-tebu-50 text-xs font-semibold transition-colors"
                              >
                                Pilih menu ini
                              </button>
                            )
                          ) : (
                            <span className="px-3 py-1.5 rounded-md bg-tebu-200 text-warm-muted text-xs font-medium cursor-not-allowed">
                              Stok habis
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Reassuring Operational Note at Bottom aligned with Left Card Banner */}
              <div className="mt-auto pt-5">
                <div className="p-3 rounded-md bg-tebu-100/60 border border-warm-border text-warm-muted text-xs flex items-center justify-between">
                  <span>Pergantian menu berlaku untuk pengiriman batch hari {selectedDay.dayName}.</span>
                  <span className="font-mono text-[11px] text-warm-stone">Terkunci 20.00 WIB</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Hari tampil tanpa jadwal dapur. Kartu hari menulis Pilih menu dan daftar pengganti ikut kosong. */}
        {effectiveView === 'DEFAULT' && !isDayScheduled && (
          <div className="bg-warm-surface border border-warm-border rounded-md p-10 text-center space-y-3">
            <Clock className="w-8 h-8 text-warm-stone mx-auto" />
            {lockedCategory && packageMeals.length === 0 ? (
              <>
                <h3 className="font-display text-lg text-warm-black">Tidak ada menu {lockedCategory} minggu ini</h3>
                <p className="text-xs text-warm-muted max-w-md mx-auto">
                  Paket Anda mengunci rotasi ke {lockedCategory}, tetapi dapur sentral belum menjadwalkan sajian kategori itu pada minggu tampil. Coba buka tab minggu depan.
                </p>
              </>
            ) : (
              <>
                <h3 className="font-display text-lg text-warm-black">Belum ada menu untuk hari {selectedDay.dayName}</h3>
                <p className="text-xs text-warm-muted max-w-md mx-auto">
                  Dapur sentral belum menjadwalkan sajian untuk {selectedDay.dayName}, {selectedDay.dateNum}. Pilih hari lain yang sudah menampilkan nama menunya.
                </p>
                {firstScheduledIndex >= 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedDayIndex(firstScheduledIndex)}
                    className="mt-2 text-xs font-medium text-forest hover:underline"
                  >
                    Lihat hari terjadwal
                  </button>
                )}
              </>
            )}
          </div>
        )}
          </div>

          {!isAuthenticated && (
            <div className="absolute inset-0 z-20 flex items-center justify-center p-4">
              <div className="max-w-md w-full bg-warm-surface/95 backdrop-blur-md border border-warm-border rounded-[20px] p-6 md:p-8 text-center shadow-natural-lg grain-overlay-light space-y-4">
                <div className="w-12 h-12 rounded-full bg-forest-subtle border border-forest-border flex items-center justify-center mx-auto text-forest">
                  <Lock className="w-5 h-5" aria-hidden="true" />
                </div>
                <div className="space-y-1.5">
                  <p className="eyebrow text-forest">Akses khusus pelanggan</p>
                  <h3 className="font-display font-semibold text-xl text-warm-black [text-wrap:balance]">
                    Masuk untuk mengatur rotasi menu mingguan
                  </h3>
                  <p className="text-xs text-warm-muted [text-wrap:pretty]">
                    Fitur penyesuaian menu harian 5 hari kerja dan kustomisasi nutrisi hanya dapat diatur oleh pelanggan aktif NutriDaily.
                  </p>
                </div>
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
                  <Link
                    href="/account/login?next=/#menu-catalog"
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
        {/* Floating Confirmation Toast (Non-shifting floating pop up with animation) */}
        {swapFeedback && (
          <aside
            role="status"
            aria-live="polite"
            className="fixed bottom-20 md:bottom-8 right-4 sm:right-6 md:right-8 z-50 max-w-sm sm:max-w-md w-[calc(100%-2rem)] sm:w-auto animate-toast pointer-events-auto"
          >
            <div className="bg-tebu-50/95 backdrop-blur-md border border-forest/30 rounded-xl p-3.5 sm:p-4 shadow-natural-lg flex items-start gap-3 text-xs">
              <div className="w-6 h-6 rounded-full bg-forest text-tebu-50 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
              <div className="flex-1 min-w-0 pr-1">
                <p className="font-semibold text-warm-black mb-0.5">Menu berhasil dialihkan</p>
                <p className="text-warm-muted leading-relaxed text-pretty text-[11px] sm:text-xs">
                  {swapFeedback}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSwapFeedback(null)}
                aria-label="Tutup konfirmasi"
                className="text-warm-stone hover:text-warm-black p-1 -mr-1 -mt-1 rounded transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </aside>
        )}
      </div>
    </section>
  );
}
