import type { User } from "@supabase/supabase-js";

export const MIN_PASSWORD_LENGTH = 8;

export function userNeedsPasswordSetup(user: User): boolean {
  return user.user_metadata?.password_set !== true;
}

export function validatePassword(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  return null;
}
