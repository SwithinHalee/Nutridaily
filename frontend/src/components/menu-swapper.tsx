'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, RefreshCw, AlertCircle, Check, Clock, X, Lock, Box } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { recipesApi, subscriptionApi } from '@/lib/api-client';
import { motion, AnimatePresence } from 'framer-motion';

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
  isTomorrow?: boolean;
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
  const tomorrowWib = new Date(wib.getTime() + 86400000);
  const tomorrowStr = `${tomorrowWib.getFullYear()}-${pad(tomorrowWib.getMonth() + 1)}-${pad(tomorrowWib.getDate())}`;
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
      isTomorrow: fullDate === tomorrowStr,
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

interface ActivePackageInfo {
  id: string;
  packageType: string;
  packageName: string;
  category: string | null;
  upcomingOrders: Array<{
    id: string;
    orderDate: string;
    recipeId: string;
    recipeTitle: string;
    status: string;
  }>;
}

function formatPackageName(pkg: string): string {
  const map: Record<string, string> = {
    MAINTENANCE_VITALITY_DAILY: 'Maintenance vitality daily',
    WEIGHT_LOSS_LEAN_SCULPT: 'Weight loss (lean & sculpt)',
    MUSCLE_BUILD_HYPERTROPHY: 'Muscle building (hypertrophy)',
    MUSCLE_GAIN_FIT_BUILD: 'Muscle gain (fit & build)',
    PRE_DIABETES_GLUCO_BALANCE: 'Pre-diabetes gluco balance',
    HYPERTENSION_DASH_CARDIO: 'Hypertension DASH cardio',
    THERAPEUTIC_DIET: 'Therapeutic DASH diet',
  };
  return map[pkg] || pkg.replace(/_/g, ' ').toLowerCase();
}

// Paket langganan mengunci rotasi ke kategorinya. Tanpa paket, semua tampil.
function packageToCategory(packageType: string | null | undefined): string | null {
  if (!packageType) return null;
  const p = packageType.toUpperCase();
  if (p.includes('WEIGHT_LOSS')) return 'Weight loss';
  if (p.includes('MUSCLE')) return 'Muscle gain';
  if (p.includes('HYPERTENSION') || p.includes('PRE_DIABETES') || p.includes('THERAPEUTIC')) return 'Therapeutic DASH';
  if (p.includes('VITALITY') || p.includes('MAINTENANCE')) return 'Vitality';
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
    return { locked: true, reason: 'Pesanan sedang diproses dapur.' };
  }
  if (fullDate === addDaysKey(wib.dateStr, 1) && wib.hour >= 20) {
    return { locked: true, reason: 'Batas 20.00 WIB telah lewat. Dapur sedang menyiapkan menu besok.' };
  }
  return { locked: false, reason: null };
}

export interface MenuSwapperProps {
  id?: string;
  className?: string;
  containerClassName?: string;
  onMealSwapped?: (dayDate: string, mealTitle: string) => void;
}

export default function MenuSwapper({
  id = 'menu-catalog',
  className,
  containerClassName,
  onMealSwapped,
}: MenuSwapperProps = {}) {
  const { status } = useAuth();
  const isAuthenticated = status === 'authenticated';

  const [weeklyDays, setWeeklyDays] = useState<WeeklyDay[]>(DEFAULT_DAYS);
  const [menuOptions, setMenuOptions] = useState<MenuItem[]>([]);
  const [loadingMenu, setLoadingMenu] = useState<boolean>(true);
  const [weekOffset, setWeekOffset] = useState<0 | 1>(0);
  const [reloadNonce, setReloadNonce] = useState<number>(0);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(() => defaultSelectedIndex(DEFAULT_DAYS));
  const [activePackages, setActivePackages] = useState<ActivePackageInfo[]>([]);
  const [selectedPackageIndex, setSelectedPackageIndex] = useState<number>(0);
  const [weeklySchedules, setWeeklySchedules] = useState<Record<string, Record<string, string>>>({});
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [lockedCategory, setLockedCategory] = useState<string | null>(null);
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);
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
          (res) => {
            if (!res?.data) return { packages: [], primarySubId: null };
            const allSubs = Array.isArray(res.data.allSubscriptions)
              ? res.data.allSubscriptions
              : [res.data];
            const activeSubs = allSubs.filter((s: any) => s.status === 'ACTIVE');
            const pkgs: ActivePackageInfo[] = activeSubs.map((sub: any) => ({
              id: sub.id,
              packageType: sub.packageType,
              packageName: formatPackageName(sub.packageType),
              category: packageToCategory(sub.packageType),
              upcomingOrders: sub.upcomingOrders || [],
            }));
            return {
              packages: pkgs,
              primarySubId: res.data.id || (pkgs[0]?.id ?? null),
            };
          },
          () => ({ packages: [], primarySubId: null }),
        )
      : Promise.resolve({ packages: [], primarySubId: null });

    Promise.all([catalogRequest, packageRequest])
      .then(([res, packageInfo]) => {
        if (!mounted) return;
        const days = res.data?.days;
        const meals = res.data?.meals;
        const hasSchedule =
          Array.isArray(days) && days.length > 0 && Array.isArray(meals) && meals.length > 0;
        const pkgs = packageInfo.packages || [];
        setActivePackages(pkgs);
        if (packageInfo.primarySubId) {
          setSubscriptionId(packageInfo.primarySubId);
        }
        const firstLock = pkgs[0]?.category || null;

        if (hasSchedule) {
          setWeeklyDays(days);
          setMenuOptions(meals);
          setSelectedDayIndex(defaultSelectedIndex(days));
          setLockedCategory(firstLock);
          setSelectedCategory(firstLock || 'ALL');

          const schedulesMap: Record<string, Record<string, string>> = {};
          if (pkgs.length > 0) {
            pkgs.forEach((pkg: ActivePackageInfo) => {
              const sched: Record<string, string> = {};
              const pool = pkg.category ? filterByCategory(meals, pkg.category) : meals;
              days.forEach((d: WeeklyDay) => {
                const existingOrder = pkg.upcomingOrders?.find((o: any) => o.orderDate === d.fullDate);
                if (existingOrder && existingOrder.recipeId) {
                  sched[d.fullDate] = existingOrder.recipeId;
                } else {
                  const covering = pool.filter((m) => mealCoversDay(m, d.fullDate));
                  if (covering.length > 0) {
                    sched[d.fullDate] = covering[0].id;
                  } else if (meals.length > 0) {
                    sched[d.fullDate] = meals[0].id;
                  }
                }
              });
              schedulesMap[pkg.id] = sched;
            });
          } else {
            const defaultSched: Record<string, string> = {};
            days.forEach((d: WeeklyDay) => {
              const covering = meals.filter((m) => mealCoversDay(m, d.fullDate));
              if (covering.length > 0) {
                defaultSched[d.fullDate] = covering[0].id;
              } else if (meals.length > 0) {
                defaultSched[d.fullDate] = meals[0].id;
              }
            });
            schedulesMap['default'] = defaultSched;
          }
          setWeeklySchedules(schedulesMap);
          setViewState('DEFAULT');
        } else {
          setWeeklyDays(fallbackDays);
          setSelectedDayIndex(defaultSelectedIndex(fallbackDays));
          setMenuOptions([]);
          setWeeklySchedules({});
          setLockedCategory(firstLock);
          setSelectedCategory(firstLock || 'ALL');
          setViewState('EMPTY');
        }
      })
      .catch((err) => {
        console.error('Gagal memuat katalog menu dari backend:', err);
        if (mounted) {
          setWeeklyDays(fallbackDays);
          setSelectedDayIndex(defaultSelectedIndex(fallbackDays));
          setMenuOptions([]);
          setWeeklySchedules({});
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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const boxParam = params.get('box');
      if (boxParam) {
        const boxIdx = parseInt(boxParam, 10) - 1;
        if (boxIdx >= 0 && boxIdx < activePackages.length) {
          setSelectedPackageIndex(boxIdx);
          const targetSub = activePackages[boxIdx];
          if (targetSub?.category) {
            setLockedCategory(targetSub.category);
            setSelectedCategory(targetSub.category);
          }
        }
      }
    }
  }, [activePackages]);

  const getMealShortName = (mealId?: string): string => {
    if (!mealId) return 'Pilih menu';
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

  const currentSub = activePackages[selectedPackageIndex] || activePackages[0] || null;
  const currentSubId = currentSub?.id || 'default';
  const currentSchedule = weeklySchedules[currentSubId] || weeklySchedules['default'] || {};
  const currentLock = currentSub ? currentSub.category : lockedCategory;
  const effectiveCategory = currentLock || selectedCategory;
  const packageMeals = filterByCategory(menuOptions, effectiveCategory);

  const selectedDay = weeklyDays[selectedDayIndex] || weeklyDays[0] || DEFAULT_DAYS[0];
  // Sebelum mount, anggap semua hari terbuka agar cocok dengan HTML prerender.
  const lockFor = (fullDate: string): { locked: boolean; reason: string | null } =>
    nowTick == null ? { locked: false, reason: null } : getDayLock(fullDate, new Date(nowTick));
  const selectedLock = lockFor(selectedDay.fullDate);

  // Zona detail dan daftar pengganti mengikuti hari tampil. Hari tanpa
  // jadwal dapur tidak boleh memakai fallback daftar seminggu.
  const isDayScheduled = Boolean(currentSchedule[selectedDay.fullDate]);
  const firstScheduledIndex = weeklyDays.findIndex((d) => currentSchedule[d.fullDate]);
  const currentMealId =
    currentSchedule[selectedDay.fullDate] || packageMeals[0]?.id || menuOptions[0]?.id || 'm1';
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
    setWeeklySchedules((prev) => ({
      ...prev,
      [currentSubId]: {
        ...(prev[currentSubId] || {}),
        [selectedDay.fullDate]: meal.id,
      },
    }));
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
    }
    const boxPrefix = activePackages.length > 1 ? `Boks ${selectedPackageIndex + 1} (${currentSub?.packageName}) ` : '';
    setSwapFeedback(`Menu ${boxPrefix}untuk hari ${selectedDay.dayName} berhasil dialihkan ke: ${meal.title}.`);
    feedbackTimeoutRef.current = setTimeout(() => {
      setSwapFeedback(null);
    }, 4500);

    onMealSwapped?.(selectedDay.fullDate, meal.title);

    const subIdToSwap = currentSub?.id || subscriptionId;
    if (subIdToSwap) {
      subscriptionApi.swapMenu(subIdToSwap, selectedDay.fullDate, meal.id, meal.title).catch(() => {});
    }
  };

  return (
    <section id={id} className={`py-12 border-t border-warm-border scroll-mt-20 ${className || ''}`}>
      <span id="menu-catalog" className="sr-only" />
      <span id="rotasi-jadwal-mingguan" className="sr-only" />
      <div className={`max-w-6xl mx-auto ${containerClassName || 'px-4 md:px-6'}`}>
        {/* Section Header with Controls */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-6">
          <div className="space-y-2 max-w-xl">
            <p className="eyebrow text-terracotta">Rotasi jadwal mingguan</p>
            <h2 className="font-display text-2xl md:text-3xl text-warm-black text-balance">
              Atur menu harian Anda untuk 5 hari kerja.
            </h2>
            {isAuthenticated && (
              <div className="pt-1">
                {/* Week Switcher: Minggu ini vs Minggu depan with Motion sliding pill */}
                <div className="flex items-center gap-1.5 p-1 bg-warm-surface border border-warm-border rounded-md text-xs font-medium w-fit" role="tablist" aria-label="Pilih minggu jadwal">
                  {([
                    { value: 0, label: 'Minggu ini' },
                    { value: 1, label: 'Minggu depan' },
                  ] as const).map((tab) => {
                    const isCurrent = weekOffset === tab.value;
                    return (
                      <button
                        key={tab.value}
                        type="button"
                        role="tab"
                        aria-selected={isCurrent}
                        onClick={() => setWeekOffset(tab.value)}
                        className={`relative px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                          isCurrent
                            ? 'text-tebu-50'
                            : 'text-warm-muted hover:text-warm-black'
                        }`}
                      >
                        {isCurrent && (
                          <motion.span
                            layoutId="activeWeekPill"
                            className="absolute inset-0 bg-forest rounded"
                            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                          />
                        )}
                        <span className="relative z-10">{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col items-start lg:items-end gap-3 shrink-0 lg:max-w-sm">
            <p className="text-sm text-warm-muted text-pretty lg:text-right">
              Pilih hari yang ingin Anda sesuaikan, lalu tentukan sajian pengganti sesuai target nutrisi Anda sebelum batas waktu pukul 20.00 WIB.
            </p>
            {isAuthenticated && activePackages.length > 1 && (
              /* Multi-Package / Box Switcher with Motion sliding pill */
                <div className="flex items-center gap-1.5 p-1 bg-warm-surface border border-warm-border rounded-md text-xs font-medium overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="tablist" aria-label="Pilih boks katering">
                  {activePackages.map((pkg, idx) => {
                    const isSelected = selectedPackageIndex === idx;
                    return (
                      <button
                        key={pkg.id || idx}
                        type="button"
                        role="tab"
                        aria-selected={isSelected}
                        onClick={() => {
                          setSelectedPackageIndex(idx);
                          if (pkg.category) {
                            setLockedCategory(pkg.category);
                            setSelectedCategory(pkg.category);
                          }
                        }}
                        className={`relative px-3 py-1.5 rounded transition-colors flex items-center gap-2 shrink-0 ${
                          isSelected
                            ? 'text-tebu-50'
                            : 'text-warm-muted hover:text-warm-black'
                        }`}
                      >
                        {isSelected && (
                          <motion.span
                            layoutId="activeBoxPill"
                            className="absolute inset-0 bg-forest rounded shadow-xs"
                            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                          />
                        )}
                        <span className="relative z-10 inline-flex items-center gap-1.5 font-semibold">
                          <Box className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                          <span>{idx + 1}</span>
                        </span>
                        {(pkg.packageName || pkg.category) && (
                          <span className={`relative z-10 truncate whitespace-nowrap overflow-hidden text-[11px] font-normal transition-all duration-300 border-l ${
                            isSelected
                              ? 'max-w-[140px] sm:max-w-[200px] opacity-100 pl-1.5 text-tebu-200/90 border-tebu-50/25'
                              : 'max-w-0 opacity-0 pl-0 text-warm-stone border-transparent'
                          }`}>
                            {pkg.packageName || pkg.category}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
          </div>
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

        {/* 5-Day Weekly Selector Bar with Assigned Meal Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 mb-6">
          {weeklyDays.map((d, idx) => {
            const isDaySelected = selectedDayIndex === idx;
            const dayMealId = currentSchedule[d.fullDate] || 'm1';
            const shortName = getMealShortName(dayMealId);
            const dayLock = lockFor(d.fullDate);

            return (
              <button
                key={d.fullDate}
                type="button"
                onClick={() => setSelectedDayIndex(idx)}
                title={dayLock.locked ? `Hari ${d.dayName} telah terkunci (batas 20.00 WIB)` : undefined}
                aria-label={`${d.dayName}, ${d.dateNum}${dayLock.locked ? ' (Terkunci)' : ''}`}
                className={`relative overflow-hidden p-2.5 sm:p-3 rounded-lg border text-left transition-colors duration-200 h-full min-h-[78px] flex flex-col justify-between ${
                  idx === 4 ? 'col-span-2 sm:col-span-1' : ''
                } ${
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

                <div className="relative z-10 flex flex-col justify-between h-full w-full min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] mb-1.5 min-w-0">
                    <span className={`font-semibold shrink-0 ${isDaySelected ? 'text-tebu-200' : 'text-warm-muted'}`}>
                      {d.dayName}
                    </span>
                    <div className="flex items-center gap-1 shrink-0 ml-auto">
                      {d.isToday ? (
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-semibold leading-none border transition-colors ${
                            isDaySelected
                              ? 'bg-forest-active text-tebu-50 border-forest-border/40'
                              : 'bg-tebu-200 text-warm-black border-transparent'
                          }`}
                        >
                          Hari ini
                        </span>
                      ) : d.isTomorrow ? (
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-semibold leading-none border transition-colors ${
                            isDaySelected
                              ? 'bg-forest-active text-tebu-50 border-forest-border/40'
                              : 'border-forest text-forest bg-transparent'
                          }`}
                        >
                          Besok
                        </span>
                      ) : null}
                      <span className={`text-[10px] ${isDaySelected ? 'text-tebu-300' : 'text-warm-stone'}`}>
                        {d.dateNum}
                      </span>
                    </div>
                  </div>

                  {activePackages.length > 1 ? (
                    <div className="grid grid-rows-2 grid-flow-col auto-cols-max gap-x-2 gap-y-1 mt-auto w-fit">
                      {activePackages.map((pkg, pIdx) => {
                        const isThisPkg = selectedPackageIndex === pIdx;
                        return (
                          <span
                            key={pkg.id || pIdx}
                            className={`inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold rounded leading-none transition-colors ${
                              isThisPkg
                                ? isDaySelected
                                ? 'bg-tebu-50 text-forest'
                                : 'bg-forest text-tebu-50'
                              : isDaySelected
                                ? 'bg-forest-active text-tebu-200 border border-forest-border/40'
                                : 'bg-tebu-200 text-warm-black border border-warm-border/60'
                            }`}
                            title={`Boks ${pIdx + 1}: ${pkg.packageName || ''}`}
                          >
                            <Box className="w-2.5 h-2.5 shrink-0" aria-hidden="true" />
                            <span>{pIdx + 1}</span>
                          </span>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="font-semibold text-xs truncate mt-auto w-full min-w-0" title={shortName}>
                      {shortName}
                    </div>
                  )}
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
          <>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              {/* Zone 1 (Col-span-5): Active Scheduled Meal for Selected Day */}
              <div className="lg:col-span-5 bg-warm-surface border border-warm-border rounded-[16px] p-5 md:p-6 shadow-natural flex flex-col justify-between h-full overflow-hidden">
                {/* Active Meal Header: Stabil saat navigasi hari */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-warm-border/80 shrink-0">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 min-w-0">
                    <span className="px-2 py-0.5 rounded bg-forest text-tebu-50 text-[10px] font-semibold tracking-wide shrink-0 inline-flex items-center gap-1">
                      {activePackages.length > 1 ? (
                        <>
                          <Box className="w-3 h-3 shrink-0" aria-hidden="true" />
                          <span>{selectedPackageIndex + 1}</span>
                        </>
                      ) : (
                        'Jadwal aktif'
                      )}
                    </span>
                    <span className="text-xs font-semibold text-warm-black">
                      {selectedDay.dayName}, {selectedDay.dateNum}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-warm-muted font-mono shrink-0">
                    <Clock className="w-3 h-3 text-warm-stone shrink-0" />
                    <span>Batas 20.00 WIB</span>
                  </div>
                </div>

                {/* Animated Meal Content: Hanya bertransisi jika menu makanan berbeda */}
                <div className="flex-1 flex flex-col justify-between min-h-0">
                  <AnimatePresence initial={false} mode="wait">
                    <motion.div
                      key={currentActiveMeal.id}
                      initial={{ opacity: 0.2 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0.2 }}
                      transition={{ duration: 0.15, ease: 'easeInOut' }}
                      className="flex flex-col flex-1"
                    >
                      {/* Food Image Feature Box */}
                      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[10px] border border-warm-border/60 bg-tebu-200 mt-4">
                        <img
                          src={currentActiveMeal.imageUrl}
                          alt={currentActiveMeal.title}
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute top-2.5 right-2.5 rounded bg-warm-black/85 backdrop-blur-sm px-2.5 py-1 font-mono text-[11px] font-semibold text-tebu-50">
                          {currentActiveMeal.calories} kkal
                        </div>
                        <div className="absolute bottom-2.5 left-2.5 rounded bg-forest/90 backdrop-blur-sm px-2.5 py-0.5 text-[10px] font-medium text-tebu-50">
                          {currentActiveMeal.category}
                        </div>
                      </div>

                      {/* SKU & Identification */}
                      <div className="flex items-center justify-between text-xs pt-3 min-w-0 gap-2">
                        <span className="font-mono text-[11px] text-warm-stone font-medium shrink-0">{currentActiveMeal.sku}</span>
                        <span className="text-[11px] text-warm-muted truncate text-right">
                          {currentSub?.packageName ? currentSub.packageName : 'Takar gramatur presisi'}
                        </span>
                      </div>

                      {/* Meal Title */}
                      <h3 className="font-display font-semibold text-base sm:text-lg text-warm-black mt-1.5 leading-snug break-words">
                        {currentActiveMeal.title}
                      </h3>

                      {/* Cooking Technique & Farm Source */}
                      <p className="text-xs text-warm-muted mt-2 leading-relaxed">
                        {currentActiveMeal.cookingMethod}. {currentActiveMeal.farmerPartner}.
                      </p>

                      {/* Nutrition Grid */}
                      <div className="grid grid-cols-4 gap-1.5 sm:gap-2 pt-3 mt-3 border-t border-warm-border text-center text-xs">
                        <div className="p-1.5 sm:p-2 bg-tebu-50 rounded border border-warm-border/80 min-w-0">
                          <span className="text-[9.5px] sm:text-[10px] text-warm-stone block truncate">Kalori</span>
                          <strong className="text-warm-black text-[11px] sm:text-xs block truncate">{currentActiveMeal.calories} kkal</strong>
                        </div>
                        <div className="p-1.5 sm:p-2 bg-tebu-50 rounded border border-warm-border/80 min-w-0">
                          <span className="text-[9.5px] sm:text-[10px] text-warm-stone block truncate">Protein</span>
                          <strong className="text-warm-black text-[11px] sm:text-xs block truncate">{currentActiveMeal.proteinG}g</strong>
                        </div>
                        <div className="p-1.5 sm:p-2 bg-tebu-50 rounded border border-warm-border/80 min-w-0">
                          <span className="text-[9.5px] sm:text-[10px] text-warm-stone block truncate">Karbo</span>
                          <strong className="text-warm-black text-[11px] sm:text-xs block truncate">{currentActiveMeal.carbG}g</strong>
                        </div>
                        <div className="p-1.5 sm:p-2 bg-tebu-50 rounded border border-warm-border/80 min-w-0">
                          <span className="text-[9.5px] sm:text-[10px] text-warm-stone block truncate">Lemak</span>
                          <strong className="text-warm-black text-[11px] sm:text-xs block truncate">{currentActiveMeal.fatG}g</strong>
                        </div>
                      </div>
                    </motion.div>
                  </AnimatePresence>

                  {/* Status Indicator */}
                  <div className="mt-auto pt-4 shrink-0">
                    {selectedLock.locked ? (
                      <div className="flex items-center gap-2 text-xs font-medium text-warm-black">
                        <Lock className="w-4 h-4 text-terracotta shrink-0" aria-hidden="true" />
                        <span>Terkunci. {selectedLock.reason}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-xs font-medium text-forest">
                        <Check className="w-4 h-4 text-forest shrink-0" />
                        <span>Sajian aktif siap dikirim untuk hari {selectedDay.dayName}.</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Zone 2 (Col-span-7): Easy Alternative Menu Picker */}
            <div className="lg:col-span-7 bg-warm-surface border border-warm-border rounded-[16px] p-5 md:p-6 shadow-natural flex flex-col justify-between h-full">
              <div className="flex flex-col flex-1 min-h-0">
                {/* Header with Title & Summary */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-3 border-b border-warm-border/80 shrink-0">
                  <div>
                    <h3 className="font-display font-semibold text-base text-warm-black">
                      {activePackages.length > 1
                        ? `Pilihan menu pengganti (Boks ${selectedPackageIndex + 1} • ${currentSub?.packageName})`
                        : 'Pilihan menu pengganti'}
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
                {currentLock ? (
                  <div className="flex items-center gap-2 py-3 shrink-0">
                    <span className="shrink-0 px-3 py-1 rounded-full text-xs font-semibold bg-warm-black text-tebu-50">
                      {currentLock}
                    </span>
                    <span className="text-[11px] text-warm-muted">
                      Menu disesuaikan paket {currentLock} Anda.
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
                        className={`relative shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          isActive
                            ? 'text-tebu-50'
                            : 'bg-tebu-50 text-warm-muted hover:text-warm-black border border-warm-border'
                        }`}
                      >
                        {isActive && (
                          <motion.span
                            layoutId="activeCategoryPill"
                            className="absolute inset-0 bg-warm-black rounded-full"
                            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                          />
                        )}
                        <span className="relative z-10">{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
                )}

                {/* Compact Menu Cards List */}
                <div className="space-y-2.5 flex-1 min-h-0 overflow-y-auto pr-2 custom-pill-scrollbar max-h-[460px]">
                  <AnimatePresence mode="popLayout">
                  {filteredMeals.map((meal) => {
                    const isCurrent = meal.id === currentMealId;

                    return (
                      <motion.div
                        key={meal.id}
                        layout
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.18 }}
                        className={`p-3 rounded-[12px] border transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
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

                            <h4 className="text-xs sm:text-sm font-semibold text-warm-black leading-snug line-clamp-1 break-words">
                              {meal.title}
                            </h4>

                            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10.5px] sm:text-[11px] text-warm-muted min-w-0">
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
                        <div className="shrink-0 flex items-center justify-end sm:pl-2 w-full sm:w-auto">
                          {isCurrent ? (
                            <div className="w-full sm:w-auto px-3.5 py-2 rounded-md bg-forest text-tebu-50 text-xs font-semibold flex items-center justify-center gap-1.5 min-h-[38px]">
                              <Check className="w-3.5 h-3.5 text-tebu-50" />
                              <span>Terpilih</span>
                            </div>
                          ) : meal.isAvailable ? (
                            selectedLock.locked ? (
                              <span className="w-full sm:w-auto px-3.5 py-2 rounded-md bg-tebu-200 text-warm-muted text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-not-allowed min-h-[38px]">
                                <Lock className="w-3.5 h-3.5" aria-hidden="true" />
                                <span>Terkunci</span>
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleSwap(meal)}
                                className="w-full sm:w-auto px-4 py-2 rounded-md bg-warm-black hover:bg-forest text-tebu-50 text-xs font-semibold transition-colors flex items-center justify-center min-h-[38px]"
                              >
                                Pilih menu ini
                              </button>
                            )
                          ) : (
                            <span className="w-full sm:w-auto px-3.5 py-2 rounded-md bg-tebu-200 text-warm-muted text-xs font-medium cursor-not-allowed flex items-center justify-center min-h-[38px]">
                              Stok habis
                            </span>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                  </AnimatePresence>
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
        </>
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
        {/* Floating Confirmation Toast with Framer Motion spring animation */}
        <AnimatePresence>
          {swapFeedback && (
            <motion.aside
              role="status"
              aria-live="polite"
              initial={{ opacity: 0, y: 16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 420, damping: 28 }}
              className="fixed bottom-20 md:bottom-8 right-4 sm:right-6 md:right-8 z-50 max-w-sm sm:max-w-md w-[calc(100%-2rem)] sm:w-auto pointer-events-auto"
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
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
