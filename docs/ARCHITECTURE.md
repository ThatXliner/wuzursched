# Architecture

This guide follows the core flow from a visitor creating a room to every open browser receiving a
new schedule. It also records the data and algorithm invariants that are easy to miss when reading
individual components.

## System at a glance

Wuzursched is a SvelteKit application backed directly by Supabase Postgres. There is no Wuzursched
account or application API layer: server loads and browser components both use the public Supabase
client, and Postgres row-level security (RLS) is the authorization boundary.

| Concern                 | Source of truth                        | Main code                                                                                       |
| ----------------------- | -------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Supabase clients        | Public URL and anonymous key           | `src/hooks.server.ts`, `src/routes/+layout.ts`                                                  |
| Room creation           | `rooms` row                            | `src/routes/create/+server.ts`                                                                  |
| Initial room data       | Server load of `rooms` and `schedules` | `src/routes/room/[room=uuid]/+page.server.ts`                                                   |
| Classes and submissions | `classes` and `schedules` tables       | `src/lib/InfoInput.svelte`, `src/lib/ClassPicker.svelte`                                        |
| Browser identity        | Room-keyed `localStorage` value        | `src/routes/room/[room=uuid]/+page.svelte`                                                      |
| Live updates            | Supabase Realtime publications         | The room page, `src/lib/realtime.ts`, and `supabase/migrations/20240715235333_add_realtime.sql` |
| Comparison UI           | Same class UUID in the same period     | `ViewSchedules.svelte`, `ScheduleDisplay.svelte`, `Search.svelte`                               |

## Room lifecycle and data path

1. The landing page links to `GET /create`. The endpoint generates a UUID, inserts it into `rooms`,
   and redirects to `/room/<uuid>`.
2. The `uuid` route matcher rejects malformed room IDs before the room route runs. The server load
   verifies that the `rooms` row exists, returns 404 when PostgREST reports no row, then fetches the
   room's existing `schedules`. This server result supplies the first render.
3. On mount, the room page restores the visitor identity from `localStorage`, subscribes to changes
   on the room's `classes` and `schedules` rows, and refreshes both tables from Postgres.
4. `InfoInput.svelte` requires a student name and one distinct class UUID for each of the eight A/B
   periods. `ClassPicker.svelte` can select an existing room class or insert a normalized class.
5. The room page inserts one `schedules` row. The row stores the room and student plus eight foreign
   keys into `classes`; it does not duplicate class names or teacher data.
6. After submission, the browser writes `{ name, schedule }` under the room UUID in `localStorage`.
   The schedules list is intentionally updated by the Realtime insert event rather than by the
   submit callback, so all connected browsers—including the submitter—use the same update path.
7. Realtime inserts, updates, and deletes are applied by primary key through `src/lib/realtime.ts`.
   Schedule inserts display a toast. After the browser reconnects, the room refetches both tables
   and replays events received during that fetch, preventing stale snapshots from overwriting newer
   changes. Postgres remains the durable store.

The initial schedule query runs on the server, while class loading and all inserts happen in the
browser. When changing this split, check both SSR and browser client creation in the root layout.

## Supabase data model

The canonical schema is the ordered SQL in `supabase/migrations/`; `src/lib/supabase.d.ts` is only a
generated TypeScript view of that schema.

### `rooms`

- `id`: UUID primary key. The create endpoint supplies it so the redirect target is known without a
  follow-up query.
- `created_at`: nullable creation timestamp with a `now()` default.

### `classes`

- `id`: generated UUID primary key.
- `name`, `teacher_first`, `teacher_last`: normalized lowercase display/search fields.
- `room`: foreign key to `rooms.id`.
- A unique constraint on `(name, teacher_first, teacher_last, room)` prevents duplicate normalized
  classes inside one room.

### `schedules`

- `room` and `student` identify the submission.
- `1a` through `4b` are non-null foreign keys to `classes.id`.
- `(student, room)` is the primary key. The initial migration also has a separate unique constraint
  on `student`, which currently makes student names globally unique across rooms. Treat that as a
  deployed compatibility constraint unless a dedicated migration intentionally changes it.
- The database ensures each period references a real class, but it does **not** ensure that the
  referenced class belongs to the same room or that all eight class IDs differ. The entry form
  currently enforces distinct selections; code that bypasses the form must preserve both rules.

Foreign keys do not cascade. Deleting rooms, classes, or schedules therefore needs an explicit
order and a policy migration; the current public application exposes no deletion flow.

## Row-level security and trust model

All three tables have RLS enabled. The migrations grant the anonymous and authenticated PostgREST
roles table privileges, then narrow public access with these policies:

| Table       | Select   | Insert   | Update/Delete |
| ----------- | -------- | -------- | ------------- |
| `rooms`     | Everyone | Everyone | None          |
| `classes`   | Everyone | Everyone | None          |
| `schedules` | Everyone | Everyone | None          |

This is deliberately accountless and collaborative, not private. Anyone with the public Supabase
credentials can read all rows allowed by these policies and insert valid rows; a room URL is a
locator, not an authorization secret. Do not put private information in these tables, do not expose
the service-role key to browser code, and do not assume the UI's validation is a security boundary.
Any new mutation needs both SQL privileges and an RLS policy, with tests using the anonymous role.

`classes` and `schedules` are part of the `supabase_realtime` publication. RLS still determines
which change events a client may receive. Room subscriptions add a `room=eq.<uuid>` filter; the UUID
route matcher provides the expected input shape.

## Local identity

The app has no authenticated user identity. Each room UUID is a `localStorage` key whose value is:

```ts
{
	name: string;
	schedule: Schedule;
}
```

The temporary string `"tentative"` exists only in component state while a returning visitor picks
an existing schedule; it is never persisted. On load, the app checks that the stored student still
has a row in this room. Missing or invalidated rows clear the local value and reopen schedule entry.
"Reset who you are" also clears only this browser's room entry—it does not delete database rows.

This value is a convenience preference and can be edited by the browser owner. Never use it to
authorize a database operation. Changes to its shape need backward-compatible parsing or an
explicit migration/fallback because old values can remain in browsers indefinitely.

## Generated database types

`src/lib/supabase.d.ts` is generated from Postgres and supplies the `Database` generic to every
Supabase client. `InfoInput.d.ts` derives application-facing class row types from query results and
defines `VirtualSchedule` as the eight period-to-class-UUID fields.

Never edit `supabase.d.ts` by hand. After a migration, reset the local database and run
`pnpm run update-types:local`, then commit the migration and generated type diff together. CI
regenerates the file and rejects drift. See [Development](./DEVELOPMENT.md#changing-the-database).

## Class normalization and comparison

`normalizeClassName()` in `src/lib/utils.ts` is intentionally small and deterministic. Before
insertion it:

- lowercases and trims the name;
- collapses the final `word & word` into initials (for example, `Space & Electricity` to `se`);
- converts a trailing Roman numeral `I`, `II`, or `III` to `1`, `2`, or `3`; and
- collapses the first run of repeated whitespace.

Teacher names are separately trimmed and lowercased; spaces are removed from the teacher's last
name by the picker. Normalization is used for uniqueness and display consistency, not semantic
course equivalence. Changing it affects only new inserts unless existing rows are migrated, and can
create collisions with the database unique constraint. Add focused examples before broadening it.

Schedule comparison uses class UUID equality at the same period, not normalized text equality:

- "Only show matching" keeps a schedule if any corresponding period has the same class UUID.
- `ScheduleDisplay.svelte` highlights each corresponding matching period.
- `Search.svelte` applies every selected period/class pair (logical AND).

Consequently, two separately inserted class rows never match even if their text looks alike, and
the same class UUID in different periods does not count as shared.

## Schedule-engineering algorithm

The enabled Schedule Engineer tab is a preview tool: it computes proposed schedules and movement
instructions but never writes them to Supabase. Its algorithm lives in `src/lib/engineer.ts`, and
class UUIDs are treated as opaque identities.

Each `EngineerInput` contains a student, a `VirtualSchedule`, and optional locks. A period lock pins
the value currently in that period; a class lock pins that class to its current period. Inputs with
a duplicate class, an unknown locked period, or a lock for a missing class return `no-solution`.

The search works as follows:

1. The first selected student is the anchor. Enumerate the anchor's distinct schedule permutations
   while respecting locks; blank slots are treated as interchangeable.
2. For every friend and anchor candidate, place locked values first, then take every feasible
   class/period match with the anchor.
3. Keep each remaining class in its original free period where possible. Fill any remaining gaps in
   sorted class-ID order so ties are deterministic.
4. Rank complete proposals lexicographically by objectives: maximize the total anchor-to-friend
   shared placements, minimize the number of classes moved, then choose the stable smallest proposal
   key.
5. Return each original/proposed pair and its `{ classId, from, to }` moves. The compatibility helper
   `findOptimumSchedules()` delegates to this engine and returns only proposed schedules.

Important limitations: the engineer does not model which periods a course is actually offered,
travel time, teacher approval, or preferences; only anchor-to-friend matches are scored; and anchor
permutation enumeration grows factorially with the number of movable classes. Incomplete schedules
are accepted, with blank periods available for moved classes.

## Where to make a core change

- Room existence or initial queries: `src/routes/room/[room=uuid]/+page.server.ts`
- Submission, browser identity, or Realtime: `src/routes/room/[room=uuid]/+page.svelte`
- Schedule validation and period shape: `src/lib/InfoInput.svelte` and `src/lib/InfoInput.d.ts`
- Class creation/selection: `src/lib/ClassPicker.svelte` and `normalizeClassName()` in
  `src/lib/utils.ts`
- Display comparison: the room's `ViewSchedules.svelte`, `ScheduleDisplay.svelte`, and
  `Search.svelte`
- Schema, privileges, RLS, or Realtime publication: a new file in `supabase/migrations/`

Before changing a flow, trace it through the UI, Supabase operation, RLS policy, Realtime event, and
generated type. The [development checklist](./DEVELOPMENT.md#before-opening-a-pull-request) turns
that trace into concrete verification steps.
