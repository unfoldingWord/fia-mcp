import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the auth module
vi.mock('../../src/auth', () => ({
  getAccessToken: vi.fn().mockResolvedValue('mock-token'),
  invalidateToken: vi.fn(),
}));

import { graphqlFetch } from '../../src/graphql';
import { getAccessToken, invalidateToken } from '../../src/auth';
import type { ToolContext } from '../../src/types';

function makeCtx(): ToolContext {
  return {
    env: {
      FIA_ACCESS_KEY: 'test-key',
      FIA_API_URL: 'https://api.example.com/graphql',
      FIA_AUTH_URL: 'https://auth.example.com/token',
      ENVIRONMENT: 'test',
    },
    callCount: 0,
  };
}

describe('graphqlFetch', () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    vi.mocked(getAccessToken).mockResolvedValue('mock-token');
    vi.mocked(invalidateToken).mockClear();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('makes a GraphQL request and returns data', async () => {
    const mockData = { languages: { edges: [] } };
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ data: mockData }),
      })
    );

    const ctx = makeCtx();
    const result = await graphqlFetch(ctx, '{ languages { edges { node { id } } } }');

    expect(result).toEqual(mockData);
    expect(ctx.callCount).toBe(1);
  });

  it('increments callCount on each call', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: {} }),
      })
    );

    const ctx = makeCtx();
    await graphqlFetch(ctx, 'query1');
    await graphqlFetch(ctx, 'query2');
    expect(ctx.callCount).toBe(2);
  });

  it('throws on GraphQL errors', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: null,
          errors: [{ message: 'Field not found' }, { message: 'Another error' }],
        }),
      })
    );

    const ctx = makeCtx();
    await expect(graphqlFetch(ctx, 'bad query')).rejects.toThrow(
      'GraphQL errors: Field not found; Another error'
    );
    expect(ctx.callCount).toBe(1);
  });

  it('throws on HTTP error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error',
      })
    );

    const ctx = makeCtx();
    await expect(graphqlFetch(ctx, 'query')).rejects.toThrow(
      'GraphQL request failed (500): Internal Server Error'
    );
  });

  it('retries on 401 by invalidating token', async () => {
    let callNum = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(async () => {
        callNum++;
        if (callNum === 1) {
          return { ok: false, status: 401, text: async () => 'Unauthorized' };
        }
        return { ok: true, json: async () => ({ data: { ok: true } }) };
      })
    );

    const ctx = makeCtx();
    const result = await graphqlFetch(ctx, 'query');

    expect(result).toEqual({ ok: true });
    expect(invalidateToken).toHaveBeenCalled();
    expect(ctx.callCount).toBe(1);
  });

  it('throws on missing data', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({}),
      })
    );

    const ctx = makeCtx();
    await expect(graphqlFetch(ctx, 'query')).rejects.toThrow('GraphQL response missing data');
  });

  it('sends correct headers and body', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: {} }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const ctx = makeCtx();
    await graphqlFetch(ctx, '{ test }', { id: 'abc' });

    expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer mock-token',
      },
      body: JSON.stringify({ query: '{ test }', variables: { id: 'abc' } }),
    });
  });
});
