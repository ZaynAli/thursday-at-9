"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FANTASY_BUDGET, FANTASY_STORAGE_KEY } from "@/lib/constants";
import { saveFantasyTeamAction } from "@/lib/fantasy/actions";
import {
  setCaptain,
  togglePlayerSelection,
  isFantasyTeamValid,
  canAffordPlayer,
  getBudgetShortfall,
  calculateBudgetRemaining,
  calculateSquadCost,
} from "@/lib/fantasy/squad";
import type { FantasySelection, FantasyTeam, Player } from "@/types";

interface StoredFantasyTeam {
  gameweekId: string;
  managerId: string;
  selections: FantasySelection[];
}

export type FantasySaveStatus = "idle" | "saving" | "saved" | "error";

interface UseFantasyTeamOptions {
  availablePlayers: Player[];
  gameweekId: string;
  managerId: string;
  initialTeam: FantasyTeam | null;
  canEdit: boolean;
  persistRemote: boolean;
}

function loadFromStorage(gameweekId: string, managerId: string): FantasySelection[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(FANTASY_STORAGE_KEY);
    if (!raw) return [];
    const parsed: StoredFantasyTeam = JSON.parse(raw);
    if (parsed.gameweekId === gameweekId && parsed.managerId === managerId) {
      return parsed.selections;
    }
  } catch {
    /* ignore corrupt data */
  }
  return [];
}

function saveToStorage(
  gameweekId: string,
  managerId: string,
  selections: FantasySelection[]
) {
  const payload: StoredFantasyTeam = {
    gameweekId,
    managerId,
    selections,
  };
  localStorage.setItem(FANTASY_STORAGE_KEY, JSON.stringify(payload));
}

export function useFantasyTeam({
  availablePlayers,
  gameweekId,
  managerId,
  initialTeam,
  canEdit,
  persistRemote,
}: UseFantasyTeamOptions) {
  const [selections, setSelections] = useState<FantasySelection[]>(
    initialTeam?.selections ?? []
  );
  const [submittedAt, setSubmittedAt] = useState<string | undefined>(
    initialTeam?.submittedAt
  );
  const [hydrated, setHydrated] = useState(false);
  const [saveStatus, setSaveStatus] = useState<FantasySaveStatus>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [confirmPending, setConfirmPending] = useState(false);
  const saveTimerRef = useRef<number | null>(null);
  const latestSelectionsRef = useRef(selections);

  useEffect(() => {
    latestSelectionsRef.current = selections;
  }, [selections]);

  useEffect(() => {
    if (persistRemote) {
      setSelections(initialTeam?.selections ?? []);
      setSubmittedAt(initialTeam?.submittedAt);
    } else {
      setSelections(loadFromStorage(gameweekId, managerId));
    }
    setHydrated(true);
  }, [gameweekId, managerId, initialTeam, persistRemote]);

  useEffect(() => {
    if (!hydrated || persistRemote || !canEdit) return;
    saveToStorage(gameweekId, managerId, selections);
  }, [selections, hydrated, gameweekId, managerId, persistRemote, canEdit]);

  const persistDraft = useCallback(
    async (nextSelections: FantasySelection[]) => {
      if (!persistRemote || !canEdit) return;

      setSaveStatus("saving");
      setSaveError(null);

      const result = await saveFantasyTeamAction(gameweekId, nextSelections, false);
      if (!result.ok) {
        setSaveStatus("error");
        setSaveError(result.error);
        return;
      }

      setSubmittedAt(result.data?.submittedAt);
      setSaveStatus("saved");
    },
    [persistRemote, canEdit, gameweekId]
  );

  useEffect(() => {
    if (!hydrated || !persistRemote || !canEdit) return;

    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = window.setTimeout(() => {
      void persistDraft(latestSelectionsRef.current);
    }, 700);

    return () => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
      }
    };
  }, [selections, hydrated, persistRemote, canEdit, persistDraft]);

  const updateSelections = useCallback(
    (updater: (prev: FantasySelection[]) => FantasySelection[]) => {
      if (!canEdit) return;
      setSelections(updater);
    },
    [canEdit]
  );

  const togglePlayer = useCallback(
    (playerId: string) => {
      updateSelections((prev) => togglePlayerSelection(prev, playerId));
    },
    [updateSelections]
  );

  const makeCaptain = useCallback(
    (playerId: string) => {
      updateSelections((prev) => setCaptain(prev, playerId));
    },
    [updateSelections]
  );

  const removePlayer = useCallback(
    (playerId: string) => {
      updateSelections((prev) => prev.filter((selection) => selection.playerId !== playerId));
    },
    [updateSelections]
  );

  const confirmTeam = useCallback(async () => {
    if (!canEdit) return false;

    setConfirmPending(true);
    setSaveError(null);

    const result = await saveFantasyTeamAction(gameweekId, latestSelectionsRef.current, true);
    setConfirmPending(false);

    if (!result.ok) {
      setSaveStatus("error");
      setSaveError(result.error);
      return false;
    }

    if (result.data) {
      setSelections(result.data.selections);
      setSubmittedAt(result.data.submittedAt);
    }
    setSaveStatus("saved");
    return true;
  }, [canEdit, gameweekId]);

  const isSelected = useCallback(
    (playerId: string) => selections.some((selection) => selection.playerId === playerId),
    [selections]
  );

  const isCaptain = useCallback(
    (playerId: string) =>
      selections.some((selection) => selection.playerId === playerId && selection.isCaptain),
    [selections]
  );

  const selectedPlayers = selections
    .map((selection) => availablePlayers.find((player) => player.id === selection.playerId))
    .filter(Boolean) as Player[];

  const canAdd = useCallback(
    (player: Player) => {
      if (!canEdit) return false;
      if (isSelected(player.id)) return true;
      if (selections.length >= 5) return false;
      return canAffordPlayer(selectedPlayers, player);
    },
    [canEdit, selections, selectedPlayers, isSelected]
  );

  const getUnaffordableReason = useCallback(
    (player: Player): string | null => {
      if (!canEdit) return "Selection is locked";
      if (isSelected(player.id)) return null;
      if (selections.length >= 5) return "Squad full";
      if (!canAffordPlayer(selectedPlayers, player)) {
        const shortfall = getBudgetShortfall(selectedPlayers, player);
        return `Need $${shortfall.toFixed(1)}m more`;
      }
      return null;
    },
    [canEdit, selections, selectedPlayers, isSelected]
  );

  const validation = isFantasyTeamValid(selections, availablePlayers);
  const budgetRemaining = calculateBudgetRemaining(selectedPlayers);
  const squadCost = calculateSquadCost(selectedPlayers);

  return {
    selections,
    selectedPlayers,
    togglePlayer,
    makeCaptain,
    removePlayer,
    isSelected,
    isCaptain,
    canAdd,
    getUnaffordableReason,
    validation,
    budgetRemaining,
    squadCost,
    hydrated,
    canEdit,
    submittedAt,
    isSubmitted: Boolean(submittedAt),
    saveStatus,
    saveError,
    confirmTeam,
    confirmPending,
    budgetLimit: FANTASY_BUDGET,
  };
}
