import { graphqlFetch } from '../graphql';
import type { ToolContext } from '../types';
import { paginationWarning } from '../types';

const QUERY = `query GetPericopes($bookId: ID!) {
  book(id: $bookId) {
    uniqueIdentifier
    pericopes(first: 200) {
      pageInfo { hasNextPage }
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
}`;

interface Result {
  book: {
    uniqueIdentifier: string;
    pericopes: {
      pageInfo: { hasNextPage: boolean };
      edges: Array<{
        node: {
          id: string;
          pId: string;
          sequence: number;
          startChapter: number;
          startVerse: number;
          endChapter: number;
          endVerse: number;
          verseRangeShort: string | null;
          verseRangeLong: string | null;
        };
      }>;
    };
  };
}

export async function getPericopes(ctx: ToolContext, bookId: string): Promise<string> {
  const data = await graphqlFetch<Result>(ctx, QUERY, { bookId });
  const pericopes = data.book.pericopes.edges.map((e) => e.node);

  if (pericopes.length === 0) return `No pericopes found for book ${data.book.uniqueIdentifier}.`;

  // Sort by sequence
  pericopes.sort((a, b) => a.sequence - b.sequence);

  const rows = pericopes.map(
    (p) =>
      `| ${p.id} | ${p.pId} | ${p.sequence} | ${p.verseRangeShort ?? ''} | ${p.verseRangeLong ?? ''} |`
  );

  const warning = paginationWarning('pericopes', data.book.pericopes.pageInfo.hasNextPage);

  return (
    [
      `## Pericopes for ${data.book.uniqueIdentifier}`,
      '',
      '| ID | pId | Seq | Short Range | Long Range |',
      '|---|---|---|---|---|',
      ...rows,
    ].join('\n') + warning
  );
}
