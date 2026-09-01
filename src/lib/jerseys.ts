export const DEFAULT_JERSEY_ID = "manutd" as const;

export const JERSEY_OPTIONS = [
  { id: "manutd", label: "Man United", image: "/manutd.png" },
  { id: "arsenal", label: "Arsenal", image: "/arsenal.png" },
] as const;

export type JerseyId = (typeof JERSEY_OPTIONS)[number]["id"];

const jerseyById = new Map(JERSEY_OPTIONS.map((jersey) => [jersey.id, jersey]));

export function isJerseyId(value: string): value is JerseyId {
  return jerseyById.has(value as JerseyId);
}

export function getJersey(id?: string | null) {
  if (id && isJerseyId(id)) return jerseyById.get(id)!;
  return jerseyById.get(DEFAULT_JERSEY_ID)!;
}

export function resolveJerseyId(id?: string | null): JerseyId {
  return getJersey(id).id;
}
