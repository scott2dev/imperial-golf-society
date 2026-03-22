import Image from "next/image";
import { Cormorant_Garamond } from "next/font/google";

const heroTitleFont = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600"],
});

export default function HomePage() {
  return (
    <main data-homepage="true">
      <section className="relative isolate flex h-screen min-h-screen items-center overflow-hidden bg-[linear-gradient(135deg,_#0d1f18_0%,_#153527_45%,_#7a6134_100%)] text-stone-50">
        <video
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
        >
          <source src="/hero-video.mp4" type="video/mp4" />
        </video>

        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(202,163,93,0.28),_transparent_35%)]" />

        <div className="relative z-10 mx-auto flex w-full max-w-6xl justify-center px-4 py-10 text-center sm:px-6">
          <div className="max-w-3xl">
            <Image
              src="/bangoremblem.png"
              alt="Bangor emblem"
              width={360}
              height={360}
              className="mx-auto mb-2 h-80 w-80 object-contain sm:mb-3 sm:h-[22rem] sm:w-[22rem]"
              priority
            />
            <h1
              className={`${heroTitleFont.className} text-5xl font-semibold tracking-[0.04em] text-white sm:text-7xl lg:text-8xl`}
            >
              Imperial Golf Society
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-stone-100/85 sm:text-base">
              Based out of Imperial Bar in Bangor, with Sunday golf, prizes,
              and Captain's Weekend in September.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
