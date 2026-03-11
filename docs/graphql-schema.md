# FIA Project API — GraphQL Schema Reference

Introspected on 2026-03-11 from `https://api.fiaproject.org/graphql`.

> Note: Filter/sort input field internals and enum values were not captured in this introspection. A deeper query is needed for those.

---

## Root Query Fields

Every entity follows a consistent pattern: **singular** (by ID) and **plural** (paginated connection with filter/sort).

| Field                     | Return Type                        | Arguments                                                                                                       |
| ------------------------- | ---------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `assetType`               | `AssetType`                        | `id: ID!`                                                                                                       |
| `assetTypes`              | `AssetTypeConnection`              | `first: Int, after: String, filter: AssetTypeFilterNodes, sort: [AssetTypeSortNodes]`                           |
| `book`                    | `Book`                             | `id: ID!`                                                                                                       |
| `books`                   | `BookConnection`                   | `first: Int, after: String, filter: BookFilterNodes, sort: [BookSortNodes]`                                     |
| `bookTranslation`         | `BookTranslation`                  | `id: ID!`                                                                                                       |
| `bookTranslations`        | `BookTranslationConnection`        | `first: Int, after: String, filter: BookTranslationFilterNodes, sort: [BookTranslationSortNodes]`               |
| `language`                | `Language`                         | `id: ID!`                                                                                                       |
| `languages`               | `LanguageConnection`               | `first: Int, after: String, filter: LanguageFilterNodes, sort: [LanguageSortNodes]`                             |
| `map`                     | `Map`                              | `id: ID!`                                                                                                       |
| `maps`                    | `MapConnection`                    | `first: Int, after: String, filter: MapFilterNodes, sort: [MapSortNodes]`                                       |
| `mapTranslation`          | `MapTranslation`                   | `id: ID!`                                                                                                       |
| `mapTranslations`         | `MapTranslationConnection`         | `first: Int, after: String, filter: MapTranslationFilterNodes, sort: [MapTranslationSortNodes]`                 |
| `mapFeature`              | `MapFeature`                       | `id: ID!`                                                                                                       |
| `mapFeatures`             | `MapFeatureConnection`             | `first: Int, after: String, filter: MapFeatureFilterNodes, sort: [MapFeatureSortNodes]`                         |
| `mapFeatureTranslation`   | `MapFeatureTranslation`            | `id: ID!`                                                                                                       |
| `mapFeatureTranslations`  | `MapFeatureTranslationConnection`  | `first: Int, after: String, filter: MapFeatureTranslationFilterNodes, sort: [MapFeatureTranslationSortNodes]`   |
| `mediaAsset`              | `MediaAsset`                       | `id: ID!`                                                                                                       |
| `mediaAssets`             | `MediaAssetConnection`             | `first: Int, after: String, filter: MediaAssetFilterNodes, sort: [MediaAssetSortNodes]`                         |
| `mediaAssetTranslation`   | `MediaAssetTranslation`            | `id: ID!`                                                                                                       |
| `mediaAssetTranslations`  | `MediaAssetTranslationConnection`  | `first: Int, after: String, filter: MediaAssetTranslationFilterNodes, sort: [MediaAssetTranslationSortNodes]`   |
| `mediaItem`               | `MediaItem`                        | `id: ID!`                                                                                                       |
| `mediaItems`              | `MediaItemConnection`              | `first: Int, after: String, filter: MediaItemFilterNodes, sort: [MediaItemSortNodes]`                           |
| `mediaItemTranslation`    | `MediaItemTranslation`             | `id: ID!`                                                                                                       |
| `mediaItemTranslations`   | `MediaItemTranslationConnection`   | `first: Int, after: String, filter: MediaItemTranslationFilterNodes, sort: [MediaItemTranslationSortNodes]`     |
| `pericope`                | `Pericope`                         | `id: ID!`                                                                                                       |
| `pericopes`               | `PericopeConnection`               | `first: Int, after: String, filter: PericopeFilterNodes, sort: [PericopeSortNodes]`                             |
| `pericopeTranslation`     | `PericopeTranslation`              | `id: ID!`                                                                                                       |
| `pericopeTranslations`    | `PericopeTranslationConnection`    | `first: Int, after: String, filter: PericopeTranslationFilterNodes, sort: [PericopeTranslationSortNodes]`       |
| `placeholder`             | `Placeholder`                      | `id: ID!`                                                                                                       |
| `placeholders`            | `PlaceholderConnection`            | `first: Int, after: String, filter: PlaceholderFilterNodes, sort: [PlaceholderSortNodes]`                       |
| `placeholderTranslation`  | `PlaceholderTranslation`           | `id: ID!`                                                                                                       |
| `placeholderTranslations` | `PlaceholderTranslationConnection` | `first: Int, after: String, filter: PlaceholderTranslationFilterNodes, sort: [PlaceholderTranslationSortNodes]` |
| `policy`                  | `Policy`                           | `id: ID!`                                                                                                       |
| `policies`                | `PolicyConnection`                 | `first: Int, after: String, filter: PolicyFilterNodes, sort: [PolicySortNodes]`                                 |
| `policyTranslation`       | `PolicyTranslation`                | `id: ID!`                                                                                                       |
| `policyTranslations`      | `PolicyTranslationConnection`      | `first: Int, after: String, filter: PolicyTranslationFilterNodes`                                               |
| `step`                    | `Step`                             | `id: ID!`                                                                                                       |
| `steps`                   | `StepConnection`                   | `first: Int, after: String, filter: StepFilterNodes, sort: [StepSortNodes]`                                     |
| `stepTranslation`         | `StepTranslation`                  | `id: ID!`                                                                                                       |
| `stepTranslations`        | `StepTranslationConnection`        | `first: Int, after: String, filter: StepTranslationFilterNodes, sort: [StepTranslationSortNodes]`               |
| `stepRendering`           | `StepRendering`                    | `id: ID!`                                                                                                       |
| `stepRenderings`          | `StepRenderingConnection`          | `first: Int, after: String, filter: StepRenderingFilterNodes, sort: [StepRenderingSortNodes]`                   |
| `term`                    | `Term`                             | `id: ID!`                                                                                                       |
| `terms`                   | `TermConnection`                   | `first: Int, after: String, filter: TermFilterNodes, sort: [TermSortNodes]`                                     |
| `termTranslation`         | `TermTranslation`                  | `id: ID!`                                                                                                       |
| `termTranslations`        | `TermTranslationConnection`        | `first: Int, after: String, filter: TermTranslationFilterNodes, sort: [TermTranslationSortNodes]`               |
| `testament`               | `Testament`                        | `id: ID!`                                                                                                       |
| `testaments`              | `TestamentConnection`              | `first: Int, after: String, filter: TestamentFilterNodes, sort: [TestamentSortNodes]`                           |
| `testamentTranslation`    | `TestamentTranslation`             | `id: ID!`                                                                                                       |
| `testamentTranslations`   | `TestamentTranslationConnection`   | `first: Int, after: String, filter: TestamentTranslationFilterNodes, sort: [TestamentTranslationSortNodes]`     |

**50 query fields** (25 singular + 25 plural)

---

## OBJECT Types

### PageInfo (shared)

| Field             | Type       |
| ----------------- | ---------- |
| `hasNextPage`     | `Boolean!` |
| `hasPreviousPage` | `Boolean!` |
| `startCursor`     | `String`   |
| `endCursor`       | `String`   |

All collections use Relay-style Connection/Edge pagination.

---

### AssetType

| Field              | Type                   |
| ------------------ | ---------------------- |
| `id`               | `ID!`                  |
| `name`             | `String!`              |
| `maps(...)`        | `MapConnection`        |
| `mediaItems(...)`  | `MediaItemConnection`  |
| `mediaAssets(...)` | `MediaAssetConnection` |

---

### Book

| Field                       | Type                            |
| --------------------------- | ------------------------------- |
| `id`                        | `ID!`                           |
| `uniqueIdentifier`          | `String!`                       |
| `lineup`                    | `Int!`                          |
| `bookTranslations(...)`     | `BookTranslationConnection`     |
| `pericopes(...)`            | `PericopeConnection`            |
| `pericopeTranslations(...)` | `PericopeTranslationConnection` |

### BookTranslation

| Field                        | Type                             |
| ---------------------------- | -------------------------------- |
| `id`                         | `ID!`                            |
| `title`                      | `String`                         |
| `book`                       | `Book`                           |
| `language`                   | `Language`                       |
| `pericopeTranslations(...)`  | `PericopeTranslationConnection`  |
| `testamentTranslations(...)` | `TestamentTranslationConnection` |
| `stepRenderings(...)`        | `StepRenderingConnection`        |

---

### Language

| Field                          | Type                               |
| ------------------------------ | ---------------------------------- |
| `id`                           | `String!`                          |
| `nameEnglish`                  | `String`                           |
| `nameLocal`                    | `String`                           |
| `textDirection`                | `String`                           |
| `iso6391`                      | `String`                           |
| `bookTranslations(...)`        | `BookTranslationConnection`        |
| `mapTranslations(...)`         | `MapTranslationConnection`         |
| `mapFeatureTranslations(...)`  | `MapFeatureTranslationConnection`  |
| `mediaItemTranslations(...)`   | `MediaItemTranslationConnection`   |
| `mediaAssetTranslations(...)`  | `MediaAssetTranslationConnection`  |
| `pericopeTranslations(...)`    | `PericopeTranslationConnection`    |
| `placeholderTranslations(...)` | `PlaceholderTranslationConnection` |
| `policyTranslations(...)`      | `PolicyTranslationConnection`      |
| `stepTranslations(...)`        | `StepTranslationConnection`        |
| `stepRenderings(...)`          | `StepRenderingConnection`          |
| `termTranslations(...)`        | `TermTranslationConnection`        |
| `testamentTranslations(...)`   | `TestamentTranslationConnection`   |

Language is the central hub — connects to every translation type.

---

### Map

| Field                  | Type                       |
| ---------------------- | -------------------------- |
| `id`                   | `ID!`                      |
| `uniqueIdentifier`     | `String!`                  |
| `assetType`            | `AssetType`                |
| `mapTranslations(...)` | `MapTranslationConnection` |
| `pericopes(...)`       | `PericopeConnection`       |

### MapTranslation

| Field                                    | Type           |
| ---------------------------------------- | -------------- |
| `id`                                     | `ID!`          |
| `title`                                  | `String`       |
| `dateCompleteText`                       | `String`       |
| `pdfUrlOriginal`                         | `String`       |
| `pdfSizeOriginal`                        | `Int`          |
| `imageUrlOriginal / imageSizeOriginal`   | `String / Int` |
| `imageUrl100..3000 / imageSize100..3000` | `String / Int` |
| `versionNumberShort`                     | `String!`      |
| `versionNumberLong`                      | `String!`      |
| `versionMajor/Minor/Patch/Total`         | `Int!`         |
| `language`                               | `Language`     |
| `map`                                    | `Map`          |

---

### MapFeature

| Field                         | Type                              |
| ----------------------------- | --------------------------------- |
| `id`                          | `ID!`                             |
| `uniqueIdentifier`            | `String!`                         |
| `maps(...)`                   | `MapConnection`                   |
| `mapFeatureTranslations(...)` | `MapFeatureTranslationConnection` |

### MapFeatureTranslation

| Field              | Type              |
| ------------------ | ----------------- |
| `id`               | `ID!`             |
| `name`             | `String`          |
| `dateCompleteText` | `String`          |
| `versionNumber*`   | versioning fields |
| `language`         | `Language`        |
| `mapFeature`       | `MapFeature`      |

### MapFeatureType

| Field              | Type                   |
| ------------------ | ---------------------- |
| `id`               | `ID!`                  |
| `name`             | `String`               |
| `mapFeatures(...)` | `MapFeatureConnection` |

> Note: No root query for MapFeatureType — only reachable through relationships.

---

### MediaAsset

| Field                         | Type                              |
| ----------------------------- | --------------------------------- |
| `id`                          | `ID!`                             |
| `aId`                         | `String!`                         |
| `dateCompleteAsset`           | `String`                          |
| `uniqueIdentifier`            | `String!`                         |
| `assetType`                   | `AssetType!`                      |
| `attachment`                  | `MediaAssetAttachment` (union)    |
| `mediaItems(...)`             | `MediaItemConnection`             |
| `mediaAssetTranslations(...)` | `MediaAssetTranslationConnection` |

### ImageAttachment (union member of MediaAssetAttachment)

Multiple resolution URLs: `urlOriginal`, `url3000`, `url2500`, `url2000`, `url1500`, `url1000`, `url500`, `url250`, `url100` with corresponding sizes.

### VideoAttachment (union member of MediaAssetAttachment)

Multiple resolution URLs: `urlOriginal`, `url4k`, `url1080p`, `url720p`, `url480p` with corresponding sizes.

### MediaAssetTranslation

| Field              | Type              |
| ------------------ | ----------------- |
| `id`               | `ID!`             |
| `title`            | `String`          |
| `description`      | `String`          |
| `dateCompleteText` | `String`          |
| `versionNumber*`   | versioning fields |
| `language`         | `Language`        |
| `mediaAsset`       | `MediaAsset`      |

---

### MediaItem

| Field                        | Type                             |
| ---------------------------- | -------------------------------- |
| `id`                         | `ID!`                            |
| `uniqueIdentifier`           | `String!`                        |
| `mediaAssets(...)`           | `MediaAssetConnection`           |
| `mediaItemTranslations(...)` | `MediaItemTranslationConnection` |
| `pericopes(...)`             | `PericopeConnection`             |
| `terms(...)`                 | `TermConnection`                 |

### MediaItemTranslation

| Field              | Type              |
| ------------------ | ----------------- |
| `id`               | `ID!`             |
| `title`            | `String`          |
| `description`      | `String`          |
| `dateCompleteText` | `String`          |
| `versionNumber*`   | versioning fields |
| `mediaItem`        | `MediaItem`       |
| `language`         | `Language`        |

---

### Pericope (core unit — a scripture passage)

| Field                       | Type                            |
| --------------------------- | ------------------------------- |
| `id`                        | `ID!`                           |
| `pId`                       | `String!`                       |
| `sequence`                  | `Int!`                          |
| `split`                     | `String`                        |
| `startChapter`              | `Int!`                          |
| `startVerse`                | `Int!`                          |
| `startPortion`              | `String`                        |
| `endChapter`                | `Int!`                          |
| `endVerse`                  | `Int!`                          |
| `endPortion`                | `String`                        |
| `verseRangeShort`           | `String`                        |
| `verseRangeLong`            | `String`                        |
| `verseRangeShortRtl`        | `String`                        |
| `verseRangeLongRtl`         | `String`                        |
| `book`                      | `Book!`                         |
| `map(...)`                  | `MapConnection`                 |
| `mediaItems(...)`           | `MediaItemConnection`           |
| `pericopeTranslations(...)` | `PericopeTranslationConnection` |
| `stepRenderings(...)`       | `StepRenderingConnection`       |
| `terms(...)`                | `TermConnection`                |

### PericopeTranslation

| Field                   | Type                      |
| ----------------------- | ------------------------- |
| `id`                    | `ID!`                     |
| `vId`                   | `String!`                 |
| `versionNumber*`        | versioning fields         |
| `dateCompleteScript1/2` | `String`                  |
| `dateCompleteAudio1/2`  | `String`                  |
| `dateCompleteFull1/2`   | `String`                  |
| `dateDiscontinued`      | `String`                  |
| `book`                  | `Book!`                   |
| `bookTranslation`       | `BookTranslation!`        |
| `language`              | `Language!`               |
| `pericope`              | `Pericope!`               |
| `stepRenderings(...)`   | `StepRenderingConnection` |

---

### Placeholder

| Field                          | Type                               |
| ------------------------------ | ---------------------------------- |
| `id`                           | `ID!`                              |
| `xId`                          | `String!`                          |
| `placeholderTranslations(...)` | `PlaceholderTranslationConnection` |

### PlaceholderTranslation

| Field         | Type          |
| ------------- | ------------- |
| `id`          | `ID!`         |
| `item`        | `String`      |
| `language`    | `Language`    |
| `placeholder` | `Placeholder` |

---

### Policy

| Field                     | Type                          |
| ------------------------- | ----------------------------- |
| `id`                      | `ID!`                         |
| `uniqueIdentifier`        | `String!`                     |
| `canonicalName`           | `String!`                     |
| `policyTranslations(...)` | `PolicyTranslationConnection` |

### PolicyTranslation

| Field            | Type       |
| ---------------- | ---------- |
| `id`             | `ID!`      |
| `textAsJson`     | `String`   |
| `textAsMarkdown` | `String`   |
| `textAsHtml`     | `String`   |
| `textPlain`      | `String`   |
| `language`       | `Language` |
| `policy`         | `Policy`   |

---

### Step

| Field                   | Type                        |
| ----------------------- | --------------------------- |
| `id`                    | `ID!`                       |
| `uniqueIdentifier`      | `String!`                   |
| `stepTranslations(...)` | `StepTranslationConnection` |
| `stepRenderings(...)`   | `StepRenderingConnection`   |

### StepTranslation

| Field                 | Type                      |
| --------------------- | ------------------------- |
| `id`                  | `ID!`                     |
| `title`               | `String`                  |
| `step`                | `Step`                    |
| `language`            | `Language`                |
| `stepRenderings(...)` | `StepRenderingConnection` |

### StepRendering (the richest content type — actual rendered Bible content)

| Field                 | Type                  |
| --------------------- | --------------------- |
| `id`                  | `ID!`                 |
| `textAsJson`          | `String`              |
| `textAsMarkdown`      | `String`              |
| `textAsHtml`          | `String`              |
| `textPlain`           | `String`              |
| `textWordCount`       | `Int`                 |
| `audioUrlCbr32`       | `String`              |
| `audioUrlVbr0`        | `String`              |
| `audioUrlVbr4`        | `String`              |
| `audioUrlVbr6`        | `String`              |
| `audioSizeCbr32`      | `Int`                 |
| `audioSizeVbr0`       | `Int`                 |
| `audioSizeVbr4`       | `Int`                 |
| `audioSizeVbr6`       | `Int`                 |
| `versionNumber*`      | versioning fields     |
| `book`                | `Book`                |
| `bookTranslation`     | `BookTranslation`     |
| `language`            | `Language`            |
| `pericope`            | `Pericope`            |
| `pericopeTranslation` | `PericopeTranslation` |
| `step`                | `Step`                |
| `stepTranslation`     | `StepTranslation`     |

---

### Term (glossary/dictionary)

| Field                   | Type                        |
| ----------------------- | --------------------------- |
| `id`                    | `ID!`                       |
| `uniqueIdentifier`      | `String`                    |
| `mediaItem`             | `MediaItem`                 |
| `books(...)`            | `BookConnection`            |
| `pericopes(...)`        | `PericopeConnection`        |
| `termTranslations(...)` | `TermTranslationConnection` |

### TermTranslation

| Field                            | Type              |
| -------------------------------- | ----------------- |
| `id`                             | `ID!`             |
| `translatedTerm`                 | `String`          |
| `alternates`                     | `[String]`        |
| `descriptionHint`                | `String`          |
| `textAsJson/Html/Plain/Markdown` | `String`          |
| `textWordCount`                  | `Int`             |
| `textCharacterCount`             | `Int`             |
| `audioUrl*`                      | multiple bitrates |
| `audioSize*`                     | multiple bitrates |
| `versionNumber*`                 | versioning fields |
| `dateCompleteText`               | `String`          |
| `dateCompleteAudio`              | `String`          |
| `language`                       | `Language`        |
| `term`                           | `Term`            |

---

### Testament

| Field                        | Type                             |
| ---------------------------- | -------------------------------- |
| `id`                         | `ID!`                            |
| `lineup`                     | `Int!`                           |
| `testamentTranslations(...)` | `TestamentTranslationConnection` |

### TestamentTranslation

| Field       | Type        |
| ----------- | ----------- |
| `id`        | `ID!`       |
| `title`     | `String`    |
| `language`  | `Language`  |
| `testament` | `Testament` |

---

## Architectural Observations

1. **Relay-style pagination** — all collections use Connection/Edge/PageInfo. Forward-only (`first`/`after`).
2. **Translation pattern** — most entities have a `*Translation` companion pairing entity + Language. Entity = language-agnostic; Translation = localized.
3. **Language is the hub** — connects to every translation type (12 connections).
4. **StepRendering is the richest type** — text in 4 formats + audio in 4 bitrates + links to Book, Pericope, Step and their translations.
5. **Versioning is pervasive** — most translations carry `versionMajor/Minor/Patch/Total` + short/long version strings.
6. **Union type** — `MediaAssetAttachment` = `ImageAttachment | VideoAttachment` with resolution-specific URLs.
7. **No root query for MapFeatureType** — only reachable through relationships.
