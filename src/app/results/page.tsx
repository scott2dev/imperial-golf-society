import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Results",
  description: "Published outing results and prize summaries.",
};

type PublishedOuting = {
  id: string;
  title: string;
  outingDate: Date;
  resultsPublishedAt: Date | null;
  course: {
    name: string;
  };
};

export default async function ResultsPage() {
  const publishedOutings: PublishedOuting[] = await prisma.outing.findMany({
    where: {
      resultsPublishedAt: {
        not: null,
      },
    },
    orderBy: {
      outingDate: "desc",
    },
    include: {
      course: true,
    },
  });

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
            Published results from each outing will appear here once the captain
            has completed the presentation and shared them with the society.
          </p>
        </div>
      </section>

      <section className="mx-auto mt-6 grid max-w-6xl gap-4 px-4 sm:mt-8 sm:gap-6 sm:px-6">
        {publishedOutings.length === 0 ? (
          <article className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-[var(--brand-dark)]">
              Results coming soon
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-700 sm:text-base">
              As soon as an outing has been presented and published, you will be
              able to review the prize winners and full scorecards here.
            </p>
          </article>
        ) : (
          publishedOutings.map((outing) => (
            <article
              key={outing.id}
              className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-[var(--brand-dark)]">
                    {outing.title}
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    {new Date(outing.outingDate).toLocaleDateString("en-GB", {
                      dateStyle: "medium",
                    })}{" "}
                    at {outing.course.name}
                  </p>
                </div>
                <span className="rounded-full bg-[var(--surface-strong)] px-3 py-1 text-sm font-medium text-[var(--brand)]">
                  Published
                </span>
              </div>
              <p className="mt-4 text-sm leading-7 text-slate-700 sm:text-base">
                View the prize summary, final standings, and signed scorecards
                for this outing.
              </p>
              <Link
                href={`/results/${outing.id}`}
                className="mt-5 inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--brand-dark)] transition hover:bg-[var(--surface-strong)]"
              >
                Open results
              </Link>
            </article>
          ))
        )}
      </section>
    </main>
  );
}
