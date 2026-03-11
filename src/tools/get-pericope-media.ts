import { graphqlFetch } from '../graphql';
import type { ToolContext } from '../types';
import { paginationWarning } from '../types';

const QUERY = `query GetPericopeMedia($pericopeId: ID!) {
  pericope(id: $pericopeId) {
    id
    verseRangeLong
    map(first: 50) {
      pageInfo { hasNextPage }
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
      pageInfo { hasNextPage }
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
}`;

interface MapNode {
  uniqueIdentifier: string;
  mapTranslations: {
    edges: Array<{
      node: {
        title: string | null;
        imageUrl1500: string | null;
        pdfUrlOriginal: string | null;
        language: { id: string };
      };
    }>;
  };
}

interface Attachment {
  url1500?: string;
  urlOriginal?: string;
  url720p?: string;
}

interface MediaItemNode {
  uniqueIdentifier: string;
  mediaItemTranslations: {
    edges: Array<{
      node: {
        title: string | null;
        description: string | null;
        language: { id: string };
      };
    }>;
  };
  mediaAssets: {
    edges: Array<{
      node: {
        assetType: { name: string };
        attachment: Attachment | null;
      };
    }>;
  };
}

interface Result {
  pericope: {
    id: string;
    verseRangeLong: string | null;
    map: { pageInfo: { hasNextPage: boolean }; edges: Array<{ node: MapNode }> };
    mediaItems: { pageInfo: { hasNextPage: boolean }; edges: Array<{ node: MediaItemNode }> };
  };
}

type Translatable = { language: { id: string } };

function filterByLang<T extends Translatable>(items: T[], languageId?: string): T[] {
  return languageId ? items.filter((t) => t.language.id === languageId) : items;
}

function formatMapSection(maps: MapNode[], languageId?: string): string[] {
  const lines: string[] = ['\n### Maps\n'];
  for (const m of maps) {
    const translations = filterByLang(
      m.mapTranslations.edges.map((e) => e.node),
      languageId
    );
    for (const t of translations) {
      const img = t.imageUrl1500 ? `\n  Image: ${t.imageUrl1500}` : '';
      const pdf = t.pdfUrlOriginal ? `\n  PDF: ${t.pdfUrlOriginal}` : '';
      lines.push(`- **${t.title ?? m.uniqueIdentifier}**${img}${pdf}`);
    }
  }
  return lines;
}

function formatAssetLine(a: { assetType: { name: string }; attachment: Attachment }): string {
  const att = a.attachment;
  const url = att.url1500 ?? att.url720p ?? att.urlOriginal ?? '';
  return `  - ${a.assetType.name}: ${url}`;
}

function formatMediaItemSection(items: MediaItemNode[], languageId?: string): string[] {
  const lines: string[] = ['\n### Media Items\n'];
  for (const item of items) {
    const translations = filterByLang(
      item.mediaItemTranslations.edges.map((e) => e.node),
      languageId
    );
    const title = translations[0]?.title ?? item.uniqueIdentifier;
    const desc = translations[0]?.description ? `\n  ${translations[0].description}` : '';
    const assetLines = item.mediaAssets.edges
      .map((e) => e.node)
      .filter((a): a is typeof a & { attachment: Attachment } => a.attachment !== null)
      .map(formatAssetLine);
    const assetStr = assetLines.length > 0 ? '\n' + assetLines.join('\n') : '';
    lines.push(`- **${title}**${desc}${assetStr}`);
  }
  return lines;
}

export async function getPericopeMedia(
  ctx: ToolContext,
  pericopeId: string,
  languageId?: string
): Promise<string> {
  const data = await graphqlFetch<Result>(ctx, QUERY, { pericopeId });
  const pericope = data.pericope;
  const sections: string[] = [`## Media for pericope ${pericope.verseRangeLong ?? pericope.id}`];

  const maps = pericope.map.edges.map((e) => e.node);
  if (maps.length > 0) sections.push(...formatMapSection(maps, languageId));

  const items = pericope.mediaItems.edges.map((e) => e.node);
  if (items.length > 0) sections.push(...formatMediaItemSection(items, languageId));

  if (maps.length === 0 && items.length === 0) {
    sections.push('\nNo media found for this pericope.');
  }

  const mapWarn = paginationWarning('maps', pericope.map.pageInfo.hasNextPage);
  const mediaWarn = paginationWarning('media items', pericope.mediaItems.pageInfo.hasNextPage);

  return sections.join('\n') + mapWarn + mediaWarn;
}
