"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { JerseyIcon } from "@/components/shared/JerseyIcon";
import { Button } from "@/components/ui/button";
import { JERSEY_OPTIONS, type JerseyId } from "@/lib/jerseys";
import { updateJerseyAction } from "@/lib/profile/actions";
import { cn } from "@/lib/utils";

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
  const selectedJersey = JERSEY_OPTIONS.find((jersey) => jersey.id === selected);

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

      <div className="flex items-center gap-3">
        <JerseyIcon jerseyId={selected} size="lg" />
        <div>
          <p className="text-sm font-medium text-text-primary">{selectedJersey?.label}</p>
          <p className="text-xs text-text-muted">Selected kit</p>
        </div>
      </div>

      <div
        className="grid grid-cols-3 sm:grid-cols-4 gap-2"
        role="listbox"
        aria-label="Favorite team"
      >
        {JERSEY_OPTIONS.map((jersey) => {
          const isSelected = selected === jersey.id;
          return (
            <button
              key={jersey.id}
              type="button"
              role="option"
              aria-selected={isSelected}
              disabled={pending}
              onClick={() => {
                setSelected(jersey.id);
                setSaved(false);
              }}
              className={cn(
                "relative flex flex-col items-center gap-1.5 rounded-lg border p-2.5 transition-colors",
                "hover:bg-surface-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime/50",
                isSelected
                  ? "border-lime bg-lime/10"
                  : "border-border bg-surface-elevated/40"
              )}
            >
              {isSelected && (
                <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-lime text-background">
                  <Check className="h-2.5 w-2.5" strokeWidth={3} />
                </span>
              )}
              <Image
                src={jersey.image}
                alt=""
                width={40}
                height={40}
                className="h-10 w-10 object-contain"
              />
              <span className="text-[10px] leading-tight text-center text-text-muted line-clamp-2">
                {jersey.label}
              </span>
            </button>
          );
        })}
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
