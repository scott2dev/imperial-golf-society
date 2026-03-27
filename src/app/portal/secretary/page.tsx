import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ConfirmActionModal } from "@/components/admin/ConfirmActionModal";
import { requireSecretary } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createSecretaryUpdate,
  deleteSecretaryUpdate,
  updateSecretaryUpdate,
} from "./actions";

export const metadata: Metadata = {
  title: "Secretary Portal",
  description: "Secretary tools for society updates and notices.",
};

type SecretaryUpdateEntry = {
  id: string;
  title: string;
  body: string;
  imageData: string | null;
  postedAt: Date;
  postedBy: {
    id: string;
    name: string;
  } | null;
};

export default async function SecretaryPortalPage() {
  const { user } = await requireSecretary();
  const updates: SecretaryUpdateEntry[] = await prisma.secretaryUpdate.findMany({
    orderBy: [{ postedAt: "desc" }, { createdAt: "desc" }],
    include: {
      postedBy: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return (
    <main className="pb-8 sm:pb-12">
      <section className="bg-[var(--brand-dark)] px-4 py-8 text-stone-50 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-200/80">
            Secretary Portal
          </p>
          <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">
            Welcome, {user.name}
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-stone-100/85 sm:text-base">
            Publish updates for the members noticeboard and keep the season page
            current with the latest society news.
          </p>
        </div>
      </section>

      <section className="mx-auto mt-6 max-w-6xl px-4 sm:mt-8 sm:px-6">
        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <article className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
              New Update
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-[var(--brand-dark)]">
              Post to the Updates page
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Each post appears below the key members section on the public Updates
              page, with its own title, timestamp, body, and optional photo.
            </p>

            <form action={createSecretaryUpdate} className="mt-6 grid gap-4">
              <label className="text-sm font-semibold text-[var(--brand-dark)]">
                Title
                <input
                  name="title"
                  required
                  placeholder="Captain's Weekend deposits now open"
                  className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--brand)]"
                />
              </label>

              <label className="text-sm font-semibold text-[var(--brand-dark)]">
                Date and time posted
                <input
                  type="datetime-local"
                  name="postedAt"
                  defaultValue={new Date().toISOString().slice(0, 16)}
                  className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--brand)]"
                />
              </label>

              <label className="text-sm font-semibold text-[var(--brand-dark)]">
                Post body
                <textarea
                  name="body"
                  required
                  rows={6}
                  placeholder="Share the latest society notice here..."
                  className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--brand)]"
                />
              </label>

              <label className="text-sm font-semibold text-[var(--brand-dark)]">
                Photo
                <input
                  type="file"
                  name="image"
                  accept="image/*"
                  className="mt-2 block w-full text-sm text-slate-700 file:mr-4 file:rounded-full file:border-0 file:bg-[var(--surface-strong)] file:px-4 file:py-2 file:font-semibold file:text-[var(--brand-dark)]"
                />
              </label>

              <button
                type="submit"
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-[var(--brand)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-dark)]"
              >
                Publish update
              </button>
            </form>
          </article>

          <aside className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
              Quick Notes
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-[var(--brand-dark)]">
              Posting guide
            </h2>
            <ul className="mt-5 grid gap-3 text-sm leading-6 text-slate-700">
              <li className="rounded-[1.25rem] bg-[var(--surface-strong)] px-4 py-3">
                Use a clear title so members can scan the updates feed quickly.
              </li>
              <li className="rounded-[1.25rem] bg-[var(--surface-strong)] px-4 py-3">
                Add a photo only when it helps explain the notice or adds context.
              </li>
              <li className="rounded-[1.25rem] bg-[var(--surface-strong)] px-4 py-3">
                You can edit or remove any existing post below if plans change.
              </li>
            </ul>

            <Link
              href="/portal"
              className="mt-6 inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--brand-dark)] transition hover:bg-[var(--surface-strong)]"
            >
              Back to portal
            </Link>
          </aside>
        </div>
      </section>

      <section className="mx-auto mt-6 max-w-6xl px-4 sm:px-6">
        <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
            Existing Posts
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-[var(--brand-dark)]">
            Published updates
          </h2>

          <div className="mt-6 grid gap-4">
            {updates.length === 0 ? (
              <p className="rounded-[1.5rem] bg-[var(--surface-strong)] px-4 py-4 text-sm text-slate-700">
                No updates have been published yet.
              </p>
            ) : (
              updates.map((update) => (
                <article
                  key={update.id}
                  className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface-strong)] p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-[var(--brand-dark)]">{update.title}</p>
                      <p className="mt-1 text-sm text-slate-600">
                        {new Date(update.postedAt).toLocaleString("en-GB", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                        {update.postedBy ? ` · ${update.postedBy.name}` : ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <ConfirmActionModal
                        action={updateSecretaryUpdate}
                        buttonLabel="Edit post"
                        buttonClassName="inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--brand-dark)] transition hover:bg-white"
                        title="Edit update"
                        description="Update the post details shown on the Updates page."
                        hiddenFields={{ updateId: update.id }}
                        confirmButtonLabel="Save update"
                      >
                        <div className="grid gap-4">
                          <label className="text-sm font-semibold text-[var(--brand-dark)]">
                            Title
                            <input
                              name="title"
                              defaultValue={update.title}
                              className="mt-2 w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none transition focus:border-[var(--brand)]"
                            />
                          </label>
                          <label className="text-sm font-semibold text-[var(--brand-dark)]">
                            Date and time posted
                            <input
                              type="datetime-local"
                              name="postedAt"
                              defaultValue={new Date(update.postedAt).toISOString().slice(0, 16)}
                              className="mt-2 w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none transition focus:border-[var(--brand)]"
                            />
                          </label>
                          <label className="text-sm font-semibold text-[var(--brand-dark)]">
                            Post body
                            <textarea
                              name="body"
                              rows={5}
                              defaultValue={update.body}
                              className="mt-2 w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none transition focus:border-[var(--brand)]"
                            />
                          </label>
                          <label className="text-sm font-semibold text-[var(--brand-dark)]">
                            Replace photo
                            <input
                              type="file"
                              name="image"
                              accept="image/*"
                              className="mt-2 block w-full text-sm text-slate-700 file:mr-4 file:rounded-full file:border-0 file:bg-[var(--surface-strong)] file:px-4 file:py-2 file:font-semibold file:text-[var(--brand-dark)]"
                            />
                          </label>
                          {update.imageData ? (
                            <label className="inline-flex items-center gap-3 text-sm font-semibold text-[var(--brand-dark)]">
                              <input type="checkbox" name="removeImage" className="h-4 w-4" />
                              Remove current photo
                            </label>
                          ) : null}
                        </div>
                      </ConfirmActionModal>
                      <ConfirmActionModal
                        action={deleteSecretaryUpdate}
                        buttonLabel="Delete post"
                        buttonClassName="inline-flex min-h-10 items-center justify-center rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
                        title="Delete update"
                        description="This will remove the post from the public Updates page."
                        confirmWord="DELETE"
                        hiddenFields={{ updateId: update.id }}
                      />
                    </div>
                  </div>

                  {update.imageData ? (
                    <div className="mt-4 overflow-hidden rounded-[1.25rem] border border-[var(--border)] bg-white">
                      <Image
                        src={update.imageData}
                        alt={update.title}
                        width={1200}
                        height={700}
                        unoptimized
                        className="h-auto w-full object-cover"
                      />
                    </div>
                  ) : null}

                  <p className="mt-4 text-sm leading-7 text-slate-700">{update.body}</p>
                </article>
              ))
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
