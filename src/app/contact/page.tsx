import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact information for Imperial Golf Society.",
};

export default function ContactPage() {
  return (
    <main className="pb-8 sm:pb-12">
      <section className="bg-[var(--brand-dark)] px-4 py-8 text-stone-50 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-200/80">
            Contact
          </p>
          <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">
            Get in touch with the society
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-stone-100/85 sm:text-base">
            For membership enquiries, event questions, annual fees, or general
            information about the society, use the contact details below.
          </p>
        </div>
      </section>

      <section className="mx-auto mt-6 max-w-6xl px-4 sm:mt-8 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="min-w-0 rounded-[1.5rem] bg-[var(--surface-strong)] p-5 ring-1 ring-[var(--border)]">
            <p className="text-sm font-medium text-slate-500">Email</p>
            <a
              href="mailto:secretary@imperialgolfsociety.co.uk"
              className="mt-2 block break-all text-lg font-semibold text-[var(--brand-dark)]"
            >
              contact@imperialgolfsociety.co.uk
            </a>
          </div>
          <div className="min-w-0 rounded-[1.5rem] bg-[var(--surface-strong)] p-5 ring-1 ring-[var(--border)]">
            <p className="text-sm font-medium text-slate-500">Membership</p>
            <p className="mt-2 text-sm leading-7 text-slate-700">
              Annual membership is {"\u00A3"}30, and the society welcomes golfers
              of all standards who enjoy the balance of competitive golf and a
              strong social side.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
