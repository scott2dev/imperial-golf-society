import type { Metadata } from "next";
import Link from "next/link";
import { requireSecretary } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Secretary Portal",
  description: "Secretary tools for society updates and notices.",
};

export default async function SecretaryPortalPage() {
  const { user } = await requireSecretary();

  return (
    <main className="pb-8 sm:pb-12">
      <section className="bg-[var(--brand-dark)] px-4 py-8 text-stone-50 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-5xl">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-200/80">
            Secretary Portal
          </p>
          <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">
            Welcome, {user.name}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-stone-100/85 sm:text-base">
            This area will be used to publish member notices and keep the Updates
            page fresh throughout the season.
          </p>
        </div>
      </section>

      <section className="mx-auto mt-6 max-w-5xl px-4 sm:mt-8 sm:px-6">
        <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
            Coming Soon
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-[var(--brand-dark)]">
            Secretary tools are being prepared
          </h2>
          <p className="mt-4 text-sm leading-7 text-slate-700 sm:text-base">
            The next update here will let the secretary publish announcements and
            manage the notices shown on the Updates page.
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
