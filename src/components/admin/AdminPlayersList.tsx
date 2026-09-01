"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getPlayerPrice } from "@/lib/fantasy/pricing";
import { createPlayerAction } from "@/lib/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatPrice } from "@/lib/fantasy/pricing";
import type { DataSource } from "@/lib/data/config";
import type { ManagerInvite, Player, Profile, SkillLevel } from "@/types";
import { Plus, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AdminPlayerListItem {
  player: Player;
  profile?: Profile;
  pendingInvite?: ManagerInvite;
}

interface AdminPlayersListProps {
  initialPlayers: AdminPlayerListItem[];
  dataSource: DataSource;
}

export function AdminPlayersList({
  initialPlayers,
  dataSource,
}: AdminPlayersListProps) {
  const router = useRouter();
  const [items, setItems] = useState(initialPlayers);
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSkillLevel, setNewSkillLevel] = useState<SkillLevel>(3);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setItems(initialPlayers);
  }, [initialPlayers]);

  const addPlayer = async () => {
    const name = newName.trim();
    if (!name || isSubmitting) return;
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await createPlayerAction(name, newSkillLevel);
      if (!result.ok || !result.data) {
        setError(result.ok ? "Failed to save player." : result.error);
        return;
      }

      setNewName("");
      setNewSkillLevel(3);
      setShowForm(false);
      router.refresh();
    } catch {
      setError("Failed to save player. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Roster</h2>
        <p className="text-sm text-text-muted mt-1">
          Create players directly — no invite needed. To let someone pick fantasy
          teams, open their player page and send a manager invite.
        </p>
        {dataSource === "mock" && (
          <p className="text-sm text-amber-200/90 mt-2 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2">
            Mock data mode — configure Supabase in <code>.env.local</code> to
            save roster changes.
          </p>
        )}
      </div>

      <Button
        size="sm"
        className="bg-lime text-background hover:bg-lime-muted"
        onClick={() => setShowForm(!showForm)}
      >
        <Plus className="h-4 w-4 mr-1" />
        Add Player
      </Button>

      {showForm && (
        <div className="surface-card p-4 space-y-3 animate-slide-up">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-text-muted">Name</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="mt-1"
                placeholder="Player name"
                disabled={isSubmitting}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void addPlayer();
                }}
              />
            </div>
            <div>
              <Label className="text-xs text-text-muted">Skill Level</Label>
              <Select
                value={String(newSkillLevel)}
                onValueChange={(v) => setNewSkillLevel(Number(v) as SkillLevel)}
                disabled={isSubmitting}
              >
                <SelectTrigger className="w-full mt-1 bg-surface border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {([5, 4, 3, 2, 1] as SkillLevel[]).map((level) => (
                    <SelectItem key={level} value={String(level)}>
                      Level {level} — {formatPrice(getPlayerPrice(level))}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button
            size="sm"
            className="bg-lime text-background hover:bg-lime-muted"
            onClick={() => void addPlayer()}
            disabled={!newName.trim() || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              "Add to roster"
            )}
          </Button>
        </div>
      )}

      <div className="space-y-2">
        {items.map(({ player, profile, pendingInvite }) => {
          const isManager = profile?.isFantasyManager;

          return (
            <Link
              key={player.id}
              href={`/admin/players/${player.id}`}
              className={cn(
                "surface-card p-4 flex items-center gap-4 hover:bg-surface-hover transition-colors group",
                !player.isActive && "opacity-60"
              )}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm">{player.name}</span>
                  <span className="text-lime text-sm tabular-nums">
                    {formatPrice(player.price)}
                  </span>
                  {!player.isActive && <Badge variant="muted">Inactive</Badge>}
                  {isManager ? (
                    <Badge variant="gold">Fantasy manager</Badge>
                  ) : pendingInvite ? (
                    <Badge variant="pending">Invite sent</Badge>
                  ) : (
                    <Badge variant="muted">Roster only</Badge>
                  )}
                </div>
                <p className="text-xs text-text-muted mt-0.5">
                  Skill {player.skillLevel}
                  {profile ? ` · ${profile.name} signed up` : " · No app account"}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-text-muted group-hover:text-lime shrink-0" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function Badge({
  variant,
  children,
}: {
  variant: "gold" | "pending" | "muted";
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "text-[10px] px-1.5 py-0.5 rounded border font-medium",
        variant === "gold" && "bg-gold/15 text-gold border-gold/30",
        variant === "pending" && "bg-lime/10 text-lime border-lime/30",
        variant === "muted" && "bg-surface-hover text-text-muted border-border"
      )}
    >
      {children}
    </span>
  );
}
