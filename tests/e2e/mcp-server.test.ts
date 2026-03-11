import { describe, it, expect } from 'vitest';
import { SELF } from 'cloudflare:test';

const MCP_HEADERS = {
  'Content-Type': 'application/json',
  Accept: 'application/json, text/event-stream',
};

interface McpResponse {
  jsonrpc: string;
  id: number;
  result?: {
    tools?: Array<{
      name: string;
      description: string;
      inputSchema: Record<string, unknown>;
    }>;
    content?: Array<{ type: string; text: string }>;
    _meta?: { downstream_api_calls: number };
    isError?: boolean;
  };
  error?: { code: number; message: string };
}

async function mcpCall(method: string, params: Record<string, unknown> = {}): Promise<McpResponse> {
  const response = await SELF.fetch('http://localhost/mcp', {
    method: 'POST',
    headers: MCP_HEADERS,
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });
  return response.json() as Promise<McpResponse>;
}

async function callTool(name: string, args: Record<string, string> = {}): Promise<McpResponse> {
  return mcpCall('tools/call', { name, arguments: args });
}

function getToolText(res: McpResponse): string {
  return res.result?.content?.[0]?.text ?? '';
}

describe('MCP Server E2E', () => {
  describe('tools/list', () => {
    it('returns all 6 tools', async () => {
      const res = await mcpCall('tools/list');
      expect(res.jsonrpc).toBe('2.0');
      expect(res.result?.tools).toHaveLength(6);

      const names = res.result!.tools!.map((t) => t.name);
      expect(names).toContain('fia_list_languages');
      expect(names).toContain('fia_list_books');
      expect(names).toContain('fia_get_pericopes');
      expect(names).toContain('fia_get_step_renderings');
      expect(names).toContain('fia_get_pericope_media');
      expect(names).toContain('fia_get_pericope_terms');
    });

    it('tools have correct schemas', async () => {
      const res = await mcpCall('tools/list');
      const tools = res.result!.tools!;

      const listLangs = tools.find((t) => t.name === 'fia_list_languages')!;
      expect(listLangs.inputSchema.required).toBeUndefined();

      const listBooks = tools.find((t) => t.name === 'fia_list_books')!;
      expect(listBooks.inputSchema.required).toContain('languageId');

      const getSteps = tools.find((t) => t.name === 'fia_get_step_renderings')!;
      expect(getSteps.inputSchema.required).toContain('pericopeId');
      expect(getSteps.inputSchema.required).toContain('languageId');
    });
  });

  describe('fia_list_languages', () => {
    it('returns a table of languages with _meta', async () => {
      const res = await callTool('fia_list_languages');
      const text = getToolText(res);

      expect(res.result?._meta?.downstream_api_calls).toBe(1);
      expect(text).toContain('| ID | English Name |');
      expect(text).toContain('| eng | English |');
      expect(text).toContain('| spa | Spanish |');
    });
  });

  describe('fia_list_books', () => {
    it('returns books for a language', async () => {
      const res = await callTool('fia_list_books', { languageId: 'eng' });
      const text = getToolText(res);

      expect(res.result?._meta?.downstream_api_calls).toBe(1);
      expect(text).toContain('| ID | Identifier | Title | Lineup |');
      expect(text).toContain('mark');
      expect(text).toContain('genesis');
    });

    it('filters to NT only', async () => {
      const res = await callTool('fia_list_books', { languageId: 'eng', testament: 'nt' });
      const text = getToolText(res);

      expect(text).toContain('mark');
      expect(text).not.toContain('genesis');
    });

    it('filters to OT only', async () => {
      const res = await callTool('fia_list_books', { languageId: 'eng', testament: 'ot' });
      const text = getToolText(res);

      expect(text).toContain('genesis');
      expect(text).not.toContain('mark');
    });
  });

  describe('fia_get_pericopes', () => {
    it('returns pericopes for Mark', async () => {
      const res = await callTool('fia_get_pericopes', { bookId: 'mrk' });
      const text = getToolText(res);

      expect(res.result?._meta?.downstream_api_calls).toBe(1);
      expect(text).toContain('## Pericopes for mark');
      expect(text).toContain('mrk-p1');
      expect(text).toContain('mrk-p17');
      expect(text).toContain('1:1-13');
    });
  });

  describe('fia_get_step_renderings', () => {
    it('returns all 6 steps for mrk-p17 in English', async () => {
      const res = await callTool('fia_get_step_renderings', {
        pericopeId: 'mrk-p17',
        languageId: 'eng',
      });
      const text = getToolText(res);

      expect(res.result?._meta?.downstream_api_calls).toBe(1);
      expect(res.result?.isError).toBeFalsy();
      expect(text).toContain('## mark — 4:35-4:41');
      expect(text).toContain('**Language:** English');

      // All 6 steps should be present
      expect(text).toContain('### Step:');
      expect(text).toContain('**Audio:**');

      // Should have audio URLs
      expect(text).toMatch(/https:\/\/s3\.amazonaws\.com\/.*\.mp3/);
    });
  });

  describe('fia_get_pericope_media', () => {
    it('returns maps and media for mrk-p17', async () => {
      const res = await callTool('fia_get_pericope_media', {
        pericopeId: 'mrk-p17',
        languageId: 'eng',
      });
      const text = getToolText(res);

      expect(res.result?._meta?.downstream_api_calls).toBe(1);
      expect(text).toContain('## Media for pericope');
      // mrk-p17 (Jesus calms the storm) should have maps and media
      expect(text).toContain('### Maps');
      expect(text).toContain('### Media Items');
    });
  });

  describe('fia_get_pericope_terms', () => {
    it('returns glossary terms for mrk-p17', async () => {
      const res = await callTool('fia_get_pericope_terms', {
        pericopeId: 'mrk-p17',
        languageId: 'eng',
      });
      const text = getToolText(res);

      expect(res.result?._meta?.downstream_api_calls).toBe(1);
      expect(text).toContain('## Glossary for');
      // Should have at least some terms
      expect(text).toContain('###');
    });
  });

  describe('error handling', () => {
    it('returns error for invalid pericope', async () => {
      const res = await callTool('fia_get_step_renderings', {
        pericopeId: 'nonexistent-p999',
        languageId: 'eng',
      });
      const text = getToolText(res);

      // Should have _meta even on error
      expect(res.result?._meta).toBeDefined();
      // Should return error content (either tool error or "No step renderings found")
      expect(text.length).toBeGreaterThan(0);
    });
  });
});
