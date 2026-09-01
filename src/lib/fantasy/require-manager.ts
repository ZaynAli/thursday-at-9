import { getCurrentUser } from "@/lib/data/profiles";
import type { Profile } from "@/types";

export class FantasyAuthError extends Error {
  constructor(message = "Fantasy manager access required.") {
    super(message);
    this.name = "FantasyAuthError";
  }
}

export async function requireFantasyManager(): Promise<Profile> {
  const user = await getCurrentUser();
  if (!user?.isFantasyManager) {
    throw new FantasyAuthError();
  }
  return user;
}
