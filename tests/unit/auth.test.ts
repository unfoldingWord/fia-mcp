import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// We need to test the auth module's caching and error handling.
// Since it uses module-level state, we re-import fresh for each test.
describe('auth', () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    vi.unstubAllGlobals();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('fetches a new token on first call', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ access_token: 'tok-123' }),
    });
    vi.stubGlobal('fetch', mockFetch);

    // Dynamic import to get fresh module state
    const { getAccessToken, invalidateToken } = await import('../../src/auth');
    invalidateToken(); // Clear any cached token

    const token = await getAccessToken('my-key', 'https://auth.example.com/token');
    expect(token).toBe('tok-123');
    expect(mockFetch).toHaveBeenCalledOnce();
    expect(mockFetch).toHaveBeenCalledWith('https://auth.example.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: 'my-key' }),
    });
  });

  it('returns cached token on subsequent calls', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ access_token: 'tok-cached' }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const { getAccessToken, invalidateToken } = await import('../../src/auth');
    invalidateToken();

    await getAccessToken('key', 'https://auth.example.com/token');
    const second = await getAccessToken('key', 'https://auth.example.com/token');

    expect(second).toBe('tok-cached');
    expect(mockFetch).toHaveBeenCalledOnce(); // Only one fetch, second was cached
  });

  it('throws on auth failure', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      text: async () => 'Forbidden',
    });
    vi.stubGlobal('fetch', mockFetch);

    const { getAccessToken, invalidateToken } = await import('../../src/auth');
    invalidateToken();

    await expect(getAccessToken('bad-key', 'https://auth.example.com/token')).rejects.toThrow(
      'Auth failed (403): Forbidden'
    );
  });

  it('invalidateToken clears the cache', async () => {
    let callCount = 0;
    const mockFetch = vi.fn().mockImplementation(async () => {
      callCount++;
      return {
        ok: true,
        json: async () => ({ access_token: `tok-${callCount}` }),
      };
    });
    vi.stubGlobal('fetch', mockFetch);

    const { getAccessToken, invalidateToken } = await import('../../src/auth');
    invalidateToken();

    const first = await getAccessToken('key', 'https://auth.example.com/token');
    expect(first).toBe('tok-1');

    invalidateToken();
    const second = await getAccessToken('key', 'https://auth.example.com/token');
    expect(second).toBe('tok-2');
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});
