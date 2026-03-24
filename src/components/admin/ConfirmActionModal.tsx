"use client";

import type { ReactNode } from "react";
import { useState } from "react";

type ConfirmAction = (formData: FormData) => void | Promise<void>;

type ConfirmActionModalProps = {
  action: ConfirmAction;
  buttonLabel: string;
  buttonClassName: string;
  title: string;
  description: string;
  confirmWord?: string;
  confirmButtonLabel?: string;
  confirmButtonClassName?: string;
  hiddenFields?: Record<string, string | number>;
  children?: ReactNode;
};

export function ConfirmActionModal({
  action,
  buttonLabel,
  buttonClassName,
  title,
  description,
  confirmWord,
  confirmButtonLabel,
  confirmButtonClassName,
  hiddenFields,
  children,
}: ConfirmActionModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setIsOpen(true)} className={buttonClassName}>
        {buttonLabel}
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-6">
          <div className="w-full max-w-md rounded-[1.75rem] border border-[var(--border)] bg-white p-6 shadow-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
              Confirmation Required
            </p>
            <h3 className="mt-3 text-2xl font-semibold text-[var(--brand-dark)]">{title}</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>

            <form action={action} className="mt-5 grid gap-4">
              {hiddenFields
                ? Object.entries(hiddenFields).map(([name, value]) => (
                    <input key={name} type="hidden" name={name} value={String(value)} />
                  ))
                : null}

              {children}

              {confirmWord ? (
                <label className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Type {confirmWord}
                  <input
                    name="confirmation"
                    placeholder={confirmWord}
                    className="mt-2 w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm uppercase text-slate-900 outline-none transition focus:border-[var(--brand)]"
                  />
                </label>
              ) : null}

              <div className="flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--brand-dark)] transition hover:bg-[var(--surface)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={
                    confirmButtonClassName ??
                    "inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--brand-dark)] transition hover:bg-[var(--surface-strong)]"
                  }
                >
                  {confirmButtonLabel ?? buttonLabel}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
