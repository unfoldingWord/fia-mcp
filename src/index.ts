import { createMcpHandler } from 'agents/mcp';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { Env, ToolContext } from './types';
import { listLanguages } from './tools/list-languages';
import { listBooks } from './tools/list-books';
import { getPericopes } from './tools/get-pericopes';
import { getStepRenderings } from './tools/get-step-renderings';
import { getPericopeMedia } from './tools/get-pericope-media';
import { getPericopeTerms } from './tools/get-pericope-terms';

type ToolArgs = Record<string, string | undefined>;
type ToolHandler = (ctx: ToolContext, args: ToolArgs) => Promise<string>;

function arg(args: ToolArgs, name: string): string {
  const val = args[name]; // eslint-disable-line security/detect-object-injection
  if (!val) throw new Error(`Missing required argument: ${name}`);
  return val;
}

function wrapHandler(env: Env, handler: ToolHandler) {
  return async (args: ToolArgs) => {
    const ctx: ToolContext = { env, callCount: 0 };
    try {
      const text = await handler(ctx, args);
      return {
        content: [{ type: 'text' as const, text }],
        _meta: { downstream_api_calls: ctx.callCount },
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return {
        content: [{ type: 'text' as const, text: `Error: ${message}` }],
        _meta: { downstream_api_calls: ctx.callCount },
        isError: true,
      };
    }
  };
}

function registerNavigationTools(server: McpServer, env: Env) {
  server.registerTool(
    'fia_list_languages',
    {
      description:
        'List all available languages in the FIA project. Returns language IDs, English names, local names, text direction, and ISO codes.',
      inputSchema: {},
    },
    wrapHandler(env, async (ctx) => listLanguages(ctx))
  );

  server.registerTool(
    'fia_list_books',
    {
      description:
        "List all Bible books available in a given language. Optionally filter by testament ('ot'/'old' or 'nt'/'new').",
      inputSchema: {
        languageId: z.string().describe("Language ID (e.g. 'eng')"),
        testament: z.string().optional().describe("Filter: 'ot'/'old' or 'nt'/'new'"),
      },
    },
    wrapHandler(env, async (ctx, args) => listBooks(ctx, arg(args, 'languageId'), args.testament))
  );

  server.registerTool(
    'fia_get_pericopes',
    {
      description:
        'List all pericopes (Scripture passage units) for a Bible book. Returns pericope IDs, sequence numbers, and verse ranges.',
      inputSchema: {
        bookId: z.string().describe('Book ID from fia_list_books'),
      },
    },
    wrapHandler(env, async (ctx, args) => getPericopes(ctx, arg(args, 'bookId')))
  );
}

function registerContentTools(server: McpServer, env: Env) {
  server.registerTool(
    'fia_get_step_renderings',
    {
      description:
        'THE MAIN TOOL. Get all 6 internalization steps (Listen, Learn, Linger, Live, Love, Lead) for a pericope. Returns instructional text + audio URLs.',
      inputSchema: {
        pericopeId: z.string().describe('Pericope ID from fia_get_pericopes'),
        languageId: z.string().describe("Language ID (e.g. 'eng')"),
      },
    },
    wrapHandler(env, async (ctx, args) =>
      getStepRenderings(ctx, arg(args, 'pericopeId'), arg(args, 'languageId'))
    )
  );

  server.registerTool(
    'fia_get_pericope_media',
    {
      description:
        'Get maps, images, and videos for a pericope. Optionally filter translations by language.',
      inputSchema: {
        pericopeId: z.string().describe('Pericope ID from fia_get_pericopes'),
        languageId: z.string().optional().describe('Optional language ID to filter translations'),
      },
    },
    wrapHandler(env, async (ctx, args) =>
      getPericopeMedia(ctx, arg(args, 'pericopeId'), args.languageId)
    )
  );

  server.registerTool(
    'fia_get_pericope_terms',
    {
      description:
        'Get glossary terms for a pericope in a specific language. Returns definitions, alternates, and audio URLs.',
      inputSchema: {
        pericopeId: z.string().describe('Pericope ID from fia_get_pericopes'),
        languageId: z.string().describe("Language ID (e.g. 'eng')"),
      },
    },
    wrapHandler(env, async (ctx, args) =>
      getPericopeTerms(ctx, arg(args, 'pericopeId'), arg(args, 'languageId'))
    )
  );
}

function createServer(env: Env) {
  const server = new McpServer({ name: 'FIA Internalization', version: '1.0.0' });
  registerNavigationTools(server, env);
  registerContentTools(server, env);
  return server;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const server = createServer(env);
    return createMcpHandler(server, { enableJsonResponse: true })(request, env, ctx);
  },
};
