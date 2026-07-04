# Turning on the real backend (Supabase)

BuildView runs in two modes:

- **Sandbox (default)** — everything in the browser's localStorage. The demo
  button and the fake user picker. No setup needed; this is what runs when no
  remote is configured.
- **Remote** — real accounts (email + password) and a shared Postgres database
  with live sync between devices. Local-first: writes apply instantly, queue
  while offline, and push when connectivity returns.

## One-time setup (~5 minutes)

1. Create a free project at https://supabase.com (any name, any region).
2. In the project: **SQL Editor → New query**, paste the whole of
   `schema.sql` from this folder, **Run**.
3. (Recommended for demos) **Authentication → Sign In / Up → Email**: turn OFF
   "Confirm email" so sign-ups work instantly without an inbox round-trip.
4. Grab the two public values from **Project Settings → API**:
   - Project URL → `VITE_SUPABASE_URL`
   - `anon` public key → `VITE_SUPABASE_ANON_KEY`

### Local dev
Create `buildview/.env.local`:
```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```
`npm run dev` — the Login screen now shows a **Team account** panel.

### Deployed site (GitHub Pages)
Add the same two values as **repository Variables** (Settings → Secrets and
variables → Actions → Variables tab): `VITE_SUPABASE_URL` and
`VITE_SUPABASE_ANON_KEY`, then re-run the deploy workflow. The anon key is
public by design — Row Level Security protects the data.

## What you get

- Sign up as a foreman on your laptop, create a project, note the invite code.
- Sign up as a worker on your phone, join with the code, get granted access —
  tasks, photos and issues sync live between both devices.
- The header shows sync state: green **Synced**, amber **Offline — will sync**
  (writes queued durably), blue **Syncing…**.
- The demo/sandbox stays available on the Login screen and never touches the
  shared database.

## Current limitations (deliberate MVP scope)

- All authenticated users share read/write access at the database level;
  the app's permission rules (section 3) do the gating. Per-project RLS
  policies are the next hardening step before real production use.
- Photos are stored as base64 inside rows (2 MB guard) — moving them to
  Supabase Storage buckets is future work.
- Conflicts resolve last-write-wins by `updatedAt`.
