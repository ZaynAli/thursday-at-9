"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, X } from "lucide-react";
import { useAppSession, useCurrentUser } from "@/context/AppSessionContext";
import { DEFAULT_FANTASY_DEADLINE } from "@/lib/constants";
import { cn } from "@/lib/utils";

const DISMISS_PREFIX = "930-dismissed-gw-alert-";

function formatDeadline(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function GameweekOpenBanner() {
  const { gameweek, dataSource } = useAppSession();
  const user = useCurrentUser();
  const [dismissed, setDismissed] = useState(true);

  const shouldShow =
    dataSource === "supabase" &&
    user?.isFantasyManager &&
    gameweek.id !== "draft" &&
    gameweek.status === "selection_open";

  useEffect(() => {
    if (!shouldShow) return;
    const key = `${DISMISS_PREFIX}${gameweek.id}`;
    setDismissed(window.localStorage.getItem(key) === "1");
  }, [shouldShow, gameweek.id]);

  if (!shouldShow || dismissed) return null;

  function dismiss() {
    window.localStorage.setItem(`${DISMISS_PREFIX}${gameweek.id}`, "1");
    setDismissed(true);
  }

  return (
    <div
      className={cn(
        "mb-6 rounded-lg border border-lime/30 bg-lime/10 px-4 py-3",
        "flex items-start gap-3 animate-slide-up"
      )}
      role="status"
    >
      <Bell className="h-4 w-4 text-lime mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary">
          Gameweek {String(gameweek.number).padStart(2, "0")} is open — pick your team
        </p>
        <p className="text-xs text-text-muted mt-0.5">
          Deadline {formatDeadline(gameweek.fantasyDeadline)} ({DEFAULT_FANTASY_DEADLINE.label}{" "}
          Thursday)
        </p>
        <Link
          href="/fantasy"
          className="inline-block text-xs font-medium text-lime hover:underline mt-2"
        >
          Go to Fantasy →
        </Link>
      </div>
      <button
        type="button"
        onClick={dismiss}
        className="text-text-muted hover:text-text-primary transition-colors shrink-0"
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
