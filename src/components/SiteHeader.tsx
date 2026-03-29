"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Cormorant_Garamond, Libre_Baskerville } from "next/font/google";
import { signOut, useSession } from "next-auth/react";
import { navItems, siteName } from "@/lib/site-data";

const titleFont = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["600"],
  style: ["italic"],
});

const navFont = Libre_Baskerville({
  subsets: ["latin"],
  weight: ["400", "700"],
});

function isActive(pathname: string, href: string) {
  const normalizedHref = href.split("#")[0] || "/";

  if (normalizedHref === "/") {
    return pathname === "/";
  }

  return pathname === normalizedHref || pathname.startsWith(`${normalizedHref}/`);
}

export default function SiteHeader() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const isHomePage = pathname === "/";
  const { status } = useSession();
  const isSignedIn = status === "authenticated";

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b backdrop-blur-xl ${
        isHomePage
          ? "border-white/18 bg-white/10"
          : "border-[#9fc3a7]/20 bg-[rgba(14,47,33,0.72)]"
      }`}
    >
      <div className="mx-auto max-w-6xl">
        <div className="flex min-h-16 items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <span className="relative -my-3 -ml-1 block h-14 w-14 shrink-0 overflow-visible">
              <Image
                src="/bangoremblem.png"
                alt="Bangor emblem"
                width={96}
                height={96}
                className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 object-contain"
                priority
              />
            </span>
            <span className="block truncate text-base font-semibold text-white sm:text-lg">
              <span className={`${titleFont.className} text-xl italic tracking-[0.04em] sm:text-[1.7rem]`}>
                {siteName}
              </span>
            </span>
          </Link>

          <button
            type="button"
            aria-expanded={isOpen}
            aria-controls="site-navigation"
            aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
            onClick={() => setIsOpen((open) => !open)}
            className={`inline-flex h-11 w-11 items-center justify-center rounded-full text-white shadow-sm md:hidden ${
              isHomePage
                ? "border border-white/25 bg-white/12"
                : "border border-[#b9d4bf]/22 bg-white/10"
            }`}
          >
            <span className="sr-only">Menu</span>
            {isOpen ? (
              <span className="relative block h-5 w-5">
                <span className="absolute inset-x-0 top-1/2 block h-0.5 -translate-y-1/2 rotate-45 rounded-full bg-current" />
                <span className="absolute inset-x-0 top-1/2 block h-0.5 -translate-y-1/2 -rotate-45 rounded-full bg-current" />
              </span>
            ) : (
              <span className="relative block h-5 w-5">
                <span className="absolute inset-x-0 top-[3px] block h-0.5 rounded-full bg-current" />
                <span className="absolute inset-x-0 top-1/2 block h-0.5 -translate-y-1/2 rounded-full bg-current" />
                <span className="absolute inset-x-0 bottom-[3px] block h-0.5 rounded-full bg-current" />
              </span>
            )}
          </button>

          <nav className="hidden md:block" aria-label="Primary">
            <ul className="flex flex-wrap items-center justify-end gap-2">
              {navItems.map((item) => {
                const active = isActive(pathname, item.href);

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={`inline-flex rounded-full px-4 py-2 text-sm font-medium transition ${
                        active
                          ? "bg-[#f3e1ae] text-[#173021] ring-1 ring-white/55 shadow-sm"
                          : "!text-white hover:bg-white/12 !hover:text-white"
                      }`}
                    >
                      <span
                        className={`${navFont.className} ${active ? "text-[#173021]" : "!text-white"} tracking-[0.03em]`}
                      >
                        {item.label}
                      </span>
                    </Link>
                  </li>
                );
              })}
              <li>
                {isSignedIn ? (
                  <button
                    type="button"
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="inline-flex rounded-full border border-white/25 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/12"
                  >
                    Sign out
                  </button>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setIsOpen(false)}
                    className="inline-flex rounded-full border border-white/25 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/12"
                  >
                    Login
                  </Link>
                )}
              </li>
            </ul>
          </nav>
        </div>

        <nav
          id="site-navigation"
          aria-label="Mobile"
          className={`${isOpen ? "block" : "hidden"} border-t border-white/15 px-4 py-4 md:hidden sm:px-6`}
        >
          <ul className="grid gap-2">
            {navItems.map((item) => {
              const active = isActive(pathname, item.href);

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                  className={`flex items-center justify-between rounded-2xl px-4 text-base font-medium transition ${
                      active
                        ? "bg-[#f3e1ae] py-1.5 text-[#173021] shadow-sm ring-1 ring-white/55"
                        : "bg-white/10 py-3 !text-white hover:bg-white/16 !hover:text-white"
                    }`}
                  >
                    <span
                      className={`${navFont.className} ${active ? "text-[#173021]" : "!text-white"} tracking-[0.03em]`}
                    >
                      {item.label}
                    </span>
                    <span
                      aria-hidden="true"
                      className={active ? "text-[#173021]" : "!text-white"}
                    >
                      {active ? null : "+"}
                    </span>
                  </Link>
                </li>
              );
            })}
            <li>
              {isSignedIn ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    signOut({ callbackUrl: "/" });
                  }}
                  className="flex w-full items-center justify-between rounded-2xl bg-white/10 px-4 py-3 text-base font-medium text-white transition hover:bg-white/16"
                >
                  <span>Sign out</span>
                  <span aria-hidden="true">-</span>
                </button>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3 text-base font-medium text-white transition hover:bg-white/16"
                >
                  <span>Login</span>
                  <span aria-hidden="true">+</span>
                </Link>
              )}
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
