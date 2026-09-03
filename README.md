# Thursday@9

A private fantasy soccer league app for Thursday night 7v7 games at 9:30 PM.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Supabase

The app runs on **mock data** without Supabase. To connect a project:

```bash
cp .env.example .env.local
# Fill in Supabase URL, anon key, service role key, site URL
npm run dev
```

Setup guides:

- **[docs/supabase-setup.md](docs/supabase-setup.md)** — project, env, migrations
- **[docs/auth-setup.md](docs/auth-setup.md)** — magic links, invites, admin bootstrap
- **[docs/deploy.md](docs/deploy.md)** — Vercel production deploy
- **[docs/onboarding.md](docs/onboarding.md)** — weekly admin flow

Set `NEXT_PUBLIC_USE_MOCK_DATA=true` to force mocks even when Supabase is configured.

## Testing

```bash
npm run test:e2e          # Playwright smoke tests
npm run test:e2e:ui       # Interactive test UI
npm run auth:link -- you@example.com   # Dev magic link (bypasses email rate limit)
```

## Stack

- Next.js 16 (App Router)
- React 19 + TypeScript
- Tailwind CSS v4
- shadcn/ui
- Supabase (Auth + PostgreSQL)
- Playwright (e2e)

## Weekly loop (production)

1. **Admin** — create roster, send manager invites
2. **Admin** — `/admin/gameweek` — session players, open selection, lock
3. **Managers** — `/fantasy` — pick and confirm teams
4. **Admin** — `/admin/results` — enter stats, publish gameweek
5. **Everyone** — home recap + `/league` standings update

## League rules

Configured in `src/lib/constants.ts`:

- Thursday 9:30 PM ET kickoff · fantasy locks at kickoff (unless admin locks earlier)
- Squad of 5 · $35.0m budget · captain scores 2×
- Scoring: appearance +2, win +3, draw +1, goal +4, assist +3, stop +2 (max 3)

## Project structure

```
src/
├── app/           # Pages (Home, Fantasy, League, Admin, Auth)
├── components/    # UI by feature
├── context/       # App session + fantasy team state
├── lib/data/      # Supabase reads/writes (mock fallback)
├── lib/fantasy/   # Scoring, pricing, squad validation
└── types/         # Domain types
docs/              # Setup, schema, onboarding, deploy
supabase/          # SQL migrations + seeds
e2e/               # Playwright tests
```

## Deploy

See **[docs/deploy.md](docs/deploy.md)** for Vercel + Supabase production checklist.

After initial migration, run **`supabase/migrations/20260831200000_rls_hardening.sql`** for production RLS policies.
