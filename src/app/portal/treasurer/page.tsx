import type { Metadata } from "next";
import Link from "next/link";
import { ConfirmActionModal } from "@/components/admin/ConfirmActionModal";
import { requireTreasurer } from "@/lib/auth";
import { currentSeason } from "@/lib/key-members-data";
import { prisma } from "@/lib/prisma";
import {
  createTreasurerCharge,
  deleteTreasurerCharge,
  deleteTreasurerPayment,
  recordTreasurerPayment,
} from "./actions";

export const metadata: Metadata = {
  title: "Treasurer Portal",
  description: "Treasurer tools for membership and outing payments.",
};

type TreasurerMember = {
  id: string;
  name: string;
  email: string | null;
  approvalStatus: "approved" | "pending";
};

type TreasurerOuting = {
  id: string;
  title: string;
  outingDate: Date;
  players: Array<{
    memberId: string;
  }>;
};

type TreasurerCharge = {
  id: string;
  title: string;
  chargeKind: "membership" | "outing" | "custom";
  season: number;
  amount: number | { toString(): string };
  dueDate: Date | null;
  notes: string | null;
  createdAt: Date;
  outing: {
    id: string;
    title: string;
    outingDate: Date;
    players: Array<{
      memberId: string;
    }>;
  } | null;
  payments: Array<{
    id: string;
    memberId: string;
    amount: number | { toString(): string };
    paidAt: Date;
    notes: string | null;
    member: {
      id: string;
      name: string;
    };
  }>;
};

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function getChargeLabel(kind: TreasurerCharge["chargeKind"]) {
  switch (kind) {
    case "membership":
      return "Membership fee";
    case "outing":
      return "Outing payment";
    default:
      return "Custom charge";
  }
}

function getApplicableMembers(
  charge: TreasurerCharge,
  approvedMembers: TreasurerMember[],
) {
  if (charge.chargeKind === "outing") {
    const outingMemberIds = new Set(charge.outing?.players.map((player) => player.memberId) ?? []);

    return approvedMembers.filter((member) => outingMemberIds.has(member.id));
  }

  return approvedMembers;
}

export default async function TreasurerPortalPage() {
  const { user } = await requireTreasurer();
  const [approvedMembers, outings, charges]: [
    TreasurerMember[],
    TreasurerOuting[],
    TreasurerCharge[],
  ] = await Promise.all([
    prisma.member.findMany({
      where: {
        approvalStatus: "approved",
      },
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        name: true,
        email: true,
        approvalStatus: true,
      },
    }),
    prisma.outing.findMany({
      orderBy: {
        outingDate: "desc",
      },
      take: 24,
      select: {
        id: true,
        title: true,
        outingDate: true,
        players: {
          select: {
            memberId: true,
          },
        },
      },
    }),
    prisma.treasurerCharge.findMany({
      where: {
        season: currentSeason,
      },
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
      include: {
        outing: {
          include: {
            players: {
              select: {
                memberId: true,
              },
            },
          },
        },
        payments: {
          orderBy: [{ paidAt: "desc" }, { createdAt: "desc" }],
          include: {
            member: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    }),
  ]);

  const totalExpected = charges.reduce((total, charge) => {
    const applicableMembers = getApplicableMembers(charge, approvedMembers);

    return total + Number(charge.amount) * applicableMembers.length;
  }, 0);
  const totalPaid = charges.reduce(
    (total, charge) =>
      total + charge.payments.reduce((chargeTotal, payment) => chargeTotal + Number(payment.amount), 0),
    0,
  );
  const totalOutstanding = Math.max(0, totalExpected - totalPaid);

  return (
    <main className="pb-8 sm:pb-12">
      <section className="bg-[var(--brand-dark)] px-4 py-8 text-stone-50 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-200/80">
            Treasurer Portal
          </p>
          <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">
            Welcome, {user.name}
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-stone-100/85 sm:text-base">
            Track membership fees, outing payments, and what is still outstanding
            across the current season.
          </p>
        </div>
      </section>

      <section className="mx-auto mt-6 max-w-6xl px-4 sm:mt-8 sm:px-6">
        <div className="grid gap-4 md:grid-cols-3">
          <article className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
              Season {currentSeason}
            </p>
            <p className="mt-3 text-3xl font-semibold text-[var(--brand-dark)]">
              {formatMoney(totalExpected)}
            </p>
            <p className="mt-2 text-sm text-slate-600">Total expected across all open charges</p>
          </article>
          <article className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
              Collected
            </p>
            <p className="mt-3 text-3xl font-semibold text-[var(--brand-dark)]">
              {formatMoney(totalPaid)}
            </p>
            <p className="mt-2 text-sm text-slate-600">Payments recorded so far</p>
          </article>
          <article className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
              Outstanding
            </p>
            <p className="mt-3 text-3xl font-semibold text-[var(--brand-dark)]">
              {formatMoney(totalOutstanding)}
            </p>
            <p className="mt-2 text-sm text-slate-600">Still to be collected</p>
          </article>
        </div>
      </section>

      <section className="mx-auto mt-6 max-w-6xl px-4 sm:px-6">
        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <article className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
              New Charge
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-[var(--brand-dark)]">
              Create a fee or event payment
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Use membership fees for season dues, outing payments for individual
              events, and custom charges for anything else.
            </p>

            <form action={createTreasurerCharge} className="mt-6 grid gap-4">
              <div>
                <label className="text-sm font-semibold text-[var(--brand-dark)]">
                  Title
                  <input
                    name="title"
                    required
                    placeholder="2026 membership fee"
                    className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--brand)]"
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-semibold text-[var(--brand-dark)]">
                  Charge type
                  <select
                    name="chargeKind"
                    defaultValue="membership"
                    className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--brand)]"
                  >
                    <option value="membership">Membership fee</option>
                    <option value="outing">Outing payment</option>
                    <option value="custom">Custom charge</option>
                  </select>
                </label>

                <label className="text-sm font-semibold text-[var(--brand-dark)]">
                  Amount
                  <input
                    type="number"
                    name="amount"
                    min={0.01}
                    step={0.01}
                    required
                    placeholder="10.00"
                    className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--brand)]"
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-semibold text-[var(--brand-dark)]">
                  Due date
                  <input
                    type="date"
                    name="dueDate"
                    className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--brand)]"
                  />
                </label>

                <label className="text-sm font-semibold text-[var(--brand-dark)]">
                  Linked outing
                  <select
                    name="outingId"
                    defaultValue=""
                    className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--brand)]"
                  >
                    <option value="">No linked outing</option>
                    {outings.map((outing) => (
                      <option key={outing.id} value={outing.id}>
                        {outing.title} ·{" "}
                        {new Date(outing.outingDate).toLocaleDateString("en-GB", {
                          dateStyle: "medium",
                        })}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="text-sm font-semibold text-[var(--brand-dark)]">
                Notes
                <textarea
                  name="notes"
                  rows={4}
                  placeholder="Optional notes for the treasurer ledger"
                  className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--brand)]"
                />
              </label>

              <button
                type="submit"
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-[var(--brand)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-dark)]"
              >
                Save charge
              </button>
            </form>
          </article>

          <aside className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
              Quick Notes
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-[var(--brand-dark)]">
              How the ledger works
            </h2>
            <ul className="mt-5 grid gap-3 text-sm leading-6 text-slate-700">
              <li className="rounded-[1.25rem] bg-[var(--surface-strong)] px-4 py-3">
                Membership and custom charges apply to all approved members.
              </li>
              <li className="rounded-[1.25rem] bg-[var(--surface-strong)] px-4 py-3">
                Outing charges apply only to members assigned to that outing.
              </li>
              <li className="rounded-[1.25rem] bg-[var(--surface-strong)] px-4 py-3">
                You can record full or partial payments against any outstanding balance.
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
            Payment Tracker
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-[var(--brand-dark)]">
            Open charges for Season {currentSeason}
          </h2>

          <div className="mt-6 grid gap-4">
            {charges.length === 0 ? (
              <p className="rounded-[1.5rem] bg-[var(--surface-strong)] px-4 py-4 text-sm text-slate-700">
                No charges have been created yet.
              </p>
            ) : (
              charges.map((charge) => {
                const applicableMembers = getApplicableMembers(charge, approvedMembers);
                const totalDue = Number(charge.amount) * applicableMembers.length;
                const totalPaidForCharge = charge.payments.reduce(
                  (total, payment) => total + Number(payment.amount),
                  0,
                );
                const totalOutstandingForCharge = Math.max(0, totalDue - totalPaidForCharge);

                return (
                  <details
                    key={charge.id}
                    className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-4"
                  >
                    <summary className="cursor-pointer list-none">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-[var(--brand-dark)]">{charge.title}</p>
                            <span className="inline-flex items-center rounded-full border border-[var(--border)] bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600">
                              {getChargeLabel(charge.chargeKind)}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-slate-600">
                            {formatMoney(Number(charge.amount))} per member
                            {charge.outing
                              ? ` · ${charge.outing.title}`
                              : ` · ${applicableMembers.length} members`}
                          </p>
                          <p className="mt-1 text-xs uppercase tracking-[0.14em] text-slate-500">
                            {charge.dueDate
                              ? `Due ${new Date(charge.dueDate).toLocaleDateString("en-GB", {
                                  dateStyle: "medium",
                                })}`
                              : "No due date set"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-[var(--brand-dark)]">
                            {formatMoney(totalPaidForCharge)} collected
                          </p>
                          <p className="mt-1 text-sm text-slate-600">
                            {formatMoney(totalOutstandingForCharge)} outstanding
                          </p>
                        </div>
                      </div>
                    </summary>

                    {charge.notes ? (
                      <p className="mt-4 text-sm leading-6 text-slate-700">{charge.notes}</p>
                    ) : null}

                    <div className="mt-4 flex flex-wrap gap-3">
                      <ConfirmActionModal
                        action={deleteTreasurerCharge}
                        buttonLabel="Delete charge"
                        buttonClassName="inline-flex min-h-10 items-center justify-center rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
                        title="Delete charge"
                        description="This will remove the charge and any payments already recorded against it."
                        confirmWord="DELETE"
                        hiddenFields={{ chargeId: charge.id }}
                      />
                    </div>

                    <div className="mt-6 grid gap-3">
                      {applicableMembers.map((member) => {
                        const memberPayments = charge.payments.filter(
                          (payment) => payment.memberId === member.id,
                        );
                        const paidTotal = memberPayments.reduce(
                          (total, payment) => total + Number(payment.amount),
                          0,
                        );
                        const outstanding = Math.max(0, Number(charge.amount) - paidTotal);

                        return (
                          <article
                            key={`${charge.id}-${member.id}`}
                            className="rounded-[1.25rem] bg-white px-4 py-4"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-4">
                              <div>
                                <p className="font-semibold text-[var(--brand-dark)]">
                                  {member.name}
                                </p>
                                <p className="mt-1 text-sm text-slate-600">
                                  Paid {formatMoney(paidTotal)} · Outstanding{" "}
                                  {formatMoney(outstanding)}
                                </p>
                              </div>
                              <div className="flex flex-wrap items-center gap-3">
                                <span
                                  className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${
                                    outstanding <= 0
                                      ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
                                      : "border border-amber-200 bg-amber-50 text-amber-800"
                                  }`}
                                >
                                  {outstanding <= 0 ? "Paid in full" : "Outstanding"}
                                </span>
                                {outstanding > 0 ? (
                                  <ConfirmActionModal
                                    action={recordTreasurerPayment}
                                    buttonLabel="Record payment"
                                    buttonClassName="inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--brand-dark)] transition hover:bg-[var(--surface-strong)]"
                                    title="Record payment"
                                    description={`Add a payment against ${member.name}'s balance for ${charge.title}.`}
                                    hiddenFields={{
                                      chargeId: charge.id,
                                      memberId: member.id,
                                    }}
                                    confirmButtonLabel="Save payment"
                                  >
                                    <div className="grid gap-4">
                                      <label className="text-sm font-semibold text-[var(--brand-dark)]">
                                        Amount paid
                                        <input
                                          type="number"
                                          name="amount"
                                          min={0.01}
                                          max={Number(outstanding.toFixed(2))}
                                          step={0.01}
                                          defaultValue={Number(outstanding.toFixed(2))}
                                          className="mt-2 w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none transition focus:border-[var(--brand)]"
                                        />
                                      </label>
                                      <label className="text-sm font-semibold text-[var(--brand-dark)]">
                                        Paid on
                                        <input
                                          type="datetime-local"
                                          name="paidAt"
                                          defaultValue={new Date()
                                            .toISOString()
                                            .slice(0, 16)}
                                          className="mt-2 w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none transition focus:border-[var(--brand)]"
                                        />
                                      </label>
                                      <label className="text-sm font-semibold text-[var(--brand-dark)]">
                                        Notes
                                        <textarea
                                          name="notes"
                                          rows={3}
                                          placeholder="Optional note, reference, or payment method"
                                          className="mt-2 w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none transition focus:border-[var(--brand)]"
                                        />
                                      </label>
                                    </div>
                                  </ConfirmActionModal>
                                ) : null}
                              </div>
                            </div>

                            {memberPayments.length > 0 ? (
                              <div className="mt-4 grid gap-2">
                                {memberPayments.map((payment) => (
                                  <div
                                    key={payment.id}
                                    className="flex flex-wrap items-center justify-between gap-3 rounded-[1rem] border border-[var(--border)] bg-[var(--surface)] px-3 py-3 text-sm"
                                  >
                                    <div>
                                      <p className="font-semibold text-[var(--brand-dark)]">
                                        {formatMoney(Number(payment.amount))}
                                      </p>
                                      <p className="mt-1 text-xs uppercase tracking-[0.14em] text-slate-500">
                                        {new Date(payment.paidAt).toLocaleString("en-GB", {
                                          dateStyle: "medium",
                                          timeStyle: "short",
                                        })}
                                      </p>
                                      {payment.notes ? (
                                        <p className="mt-1 text-sm text-slate-600">
                                          {payment.notes}
                                        </p>
                                      ) : null}
                                    </div>
                                    <ConfirmActionModal
                                      action={deleteTreasurerPayment}
                                      buttonLabel="Remove"
                                      buttonClassName="inline-flex min-h-9 items-center justify-center rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-rose-700 transition hover:bg-rose-100"
                                      title="Remove payment"
                                      description="This will remove the recorded payment from the ledger."
                                      confirmWord="REMOVE"
                                      hiddenFields={{ paymentId: payment.id }}
                                    />
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="mt-4 text-sm text-slate-600">
                                No payments recorded yet.
                              </p>
                            )}
                          </article>
                        );
                      })}
                    </div>
                  </details>
                );
              })
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
