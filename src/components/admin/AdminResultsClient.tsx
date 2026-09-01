"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  publishGameweekAction,
  saveGameweekResultsAction,
} from "@/lib/admin/results-actions";
import { dbSideToUiTeam, uiTeamToDbSide } from "@/lib/fantasy/team-side";
import type { GameweekResultsSnapshot } from "@/lib/data/results";
import type { DataSource } from "@/lib/data/config";
import type { Player } from "@/types";
import { Minus, Plus, Save, Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PlayerStatEntry {
  playerId: string;
  team: "white" | "color";
  goals: number;
  assists: number;
  defensiveStops: number;
}

function StatCounter({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[10px] text-text-muted uppercase">{label}</span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange(Math.max(0, value - 1))}
          className="h-7 w-7 rounded-md bg-surface border border-border flex items-center justify-center hover:bg-surface-hover active:scale-95 transition-transform disabled:opacity-40"
        >
          <Minus className="h-3 w-3" />
        </button>
        <span className="w-8 text-center font-bold tabular-nums text-sm">
          {value}
        </span>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange(value + 1)}
          className="h-7 w-7 rounded-md bg-surface border border-border flex items-center justify-center hover:bg-surface-hover active:scale-95 transition-transform disabled:opacity-40"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

interface AdminResultsClientProps {
  sessionPlayers: Player[];
  snapshot: GameweekResultsSnapshot | null;
  dataSource: DataSource;
}

function buildInitialStats(
  snapshot: GameweekResultsSnapshot | null,
  sessionPlayers: Player[]
): Record<string, PlayerStatEntry> {
  const initial: Record<string, PlayerStatEntry> = {};

  sessionPlayers.forEach((player, index) => {
    const saved = snapshot?.playerStats.find((stat) => stat.playerId === player.id);
    initial[player.id] = {
      playerId: player.id,
      team: saved ? dbSideToUiTeam(saved.teamSide) : index % 2 === 0 ? "white" : "color",
      goals: saved?.goals ?? 0,
      assists: saved?.assists ?? 0,
      defensiveStops: saved?.defensiveStops ?? 0,
    };
  });

  return initial;
}

export function AdminResultsClient({
  sessionPlayers,
  snapshot,
  dataSource,
}: AdminResultsClientProps) {
  const teamAName = snapshot?.teamAName ?? "White";
  const teamBName = snapshot?.teamBName ?? "Colours";
  const [teamAScore, setTeamAScore] = useState(snapshot?.teamAScore ?? 0);
  const [teamBScore, setTeamBScore] = useState(snapshot?.teamBScore ?? 0);
  const [stats, setStats] = useState<Record<string, PlayerStatEntry>>(() =>
    buildInitialStats(snapshot, sessionPlayers)
  );
  const [isPublished, setIsPublished] = useState(snapshot?.isPublished ?? false);
  const [savePending, setSavePending] = useState(false);
  const [publishPending, setPublishPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const readOnly = isPublished || dataSource === "mock";

  const payload = useMemo(
    () => ({
      gameweekId: snapshot?.gameweekId ?? "",
      teamAScore,
      teamBScore,
      playerStats: Object.values(stats).map((entry) => ({
        playerId: entry.playerId,
        teamSide: uiTeamToDbSide(entry.team),
        goals: entry.goals,
        assists: entry.assists,
        defensiveStops: entry.defensiveStops,
      })),
    }),
    [snapshot?.gameweekId, stats, teamAScore, teamBScore]
  );

  const updateStat = (
    playerId: string,
    field: keyof Pick<PlayerStatEntry, "goals" | "assists" | "defensiveStops">,
    value: number
  ) => {
    setStats((prev) => ({
      ...prev,
      [playerId]: { ...prev[playerId], [field]: value },
    }));
  };

  const toggleTeam = (playerId: string) => {
    setStats((prev) => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        team: prev[playerId].team === "white" ? "color" : "white",
      },
    }));
  };

  async function handleSave() {
    if (!snapshot?.gameweekId) return;
    setSavePending(true);
    setError(null);
    setMessage(null);

    const result = await saveGameweekResultsAction(payload);
    setSavePending(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setMessage("Results saved.");
  }

  async function handlePublish() {
    if (!snapshot?.gameweekId) return;
    setPublishPending(true);
    setError(null);
    setMessage(null);

    const saveResult = await saveGameweekResultsAction(payload);
    if (!saveResult.ok) {
      setPublishPending(false);
      setError(saveResult.error);
      return;
    }

    const publishResult = await publishGameweekAction(snapshot.gameweekId);
    setPublishPending(false);

    if (!publishResult.ok) {
      setError(publishResult.error);
      return;
    }

    setIsPublished(true);
    setMessage("Gameweek published — fantasy scores and standings updated.");
  }

  if (dataSource === "mock") {
    return (
      <div className="rounded-lg border border-border bg-surface p-4 text-sm text-text-muted">
        Connect Supabase to enter and publish real gameweek results.
      </div>
    );
  }

  if (!snapshot) {
    return (
      <div className="rounded-lg border border-border bg-surface p-4 text-sm text-text-muted">
        No active gameweek session yet. Set up and lock a gameweek before entering results.
      </div>
    );
  }

  if (sessionPlayers.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-surface p-4 text-sm text-text-muted">
        This gameweek has no session players. Save the weekly session first.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-surface px-4 py-3 text-sm text-text-muted">
        Gameweek {String(snapshot.gameweekNumber).padStart(2, "0")} ·{" "}
        {snapshot.gameweekStatus.replaceAll("_", " ")}
      </div>

      <div className="surface-card p-4">
        <h3 className="font-semibold text-sm mb-4">Final Score</h3>
        <div className="flex items-center justify-center gap-6">
          <ScoreControl
            label={teamAName}
            value={teamAScore}
            onChange={setTeamAScore}
            disabled={readOnly}
          />
          <span className="text-text-muted text-lg">–</span>
          <ScoreControl
            label={teamBName}
            value={teamBScore}
            onChange={setTeamBScore}
            disabled={readOnly}
          />
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="font-semibold text-sm">Player Statistics</h3>
        {sessionPlayers.map((player) => {
          const entry = stats[player.id];
          if (!entry) return null;
          return (
            <div key={player.id} className="surface-card p-3">
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium text-sm">{player.name}</span>
                <button
                  type="button"
                  disabled={readOnly}
                  onClick={() => toggleTeam(player.id)}
                  className={cn(
                    "px-2 py-0.5 rounded text-xs font-medium border transition-colors disabled:opacity-40",
                    entry.team === "white"
                      ? "bg-white/10 text-white border-white/20"
                      : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                  )}
                >
                  {entry.team === "white" ? teamAName : teamBName}
                </button>
              </div>
              <div className="flex justify-around">
                <StatCounter
                  label="Goals"
                  value={entry.goals}
                  disabled={readOnly}
                  onChange={(value) => updateStat(player.id, "goals", value)}
                />
                <StatCounter
                  label="Assists"
                  value={entry.assists}
                  disabled={readOnly}
                  onChange={(value) => updateStat(player.id, "assists", value)}
                />
                <StatCounter
                  label="Stops"
                  value={entry.defensiveStops}
                  disabled={readOnly}
                  onChange={(value) =>
                    updateStat(player.id, "defensiveStops", value)
                  }
                />
              </div>
            </div>
          );
        })}
      </div>

      {!readOnly && (
        <div className="space-y-2">
          <Button
            variant="outline"
            className="w-full gap-2"
            disabled={savePending || publishPending}
            onClick={() => void handleSave()}
          >
            {savePending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Results
          </Button>
          <Button
            className="w-full bg-lime text-background hover:bg-lime-muted gap-2"
            disabled={publishPending || savePending}
            onClick={() => void handlePublish()}
          >
            {publishPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Publish Gameweek
          </Button>
        </div>
      )}

      {isPublished && (
        <p className="text-sm text-lime text-center animate-slide-up">
          Gameweek published — fantasy scores and standings updated.
        </p>
      )}

      {message && !error && (
        <p className="text-sm text-text-muted text-center">{message}</p>
      )}
      {error && <p className="text-sm text-destructive text-center">{error}</p>}
    </div>
  );
}

function ScoreControl({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="text-center">
      <Label className="text-xs text-text-muted">{label}</Label>
      <div className="flex items-center gap-2 mt-1">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange(Math.max(0, value - 1))}
          className="h-8 w-8 rounded-md bg-surface border border-border flex items-center justify-center disabled:opacity-40"
        >
          <Minus className="h-3 w-3" />
        </button>
        <span className="text-3xl font-bold tabular-nums w-10 text-center">
          {value}
        </span>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange(value + 1)}
          className="h-8 w-8 rounded-md bg-surface border border-border flex items-center justify-center disabled:opacity-40"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
