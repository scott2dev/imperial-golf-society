"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { navItems, siteName } from "@/lib/site-data";

function isActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function SiteHeader() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const isHomePage = pathname === "/";

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

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
            <Image
              src="/golf-logo.png"
              alt="Imperial Golf Society logo"
              width={40}
              height={40}
              className="h-10 w-10 object-contain"
              priority
            />
            <span className="block truncate text-base font-semibold text-white sm:text-lg">
              {siteName}
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
                      className={`inline-flex rounded-full px-4 py-2 text-sm font-medium transition ${
                        active
                          ? "bg-[#f3e1ae] text-[#173021] ring-1 ring-white/55 shadow-sm"
                          : "!text-white hover:bg-white/12 !hover:text-white"
                      }`}
                    >
                      <span className={active ? "text-[#173021]" : "!text-white"}>
                        {item.label}
                      </span>
                    </Link>
                  </li>
                );
              })}
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
                    className={`flex items-center justify-between rounded-2xl px-4 py-3 text-base font-medium transition ${
                      active
                        ? "bg-[#f3e1ae] text-[#173021] shadow-sm ring-1 ring-white/55"
                        : "bg-white/10 !text-white hover:bg-white/16 !hover:text-white"
                    }`}
                  >
                    <span className={active ? "text-[#173021]" : "!text-white"}>
                      {item.label}
                    </span>
                    <span
                      aria-hidden="true"
                      className={active ? "text-[#173021]" : "!text-white"}
                    >
                      {active ? "On" : "+"}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </header>
  );
}
