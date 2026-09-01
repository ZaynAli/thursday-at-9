# Supabase setup (1.1)

Connect the Thursday@9 app to a Supabase project. No database tables yet — that is **1.2 Run initial migration**.

## 1. Create a Supabase project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. **New project** → pick org, name (e.g. `thursday-at-9`), region, database password
3. Wait for the project to finish provisioning

## 2. Copy API keys

**Project Settings → API**

| Key | Env variable | Notes |
|-----|--------------|-------|
| Project URL | `NEXT_PUBLIC_SUPABASE_URL` | Public |
| `anon` `public` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public, safe in browser with RLS |
| `service_role` | `SUPABASE_SERVICE_ROLE_KEY` | **Secret** — local/scripts only |

## 3. Configure local env

```bash
cp .env.example .env.local
```

Edit `.env.local` with your project values. Restart the dev server after changing env.

```bash
npm run dev
```

## 4. Verify connection

With `.env.local` set, Supabase clients are available:

```ts
// Client Components
import { createClient } from "@/lib/supabase/client";

// Server Components / actions / route handlers
import { createClient } from "@/lib/supabase/server";
```

Optional health check (server):

```ts
import { checkSupabaseHealth } from "@/lib/supabase/health";

const health = await checkSupabaseHealth();
// { configured: true, connected: true, message: "..." }
```

**Without `.env.local`:** the app still runs on mock data. Middleware skips session refresh until env is configured.

## 5. What was added

```
src/lib/supabase/
├── env.ts          # isSupabaseConfigured(), getSupabaseEnv()
├── client.ts       # Browser client
├── server.ts       # Server client (cookies)
├── middleware.ts   # Session refresh helper
└── health.ts       # Connection check

src/proxy.ts           # Session refresh on navigations (Next.js 16)
.env.example        # Template (committed)
.env.local          # Your secrets (gitignored)
```

## 6. Next step — 1.2 Migration

Run the initial migration in **Supabase → SQL Editor**:

1. Open `supabase/migrations/20260831120000_initial_schema.sql` in this repo
2. Copy the full file contents
3. Paste into a **New query** in the SQL Editor
4. Click **Run**
5. Confirm tables appear under **Table Editor** (`players`, `profiles`, `gameweeks`, etc.)

Then run **1.3 seed** — copy `supabase/seed.sql` into the SQL Editor and run it to load the roster (19 players, no managers yet).

If the app shows **permission denied for table players**, run `supabase/grants-service-role.sql` in the SQL Editor (required when "Automatically expose new tables" was disabled).

### 1.3 Seed roster

1. Open `supabase/seed.sql`
2. Copy → paste into **SQL Editor** → **Run**
3. Confirm **19 rows** in `players` (all `has_profile = false`)

Skill levels: matched to the prototype where names overlap; new names (Moiz, Gagan, Mukarram, Zohair, Sharjeel) default to **3**. Adjust in **Table Editor** or `/admin/players` once wired up.

## 7. Auth & production

- **Auth:** **`docs/auth-setup.md`** — magic links, invites, admin bootstrap
- **RLS hardening:** Run `supabase/migrations/20260831200000_rls_hardening.sql` after the initial migration
- **Deploy:** **`docs/deploy.md`** — Vercel + production env checklist

## Security notes

- Never commit `.env.local` or expose `SUPABASE_SERVICE_ROLE_KEY` in client code
- RLS is enabled on all tables; run the **RLS hardening** migration before production
- Server actions use the service role for trusted writes; RLS protects direct API access via the anon key
