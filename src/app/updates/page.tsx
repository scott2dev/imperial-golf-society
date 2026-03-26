import type { Metadata } from "next";
import Image from "next/image";
import { currentSeason, seasonKeyMembers } from "@/lib/key-members-data";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Updates",
  description: "Latest notices, announcements, and season updates.",
};

export const dynamic = "force-dynamic";

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

function getInitials(name: string) {
  return name
    .split(/[&\s]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

type SeasonKeyMemberProfile = {
  roleKey: string;
  roleLabel: string;
  memberName: string;
  imageData: string | null;
  sortOrder: number;
};

export default async function UpdatesPage() {
  const savedProfiles: SeasonKeyMemberProfile[] = await prisma.seasonKeyMemberProfile.findMany({
    where: {
      season: currentSeason,
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: {
      roleKey: true,
      roleLabel: true,
      memberName: true,
      imageData: true,
      sortOrder: true,
    },
  });
  const keyMembers = seasonKeyMembers.map((entry) => {
    const savedProfile = savedProfiles.find((profile) => profile.roleKey === entry.roleKey);

    return {
      roleKey: entry.roleKey,
      role: savedProfile?.roleLabel ?? entry.roleLabel,
      name: savedProfile?.memberName ?? entry.memberName,
      imageData: savedProfile?.imageData ?? null,
      sortOrder: savedProfile?.sortOrder ?? entry.sortOrder,
    };
  });

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

      <section className="mx-auto mt-6 max-w-6xl px-4 sm:mt-8 sm:px-6">
        <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
            Season {currentSeason}
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-[var(--brand-dark)] sm:text-3xl">
            Key members for the season ahead
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-700 sm:text-base">
            The society team helping guide the 2026 season, organise the calendar,
            and keep things running smoothly from the first outing to Captain&apos;s Weekend.
          </p>

          <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-8">
            {keyMembers.map((member) => (
              <article
                key={member.roleKey}
                className="flex flex-col items-center text-center"
              >
                <div className="flex h-28 w-28 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-strong)] text-2xl font-semibold tracking-[0.08em] text-[var(--brand-dark)] shadow-sm sm:h-32 sm:w-32">
                  {member.imageData ? (
                    <Image
                      src={member.imageData}
                      alt={member.name}
                      width={128}
                      height={128}
                      unoptimized
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    getInitials(member.name)
                  )}
                </div>
                <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--brand)]">
                  {member.role}
                </p>
                <p className="mt-2 text-lg font-semibold text-[var(--brand-dark)]">
                  {member.name}
                </p>
              </article>
            ))}
          </div>
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
