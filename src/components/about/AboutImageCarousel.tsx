"use client";

import { useEffect, useState } from "react";

type AboutCarouselSlide = {
  id: string;
  imageSrc: string;
  tagline: string;
  fit?: "cover" | "contain";
  imageClassName?: string;
  frameClassName?: string;
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
      <div
        className={`relative aspect-[4/3] sm:aspect-[5/3] lg:aspect-[16/9] ${
          activeSlide.frameClassName ?? ""
        }`}
      >
        <img
          src={activeSlide.imageSrc}
          alt={activeSlide.tagline}
          className={`${activeSlide.imageClassName ?? ""} h-full w-full ${
            activeSlide.fit === "contain" ? "object-contain p-4 sm:p-6" : "object-cover"
          }`}
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
              className="absolute inset-y-0 left-0 w-1/4 cursor-w-resize"
            />
            <button
              type="button"
              aria-label="Next image"
              onClick={() =>
                setActiveIndex((currentIndex) => (currentIndex + 1) % slides.length)
              }
              className="absolute inset-y-0 right-0 w-1/4 cursor-e-resize"
            />
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
