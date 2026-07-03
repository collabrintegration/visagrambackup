---
name: Notifications table dev-DB drift
description: The dev DB can silently lack tables/constraints that exist in schema.ts; drizzle-kit push blocks non-interactively on unrelated pending unique constraints.
---

The `notifications` table (and other schema additions) can exist in `lib/db/src/schema.ts` but be entirely absent from the dev Postgres DB if `pnpm --filter @workspace/db run push` was never successfully run to completion.

`drizzle-kit push` (non-forced) prompts interactively ("Do you want to truncate X table?") whenever it detects a new unique constraint on a column with existing data — even for unrelated tables untouched by your current change (e.g. `users.username`, `newsletter_subscribers.email`). In this sandboxed shell there is no TTY, so the prompt throws instead of blocking, and the *entire* push aborts — including unrelated additive changes like a new table or enum values.

**Why:** This caused a real incident where `notifications` never got created in dev, so all notification-writing code silently no-opped against a nonexistent table.

**How to apply:** Before assuming `push` failures are your fault, check `\dt` / `enum_range` in the dev DB directly. If push is blocked by an unrelated pending unique constraint, verify no duplicate values exist (`SELECT col, COUNT(*) ... GROUP BY col HAVING COUNT(*) > 1`), then apply that one constraint manually via `ALTER TABLE ... ADD CONSTRAINT ... UNIQUE (...)` to unblock the interactive prompt, and re-run `push` (not `push-force`, which still hits the same TTY issue for destructive-looking changes).
