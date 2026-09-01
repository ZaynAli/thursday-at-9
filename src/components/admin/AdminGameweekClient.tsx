"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { SessionTeamBuilder } from "@/components/admin/SessionTeamBuilder";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { DEFAULT_FANTASY_DEADLINE, GAME_TIME } from "@/lib/constants";
import {
  lockGameweekSelectionAction,
  openGameweekSelectionAction,
  saveGameweekSessionAction,
} from "@/lib/admin/gameweek-actions";
import { NOTIFY_MESSAGE_TEMPLATE } from "@/lib/onboarding.constants";
import {
  type GameFormat,
  type SessionTeam,
  type TeamAssignments,
  GAME_FORMATS,
  getMaxSessionPlayers,
  getFormatConfig,
  isTeamSetupComplete,
  DEFAULT_TEAM_NAMES,
} from "@/lib/session-formats";
import type { DataSource } from "@/lib/data/config";
import type { Gameweek, Player } from "@/types";
import { cn } from "@/lib/utils";
import { Bell, Lock, Users, CheckCircle2, Loader2, Save } from "lucide-react";

function buildInitialAssignments(
  playerIds: string[],
  existing?: Record<string, "white" | "color">
): TeamAssignments {
  const assignments: TeamAssignments = {};
  playerIds.forEach((id) => {
    assignments[id] = existing?.[id] ?? null;
  });
  return assignments;
}

function mergeAssignmentsForIds(
  playerIds: string[],
  current: TeamAssignments
): TeamAssignments {
  const next: TeamAssignments = {};
  playerIds.forEach((id) => {
    next[id] = current[id] ?? null;
  });
  return next;
}

function filterValidPlayerIds(ids: string[], roster: Player[]): string[] {
  const rosterIds = new Set(roster.map((player) => player.id));
  return ids.filter((id) => rosterIds.has(id));
}

function toDateInputValue(iso: string): string {
  return iso.slice(0, 10);
}

interface AdminGameweekClientProps {
  gameweek: Gameweek;
  rosterPlayers: Player[];
  fantasyManagerCount: number;
  dataSource: DataSource;
  lastNotification?: { sentAt: string; recipientCount: number } | null;
}

export function AdminGameweekClient({
  gameweek: initialGameweek,
  rosterPlayers,
  fantasyManagerCount,
  dataSource,
  lastNotification,
}: AdminGameweekClientProps) {
  const router = useRouter();
  const initialSelectedIds = filterValidPlayerIds(
    initialGameweek.availablePlayerIds,
    rosterPlayers
  );

  const [gameweekId, setGameweekId] = useState<string | null>(
    initialGameweek.id === "draft" ? null : initialGameweek.id
  );
  const [gameweekNumber, setGameweekNumber] = useState(initialGameweek.number);
  const [status, setStatus] = useState(initialGameweek.status);
  const [gameDate, setGameDate] = useState(toDateInputValue(initialGameweek.date));
  const [format, setFormat] = useState<GameFormat>(initialGameweek.format);
  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelectedIds);
  const [assignments, setAssignments] = useState<TeamAssignments>(() =>
    buildInitialAssignments(initialSelectedIds, initialGameweek.teamAssignments)
  );
  const [teamWhiteName, setTeamWhiteName] = useState(
    initialGameweek.teamWhiteName ?? DEFAULT_TEAM_NAMES.white
  );
  const [teamColorName, setTeamColorName] = useState(
    initialGameweek.teamColorName ?? DEFAULT_TEAM_NAMES.color
  );
  const [notifiedAt, setNotifiedAt] = useState<string | null>(
    lastNotification?.sentAt ?? null
  );
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const [isLocking, setIsLocking] = useState(false);

  useEffect(() => {
    setGameweekId(initialGameweek.id === "draft" ? null : initialGameweek.id);
    setGameweekNumber(initialGameweek.number);
    setStatus(initialGameweek.status);
    setGameDate(toDateInputValue(initialGameweek.date));
    setFormat(initialGameweek.format);
    const ids = filterValidPlayerIds(initialGameweek.availablePlayerIds, rosterPlayers);
    setSelectedIds(ids);
    setAssignments(buildInitialAssignments(ids, initialGameweek.teamAssignments));
    setTeamWhiteName(initialGameweek.teamWhiteName ?? DEFAULT_TEAM_NAMES.white);
    setTeamColorName(initialGameweek.teamColorName ?? DEFAULT_TEAM_NAMES.color);
    setNotifiedAt(lastNotification?.sentAt ?? null);
  }, [initialGameweek, lastNotification, rosterPlayers]);

  const maxPlayers = getMaxSessionPlayers(format);
  const formatConfig = getFormatConfig(format);
  const setup = useMemo(
    () => isTeamSetupComplete(selectedIds, assignments, format),
    [selectedIds, assignments, format]
  );
  const selectionOpen = status === "selection_open";
  const isBusy = isSaving || isOpening || isLocking;

  const sessionInput = () => ({
    gameweekId,
    number: gameweekNumber,
    scheduledDate: gameDate,
    format,
    selectedPlayerIds: selectedIds,
    teamWhiteName,
    teamColorName,
    assignments,
  });

  const applyGameweekResult = (gameweek: Gameweek) => {
    setGameweekId(gameweek.id);
    setGameweekNumber(gameweek.number);
    setStatus(gameweek.status);
    setGameDate(toDateInputValue(gameweek.date));
    setFormat(gameweek.format);
    const ids = filterValidPlayerIds(gameweek.availablePlayerIds, rosterPlayers);
    setSelectedIds(ids);
    setAssignments(buildInitialAssignments(ids, gameweek.teamAssignments));
    setTeamWhiteName(gameweek.teamWhiteName ?? DEFAULT_TEAM_NAMES.white);
    setTeamColorName(gameweek.teamColorName ?? DEFAULT_TEAM_NAMES.color);
  };

  const handleFormatChange = (next: GameFormat) => {
    const nextMax = getMaxSessionPlayers(next);
    const trimmed = selectedIds.slice(0, nextMax);
    setFormat(next);
    setSelectedIds(trimmed);
    setAssignments((a) => mergeAssignmentsForIds(trimmed, a));
  };

  const togglePlayer = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds((prev) => prev.filter((p) => p !== id));
      setAssignments((a) => {
        const next = { ...a };
        delete next[id];
        return next;
      });
      return;
    }
    if (selectedIds.length >= maxPlayers) return;
    setSelectedIds((prev) => [...prev, id]);
    setAssignments((a) => ({ ...a, [id]: null }));
  };

  const assignTeam = (playerId: string, team: SessionTeam | null) => {
    if (!selectedIds.includes(playerId)) return;
    const config = getFormatConfig(format);
    if (team === "white") {
      const whiteCount = Object.values(assignments).filter((t) => t === "white").length;
      if (whiteCount >= config.playersPerSide && assignments[playerId] !== "white") return;
    }
    if (team === "color") {
      const colorCount = Object.values(assignments).filter((t) => t === "color").length;
      if (colorCount >= config.playersPerSide && assignments[playerId] !== "color") return;
    }
    setAssignments((prev) => ({ ...prev, [playerId]: team }));
  };

  const saveSession = async () => {
    if (dataSource === "mock") {
      setError("Connect Supabase to save gameweeks.");
      return;
    }
    setError(null);
    setIsSaving(true);
    try {
      const result = await saveGameweekSessionAction(sessionInput());
      if (!result.ok || !result.data) {
        setError(result.ok ? "Failed to save session." : result.error);
        return;
      }
      applyGameweekResult(result.data);
      router.refresh();
    } finally {
      setIsSaving(false);
    }
  };

  const openAndNotify = async () => {
    if (dataSource === "mock") {
      setError("Connect Supabase to open selection.");
      return;
    }
    setError(null);
    setIsOpening(true);
    try {
      const result = await openGameweekSelectionAction(
        sessionInput(),
        fantasyManagerCount
      );
      if (!result.ok || !result.data) {
        setError(result.ok ? "Failed to open selection." : result.error);
        return;
      }
      applyGameweekResult(result.data);
      setNotifiedAt(new Date().toISOString());
      router.refresh();
    } finally {
      setIsOpening(false);
    }
  };

  const lockSelection = async () => {
    if (!gameweekId) {
      setError("Save the session before locking selection.");
      return;
    }
    setError(null);
    setIsLocking(true);
    try {
      const result = await lockGameweekSelectionAction(gameweekId);
      if (!result.ok || !result.data) {
        setError(result.ok ? "Failed to lock selection." : result.error);
        return;
      }
      applyGameweekResult(result.data);
      router.refresh();
    } finally {
      setIsLocking(false);
    }
  };

  const notifyMessage = NOTIFY_MESSAGE_TEMPLATE(
    gameweekNumber,
    DEFAULT_FANTASY_DEADLINE.label
  );

  const notifiedLabel = notifiedAt
    ? new Date(notifiedAt).toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      })
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Weekly session</h2>
        <p className="text-sm text-text-muted mt-1">
          Choose format, pick session players, assign teams, save, then notify
          fantasy managers.
        </p>
        {dataSource === "mock" && (
          <p className="text-sm text-amber-200/90 mt-2 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2">
            Mock data mode — configure Supabase to persist gameweeks.
          </p>
        )}
      </div>

      {error && (
        <p className="text-sm text-destructive rounded-lg border border-destructive/30 bg-destructive/5 p-3">
          {error}
        </p>
      )}

      <div className="surface-card p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs text-text-muted uppercase tracking-wider">
              Gameweek
            </span>
            <p className="text-2xl font-bold tabular-nums">
              {String(gameweekNumber).padStart(2, "0")}
            </p>
            <p className="text-sm text-text-muted">
              {GAME_TIME.dayLabel} · {GAME_TIME.label}
            </p>
          </div>
          <span className="text-xs text-text-muted capitalize">
            {status.replace(/_/g, " ")}
          </span>
        </div>

        <div>
          <Label className="text-xs text-text-muted">Game date</Label>
          <input
            type="date"
            value={gameDate}
            onChange={(e) => setGameDate(e.target.value)}
            disabled={isBusy}
            className="w-full mt-1 h-9 px-3 rounded-md bg-surface border border-border text-sm max-w-xs"
          />
        </div>

        <div>
          <Label className="text-xs text-text-muted mb-2 block">Format</Label>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {GAME_FORMATS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => handleFormatChange(f.id)}
                disabled={isBusy}
                className={cn(
                  "flex flex-col items-center rounded-lg border py-3 px-2 transition-all",
                  format === f.id
                    ? "border-lime/50 bg-lime/10 text-lime"
                    : "border-border bg-surface text-text-muted hover:border-border/80 hover:text-text-secondary"
                )}
              >
                <span className="text-lg font-bold tabular-nums">{f.label}</span>
                <span className="text-[10px] mt-0.5 opacity-80">{f.description}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="surface-card p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-lime" />
            <h3 className="font-semibold text-sm">Session players</h3>
          </div>
          <span
            className={cn(
              "text-xs tabular-nums font-medium",
              selectedIds.length === maxPlayers ? "text-lime" : "text-text-muted"
            )}
          >
            {selectedIds.length} / {maxPlayers}
          </span>
        </div>
        <p className="text-xs text-text-muted mb-4">
          {formatConfig.description} — selected players become the fantasy pool.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {rosterPlayers.map((player) => {
            const selected = selectedIds.includes(player.id);
            const disabled = !selected && selectedIds.length >= maxPlayers;
            const team = assignments[player.id];
            return (
              <button
                key={player.id}
                type="button"
                onClick={() => togglePlayer(player.id)}
                disabled={disabled || isBusy}
                className={cn(
                  "flex items-center gap-2 p-2.5 rounded-lg border text-left text-sm transition-colors",
                  selected
                    ? team === "white"
                      ? "bg-white/10 border-white/25 text-text-primary"
                      : team === "color"
                        ? "bg-blue-500/10 border-blue-500/25 text-text-primary"
                        : "bg-lime/10 border-lime/30 text-lime"
                    : disabled
                      ? "opacity-40 cursor-not-allowed bg-surface border-border text-text-muted"
                      : "bg-surface border-border text-text-muted hover:border-border/80"
                )}
              >
                <div
                  className={cn(
                    "h-4 w-4 rounded border shrink-0",
                    selected ? "bg-lime border-lime" : "border-border"
                  )}
                />
                <span className="truncate flex-1">{player.name}</span>
                {selected && team && (
                  <span className="text-[9px] font-bold uppercase shrink-0 opacity-70">
                    {team === "white" ? "W" : "C"}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="surface-card p-4">
        <SessionTeamBuilder
          format={format}
          selectedIds={selectedIds}
          assignments={assignments}
          teamWhiteName={teamWhiteName}
          teamColorName={teamColorName}
          onTeamWhiteNameChange={setTeamWhiteName}
          onTeamColorNameChange={setTeamColorName}
          onAssign={assignTeam}
        />
      </div>

      {!setup.complete && selectedIds.length > 0 && (
        <div className="rounded-lg border border-gold/30 bg-gold/5 px-4 py-3">
          <p className="text-xs font-medium text-gold mb-1">Before notifying</p>
          <ul className="text-xs text-text-muted space-y-0.5">
            {setup.issues.map((issue) => (
              <li key={issue}>· {issue}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="surface-card p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-lime" />
          <h3 className="font-semibold text-sm">Notify fantasy managers</h3>
        </div>
        <p className="text-sm text-text-muted">
          Notifies all{" "}
          <span className="text-text-primary font-medium">
            {fantasyManagerCount} fantasy managers
          </span>
          . Session:{" "}
          <span className="text-text-primary">
            {teamWhiteName || DEFAULT_TEAM_NAMES.white} vs{" "}
            {teamColorName || DEFAULT_TEAM_NAMES.color}
          </span>
        </p>
        <div className="rounded-lg bg-surface border border-border p-3 text-sm text-text-secondary italic">
          &ldquo;{notifyMessage}&rdquo;
        </div>

        {notifiedLabel && (
          <div className="flex items-center gap-2 text-sm text-lime">
            <CheckCircle2 className="h-4 w-4" />
            Notified {fantasyManagerCount} managers at {notifiedLabel}
          </div>
        )}

        <Button
          className="w-full bg-lime text-background hover:bg-lime-muted gap-2"
          disabled={!setup.complete || isBusy || selectionOpen}
          onClick={() => void openAndNotify()}
        >
          {isOpening ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Bell className="h-4 w-4" />
          )}
          {selectionOpen ? "Selection already open" : "Open selection & notify managers"}
        </Button>
      </div>

      <div className="flex gap-3">
        <Button
          variant="outline"
          className="flex-1 gap-2"
          onClick={() => void lockSelection()}
          disabled={!selectionOpen || isBusy}
        >
          {isLocking ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Lock className="h-4 w-4" />
          )}
          Lock selection
        </Button>
        <Button
          variant="outline"
          className="flex-1 gap-2"
          disabled={isBusy || selectedIds.length === 0}
          onClick={() => void saveSession()}
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save session
        </Button>
      </div>

      <p className="text-xs text-text-muted text-center">
        {format} · {teamWhiteName} vs {teamColorName} ·{" "}
        {selectionOpen ? "Selection open" : status.replace(/_/g, " ")}
        {gameweekId ? "" : " · not saved yet"}
      </p>
    </div>
  );
}
