import { getCurrentUser } from "@/lib/data/profiles";
import type { Profile } from "@/types";

export class AdminAuthError extends Error {
  constructor(message = "Admin access required.") {
    super(message);
    this.name = "AdminAuthError";
  }
}

export async function requireAdmin(): Promise<Profile> {
  const user = await getCurrentUser();
  if (!user?.isAdmin) {
    throw new AdminAuthError();
  }
  return user;
}
