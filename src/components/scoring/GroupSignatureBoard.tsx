"use client";

import type { PointerEvent as ReactPointerEvent } from "react";
import { useEffect, useRef, useState, useTransition } from "react";
import { saveGroupSignature } from "@/app/portal/outings/[outingId]/actions";

type PlayerSignature = {
  memberId: string;
  name: string;
  signatureData: string | null;
  signedAt: string | null;
};

type GroupSignatureBoardProps = {
  isScorekeeper: boolean;
  outingId: string;
  players: PlayerSignature[];
};

export function GroupSignatureBoard({
  isScorekeeper,
  outingId,
  players,
}: GroupSignatureBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const isDrawingRef = useRef(false);
  const [selectedMemberId, setSelectedMemberId] = useState(players[0]?.memberId ?? "");
  const [signatureOverrides, setSignatureOverrides] = useState<Record<string, PlayerSignature>>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [hasInk, setHasInk] = useState(false);
  const [isPending, startTransition] = useTransition();

  const signatures = Object.fromEntries(
    players.map((player) => [player.memberId, signatureOverrides[player.memberId] ?? player]),
  );
  const resolvedSelectedMemberId = players.some((player) => player.memberId === selectedMemberId)
    ? selectedMemberId
    : (players[0]?.memberId ?? "");

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = canvasContainerRef.current;

    if (!canvas || !container) {
      return;
    }

    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    const ratio = window.devicePixelRatio || 1;
    const width = Math.max(container.clientWidth, 1);
    const height = 200;

    canvas.width = width * ratio;
    canvas.height = height * ratio;
    canvas.style.width = "100%";
    canvas.style.height = `${height}px`;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.lineCap = "round";
    context.lineJoin = "round";
    context.lineWidth = 2.5;
    context.strokeStyle = "#223127";
    context.fillStyle = "#faf7f1";
    context.clearRect(0, 0, width, height);
    context.fillRect(0, 0, width, height);
  }, [resolvedSelectedMemberId]);

  const selectedPlayer = signatures[resolvedSelectedMemberId] ?? null;
  const signedCount = Object.values(signatures).filter((player) => Boolean(player.signatureData)).length;
  const allPlayersSigned = players.length > 0 && signedCount === players.length;

  function getPoint(event: ReactPointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;

    if (!canvas) {
      return null;
    }

    const bounds = canvas.getBoundingClientRect();
    const scaleX = canvas.width / bounds.width;
    const scaleY = canvas.height / bounds.height;
    const ratio = window.devicePixelRatio || 1;

    return {
      x: ((event.clientX - bounds.left) * scaleX) / ratio,
      y: ((event.clientY - bounds.top) * scaleY) / ratio,
    };
  }

  function startDrawing(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (!isScorekeeper) {
      return;
    }

    const point = getPoint(event);
    const context = canvasRef.current?.getContext("2d");

    if (!point || !context) {
      return;
    }

    isDrawingRef.current = true;
    context.beginPath();
    context.moveTo(point.x, point.y);
    setHasInk(true);
    setSaveError(null);
  }

  function continueDrawing(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (!isDrawingRef.current) {
      return;
    }

    const point = getPoint(event);
    const context = canvasRef.current?.getContext("2d");

    if (!point || !context) {
      return;
    }

    context.lineTo(point.x, point.y);
    context.stroke();
  }

  function stopDrawing() {
    isDrawingRef.current = false;
  }

  function clearCanvas() {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");

    if (!canvas || !context) {
      return;
    }

    const width = canvas.width / (window.devicePixelRatio || 1);
    const height = canvas.height / (window.devicePixelRatio || 1);

    context.clearRect(0, 0, width, height);
    context.fillStyle = "#faf7f1";
    context.fillRect(0, 0, width, height);
    setHasInk(false);
    setSaveError(null);
  }

  function saveSignature() {
    const canvas = canvasRef.current;

    if (!canvas || !selectedPlayer) {
      return;
    }

    if (!hasInk) {
      setSaveError("Please draw a signature before saving it.");
      return;
    }

    const signatureData = canvas.toDataURL("image/png");

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("outingId", outingId);
        formData.set("memberId", selectedPlayer.memberId);
        formData.set("signatureData", signatureData);
        await saveGroupSignature(formData);
        setSignatureOverrides((current) => ({
          ...current,
          [selectedPlayer.memberId]: {
            ...(current[selectedPlayer.memberId] ?? selectedPlayer),
            signatureData,
            signedAt: new Date().toISOString(),
          },
        }));
        clearCanvas();
      } catch {
        setSaveError("Signature could not be saved. Please try again.");
      }
    });
  }

  return (
    <div className="mt-6 rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
            Scorecard Sign-Off
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-[var(--brand-dark)]">
            Player signatures
          </h2>
        </div>
        <span className="rounded-full border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-2 text-sm font-semibold text-[var(--brand-dark)]">
          {signedCount} / {players.length} signed
        </span>
      </div>

      <div className="mt-5 grid gap-3">
        {players.map((player) => (
          <div
            key={player.memberId}
            className="flex flex-wrap items-center justify-between gap-3 rounded-[1.25rem] bg-[var(--surface-strong)] px-4 py-3"
          >
            <div>
              <p className="font-semibold text-[var(--brand-dark)]">{player.name}</p>
              <p className="mt-1 text-sm text-slate-600">
                {signatures[player.memberId]?.signatureData ? "Signed" : "Awaiting signature"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedMemberId(player.memberId);
                setHasInk(false);
              }}
              className="inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--brand-dark)] transition hover:bg-[var(--surface)]"
            >
              {signatures[player.memberId]?.signatureData ? "Replace signature" : "Collect signature"}
            </button>
          </div>
        ))}
      </div>

      {allPlayersSigned ? (
        <div className="mt-6 rounded-[1.5rem] border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-800">
          All players in this group have now signed the scorecard.
        </div>
      ) : selectedPlayer ? (
        <div className="mt-6 rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface-strong)] p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--brand)]">
                Signing now
              </p>
              <p className="mt-2 font-semibold text-[var(--brand-dark)]">{selectedPlayer.name}</p>
            </div>
            {selectedPlayer.signatureData ? (
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-800">
                Signed
              </span>
            ) : null}
          </div>

          <div
            ref={canvasContainerRef}
            className="mt-4 overflow-hidden rounded-[1rem] border border-[var(--border)] bg-[#faf7f1]"
          >
            <canvas
              ref={canvasRef}
              onPointerDown={startDrawing}
              onPointerMove={continueDrawing}
              onPointerUp={stopDrawing}
              onPointerLeave={stopDrawing}
              className="touch-none"
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={clearCanvas}
              className="inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--brand-dark)] transition hover:bg-[var(--surface)]"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={saveSignature}
              disabled={!isScorekeeper || isPending}
              className="inline-flex min-h-10 items-center justify-center rounded-full bg-[var(--brand)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--brand-dark)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? "Saving signature..." : "Save signature"}
            </button>
          </div>

          {saveError ? <p className="mt-3 text-sm text-rose-700">{saveError}</p> : null}
          {!isScorekeeper ? (
            <p className="mt-3 text-sm text-slate-600">
              Only the current scorekeeper can collect signatures for this group.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
