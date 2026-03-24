import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import Image from "next/image";
import FixtureImageLink from "@/components/FixtureImageLink";
import { fixtures as fixturePresentation } from "@/lib/fixtures-data";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Fixtures",
  description: "Upcoming society events and key dates.",
};

const previousSponsors = [
  {
    id: "imperial-bar",
    name: "Imperial Bar",
    logoSrc: "/imperial_Sponsor.png",
    logoAlt: "Imperial Bar sponsor logo",
    contribution: "Official sponsor and affiliated bar of Imperial Golf Society",
    sponsorUrl:
      "https://www.google.com/search?q=Imperial+Bar+Bangor+Northern+Ireland",
  },
  {
    id: "irvines-butchers",
    name: "Irvine's Butchers",
    logoSrc: "/irvinesbutchers_sponsor.png",
    logoAlt: "Irvine's Butchers sponsor logo",
    contribution: "Supporter of society outing prizes",
    sponsorUrl: "https://irvinesbutchery.co.uk/",
  },
];

function formatFixtureDate(date: Date) {
  return date.toLocaleDateString("en-GB", {
    month: "long",
    day: "numeric",
  });
}

export default async function FixturesPage() {
  const outings: Array<
    Prisma.OutingGetPayload<{
      include: {
        course: true;
      };
    }>
  > = await prisma.outing.findMany({
    orderBy: { outingDate: "asc" },
    include: {
      course: true,
    },
  });

  const fixtures = outings.map((outing) => {
    const presentation = fixturePresentation.find(
      (fixture) => fixture.id === outing.sourceFixtureId,
    );

    return {
      id: outing.id,
      title: outing.title,
      date: formatFixtureDate(outing.outingDate),
      course: outing.course.name,
      courseWebsiteUrl: outing.course.websiteUrl ?? "#",
      teeTime: outing.teeTime ?? "TBC",
      imageSrc: outing.imageSrc ?? presentation?.imageSrc ?? "/bangor.jpg",
      imageAlt: outing.imageAlt ?? presentation?.imageAlt ?? outing.course.name,
      mapsUrl: outing.course.mapsUrl ?? "#",
      sponsorName: outing.sponsorName ?? presentation?.sponsorName ?? "Sponsor TBC",
      sponsorUrl: outing.sponsorUrl ?? presentation?.sponsorUrl ?? "#",
      featured: outing.featured || presentation?.featured || false,
    };
  });

  return (
    <main className="pb-8 sm:pb-12">
      <section className="bg-[var(--brand-dark)] px-4 py-8 text-stone-50 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-200/80">
            Fixtures
          </p>
          <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">
            Upcoming society events 2026
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-stone-100/85 sm:text-base">
            Outings are typically around {"\u00A3"}50 including a meal, with a lower
            option for anyone skipping the meal afterwards.
          </p>
        </div>
      </section>

      <section className="mx-auto mt-6 grid max-w-6xl gap-4 px-4 sm:mt-8 sm:grid-cols-2 sm:gap-6 sm:px-6 lg:grid-cols-3">
        {fixtures.map((fixture) => (
          <article
            key={fixture.id}
            className={`overflow-hidden rounded-[1.75rem] ring-1 ${
              fixture.featured
                ? "bg-[linear-gradient(180deg,_#f3e1ae_0%,_#efe1bd_100%)] ring-[color:color-mix(in_srgb,var(--accent)_65%,#7a6134)] shadow-[0_18px_40px_rgba(122,97,52,0.18)] sm:col-span-2 lg:col-span-2"
                : "bg-[var(--surface-strong)] ring-[var(--border)]"
            }`}
          >
            <div className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  {fixture.featured ? (
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--brand)]">
                      Featured Event
                    </p>
                  ) : null}
                  <h2 className="text-xl font-semibold text-[var(--brand-dark)]">
                    {fixture.title}
                  </h2>
                </div>
                <p className="text-sm font-medium text-slate-700">{fixture.date}</p>
              </div>
              <FixtureImageLink
                course={fixture.course}
                imageAlt={fixture.imageAlt}
                imageSrc={fixture.imageSrc}
                websiteUrl={fixture.courseWebsiteUrl}
              />
              <div className="mt-5 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Location
                  </p>
                  <a
                    href={fixture.mapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-flex items-center gap-2 text-sm font-medium text-[var(--brand-dark)] underline decoration-[var(--brand)]/35 underline-offset-4"
                  >
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      className="h-4 w-4 shrink-0 fill-current"
                    >
                      <path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12Zm0-9.5A2.5 2.5 0 1 1 12 7a2.5 2.5 0 0 1 0 5.5Z" />
                    </svg>
                    <span>{fixture.course}</span>
                  </a>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Tee Off
                  </p>
                  <p className="mt-1 text-sm font-medium text-[var(--brand-dark)]">
                    {fixture.teeTime}
                  </p>
                </div>
              </div>
            </div>
            <div
              className={`border-t px-6 py-4 ${
                fixture.featured
                  ? "border-black/8 bg-black/4"
                  : "border-[var(--border)] bg-white/20"
              }`}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Sponsor
              </p>
              <a
                href={fixture.sponsorUrl}
                target={fixture.sponsorUrl === "#" ? undefined : "_blank"}
                rel={fixture.sponsorUrl === "#" ? undefined : "noreferrer"}
                className="mt-1 inline-flex text-sm font-medium text-[var(--brand-dark)] underline decoration-[var(--brand)]/35 underline-offset-4"
              >
                {fixture.sponsorName}
              </a>
            </div>
          </article>
        ))}
      </section>

      <section className="mx-auto mt-10 max-w-6xl px-4 sm:mt-12 sm:px-6">
        <div className="rounded-[2rem] bg-[linear-gradient(180deg,_rgba(16,51,37,0.96)_0%,_rgba(13,39,29,0.98)_100%)] px-6 py-8 text-stone-50 shadow-[0_24px_60px_rgba(8,24,18,0.24)] sm:px-8 sm:py-10">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-200/80">
            Previous Sponsors
          </p>
          <h2 className="mt-3 text-2xl font-semibold sm:text-3xl">
            Sponsors who help fund our outing prizes
          </h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-stone-100/80 sm:text-base">
            Our sponsors help make each outing a bit more special by contributing
            towards the prizes on the day. Imperial Bar is our official sponsor
            and affiliated bar, and we&apos;re grateful for every business and
            supporter that backs the society season after season.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {previousSponsors.map((sponsor) => (
              <article
                key={sponsor.id}
                className="rounded-[1.5rem] border border-white/10 bg-white/8 p-5 backdrop-blur-sm"
              >
                <a
                  href={sponsor.sponsorUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Visit ${sponsor.name}`}
                  className="block"
                >
                  <div className="flex min-h-36 items-center justify-center transition duration-300 hover:scale-[1.02]">
                    <Image
                      src={sponsor.logoSrc}
                      alt={sponsor.logoAlt}
                      width={320}
                      height={180}
                      className="h-auto max-h-28 w-auto max-w-full object-contain"
                    />
                  </div>
                </a>
                <p className="mt-4 text-base font-semibold text-stone-50">
                  {sponsor.name}
                </p>
                <p className="mt-2 text-sm leading-6 text-stone-100/75">
                  {sponsor.contribution}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
