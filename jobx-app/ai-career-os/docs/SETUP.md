# JobX

## Local setup checklist

1. Copy `.env.example` → `.env`
2. Create a free [Supabase](https://supabase.com) project and set:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Install / open **Docker Desktop**, then:
   ```bash
   docker compose up -d
   npm run db:migrate
   ```
   Postgres is exposed on port **5433** (`career` / `career`, database `ai_career_os`) so it does not conflict with another local Postgres on 5432.
4. `npm run dev`
5. Verify `http://localhost:7777/api/health` returns `"database":"up"`
6. Before a PR: `npm run ci`

## Deploy (short)

- **Vercel + hosted Postgres:** set env from `.env.example`, run migrations with `npm run db:deploy`, set Supabase redirect URLs to production.
- **Docker:** `docker build -t jobx .` then run with `--env-file .env` against Compose Postgres.
- Resume storage is local filesystem for MVP — use object storage on serverless.

## Notes

- Without Supabase keys, auth forms show a configuration error; landing + UI shell still work.
- Without Docker/Postgres, Prisma Client is generated but migrations cannot be applied yet.
- Matching scores are deterministic and versioned (`MATCH_SCORER_VERSION=v1`). LLMs never invent numeric scores.
- Opportunity feed (Milestone 4): open `/app/jobs` (auto-loads seed jobs) or run:
  ```bash
  npm run jobs:ingest
  ```
  Opening `/app/jobs` or `/app/gaps` runs deterministic JobMatch scoring (`MATCH_SCORER_VERSION=v1`) and gap diagnosis when matches are missing.
  `/app/plan` builds a prioritized Action Plan (`rules-v1`) from open gaps — start / complete / dismiss items from the UI.

### Avoid "email rate limit exceeded" locally

Supabase free tier rate-limits confirmation emails. For local development:

1. In Supabase Dashboard → **Authentication → Providers → Email**, turn **Confirm email** off, **or**
2. Set `SUPABASE_SERVICE_ROLE_KEY` in `.env` — signup then creates a confirmed user without sending email.

### Enable "Continue with Google" (direct Google OAuth)

Credentials live in your app `.env` — no Supabase Google provider setup.

1. [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → create **OAuth client ID** (Web application)
2. Authorized redirect URI: `http://localhost:7777/auth/google/callback`  
   (production: `https://<your-domain>/auth/google/callback`)
3. Put in `.env`:
   ```bash
   GOOGLE_CLIENT_ID=....apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=....
   SUPABASE_SERVICE_ROLE_KEY=....   # required to create the app session after Google
   ```
4. Restart `npm run dev`
