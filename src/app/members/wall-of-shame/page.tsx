import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Wall Of Shame",
  description: "A gallery of previous numpty prize winners.",
};

type WallOfShameImage = {
  id: string;
  imageData: string;
  tagline: string;
  photoDate: Date | null;
  location: string | null;
};

export default async function WallOfShamePage() {
  const images: WallOfShameImage[] = await prisma.wallOfShameImage.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  return (
    <main className="pb-8 sm:pb-12">
      <section className="bg-[var(--brand-dark)] px-4 py-8 text-stone-50 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-200/80">
            Members
          </p>
          <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">Wall Of Shame</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-stone-100/85 sm:text-base">
            A respectful record of numpty prize moments, bunker disasters, and
            the occasional unforgettable collapse coming home.
          </p>
          <div className="mt-6">
            <Link
              href="/members"
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/16"
            >
              Back to members
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-6 max-w-6xl px-4 sm:mt-8 sm:px-6">
        {images.length === 0 ? (
          <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm sm:p-8">
            <p className="text-sm text-slate-700">
              No wall of shame images have been added yet.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {images.map((image) => (
              <article
                key={image.id}
                className="overflow-hidden rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface)] shadow-sm"
              >
                <img
                  src={image.imageData}
                  alt={image.tagline}
                  className="aspect-[4/5] w-full object-cover"
                />
                <div className="border-t border-[var(--border)] bg-[var(--surface-strong)] px-5 py-4">
                  {image.photoDate || image.location ? (
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--brand)]">
                      {[
                        image.photoDate
                          ? new Date(image.photoDate).toLocaleDateString("en-GB", {
                              dateStyle: "medium",
                            })
                          : null,
                        image.location,
                      ]
                        .filter(Boolean)
                        .join(" • ")}
                    </p>
                  ) : null}
                  <p className="text-sm font-medium leading-6 text-[var(--brand-dark)]">
                    {image.tagline}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
