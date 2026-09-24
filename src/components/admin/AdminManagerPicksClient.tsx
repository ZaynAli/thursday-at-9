"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { SQUAD_SIZE } from "@/lib/constants";
import type { DataSource } from "@/lib/data/config";
import type {
  ManagerPickRow,
  ManagerPickStatus,
  ManagerPicksSnapshot,
} from "@/lib/data/manager-picks";
import { cn } from "@/lib/utils";
import { CheckCircle2, ClipboardCopy, FileEdit, UserX } from "lucide-react";

interface AdminManagerPicksClientProps {
  snapshot: ManagerPicksSnapshot | null;
  dataSource: DataSource;
}

const STATUS_META: Record<
  ManagerPickStatus,
  {
    title: string;
    description: string;
    icon: typeof UserX;
    accent: string;
  }
> = {
  not_saved: {
    title: "Not saved",
    description: "No squad in the database yet — remind them to open Fantasy.",
    icon: UserX,
    accent: "text-amber-300 border-amber-500/30 bg-amber-500/5",
  },
  draft: {
    title: "Saved draft",
    description: "Picks are saved but they haven’t confirmed yet.",
    icon: FileEdit,
    accent: "text-sky-300 border-sky-500/30 bg-sky-500/5",
  },
  confirmed: {
    title: "Confirmed",
    description: "Team is locked in for this gameweek.",
    icon: CheckCircle2,
    accent: "text-lime border-lime/30 bg-lime/5",
  },
};

function formatTime(iso?: string): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleString([], {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

function ManagerSection({
  status,
  managers,
  confirmedTitle,
}: {
  status: ManagerPickStatus;
  managers: ManagerPickRow[];
  confirmedTitle?: string;
}) {
  const meta = STATUS_META[status];
  const Icon = meta.icon;
  const [copied, setCopied] = useState(false);
  const title =
    status === "confirmed" && confirmedTitle ? confirmedTitle : meta.title;

  const copyNames = async () => {
    const text = managers.map((row) => row.managerName).join("\n");
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <section className={cn("rounded-lg border p-4 space-y-3", meta.accent)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2 min-w-0">
          <Icon className="h-4 w-4 mt-0.5 shrink-0" />
          <div className="min-w-0">
            <h3 className="font-semibold text-sm text-text-primary">
              {title}{" "}
              <span className="tabular-nums text-text-muted font-medium">
                ({managers.length})
              </span>
            </h3>
            <p className="text-xs text-text-muted mt-0.5">
              {status === "confirmed" && confirmedTitle === "Locked"
                ? "Team was confirmed and selection is now locked."
                : meta.description}
            </p>
          </div>
        </div>
        {managers.length > 0 && (
          <Button
            type="button"
            variant="outline"
            size="xs"
            onClick={copyNames}
            className="shrink-0 border-border/60 bg-surface/40"
          >
            <ClipboardCopy className="h-3.5 w-3.5" />
            {copied ? "Copied" : "Copy names"}
          </Button>
        )}
      </div>

      {managers.length === 0 ? (
        <p className="text-sm text-text-muted">Nobody in this group.</p>
      ) : (
        <ul className="space-y-2">
          {managers.map((manager) => {
            const timeLabel =
              status === "confirmed"
                ? formatTime(manager.submittedAt)
                : formatTime(manager.updatedAt);

            return (
              <li
                key={manager.managerId}
                className="flex items-center justify-between gap-3 rounded-md border border-border/50 bg-surface/50 px-3 py-2"
              >
                <span className="font-medium text-sm text-text-primary truncate">
                  {manager.managerName}
                </span>
                <span className="text-xs text-text-muted tabular-nums shrink-0">
                  {status === "draft" && (
                    <>
                      {manager.selectionCount}/{SQUAD_SIZE}
                      {timeLabel ? ` · ${timeLabel}` : null}
                    </>
                  )}
                  {status === "confirmed" && timeLabel}
                  {status === "not_saved" && "—"}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export function AdminManagerPicksClient({
  snapshot,
  dataSource,
}: AdminManagerPicksClientProps) {
  const grouped = useMemo(() => {
    const buckets: Record<ManagerPickStatus, ManagerPickRow[]> = {
      not_saved: [],
      draft: [],
      confirmed: [],
    };
    for (const manager of snapshot?.managers ?? []) {
      buckets[manager.status].push(manager);
    }
    return buckets;
  }, [snapshot]);

  if (dataSource === "mock") {
    return (
      <div className="rounded-lg border border-border bg-surface p-4 text-sm text-text-muted">
        Connect Supabase to track manager pick status.
      </div>
    );
  }

  if (!snapshot) {
    return (
      <div className="rounded-lg border border-border bg-surface p-4 text-sm text-text-muted">
        Save a weekly session first — then you can see who has picked for that
        gameweek.
      </div>
    );
  }

  const selectionOpen = snapshot.gameweekStatus === "selection_open";
  const locked =
    snapshot.gameweekStatus === "selection_locked" ||
    snapshot.gameweekStatus === "in_progress" ||
    snapshot.gameweekStatus === "results_pending" ||
    snapshot.gameweekStatus === "published";
  const confirmedTitle = locked ? "Locked" : "Confirmed";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Manager picks</h2>
        <p className="text-sm text-text-muted mt-1">
          GW {String(snapshot.gameweekNumber).padStart(2, "0")} ·{" "}
          <span className="capitalize">
            {snapshot.gameweekStatus.replaceAll("_", " ")}
          </span>
          {selectionOpen
            ? " — selection is open; nudge anyone not confirmed."
            : locked
              ? " — selection is locked for this week."
              : " — open selection when the session is ready."}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {(
          [
            ["not_saved", grouped.not_saved.length, STATUS_META.not_saved.title],
            ["draft", grouped.draft.length, STATUS_META.draft.title],
            ["confirmed", grouped.confirmed.length, confirmedTitle],
          ] as const
        ).map(([status, count, label]) => (
          <div
            key={status}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-center"
          >
            <p className="text-[10px] uppercase tracking-wider text-text-muted">
              {label}
            </p>
            <p className="text-xl font-bold tabular-nums mt-0.5">{count}</p>
          </div>
        ))}
      </div>

      <ManagerSection status="not_saved" managers={grouped.not_saved} />
      <ManagerSection status="draft" managers={grouped.draft} />
      <ManagerSection
        status="confirmed"
        managers={grouped.confirmed}
        confirmedTitle={confirmedTitle}
      />
    </div>
  );
}
