---
name: Drizzle array membership queries
description: Prefer inArray() over raw sql`col = ANY(${array})` for WHERE-clause array membership in Drizzle ORM.
---

Use `inArray(column, values)` (or `inArray(sql\`lower(${col})\`, values)` when applying a function to the column) for "is this value in this array" WHERE clauses, not a hand-written `sql\`${col} = ANY(${array})\`` template.

**Why:** The raw `ANY(${array})` template caused intermittent 500s in production-path code (mention-resolution query matching usernames against a JS array) that `inArray()` did not reproduce. Drizzle's `sql` tag doesn't reliably bind JS arrays as Postgres array parameters in all query shapes — `inArray()` is the tested, idiomatic path for this.

**How to apply:** Any time you're tempted to write `sql\`... = ANY(${jsArray})\`` in a Drizzle `.where()`, use `inArray()` instead, wrapping the column expression in `sql\`...\`` only if you need to transform it (e.g. `lower()`).
