"use client";

import Image from "next/image";
import { useEffect, useEffectEvent, useRef, useState } from "react";

type FixtureImageLinkProps = {
  course: string;
  imageAlt?: string;
  imageSrc: string;
  websiteUrl: string;
};

function formatDomain(url: string) {
  return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

export default function FixtureImageLink({
  course,
  imageAlt,
  imageSrc,
  websiteUrl,
}: FixtureImageLinkProps) {
  const [showBanner, setShowBanner] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleScroll = useEffectEvent(() => {
    setShowBanner(true);

    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
    }

    hideTimerRef.current = setTimeout(() => {
      setShowBanner(false);
    }, 700);
  });

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);

      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
    };
  }, []);

  return (
    <a
      href={websiteUrl}
      target="_blank"
      rel="noreferrer"
      aria-label={`Visit ${course} website`}
      className="group relative mt-5 block overflow-hidden rounded-[1.25rem]"
    >
      <Image
        src={imageSrc}
        alt={imageAlt ?? course}
        width={1200}
        height={720}
        className="h-44 w-full object-cover transition duration-300 group-hover:scale-[1.02]"
      />
      <div
        className={`pointer-events-none absolute inset-x-0 bottom-0 bg-[linear-gradient(180deg,rgba(10,23,18,0)_0%,rgba(10,23,18,0.72)_100%)] px-4 py-3 text-sm font-medium tracking-[0.08em] text-stone-50 transition-opacity duration-500 ${
          showBanner ? "opacity-100" : "opacity-0"
        }`}
      >
        {formatDomain(websiteUrl)}
      </div>
    </a>
  );
}
