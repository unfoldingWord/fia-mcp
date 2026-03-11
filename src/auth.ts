let cached: { token: string; expiresAt: number } | null = null;

const TTL_MS = 14 * 60 * 1000; // 14 minutes (1-min safety margin on 15-min expiry)

export async function getAccessToken(accessKey: string, authUrl: string): Promise<string> {
  if (cached && Date.now() < cached.expiresAt) {
    return cached.token;
  }

  const res = await fetch(authUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: accessKey }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Auth failed (${res.status}): ${text}`);
  }

  const data = (await res.json()) as { access_token: string };
  cached = { token: data.access_token, expiresAt: Date.now() + TTL_MS };
  return data.access_token;
}

export function invalidateToken(): void {
  cached = null;
}
