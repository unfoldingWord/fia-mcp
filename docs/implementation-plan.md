# FIA MCP Server — Implementation Plan

## Context

bt-servant-worker needs to walk Bible translation teams through the FIA 6-step internalization process. The FIA Project exposes data via a GraphQL API. We're building a **thin MCP aggregation layer** over that GraphQL API — deployed as a Cloudflare Worker using the modern `agents` SDK with `createMcpHandler()`.

bt-servant-worker changes: **ZERO**. This server speaks the same MCP JSON-RPC 2.0 protocol it already consumes.

## Approach: `createMcpHandler()` from Cloudflare `agents` SDK

- Cloudflare's modern pattern for MCP servers — define tools, SDK handles the protocol
- **Must use `enableJsonResponse: true`** — bt-servant-worker reads full response body and `JSON.parse()`s it; the default SSE mode would break it
- Minimal boilerplate, Cloudflare-native, stays current with their ecosystem
- `_meta` field support is part of the MCP spec — we use it for `downstream_api_calls` budget tracking

## Project Structure

```
fia-mcp/
├── src/
│   ├── index.ts              # Worker entry: createMcpHandler + tool definitions + inbound auth
│   ├── auth.ts               # FIA token fetch + 14-min cache + promise deduplication
│   ├── graphql.ts            # Thin graphqlFetch() wrapper with call counting + 401 retry
│   ├── types.ts              # Shared types (Env, ToolContext, PageInfo) + pagination helper
│   └── tools/
│       ├── list-languages.ts
│       ├── list-books.ts
│       ├── get-pericopes.ts
│       ├── get-step-renderings.ts    # THE MAIN TOOL
│       ├── get-pericope-media.ts
│       └── get-pericope-terms.ts
├── tests/
│   ├── unit/
│   │   ├── auth.test.ts
│   │   ├── graphql.test.ts
│   │   └── tools.test.ts
│   └── e2e/
│       └── mcp-server.test.ts        # Live API tests (Linux/CI only)
├── .github/workflows/
│   ├── ci.yml                # Lint, typecheck, architecture, test, build
│   ├── deploy-dev.yml        # Auto-deploy to dev on PR pushes
│   ├── deploy-staging.yml    # Auto-deploy to staging after CI passes on main
│   └── deploy.yml            # Manual production deploy
├── .husky/pre-commit         # 6-step pre-commit gate
├── eslint.config.mjs         # Fitness functions + layer rules
├── .dependency-cruiser.js    # No circular deps, no cross-tool imports
├── vitest.config.ts          # Cloudflare Workers pool
├── package.json
├── tsconfig.json
├── wrangler.toml
└── .dev.vars                 # Local dev secrets (gitignored)
```

Each tool file exports a handler function that makes 1 GraphQL call and returns formatted markdown. No registry abstraction, no over-engineering.

## The 6 MCP Tools

Each tool = 1 GraphQL call. Total for a full pericope walkthrough: **~6 downstream calls** (vs bt-servant-worker's 120 budget).

All queries include `pageInfo { hasNextPage }` for Relay-style pagination awareness. If results are truncated, a markdown warning is appended to the response.

### Navigation

**`fia_list_languages`** — No params

```graphql
{
  languages(first: 100) {
    pageInfo {
      hasNextPage
    }
    edges {
      node {
        id
        nameEnglish
        nameLocal
        textDirection
        iso6391
      }
    }
  }
}
```

→ Markdown table of available languages

**`fia_list_books`** — `{ languageId, testament? }`

```graphql
{
  language(id: $languageId) {
    bookTranslations(first: 100) {
      pageInfo {
        hasNextPage
      }
      edges {
        node {
          title
          book {
            id
            uniqueIdentifier
            lineup
          }
        }
      }
    }
  }
}
```

→ Book list with translated titles, optionally filtered OT/NT by lineup (1-39 / 40-66). Sorted by lineup order. Returns "not found" message on invalid languageId.

**`fia_get_pericopes`** — `{ bookId }`

```graphql
{
  book(id: $bookId) {
    pericopes(first: 200) {
      pageInfo {
        hasNextPage
      }
      edges {
        node {
          id
          pId
          sequence
          startChapter
          startVerse
          endChapter
          endVerse
          verseRangeShort
          verseRangeLong
        }
      }
    }
  }
}
```

→ Pericope list with verse ranges. Sorted by sequence. Returns "not found" message on invalid bookId.

### Content

**`fia_get_step_renderings`** — `{ pericopeId, languageId }` — **THE MAIN TOOL**

```graphql
{
  pericope(id: $pericopeId) {
    id
    verseRangeLong
    book {
      uniqueIdentifier
    }
    stepRenderings(first: 100) {
      pageInfo {
        hasNextPage
      }
      edges {
        node {
          id
          textAsMarkdown
          textWordCount
          audioUrlVbr4
          audioSizeVbr4
          step {
            uniqueIdentifier
          }
          stepTranslation {
            title
          }
          language {
            id
            nameEnglish
          }
        }
      }
    }
  }
}
```

→ Over-fetches all languages (~6 steps × ~15 languages = ~90 nodes), filters by languageId client-side. Sorted by step order (listen → learn → linger → live → love → lead). This is a documented trade-off — the payload is small enough that client-side filtering is acceptable.

**`fia_get_pericope_media`** — `{ pericopeId, languageId? }`

```graphql
{
  pericope(id: $pericopeId) {
    map(first: 50) {
      pageInfo {
        hasNextPage
      }
      edges {
        node {
          uniqueIdentifier
          mapTranslations(first: 5) {
            edges {
              node {
                title
                imageUrl1500
                pdfUrlOriginal
                language {
                  id
                }
              }
            }
          }
        }
      }
    }
    mediaItems(first: 50) {
      pageInfo {
        hasNextPage
      }
      edges {
        node {
          uniqueIdentifier
          mediaItemTranslations(first: 5) {
            edges {
              node {
                title
                description
                language {
                  id
                }
              }
            }
          }
          mediaAssets(first: 10) {
            edges {
              node {
                assetType {
                  name
                }
                attachment {
                  ... on ImageAttachment {
                    url1500
                    urlOriginal
                  }
                  ... on VideoAttachment {
                    url720p
                    urlOriginal
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
```

→ Maps + images + videos for the passage. Optional language filtering. Type-aware URL selection (1500px > 720p > original).

**`fia_get_pericope_terms`** — `{ pericopeId, languageId }`

```graphql
{
  pericope(id: $pericopeId) {
    terms(first: 100) {
      pageInfo {
        hasNextPage
      }
      edges {
        node {
          uniqueIdentifier
          termTranslations(first: 20) {
            edges {
              node {
                translatedTerm
                alternates
                descriptionHint
                textAsMarkdown
                audioUrlVbr4
                language {
                  id
                }
              }
            }
          }
        }
      }
    }
  }
}
```

→ Glossary entries filtered by language. Includes alternates, description hints, full markdown definitions, and audio URLs.

## Key Implementation Details

### Shared Types (`src/types.ts`)

```typescript
interface Env {
  FIA_ACCESS_KEY: string;
  FIA_API_URL: string;
  FIA_AUTH_URL: string;
  MCP_SHARED_SECRET: string;
  ENVIRONMENT: string;
}

interface ToolContext {
  env: Env;
  callCount: number;
}
```

`paginationWarning(label, hasNextPage)` — appends a markdown warning when Relay pagination indicates truncated results.

### MCP Server Auth — Inbound (`src/index.ts`)

The FIA API key is valuable and must not be exposed to the public internet. The MCP server gates all inbound requests with a shared secret:

- Callers must send `Authorization: Bearer <secret>` on every request
- Comparison uses `crypto.subtle.timingSafeEqual` to prevent timing attacks
- If `MCP_SHARED_SECRET` is not set, the server runs open (local dev mode only)
- Returns 401 JSON error on mismatch

bt-servant-worker sends this token automatically via its `MCPServerConfig.authToken` field — no code changes were needed in bt-servant-worker.

### Tool Handler Pattern (`src/index.ts`)

- `wrapHandler(fn)` — uniform error handling and response formatting for all tools
- All responses include `_meta: { downstream_api_calls: ctx.callCount }`
- Errors become `{ isError: true, content: [{ type: 'text', text: 'Error: ...' }] }` with accurate call count
- `arg(args, name)` — extracts required arguments with clear error messages

### FIA API Auth — Outbound (`src/auth.ts`)

- Module-level `let cached: { token, expiresAt } | null` — 14-min TTL (1-min safety margin on 15-min expiry)
- **Promise deduplication** — `let pending: Promise<string> | null` prevents concurrent requests from triggering multiple token fetches. All concurrent callers share the same in-flight promise.
- `isTokenResponse()` type guard validates auth response structure at runtime (no unsafe casts)
- `invalidateToken()` clears cache on 401 — called by graphqlFetch before retry

### GraphQL Wrapper (`src/graphql.ts`)

- `graphqlFetch<T>(ctx, query, variables)` — injects bearer token, increments `ctx.callCount`
- On 401: invalidates token, increments callCount again (counts retry as 2nd call), fetches new token, retries once
- Throws descriptive errors: `GraphQL request failed (status)`, `GraphQL errors: ...`, `GraphQL response missing data`

### Response Format

Every tool returns `_meta.downstream_api_calls` with the actual count (always 1 per tool, 2 if a 401 retry occurred). This tells bt-servant-worker's budget tracker the real cost instead of the default 12-call estimate.

### Error Handling

- Auth failures: return error text in content with accurate call count
- GraphQL errors: return error text in content
- Invalid IDs (null root entity): return friendly "not found" message instead of crashing
- Never crash the worker — all errors caught by `wrapHandler`

## Quality Gates

### ESLint Fitness Functions

Enforced on every file:

- Max 50 lines per function (excluding blanks/comments)
- Max 25 statements per function
- Cyclomatic complexity ≤ 10
- Max nesting depth 4
- Max 5 parameters
- Layer rule: tool files cannot import from each other

### Architecture Checks (dependency-cruiser)

- No circular dependencies
- No cross-imports between tool modules (enforced independence)

### Pre-commit Hook (Husky)

Runs sequentially on every commit:

1. Dependency audit (production deps)
2. lint-staged (ESLint + Prettier on changed files)
3. Type checking (`tsc --noEmit`)
4. Architecture check (dependency-cruiser)
5. Tests (vitest)
6. Build (`wrangler build`)

### TypeScript Strictness

- `strict: true`
- `noUncheckedIndexedAccess: true` — forces null checks on array/object index access

## Testing

### Unit Tests

- **auth.test.ts** — Token caching, deduplication, error handling, invalidation. Uses dynamic imports to reset module state.
- **graphql.test.ts** — Mocks auth; tests headers, call counting, GraphQL errors, HTTP errors, 401 retry (callCount = 2), missing data.
- **tools.test.ts** — Mocks graphqlFetch; tests all 6 tools: table formatting, null handling, sorting, filtering (language, testament), empty results, audio size formatting, media type URL fallbacks.

### E2E Tests

- **mcp-server.test.ts** — Live API calls against real FIA API using Cloudflare Workerd sandbox
- Tests `tools/list` (6 tools with correct schemas) and `tools/call` for each tool
- Uses `mrk-p17` (Mark 4:35-41) as test pericope
- Validates `_meta.downstream_api_calls` in every response
- **Linux/CI only** — skipped on Windows due to SQLite/workerd incompatibility

### Test Runner

Vitest with `@cloudflare/vitest-pool-workers` — runs tests inside Cloudflare Workers runtime for accurate behavior.

## CI/CD Pipeline

### Continuous Integration (`ci.yml`)

Triggers on push/PR to main. Runs in parallel after security audit:

1. **security-audit** — `npm audit --omit=dev`
2. **lint** — ESLint + Prettier
3. **typecheck** — `tsc --noEmit`
4. **architecture** — dependency-cruiser
5. **test** — vitest (unit + e2e on Linux)
6. **build** — `wrangler build`

### Deployment Workflows

| Trigger           | Workflow             | Target                 |
| ----------------- | -------------------- | ---------------------- |
| PR push to main   | `deploy-dev.yml`     | `fia-mcp-dev`          |
| CI passes on main | `deploy-staging.yml` | `fia-mcp-staging`      |
| Manual dispatch   | `deploy.yml`         | `fia-mcp` (production) |

## Environments

Base config = production, with `env.staging` and `env.dev` overrides. Each gets its own worker name.

**Important:** Wrangler does not inherit top-level `[vars]` into env blocks — all vars must be explicitly duplicated in each `[env.*.vars]` section.

All three environments hit the same FIA API (there's only one). The `ENVIRONMENT` var is for logging/debugging. Each environment has its own set of secrets (access key + shared secret) set via `wrangler secret put`.

### Deployed Workers

| Environment | Worker            | URL                                         |
| ----------- | ----------------- | ------------------------------------------- |
| Production  | `fia-mcp`         | `fia-mcp.unfoldingword.workers.dev`         |
| Staging     | `fia-mcp-staging` | `fia-mcp-staging.unfoldingword.workers.dev` |
| Dev         | `fia-mcp-dev`     | `fia-mcp-dev.unfoldingword.workers.dev`     |

### npm scripts

```json
"dev": "wrangler dev",
"build": "wrangler build",
"deploy": "wrangler deploy",
"deploy:staging": "wrangler deploy --env staging",
"deploy:dev": "wrangler deploy --env dev",
"test": "vitest run",
"lint": "eslint src/ tests/",
"check": "tsc --noEmit",
"architecture": "depcruise src/ --config"
```

### Registration in bt-servant-worker

Added to `MCP_SERVERS` KV (key: `unfoldingWord`) as a JSON array alongside the existing translation-helps server. Each entry includes:

- `id` — unique server identifier
- `name` — display name
- `url` — MCP endpoint URL (pointing to the corresponding environment's worker)
- `authToken` — the MCP shared secret for that environment
- `enabled` — boolean
- `priority` — ordering (FIA = 2, translation-helps = 1)

bt-servant-worker's `buildHeaders()` automatically sends `Authorization: Bearer {authToken}` when `authToken` is set. No worker code changes were needed.

### Dependencies

```json
"dependencies": {
  "@modelcontextprotocol/sdk": "^1.26.0",
  "agents": "^0.7.6",
  "ai": "^6.0.116",
  "zod": "^3.24.2"
}
```

## Verification

1. `wrangler dev` → curl `tools/list` → 6 tools with correct schemas
2. curl `tools/call` each tool with real data (`eng`, `mrk`, `mrk-p17`)
3. Confirm `_meta.downstream_api_calls` in every response
4. Confirm 401 returned without auth token, 200 with correct token
5. All unit + e2e tests passing (31 unit, e2e in CI)
6. Pre-commit hook passes all 6 gates
7. CI pipeline green on all parallel jobs
8. Deployed to all 3 environments with secrets set
9. Registered in bt-servant-worker KV for staging and production
