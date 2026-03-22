import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Fixtures",
  description: "Upcoming society events and key dates.",
};

const fixtures = [
  {
    id: "first-outing-april-19",
    title: "First Outing",
    date: "April 19",
    course: "Kirkistown",
    teeTime: "11.00am",
    imageSrc: "/kirkistown.jpg",
    imageAlt: "Kirkistown Castle Golf Club",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Kirkistown+Castle+Golf+Club",
    sponsorName: "Sponsor TBC",
    sponsorUrl: "#",
  },
  {
    id: "monthly-outing-may-31",
    title: "Monthly Outing",
    date: "May 31",
    course: "Lurgan",
    teeTime: "12.30pm",
    imageSrc: "/lurgan.webp",
    imageAlt: "Lurgan Golf Club",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Lurgan+Golf+Club",
    sponsorName: "Sponsor TBC",
    sponsorUrl: "#",
  },
  {
    id: "monthly-outing-june-28",
    title: "Monthly Outing",
    date: "June 28",
    course: "Clandeboye",
    teeTime: "10.58am",
    imageSrc: "/Clandeboye.jpg",
    imageAlt: "Clandeboye Golf Club",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Clandeboye+Golf+Club",
    sponsorName: "Sponsor TBC",
    sponsorUrl: "#",
  },
  {
    id: "monthly-outing-july-26",
    title: "Monthly Outing",
    date: "July 26",
    course: "Cairndhu",
    teeTime: "10.30am",
    imageSrc: "/cairndhu.jpg",
    imageAlt: "Cairndhu Golf Club",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Cairndhu+Golf+Club",
    sponsorName: "Sponsor TBC",
    sponsorUrl: "#",
  },
  {
    id: "monthly-outing-august-23",
    title: "Monthly Outing",
    date: "August 23",
    course: "Dunmurry",
    teeTime: "11.04am",
    imageSrc: "/dunmurry.jpg",
    imageAlt: "Dunmurry Golf Club",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Dunmurry+Golf+Club",
    sponsorName: "Sponsor TBC",
    sponsorUrl: "#",
  },
  {
    id: "captains-weekend-september-26-27",
    title: "Captain's Weekend",
    date: "Sept 26 & 27",
    course: "Slieve Russell",
    teeTime: "11.00am both days",
    featured: true,
    imageSrc: "/slieverussell.jpg",
    imageAlt: "Slieve Russell golf course",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Slieve+Russell+Hotel+Golf+%26+Country+Club",
    sponsorName: "Sponsor TBC",
    sponsorUrl: "#",
  },
  {
    id: "october-bangor-tbc",
    title: "October Outing",
    date: "October",
    course: "Bangor",
    teeTime: "TBC",
    imageSrc: "/bangor.jpg",
    imageAlt: "Bangor Golf Club",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Bangor+Golf+Club",
    sponsorName: "Sponsor TBC",
    sponsorUrl: "#",
  },
];

export default function FixturesPage() {
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
              {fixture.imageSrc ? (
                <div className="mt-5 overflow-hidden rounded-[1.25rem]">
                  <Image
                    src={fixture.imageSrc}
                    alt={fixture.imageAlt ?? fixture.course}
                    width={1200}
                    height={720}
                    className="h-44 w-full object-cover"
                  />
                </div>
              ) : null}
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
    </main>
  );
}
