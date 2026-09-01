"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { DataSource } from "@/lib/data/config";
import type { Gameweek, GameweekRecap, LeagueStanding, Player, Profile } from "@/types";

export interface AppSessionValue {
  currentUser: Profile | null;
  gameweek: Gameweek;
  availablePlayers: Player[];
  rosterPlayers: Player[];
  standings: LeagueStanding[];
  latestRecap: GameweekRecap | null;
  dataSource: DataSource;
}

const AppSessionContext = createContext<AppSessionValue | null>(null);

export function AppSessionProvider({
  value,
  children,
}: {
  value: AppSessionValue;
  children: ReactNode;
}) {
  return (
    <AppSessionContext.Provider value={value}>{children}</AppSessionContext.Provider>
  );
}

export function useAppSession(): AppSessionValue {
  const ctx = useContext(AppSessionContext);
  if (!ctx) {
    throw new Error("useAppSession must be used within AppSessionProvider");
  }
  return ctx;
}

export function useCurrentUser(): Profile | null {
  return useAppSession().currentUser;
}

export function useRosterPlayers(): Player[] {
  return useAppSession().rosterPlayers;
}

export function usePlayerLookup(): Map<string, Player> {
  const { rosterPlayers } = useAppSession();
  return new Map(rosterPlayers.map((player) => [player.id, player]));
}
