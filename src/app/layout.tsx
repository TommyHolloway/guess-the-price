import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Guess the Price: the daily home price game",
  description: "Five recently sold US homes a day. Guess what they sold for, keep your streak, share your score.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#fff8ec" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh">
        <header className="mx-auto flex max-w-xl items-center justify-between px-4 pt-3 pb-2">
          <Link href="/" className="text-lg font-extrabold tracking-tight">
            🏠 Guess the Price
          </Link>
          <nav className="flex gap-4 text-sm font-medium text-muted">
            <Link href="/leaderboard">Leaderboard</Link>
            <Link href="/stats">Stats</Link>
          </nav>
        </header>
        <main className="mx-auto max-w-xl px-4 pb-10">{children}</main>
      </body>
    </html>
  );
}
