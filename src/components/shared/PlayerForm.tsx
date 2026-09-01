import { cn } from "@/lib/utils";

interface PlayerFormProps {
  form: number;
  size?: "sm" | "md";
  className?: string;
}

export function PlayerForm({ form, size = "sm", className }: PlayerFormProps) {
  const color =
    form >= 8 ? "text-lime" : form >= 6 ? "text-text-primary" : "text-text-muted";

  return (
    <span
      className={cn(
        "tabular-nums font-medium",
        size === "sm" ? "text-xs" : "text-sm",
        color,
        className
      )}
    >
      {form.toFixed(1)}
    </span>
  );
}
