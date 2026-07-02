---
name: Object Storage setup
description: GCS bucket provisioned for Visagram; presigned-URL upload flow wired; Uppy React peer dep override pattern.
---

# Object Storage Setup

## What's set up
- Bucket provisioned via `setupObjectStorage()` — bucket ID in `DEFAULT_OBJECT_STORAGE_BUCKET_ID` secret.
- Server files copied from skill templates: `artifacts/api-server/src/lib/objectStorage.ts`, `objectAcl.ts`, `routes/storage.ts`.
- Client lib at `lib/object-storage-web/` (composite tsconfig, referenced from root tsconfig and visa-explorer tsconfig).
- `@workspace/object-storage-web` added to visa-explorer devDependencies.

## Uppy React peer dep override
Uppy v5 declares `react@>=19` as peer dep. The pnpm override must use a **literal version string**, not `$react`:
```json
"pnpm": {
  "overrides": {
    "react": "19.1.0",
    "react-dom": "19.1.0"
  }
}
```
`"$react"` fails with "Cannot resolve version $react in overrides".

## objectStorage.ts type fix
`response.json()` returns `unknown`. Cast explicitly:
```ts
const json = await response.json() as { signed_url: string };
return json.signed_url;
```

**Why:** TypeScript strict mode rejects property access on `unknown`.
