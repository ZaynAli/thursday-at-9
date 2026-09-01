import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { PasswordSetupGate } from "@/components/auth/PasswordSetupGate";
import { AppShell } from "@/components/layout/AppShell";
import { AppSessionProvider } from "@/context/AppSessionContext";
import { FantasyTeamProvider } from "@/context/FantasyTeamContext";
import { LEAGUE_NAME } from "@/lib/constants";
import { getAuthUserNeedsPasswordSetup } from "@/lib/auth/session.server";
import { getDataSource } from "@/lib/data/config";
import {
  getAvailablePlayers,
  getCurrentGameweek,
  getCurrentUser,
  getFantasyTeamForManager,
  getRosterPlayers,
  getStandingsWithCurrentUser,
  getVisibleFantasyTeams,
  getLatestRecap,
} from "@/lib/data";
import { canViewOtherFantasyTeams } from "@/lib/fantasy/gameweek-access";
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
  title: LEAGUE_NAME,
  description: "Private fantasy soccer league — Thursday nights at 9:30 PM",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: LEAGUE_NAME,
  },
};

export const viewport: Viewport = {
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [currentUser, needsPasswordSetup, gameweek, rosterPlayers] = await Promise.all([
    getCurrentUser(),
    getAuthUserNeedsPasswordSetup(),
    getCurrentGameweek(),
    getRosterPlayers(),
  ]);

  const standings = await getStandingsWithCurrentUser(currentUser?.id);

  const availablePlayers = await getAvailablePlayers(gameweek.availablePlayerIds);

  const [initialFantasyTeam, visibleFantasyTeams, latestRecap] = await Promise.all([
    currentUser?.isFantasyManager && gameweek.id !== "draft"
      ? getFantasyTeamForManager(gameweek.id, currentUser.id)
      : Promise.resolve(null),
    canViewOtherFantasyTeams(gameweek)
      ? getVisibleFantasyTeams(gameweek.id)
      : Promise.resolve([]),
    getLatestRecap(currentUser?.id),
  ]);

  const session = {
    currentUser,
    gameweek,
    availablePlayers,
    rosterPlayers,
    standings,
    latestRecap,
    dataSource: getDataSource(),
  };

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full dark`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <AppSessionProvider value={session}>
          <PasswordSetupGate needsPasswordSetup={needsPasswordSetup}>
            <FantasyTeamProvider
              initialTeam={initialFantasyTeam}
              visibleTeams={visibleFantasyTeams}
            >
              <AppShell>{children}</AppShell>
            </FantasyTeamProvider>
          </PasswordSetupGate>
        </AppSessionProvider>
      </body>
    </html>
  );
}
