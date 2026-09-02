"use client";

import { useRef, useState } from "react";
import { GameweekHeader } from "@/components/home/GameweekHeader";
import { FantasyPlayerPool } from "@/components/fantasy/FantasyPlayerPool";
import { FantasySquadSummary } from "@/components/fantasy/FantasySquadSummary";
import { BudgetBar } from "@/components/fantasy/BudgetBar";
import { PlayerDetailSheet } from "@/components/fantasy/PlayerDetailSheet";
import { Button } from "@/components/ui/button";
import { useAppSession, useCurrentUser } from "@/context/AppSessionContext";
import { useFantasyTeamContext } from "@/context/FantasyTeamContext";
import { useIsDesktop } from "@/hooks/useMediaQuery";
import { EmptyState } from "@/components/shared/EmptyState";
import { hasLineups } from "@/lib/game/status";
import type { ManagerFantasyTeamView } from "@/lib/data/fantasy-teams";
import type { Player } from "@/types";
import { cn } from "@/lib/utils";
import { Users, LayoutGrid, CheckCircle2, Loader2, Lock } from "lucide-react";

type MobileView = "players" | "team";

function FantasyNotReady({
  title,
  description,
  gameweekNumber,
}: {
  title: string;
  description: string;
  gameweekNumber: number;
}) {
  return (
    <div className="space-y-6 animate-slide-up">
      <header>
        <p className="text-[10px] font-semibold tracking-[0.25em] text-text-muted uppercase mb-1">
          Fantasy
        </p>
        <h1 className="text-2xl font-bold">
          Gameweek {String(gameweekNumber).padStart(2, "0")}
        </h1>
      </header>
      <EmptyState title={title} description={description} />
    </div>
  );
}

export default function FantasyPage() {
  const user = useCurrentUser();
  const { gameweek, availablePlayers } = useAppSession();

  if (!user) {
    return (
      <div className="space-y-6">
        <GameweekHeader gameweekNumber={gameweek.number} compact showCountdown={false} />
        <EmptyState
          title="Sign in required"
          description="Sign in with your manager account to pick your fantasy team."
        />
      </div>
    );
  }

  if (!user.isFantasyManager) {
    return (
      <FantasyNotReady
        gameweekNumber={gameweek.number}
        title="Fantasy picks not available"
        description="You're on the roster as a player only. Ask the admin for a manager invite from your player page if you'd like to pick fantasy teams."
      />
    );
  }

  const sessionReady =
    gameweek.id !== "draft" &&
    hasLineups(gameweek.status) &&
    availablePlayers.length > 0;

  if (!sessionReady) {
    return (
      <FantasyNotReady
        gameweekNumber={gameweek.number}
        title="Selection not open yet"
        description="The admin is still setting up this week's session. Check back once teams are assigned and fantasy picks open."
      />
    );
  }

  return <FantasyPageContent />;
}

function FantasyPageContent() {
  const { gameweek, availablePlayers } = useAppSession();
  const isDesktop = useIsDesktop();
  const [mobileView, setMobileView] = useState<MobileView>("players");
  const [detailPlayer, setDetailPlayer] = useState<Player | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const playerPoolRef = useRef<HTMLDivElement>(null);

  const {
    selectedPlayers,
    captainId,
    budgetRemaining,
    squadCost,
    selections,
    togglePlayer,
    makeCaptain,
    removePlayer,
    isSelected,
    isCaptain,
    canAdd,
    getUnaffordableReason,
    validation,
    hydrated,
    canEdit,
    lockReason,
    isSubmitted,
    saveStatus,
    saveError,
    confirmTeam,
    confirmPending,
    visibleTeams,
  } = useFantasyTeamContext();

  const openDetail = (player: Player) => {
    setDetailPlayer(player);
    setDetailOpen(true);
  };

  const openPlayerPool = () => {
    if (!canEdit || selectedPlayers.length >= 5) return;
    if (isDesktop) {
      playerPoolRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    setMobileView("players");
  };

  if (!hydrated) {
    return (
      <div className="space-y-6">
        <GameweekHeader gameweekNumber={gameweek.number} compact />
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-16 rounded-lg bg-surface-elevated animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      <GameweekHeader gameweekNumber={gameweek.number} compact />

      {!canEdit && lockReason && (
        <div className="rounded-lg border border-border bg-surface px-4 py-3 flex items-start gap-3">
          <Lock className="h-4 w-4 text-text-muted mt-0.5 shrink-0" />
          <p className="text-sm text-text-muted">{lockReason}</p>
        </div>
      )}

      {isDesktop ? (
        <div className="grid grid-cols-2 gap-6 items-start">
          <div ref={playerPoolRef}>
            <h2 className="text-xs font-semibold tracking-[0.15em] text-text-muted uppercase mb-3">
              Player Pool
            </h2>
            <FantasyPlayerPool
              players={availablePlayers}
              isSelected={isSelected}
              isCaptain={isCaptain}
              canAdd={canAdd}
              getUnaffordableReason={getUnaffordableReason}
              onToggle={togglePlayer}
              onPlayerSelect={openDetail}
              variant="desktop"
            />
          </div>
          <div className="sticky top-6 space-y-4">
            <FantasySquadSummary
              selectedPlayers={selectedPlayers}
              captainId={captainId}
              budgetRemaining={budgetRemaining}
              squadCost={squadCost}
              onPlayerClick={canEdit ? openDetail : undefined}
              onEmptySlotClick={canEdit ? openPlayerPool : undefined}
            />
            <SubmitSection
              canEdit={canEdit}
              validation={validation}
              selections={selections.length}
              isSubmitted={isSubmitted}
              saveStatus={saveStatus}
              saveError={saveError}
              confirmPending={confirmPending}
              onConfirm={confirmTeam}
            />
          </div>
        </div>
      ) : (
        <>
          <div className="flex rounded-lg bg-surface p-1 border border-border">
            <button
              onClick={() => setMobileView("players")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-colors",
                mobileView === "players"
                  ? "bg-surface-elevated text-lime"
                  : "text-text-muted"
              )}
            >
              <Users className="h-4 w-4" />
              Players
            </button>
            <button
              onClick={() => setMobileView("team")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-colors",
                mobileView === "team"
                  ? "bg-surface-elevated text-lime"
                  : "text-text-muted"
              )}
            >
              <LayoutGrid className="h-4 w-4" />
              My Team
            </button>
          </div>

          {mobileView === "players" ? (
            <div className="safe-bottom-fantasy">
              <FantasyPlayerPool
                players={availablePlayers}
                isSelected={isSelected}
                isCaptain={isCaptain}
                canAdd={canAdd}
                getUnaffordableReason={getUnaffordableReason}
                onToggle={togglePlayer}
                onPlayerSelect={openDetail}
                variant="mobile"
              />
            </div>
          ) : (
            <div className="space-y-4 pb-24">
              <FantasySquadSummary
                selectedPlayers={selectedPlayers}
                captainId={captainId}
                budgetRemaining={budgetRemaining}
                squadCost={squadCost}
                onPlayerClick={canEdit ? openDetail : undefined}
                onEmptySlotClick={canEdit ? openPlayerPool : undefined}
              />
              <SubmitSection
                canEdit={canEdit}
                validation={validation}
                selections={selections.length}
                isSubmitted={isSubmitted}
                saveStatus={saveStatus}
                saveError={saveError}
                confirmPending={confirmPending}
                onConfirm={confirmTeam}
              />
            </div>
          )}

          {mobileView === "players" && (
            <div className="fixed bottom-[calc(5.75rem+env(safe-area-inset-bottom,1.25rem))] inset-x-0 z-40 px-4 lg:hidden">
              <div className="surface-card p-3 border border-border/80 backdrop-blur-md bg-surface/95 shadow-lg">
                <BudgetBar
                  selectedCount={selectedPlayers.length}
                  budgetRemaining={budgetRemaining}
                  squadCost={squadCost}
                  compact
                />
                <Button
                  size="sm"
                  className="w-full mt-2 bg-lime text-background hover:bg-lime-muted"
                  onClick={() => setMobileView("team")}
                >
                  View Team
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {visibleTeams.length > 0 && (
        <OtherManagersTeams teams={visibleTeams} roster={availablePlayers} />
      )}

      <PlayerDetailSheet
        player={detailPlayer}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        isSelected={detailPlayer ? isSelected(detailPlayer.id) : false}
        isCaptain={detailPlayer ? isCaptain(detailPlayer.id) : false}
        onMakeCaptain={() => {
          if (detailPlayer) makeCaptain(detailPlayer.id);
        }}
        onRemove={() => {
          if (detailPlayer) {
            removePlayer(detailPlayer.id);
            setDetailOpen(false);
          }
        }}
      />
    </div>
  );
}

function SubmitSection({
  canEdit,
  validation,
  selections,
  isSubmitted,
  saveStatus,
  saveError,
  confirmPending,
  onConfirm,
}: {
  canEdit: boolean;
  validation: { isValid: boolean; errors: string[] };
  selections: number;
  isSubmitted: boolean;
  saveStatus: "idle" | "saving" | "saved" | "error";
  saveError: string | null;
  confirmPending: boolean;
  onConfirm: () => Promise<boolean>;
}) {
  const saveLabel =
    saveStatus === "saving"
      ? "Saving…"
      : saveStatus === "saved"
        ? "Saved"
        : saveStatus === "error"
          ? "Save failed"
          : null;

  return (
    <div className="mt-4 space-y-2">
      {!canEdit && isSubmitted && (
        <p className="text-xs text-lime">Team submitted for this gameweek.</p>
      )}
      {canEdit && saveLabel && (
        <p
          className={cn(
            "text-xs",
            saveStatus === "error" ? "text-destructive" : "text-text-muted"
          )}
        >
          {saveError ?? saveLabel}
        </p>
      )}
      {!validation.isValid && selections > 0 && canEdit && (
        <p className="text-xs text-text-muted">{validation.errors[0]}</p>
      )}
      {canEdit ? (
        <Button
          className={cn(
            "w-full",
            validation.isValid
              ? "bg-lime text-background hover:bg-lime-muted"
              : "bg-surface-hover text-text-muted cursor-not-allowed"
          )}
          disabled={!validation.isValid || confirmPending}
          onClick={() => void onConfirm()}
        >
          {confirmPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <CheckCircle2 className="h-4 w-4 mr-2" />
          )}
          {validation.isValid
            ? isSubmitted
              ? "Update Team"
              : "Confirm Team"
            : `Select ${5 - selections} more`}
        </Button>
      ) : (
        isSubmitted && (
          <Button className="w-full" variant="outline" disabled>
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Team confirmed
          </Button>
        )
      )}
    </div>
  );
}

function OtherManagersTeams({
  teams,
  roster,
}: {
  teams: ManagerFantasyTeamView[];
  roster: Player[];
}) {
  const lookup = new Map(roster.map((player) => [player.id, player]));

  return (
    <section className="rounded-lg border border-border bg-surface p-4 space-y-4">
      <div>
        <h2 className="text-xs font-semibold tracking-[0.15em] text-text-muted uppercase">
          Submitted Teams
        </h2>
        <p className="text-sm text-text-muted mt-1">
          Visible after selection locks — {teams.length} manager{teams.length === 1 ? "" : "s"} submitted.
        </p>
      </div>
      <div className="space-y-3">
        {teams.map((team) => (
          <div
            key={team.managerId}
            className="rounded-md border border-border/70 bg-surface-elevated px-3 py-2.5"
          >
            <p className="text-sm font-medium">{team.managerName}</p>
            <p className="text-xs text-text-muted mt-1">
              {team.selections
                .map((selection) => {
                  const player = lookup.get(selection.playerId);
                  const captain = selection.isCaptain ? " (C)" : "";
                  return `${player?.name ?? "Player"}${captain}`;
                })
                .join(" · ")}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
