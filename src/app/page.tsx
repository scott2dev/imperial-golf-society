export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-green-900 to-emerald-800 text-white">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <div className="max-w-3xl">
            <p className="mb-4 inline-block rounded-full bg-white/15 px-4 py-1 text-sm backdrop-blur">
              Welcome to the society
            </p>

            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
              Imperial Golf Society
            </h1>

            <p className="mt-6 text-lg leading-8 text-white/90 sm:text-xl">
              A modern home for members of Imperial Golf Society — keeping you
              up to date with fixtures, results, and everything happening across
              the season.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href="#updates"
                className="rounded-2xl bg-white px-5 py-3 font-medium text-green-900 shadow-lg transition hover:-translate-y-0.5"
              >
                Latest Updates
              </a>
              <a
                href="#about"
                className="rounded-2xl border border-white/30 px-5 py-3 font-medium text-white transition hover:bg-white/10"
              >
                About the Society
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="mx-auto grid max-w-6xl gap-6 px-6 py-12 md:grid-cols-3">
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm font-medium text-slate-500">Members</p>
          <h2 className="mt-2 text-3xl font-semibold">40+</h2>
          <p className="mt-2 text-sm text-slate-600">
            Friendly golf for players of all abilities.
          </p>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm font-medium text-slate-500">Events</p>
          <h2 className="mt-2 text-3xl font-semibold">8 Per Year</h2>
          <p className="mt-2 text-sm text-slate-600">
            Regular society days, majors, and special events.
          </p>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm font-medium text-slate-500">Next Step</p>
          <h2 className="mt-2 text-3xl font-semibold">Results & Signup</h2>
          <p className="mt-2 text-sm text-slate-600">
            Start simple now and add features as the site grows.
          </p>
        </div>
      </section>

      {/* UPDATES + FIXTURES */}
      <section
        id="updates"
        className="mx-auto grid max-w-6xl gap-8 px-6 py-6 lg:grid-cols-[1.4fr_1fr]"
      >
        {/* Updates */}
        <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-green-700">
            News
          </p>
          <h2 className="mt-2 text-2xl font-semibold">Latest Updates</h2>

          <div className="mt-6 space-y-4">
            <article className="rounded-2xl border border-slate-200 p-5">
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-lg font-semibold">Website launched</h3>
                <span className="rounded-full bg-green-50 px-3 py-1 text-sm text-green-800">
                  March 2026
                </span>
              </div>
              <p className="mt-3 text-slate-600">
                Welcome to the new Imperial Golf Society website. This is the
                first step towards a central hub for members.
              </p>
            </article>

            <article className="rounded-2xl border border-slate-200 p-5">
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-lg font-semibold">
                  Season opener coming soon
                </h3>
                <span className="rounded-full bg-green-50 px-3 py-1 text-sm text-green-800">
                  April 2026
                </span>
              </div>
              <p className="mt-3 text-slate-600">
                Fixture details, tee times, and updates will be shared here as
                the season begins.
              </p>
            </article>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Fixtures */}
          <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-green-700">
              Fixtures
            </p>
            <h2 className="mt-2 text-2xl font-semibold">Upcoming Events</h2>

            <div className="mt-6 space-y-4">
              <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                <h3 className="font-semibold">Spring Society Day</h3>
                <p className="mt-1 text-sm text-slate-600">
                  Saturday, 18 April 2026
                </p>
                <p className="text-sm text-slate-500">Venue to be confirmed</p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                <h3 className="font-semibold">Summer Major</h3>
                <p className="mt-1 text-sm text-slate-600">
                  Saturday, 20 June 2026
                </p>
                <p className="text-sm text-slate-500">Venue to be confirmed</p>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="rounded-3xl bg-green-900 p-8 text-white shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-green-200">
              Contact
            </p>
            <h2 className="mt-2 text-2xl font-semibold">Get in Touch</h2>
            <p className="mt-4 text-white/85">
              For membership and society information, contact the committee.
            </p>
            <p className="mt-4 text-sm text-white/90">
              secretary@imperialgolfsociety.co.uk
            </p>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="mx-auto max-w-6xl px-6 py-12">
        <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-green-700">
            About
          </p>
          <h2 className="mt-2 text-2xl font-semibold">
            About Imperial Golf Society
          </h2>
          <p className="mt-4 max-w-3xl leading-7 text-slate-600">
            Imperial Golf Society is built around great golf, good company, and
            competitive but friendly events throughout the year. This site will
            act as the central hub for members to stay updated on fixtures,
            results, and society news.
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-8 text-sm text-slate-500">
          © 2026 Imperial Golf Society. All rights reserved.
        </div>
      </footer>
    </main>
  );
}