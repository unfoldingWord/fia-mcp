# FIA MCP Server

MCP server wrapping the FIA Project GraphQL API — exposing Bible translation internalization data as MCP tools.

## Partner: Word Collective

The FIA (Faith Internalization Audio) project is owned by Word Collective. All API access is granted on an as-needed basis.

## FIA API Reference

### What is FIA?

A Scripture internalization project (launched 2022) delivering a 6-step audio/multimedia process for every pericope (~2,893) in the Bible. 1.2M+ audio/video files across 15 languages (including ASL).

### Key Resources

- **Books** — Biblical books with translations
- **Testaments** — Old/New Testament groupings
- **Pericopes** — Scripture passage units (the core organizational unit)
- **Steps** — The 6 internalization steps per pericope
- **Step Renderings** — Audio files in multiple compressions per step
- **Media Assets** — Photos, videos, illustrations, diagrams, maps
- **Media Items** — People, places, and things referenced in Scripture
- **Translations** — Content in English + 14 additional languages
- **Languages** — Language metadata

### API Details

- **Type:** GraphQL
- **Endpoint:** `https://api.fiaproject.org/graphql`
- **Status:** Beta (subject to change/deprecation)
- **Docs:** https://api.fiaproject.org/docs/introduction/about

### Authentication

1. **Access Key** — Long-lived key, stored in `.env` as `FIA_ACCESS_KEY`
2. **Access Token** — Short-lived (15 min TTL), obtained via:
   ```
   POST https://auth.fiaproject.org/token
   Content-Type: application/json
   Body: { "token": "<ACCESS_KEY>" }
   ```
3. **Authenticated Requests** — `Authorization: Bearer <ACCESS_TOKEN>` header on all GraphQL requests

### Query Design Pattern

When querying by language, use the language node as root query — `languageId` automatically cascades to downstream fields (`bookTranslations`, `pericopeTranslations`, `stepRenderings`).

### Disclaimer

All English materials are consultant-reviewed. Non-English translations may not be. Treat all materials as drafts. Contact: info@fiaproject.org

### GraphQL Schema

Full schema reference (introspected 2026-03-11) at [`docs/graphql-schema.md`](docs/graphql-schema.md).

**Key architectural patterns:**

- Relay-style pagination (Connection/Edge/PageInfo, forward-only `first`/`after`)
- Translation pattern: entity + `*Translation` companion paired with Language
- Language is the hub — connects to all 12 translation types
- StepRendering is the richest type — text in 4 formats + audio in 4 bitrates
- 25 entity types, 50 root query fields (singular + plural for each)
- Union: `MediaAssetAttachment` = `ImageAttachment | VideoAttachment`

## Project Structure

- **Runtime:** Node.js / TypeScript
- **MCP SDK:** `@modelcontextprotocol/sdk`

## Key Files

- `docs/graphql-schema.md` — Full GraphQL schema reference

## Environment Variables

- `FIA_ACCESS_KEY` — FIA API access key (required)
