---
name: useGetBlockedUsers requires explicit queryKey
description: The Orval-generated useGetBlockedUsers hook requires a queryKey in its query options; passing only enabled causes TS2741.
---

`useGetBlockedUsers` (and possibly other parameterless generated hooks) has `queryKey` as a required field in its UseQueryOptions type. You must pass:

```ts
useGetBlockedUsers({ query: { queryKey: ["getBlockedUsers"], enabled: isAuthenticated } })
```

**Why:** Orval generates hooks where `queryKey` is required in the options object — unlike hooks with path params that derive a default key.

**How to apply:** When the TS error says `Property 'queryKey' is missing in type '{ enabled: boolean }'`, add an explicit `queryKey` array.
