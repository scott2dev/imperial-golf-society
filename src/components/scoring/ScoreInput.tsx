"use client";

import { useEffect, useState } from "react";

type ScoreInputProps = {
  defaultValue?: number | null;
  disabled?: boolean;
  name: string;
};

export function ScoreInput({
  defaultValue,
  disabled = false,
  name,
}: ScoreInputProps) {
  const savedValue = defaultValue === null || defaultValue === undefined ? "" : String(defaultValue);
  const [value, setValue] = useState(savedValue);

  useEffect(() => {
    setValue(savedValue);
  }, [savedValue]);

  const hasSavedValue = savedValue !== "";
  const isEditingSavedValue = hasSavedValue && value !== savedValue;

  const stateClasses = isEditingSavedValue
    ? "border-orange-200 bg-orange-50 text-orange-950"
    : hasSavedValue
      ? "border-emerald-200 bg-emerald-50 text-emerald-950"
      : "border-[var(--border)] bg-[var(--surface)] text-[var(--brand-dark)]";

  return (
    <input
      type="number"
      name={name}
      min={1}
      max={20}
      value={value}
      onChange={(event) => setValue(event.target.value)}
      disabled={disabled}
      className={`w-14 rounded-lg border px-2.5 py-1.5 text-sm outline-none transition focus:border-[var(--brand)] disabled:cursor-not-allowed disabled:opacity-70 ${stateClasses}`}
    />
  );
}
