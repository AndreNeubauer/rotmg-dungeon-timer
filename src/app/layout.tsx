import type { Metadata, Viewport } from "next";
import { BackgroundLayer } from "@/components/BackgroundLayer";
import { AppFooter, AppHeader } from "@/components/AppHeader";
import { RunsProvider } from "@/hooks/RunsContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "RotMG Timer",
  description: "Dungeon clear timer for Realm of the Mad God",
};

export const viewport: Viewport = {
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <RunsProvider>
          <BackgroundLayer />
          <main className="relative z-0 mx-auto max-w-[var(--content-max)] px-[1.15rem] pt-7 pb-5">
            <AppHeader />
            {children}
          </main>
          <AppFooter />
        </RunsProvider>
      </body>
    </html>
  );
}
