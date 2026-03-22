import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Results",
  description: "Latest event results and season standings.",
};

const results = [
  {
    event: "Monthly outing results",
    status: "Coming soon",
    summary: "Results from each outing will be posted here after every society Sunday, including winners, prize highlights, and the player who picks up the numpty prize.",
  },
  {
    event: "Season standings",
    status: "Planned",
    summary: "This page will also track the season as it develops, giving members a clear view of who is performing well across the year.",
  },
  {
    event: "Captain's Weekend recap",
    status: "Planned",
    summary: "When the September trip is complete, this is where the weekend scores, highlights, and stories from the annual away trip can live.",
  },
];

export default function ResultsPage() {
  return (
    <main className="pb-8 sm:pb-12">
      <section className="bg-[var(--brand-dark)] px-4 py-8 text-stone-50 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-200/80">
            Results
          </p>
          <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">
            Results and standings
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-stone-100/85 sm:text-base">
            Imperial Golf Society plays a Stableford format that gives everyone a
            chance, whether they play off scratch or are carrying a handicap of
            35 and above.
          </p>
        </div>
      </section>

      <section className="mx-auto mt-6 grid max-w-6xl gap-4 px-4 sm:mt-8 sm:gap-6 sm:px-6">
        {results.map((item) => (
          <article
            key={item.event}
            className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-semibold text-[var(--brand-dark)]">
                {item.event}
              </h2>
              <span className="rounded-full bg-[var(--surface-strong)] px-3 py-1 text-sm font-medium text-[var(--brand)]">
                {item.status}
              </span>
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-700 sm:text-base">
              {item.summary}
            </p>
          </article>
        ))}
      </section>
    </main>
  );
}
