import type { Metadata } from "next";
import AboutImageCarousel from "@/components/about/AboutImageCarousel";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "About",
  description: "About Imperial Golf Society and its purpose.",
};

type AboutCarouselImage = {
  id: string;
  imageData: string;
  tagline: string;
};

export default async function AboutPage() {
  const storedCarouselImages: AboutCarouselImage[] = await prisma.aboutCarouselImage.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  const carouselSlides = [
    {
      id: "imperial-bar-default",
      imageSrc: "/imperial_Sponsor.png",
      tagline: "Imperial Bar remains at the heart of the society.",
      fit: "contain" as const,
    },
    ...storedCarouselImages.map((image) => ({
      id: image.id,
      imageSrc: image.imageData,
      tagline: image.tagline,
    })),
  ];

  return (
    <main className="pb-8 sm:pb-12">
      <section className="bg-[var(--brand-dark)] px-4 py-8 text-stone-50 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-200/80">
            About
          </p>
          <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">
            About Imperial Golf Society
          </h1>
          <div className="mt-6">
            <AboutImageCarousel slides={carouselSlides} />
          </div>
          <p className="mt-6 text-sm leading-7 text-stone-100/85 sm:text-base">
            Imperial Golf Society is associated with Imperial Bar in Bangor,
            Northern Ireland. While many members are based in and around Bangor,
            the society also includes players coming from further afield each
            season.
          </p>
          <p className="mt-4 text-sm leading-7 text-stone-100/85 sm:text-base">
            The membership spans a wide range of ages, from golfers in their
            twenties through to pensioners, and the mix of handicaps means there
            is a place for everyone. The golf is competitive, but the social
            side is just as important.
          </p>
          <p className="mt-4 text-sm leading-7 text-stone-100/85 sm:text-base">
            Many members enjoy staying on for food and drinks after the round,
            and a number also play in extra events hosted by local clubs, with
            Bangor Golf Club featuring heavily among the membership.
          </p>
        </div>
      </section>

      <section className="mx-auto mt-6 max-w-6xl px-4 sm:mt-8 sm:px-6">
        <div className="bg-[var(--brand-dark)] p-6 text-stone-50 shadow-sm sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-200/80">
            Society Details
          </p>
          <p className="mt-4 text-sm leading-7 text-stone-100/85 sm:text-base">
            Membership is {"\u00A3"}30 for the year, with outings usually costing
            around {"\u00A3"}50 including a meal afterwards. Members can pay less
            if they prefer to skip the meal, and every outing brings prizes to
            play for, including the ever-present numpty prize for last place.
          </p>
        </div>
      </section>

      <section id="contact" className="mx-auto mt-6 max-w-6xl px-4 sm:mt-8 sm:px-6">
        <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--brand)]">
            Contact
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-[var(--brand-dark)] sm:text-3xl">
            Get in touch with the society
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-700 sm:text-base">
            For membership enquiries, event questions, annual fees, or general
            information about the society, use the contact details below.
          </p>

          <div className="mt-6">
            <div className="min-w-0 rounded-[1.5rem] bg-[var(--surface-strong)] p-5 ring-1 ring-[var(--border)]">
              <p className="text-sm font-medium text-slate-500">Email</p>
              <a
                href="mailto:contact@imperialgolfsociety.co.uk"
                className="mt-2 block break-all text-lg font-semibold text-[var(--brand-dark)]"
              >
                contact@imperialgolfsociety.co.uk
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
