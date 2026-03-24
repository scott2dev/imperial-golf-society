import type { Metadata } from "next";
import Image from "next/image";
import { members, prizeColumns } from "@/lib/members-data";

export const metadata: Metadata = {
  title: "Members",
  description: "Member handicaps and prize totals for the season.",
};

export default function MembersPage() {
  return (
    <main className="pb-8 sm:pb-12">
      <section className="bg-[var(--brand-dark)] px-4 py-8 text-stone-50 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-200/80">
            Members
          </p>
          <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">
            Members, handicaps, and prize totals
          </h1>
          <div className="mt-6 overflow-hidden rounded-[1.5rem]">
            <Image
              src="/captainsweekend.jpg"
              alt="Imperial Golf Society Captain's Weekend"
              width={1600}
              height={900}
              className="h-auto w-full object-cover"
              priority
            />
          </div>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-stone-100/85 sm:text-base">
            This page is set up to track each member&apos;s handicap and how many
            times they have won the main society prizes across the season.
          </p>
        </div>
      </section>

      <section className="mx-auto mt-6 max-w-6xl px-4 sm:mt-8 sm:px-6">
        <div className="overflow-x-auto rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] shadow-sm">
          <table className="min-w-full border-collapse text-left text-sm">
            <thead className="bg-[var(--surface-strong)] text-[var(--brand-dark)]">
              <tr>
                <th className="sticky left-0 z-20 bg-[var(--surface-strong)] px-4 py-4 font-semibold">
                  Member
                </th>
                <th className="px-4 py-4 font-semibold">Handicap</th>
                {prizeColumns.map((column) => (
                  <th key={column.key} className="px-4 py-4 font-semibold">
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {members.length === 0 ? (
                <tr>
                  <td
                    colSpan={2 + prizeColumns.length}
                    className="px-4 py-8 text-center text-slate-600"
                  >
                    Member rows will appear here once they are added.
                  </td>
                </tr>
              ) : (
                members.map((member) => (
                  <tr key={member.name} className="border-t border-[var(--border)]">
                    <td className="sticky left-0 z-10 bg-[var(--surface)] px-4 py-4 font-medium text-[var(--brand-dark)]">
                      {member.name}
                    </td>
                    <td className="px-4 py-4 text-slate-700">{member.handicap}</td>
                    {prizeColumns.map((column) => (
                      <td key={column.key} className="px-4 py-4 text-slate-700">
                        {member[column.key]}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
