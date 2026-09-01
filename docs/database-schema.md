# PostgreSQL Schema for Thursday@9

> Target schema for Supabase integration. Aligned with the current frontend prototype (`/admin/gameweek`, `/admin/results`, `/fantasy`, etc.) as of Aug 2026.

## Domain model

Three separate concepts — do not conflate them:

| Concept | Table | Description |
|---------|-------|-------------|
| **Profile** | `profiles` | Logged-in app user (Supabase Auth) |
| **Player** | `players` | Real soccer participant; fantasy asset when selected for a gameweek |
| **Fantasy manager** | `profiles.is_fantasy_manager` | Profile who picks a weekly fantasy team |

A person can be any combination:

- **Player only** — on the roster, no app account (admin-created)
- **Fantasy manager** — admin sends a manager invite; can pick teams even when not in this week's session
- **Both** — plays Thursday and picks fantasy

**Onboarding:** Roster players are admin-created. The only invite flow is **manager invite** from `/admin/players/[id]`. See `docs/onboarding.md`.

**Weekly scale (~20 friends):**

- ~18–20 **players** in the group roster (`players.is_active`)
- **Session size depends on format** — see [Game formats](#game-formats) (10–18 players)
- ~10 **fantasy managers** submitting teams each week
- Fantasy pool = `gameweek_players` only (not the full roster)

```
profiles ──optional──► players
   │                      │
   │ is_fantasy_manager   │ gameweek_players (weekly subset, format-driven)
   ▼                      ▼
fantasy_teams         player_gameweek_stats
                           ▲
                      match_players (team assignment)
```

## Overview

All tables use `UUID` primary keys (`gen_random_uuid()`). Timestamps use `timestamptz`.

---

## Game formats

Admin selects format on the weekly session page. Session player count and team balance are derived from format.

| Format | Players per side | Total session players |
|--------|------------------|------------------------|
| `5v5`  | 5                | 10                     |
| `6v6`  | 6                | 12                     |
| `7v7`  | 7                | 14                     |
| `8v8`  | 8                | 16                     |
| `9v9`  | 9                | 18                     |

**Rules**

- `gameweek_players` row count MUST equal the format total before opening selection
- Each side MUST have exactly `players_per_side` rows in `match_players`
- Default format: `7v7` (most common)
- `9v9` is rare (needs full ~18 roster); UI supports it for those weeks

**App reference:** `src/lib/session-formats.ts` — single source of truth for format math in the frontend.

---

## Team naming (real sessions)

Jersey sides are **not** always White vs Color. Common matchups:

| Preset | Side A | Side B |
|--------|--------|--------|
| Default | White | Colours |
| Alternate | Black | Colours |

Admin picks/edits display names each week on `/admin/gameweek`. Examples:

- "White 4 – 3 Colours"
- "Black 2 – 2 Colours"

**Storage model:** Use neutral sides internally — do **not** store `'white' \| 'color'` as the only option in the DB.

| Internal | Meaning |
|----------|---------|
| `team_side = 'a'` | First team (admin-entered name, e.g. White or Black) |
| `team_side = 'b'` | Second team (usually **Colours**) |

Display names live on `matches.team_a_name` and `matches.team_b_name`.

**Prototype note:** The current UI uses `white` / `color` as internal keys with editable name fields (`teamWhiteName`, `teamColorName`). When migrating, map `white → a`, `color → b`.

---

## Frontend ↔ schema mapping

| Prototype (mock / UI) | Production table.column |
|-----------------------|-------------------------|
| `Gameweek.format` | `gameweeks.format` |
| `Gameweek.availablePlayerIds` | `gameweek_players.player_id` |
| `Gameweek.teamWhiteName` | `matches.team_a_name` |
| `Gameweek.teamColorName` | `matches.team_b_name` |
| `Gameweek.teamAssignments[id]` | `match_players.team_side` (`a`/`b`) |
| `FantasyTeam` (localStorage) | `fantasy_teams` + `fantasy_selections` |
| `CURRENT_USER_ID` | `profiles.id` from Supabase Auth |
| `Player.skillLevel` | `players.skill_level` (price computed in app) |

---

## Core tables

### `profiles`

Extends Supabase Auth users. One row per app login.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | FK → auth.users |
| display_name | TEXT NOT NULL | |
| initials | TEXT | |
| avatar_color | TEXT | |
| is_admin | BOOLEAN DEFAULT false | |
| is_fantasy_manager | BOOLEAN DEFAULT false | Set true on manager invite accept |
| player_id | UUID NULL | FK → players; NULL if manager-only |
| created_at | timestamptz | |
| updated_at | timestamptz | |

**Constraints**

- `player_id` UNIQUE where NOT NULL — one profile per player
- Manager-only: `is_fantasy_manager = true`, `player_id NULL`
- Player-linked manager: both flags/ FK set

### `players`

Group soccer roster. Fantasy assets when added to a gameweek pool.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| name | TEXT NOT NULL | |
| skill_level | SMALLINT CHECK (1–5) | Admin-only; drives fantasy price |
| is_active | BOOLEAN DEFAULT true | In the group roster (~20) |
| profile_id | UUID NULL | FK → profiles; NULL until they sign up |
| created_at | timestamptz | |
| updated_at | timestamptz | |

**Constraints**

- `profile_id` UNIQUE where NOT NULL
- Price derived from `skill_level` in app layer (`lib/fantasy/pricing.ts`) — not stored

### `seasons`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| name | TEXT | e.g. "Fall 2026" |
| start_date | date | |
| end_date | date NULL | |
| is_current | BOOLEAN | |

### `gameweeks`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| season_id | UUID FK → seasons | |
| number | INTEGER NOT NULL | Actual sessions played (skipped weeks omitted) |
| scheduled_at | timestamptz | Thursday 9:30 PM |
| fantasy_deadline | timestamptz | Default 8:30 PM same day |
| status | TEXT | See [Gameweek status](#gameweek-status) |
| format | TEXT | `5v5`, `6v6`, `7v7`, `8v8`, `9v9` |
| published_at | timestamptz NULL | |
| UNIQUE(season_id, number) | | |

**Check constraint (recommended)**

```sql
format IN ('5v5', '6v6', '7v7', '8v8', '9v9')
```

### Gameweek status

| Status | Meaning |
|--------|---------|
| `draft` | Admin configuring session (format, players, teams) |
| `selection_open` | Fantasy managers can submit teams |
| `selection_locked` | Past deadline; teams visible, no edits |
| `in_progress` | Match happening |
| `results_pending` | Admin entering stats |
| `published` | Scores final; standings updated |

Legacy values `pool_open` may be folded into `draft` or `selection_open` during migration.

### `gameweek_players`

Admin-selected subset playing **this** gameweek. Becomes the fantasy selection pool.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| gameweek_id | UUID FK → gameweeks | |
| player_id | UUID FK → players | |
| UNIQUE(gameweek_id, player_id) | | |

**Rules**

- Row count = format total (e.g. 14 for `7v7`, 18 for `9v9`)
- Only these players appear in the fantasy player pool that week
- Roster players not in this table are inactive for that gameweek

### `matches`

One real match per gameweek.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| gameweek_id | UUID FK → gameweeks UNIQUE | One match per gameweek |
| team_a_name | TEXT NOT NULL | Display name, e.g. "White" or "Black" |
| team_b_name | TEXT NOT NULL | Display name, usually "Colours" |
| team_a_score | INTEGER NULL | Set on results entry |
| team_b_score | INTEGER NULL | Set on results entry |
| created_at | timestamptz | |
| updated_at | timestamptz | |

**Defaults:** `team_a_name = 'White'`, `team_b_name = 'Colours'`. Admin overrides per week.

**Display:** `{team_a_name} {team_a_score} – {team_b_score} {team_b_name}` (see home recap).

### `match_players`

Real team assignments for players in `gameweek_players`.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| match_id | UUID FK → matches | |
| player_id | UUID FK → players | Must exist in `gameweek_players` |
| team_side | TEXT NOT NULL | `'a'` \| `'b'` |
| UNIQUE(match_id, player_id) | | |

**Check constraint:** `team_side IN ('a', 'b')`

### `player_gameweek_stats`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| gameweek_id | UUID FK → gameweeks | |
| player_id | UUID FK → players | |
| appeared | BOOLEAN | |
| team_side | TEXT | `'a'` \| `'b'` — copy from `match_players` |
| won | BOOLEAN | |
| drew | BOOLEAN | |
| goals | INTEGER DEFAULT 0 | |
| assists | INTEGER DEFAULT 0 | |
| defensive_stops | INTEGER DEFAULT 0 | |
| fantasy_points | INTEGER | Computed on publish |
| UNIQUE(gameweek_id, player_id) | | |

### `fantasy_teams`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| gameweek_id | UUID FK → gameweeks | |
| manager_id | UUID FK → profiles | Must be `is_fantasy_manager` |
| submitted_at | timestamptz NULL | |
| total_points | INTEGER NULL | Set on publish |
| UNIQUE(gameweek_id, manager_id) | | |

### `fantasy_selections`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| fantasy_team_id | UUID FK → fantasy_teams | |
| player_id | UUID FK → players | Must be in `gameweek_players` for that GW |
| is_captain | BOOLEAN DEFAULT false | Exactly one captain per team |
| UNIQUE(fantasy_team_id, player_id) | | |

### `fantasy_scores`

Denormalized standings cache (optional; can be a view instead).

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| season_id | UUID FK → seasons | |
| manager_id | UUID FK → profiles | |
| gameweek_id | UUID FK → gameweeks | |
| points | INTEGER | |
| season_total | INTEGER | Running total |
| rank | INTEGER | |
| rank_movement | INTEGER | |

### `invites`

Admin-sent **manager invite** links only. No player-only invites.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| player_id | UUID FK → players | Roster player to link on accept |
| token | TEXT UNIQUE NOT NULL | URL-safe token |
| status | TEXT | pending, accepted, expired |
| created_by | UUID FK → profiles | Admin who sent it |
| expires_at | timestamptz | |
| accepted_at | timestamptz NULL | |
| accepted_profile_id | UUID NULL FK → profiles | |
| created_at | timestamptz | |

**On accept (`/join?token=...`):**

1. Create `profiles` from auth user
2. Link `profiles.player_id` ↔ `players.profile_id`
3. Set `is_fantasy_manager = true`

### `gameweek_notifications`

Log when admin opens selection and notifies fantasy managers.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| gameweek_id | UUID FK → gameweeks | |
| sent_by | UUID FK → profiles | Admin |
| sent_at | timestamptz | |
| recipient_count | INTEGER | Fantasy managers notified |
| channel | TEXT | in_app, push, email (future) |

---

## Indexes

- `profiles(player_id)` where player_id IS NOT NULL
- `players(profile_id)` where profile_id IS NOT NULL
- `profiles(is_fantasy_manager)` where is_fantasy_manager = true
- `invites(token)` UNIQUE
- `invites(player_id, status)` where status = 'pending'
- `gameweeks(season_id, number)`
- `gameweeks(format)`
- `gameweek_players(gameweek_id)`
- `match_players(match_id, team_side)`
- `fantasy_teams(gameweek_id, manager_id)`
- `player_gameweek_stats(gameweek_id)`
- `fantasy_scores(season_id, manager_id)`
- `gameweek_notifications(gameweek_id)`

---

## Row Level Security (RLS)

### Authenticated read

- Players, gameweeks, gameweek_players, matches, stats, standings
- All managers' fantasy teams **after** deadline lock

### Manager write

- Insert/update own `fantasy_teams` and `fantasy_selections`
- Only when `is_fantasy_manager = true`
- Only when `gameweek.status = 'selection_open'` AND `now() < fantasy_deadline`
- Selected players must exist in `gameweek_players`
- **Manager need not be in `gameweek_players`**

### Admin write

- Full CRUD on players, profiles (linking), gameweeks, gameweek_players, matches, match_players
- Create/revoke invites, promote to fantasy manager
- Send gameweek notifications, open/close selection
- Stats entry, publish gameweek

---

## Validation (app layer + optional DB functions)

| Action | Rules |
|--------|-------|
| Save session | `count(gameweek_players)` = format total; balanced `match_players` per side |
| Open selection | Session complete; set status → `selection_open` |
| Submit fantasy team | Budget, squad size, captain, pool membership (`lib/fantasy/squad.ts`) |
| Publish | All session players have stats; compute points (`lib/fantasy/scoring.ts`) |

---

## Database functions (future)

- `accept_invite(token, auth_user_id)` — link profile, set manager flag
- `promote_to_fantasy_manager(profile_id)` — admin action
- `open_gameweek_selection(gameweek_id)` — validate session, set status, queue notifications
- `notify_fantasy_managers(gameweek_id)` — push/email all managers
- `publish_gameweek(gameweek_id)` — calculate fantasy points, update standings
- `validate_fantasy_selection(gameweek_id, manager_id)` — server-side squad check
- `get_format_totals(format)` — returns players_per_side, total_players

---

## Migration notes from prototype

1. **Team sides:** Rename `white`/`color` → `a`/`b` in DB; keep UI presets for White/Black vs Colours.
2. **Match scores:** Rename `team_white_score`/`team_color_score` → `team_a_score`/`team_b_score`.
3. **Format enum:** Add `8v8`, `9v9`; remove hardcoded "max 14" assumptions.
4. **Gameweek fields:** Move team names from gameweek mock object to `matches` row (created when admin saves session).
5. **Fantasy state:** Replace `localStorage` (`930-league-fantasy-team`) with `fantasy_teams` + `fantasy_selections`.

See `docs/onboarding.md` for admin UX flow.
