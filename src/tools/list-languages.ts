import { graphqlFetch } from '../graphql';
import type { ToolContext } from '../types';

const QUERY = `{
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
}`;

interface Result {
  languages: {
    edges: Array<{
      node: {
        id: string;
        nameEnglish: string | null;
        nameLocal: string | null;
        textDirection: string | null;
        iso6391: string | null;
      };
    }>;
  };
}

export async function listLanguages(ctx: ToolContext): Promise<string> {
  const data = await graphqlFetch<Result>(ctx, QUERY);
  const langs = data.languages.edges.map((e) => e.node);

  if (langs.length === 0) return 'No languages found.';

  const rows = langs.map(
    (l) =>
      `| ${l.id} | ${l.nameEnglish ?? ''} | ${l.nameLocal ?? ''} | ${l.textDirection ?? ''} | ${l.iso6391 ?? ''} |`
  );

  return [
    '| ID | English Name | Local Name | Direction | ISO 639-1 |',
    '|---|---|---|---|---|',
    ...rows,
  ].join('\n');
}
