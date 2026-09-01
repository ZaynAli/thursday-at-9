"use client";

import {
  createContext,
  useContext,
  type ReactNode,
} from "react";
import { useAppSession } from "@/context/AppSessionContext";
import { useFantasyTeam } from "@/hooks/useFantasyTeam";
import {
  getFantasyLockReason,
  isFantasySelectionEditable,
} from "@/lib/fantasy/gameweek-access";
import type { ManagerFantasyTeamView } from "@/lib/data/fantasy-teams";
import type { FantasySelection, FantasyTeam, Player } from "@/types";
import type { FantasyTeamValidation } from "@/lib/fantasy/squad";
import type { FantasySaveStatus } from "@/hooks/useFantasyTeam";

interface FantasyTeamContextValue {
  selections: FantasySelection[];
  selectedPlayers: Player[];
  togglePlayer: (playerId: string) => void;
  makeCaptain: (playerId: string) => void;
  removePlayer: (playerId: string) => void;
  isSelected: (playerId: string) => boolean;
  isCaptain: (playerId: string) => boolean;
  canAdd: (player: Player) => boolean;
  getUnaffordableReason: (player: Player) => string | null;
  validation: FantasyTeamValidation;
  budgetRemaining: number;
  squadCost: number;
  hydrated: boolean;
  captainId?: string;
  canEdit: boolean;
  lockReason: string | null;
  submittedAt?: string;
  isSubmitted: boolean;
  saveStatus: FantasySaveStatus;
  saveError: string | null;
  confirmTeam: () => Promise<boolean>;
  confirmPending: boolean;
  visibleTeams: ManagerFantasyTeamView[];
}

const FantasyTeamContext = createContext<FantasyTeamContextValue | null>(null);

interface FantasyTeamProviderProps {
  children: ReactNode;
  initialTeam: FantasyTeam | null;
  visibleTeams: ManagerFantasyTeamView[];
}

export function FantasyTeamProvider({
  children,
  initialTeam,
  visibleTeams,
}: FantasyTeamProviderProps) {
  const { currentUser, gameweek, availablePlayers, dataSource } = useAppSession();

  const persistRemote =
    dataSource === "supabase" &&
    Boolean(currentUser?.isFantasyManager) &&
    gameweek.id !== "draft";

  const canEdit =
    Boolean(currentUser?.isFantasyManager) &&
    isFantasySelectionEditable(gameweek);

  const lockReason = getFantasyLockReason(gameweek);

  const team = useFantasyTeam({
    availablePlayers,
    gameweekId: gameweek.id,
    managerId: currentUser?.id ?? "guest",
    initialTeam,
    canEdit,
    persistRemote,
  });

  const captainId = team.selections.find((selection) => selection.isCaptain)?.playerId;

  return (
    <FantasyTeamContext.Provider
      value={{
        ...team,
        captainId,
        lockReason: canEdit ? null : lockReason,
        visibleTeams,
      }}
    >
      {children}
    </FantasyTeamContext.Provider>
  );
}

export function useFantasyTeamContext() {
  const ctx = useContext(FantasyTeamContext);
  if (!ctx) {
    throw new Error(
      "useFantasyTeamContext must be used within FantasyTeamProvider"
    );
  }
  return ctx;
}
