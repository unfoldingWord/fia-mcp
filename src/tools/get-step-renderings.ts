import { graphqlFetch } from '../graphql';
import type { ToolContext } from '../types';

const QUERY = `query GetStepRenderings($pericopeId: ID!) {
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
}`;

interface StepRendering {
  id: string;
  textAsMarkdown: string | null;
  textWordCount: number | null;
  audioUrlVbr4: string | null;
  audioSizeVbr4: number | null;
  step: { uniqueIdentifier: string };
  stepTranslation: { title: string | null } | null;
  language: { id: string; nameEnglish: string | null };
}

interface Result {
  pericope: {
    id: string;
    verseRangeLong: string | null;
    book: { uniqueIdentifier: string };
    stepRenderings: {
      edges: Array<{ node: StepRendering }>;
    };
  };
}

// Step order for sorting
const STEP_ORDER: Record<string, number> = {
  listen: 1,
  learn: 2,
  linger: 3,
  live: 4,
  love: 5,
  lead: 6,
};

function stepSortKey(uid: string): number {
  return STEP_ORDER[uid.toLowerCase()] ?? 99;
}

export async function getStepRenderings(
  ctx: ToolContext,
  pericopeId: string,
  languageId: string
): Promise<string> {
  const data = await graphqlFetch<Result>(ctx, QUERY, { pericopeId });
  const pericope = data.pericope;

  // Filter by language
  const renderings = pericope.stepRenderings.edges
    .map((e) => e.node)
    .filter((r) => r.language.id === languageId);

  if (renderings.length === 0)
    return `No step renderings found for pericope ${pericope.id} in language ${languageId}.`;

  // Sort by step order
  renderings.sort(
    (a, b) => stepSortKey(a.step.uniqueIdentifier) - stepSortKey(b.step.uniqueIdentifier)
  );

  const header = `## ${pericope.book.uniqueIdentifier} — ${pericope.verseRangeLong ?? pericope.id}\n**Language:** ${renderings[0].language.nameEnglish ?? languageId}\n`;

  const steps = renderings.map((r) => {
    const title = r.stepTranslation?.title ?? r.step.uniqueIdentifier;
    const audio = r.audioUrlVbr4
      ? `\n**Audio:** ${r.audioUrlVbr4} (${formatBytes(r.audioSizeVbr4)})`
      : '';
    const wordCount = r.textWordCount != null ? ` (${r.textWordCount} words)` : '';

    return `### Step: ${title}${wordCount}${audio}\n\n${r.textAsMarkdown ?? '*No text available*'}`;
  });

  return [header, ...steps].join('\n\n---\n\n');
}

function formatBytes(bytes: number | null): string {
  if (bytes == null) return 'unknown size';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
