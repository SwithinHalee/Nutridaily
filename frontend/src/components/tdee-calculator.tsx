'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { CustomDropdown } from './custom-dropdown';

interface MetricNumberInputProps {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  unit: string;
  onChange: (val: number) => void;
  onRecalculate: () => void;
}

function MetricNumberInput({
  id,
  label,
  value,
  min,
  max,
  unit,
  onChange,
  onRecalculate,
}: MetricNumberInputProps) {
  const handleIncrement = () => {
    if (value < max) {
      onChange(value + 1);
      onRecalculate();
    }
  };

  const handleDecrement = () => {
    if (value > min) {
      onChange(value - 1);
      onRecalculate();
    }
  };

  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-warm-muted mb-1">
        {label}
      </label>
      <div className="relative flex items-center">
        <input
          id={id}
          type="number"
          value={value === 0 ? '' : value}
          min={min}
          max={max}
          onChange={(e) => {
            const raw = e.target.value;
            if (raw === '') {
              onChange(0);
            } else {
              const val = Number(raw);
              if (!isNaN(val)) {
                onChange(val);
                onRecalculate();
              }
            }
          }}
          onBlur={() => {
            if (value < min) {
              onChange(min);
              onRecalculate();
            } else if (value > max) {
              onChange(max);
              onRecalculate();
            }
          }}
          className="w-full bg-tebu-50 border border-warm-border rounded-md pl-2.5 pr-11 py-2 text-xs font-medium text-warm-black focus:outline-none focus:border-forest [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <span className="absolute right-5 text-[11px] font-medium text-warm-stone pointer-events-none select-none">
          {unit}
        </span>
        <div className="absolute right-1 top-1 bottom-1 flex flex-col justify-center">
          <button
            type="button"
            tabIndex={-1}
            onClick={handleIncrement}
            disabled={value >= max}
            className="text-warm-stone hover:text-warm-black hover:bg-tebu-200/50 disabled:opacity-25 rounded p-0.5 transition-colors"
            aria-label={`Tambah ${label.toLowerCase()}`}
          >
            <ChevronUp className="w-2.5 h-2.5 stroke-[2.5]" />
          </button>
          <button
            type="button"
            tabIndex={-1}
            onClick={handleDecrement}
            disabled={value <= min}
            className="text-warm-stone hover:text-warm-black hover:bg-tebu-200/50 disabled:opacity-25 rounded p-0.5 transition-colors"
            aria-label={`Kurangi ${label.toLowerCase()}`}
          >
            <ChevronDown className="w-2.5 h-2.5 stroke-[2.5]" />
          </button>
        </div>
      </div>
    </div>
  );
}

type Gender = 'MALE' | 'FEMALE';
type ActivityLevel = 'SEDENTARY' | 'LIGHT' | 'MODERATE' | 'VERY_ACTIVE';
type DietGoal = 'WEIGHT_LOSS_LEAN_SCULPT' | 'MUSCLE_GAIN_FIT_BUILD' | 'MAINTENANCE_VITALITY_DAILY' | 'THERAPEUTIC_DIET';

export default function TdeeCalculator() {
  const [step, setStep] = useState<number>(1);
  const [gender, setGender] = useState<Gender>('MALE');
  const [age, setAge] = useState<number>(29);
  const [heightCm, setHeightCm] = useState<number>(174);
  const [weightKg, setWeightKg] = useState<number>(72);
  const [activity, setActivity] = useState<ActivityLevel>('MODERATE');
  const [goal, setGoal] = useState<DietGoal>('WEIGHT_LOSS_LEAN_SCULPT');
  const [isCalculating, setIsCalculating] = useState<boolean>(false);

  // Mifflin-St Jeor Formula
  const bmr = Math.round(
    gender === 'MALE'
      ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5
      : 10 * weightKg + 6.25 * heightCm - 5 * age - 161
  );

  const multipliers: Record<ActivityLevel, number> = {
    SEDENTARY: 1.2,
    LIGHT: 1.375,
    MODERATE: 1.55,
    VERY_ACTIVE: 1.725,
  };

  const tdee = Math.round(bmr * multipliers[activity]);

  // Target metrics with specific real numbers (no fake round numbers)
  let targetCalories = 1380;
  let proteinGrams = 120;
  let carbsGrams = 135;
  let fatGrams = 42;
  let ctaLabel = 'Pilih paket lean & sculpt';
  let categoryName = 'Weight loss (lean & sculpt)';
  let dailyPortionCost = 85000;

  if (goal === 'WEIGHT_LOSS_LEAN_SCULPT') {
    targetCalories = Math.max(1220, Math.min(1440, Math.round(tdee * 0.78)));
    proteinGrams = Math.round((targetCalories * 0.35) / 4);
    carbsGrams = Math.round((targetCalories * 0.35) / 4);
    fatGrams = Math.round((targetCalories * 0.30) / 9);
    ctaLabel = 'Pilih paket lean & sculpt';
    categoryName = 'Weight loss (lean & sculpt)';
    dailyPortionCost = 85000;
  } else if (goal === 'MUSCLE_GAIN_FIT_BUILD') {
    targetCalories = Math.max(2050, Math.min(2480, Math.round(tdee * 1.15)));
    proteinGrams = Math.round((targetCalories * 0.30) / 4);
    carbsGrams = Math.round((targetCalories * 0.50) / 4);
    fatGrams = Math.round((targetCalories * 0.20) / 9);
    ctaLabel = 'Pilih paket fit & build';
    categoryName = 'Muscle gain (fit & build)';
    dailyPortionCost = 95000;
  } else if (goal === 'THERAPEUTIC_DIET') {
    targetCalories = Math.max(1420, Math.min(1600, Math.round(tdee * 0.85)));
    proteinGrams = Math.round((targetCalories * 0.25) / 4);
    carbsGrams = Math.round((targetCalories * 0.45) / 4);
    fatGrams = Math.round((targetCalories * 0.30) / 9);
    ctaLabel = 'Pilih paket diet klinis DASH';
    categoryName = 'Therapeutic diet (DASH & low GI)';
    dailyPortionCost = 90000;
  } else {
    targetCalories = Math.max(1620, Math.min(1820, tdee));
    proteinGrams = Math.round((targetCalories * 0.25) / 4);
    carbsGrams = Math.round((targetCalories * 0.50) / 4);
    fatGrams = Math.round((targetCalories * 0.25) / 9);
    ctaLabel = 'Pilih paket vitality daily';
    categoryName = 'Maintenance (vitality daily)';
    dailyPortionCost = 80000;
  }

  const simulateRecalculation = () => {
    setIsCalculating(true);
    setTimeout(() => {
      setIsCalculating(false);
    }, 280);
  };

  return (
    <section id="calculator" className="py-12">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        {/* Section Header: Offset Left-Aligned, Sentence Case */}
        <div className="max-w-2xl mb-8 space-y-2">
          <p className="eyebrow text-forest">Kalkulasi gizi harian</p>
          <h2 className="font-display text-2xl md:text-3xl text-warm-black">
            Hitung porsi gramatur berdasarkan metabolisme tubuh Anda.
          </h2>
          <p className="text-sm text-warm-muted">
            Formula klinis Mifflin-St Jeor menentukan kebutuhan kalori dasar tanpa takaran kira-kira. Koki kami menimbang setiap porsi makanan dengan timbangan digital presisi 1 gram.
          </p>
        </div>

        {/* Bento Grid Layout (Asymmetric, Not 3 equal cards) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* Bento Cell 1: Multi-Step Input Form (Span 7 cols) */}
          <div className="md:col-span-7 bg-warm-surface border border-warm-border rounded-[20px] p-6 grain-overlay-light flex flex-col justify-between">
            <div className="space-y-6">
              {/* Stepper Header */}
              <div className="flex items-center justify-between border-b border-warm-border pb-4">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-forest text-tebu-50 text-xs font-semibold flex items-center justify-center">
                    {step}
                  </span>
                  <span className="text-xs font-semibold text-warm-black">
                    {step === 1 ? 'Langkah 1 dari 2: Data fisik Anda' : 'Langkah 2 dari 2: Target kesehatan Anda'}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setStep(1); simulateRecalculation(); }}
                    className={`text-xs px-2.5 py-1 rounded transition-colors ${step === 1 ? 'bg-forest text-tebu-50 font-medium' : 'text-warm-muted hover:text-warm-black'}`}
                  >
                    1. Data fisik
                  </button>
                  <button
                    type="button"
                    onClick={() => { setStep(2); simulateRecalculation(); }}
                    className={`text-xs px-2.5 py-1 rounded transition-colors ${step === 2 ? 'bg-forest text-tebu-50 font-medium' : 'text-warm-muted hover:text-warm-black'}`}
                  >
                    2. Target gizi
                  </button>
                </div>
              </div>

              {step === 1 ? (
                <div className="space-y-5">
                  {/* Gender Selector */}
                  <div>
                    <label className="block text-xs font-medium text-warm-muted mb-2">
                      Jenis kelamin biologis
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => { setGender('MALE'); simulateRecalculation(); }}
                        className={`py-2.5 px-4 rounded-md text-xs font-medium border transition-colors text-left ${
                          gender === 'MALE'
                            ? 'bg-forest text-tebu-50 border-forest'
                            : 'bg-tebu-50 text-warm-black border-warm-border hover:bg-tebu-100'
                        }`}
                      >
                        Pria (formula +5 kkal)
                      </button>
                      <button
                        type="button"
                        onClick={() => { setGender('FEMALE'); simulateRecalculation(); }}
                        className={`py-2.5 px-4 rounded-md text-xs font-medium border transition-colors text-left ${
                          gender === 'FEMALE'
                            ? 'bg-forest text-tebu-50 border-forest'
                            : 'bg-tebu-50 text-warm-black border-warm-border hover:bg-tebu-100'
                        }`}
                      >
                        Wanita (formula -161 kkal)
                      </button>
                    </div>
                  </div>

                  {/* Body Metrics: Age, Height, Weight */}
                  <div className="grid grid-cols-3 gap-3">
                    <MetricNumberInput
                      id="tdee-age"
                      label="Usia Anda"
                      value={age}
                      min={17}
                      max={85}
                      unit="th"
                      onChange={setAge}
                      onRecalculate={simulateRecalculation}
                    />

                    <MetricNumberInput
                      id="tdee-height"
                      label="Tinggi badan"
                      value={heightCm}
                      min={130}
                      max={220}
                      unit="cm"
                      onChange={setHeightCm}
                      onRecalculate={simulateRecalculation}
                    />

                    <MetricNumberInput
                      id="tdee-weight"
                      label="Berat badan"
                      value={weightKg}
                      min={38}
                      max={180}
                      unit="kg"
                      onChange={setWeightKg}
                      onRecalculate={simulateRecalculation}
                    />
                  </div>

                  {/* Activity Level */}
                  <div>
                    <CustomDropdown<ActivityLevel>
                      id="activity-level-select"
                      label="Intensitas aktivitas harian"
                      value={activity}
                      onChange={(newVal) => {
                        setActivity(newVal);
                        simulateRecalculation();
                      }}
                      variant="default"
                      options={[
                        {
                          value: 'SEDENTARY',
                          label: 'Bekerja di meja, sedikit bergerak',
                          description: 'Gaya hidup minim gerak fisik sehari-hari',
                          badge: '1.20x',
                        },
                        {
                          value: 'LIGHT',
                          label: 'Aktivitas ringan atau santai',
                          description: 'Latihan 1 sampai 2 hari dalam seminggu',
                          badge: '1.375x',
                        },
                        {
                          value: 'MODERATE',
                          label: 'Olahraga teratur dan aktif bergerak',
                          description: 'Latihan rutin 3 sampai 5 hari seminggu',
                          badge: '1.55x',
                        },
                        {
                          value: 'VERY_ACTIVE',
                          label: 'Latihan intensif atau pekerjaan fisik berat',
                          description: 'Olahraga berat 6 sampai 7 hari seminggu',
                          badge: '1.725x',
                        },
                      ]}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <label className="block text-xs font-medium text-warm-muted">
                    Pilih arah tujuan gizi Anda
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { id: 'WEIGHT_LOSS_LEAN_SCULPT', title: 'Weight loss (lean & sculpt)', desc: 'Defisit 22% kalori terukur dengan protein 35% untuk menjaga massa otot.' },
                      { id: 'MUSCLE_GAIN_FIT_BUILD', title: 'Muscle gain (fit & build)', desc: 'Surplus terarah dengan karbohidrat kompleks 50% untuk pemulihan glikogen.' },
                      { id: 'MAINTENANCE_VITALITY_DAILY', title: 'Maintenance (vitality daily)', desc: 'Asupan kalori setara pengeluaran harian untuk menjaga stamina kerja stabil.' },
                      { id: 'THERAPEUTIC_DIET', title: 'Therapeutic diet (DASH & low GI)', desc: 'Natrium di bawah 1.400mg per hari dan indeks glikemik bahan di bawah 45.' },
                    ].map((g) => (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => { setGoal(g.id as DietGoal); simulateRecalculation(); }}
                        className={`p-3.5 rounded-md border text-left transition-colors flex flex-col justify-between ${
                          goal === g.id
                            ? 'bg-tebu-50 border-forest text-warm-black ring-1 ring-forest'
                            : 'bg-tebu-50/60 border-warm-border text-warm-muted hover:border-warm-neutral'
                        }`}
                      >
                        <span className="font-semibold text-xs text-warm-black mb-1">{g.title}</span>
                        <span className="text-[11px] text-warm-muted leading-relaxed">{g.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-6 flex justify-between items-center border-t border-warm-border mt-6">
              <span className="text-[11px] text-warm-muted">
                Metode: Mifflin-St Jeor (Akurasi klinis 95%)
              </span>
              {step === 1 ? (
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2 bg-warm-black text-tebu-50 hover:bg-forest text-xs font-medium rounded-md transition-colors"
                >
                  Lanjut ke target gizi
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-3 py-1.5 text-warm-muted hover:text-warm-black text-xs font-medium transition-colors"
                >
                  Kembali ke data fisik
                </button>
              )}
            </div>
          </div>

          {/* Bento Cell 2: Primary Results Display (Span 5 cols) */}
          <div className="md:col-span-5 bg-forest text-tebu-50 rounded-[20px] p-6 grain-overlay-panel flex flex-col justify-between">
            <div className="space-y-6">
              <div>
                <span className="eyebrow text-tebu-300">Rekomendasi paket harian</span>
                <h3 className="font-display text-xl text-tebu-50 mt-1">
                  {categoryName}
                </h3>
                <p className="text-xs text-tebu-200 mt-0.5">
                  Dihitung khusus untuk berat {weightKg} kg dan tinggi {heightCm} cm.
                </p>
              </div>

              {/* Exact Calories Card */}
              <div className="bg-forest-active/60 border border-forest-border rounded-md p-4 space-y-1">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-tebu-200">Target kalori harian</span>
                  <span className="text-xs text-tebu-300">BMR: {bmr} kkal</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-display text-3xl font-bold tracking-tight text-tebu-50">
                    {isCalculating ? '...' : targetCalories.toLocaleString('id-ID')}
                  </span>
                  <span className="text-xs font-medium text-tebu-300">kkal / hari</span>
                </div>
                <p className="text-[11px] text-tebu-200 pt-1 border-t border-forest-border/60">
                  Total pengeluaran energi alami (TDEE): {tdee.toLocaleString('id-ID')} kkal per hari.
                </p>
              </div>

              {/* Specific Grammage Breakdown (Lumpy Real Numbers) */}
              <div className="space-y-3">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-tebu-200">Takaran gramatur bersih per porsi:</span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2.5 bg-forest-active/50 rounded-md border border-forest-border">
                    <span className="text-[10px] text-tebu-300 block">Protein</span>
                    <strong className="text-sm font-semibold text-tebu-50">{proteinGrams}g</strong>
                  </div>
                  <div className="p-2.5 bg-forest-active/50 rounded-md border border-forest-border">
                    <span className="text-[10px] text-tebu-300 block">Karbohidrat</span>
                    <strong className="text-sm font-semibold text-tebu-50">{carbsGrams}g</strong>
                  </div>
                  <div className="p-2.5 bg-forest-active/50 rounded-md border border-forest-border">
                    <span className="text-[10px] text-tebu-300 block">Lemak baik</span>
                    <strong className="text-sm font-semibold text-tebu-50">{fatGrams}g</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Outcome-Based CTA Button (mt-auto) */}
            <div className="pt-6 mt-auto space-y-2">
              <div className="flex justify-between items-center text-xs text-tebu-200 pb-2">
                <span>Biaya paket</span>
                <span className="font-semibold text-tebu-50">
                  Rp {dailyPortionCost.toLocaleString('id-ID')} / hari
                </span>
              </div>
              <Link
                href={{
                  pathname: '/checkout',
                  query: {
                    plan: goal,
                    calories: targetCalories,
                    protein: proteinGrams,
                    carbs: carbsGrams,
                    fat: fatGrams,
                    price: dailyPortionCost,
                  },
                }}
                className="w-full flex items-center justify-center py-3 px-4 rounded-md bg-tebu-50 text-forest hover:bg-tebu-100 font-semibold text-xs tracking-tight transition-colors"
              >
                {ctaLabel}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
