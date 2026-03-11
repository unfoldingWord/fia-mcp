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
│   ├── index.ts              # Worker entry: createMcpHandler + tool definitions
│   ├── auth.ts               # FIA token fetch + 14-min in-memory cache
│   ├── graphql.ts            # Thin graphqlFetch() wrapper with call counting
│   └── tools/
│       ├── list-languages.ts
│       ├── list-books.ts
│       ├── get-pericopes.ts
│       ├── get-step-renderings.ts    # THE MAIN TOOL
│       ├── get-pericope-media.ts
│       └── get-pericope-terms.ts
├── package.json              # deps: agents, hono (if needed)
├── tsconfig.json
├── wrangler.toml
└── .dev.vars                 # FIA_ACCESS_KEY for local dev
```

No separate `queries/` directory, no registry abstraction, no test infrastructure beyond what's needed. Each tool file exports a handler function that makes 1 GraphQL call and returns formatted results. That's it.

## The 6 MCP Tools

Each tool = 1 GraphQL call. Total for a full pericope walkthrough: **~6 downstream calls** (vs bt-servant-worker's 120 budget).

### Navigation

**`fia_list_languages`** — No params

```graphql
{
  languages(first: 100) {
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

→ Book list with translated titles, optionally filtered OT/NT by lineup (1-39 / 40-66)

**`fia_get_pericopes`** — `{ bookId }`

```graphql
{
  book(id: $bookId) {
    pericopes(first: 200) {
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

→ Pericope list with verse ranges

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

→ Filter by languageId client-side, sort by step order. Returns all 6 steps' instructional text + audio URLs.

**`fia_get_pericope_media`** — `{ pericopeId, languageId? }`

```graphql
{
  pericope(id: $pericopeId) {
    map(first: 50) {
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

→ Maps + images + videos for the passage

**`fia_get_pericope_terms`** — `{ pericopeId, languageId }`

```graphql
{
  pericope(id: $pericopeId) {
    terms(first: 100) {
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

→ Glossary entries filtered by language

## Key Implementation Details

### Auth (`src/auth.ts`)

- Module-level `let cached: {token, expiresAt} | null`
- POST access key to `https://auth.fiaproject.org/token` → bearer token
- 14-min TTL (1-min safety margin on 15-min expiry)
- On 401: invalidate cache, retry once

### GraphQL (`src/graphql.ts`)

- `graphqlFetch<T>(ctx, query, variables)` — injects bearer token, increments `ctx.callCount`
- `ctx.callCount` feeds `_meta.downstream_api_calls` in every response
- Extracts and throws on GraphQL errors

### Response Format

Every tool returns `_meta.downstream_api_calls` with the actual count (always 1 per tool). This tells bt-servant-worker's budget tracker the real cost instead of the default 12-call estimate.

### Error Handling

- Auth failures: return error text in content, accurate call count
- GraphQL errors: return error text in content
- Never crash the worker

## Environments (Dev / Staging / Prod)

Following the same pattern as `bt-servant-admin-portal`: base config = production, with `env.staging` and `env.dev` overrides. Each gets its own worker name.

### `wrangler.toml`

```toml
name = "fia-mcp"
main = "src/index.ts"
compatibility_date = "2025-04-01"
compatibility_flags = ["nodejs_compat"]

[vars]
FIA_API_URL = "https://api.fiaproject.org/graphql"
FIA_AUTH_URL = "https://auth.fiaproject.org/token"
ENVIRONMENT = "production"

[env.staging]
name = "fia-mcp-staging"
[env.staging.vars]
ENVIRONMENT = "staging"

[env.dev]
name = "fia-mcp-dev"
[env.dev.vars]
ENVIRONMENT = "development"
```

All three environments hit the same FIA API (there's only one). The `ENVIRONMENT` var is for logging/debugging.

### Deployment

```bash
wrangler deploy              # prod  → fia-mcp
wrangler deploy --env staging # staging → fia-mcp-staging
wrangler deploy --env dev     # dev → fia-mcp-dev
```

### npm scripts

```json
"deploy": "wrangler deploy",
"deploy:staging": "wrangler deploy --env staging",
"deploy:dev": "wrangler deploy --env dev",
"dev": "wrangler dev"
```

### Registration in bt-servant-worker

Add to `MCP_SERVERS` KV (key: `unfoldingWord`) — one per environment. Each entry includes an `authToken` field that bt-servant-worker sends as `Authorization: Bearer` header.

Custom domain (`fia.mcp.servant.bible`) configured for production only.

## Verification

1. `wrangler dev` → curl `tools/list` → 6 tools with correct schemas
2. curl `tools/call` each tool with real data (`eng`, `mrk`, `mrk-p17`)
3. Confirm `_meta.downstream_api_calls` in every response
4. Deploy → register in staging KV → test via bt-servant chat
