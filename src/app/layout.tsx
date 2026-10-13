import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import Link from "next/link";
import "./globals.css";

/** Lilita One: the game-show display face for prices, scores and buttons. */
const display = localFont({ src: "../../assets/fonts/LilitaOne.woff2", variable: "--font-display", display: "swap" });

export const metadata: Metadata = {
  title: "Guess the Price: the daily home price game",
  description: "Five recently sold US homes a day. Guess what they sold for, keep your streak, share your score.",
  applicationName: "Guess the Price",
  appleWebApp: { capable: true, title: "Guess Price", statusBarStyle: "black-translucent" },
  icons: { apple: "/api/icon/180" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#1c0f52",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={display.variable}>
      <body className="min-h-dvh">
        <header className="safe-x mx-auto flex max-w-xl items-center lg:max-w-6xl justify-between pt-[max(env(safe-area-inset-top),10px)] pb-2">
          <Link
            href="/"
            className="font-display flex shrink-0 items-center gap-2 text-lg tracking-wide whitespace-nowrap text-white sm:text-xl lg:text-2xl"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icon.svg" alt="" className="h-7 w-7 rounded-lg lg:h-8 lg:w-8" />
            Guess the Price
          </Link>
          <nav className="-mr-2 flex text-sm font-semibold text-white/75">
            <Link href="/leaderboard" className="rounded-full px-2 py-1.5 hover:bg-white/10 hover:text-white sm:px-3">
              Leaderboard
            </Link>
            <Link href="/stats" className="rounded-full px-2 py-1.5 hover:bg-white/10 hover:text-white sm:px-3">
              Stats
            </Link>
          </nav>
        </header>
        <main className="safe-x mx-auto max-w-xl pb-10 lg:max-w-6xl">{children}</main>
      </body>
    </html>
  );
}
