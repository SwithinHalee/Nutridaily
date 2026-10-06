'use client';

import React from 'react';

type CarouselImage = {
  src: string;
  alt: string;
};

type HeroCarouselProps = {
  columnOne: CarouselImage[];
  columnTwo: CarouselImage[];
};

const LOOP_MS = 26000;
const MIN_PX_PER_SEC = 30;

function useRafMarquee(
  trackRef: React.RefObject<HTMLDivElement>,
  direction: 'down' | 'up',
) {
  const offsetRef = React.useRef(0);
  const halfRef = React.useRef(0);

  React.useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const measure = () => {
      const half = track.scrollHeight / 2;
      if (half > 0) halfRef.current = half;
    };
    measure();

    const onLoad = () => measure();
    const imgs = Array.from(track.querySelectorAll('img'));
    imgs.forEach((img) => {
      if (img.complete) return;
      img.addEventListener('load', onLoad);
      img.addEventListener('error', onLoad);
    });

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(measure);
      resizeObserver.observe(track);
    }
    window.addEventListener('resize', measure);
    window.addEventListener('orientationchange', measure);
    const remeasureTimer = window.setInterval(measure, 500);

    let raf = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(now - last, 50);
      last = now;
      if (halfRef.current <= 0) measure();
      const half = halfRef.current;

      if (half > 0) {
        const speed = Math.max(half / LOOP_MS, MIN_PX_PER_SEC / 1000);
        offsetRef.current = (offsetRef.current + speed * dt) % half;
        const y =
          direction === 'up'
            ? -offsetRef.current
            : offsetRef.current - half;
        track.style.transform = `translate3d(0, ${y}px, 0)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.clearInterval(remeasureTimer);
      window.removeEventListener('resize', measure);
      window.removeEventListener('orientationchange', measure);
      resizeObserver?.disconnect();
      imgs.forEach((img) => {
        img.removeEventListener('load', onLoad);
        img.removeEventListener('error', onLoad);
      });
    };
  }, [direction, trackRef]);
}

function CarouselColumn({
  images,
  direction,
  label,
}: {
  images: CarouselImage[];
  direction: 'down' | 'up';
  label: string;
}) {
  const trackRef = React.useRef<HTMLDivElement>(null);
  useRafMarquee(trackRef, direction);

  const doubled = [...images, ...images];
  return (
    <div className="overflow-hidden h-full" role="group" aria-label={label}>
      <div ref={trackRef} style={{ willChange: 'transform', backfaceVisibility: 'hidden' }}>
        {doubled.map((item, idx) => {
          const isDuplicate = idx >= images.length;
          return (
            <div key={`${direction}-${idx}`} className="pb-3.5 md:pb-4">
              <div className="relative aspect-[4/5] w-full rounded-2xl overflow-hidden border border-warm-border/80 bg-tebu-200 shadow-natural">
                <img
                  src={item.src}
                  alt={isDuplicate ? '' : item.alt}
                  aria-hidden={isDuplicate ? true : undefined}
                  tabIndex={isDuplicate ? -1 : undefined}
                  className="w-full h-full object-cover bg-tebu-200"
                  loading="eager"
                  decoding="async"
                  draggable={false}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function HeroCarousel({ columnOne, columnTwo }: HeroCarouselProps) {
  return (
    <div className="relative h-full min-h-[460px] lg:min-h-full overflow-hidden pr-3 md:pr-4">
      <div className="grid grid-cols-2 gap-3.5 md:gap-4 h-full overflow-hidden">
        <CarouselColumn
          images={columnOne}
          direction="down"
          label="Galeri menu sehat kolom satu"
        />
        <CarouselColumn
          images={columnTwo}
          direction="up"
          label="Galeri menu sehat kolom dua"
        />
      </div>
    </div>
  );
}
