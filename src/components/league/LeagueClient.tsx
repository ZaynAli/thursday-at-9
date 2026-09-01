"use client";

import { LeagueTable } from "@/components/league/LeagueTable";
import { PlayerStatsTable } from "@/components/league/PlayerStatsTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { LeagueStanding, PlayerSeasonStats } from "@/types";

interface LeagueClientProps {
  standings: LeagueStanding[];
  stats: PlayerSeasonStats[];
}

export function LeagueClient({ standings, stats }: LeagueClientProps) {
  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">League</h1>
        <p className="text-sm text-text-muted mt-1">
          Standings and player statistics
        </p>
      </div>

      <Tabs defaultValue="standings">
        <TabsList className="bg-surface border border-border w-full sm:w-auto">
          <TabsTrigger
            value="standings"
            className="flex-1 sm:flex-none data-[state=active]:bg-lime/15 data-[state=active]:text-lime"
          >
            Fantasy League
          </TabsTrigger>
          <TabsTrigger
            value="stats"
            className="flex-1 sm:flex-none data-[state=active]:bg-lime/15 data-[state=active]:text-lime"
          >
            Player Stats
          </TabsTrigger>
        </TabsList>

        <TabsContent value="standings" className="mt-4">
          <LeagueTable standings={standings} />
        </TabsContent>

        <TabsContent value="stats" className="mt-4">
          <PlayerStatsTable stats={stats} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
