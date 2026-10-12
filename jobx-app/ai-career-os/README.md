# JobX

Evidence-based JobX MVP: **Diagnose → Match → Identify Gaps → Action Plan**.

## MVP scope (founders agreement)

In scope:
1. Auth + onboarding
2. Resume upload → Career Profile / Career Graph
3. Target role analysis
4. Job matching (explainable, deterministic scores)
5. Skill / evidence / positioning gap diagnosis
6. Personalized Action Plan

**Out of scope:** coding practice, interview simulator, recruiter platform, autonomous applications, LinkedIn automation, learning marketplace, Kubernetes/microservices.

## Stack

- Next.js (App Router) + TypeScript
- PostgreSQL + Prisma (+ pgvector-ready)
- Supabase Auth
- OpenAI-compatible AI gateway (optional for richer resume extraction)
- Docker Compose for local Postgres

## Quick start

### 1. Environment

```bash
cp .env.example .env
```

Fill in Supabase URL + anon key (and service role key for local signup without email rate limits). Optionally set `AI_API_KEY` for stronger resume → Career Graph extraction.

### 2. Database

Requires Docker Desktop (or any Postgres 16 + pgvector):

```bash
docker compose up -d
npm run db:migrate
```

Postgres is on port **5433** by default (`career` / `career`, database `ai_career_os`).

### 3. Run

```bash
npm install
npm run dev
```

Open [http://localhost:7777](http://localhost:7777).

### 4. Smoke the MVP loop

1. Sign up → onboarding (resume first)
2. Review **Career Profile / Graph**
3. Open **Opportunities** (seed jobs auto-ingest + JobMatch scoring)
4. Review **Skill Gaps** → **Action Plan**

Health check: [http://localhost:7777/api/health](http://localhost:7777/api/health)

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Next.js development server (port 7777) |
| `npm run build` / `start` | Production build & server |
| `npm run ci` | Lint + typecheck + tests + Prisma validate |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test` | Vitest unit tests |
| `npm run db:migrate` | Prisma migrate (dev) |
| `npm run db:deploy` | Prisma migrate (production) |
| `npm run jobs:ingest` | Ingest seed opportunity feed |

## Architecture

Modular monolith under `src/`:

- `app/` — routes & UI
- `components/` — shared UI
- `lib/` — db, env, supabase, utils
- `modules/` — domain services (auth, resume, matching, jobs, gaps, plans)
- `prisma/` — schema & migrations

**Product rule:** numeric match scores are computed in deterministic code (`MATCH_SCORER_VERSION=v1`). LLMs never invent scores.

## Milestones

1. **Foundation** — auth, schema, UI shell
2. **Onboarding + resume upload**
3. **Career Graph / Profile**
4. **Job ingestion + normalization**
5. **Matching + gap diagnosis**
6. **Action Plan**
7. **Polish, tests, deployment**

## Deploy

### Vercel (recommended for the Next.js app)

1. Create a Postgres database (Neon, Supabase Postgres, or Railway) with pgvector if you plan embeddings later.
2. Set env vars from `.env.example` in the Vercel project (`DATABASE_URL`, Supabase keys, `NEXT_PUBLIC_APP_URL`, optional `AI_API_KEY`).
3. Build command: `prisma generate && prisma migrate deploy && next build` (or keep `npm run build` and run `npm run db:deploy` in a release step).
4. Deploy. Point Supabase Auth redirect URLs at your production domain.

Resume files default to local disk (`RESUME_UPLOAD_DIR`). On serverless hosts, switch that path to durable storage (S3 / Supabase Storage) before relying on uploads in production.

### Docker

```bash
docker compose up -d
docker build -t jobx .
docker run --rm -p 7777:7777 --env-file .env jobx
```

Ensure `DATABASE_URL` reaches the Postgres instance from the container network.

### CI

GitHub Actions runs lint, typecheck, tests, and Prisma validate on push/PR (`.github/workflows/ci.yml`).

## Product principle

Prove: *If we understand a person's skills/evidence and compare them against real opportunities, we can identify meaningful gaps and prescribe a concrete action plan.*
