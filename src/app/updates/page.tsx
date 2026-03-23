import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Updates",
  description: "Latest notices, announcements, and season updates.",
};

const updates = [
  {
    month: "March 2026",
    title: "Website launch",
    text: "The new Imperial Golf Society website is live, giving members a central place for fixtures, updates, results, and society information throughout the season.",
  },
  {
    month: "April 2026",
    title: "Season gets under way",
    text: "The first outing of the year is on April 19, with the society returning to its regular monthly Sunday format for the season ahead.",
  },
  {
    month: "Season format",
    title: "Monthly golf with key days to look forward to",
    text: "Alongside the regular outings, notable dates in the calendar include the first outing, Freddie's Day, Official Imperial Sponsored Outing, and Captain's Weekend in September.",
  },
];

export default function UpdatesPage() {
  return (
    <main className="pb-8 sm:pb-12">
      <section className="bg-[var(--brand-dark)] px-4 py-8 text-stone-50 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-200/80">
            Updates
          </p>
          <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">
            Latest notices from the society
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-stone-100/85 sm:text-base">
            This page is the running noticeboard for members, covering outing
            announcements, society news, special event details, and anything else
            members need to know during the season.
          </p>
        </div>
      </section>

      <section className="mx-auto mt-6 grid max-w-6xl gap-4 px-4 sm:mt-8 sm:gap-6 sm:px-6">
        {updates.map((update) => (
          <article
            key={update.title}
            className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm"
          >
            <p className="text-sm font-medium text-[var(--brand)]">{update.month}</p>
            <h2 className="mt-2 text-xl font-semibold text-[var(--brand-dark)]">
              {update.title}
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-700 sm:text-base">
              {update.text}
            </p>
          </article>
        ))}
      </section>
    </main>
  );
}
