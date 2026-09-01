# Auth setup (Phase 3)

Magic-link sign-in via Supabase Auth, real profiles from the session, and manager invite acceptance at `/join`.

## 1. Supabase Auth settings

**Authentication → URL configuration**

| Setting | Local dev | Production |
|---------|-----------|------------|
| Site URL | `http://localhost:3000` | `https://thursdayat9.app` |
| Redirect URLs | `http://localhost:3000/auth/callback**` | `https://thursdayat9.app/auth/callback**` |

Add `http://127.0.0.1:3000/auth/callback**` too if you browse via 127.0.0.1. Add both local and production URLs if you use both.

**Authentication → Providers → Email**

- Enable Email provider
- **Confirm email** can stay off for a friends-only app (magic link is enough)

## 2. Environment

Add to `.env.local`:

```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Production: set to your public origin. Used for magic-link callbacks and manager invite URLs.

## 3. Sign in (any user)

1. Open `/login`
2. Enter email → **Send magic link**
3. Click the link in your email
4. Redirected to `/` with session cookie set

On first sign-in, the DB trigger `handle_new_user` creates a row in `profiles`.

## 4. Bootstrap admin (Zain)

After your first magic-link sign-in:

1. Open `supabase/bootstrap-admin.sql`
2. Replace `YOUR_EMAIL@example.com` with your email
3. Run in **Supabase → SQL Editor**

This sets `is_admin`, links your profile to the Zain player row, and enables fantasy manager access.

## 5. Manager invites

When Phase 4 persists invites to the DB, managers open:

```
/join?token=<invite-token>
```

Flow:

1. Validates pending, non-expired invite
2. Magic-link sign-in (or existing session)
3. `/auth/callback` links profile ↔ player, sets `is_fantasy_manager = true`
4. Redirects home

Until invites are saved in Phase 4, you can insert a test invite manually:

```sql
INSERT INTO public.invites (player_id, token, expires_at)
SELECT id, 'test-invite-token', now() + interval '30 days'
FROM public.players WHERE name ILIKE 'Ramis' LIMIT 1;
```

Then open `http://localhost:3000/join?token=test-invite-token`.

## 6. Routes added

| Route | Purpose |
|-------|---------|
| `/login` | Magic-link sign-in |
| `/join?token=` | Accept manager invite |
| `/auth/callback` | Exchange auth code for session |

## 7. App behavior

- **Supabase mode, signed out:** home/league visible; profile/admin require sign-in
- **Mock mode:** unchanged — still uses prototype Zain user
- **Admin:** `/admin/*` redirects to `/login?next=/admin` if unsigned; non-admins sent home

## 8. Sign out

Profile page → **Sign out** (clears session, redirects to `/login`).

## Local dev vs phone

Magic links use `NEXT_PUBLIC_SITE_URL` (currently `http://localhost:3000`). **localhost only exists on your Mac** — it is not reachable from your phone or a friend's device.

| Where you open the email link | Result |
|-------------------------------|--------|
| Same Mac, dev server running | Works |
| iPhone / Android | "Could not connect to server" |
| Another computer | "Could not connect to server" |

**To test on phone or share with friends locally:**

1. Run a tunnel, e.g. `npx ngrok http 3000`
2. Set `NEXT_PUBLIC_SITE_URL=https://YOUR-NGROK-SUBDOMAIN.ngrok-free.app` in `.env.local`
3. Add that URL + `/auth/callback**` to Supabase redirect URLs
4. Restart `npm run dev`
5. Request a **new** magic link (old emails still point at localhost)

## Email rate limit (built-in SMTP)

Supabase's default email sender allows **~2 auth emails per hour** per project. Testing magic links quickly hits this.

**Old links stop working because:**
- Each link is **single-use** (clicking once consumes it, even if sign-in failed)
- Links **expire** after about an hour

**When rate limited:**

1. **On `/join` or `/login` (local dev):** enter email → **Get sign-in link (no email)** → **Open sign-in link**. For invites, use the button on `/join` so the invite token is stored in cookies automatically.
2. **Terminal:** `npm run auth:link -- your@email.com` (sign-in only; for invites prefer the in-app button)
3. **Wait ~1 hour** for the Supabase email quota to reset
4. **Long-term:** custom SMTP (e.g. [Resend](https://resend.com) free tier) in **Supabase → Authentication → SMTP**
