"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { saveHoleScores } from "@/app/portal/outings/[outingId]/actions";

type Hole = {
  id: string;
  holeNumber: number;
  par: number;
  strokeIndex: number;
};

type Player = {
  id: string;
  memberId: string;
  name: string;
};

type HoleScore = {
  grossStrokes: number;
  netStrokes: number;
  stablefordPoints: number;
};

type ScoresByHole = Record<number, Record<string, HoleScore>>;

type SaveState = "idle" | "incomplete" | "saving" | "saved" | "error";

type OutingScorecardProps = {
  holes: Hole[];
  initialScoresByHole: ScoresByHole;
  isScorekeeper: boolean;
  outingId: string;
  players: Player[];
};

function getInputClasses(savedValue: string, draftValue: string) {
  const hasSavedValue = savedValue !== "";
  const isEditingSavedValue = hasSavedValue && draftValue !== savedValue;

  if (isEditingSavedValue) {
    return "border-orange-200 bg-orange-50 text-orange-950";
  }

  if (hasSavedValue) {
    return "border-emerald-200 bg-emerald-50 text-emerald-950";
  }

  return "border-[var(--border)] bg-[var(--surface)] text-[var(--brand-dark)]";
}

export function OutingScorecard({
  holes,
  initialScoresByHole,
  isScorekeeper,
  outingId,
  players,
}: OutingScorecardProps) {
  const [currentHoleIndex, setCurrentHoleIndex] = useState(0);
  const [savedScoresByHole, setSavedScoresByHole] = useState<ScoresByHole>(initialScoresByHole);
  const [draftScoresByHole, setDraftScoresByHole] = useState<Record<number, Record<string, string>>>(
    () =>
      Object.fromEntries(
        holes.map((hole) => [
          hole.holeNumber,
          Object.fromEntries(
            players.map((player) => [
              player.memberId,
              initialScoresByHole[hole.holeNumber]?.[player.memberId]
                ? String(initialScoresByHole[hole.holeNumber][player.memberId].grossStrokes)
                : "",
            ]),
          ),
        ]),
      ),
  );
  const [saveStateByHole, setSaveStateByHole] = useState<Record<number, SaveState>>(() =>
    Object.fromEntries(holes.map((hole) => [hole.holeNumber, "idle"])),
  );
  const [isPending, startTransition] = useTransition();
  const saveRequestId = useRef(0);

  useEffect(() => {
    setSavedScoresByHole(initialScoresByHole);
    setDraftScoresByHole(
      Object.fromEntries(
        holes.map((hole) => [
          hole.holeNumber,
          Object.fromEntries(
            players.map((player) => [
              player.memberId,
              initialScoresByHole[hole.holeNumber]?.[player.memberId]
                ? String(initialScoresByHole[hole.holeNumber][player.memberId].grossStrokes)
                : "",
            ]),
          ),
        ]),
      ),
    );
    setSaveStateByHole(Object.fromEntries(holes.map((hole) => [hole.holeNumber, "idle"])));
  }, [holes, initialScoresByHole, players]);

  const currentHole = holes[currentHoleIndex];
  const currentDrafts = draftScoresByHole[currentHole.holeNumber] ?? {};
  const currentSavedScores = savedScoresByHole[currentHole.holeNumber] ?? {};

  const holeStatus = useMemo(() => {
    const allSaved = players.every((player) => currentSavedScores[player.memberId]);

    if (saveStateByHole[currentHole.holeNumber] === "saving" || isPending) {
      return "Saving...";
    }

    if (saveStateByHole[currentHole.holeNumber] === "error") {
      return "Save failed";
    }

    if (!isScorekeeper) {
      return allSaved ? "Saved" : "Awaiting scores";
    }

    const allEntered = players.every((player) => currentDrafts[player.memberId]?.trim());
    const hasSavedChange = players.some((player) => {
      const saved = currentSavedScores[player.memberId];
      return saved && String(saved.grossStrokes) !== (currentDrafts[player.memberId] ?? "");
    });

    if (!allEntered) {
      return allSaved ? "Editing" : "Enter all scores";
    }

    if (hasSavedChange) {
      return "Ready to save";
    }

    return allSaved ? "Saved" : "Awaiting autosave";
  }, [
    currentDrafts,
    currentHole.holeNumber,
    currentSavedScores,
    isPending,
    isScorekeeper,
    players,
    saveStateByHole,
  ]);

  useEffect(() => {
    if (!isScorekeeper) {
      return;
    }

    const holeNumber = currentHole.holeNumber;
    const drafts = draftScoresByHole[holeNumber] ?? {};
    const allEntered = players.every((player) => drafts[player.memberId]?.trim());

    if (!allEntered) {
      setSaveStateByHole((current) => ({ ...current, [holeNumber]: "incomplete" }));
      return;
    }

    const hasChanges = players.some((player) => {
      const saved = savedScoresByHole[holeNumber]?.[player.memberId];
      return !saved || String(saved.grossStrokes) !== drafts[player.memberId];
    });

    if (!hasChanges) {
      setSaveStateByHole((current) => ({ ...current, [holeNumber]: "saved" }));
      return;
    }

    setSaveStateByHole((current) => ({ ...current, [holeNumber]: "saving" }));
    const requestId = ++saveRequestId.current;
    const timeout = window.setTimeout(() => {
      startTransition(async () => {
        try {
          const formData = new FormData();
          formData.set("outingId", outingId);
          formData.set("holeNumber", String(holeNumber));

          for (const player of players) {
            formData.set(`gross-${player.memberId}`, drafts[player.memberId]);
          }

          const result = await saveHoleScores(formData);

          if (requestId !== saveRequestId.current || !result) {
            return;
          }

          setSavedScoresByHole((current) => ({
            ...current,
            [holeNumber]: Object.fromEntries(
              result.scores.map((score) => [
                score.memberId,
                {
                  grossStrokes: score.grossStrokes,
                  netStrokes: score.netStrokes,
                  stablefordPoints: score.stablefordPoints,
                },
              ]),
            ),
          }));
          setDraftScoresByHole((current) => ({
            ...current,
            [holeNumber]: Object.fromEntries(
              result.scores.map((score) => [score.memberId, String(score.grossStrokes)]),
            ),
          }));
          setSaveStateByHole((current) => ({ ...current, [holeNumber]: "saved" }));
        } catch {
          if (requestId === saveRequestId.current) {
            setSaveStateByHole((current) => ({ ...current, [holeNumber]: "error" }));
          }
        }
      });
    }, 600);

    return () => window.clearTimeout(timeout);
  }, [currentHole.holeNumber, draftScoresByHole, isScorekeeper, outingId, players, savedScoresByHole]);

  return (
    <div className="mt-6 rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface-strong)] p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
            Hole {currentHole.holeNumber} of {holes.length}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            Par {currentHole.par} • Stroke Index {currentHole.strokeIndex}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-700">
            {holeStatus}
          </span>
          <button
            type="button"
            onClick={() => setCurrentHoleIndex((value) => Math.max(0, value - 1))}
            disabled={currentHoleIndex === 0}
            className="inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--brand-dark)] transition hover:bg-[var(--surface)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() =>
              setCurrentHoleIndex((value) => Math.min(holes.length - 1, value + 1))
            }
            disabled={currentHoleIndex === holes.length - 1}
            className="inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--brand-dark)] transition hover:bg-[var(--surface)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto rounded-[1rem] border border-[var(--border)] bg-[var(--surface)]">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead className="bg-[var(--surface)] text-[var(--brand-dark)]">
            <tr>
              <th className="px-3 py-2 font-semibold">Player</th>
              <th className="px-3 py-2 font-semibold">Gross</th>
              <th className="px-3 py-2 font-semibold">Net</th>
              <th className="px-3 py-2 font-semibold">Pts</th>
            </tr>
          </thead>
          <tbody>
            {players.map((player) => {
              const savedScore = currentSavedScores[player.memberId];
              const draftValue = currentDrafts[player.memberId] ?? "";
              const savedValue = savedScore ? String(savedScore.grossStrokes) : "";

              return (
                <tr
                  key={`${player.id}-${currentHole.holeNumber}`}
                  className="border-t border-[var(--border)] text-[var(--brand-dark)]"
                >
                  <td className="px-3 py-2 font-semibold">{player.name}</td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={draftValue}
                      disabled={!isScorekeeper}
                      onChange={(event) => {
                        const nextValue = event.target.value;

                        setDraftScoresByHole((current) => ({
                          ...current,
                          [currentHole.holeNumber]: {
                            ...current[currentHole.holeNumber],
                            [player.memberId]: nextValue,
                          },
                        }));
                      }}
                      className={`w-14 rounded-lg border px-2.5 py-1.5 text-sm outline-none transition focus:border-[var(--brand)] disabled:cursor-not-allowed disabled:opacity-70 ${getInputClasses(savedValue, draftValue)}`}
                    />
                  </td>
                  <td className="px-3 py-2 text-sm text-slate-600">
                    {savedScore?.netStrokes ?? "—"}
                  </td>
                  <td className="px-3 py-2 text-sm font-semibold text-slate-700">
                    {savedScore?.stablefordPoints ?? "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {!isScorekeeper ? (
        <p className="mt-4 text-sm text-slate-600">
          Only the current scorekeeper can edit these scores.
        </p>
      ) : null}
    </div>
  );
}
