import type { Metadata } from "next";
import { redirect } from "next/navigation";
import GoogleSignInButton from "@/components/auth/GoogleSignInButton";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Member Login",
  description: "Sign in to access the Imperial Golf Society member portal.",
};

type LoginPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

function getErrorMessage(errorCode: string | undefined) {
  if (errorCode === "AccessDenied") {
    return "This Google account is not currently approved for the member portal.";
  }

  if (errorCode) {
    return "We could not complete sign-in. Please try again.";
  }

  return null;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await getSession();

  if (session?.user?.email) {
    redirect("/portal");
  }

  const params = await searchParams;
  const errorMessage = getErrorMessage(params?.error);

  return (
    <main className="pb-8 sm:pb-12">
      <section className="bg-[var(--brand-dark)] px-4 py-8 text-stone-50 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-4xl">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-200/80">
            Member Portal
          </p>
          <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">
            Sign in for live outings and member scoring
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-stone-100/85 sm:text-base">
            Members will sign in with Google to access their protected golf portal,
            then link that account to the correct member profile before entering
            the scoring system.
          </p>
        </div>
      </section>

      <section className="mx-auto mt-6 max-w-4xl px-4 sm:mt-8 sm:px-6">
        <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm sm:p-8">
          <h2 className="text-2xl font-semibold text-[var(--brand-dark)]">
            Phase 1 is now in place
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-700 sm:text-base">
            Google sign-in is wired up for the portal. On first access, members
            now choose their existing name from the society list or submit a new
            member request for approval.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <GoogleSignInButton />
            <p className="text-sm text-slate-500">
              Use the Google account you want tied to your member profile.
            </p>
          </div>

          {errorMessage ? (
            <p className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {errorMessage}
            </p>
          ) : null}

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <article className="rounded-[1.5rem] bg-[var(--surface-strong)] p-5">
              <p className="text-sm font-semibold text-[var(--brand)]">Access</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                Protected `/portal` access now requires an authenticated session.
              </p>
            </article>
            <article className="rounded-[1.5rem] bg-[var(--surface-strong)] p-5">
              <p className="text-sm font-semibold text-[var(--brand)]">Members</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                First sign-in now links your Google account to the correct existing
                member record and handicap.
              </p>
            </article>
            <article className="rounded-[1.5rem] bg-[var(--surface-strong)] p-5">
              <p className="text-sm font-semibold text-[var(--brand)]">Next</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                The next build step is outing setup, groups, and scorekeeper flows.
              </p>
            </article>
          </div>
        </div>
      </section>
    </main>
  );
}
