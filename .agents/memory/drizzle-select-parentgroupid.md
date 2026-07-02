---
name: Drizzle select must include parentGroupId
description: Every db.select() feeding buildGroupResponse in groups.ts must include groupsTable.parentGroupId or TypeScript throws TS2345.
---

`buildGroupResponse` expects `parentGroupId: number | null` in its input type. Any new `select()` that feeds this function (list groups, get group, list subgroups, etc.) must explicitly include `parentGroupId: groupsTable.parentGroupId` in the select shape.

**Why:** Drizzle infers the return type from the selected columns, so omitting a column makes it disappear from the type — TypeScript then rejects it at the call site with TS2345.

**How to apply:** When adding any new query that feeds `buildGroupResponse`, check the select shape includes `parentGroupId`.
