import { graphqlFetch } from '../graphql';
import type { ToolContext } from '../types';

const QUERY = `query ListBooks($languageId: ID!) {
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
}`;

interface Result {
  language: {
    bookTranslations: {
      edges: Array<{
        node: {
          title: string | null;
          book: {
            id: string;
            uniqueIdentifier: string;
            lineup: number;
          };
        };
      }>;
    };
  };
}

export async function listBooks(
  ctx: ToolContext,
  languageId: string,
  testament?: string
): Promise<string> {
  const data = await graphqlFetch<Result>(ctx, QUERY, { languageId });
  let books = data.language.bookTranslations.edges.map((e) => e.node);

  if (testament) {
    const t = testament.toLowerCase();
    if (t === 'ot' || t === 'old') {
      books = books.filter((b) => b.book.lineup >= 1 && b.book.lineup <= 39);
    } else if (t === 'nt' || t === 'new') {
      books = books.filter((b) => b.book.lineup >= 40 && b.book.lineup <= 66);
    }
  }

  // Sort by lineup order
  books.sort((a, b) => a.book.lineup - b.book.lineup);

  if (books.length === 0) return 'No books found for this language/testament.';

  const rows = books.map(
    (b) => `| ${b.book.id} | ${b.book.uniqueIdentifier} | ${b.title ?? ''} | ${b.book.lineup} |`
  );

  return ['| ID | Identifier | Title | Lineup |', '|---|---|---|---|', ...rows].join('\n');
}
