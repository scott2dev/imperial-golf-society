"use client";

import { useEffect, useState } from "react";

type AboutCarouselSlide = {
  id: string;
  imageSrc: string;
  tagline: string;
};

type AboutImageCarouselProps = {
  slides: AboutCarouselSlide[];
};

export default function AboutImageCarousel({ slides }: AboutImageCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) {
      return;
    }

    const interval = window.setInterval(() => {
      setActiveIndex((currentIndex) => (currentIndex + 1) % slides.length);
    }, 5000);

    return () => window.clearInterval(interval);
  }, [slides.length]);

  const activeSlide = slides[activeIndex];

  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-black/10">
      <div className="relative aspect-[4/3] sm:aspect-[5/3] lg:aspect-[16/9]">
        <img
          src={activeSlide.imageSrc}
          alt={activeSlide.tagline}
          className="h-full w-full object-cover"
        />

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/45 to-transparent px-5 pb-5 pt-10 text-stone-50">
          <p className="text-sm font-medium leading-6 sm:text-base">{activeSlide.tagline}</p>
        </div>

        {slides.length > 1 ? (
          <>
            <button
              type="button"
              aria-label="Previous image"
              onClick={() =>
                setActiveIndex((currentIndex) =>
                  currentIndex === 0 ? slides.length - 1 : currentIndex - 1,
                )
              }
              className="absolute left-4 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white transition hover:bg-black/60"
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="Next image"
              onClick={() =>
                setActiveIndex((currentIndex) => (currentIndex + 1) % slides.length)
              }
              className="absolute right-4 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white transition hover:bg-black/60"
            >
              ›
            </button>
          </>
        ) : null}
      </div>

      {slides.length > 1 ? (
        <div className="flex items-center justify-center gap-2 bg-[var(--surface-strong)] px-4 py-3">
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              aria-label={`Go to image ${index + 1}`}
              onClick={() => setActiveIndex(index)}
              className={`h-2.5 rounded-full transition ${
                index === activeIndex ? "w-8 bg-[var(--brand)]" : "w-2.5 bg-slate-300"
              }`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
