---
name: Orval mutation calling convention
description: Orval-generated mutations wrap the request body in a `{ data: ... }` object, not a plain object.
---

# Orval Mutation Calling Convention

Generated mutation hooks wrap the request body in `{ data: ... }`:

```ts
// CORRECT
useCreatePhoto.mutate({ data: { countryCode: "JP", objectPath: "..." } });

// WRONG — TS2353 error
useCreatePhoto.mutate({ countryCode: "JP", objectPath: "..." });
```

For path-param-only mutations (like delete), the param is passed directly:
```ts
useDeletePhoto.mutate({ id: 42 });
```

**Why:** Orval's generated `UseMutationOptions` type for POST/PUT uses `{data: BodyType<XxxBody>}` as the variables type. This is how Orval distinguishes the body from path/query params in the mutation variables object.

**How to apply:** When a mutation TS error says "Object literal may only specify known properties, and 'X' does not exist in type '{ data: ... }'", wrap the body in `{ data: { ... } }`.
