import type { Metadata } from "next";
import Link from "next/link";
import { requireTreasurer } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Treasurer Portal",
  description: "Treasurer tools for membership and outing payments.",
};

export default async function TreasurerPortalPage() {
  const { user } = await requireTreasurer();

  return (
    <main className="pb-8 sm:pb-12">
      <section className="bg-[var(--brand-dark)] px-4 py-8 text-stone-50 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-5xl">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-200/80">
            Treasurer Portal
          </p>
          <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">
            Welcome, {user.name}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-stone-100/85 sm:text-base">
            This area is reserved for membership fees, outing payments, and keeping
            the season accounts in order.
          </p>
        </div>
      </section>

      <section className="mx-auto mt-6 max-w-5xl px-4 sm:mt-8 sm:px-6">
        <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
            Coming Soon
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-[var(--brand-dark)]">
            Treasurer tools are being prepared
          </h2>
          <p className="mt-4 text-sm leading-7 text-slate-700 sm:text-base">
            The next update here will track who has paid membership fees, who has
            paid for each outing, and what is still outstanding.
          </p>
          <Link
            href="/portal"
            className="mt-6 inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--brand-dark)] transition hover:bg-[var(--surface-strong)]"
          >
            Back to portal
          </Link>
        </div>
      </section>
    </main>
  );
}
