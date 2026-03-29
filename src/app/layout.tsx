import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import AuthSessionProvider from "@/components/auth/AuthSessionProvider";
import SiteHeader from "@/components/SiteHeader";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Imperial Golf Society",
    template: "%s | Imperial Golf Society",
  },
  description:
    "The home of Imperial Golf Society for fixtures, results, society news, and member updates throughout the season.",
  icons: {
    icon: "/bangoremblem.png",
    shortcut: "/bangoremblem.png",
    apple: "/bangoremblem.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[var(--background)] text-[var(--foreground)]">
        <AuthSessionProvider>
          <SiteHeader />
          <div className="site-shell flex-1">{children}</div>
          <footer className="site-footer border-t border-[var(--border)] bg-[var(--surface)]">
            <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--brand)]">
                  Imperial Golf Society
                </p>
                <p className="mt-3 max-w-xl text-sm leading-7 text-slate-600">
                  The online home of Imperial Golf Society, which is associated with Imperial Bar in Bangor, Northern Ireland.
                </p>
              </div>
              <p className="mt-6 text-sm text-slate-500">
                &copy; 2026 Imperial Golf Society. All rights reserved.
              </p>
            </div>
          </footer>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
