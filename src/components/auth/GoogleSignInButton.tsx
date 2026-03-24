"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

type GoogleSignInButtonProps = {
  callbackUrl?: string;
};

export default function GoogleSignInButton({
  callbackUrl = "/portal",
}: GoogleSignInButtonProps) {
  const [isPending, setIsPending] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        setIsPending(true);
        await signIn("google", { callbackUrl });
      }}
      disabled={isPending}
      className="inline-flex min-h-12 items-center justify-center rounded-full bg-[var(--brand)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-dark)] disabled:cursor-wait disabled:opacity-70"
    >
      {isPending ? "Connecting to Google..." : "Continue with Google"}
    </button>
  );
}
