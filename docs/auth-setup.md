# Auth setup (Phase 3)

Password sign-in for returning users. Magic links are **one-time only** — for manager invites and first-time email verification.

## 1. Supabase Auth settings

**Authentication → URL configuration**

| Setting | Local dev | Production |
|---------|-----------|------------|
| Site URL | `http://localhost:3000` | `https://thursday-at-9.vercel.app` |
| Redirect URLs | `http://localhost:3000/auth/callback**` | `https://thursday-at-9.vercel.app/auth/callback**` |

Add `http://127.0.0.1:3000/auth/callback**` too if you browse via 127.0.0.1.

**Authentication → Providers → Email**

- Enable Email provider
- **Confirm email** can stay off for a friends-only app

## 2. Environment

```bash
SITE_URL=http://localhost:3000   # optional locally; auto-detected on Vercel
```

## 3. Sign in (returning users)

1. Open `/login`
2. Enter email + password → **Sign in**
3. Redirected to `/` with session cookie set

No email is sent — this avoids Supabase’s ~2 auth emails/hour limit for day-to-day use.

## 4. First-time setup (managers)

1. Admin sends a manager invite from the player page
2. Manager opens `/join?token=…`
3. Enter email → **Send setup link** (one-time magic link)
4. Click the link → choose a password at `/login/set-password`
5. Future sign-ins use email + password at `/login`

## 5. Bootstrap admin (Zain)

After your first setup link sign-in and password choice:

1. Open `supabase/bootstrap-admin.sql`
2. Replace `YOUR_EMAIL@example.com` with your email
3. Run in **Supabase → SQL Editor**

This sets `is_admin`, links your profile to the Zain player row, and enables fantasy manager access.

If you already signed in via magic link before passwords were added, the app will ask you to choose a password on your next visit.

## 6. Manager invites

When Phase 4 persists invites to the DB, managers open:

```
/join?token=<invite-token>
```

Flow:

1. Validates pending, non-expired invite
2. One-time setup link by email (or dev “no email” link locally)
3. `/auth/callback` links profile ↔ player, sets `is_fantasy_manager = true`
4. `/login/set-password` — choose a password
5. Redirects home

## 7. Routes

| Route | Purpose |
|-------|---------|
| `/login` | Email + password sign-in |
| `/login/set-password` | First-time password setup after magic link |
| `/join?token=` | Accept manager invite (sends setup link) |
| `/auth/callback` | Exchange auth code for session |

## 8. App behavior

- **Supabase mode, signed out:** home/league visible; profile/admin require sign-in
- **Mock mode:** unchanged — still uses prototype Zain user
- **Admin:** `/admin/*` redirects to `/login?next=/admin` if unsigned; non-admins sent home

## 9. Sign out

Profile page → **Sign out** (clears session, redirects to `/login`).

## Email rate limit (built-in SMTP)

Supabase's default email sender allows **~2 auth emails per hour** per project. With password sign-in, you only hit this when **new managers** accept invites — not on every login.

**When rate limited during invite setup:**

1. **Local dev on `/join`:** enter email → **Get setup link (no email)** → **Open setup link**
2. **Terminal:** `npm run auth:link -- your@email.com --local` (local dev) or `--production` (deployed site)
3. **Wait ~1 hour** for the Supabase email quota to reset
4. **Long-term:** custom SMTP (e.g. [Resend](https://resend.com) free tier) in **Supabase → Authentication → SMTP**
