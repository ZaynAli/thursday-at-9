"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { JerseyIcon } from "@/components/shared/JerseyIcon";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { JERSEY_OPTIONS, type JerseyId } from "@/lib/jerseys";
import { updateJerseyAction } from "@/lib/profile/actions";

interface JerseyPickerProps {
  currentJerseyId: JerseyId;
}

export function JerseyPicker({ currentJerseyId }: JerseyPickerProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<JerseyId>(currentJerseyId);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const dirty = selected !== currentJerseyId;

  async function handleSave() {
    setPending(true);
    setError(null);
    setSaved(false);

    const result = await updateJerseyAction(selected);
    setPending(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setSaved(true);
    router.refresh();
  }

  return (
    <section className="rounded-lg border border-border bg-surface p-4 space-y-4">
      <div>
        <h2 className="text-xs font-semibold tracking-[0.15em] text-text-muted uppercase">
          Favorite Team Jersey
        </h2>
        <p className="text-sm text-text-muted mt-1">
          Your kit shows on any manager&apos;s formation when you&apos;re picked.
        </p>
      </div>

      <div className="flex items-center gap-4">
        <JerseyIcon jerseyId={selected} size="lg" />
        <div className="flex-1 space-y-2">
          <Label htmlFor="jersey">Jersey</Label>
          <Select
            value={selected}
            onValueChange={(value) => {
              if (value) {
                setSelected(value as JerseyId);
                setSaved(false);
              }
            }}
            disabled={pending}
          >
            <SelectTrigger id="jersey" className="w-full bg-surface-elevated border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {JERSEY_OPTIONS.map((jersey) => (
                <SelectItem key={jersey.id} value={jersey.id}>
                  {jersey.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {saved && !dirty && (
        <p className="text-sm text-lime">Jersey saved.</p>
      )}

      <Button
        type="button"
        className="bg-lime text-background hover:bg-lime-muted"
        disabled={!dirty || pending}
        onClick={() => void handleSave()}
      >
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Saving…
          </>
        ) : (
          "Save jersey"
        )}
      </Button>
    </section>
  );
}
