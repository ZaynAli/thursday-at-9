# Onboarding & weekly admin flow

> How Zain (admin) onboards the group and runs each Thursday session.

## Roles recap

| Role | How they get it |
|------|-----------------|
| **Player (roster)** | Admin creates them — no invite, no app login required |
| **Fantasy manager** | Admin sends a **manager invite link** from that player's page |
| **Admin** | Set manually (Zain) |

**Default:** Everyone in the group is just a roster player until admin sends a manager invite. Most people never need an app account.

**Key rule:** Missing a session does **not** remove fantasy manager access.

---

## Phase 1 — Build the roster

### 1. Admin creates a player

No invite link. Admin adds name + skill level → player exists in roster, available for weekly selection and stats.

```
Admin → Players → Add "Hassan" (skill 3)
  → players: { name: Hassan, profile_id: null }
  → Done. Hassan can be picked for sessions and fantasy pools.
```

### 2. Admin sends manager invite (optional, per player)

From **that player's admin page**, send a link when they should pick fantasy teams:

```
Admin → Players → Hassan → Send manager invite
  → https://thursdayat9.app/join?token=mgr_...
```

On accept:
1. Supabase Auth signup
2. Create `profiles` linked to Hassan
3. Set `is_fantasy_manager = true`

One link type only — **manager + player profile**.

### 3. No player-only invites

Player-only means **roster only** (admin-created, no app account). There is no separate signup flow for non-managers.

---

## Phase 2 — Weekly session

### 1. Select session players

Admin picks who's playing this Thursday from the roster. Count depends on format (e.g. 14 for 7v7, 18 for 9v9). Assign teams (typically **White vs Colours** or **Black vs Colours**).

### 2. Open selection & notify managers

Notify all profiles with `is_fantasy_manager = true` — including managers not playing this week.

### 3. Managers pick → lock → play → publish

Unchanged.

---

## State diagram

```
Admin creates player (roster only, no profile)
       │
       ├──► Selected for gameweek ──► fantasy pool asset
       │
       └──► [Send manager invite] ──► Profile + fantasy manager
```

---

## What NOT to require

- Roster players do **not** need profiles or invite links
- Managers do **not** need to be in this week's session to pick a team
- Player-only invite links do **not** exist

---

## Production notes

| Feature | MVP | Production |
|---------|-----|------------|
| Create player | Admin form → **saved to `players`** | ✅ Phase 4 |
| Update player (skill, active) | Admin player page → **Save** | ✅ Phase 4 |
| Manager invite | Copy link from player page → **saved to `invites`** | ✅ Phase 4 |
| Notifications | Simulated | Web push / email |

See `docs/database-schema.md`.
