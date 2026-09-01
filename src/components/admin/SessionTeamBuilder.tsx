"use client";

import { usePlayerLookup } from "@/context/AppSessionContext";
import {
  type GameFormat,
  type SessionTeam,
  type TeamAssignments,
  getFormatConfig,
  countTeamAssignments,
  getUnassignedPlayerIds,
  DEFAULT_TEAM_NAMES,
  TEAM_NAME_PRESETS,
} from "@/lib/session-formats";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Users } from "lucide-react";

interface SessionTeamBuilderProps {
  format: GameFormat;
  selectedIds: string[];
  assignments: TeamAssignments;
  teamWhiteName: string;
  teamColorName: string;
  onTeamWhiteNameChange: (name: string) => void;
  onTeamColorNameChange: (name: string) => void;
  onAssign: (playerId: string, team: SessionTeam | null) => void;
}

export function SessionTeamBuilder({
  format,
  selectedIds,
  assignments,
  teamWhiteName,
  teamColorName,
  onTeamWhiteNameChange,
  onTeamColorNameChange,
  onAssign,
}: SessionTeamBuilderProps) {
  const playerLookup = usePlayerLookup();
  const config = getFormatConfig(format);
  const whiteCount = countTeamAssignments(assignments, "white");
  const colorCount = countTeamAssignments(assignments, "color");
  const unassigned = getUnassignedPlayerIds(selectedIds, assignments);

  const whitePlayers = selectedIds.filter((id) => assignments[id] === "white");
  const colorPlayers = selectedIds.filter((id) => assignments[id] === "color");

  if (selectedIds.length === 0) {
    return (
      <div className="surface-card p-6 text-center text-sm text-text-muted">
        Select session players above to assign teams.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-lime" />
        <h3 className="font-semibold text-sm">Teams</h3>
        <span className="text-xs text-text-muted ml-auto tabular-nums">
          {whiteCount} vs {colorCount}
          <span className="text-text-muted/60">
            {" "}
            / {config.playersPerSide} each
          </span>
        </span>
      </div>

      {/* Team name inputs */}
      <div className="flex flex-wrap gap-2">
        {TEAM_NAME_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => {
              onTeamWhiteNameChange(preset.teamA);
              onTeamColorNameChange(preset.teamB);
            }}
            className={cn(
              "rounded-full border px-3 py-1 text-[10px] font-medium transition-colors",
              teamWhiteName === preset.teamA && teamColorName === preset.teamB
                ? "border-lime/50 bg-lime/10 text-lime"
                : "border-border text-text-muted hover:border-border/80"
            )}
          >
            {preset.label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-[10px] text-text-muted uppercase tracking-wider">
            Side A
          </Label>
          <input
            value={teamWhiteName}
            onChange={(e) => onTeamWhiteNameChange(e.target.value)}
            placeholder={DEFAULT_TEAM_NAMES.white}
            className="w-full mt-1 h-9 px-3 rounded-md bg-surface border border-white/20 text-sm font-medium"
          />
        </div>
        <div>
          <Label className="text-[10px] text-text-muted uppercase tracking-wider">
            Side B
          </Label>
          <input
            value={teamColorName}
            onChange={(e) => onTeamColorNameChange(e.target.value)}
            placeholder={DEFAULT_TEAM_NAMES.color}
            className="w-full mt-1 h-9 px-3 rounded-md bg-surface border border-blue-500/30 text-sm font-medium"
          />
        </div>
      </div>

      {/* Unassigned pool */}
      {unassigned.length > 0 && (
        <div className="rounded-lg border border-dashed border-gold/40 bg-gold/5 p-3">
          <p className="text-[10px] font-medium text-gold uppercase tracking-wider mb-2">
            Unassigned ({unassigned.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {unassigned.map((id) => {
              const player = playerLookup.get(id);
              if (!player) return null;
              return (
                <PlayerChip
                  key={id}
                  name={player.name}
                  onPickWhite={() => onAssign(id, "white")}
                  onPickColor={() => onAssign(id, "color")}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Two team columns */}
      <div className="grid grid-cols-2 gap-3">
        <TeamColumn
          title={teamWhiteName || DEFAULT_TEAM_NAMES.white}
          players={whitePlayers}
          team="white"
          target={config.playersPerSide}
          count={whiteCount}
          variant="white"
          onRemove={(id) => onAssign(id, null)}
          onAddFromOther={(id) => onAssign(id, "white")}
        />
        <TeamColumn
          title={teamColorName || DEFAULT_TEAM_NAMES.color}
          players={colorPlayers}
          team="color"
          target={config.playersPerSide}
          count={colorCount}
          variant="color"
          onRemove={(id) => onAssign(id, null)}
          onAddFromOther={(id) => onAssign(id, "color")}
        />
      </div>
    </div>
  );
}

function PlayerChip({
  name,
  onPickWhite,
  onPickColor,
}: {
  name: string;
  onPickWhite: () => void;
  onPickColor: () => void;
}) {
  return (
    <div className="flex items-center gap-1 rounded-lg border border-border bg-surface-elevated pl-2.5 pr-1 py-1">
      <span className="text-xs font-medium">{name}</span>
      <button
        type="button"
        onClick={onPickWhite}
        className="h-6 px-1.5 rounded text-[10px] font-medium bg-white/10 text-white hover:bg-white/20"
      >
        W
      </button>
      <button
        type="button"
        onClick={onPickColor}
        className="h-6 px-1.5 rounded text-[10px] font-medium bg-blue-500/15 text-blue-400 hover:bg-blue-500/25"
      >
        C
      </button>
    </div>
  );
}

function TeamColumn({
  title,
  players,
  target,
  count,
  variant,
  onRemove,
}: {
  title: string;
  players: string[];
  team: SessionTeam;
  target: number;
  count: number;
  variant: "white" | "color";
  onRemove: (id: string) => void;
  onAddFromOther: (id: string) => void;
}) {
  const playerLookup = usePlayerLookup();
  const isFull = count >= target;

  return (
    <div
      className={cn(
        "rounded-lg border p-3 min-h-[140px]",
        variant === "white"
          ? "border-white/15 bg-white/[0.03]"
          : "border-blue-500/20 bg-blue-500/[0.04]"
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold truncate">{title}</span>
        <span
          className={cn(
            "text-[10px] tabular-nums font-medium",
            count === target ? "text-lime" : "text-text-muted"
          )}
        >
          {count}/{target}
        </span>
      </div>
      <div className="space-y-1.5">
        {players.map((id) => {
          const player = playerLookup.get(id);
          if (!player) return null;
          return (
            <div
              key={id}
              className="flex items-center justify-between gap-1 rounded-md bg-surface/80 px-2 py-1.5"
            >
              <span className="text-xs font-medium truncate">{player.name}</span>
              <button
                type="button"
                onClick={() => onRemove(id)}
                className="text-[10px] text-text-muted hover:text-danger shrink-0"
              >
                Remove
              </button>
            </div>
          );
        })}
        {players.length === 0 && (
          <p className="text-[10px] text-text-muted text-center py-4">
            {isFull ? "Full" : "Assign from unassigned"}
          </p>
        )}
      </div>
    </div>
  );
}
