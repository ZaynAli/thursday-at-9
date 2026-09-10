/** Prefer the linked roster player name when present. */
export function preferPlayerName(
  profileName: string,
  playerName?: string | null
): string {
  const trimmed = playerName?.trim();
  return trimmed || profileName;
}
