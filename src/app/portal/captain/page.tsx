import type { Metadata } from "next";
import Link from "next/link";
import {
  approveMemberRequest,
  createCourse,
  createOuting,
  deleteCourse,
  deleteOuting,
  removeMemberRequest,
  updateCourse,
  updateMemberRole,
  updateOuting,
  updateOutingGroups,
} from "@/app/portal/captain/actions";
import OutingGroupsEditor from "@/components/captain/OutingGroupsEditor";
import { requireCaptain } from "@/lib/auth";
import { defaultParForHole } from "@/lib/course-defaults";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Captain Admin",
  description: "Manage courses, outings, groups, and member approvals.",
};

type CaptainPageProps = {
  searchParams?: Promise<{
    created?: string;
    outing?: string;
  }>;
};

type CaptainCourse = {
  id: string;
  name: string;
  websiteUrl: string | null;
  mapsUrl: string | null;
  imageSrc: string | null;
  imageAlt: string | null;
  holes: Array<{
    id: string;
    holeNumber: number;
    par: number;
    strokeIndex: number;
  }>;
};

type CaptainMember = {
  id: string;
  name: string;
  email: string | null;
  role: "member" | "captain" | "admin";
  isRegistered: boolean;
  handicapIndex: number | { toString(): string } | null;
};

type CaptainOuting = {
  id: string;
  title: string;
  outingDate: Date;
  teeTime: string | null;
  imageSrc: string | null;
  imageAlt: string | null;
  sponsorName: string | null;
  sponsorUrl: string | null;
  featured: boolean;
  status: "draft" | "live" | "completed" | "finalized";
  courseId: string;
  course: {
    id: string;
    name: string;
  };
  players: Array<{
    id: string;
    memberId: string;
    groupNumber: number;
    isScorekeeper: boolean;
    submittedAt: Date | null;
    courseHandicap: number | { toString(): string } | null;
    playingHandicap: number | { toString(): string } | null;
    member: {
      id: string;
      name: string;
      email: string | null;
    };
  }>;
};

export default async function CaptainPage({ searchParams }: CaptainPageProps) {
  const captain = await requireCaptain();
  const isAdmin = captain.user.role === "admin";

  const [courses, members, outings, pendingMembers, params]: [
    CaptainCourse[],
    CaptainMember[],
    CaptainOuting[],
    CaptainMember[],
    Awaited<CaptainPageProps["searchParams"]>,
  ] = await Promise.all([
    prisma.course.findMany({
      orderBy: { name: "asc" },
      include: {
        holes: {
          orderBy: { holeNumber: "asc" },
        },
      },
    }),
    prisma.member.findMany({
      where: {
        approvalStatus: "approved",
      },
      orderBy: { name: "asc" },
    }),
    prisma.outing.findMany({
      orderBy: { outingDate: "desc" },
      include: {
        course: true,
        players: {
          include: {
            member: true,
          },
          orderBy: [{ groupNumber: "asc" }],
        },
      },
      take: 8,
    }),
    prisma.member.findMany({
      where: {
        approvalStatus: "pending",
      },
      orderBy: {
        createdAt: "asc",
      },
    }),
    searchParams,
  ]);

  return (
    <main className="pb-8 sm:pb-12">
      <section className="bg-[var(--brand-dark)] px-4 py-8 text-stone-50 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-200/80">
            Captain Admin
          </p>
          <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">
            Manage your courses, outings, and groups
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-stone-100/85 sm:text-base">
            Use this area to keep the season organised, prepare the next outing,
            and make sure everyone is in the right group before play begins.
          </p>
        </div>
      </section>

      <section className="mx-auto mt-6 max-w-6xl px-4 sm:mt-8 sm:px-6">
        {params?.created === "1" ? (
          <div className="mb-6 rounded-[1.5rem] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
            Outing created successfully. It will now appear on the fixtures page,
            and you can sort the groups below whenever you are ready.
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <details className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm sm:p-8">
            <summary className="cursor-pointer list-none">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
                Course Setup
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-[var(--brand-dark)]">
                Add a course
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Add a new course and enter the details for all 18 holes.
              </p>
            </summary>

            <div className="mt-6 flex items-start justify-between gap-4">
              <div />
              <Link
                href="/portal"
                className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--brand-dark)] transition hover:bg-[var(--surface-strong)]"
              >
                Back to member portal
              </Link>
            </div>

            <form action={createCourse} className="mt-6 grid gap-5">
              <div>
                <label
                  htmlFor="course-name"
                  className="text-sm font-semibold text-[var(--brand-dark)]"
                >
                  Course name
                </label>
                <input
                  id="course-name"
                  name="name"
                  required
                  placeholder="Bangor Golf Club"
                  className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[var(--brand)]"
                />
              </div>

              <div>
                <p className="text-sm font-semibold text-[var(--brand-dark)]">
                  Hole details
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Enter the correct par and stroke index for every hole so scoring
                  is accurate on the day.
                </p>
              </div>

              <div className="overflow-x-auto rounded-[1.5rem] border border-[var(--border)]">
                <table className="min-w-full border-collapse text-left text-sm">
                  <thead className="bg-[var(--surface-strong)] text-[var(--brand-dark)]">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Hole</th>
                      <th className="px-4 py-3 font-semibold">Par</th>
                      <th className="px-4 py-3 font-semibold">Stroke Index</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: 18 }, (_, index) => {
                      const holeNumber = index + 1;

                      return (
                        <tr key={holeNumber} className="border-t border-[var(--border)]">
                          <td className="px-4 py-3 font-medium text-[var(--brand-dark)]">
                            {holeNumber}
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              name={`hole-${holeNumber}-par`}
                              min={3}
                              max={6}
                              defaultValue={defaultParForHole(holeNumber)}
                              required
                              className="w-20 rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none transition focus:border-[var(--brand)]"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              name={`hole-${holeNumber}-stroke-index`}
                              min={1}
                              max={18}
                              defaultValue={holeNumber}
                              required
                              className="w-24 rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none transition focus:border-[var(--brand)]"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <button
                type="submit"
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-[var(--brand)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-dark)]"
              >
                Save course
              </button>
            </form>
          </details>

          <details className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm sm:p-8">
            <summary className="cursor-pointer list-none">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
                Outing Builder
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-[var(--brand-dark)]">
                Create an outing
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Add the outing details here first, then return later to sort
                players into groups.
              </p>
            </summary>

            {courses.length === 0 ? (
              <div className="mt-6 rounded-[1.5rem] border border-dashed border-[var(--border)] bg-[var(--surface-strong)] px-5 py-4 text-sm text-slate-700">
                Add a course first before creating an outing.
              </div>
            ) : (
              <form action={createOuting} className="mt-6 grid gap-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="outing-title"
                      className="text-sm font-semibold text-[var(--brand-dark)]"
                    >
                      Outing title
                    </label>
                    <input
                      id="outing-title"
                      name="title"
                      required
                      placeholder="First Outing"
                      className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[var(--brand)]"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="outing-date"
                      className="text-sm font-semibold text-[var(--brand-dark)]"
                    >
                      Outing date
                    </label>
                    <input
                      id="outing-date"
                      type="date"
                      name="outingDate"
                      required
                      className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[var(--brand)]"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="outing-tee-time"
                      className="text-sm font-semibold text-[var(--brand-dark)]"
                    >
                      Tee time
                    </label>
                    <input
                      id="outing-tee-time"
                      name="teeTime"
                      placeholder="11.00am"
                      className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[var(--brand)]"
                    />
                  </div>
                  <label className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm font-semibold text-[var(--brand-dark)]">
                    <input type="checkbox" name="featured" className="h-4 w-4" />
                    Highlight this outing on the fixtures page
                  </label>
                </div>

                <div>
                  <label
                    htmlFor="course-id"
                    className="text-sm font-semibold text-[var(--brand-dark)]"
                  >
                    Course
                  </label>
                  <select
                    id="course-id"
                    name="courseId"
                    required
                    className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[var(--brand)]"
                  >
                    <option value="">Select a course</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="outing-sponsor-name"
                      className="text-sm font-semibold text-[var(--brand-dark)]"
                    >
                      Sponsor name
                    </label>
                    <input
                      id="outing-sponsor-name"
                      name="sponsorName"
                      placeholder="Sponsor TBC"
                      className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[var(--brand)]"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="outing-sponsor-url"
                      className="text-sm font-semibold text-[var(--brand-dark)]"
                    >
                      Sponsor URL
                    </label>
                    <input
                      id="outing-sponsor-url"
                      name="sponsorUrl"
                      placeholder="https://example.com"
                      className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[var(--brand)]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="inline-flex min-h-12 items-center justify-center rounded-full bg-[var(--brand)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-dark)]"
                >
                  Create outing
                </button>
              </form>
            )}
          </details>
        </div>
      </section>

      {isAdmin ? (
        <section className="mx-auto mt-6 max-w-6xl px-4 sm:px-6">
          <details className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm sm:p-8">
            <summary className="cursor-pointer list-none">
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
                  Member Controls
                </p>
                <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-800">
                  Visible to admin only
                </span>
              </div>
              <h2 className="mt-3 text-2xl font-semibold text-[var(--brand-dark)]">
                Approvals and roles
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Review new member requests and update roles when needed.
              </p>
            </summary>
            <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
              <div>
                <h3 className="text-lg font-semibold text-[var(--brand-dark)]">
                  Pending member requests
                </h3>
              <div className="mt-4 grid gap-3">
                {pendingMembers.length === 0 ? (
                  <p className="rounded-[1.5rem] bg-[var(--surface-strong)] px-4 py-4 text-sm text-slate-700">
                    There are no membership requests waiting for review right now.
                  </p>
                ) : (
                  pendingMembers.map((member) => (
                    <article
                      key={member.id}
                      className="rounded-[1.5rem] bg-[var(--surface-strong)] px-4 py-4"
                    >
                      <p className="font-semibold text-[var(--brand-dark)]">{member.name}</p>
                      <p className="mt-1 text-sm text-slate-600">
                        {member.email ?? "No email on file"}
                      </p>
                      <p className="mt-2 text-sm text-slate-700">
                        Requested handicap {Number(member.handicapIndex).toFixed(1)}
                      </p>
                      <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">
                        Waiting for approval
                      </p>
                      <div className="mt-4 flex flex-wrap gap-3">
                        <form action={approveMemberRequest}>
                          <input type="hidden" name="memberId" value={member.id} />
                          <button
                            type="submit"
                            className="inline-flex min-h-10 items-center justify-center rounded-full bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--brand-dark)]"
                          >
                            Approve member
                          </button>
                        </form>
                        <form action={removeMemberRequest}>
                          <input type="hidden" name="memberId" value={member.id} />
                          <button
                            type="submit"
                            className="inline-flex min-h-10 items-center justify-center rounded-full border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
                          >
                            Remove request
                          </button>
                        </form>
                      </div>
                    </article>
                  ))
                )}
              </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-[var(--brand-dark)]">
                  Approved members
                </h3>
                <div className="mt-4 grid gap-3">
                  {members.map((member) => (
                    <article
                    key={member.id}
                    className="rounded-[1.5rem] bg-[var(--surface-strong)] px-4 py-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-[var(--brand-dark)]">{member.name}</p>
                        <p className="mt-1 text-sm text-slate-600">
                          {member.email ?? "No account linked yet"}
                        </p>
                        <p className="mt-2 text-sm text-slate-700">
                          Handicap {Number(member.handicapIndex).toFixed(1)} •{" "}
                          {member.isRegistered ? "Registered" : "Awaiting first sign-in"}
                        </p>
                      </div>
                      <div className="min-w-48">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                          Current role
                        </p>
                        <p className="mt-2 text-sm font-semibold capitalize text-[var(--brand-dark)]">
                          {member.role}
                        </p>
                      </div>
                    </div>

                      <form action={updateMemberRole} className="mt-4 flex flex-wrap gap-3">
                        <input type="hidden" name="memberId" value={member.id} />
                        <select
                          name="role"
                          defaultValue={member.role}
                          className="min-w-40 rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none transition focus:border-[var(--brand)]"
                        >
                          <option value="member">Member</option>
                          <option value="captain">Captain</option>
                          <option value="admin">Admin</option>
                        </select>
                        <button
                          type="submit"
                          className="inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--brand-dark)] transition hover:bg-white"
                        >
                          Save role
                        </button>
                      </form>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </details>
        </section>
      ) : null}

      <section className="mx-auto mt-6 max-w-6xl px-4 sm:px-6">
        <details className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm sm:p-8">
          <summary className="cursor-pointer list-none">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
              Current Data
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-[var(--brand-dark)]">
              Courses and outings
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Review what has already been added and make any changes you need.
            </p>
          </summary>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div>
              <h3 className="text-lg font-semibold text-[var(--brand-dark)]">Courses</h3>
              <div className="mt-4 grid gap-3">
                {courses.length === 0 ? (
                  <p className="rounded-[1.5rem] bg-[var(--surface-strong)] px-4 py-3 text-sm text-slate-700">
                    No courses added yet.
                  </p>
                ) : (
                  courses.map((course) => (
                    <details
                      key={course.id}
                      className="rounded-[1.5rem] bg-[var(--surface-strong)] px-4 py-4"
                    >
                      <summary className="cursor-pointer list-none">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-semibold text-[var(--brand-dark)]">{course.name}</p>
                            <p className="mt-1 text-sm text-slate-600">
                              {course.holes.length} holes added. Open to update pars and
                              stroke indexes.
                            </p>
                          </div>
                          <span className="rounded-full border border-[var(--border)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
                            Edit
                          </span>
                        </div>
                      </summary>
                      <form action={updateCourse} className="mt-4">
                        <input type="hidden" name="courseId" value={course.id} />
                        <label className="text-sm font-semibold text-[var(--brand-dark)]">
                          Course name
                          <input
                            name="name"
                            defaultValue={course.name}
                            className="mt-2 w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none transition focus:border-[var(--brand)]"
                          />
                        </label>
                        <div className="mt-4 overflow-x-auto rounded-[1rem] border border-[var(--border)] bg-white">
                          <table className="min-w-full border-collapse text-left text-xs">
                            <thead className="bg-[var(--surface-strong)] text-[var(--brand-dark)]">
                              <tr>
                                <th className="px-3 py-2 font-semibold">Hole</th>
                                <th className="px-3 py-2 font-semibold">Par</th>
                                <th className="px-3 py-2 font-semibold">SI</th>
                              </tr>
                            </thead>
                            <tbody>
                              {Array.from({ length: 18 }, (_, index) => {
                                const holeNumber = index + 1;
                                const existingHole = course.holes.find(
                                  (hole) => hole.holeNumber === holeNumber,
                                );

                                return (
                                  <tr
                                    key={`${course.id}-${holeNumber}`}
                                    className="border-t border-[var(--border)]"
                                  >
                                    <td className="px-3 py-2 font-medium text-[var(--brand-dark)]">
                                      {holeNumber}
                                    </td>
                                    <td className="px-3 py-2">
                                      <input
                                        type="number"
                                        name={`hole-${holeNumber}-par`}
                                        min={3}
                                        max={6}
                                        defaultValue={
                                          existingHole?.par ?? defaultParForHole(holeNumber)
                                        }
                                        className="w-16 rounded-lg border border-[var(--border)] px-2 py-1 outline-none transition focus:border-[var(--brand)]"
                                      />
                                    </td>
                                    <td className="px-3 py-2">
                                      <input
                                        type="number"
                                        name={`hole-${holeNumber}-stroke-index`}
                                        min={1}
                                        max={18}
                                        defaultValue={existingHole?.strokeIndex ?? holeNumber}
                                        className="w-16 rounded-lg border border-[var(--border)] px-2 py-1 outline-none transition focus:border-[var(--brand)]"
                                      />
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                        <button
                          type="submit"
                          className="mt-4 inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--brand-dark)] transition hover:bg-white"
                        >
                          Save course details
                        </button>
                      </form>
                      <form action={deleteCourse} className="mt-3">
                        <input type="hidden" name="courseId" value={course.id} />
                        <button
                          type="submit"
                          className="inline-flex min-h-10 items-center justify-center rounded-full border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
                        >
                          Delete course
                        </button>
                      </form>
                    </details>
                  ))
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-[var(--brand-dark)]">
                Recent outings
              </h3>
              <div className="mt-4 grid gap-3">
                {outings.length === 0 ? (
                  <p className="rounded-[1.5rem] bg-[var(--surface-strong)] px-4 py-3 text-sm text-slate-700">
                    No outings have been created yet.
                  </p>
                ) : (
                  outings.map((outing) => (
                    <details
                      key={outing.id}
                      className="rounded-[1.5rem] bg-[var(--surface-strong)] px-4 py-4"
                    >
                      <summary className="cursor-pointer list-none">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-semibold text-[var(--brand-dark)]">{outing.title}</p>
                            <p className="mt-1 text-sm text-slate-600">
                              {new Date(outing.outingDate).toLocaleDateString("en-GB", {
                                dateStyle: "medium",
                              })}{" "}
                              at {outing.course.name}
                            </p>
                            <p className="mt-2 text-sm text-slate-700">
                              {outing.players.length} attendees across{" "}
                              {new Set(outing.players.map((player) => player.groupNumber)).size} groups
                            </p>
                          </div>
                          <span className="rounded-full border border-[var(--border)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
                            Edit
                          </span>
                        </div>
                      </summary>
                      <form action={updateOuting} className="mt-4 grid gap-4">
                        <input type="hidden" name="outingId" value={outing.id} />
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div>
                            <label className="text-sm font-semibold text-[var(--brand-dark)]">
                              Outing title
                              <input
                                name="title"
                                defaultValue={outing.title}
                                className="mt-2 w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none transition focus:border-[var(--brand)]"
                              />
                            </label>
                          </div>
                          <div>
                            <label className="text-sm font-semibold text-[var(--brand-dark)]">
                              Outing date
                              <input
                                type="date"
                                name="outingDate"
                                defaultValue={new Date(outing.outingDate).toISOString().slice(0, 10)}
                                className="mt-2 w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none transition focus:border-[var(--brand)]"
                              />
                            </label>
                          </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <div>
                            <label className="text-sm font-semibold text-[var(--brand-dark)]">
                              Tee time
                              <input
                                name="teeTime"
                                defaultValue={outing.teeTime ?? ""}
                                className="mt-2 w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none transition focus:border-[var(--brand)]"
                              />
                            </label>
                          </div>
                          <div>
                            <label className="text-sm font-semibold text-[var(--brand-dark)]">
                              Course
                              <select
                                name="courseId"
                                defaultValue={outing.courseId}
                                className="mt-2 w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none transition focus:border-[var(--brand)]"
                              >
                                {courses.map((course) => (
                                  <option key={course.id} value={course.id}>
                                    {course.name}
                                  </option>
                                ))}
                              </select>
                            </label>
                          </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <div>
                            <label className="text-sm font-semibold text-[var(--brand-dark)]">
                              Sponsor name
                              <input
                                name="sponsorName"
                                defaultValue={outing.sponsorName ?? ""}
                                className="mt-2 w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none transition focus:border-[var(--brand)]"
                              />
                            </label>
                          </div>
                          <div>
                            <label className="text-sm font-semibold text-[var(--brand-dark)]">
                              Sponsor URL
                              <input
                                name="sponsorUrl"
                                defaultValue={outing.sponsorUrl ?? ""}
                                className="mt-2 w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none transition focus:border-[var(--brand)]"
                              />
                            </label>
                          </div>
                        </div>

                        <label className="inline-flex items-center gap-3 text-sm font-semibold text-[var(--brand-dark)]">
                          <input
                            type="checkbox"
                            name="featured"
                            defaultChecked={outing.featured}
                            className="h-4 w-4"
                          />
                          Highlight this outing on the fixtures page
                        </label>

                        <div className="flex flex-wrap gap-3">
                          <button
                            type="submit"
                            className="inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--brand-dark)] transition hover:bg-white"
                          >
                            Save outing details
                          </button>
                          <Link
                            href={`/portal/outings/${outing.id}`}
                            className="inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--brand-dark)] transition hover:bg-white"
                          >
                            Open outing
                          </Link>
                        </div>
                      </form>
                      <form action={deleteOuting} className="mt-3">
                        <input type="hidden" name="outingId" value={outing.id} />
                        <button
                          type="submit"
                          className="inline-flex min-h-10 items-center justify-center rounded-full border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
                        >
                          Delete outing
                        </button>
                      </form>
                    </details>
                  ))
                )}
              </div>
            </div>
          </div>
        </details>
      </section>

      <section className="mx-auto mt-6 max-w-6xl px-4 sm:px-6">
        <details className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm sm:p-8">
          <summary className="cursor-pointer list-none">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
              Group Builder
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-[var(--brand-dark)]">
              Attendance and group setup
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Choose who is playing and place them into their groups for the day.
            </p>
          </summary>

          <div className="mt-6 grid gap-4">
            {outings.length === 0 ? (
              <p className="rounded-[1.5rem] bg-[var(--surface-strong)] px-4 py-4 text-sm text-slate-700">
                Create an outing first, then come back here to sort the groups.
              </p>
            ) : (
              outings.map((outing) => (
                <details
                  key={`${outing.id}-groups`}
                  className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-4"
                >
                  <summary className="cursor-pointer list-none">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-[var(--brand-dark)]">{outing.title}</p>
                        <p className="mt-1 text-sm text-slate-600">
                          {new Date(outing.outingDate).toLocaleDateString("en-GB", {
                            dateStyle: "medium",
                          })}{" "}
                          at {outing.course.name}
                        </p>
                        <p className="mt-2 text-sm text-slate-700">
                          {outing.players.length} players currently assigned
                        </p>
                      </div>
                      <span className="rounded-full border border-[var(--border)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
                        Edit groups
                      </span>
                    </div>
                  </summary>

                  <form action={updateOutingGroups} className="mt-6 grid gap-4">
                    <input type="hidden" name="outingId" value={outing.id} />
                    <div>
                      <p className="text-sm font-semibold text-[var(--brand-dark)]">
                        Attendance and groups
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        Add players to each group here. The group can decide on
                        the day who will keep score.
                      </p>
                    </div>
                    <OutingGroupsEditor
                      members={members.map((member) => ({
                        id: member.id,
                        name: member.name,
                        handicapIndex: Number(member.handicapIndex),
                      }))}
                      initialGroups={Array.from(
                        new Set(outing.players.map((player) => player.groupNumber)),
                      )
                        .sort((left, right) => left - right)
                        .map((groupNumber) =>
                          outing.players
                            .filter((player) => player.groupNumber === groupNumber)
                            .map((player) => player.memberId),
                        )}
                    />
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="submit"
                        className="inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--brand-dark)] transition hover:bg-white"
                      >
                        Save groups
                      </button>
                    </div>
                  </form>
                </details>
              ))
            )}
          </div>
        </details>
      </section>
    </main>
  );
}
