"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getPlayerPrice } from "@/lib/fantasy/pricing";
import { MANAGER_INVITE_DESCRIPTION } from "@/lib/onboarding";
import {
  enableManagerAction,
  sendManagerInviteAction,
  updatePlayerAction,
} from "@/lib/admin/actions";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
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
import { ArrowLeft, Copy, Check, Trophy, Send, Loader2, Save } from "lucide-react";

interface AdminPlayerDetailProps {
  player: Player;
  profile?: Profile;
  initialInvite?: ManagerInvite;
  dataSource: DataSource;
}

export function AdminPlayerDetail({
  player: initialPlayer,
  profile: initialProfile,
  initialInvite,
  dataSource,
}: AdminPlayerDetailProps) {
  const router = useRouter();
  const [player, setPlayer] = useState(initialPlayer);
  const [profile, setProfile] = useState(initialProfile);
  const [skillLevel, setSkillLevel] = useState<SkillLevel>(player.skillLevel);
  const [isActive, setIsActive] = useState(player.isActive);
  const [invite, setInvite] = useState<ManagerInvite | undefined>(initialInvite);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isInviting, setIsInviting] = useState(false);

  useEffect(() => {
    setPlayer(initialPlayer);
    setProfile(initialProfile);
    setSkillLevel(initialPlayer.skillLevel);
    setIsActive(initialPlayer.isActive);
    setInvite(initialInvite);
  }, [initialPlayer, initialProfile, initialInvite]);

  const isManager = profile?.isFantasyManager ?? false;
  const price = getPlayerPrice(skillLevel);
  const rosterDirty =
    skillLevel !== player.skillLevel || isActive !== player.isActive;
  const isBusy = isSaving || isInviting;

  const copyLink = async () => {
    if (!invite) return;
    await navigator.clipboard.writeText(invite.inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const saveRosterSettings = async () => {
    setError(null);
    setSaved(false);
    setIsSaving(true);

    try {
      const result = await updatePlayerAction(player.id, { skillLevel, isActive });
      if (!result.ok || !result.data) {
        setError(result.ok ? "Failed to save player." : result.error);
        return;
      }
      setPlayer(result.data);
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError("Failed to save player. Try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const sendManagerInvite = async () => {
    setError(null);
    setIsInviting(true);

    try {
      const result = await sendManagerInviteAction(player.id, player.name);
      if (!result.ok || !result.data) {
        setError(result.ok ? "Failed to create invite." : result.error);
        return;
      }
      setInvite(result.data);
      router.refresh();
    } catch {
      setError("Failed to create invite. Try again.");
    } finally {
      setIsInviting(false);
    }
  };

  const enableManager = async () => {
    setError(null);
    setIsInviting(true);

    try {
      const result = await enableManagerAction(player.id);
      if (!result.ok || !result.data) {
        setError(result.ok ? "Failed to enable manager." : result.error);
        return;
      }
      setProfile(result.data);
      setInvite(undefined);
      router.refresh();
    } catch {
      setError("Failed to enable manager. Try again.");
    } finally {
      setIsInviting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-lg">
      <Link
        href="/admin/players"
        className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-lime transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to roster
      </Link>

      <div>
        <h2 className="text-2xl font-bold">{player.name}</h2>
        <p className="text-lime text-lg font-semibold tabular-nums mt-1">
          {formatPrice(price)}
        </p>
      </div>

      {dataSource === "mock" && (
        <p className="text-sm text-amber-200/90 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2">
          Mock data mode — configure Supabase in <code>.env.local</code> to save
          changes.
        </p>
      )}

      {error && (
        <p className="text-sm text-destructive rounded-lg border border-destructive/30 bg-destructive/5 p-3">
          {error}
        </p>
      )}

      <div className="surface-card p-4 space-y-4">
        <h3 className="text-xs font-semibold tracking-wider text-text-muted uppercase">
          Roster settings
        </h3>
        <div className="flex items-center justify-between">
          <Label htmlFor="active">Active in roster</Label>
          <Switch
            id="active"
            checked={isActive}
            onCheckedChange={setIsActive}
            disabled={isBusy}
          />
        </div>
        <div>
          <Label className="text-xs text-text-muted">Skill level (admin only)</Label>
          <Select
            value={String(skillLevel)}
            onValueChange={(v) => setSkillLevel(Number(v) as SkillLevel)}
            disabled={isBusy}
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
        <Button
          className="w-full bg-lime text-background hover:bg-lime-muted gap-2"
          onClick={() => void saveRosterSettings()}
          disabled={!rosterDirty || isBusy}
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : saved ? (
            <Check className="h-4 w-4" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saved ? "Saved" : "Save roster settings"}
        </Button>
      </div>

      <div className="surface-card p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-gold" />
          <h3 className="font-semibold text-sm">Fantasy manager access</h3>
        </div>

        {isManager ? (
          <div className="rounded-lg bg-gold/10 border border-gold/30 p-3 text-sm">
            <p className="text-gold font-medium">
              {profile?.name ?? player.name} is a fantasy manager
            </p>
            <p className="text-text-muted text-xs mt-1">
              Can pick teams each week, even when not in the session roster.
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm text-text-muted">{MANAGER_INVITE_DESCRIPTION}</p>

            {invite ? (
              <div className="space-y-3">
                <div className="rounded-lg bg-surface border border-border p-3">
                  <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">
                    Invite link
                  </p>
                  <p className="text-xs text-text-secondary break-all font-mono">
                    {invite.inviteUrl}
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => void copyLink()}
                  disabled={isBusy}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-lime" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  {copied ? "Copied!" : "Copy manager invite link"}
                </Button>
                <p className="text-xs text-text-muted text-center">
                  Waiting for {player.name} to sign up
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => void sendManagerInvite()}
                  disabled={isBusy}
                >
                  Regenerate invite link
                </Button>
              </div>
            ) : (
              <Button
                className="w-full bg-lime text-background hover:bg-lime-muted gap-2"
                onClick={() => void sendManagerInvite()}
                disabled={isBusy}
              >
                {isInviting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Send manager invite link
              </Button>
            )}

            {profile && (
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs border-gold/30 text-gold hover:bg-gold/10"
                onClick={() => void enableManager()}
                disabled={isBusy}
              >
                Enable manager now (already signed up)
              </Button>
            )}
          </>
        )}
      </div>

      <div className="surface-card p-4">
        <h3 className="text-xs font-semibold tracking-wider text-text-muted uppercase mb-3">
          Season stats
        </h3>
        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            { label: "Apps", value: player.appearances },
            { label: "Goals", value: player.goals },
            { label: "Pts", value: player.seasonFantasyPoints },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-[10px] text-text-muted uppercase">{label}</p>
              <p className="text-lg font-bold tabular-nums">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
