import { graphqlFetch } from '../graphql';
import type { ToolContext } from '../types';

const QUERY = `query GetPericopeTerms($pericopeId: ID!) {
  pericope(id: $pericopeId) {
    id
    verseRangeLong
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
}`;

interface TermTranslation {
  translatedTerm: string | null;
  alternates: string[] | null;
  descriptionHint: string | null;
  textAsMarkdown: string | null;
  audioUrlVbr4: string | null;
  language: { id: string };
}

interface TermNode {
  uniqueIdentifier: string;
  termTranslations: { edges: Array<{ node: TermTranslation }> };
}

interface Result {
  pericope: {
    id: string;
    verseRangeLong: string | null;
    terms: { edges: Array<{ node: TermNode }> };
  };
}

function formatTranslation(t: TermTranslation, fallbackName: string): string {
  const alts = t.alternates?.length ? ` (also: ${t.alternates.join(', ')})` : '';
  const hint = t.descriptionHint ? `\n*${t.descriptionHint}*` : '';
  const audio = t.audioUrlVbr4 ? `\n**Audio:** ${t.audioUrlVbr4}` : '';
  const body = t.textAsMarkdown ?? '';
  return `### ${t.translatedTerm ?? fallbackName}${alts}${hint}${audio}\n\n${body}`;
}

function formatTermSections(terms: TermNode[], languageId: string): string[] {
  const sections: string[] = [];
  for (const term of terms) {
    const translations = term.termTranslations.edges
      .map((e) => e.node)
      .filter((t) => t.language.id === languageId);
    for (const t of translations) {
      sections.push(formatTranslation(t, term.uniqueIdentifier));
    }
  }
  return sections;
}

export async function getPericopeTerms(
  ctx: ToolContext,
  pericopeId: string,
  languageId: string
): Promise<string> {
  const data = await graphqlFetch<Result>(ctx, QUERY, { pericopeId });
  const pericope = data.pericope;
  const label = pericope.verseRangeLong ?? pericope.id;
  const terms = pericope.terms.edges.map((e) => e.node);

  if (terms.length === 0) return `No terms found for pericope ${label}.`;

  const termSections = formatTermSections(terms, languageId);

  if (termSections.length === 0) {
    return `No terms found for pericope ${label} in language ${languageId}.`;
  }

  return [`## Glossary for ${label}`, '', ...termSections].join('\n\n');
}
