# Habit Tracker

Local-first habit tracker with optional Supabase sync and Google sign-in.

## Run locally

1. Install dependencies:
   - `npm install`
2. Start dev server:
   - `npm run dev`

Without Supabase keys, the app runs in local-only mode and persists to localStorage.

## Optional cloud sync setup (Supabase + Google OAuth)

### 1) Create project and apply database schema

1. Create a Supabase project.
2. Open SQL Editor and run [supabase/schema.sql](supabase/schema.sql).
3. Confirm tables exist:
   - `public.habits`
   - `public.settings`

### 2) Configure Google auth in Supabase

1. In Supabase dashboard, go to Authentication -> Providers -> Google.
2. Enable Google provider.
3. In Google Cloud Console:
   - Create OAuth client (Web application).
   - Add Authorized JavaScript origin:
     - `http://localhost:5173`
   - Add Authorized redirect URI:
     - `https://<YOUR_PROJECT_REF>.supabase.co/auth/v1/callback`
4. Copy Google client ID and secret into Supabase Google provider config.

### 3) Add local environment variables

1. Copy `.env.example` to `.env`.
2. Fill these values from Supabase project settings API section:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
3. Keep `VITE_FORCE_PREVIEW_MOCKS=false` when validating real sync.

### 4) Restart app and verify

1. Restart dev server: `npm run dev`
2. Open Settings screen.
3. Click Sign In With Google.
4. Create or update a habit.
5. In Supabase table editor, verify rows are created/updated.

## Quality checks

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run check`
