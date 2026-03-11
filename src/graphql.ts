import { getAccessToken, invalidateToken } from './auth';
import type { ToolContext } from './types';

interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

export async function graphqlFetch<T>(
  ctx: ToolContext,
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  ctx.callCount++;

  const token = await getAccessToken(ctx.env.FIA_ACCESS_KEY, ctx.env.FIA_AUTH_URL);

  let res = await doFetch(ctx.env.FIA_API_URL, token, query, variables);

  // On 401, invalidate cache and retry once
  if (res.status === 401) {
    invalidateToken();
    const newToken = await getAccessToken(ctx.env.FIA_ACCESS_KEY, ctx.env.FIA_AUTH_URL);
    res = await doFetch(ctx.env.FIA_API_URL, newToken, query, variables);
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GraphQL request failed (${res.status}): ${text}`);
  }

  const json = (await res.json()) as GraphQLResponse<T>;

  if (json.errors?.length) {
    throw new Error(`GraphQL errors: ${json.errors.map((e) => e.message).join('; ')}`);
  }

  if (!json.data) {
    throw new Error('GraphQL response missing data');
  }

  return json.data;
}

async function doFetch(
  url: string,
  token: string,
  query: string,
  variables?: Record<string, unknown>
): Promise<Response> {
  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query, variables }),
  });
}
