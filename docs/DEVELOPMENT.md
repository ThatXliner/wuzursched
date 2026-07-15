# Development, migrations, and deployment

## Prerequisites

- Node.js 24.x and pnpm 11.9.0, matching `package.json` and CI
- Docker running locally
- Supabase CLI (CI currently pins 2.33.5)
- Git

Run `node --version`, `pnpm --version`, `docker info`, and `supabase --version` when diagnosing setup
problems. A different Node major may install dependencies but is not a supported verification
environment.

## First local run

```bash
pnpm install
supabase start
supabase db reset
supabase status --output env | node convert_env.js > .env
pnpm run dev
```

`supabase start` launches the local services; `supabase db reset` rebuilds Postgres from every file
in `supabase/migrations/` and then runs `supabase/seed.sql`. The conversion step maps the CLI's local
credentials to SvelteKit's `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_ANON_KEY` names. The app does
not use Supabase authentication, so no local sign-in setup is required.

Open the URL printed by Vite, create a room, and submit a schedule. Supabase Studio is available at
the Studio URL printed by `supabase status` (normally `http://127.0.0.1:54323`). Stop the stack with
`supabase stop`; its Docker data persists until a reset or destructive stop.

Do not commit `.env`. Only the anonymous key belongs in `PUBLIC_*` browser variables. A Supabase
service-role key bypasses RLS and must never use a `PUBLIC_` name or be sent to the client.

## Checks and tests

With the local `.env` present:

```bash
pnpm run test:docs
pnpm run test:unit
pnpm run check
pnpm run lint
pnpm run build
pnpm test
```

- `test:docs` checks that the contributor entry points, local Markdown links, documented package
  commands, and architecture source paths remain valid.
- `test:unit` runs pure algorithm, import, realtime, formatting, and ordering tests without starting
  the app or local database.
- `check` runs Svelte and TypeScript diagnostics.
- `lint` runs Prettier in check mode followed by ESLint.
- `build` catches production bundling and SSR/client-boundary errors.
- `test` builds and previews the app, then runs Playwright. It expects the local Supabase stack and
  `.env`, like the CI test job.

If static environment imports fail during `check` or `build`, regenerate `.env` after starting
Supabase. If Playwright browsers are missing, run `pnpm exec playwright install` (or
`pnpm exec playwright install --with-deps` on a fresh Linux machine). If port 4173 is occupied, run
the suite on another preview port, for example `PLAYWRIGHT_PORT=4174 pnpm test`.

## Changing the database

Never edit an already-deployed migration. Make an additive migration, exercise it from a clean
database, and update generated types:

```bash
supabase migration new describe_the_change
# edit the new supabase/migrations/<timestamp>_describe_the_change.sql
supabase db reset
pnpm run update-types:local
git diff -- supabase/migrations src/lib/supabase.d.ts
pnpm run check
pnpm test
```

For changes made through local Studio, use `supabase db diff -f describe_the_change` to capture SQL,
then inspect the generated migration before resetting. A schema change is incomplete until its RLS
policies, grants, foreign-key behavior, Realtime publication (when needed), generated types, and
anonymous-client tests agree.

`pnpm run update-types:local` reads the running local database. `pnpm run update-types` instead
targets a linked hosted project and requires `PROJECT_ID`; local generation is the normal path for
a pull request. CI regenerates `src/lib/supabase.d.ts` from a clean migrated database and compares it
with the committed file.

## Environment and deployment

The deployed app needs exactly these public variables:

```text
PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
PUBLIC_SUPABASE_ANON_KEY=<project-anon-key>
```

To prepare a production Supabase project, authenticate the CLI, link the intended project, review
the pending migration list, and push it:

```bash
supabase login
supabase link --project-ref <project-ref>
supabase migration list
supabase db push
PROJECT_ID=<project-ref> pnpm run update-types
git diff --exit-code src/lib/supabase.d.ts
```

Review migrations before `db push`: they change shared remote state and the public RLS policies make
this database intentionally open to anonymous reads/inserts. The Realtime migration adds `classes`
and `schedules` to the publication; do not rely on dashboard-only configuration that a clean project
cannot reproduce.

The repository uses SvelteKit's adapter-auto and is configured for Vercel. Import the repository in
Vercel, set the two variables above for each intended environment, and deploy. Vercel detects the
pnpm lockfile and build command; `pnpm run build` is the local equivalent. Preview deployments that
use production Supabase can write production data, so point them at an isolated project unless that
behavior is explicitly intended.

After deployment, smoke-test room creation, schedule submission, a second browser receiving the
Realtime update, and a refresh restoring the local identity. A successful build alone does not test
RLS or Realtime configuration.

## Before opening a pull request

- Update [Architecture](./ARCHITECTURE.md) when a core flow, invariant, table, policy, identity
  shape, or algorithm changes.
- Add code comments only for invariants, security boundaries, or framework workarounds that names
  and types cannot express.
- For schema work, commit the new migration and regenerated `src/lib/supabase.d.ts` together.
- Run `pnpm run test:docs`, `pnpm run test:unit`, `pnpm run check`, `pnpm run lint`, `pnpm run build`,
  and `pnpm test` with the local Supabase stack.
- Inspect the final diff for secrets, generated local files, and unrelated formatting churn.
