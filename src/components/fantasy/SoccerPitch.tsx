"use client";

import type { Player } from "@/types";
import { getJersey } from "@/lib/jerseys";
import { JerseyIcon } from "@/components/shared/JerseyIcon";
import { PlayerPrice } from "@/components/shared/PlayerPrice";
import { CaptainBadge } from "@/components/fantasy/CaptainBadge";
import { cn } from "@/lib/utils";

/** Predetermined aesthetic positions — NOT formations */
const PITCH_POSITIONS = [
  { x: 50, y: 12 },
  { x: 22, y: 38 },
  { x: 78, y: 38 },
  { x: 35, y: 72 },
  { x: 65, y: 72 },
];

interface PitchPlayerProps {
  player: Player;
  positionIndex: number;
  isCaptain: boolean;
  onClick?: () => void;
  empty?: boolean;
}

export function PitchPlayer({
  player,
  positionIndex,
  isCaptain,
  onClick,
  empty = false,
}: PitchPlayerProps) {
  const pos = PITCH_POSITIONS[positionIndex];

  if (empty) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={!onClick}
        className={cn(
          "absolute flex flex-col items-center -translate-x-1/2 -translate-y-1/2",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-lime/50 rounded-lg",
          onClick && "active:scale-95 transition-transform"
        )}
        style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
      >
        <div
          className={cn(
            "h-14 w-14 rounded-full border-2 border-dashed flex items-center justify-center",
            onClick
              ? "border-lime/40 text-lime/70 hover:border-lime/60 hover:bg-lime/5"
              : "border-pitch-line text-text-muted/40"
          )}
        >
          <span className="text-xl leading-none">+</span>
        </div>
        {onClick && (
          <span className="mt-1.5 text-[10px] font-medium text-text-muted">Add</span>
        )}
      </button>
    );
  }

  const jersey = getJersey(player.jerseyId);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "absolute flex flex-col items-center -translate-x-1/2 -translate-y-1/2",
        "transition-transform active:scale-95 hover:scale-105",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-lime/50 rounded-lg"
      )}
      style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
    >
      <div
        className={cn(
          "relative",
          isCaptain && "rounded-full ring-2 ring-lime ring-offset-2 ring-offset-transparent"
        )}
      >
        <JerseyIcon jerseyId={jersey.id} size="lg" />
      </div>
      <span className="mt-1.5 text-xs font-semibold text-text-primary whitespace-nowrap">
        {player.name.split(" ")[0]}
      </span>
      <PlayerPrice price={player.price} size="sm" className="text-[10px]" />
      {isCaptain && (
        <div className="mt-0.5">
          <CaptainBadge size="md" />
        </div>
      )}
    </button>
  );
}

interface SoccerPitchProps {
  players: (Player | null)[];
  captainId?: string;
  onPlayerClick?: (player: Player) => void;
  onEmptySlotClick?: () => void;
  className?: string;
}

export function SoccerPitch({
  players,
  captainId,
  onPlayerClick,
  onEmptySlotClick,
  className,
}: SoccerPitchProps) {
  const slots = Array.from({ length: 5 }, (_, i) => players[i] ?? null);

  return (
    <div className={cn("relative w-full", className)}>
      <div className="relative aspect-[3/4] sm:aspect-[4/5] w-full max-w-md mx-auto">
        <svg
          viewBox="0 0 100 130"
          className="absolute inset-0 w-full h-full"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id="pitchGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0f1f0f" />
              <stop offset="50%" stopColor="#0d1a0d" />
              <stop offset="100%" stopColor="#0a150a" />
            </linearGradient>
            <pattern id="grass" width="4" height="4" patternUnits="userSpaceOnUse">
              <rect width="4" height="4" fill="#0d1a0d" />
              <rect width="2" height="4" fill="#0f1c0f" opacity="0.5" />
            </pattern>
          </defs>

          <rect x="2" y="2" width="96" height="126" rx="1" fill="url(#pitchGrad)" stroke="rgba(163,230,53,0.12)" strokeWidth="0.3" />
          <rect x="2" y="2" width="96" height="126" rx="1" fill="url(#grass)" opacity="0.3" />
          <rect x="2" y="2" width="96" height="126" rx="1" fill="none" stroke="rgba(163,230,53,0.08)" strokeWidth="0.5" />
          <line x1="2" y1="65" x2="98" y2="65" stroke="rgba(163,230,53,0.15)" strokeWidth="0.3" />
          <circle cx="50" cy="65" r="8" fill="none" stroke="rgba(163,230,53,0.15)" strokeWidth="0.3" />
          <circle cx="50" cy="65" r="0.8" fill="rgba(163,230,53,0.2)" />
          <rect x="25" y="2" width="50" height="18" fill="none" stroke="rgba(163,230,53,0.12)" strokeWidth="0.3" />
          <rect x="35" y="2" width="30" height="6" fill="none" stroke="rgba(163,230,53,0.1)" strokeWidth="0.3" />
          <rect x="25" y="110" width="50" height="18" fill="none" stroke="rgba(163,230,53,0.12)" strokeWidth="0.3" />
          <rect x="35" y="122" width="30" height="6" fill="none" stroke="rgba(163,230,53,0.1)" strokeWidth="0.3" />
          <rect x="42" y="0.5" width="16" height="2" fill="none" stroke="rgba(163,230,53,0.2)" strokeWidth="0.4" rx="0.3" />
          <rect x="42" y="127.5" width="16" height="2" fill="none" stroke="rgba(163,230,53,0.2)" strokeWidth="0.4" rx="0.3" />
          <ellipse cx="50" cy="65" rx="45" ry="55" fill="url(#pitchGrad)" opacity="0" />
        </svg>

        <div
          className="absolute inset-0 pointer-events-none rounded-sm"
          style={{
            background:
              "radial-gradient(ellipse 70% 60% at 50% 45%, rgba(163,230,53,0.04) 0%, transparent 70%)",
          }}
        />

        <div className="absolute inset-0">
          {slots.map((player, i) =>
            player ? (
              <PitchPlayer
                key={player.id}
                player={player}
                positionIndex={i}
                isCaptain={player.id === captainId}
                onClick={() => onPlayerClick?.(player)}
              />
            ) : (
              <PitchPlayer
                key={`empty-${i}`}
                player={{} as Player}
                positionIndex={i}
                isCaptain={false}
                empty
                onClick={onEmptySlotClick}
              />
            )
          )}
        </div>
      </div>
    </div>
  );
}
