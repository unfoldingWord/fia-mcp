let cached: { token: string; expiresAt: number } | null = null;
let pending: Promise<string> | null = null;

const TTL_MS = 14 * 60 * 1000; // 14 minutes (1-min safety margin on 15-min expiry)

export async function getAccessToken(accessKey: string, authUrl: string): Promise<string> {
  if (cached && Date.now() < cached.expiresAt) {
    return cached.token;
  }

  // Deduplicate concurrent requests — reuse in-flight promise
  if (pending) return pending;

  pending = fetchToken(accessKey, authUrl).finally(() => {
    pending = null;
  });

  return pending;
}

async function fetchToken(accessKey: string, authUrl: string): Promise<string> {
  const res = await fetch(authUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: accessKey }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Auth failed (${res.status}): ${text}`);
  }

  const data: unknown = await res.json();

  if (!isTokenResponse(data)) {
    throw new Error('Auth response missing access_token');
  }

  cached = { token: data.access_token, expiresAt: Date.now() + TTL_MS };
  return data.access_token;
}

function isTokenResponse(data: unknown): data is { access_token: string } {
  return (
    typeof data === 'object' &&
    data !== null &&
    'access_token' in data &&
    typeof (data as Record<string, unknown>).access_token === 'string'
  );
}

export function invalidateToken(): void {
  cached = null;
}
