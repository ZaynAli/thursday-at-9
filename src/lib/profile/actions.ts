"use server";

import { revalidatePath } from "next/cache";
import { isJerseyId } from "@/lib/jerseys";
import { updateProfileJersey } from "@/lib/data/profiles.server";
import { createClient } from "@/lib/supabase/server";

export type JerseyUpdateResult = { ok: true } | { ok: false; error: string };

export async function updateJerseyAction(jerseyId: string): Promise<JerseyUpdateResult> {
  if (!isJerseyId(jerseyId)) {
    return { ok: false, error: "Choose a valid jersey." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Sign in to update your jersey." };
  }

  try {
    await updateProfileJersey(user.id, jerseyId);
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Could not save jersey.",
    };
  }
}
