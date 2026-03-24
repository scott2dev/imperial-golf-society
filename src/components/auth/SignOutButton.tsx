"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";

type SignOutButtonProps = {
  callbackUrl?: string;
  className?: string;
};

export default function SignOutButton({
  callbackUrl = "/",
  className,
}: SignOutButtonProps) {
  const [isPending, setIsPending] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        setIsPending(true);
        await signOut({ callbackUrl });
      }}
      disabled={isPending}
      className={className}
    >
      {isPending ? "Signing out..." : "Sign out"}
    </button>
  );
}
