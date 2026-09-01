# Deploy to production (Phase 8)

Guide for shipping Thursday@9 on **Vercel + Supabase**.

## Prerequisites

- GitHub repo with the app pushed
- Supabase project (can reuse dev or create a prod project)
- Domain (optional — Vercel gives `*.vercel.app`)

## 1. Supabase production setup

### Run migrations

In **Supabase → SQL Editor**, run in order:

1. `supabase/migrations/20260831120000_initial_schema.sql`
2. `supabase/grants-service-role.sql` (if tables aren't exposed to the API role)
3. `supabase/migrations/20260831200000_rls_hardening.sql`
4. `supabase/seed-players.sql` (or your roster seed)

### Auth redirect URLs

**Authentication → URL Configuration**

| Setting | Value |
|---------|-------|
| Site URL | `https://your-domain.com` |
| Redirect URLs | `https://your-domain.com/auth/callback` |

Add `http://localhost:3000/auth/callback` for local dev.

### Email (magic links)

Free Supabase email is rate-limited (~2/hour). For ~20 friends in production:

- **Recommended:** Custom SMTP (Resend, SendGrid, etc.) in Supabase → Project Settings → Auth → SMTP
- **Dev fallback:** `npm run auth:link -- email@example.com` (local only)

### Bootstrap admin

1. Sign in once at `/login` with your email
2. Run `supabase/bootstrap-admin.sql` (replace `YOUR_EMAIL`)

## 2. Vercel deploy

1. [vercel.com/new](https://vercel.com/new) → import GitHub repo
2. Framework: **Next.js** (auto-detected)
3. Add environment variables:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (**secret**) |
| `NEXT_PUBLIC_SITE_URL` | `https://your-domain.com` |

4. Deploy

Do **not** set `NEXT_PUBLIC_USE_MOCK_DATA` in production.

### Custom domain

Vercel → Project → Settings → Domains → add your domain.

Update:

- Vercel env: `NEXT_PUBLIC_SITE_URL=https://your-domain.com`
- Supabase Site URL + redirect URLs (step 1)

Redeploy after env changes.

## 3. Verify production

- [ ] `/login` — magic link arrives (or SMTP works)
- [ ] `/admin` — admin only (non-admin redirected)
- [ ] `/admin/gameweek` — save session, open selection, lock
- [ ] `/fantasy` — managers pick + confirm (persists after refresh)
- [ ] Gameweek open banner shows for managers
- [ ] `/admin/results` — publish updates `/league` standings
- [ ] Home recap shows after publish

## 4. Security notes

| Layer | Behavior |
|-------|----------|
| **RLS** | Protects direct Supabase API access via anon key |
| **Service role** | Used only in Next.js server code — never expose to browser |
| **Admin routes** | Protected by `admin/layout.tsx` + `requireAdmin()` on mutations |

Run `supabase/migrations/20260831200000_rls_hardening.sql` so:

- Managers only see other teams **after selection locks**
- Fantasy edits blocked in DB after deadline (defense in depth)
- Match stats hidden until gameweek is **published**

## 5. PWA icons

Icons live in `public/` and are referenced from `manifest.json` and `src/app/layout.tsx`:

| File | Size | Use |
|------|------|-----|
| `icon.svg` | vector | Source — edit this, then regenerate PNGs |
| `icon-192.png` | 192×192 | PWA / Android |
| `icon-512.png` | 512×512 | PWA splash / maskable |
| `apple-touch-icon.png` | 180×180 | iOS home screen |
| `favicon-16.png` / `favicon-32.png` | 16 / 32 | Browser tab |

Regenerate after changing the SVG:

```bash
npm run icons:generate
```

## 6. Local vs production

| | Local | Production |
|---|-------|------------|
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | `https://your-domain.com` |
| Magic links from phone | Won't work (localhost) | Works with real domain |
| Dev link bypass | `npm run auth:link` | Use SMTP or admin generates link server-side |

## Troubleshooting

**Permission denied on reads/writes** — Run `supabase/grants-service-role.sql`.

**Magic link redirects to wrong URL** — Check `NEXT_PUBLIC_SITE_URL` matches deployed origin.

**Admin can't save** — Confirm `bootstrap-admin.sql` ran and profile has `is_admin = true`.
