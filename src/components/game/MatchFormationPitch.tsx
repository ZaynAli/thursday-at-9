"use client";

import type { Player } from "@/types";
import type { SessionTeam } from "@/lib/session-formats";
import { getFormationLabel, getFormationSlots } from "@/lib/formations";
import type { TeamFormation } from "@/types";
import { TeamKitIcon } from "@/components/shared/TeamKitIcon";
import { resolveSessionTeamKit } from "@/lib/team-kits";
import { cn } from "@/lib/utils";

interface FormationPlayerProps {
  player: Player | null;
  x: number;
  y: number;
  team: SessionTeam;
  teamWhiteName: string;
  selected?: boolean;
  editable?: boolean;
  statLine?: string;
  onClick?: () => void;
}

function FormationPlayer({
  player,
  x,
  y,
  team,
  teamWhiteName,
  selected,
  editable,
  statLine,
  onClick,
}: FormationPlayerProps) {
  const isEmpty = !player;
  const kitId = resolveSessionTeamKit(team, teamWhiteName);

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!editable && !onClick}
      className={cn(
        "absolute flex flex-col items-center -translate-x-1/2 -translate-y-1/2",
        editable && "cursor-pointer",
        editable && "active:scale-95 transition-transform",
        selected && "z-10",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-lime/50 rounded-lg"
      )}
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      {isEmpty ? (
        <div
          className={cn(
            "h-11 w-11 rounded-full border border-dashed flex items-center justify-center",
            editable
              ? "border-pitch-line/60 text-text-muted/50"
              : "border-pitch-line/30 text-text-muted/30"
          )}
        />
      ) : (
        <>
          <div
            className={cn(
              "relative rounded-full",
              selected && "ring-2 ring-lime ring-offset-2 ring-offset-transparent",
              team === "white" && editable && !selected && "ring-1 ring-white/20",
              team === "color" && editable && !selected && "ring-1 ring-sky-400/30"
            )}
          >
            <TeamKitIcon kitId={kitId} size="md" />
          </div>
          <span className="mt-1 text-[10px] font-semibold text-text-primary whitespace-nowrap max-w-[4.5rem] truncate">
            {player.name.split(" ")[0]}
          </span>
          {statLine && (
            <span className="text-[9px] font-medium text-lime tabular-nums">{statLine}</span>
          )}
        </>
      )}
    </button>
  );
}

interface MatchFormationPitchProps {
  formation: TeamFormation;
  playersById: Map<string, Player>;
  format: import("@/types").GameFormat;
  teamWhiteName: string;
  teamColorName: string;
  editable?: boolean;
  selectedSlot?: { team: SessionTeam; slot: number } | null;
  onSlotClick?: (team: SessionTeam, slot: number) => void;
  playerStatLines?: Record<string, string>;
  className?: string;
}

export function MatchFormationPitch({
  formation,
  playersById,
  format,
  teamWhiteName,
  teamColorName,
  editable = false,
  selectedSlot,
  onSlotClick,
  playerStatLines,
  className,
}: MatchFormationPitchProps) {
  const whiteSlots = getFormationSlots("white", format);
  const colorSlots = getFormationSlots("color", format);

  return (
    <div className={cn("relative w-full", className)}>
      <div className="relative aspect-[3/4] sm:aspect-[4/5] w-full max-w-lg mx-auto">
        <svg
          viewBox="0 0 100 130"
          className="absolute inset-0 w-full h-full"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id="matchPitchGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0f1f0f" />
              <stop offset="50%" stopColor="#0d1a0d" />
              <stop offset="100%" stopColor="#0a150a" />
            </linearGradient>
          </defs>

          <rect x="2" y="2" width="96" height="126" rx="1" fill="url(#matchPitchGrad)" stroke="rgba(163,230,53,0.12)" strokeWidth="0.3" />
          <line x1="2" y1="65" x2="98" y2="65" stroke="rgba(163,230,53,0.2)" strokeWidth="0.4" strokeDasharray="2 1" />
          <circle cx="50" cy="65" r="8" fill="none" stroke="rgba(163,230,53,0.15)" strokeWidth="0.3" />
          <rect x="25" y="2" width="50" height="18" fill="none" stroke="rgba(163,230,53,0.12)" strokeWidth="0.3" />
          <rect x="25" y="110" width="50" height="18" fill="none" stroke="rgba(163,230,53,0.12)" strokeWidth="0.3" />
        </svg>

        <div className="absolute top-2 inset-x-0 flex justify-center pointer-events-none">
          <span className="text-[10px] font-semibold tracking-wider uppercase text-sky-300/90 bg-black/40 px-2 py-0.5 rounded">
            {teamColorName}
          </span>
        </div>
        <div className="absolute bottom-2 inset-x-0 flex justify-center pointer-events-none">
          <span className="text-[10px] font-semibold tracking-wider uppercase text-white/90 bg-black/40 px-2 py-0.5 rounded">
            {teamWhiteName}
          </span>
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <span className="text-[9px] font-medium tracking-[0.2em] text-text-muted/60 uppercase">
            {getFormationLabel(format)}
          </span>
        </div>

        <div className="absolute inset-0">
          {colorSlots.map((slot) => {
            const playerId = formation.color[slot.index];
            const player = playerId ? playersById.get(playerId) ?? null : null;
            const isSelected =
              selectedSlot?.team === "color" && selectedSlot.slot === slot.index;

            return (
              <FormationPlayer
                key={`color-${slot.index}`}
                player={player}
                x={slot.x}
                y={slot.y}
                team="color"
                teamWhiteName={teamWhiteName}
                selected={isSelected}
                editable={editable}
                statLine={playerId ? playerStatLines?.[playerId] : undefined}
                onClick={
                  editable || onSlotClick
                    ? () => onSlotClick?.("color", slot.index)
                    : undefined
                }
              />
            );
          })}

          {whiteSlots.map((slot) => {
            const playerId = formation.white[slot.index];
            const player = playerId ? playersById.get(playerId) ?? null : null;
            const isSelected =
              selectedSlot?.team === "white" && selectedSlot.slot === slot.index;

            return (
              <FormationPlayer
                key={`white-${slot.index}`}
                player={player}
                x={slot.x}
                y={slot.y}
                team="white"
                teamWhiteName={teamWhiteName}
                selected={isSelected}
                editable={editable}
                statLine={playerId ? playerStatLines?.[playerId] : undefined}
                onClick={
                  editable || onSlotClick
                    ? () => onSlotClick?.("white", slot.index)
                    : undefined
                }
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
