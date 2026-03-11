# FIA MCP Server

MCP server wrapping the [FIA Project](https://fiaproject.org) GraphQL API — exposing Bible translation internalization data as MCP tools. Deployed as a Cloudflare Worker.

## Architecture

```
bt-servant-worker  →  FIA MCP Server  →  FIA GraphQL API
   (consumer)         (this project)      (api.fiaproject.org)
```

The bt-servant-worker calls this MCP server using JSON-RPC 2.0 over HTTP. This server translates those calls into GraphQL queries against the FIA API, handling authentication transparently.

## What is FIA?

The **Faith Internalization Audio** project (launched 2022) delivers a 6-step audio/multimedia process for every pericope (~2,893) in the Bible. 1.2M+ audio/video files across 15+ languages including ASL.

### The 6 Internalization Steps

1. **Listen** — Hear the passage
2. **Learn** — Setting the stage (background, context)
3. **Linger** — Dwell on the passage
4. **Live** — Apply to daily life
5. **Love** — Share with others
6. **Lead** — Teach and disciple

## MCP Tools

### Navigation Tools

#### `fia_list_languages`

List all available languages. Use this first to discover `languageId` values.

- **Input:** none
- **Output:** Markdown table with ID, English name, local name, text direction, ISO code

#### `fia_list_books`

List Bible books available in a language.

- **Input:** `languageId` (required), `testament` (optional: `ot`/`old` or `nt`/`new`)
- **Output:** Markdown table with book ID, identifier, translated title, lineup order

#### `fia_get_pericopes`

List pericopes (Scripture passage units) for a book.

- **Input:** `bookId` (required)
- **Output:** Markdown table with pericope ID, pId, sequence, verse ranges

### Content Tools

#### `fia_get_step_renderings` — THE MAIN TOOL

Get all 6 internalization steps for a pericope in a specific language.

- **Input:** `pericopeId` (required), `languageId` (required)
- **Output:** Markdown with each step's title, word count, instructional text, and audio URL

#### `fia_get_pericope_media`

Get maps, images, and videos for a pericope.

- **Input:** `pericopeId` (required), `languageId` (optional)
- **Output:** Markdown with maps (image + PDF URLs) and media items (photos, videos, illustrations)

#### `fia_get_pericope_terms`

Get glossary/dictionary terms for a pericope.

- **Input:** `pericopeId` (required), `languageId` (required)
- **Output:** Markdown with terms, alternates, descriptions, definitions, and audio URLs

## Budget Efficiency

Every tool response includes `_meta.downstream_api_calls` with the actual count of FIA API calls made (always 1 per tool). This tells bt-servant-worker's budget tracker the real cost instead of the default 12-call estimate.

A full pericope walkthrough uses ~6 downstream API calls (one per tool).

## Authentication

### MCP Server Auth (inbound)

Callers must send a shared secret as a Bearer token:

```
Authorization: Bearer <MCP_SHARED_SECRET>
```

Set `MCP_SHARED_SECRET` as a Cloudflare secret per environment. If not set, the server runs open (useful for local dev).

### FIA API Auth (outbound)

All FIA authentication is handled internally:

1. Access key (`FIA_ACCESS_KEY`) stored as a Cloudflare secret
2. Server exchanges it for a short-lived bearer token (15-min TTL, cached for 14 min)
3. Token automatically refreshes on expiry or 401

## Environment Setup

### Local Development

```bash
npm install --legacy-peer-deps
npm run dev
```

Create `.dev.vars` with your FIA access key:

```
FIA_ACCESS_KEY=your_key_here
```

### Testing

```bash
# Test tools/list (no auth needed in local dev if MCP_SHARED_SECRET is unset)
curl -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'

# Test a tool call
curl -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"fia_list_languages","arguments":{}}}'

# With auth (required in deployed environments)
curl -X POST https://fia.mcp.servant.bible/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "Authorization: Bearer YOUR_MCP_SHARED_SECRET" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

### Environments

| Environment | Worker Name       | Deployment               |
| ----------- | ----------------- | ------------------------ |
| Production  | `fia-mcp`         | `npm run deploy`         |
| Staging     | `fia-mcp-staging` | `npm run deploy:staging` |
| Development | `fia-mcp-dev`     | `npm run deploy:dev`     |

All environments hit the same FIA API. Secrets are set per environment:

```bash
wrangler secret put FIA_ACCESS_KEY                    # prod
wrangler secret put FIA_ACCESS_KEY --env staging      # staging
wrangler secret put FIA_ACCESS_KEY --env dev          # dev
wrangler secret put MCP_SHARED_SECRET                 # prod
wrangler secret put MCP_SHARED_SECRET --env staging   # staging
wrangler secret put MCP_SHARED_SECRET --env dev       # dev
```

## Quality Gates

### Fitness Functions (ESLint)

- Max 50 lines per function
- Max 25 statements per function
- Cyclomatic complexity ≤ 10
- Max nesting depth 4
- Max 5 parameters

### Pre-commit Hook

Runs on every commit:

1. Dependency audit (production)
2. lint-staged (ESLint + Prettier)
3. Type checking (`tsc --noEmit`)
4. Architecture check (no circular deps, no cross-tool imports)
5. Tests
6. Build

### CI Pipeline

- Security audit → lint, typecheck, architecture, test, build (parallel)
- Staging auto-deploys on PR
- Production deploys via manual workflow dispatch

## Registration in bt-servant-worker

Add to `MCP_SERVERS` KV (key: `unfoldingWord`):

```json
{
  "id": "fia",
  "name": "FIA Internalization",
  "url": "https://fia.mcp.servant.bible/",
  "enabled": true,
  "priority": 2,
  "headers": {
    "Authorization": "Bearer <MCP_SHARED_SECRET>"
  }
}
```

## API Reference (JSON-RPC 2.0)

### `tools/list`

```json
{ "jsonrpc": "2.0", "id": 1, "method": "tools/list", "params": {} }
```

Returns array of 6 tool definitions with names, descriptions, and input schemas.

### `tools/call`

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "fia_get_step_renderings",
    "arguments": {
      "pericopeId": "mrk-p17",
      "languageId": "eng"
    }
  }
}
```

Returns:

```json
{
  "result": {
    "content": [{ "type": "text", "text": "## mark — 4:35-4:41\n..." }],
    "_meta": { "downstream_api_calls": 1 }
  },
  "jsonrpc": "2.0",
  "id": 2
}
```

## GraphQL Schema Reference

See [`docs/graphql-schema.md`](docs/graphql-schema.md) for the full FIA API schema.
