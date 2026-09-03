export const DEFAULT_JERSEY_ID = "manutd" as const;

export const JERSEY_OPTIONS = [
  { id: "acmilan", label: "AC Milan", image: "/acmilan.png" },
  { id: "arsenal", label: "Arsenal", image: "/arsenal.png" },
  { id: "athleticomadrid", label: "Atlético Madrid", image: "/athleticomadrid.png" },
  { id: "barca", label: "Barcelona", image: "/barca.png" },
  { id: "chelsea", label: "Chelsea", image: "/chelsea.png" },
  { id: "intermilan", label: "Inter Milan", image: "/intermilan.png" },
  { id: "juventus", label: "Juventus", image: "/juventus.png" },
  { id: "liverpool", label: "Liverpool", image: "/liverpool.png" },
  { id: "mancity", label: "Man City", image: "/mancity.png" },
  { id: "manutd", label: "Man United", image: "/manutd.png" },
  { id: "realmadrid", label: "Real Madrid", image: "/realmadrid.png" },
  { id: "tottenham", label: "Tottenham", image: "/tottenham.png" },
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
