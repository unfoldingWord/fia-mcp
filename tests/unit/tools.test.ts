import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ToolContext } from '../../src/types';

// Mock graphqlFetch for all tool tests
vi.mock('../../src/graphql', () => ({
  graphqlFetch: vi.fn(),
}));

import { graphqlFetch } from '../../src/graphql';
import { listLanguages } from '../../src/tools/list-languages';
import { listBooks } from '../../src/tools/list-books';
import { getPericopes } from '../../src/tools/get-pericopes';
import { getStepRenderings } from '../../src/tools/get-step-renderings';
import { getPericopeMedia } from '../../src/tools/get-pericope-media';
import { getPericopeTerms } from '../../src/tools/get-pericope-terms';

const mockFetch = vi.mocked(graphqlFetch);

function makeCtx(): ToolContext {
  return {
    env: {
      FIA_ACCESS_KEY: 'k',
      FIA_API_URL: 'u',
      FIA_AUTH_URL: 'a',
      MCP_SHARED_SECRET: 'test-secret',
      ENVIRONMENT: 'test',
    },
    callCount: 0,
  };
}

beforeEach(() => {
  mockFetch.mockReset();
});

describe('listLanguages', () => {
  it('returns markdown table of languages', async () => {
    mockFetch.mockResolvedValue({
      languages: {
        pageInfo: { hasNextPage: false },
        edges: [
          {
            node: {
              id: 'eng',
              nameEnglish: 'English',
              nameLocal: 'English',
              textDirection: 'ltr',
              iso6391: 'en',
            },
          },
          {
            node: {
              id: 'spa',
              nameEnglish: 'Spanish',
              nameLocal: 'Español',
              textDirection: 'ltr',
              iso6391: 'es',
            },
          },
        ],
      },
    });

    const result = await listLanguages(makeCtx());
    expect(result).toContain('| eng | English |');
    expect(result).toContain('| spa | Spanish |');
    expect(result).toContain('| ID | English Name |');
  });

  it('returns message when no languages', async () => {
    mockFetch.mockResolvedValue({ languages: { pageInfo: { hasNextPage: false }, edges: [] } });
    const result = await listLanguages(makeCtx());
    expect(result).toBe('No languages found.');
  });

  it('handles null fields gracefully', async () => {
    mockFetch.mockResolvedValue({
      languages: {
        pageInfo: { hasNextPage: false },
        edges: [
          {
            node: {
              id: 'xyz',
              nameEnglish: null,
              nameLocal: null,
              textDirection: null,
              iso6391: null,
            },
          },
        ],
      },
    });

    const result = await listLanguages(makeCtx());
    expect(result).toContain('| xyz |  |  |  |  |');
  });
});

describe('listBooks', () => {
  const booksData = {
    language: {
      bookTranslations: {
        pageInfo: { hasNextPage: false },
        edges: [
          {
            node: { title: 'Genesis', book: { id: 'gen', uniqueIdentifier: 'genesis', lineup: 1 } },
          },
          { node: { title: 'Mark', book: { id: 'mrk', uniqueIdentifier: 'mark', lineup: 41 } } },
          { node: { title: 'Exodus', book: { id: 'exo', uniqueIdentifier: 'exodus', lineup: 2 } } },
        ],
      },
    },
  };

  it('returns all books sorted by lineup', async () => {
    mockFetch.mockResolvedValue(booksData);
    const result = await listBooks(makeCtx(), 'eng');
    const lines = result.split('\n');
    // Table header + separator + 3 rows = 5 lines
    expect(lines).toHaveLength(5);
    // Genesis (1) should come before Exodus (2) before Mark (41)
    expect(lines[2]).toContain('gen');
    expect(lines[3]).toContain('exo');
    expect(lines[4]).toContain('mrk');
  });

  it('filters to OT only', async () => {
    mockFetch.mockResolvedValue(booksData);
    const result = await listBooks(makeCtx(), 'eng', 'ot');
    expect(result).toContain('gen');
    expect(result).toContain('exo');
    expect(result).not.toContain('mrk');
  });

  it('filters to NT only', async () => {
    mockFetch.mockResolvedValue(booksData);
    const result = await listBooks(makeCtx(), 'eng', 'nt');
    expect(result).not.toContain('gen');
    expect(result).toContain('mrk');
  });

  it('handles empty results', async () => {
    mockFetch.mockResolvedValue({
      language: { bookTranslations: { pageInfo: { hasNextPage: false }, edges: [] } },
    });
    const result = await listBooks(makeCtx(), 'xyz');
    expect(result).toBe('No books found for this language/testament.');
  });
});

describe('getPericopes', () => {
  it('returns pericope table sorted by sequence', async () => {
    mockFetch.mockResolvedValue({
      book: {
        uniqueIdentifier: 'mark',
        pericopes: {
          pageInfo: { hasNextPage: false },
          edges: [
            {
              node: {
                id: 'mrk-p2',
                pId: 'p2',
                sequence: 2,
                startChapter: 1,
                startVerse: 14,
                endChapter: 1,
                endVerse: 20,
                verseRangeShort: '1:14-20',
                verseRangeLong: '1:14-1:20',
              },
            },
            {
              node: {
                id: 'mrk-p1',
                pId: 'p1',
                sequence: 1,
                startChapter: 1,
                startVerse: 1,
                endChapter: 1,
                endVerse: 13,
                verseRangeShort: '1:1-13',
                verseRangeLong: '1:1-1:13',
              },
            },
          ],
        },
      },
    });

    const result = await getPericopes(makeCtx(), 'mrk');
    expect(result).toContain('## Pericopes for mark');
    const lines = result.split('\n');
    // Header, blank, table header, separator, 2 rows = 6 lines
    expect(lines).toHaveLength(6);
    // p1 should be before p2 (sorted by sequence)
    expect(lines[4]).toContain('mrk-p1');
    expect(lines[5]).toContain('mrk-p2');
  });

  it('handles empty pericopes', async () => {
    mockFetch.mockResolvedValue({
      book: { uniqueIdentifier: 'xyz', pericopes: { pageInfo: { hasNextPage: false }, edges: [] } },
    });
    const result = await getPericopes(makeCtx(), 'xyz');
    expect(result).toContain('No pericopes found');
  });
});

describe('getStepRenderings', () => {
  it('returns all 6 steps sorted in order', async () => {
    const steps = ['listen', 'learn', 'linger', 'live', 'love', 'lead'];
    mockFetch.mockResolvedValue({
      pericope: {
        id: 'mrk-p17',
        verseRangeLong: '4:35-4:41',
        book: { uniqueIdentifier: 'mark' },
        stepRenderings: {
          pageInfo: { hasNextPage: false },
          edges: steps.reverse().map((s) => ({
            node: {
              id: `sr-${s}`,
              textAsMarkdown: `Content for ${s}`,
              textWordCount: 100,
              audioUrlVbr4: `https://audio.example.com/${s}.mp3`,
              audioSizeVbr4: 50000,
              step: { uniqueIdentifier: s },
              stepTranslation: { title: s.charAt(0).toUpperCase() + s.slice(1) },
              language: { id: 'eng', nameEnglish: 'English' },
            },
          })),
        },
      },
    });

    const result = await getStepRenderings(makeCtx(), 'mrk-p17', 'eng');
    expect(result).toContain('## mark — 4:35-4:41');
    expect(result).toContain('**Language:** English');

    // Verify all steps present
    for (const s of ['Listen', 'Learn', 'Linger', 'Live', 'Love', 'Lead']) {
      expect(result).toContain(`### Step: ${s}`);
    }

    // Verify correct order: Listen should appear before Lead
    const listenIdx = result.indexOf('### Step: Listen');
    const leadIdx = result.indexOf('### Step: Lead');
    expect(listenIdx).toBeLessThan(leadIdx);
  });

  it('filters by languageId', async () => {
    mockFetch.mockResolvedValue({
      pericope: {
        id: 'mrk-p1',
        verseRangeLong: '1:1-1:13',
        book: { uniqueIdentifier: 'mark' },
        stepRenderings: {
          pageInfo: { hasNextPage: false },
          edges: [
            {
              node: {
                id: 'sr1',
                textAsMarkdown: 'English content',
                textWordCount: 50,
                audioUrlVbr4: null,
                audioSizeVbr4: null,
                step: { uniqueIdentifier: 'listen' },
                stepTranslation: { title: 'Listen' },
                language: { id: 'eng', nameEnglish: 'English' },
              },
            },
            {
              node: {
                id: 'sr2',
                textAsMarkdown: 'Spanish content',
                textWordCount: 60,
                audioUrlVbr4: null,
                audioSizeVbr4: null,
                step: { uniqueIdentifier: 'listen' },
                stepTranslation: { title: 'Escuchar' },
                language: { id: 'spa', nameEnglish: 'Spanish' },
              },
            },
          ],
        },
      },
    });

    const result = await getStepRenderings(makeCtx(), 'mrk-p1', 'eng');
    expect(result).toContain('English content');
    expect(result).not.toContain('Spanish content');
  });

  it('handles no renderings for language', async () => {
    mockFetch.mockResolvedValue({
      pericope: {
        id: 'mrk-p1',
        verseRangeLong: '1:1-1:13',
        book: { uniqueIdentifier: 'mark' },
        stepRenderings: { pageInfo: { hasNextPage: false }, edges: [] },
      },
    });

    const result = await getStepRenderings(makeCtx(), 'mrk-p1', 'xyz');
    expect(result).toContain('No step renderings found');
  });

  it('formats audio size correctly', async () => {
    mockFetch.mockResolvedValue({
      pericope: {
        id: 'p1',
        verseRangeLong: '1:1',
        book: { uniqueIdentifier: 'gen' },
        stepRenderings: {
          pageInfo: { hasNextPage: false },
          edges: [
            {
              node: {
                id: 'sr1',
                textAsMarkdown: 'text',
                textWordCount: 10,
                audioUrlVbr4: 'https://a.com/f.mp3',
                audioSizeVbr4: 1572864,
                step: { uniqueIdentifier: 'listen' },
                stepTranslation: { title: 'Listen' },
                language: { id: 'eng', nameEnglish: 'English' },
              },
            },
          ],
        },
      },
    });

    const result = await getStepRenderings(makeCtx(), 'p1', 'eng');
    expect(result).toContain('1.5 MB');
  });
});

describe('getPericopeMedia', () => {
  it('returns maps and media items', async () => {
    mockFetch.mockResolvedValue({
      pericope: {
        id: 'mrk-p17',
        verseRangeLong: '4:35-4:41',
        map: {
          pageInfo: { hasNextPage: false },
          edges: [
            {
              node: {
                uniqueIdentifier: 'map1',
                mapTranslations: {
                  pageInfo: { hasNextPage: false },
                  edges: [
                    {
                      node: {
                        title: 'Galilee Map',
                        imageUrl1500: 'https://img.com/map.jpg',
                        pdfUrlOriginal: 'https://img.com/map.pdf',
                        language: { id: 'eng' },
                      },
                    },
                  ],
                },
              },
            },
          ],
        },
        mediaItems: {
          pageInfo: { hasNextPage: false },
          edges: [
            {
              node: {
                uniqueIdentifier: 'boat',
                mediaItemTranslations: {
                  pageInfo: { hasNextPage: false },
                  edges: [
                    {
                      node: {
                        title: 'Boat',
                        description: 'A fishing boat',
                        language: { id: 'eng' },
                      },
                    },
                  ],
                },
                mediaAssets: {
                  pageInfo: { hasNextPage: false },
                  edges: [
                    {
                      node: {
                        assetType: { name: 'Photo' },
                        attachment: { url1500: 'https://img.com/boat.jpg' },
                      },
                    },
                  ],
                },
              },
            },
          ],
        },
      },
    });

    const result = await getPericopeMedia(makeCtx(), 'mrk-p17', 'eng');
    expect(result).toContain('## Media for pericope 4:35-4:41');
    expect(result).toContain('### Maps');
    expect(result).toContain('Galilee Map');
    expect(result).toContain('https://img.com/map.jpg');
    expect(result).toContain('### Media Items');
    expect(result).toContain('Boat');
    expect(result).toContain('Photo: https://img.com/boat.jpg');
  });

  it('handles no media', async () => {
    mockFetch.mockResolvedValue({
      pericope: {
        id: 'p1',
        verseRangeLong: '1:1',
        map: { pageInfo: { hasNextPage: false }, edges: [] },
        mediaItems: { pageInfo: { hasNextPage: false }, edges: [] },
      },
    });

    const result = await getPericopeMedia(makeCtx(), 'p1');
    expect(result).toContain('No media found');
  });

  it('filters by language when provided', async () => {
    mockFetch.mockResolvedValue({
      pericope: {
        id: 'p1',
        verseRangeLong: '1:1',
        map: {
          pageInfo: { hasNextPage: false },
          edges: [
            {
              node: {
                uniqueIdentifier: 'map1',
                mapTranslations: {
                  pageInfo: { hasNextPage: false },
                  edges: [
                    {
                      node: {
                        title: 'English Map',
                        imageUrl1500: 'e.jpg',
                        pdfUrlOriginal: null,
                        language: { id: 'eng' },
                      },
                    },
                    {
                      node: {
                        title: 'Spanish Map',
                        imageUrl1500: 's.jpg',
                        pdfUrlOriginal: null,
                        language: { id: 'spa' },
                      },
                    },
                  ],
                },
              },
            },
          ],
        },
        mediaItems: { pageInfo: { hasNextPage: false }, edges: [] },
      },
    });

    const result = await getPericopeMedia(makeCtx(), 'p1', 'eng');
    expect(result).toContain('English Map');
    expect(result).not.toContain('Spanish Map');
  });
});

describe('getPericopeTerms', () => {
  it('returns glossary entries', async () => {
    mockFetch.mockResolvedValue({
      pericope: {
        id: 'mrk-p17',
        verseRangeLong: '4:35-4:41',
        terms: {
          pageInfo: { hasNextPage: false },
          edges: [
            {
              node: {
                uniqueIdentifier: 'faith',
                termTranslations: {
                  pageInfo: { hasNextPage: false },
                  edges: [
                    {
                      node: {
                        translatedTerm: 'faith',
                        alternates: ['belief', 'trust'],
                        descriptionHint: 'trust in God',
                        textAsMarkdown: 'Full definition of faith...',
                        audioUrlVbr4: 'https://audio.com/faith.mp3',
                        language: { id: 'eng' },
                      },
                    },
                  ],
                },
              },
            },
          ],
        },
      },
    });

    const result = await getPericopeTerms(makeCtx(), 'mrk-p17', 'eng');
    expect(result).toContain('## Glossary for 4:35-4:41');
    expect(result).toContain('### faith');
    expect(result).toContain('(also: belief, trust)');
    expect(result).toContain('*trust in God*');
    expect(result).toContain('Full definition of faith...');
    expect(result).toContain('**Audio:**');
  });

  it('filters by language', async () => {
    mockFetch.mockResolvedValue({
      pericope: {
        id: 'p1',
        verseRangeLong: '1:1',
        terms: {
          pageInfo: { hasNextPage: false },
          edges: [
            {
              node: {
                uniqueIdentifier: 'term1',
                termTranslations: {
                  pageInfo: { hasNextPage: false },
                  edges: [
                    {
                      node: {
                        translatedTerm: 'English term',
                        alternates: null,
                        descriptionHint: null,
                        textAsMarkdown: null,
                        audioUrlVbr4: null,
                        language: { id: 'eng' },
                      },
                    },
                    {
                      node: {
                        translatedTerm: 'Spanish term',
                        alternates: null,
                        descriptionHint: null,
                        textAsMarkdown: null,
                        audioUrlVbr4: null,
                        language: { id: 'spa' },
                      },
                    },
                  ],
                },
              },
            },
          ],
        },
      },
    });

    const result = await getPericopeTerms(makeCtx(), 'p1', 'eng');
    expect(result).toContain('English term');
    expect(result).not.toContain('Spanish term');
  });

  it('handles no terms', async () => {
    mockFetch.mockResolvedValue({
      pericope: {
        id: 'p1',
        verseRangeLong: '1:1',
        terms: { pageInfo: { hasNextPage: false }, edges: [] },
      },
    });
    const result = await getPericopeTerms(makeCtx(), 'p1', 'eng');
    expect(result).toContain('No terms found');
  });

  it('handles no terms for specific language', async () => {
    mockFetch.mockResolvedValue({
      pericope: {
        id: 'p1',
        verseRangeLong: '1:1',
        terms: {
          pageInfo: { hasNextPage: false },
          edges: [
            {
              node: {
                uniqueIdentifier: 't1',
                termTranslations: {
                  pageInfo: { hasNextPage: false },
                  edges: [
                    {
                      node: {
                        translatedTerm: 'Spanish',
                        alternates: null,
                        descriptionHint: null,
                        textAsMarkdown: null,
                        audioUrlVbr4: null,
                        language: { id: 'spa' },
                      },
                    },
                  ],
                },
              },
            },
          ],
        },
      },
    });

    const result = await getPericopeTerms(makeCtx(), 'p1', 'eng');
    expect(result).toContain('No terms found for pericope 1:1 in language eng');
  });
});
