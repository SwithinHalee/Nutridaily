'use client';

import React from 'react';
import { ArrowRight, Check, Utensils } from 'lucide-react';
import TdeeCalculator from '@/components/tdee-calculator';
import MenuSwapper from '@/components/menu-swapper';
import CleanLabelCard from '@/components/clean-label-card';
import HeroCarousel from '@/components/hero-carousel';

const CAROUSEL_IMAGES_1 = [
  { src: '/images/meals/salmon_meal.jpg', alt: 'Sous-vide Atlantic salmon' },
  { src: '/images/meals/wagyu_striploin.jpg', alt: 'Daging wagyu striploin bakar chimichurri' },
  { src: '/images/meals/chicken_rujak.jpg', alt: 'Dada ayam bakar bumbu rujak' },
  { src: '/images/meals/salmon_rosemary.jpg', alt: 'Atlantic salmon panggang rosemary' },
];

const CAROUSEL_IMAGES_2 = [
  { src: '/images/meals/wagyu_meal.jpg', alt: 'Wagyu rump MB9 mashed cauliflower' },
  { src: '/images/meals/chicken_matah.jpg', alt: 'Dada ayam suwir sambal matah kecombrang' },
  { src: '/images/meals/chicken_meal.jpg', alt: 'Dada ayam probiotik kuah rempah' },
  { src: '/images/meals/wagyu_striploin.jpg', alt: 'Wagyu chimichurri dengan jagung manis' },
];

export default function HomePage() {
  return (
    <div className="space-y-4">
      {/* Hero Section: Clean Balanced Layout with Full-Bleed Right Edge Carousel, Aligned Flush with Bottom Horizontal Border */}
      <section className="mt-3 md:mt-0 min-h-[calc(102dvh-5rem)] lg:h-[calc(100dvh-5rem)] border-b border-warm-border overflow-hidden flex flex-col justify-end">
        {/* Top Hero Row: Left column aligned to site container, Right column stretching to right screen edge */}
        <div className="w-full h-full flex-1">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-stretch h-full">
            {/* Left Column: Headline, Copy, Action, and Stats (With calculated padding matching max-w-6xl container) */}
            <div className="lg:col-span-6 xl:col-span-6 pl-4 md:pl-6 lg:pl-[max(1.5rem,calc((100vw-72rem)/2+1.5rem))] pr-4 md:pr-6 py-8 sm:py-10 lg:py-12 space-y-4 sm:space-y-5 lg:space-y-6 flex flex-col justify-center my-auto">
              <div className="space-y-3 sm:space-y-4">

                <h1 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-[34px] xl:text-[40px] text-warm-black tracking-tight leading-[1.18] text-balance">
                  Makanan sehat berstandar restoran. Diukur presisi per gram gizi.
                </h1>

                <p className="text-xs sm:text-sm md:text-base lg:text-[14.5px] text-warm-muted leading-relaxed text-pretty max-w-xl">
                  NutriDaily menakar setiap gram protein, karbohidrat kompleks, dan serat sesuai target metabolisme tubuh Anda. Dimasak segar setiap pagi dengan bumbu rempah asli tanpa MSG sintetis atau pengawet kimia, siap santap sebelum jam makan siang.
                </p>

                {/* Outcome-Based CTAs */}
                <div className="pt-1 flex flex-wrap items-center gap-3">
                  <a
                    href="#calculator"
                    className="px-5 py-2.5 sm:py-3 rounded-md bg-forest hover:bg-forest-hover text-tebu-50 text-xs font-semibold tracking-tight transition-colors flex items-center gap-2 shadow-natural"
                  >
                    <span>Hitung kebutuhan kalori TDEE</span>
                    <ArrowRight className="w-4 h-4" />
                  </a>
                  <a
                    href="#menu-catalog"
                    className="px-5 py-2.5 sm:py-3 rounded-md bg-warm-surface border border-warm-border hover:bg-tebu-100 text-warm-black text-xs font-semibold tracking-tight transition-colors flex items-center gap-2"
                  >
                    <Utensils className="w-3.5 h-3.5 text-forest" />
                    <span>Lihat rotasi 60 menu</span>
                  </a>
                </div>

                {/* Reassurance micro-badges */}
                <div className="pt-0.5 flex flex-wrap items-center gap-y-1.5 gap-x-4 text-[10.5px] sm:text-[11px] text-warm-neutral font-medium">
                  <span className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-forest shrink-0" />
                    <span>Paket fleksibel 5 hari</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-forest shrink-0" />
                    <span>Bebas jeda sampai 20.00 WIB</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-forest shrink-0" />
                    <span>Tanpa kontrak mengikat</span>
                  </span>
                </div>
              </div>

              {/* Lumpy Real Numbers & Specific Facts */}
              <div className="pt-4 sm:pt-5 border-t border-warm-border grid grid-cols-3 gap-3 md:gap-4 text-left">
                <div>
                  <span className="font-display font-bold text-lg sm:text-xl md:text-2xl text-warm-black block">1.842 pax</span>
                  <p className="text-[10px] sm:text-[11px] text-warm-muted mt-0.5">Pelanggan aktif mingguan</p>
                </div>
                <div>
                  <span className="font-display font-bold text-lg sm:text-xl md:text-2xl text-warm-black block">± 4.2 gram</span>
                  <p className="text-[10px] sm:text-[11px] text-warm-muted mt-0.5">Toleransi timbangan digital</p>
                </div>
                <div>
                  <span className="font-display font-bold text-lg sm:text-xl md:text-2xl text-warm-black block">4.9 / 5.0</span>
                  <p className="text-[10px] sm:text-[11px] text-warm-muted mt-0.5">Ulasan kepuasan rasa</p>
                </div>
              </div>
            </div>

            {/* Right Column: Pure Food Images Dual-Column Carousel aligned flush to bottom horizontal border */}
            <div className="lg:col-span-6 xl:col-span-6 relative h-[500px] sm:h-[580px] lg:h-full lg:min-h-full min-h-[460px] self-stretch -mt-2 md:-mt-3 lg:-mt-0">
              <HeroCarousel columnOne={CAROUSEL_IMAGES_1} columnTwo={CAROUSEL_IMAGES_2} />
            </div>
          </div>
        </div>
      </section>

      {/* Bespoke Component 1: Bento-Grid TDEE Calculator */}
      <TdeeCalculator />

      {/* Bespoke Component 2: Weekly Menu Swapper Grid with Food Photography */}
      <MenuSwapper />

      {/* Bespoke Component 3: Tactile Clean Label Verification Ticket with Box Photo */}
      <CleanLabelCard />
    </div>
  );
}
