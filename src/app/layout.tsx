import type { Metadata, Viewport } from "next";
import { BackgroundLayer } from "@/components/BackgroundLayer";
import { AppFooter, AppHeader } from "@/components/AppHeader";
import { IgnModal } from "@/components/IgnModal";
import { RunsProvider } from "@/hooks/RunsContext";
import { LIVE_URL, REPO_URL } from "@/lib/constants";
import "./globals.css";

const siteTitle = "RotMG Dungeon Timer";
const siteDescription =
  "Track Realm of the Mad God dungeon clear times, compare against speedrun WRs, and compete on a shared leaderboard.";

export const metadata: Metadata = {
  title: {
    default: siteTitle,
    template: `%s · ${siteTitle}`,
  },
  description: siteDescription,
  metadataBase: new URL(LIVE_URL),
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    url: LIVE_URL,
    siteName: siteTitle,
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary",
    title: siteTitle,
    description: siteDescription,
  },
  alternates: {
    canonical: LIVE_URL,
  },
  other: {
    "github-repo": REPO_URL,
  },
};

export const viewport: Viewport = {
  colorScheme: "dark light",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f4f4" },
    { media: "(prefers-color-scheme: dark)", color: "#0c0c0c" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <RunsProvider>
          <BackgroundLayer />
          <main className="relative z-0 mx-auto max-w-[var(--content-max)] px-[1.15rem] pt-7 pb-5">
            <AppHeader />
            {children}
          </main>
          <AppFooter />
          <IgnModal />
        </RunsProvider>
      </body>
    </html>
  );
}
