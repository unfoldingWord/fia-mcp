export interface Env {
  FIA_ACCESS_KEY: string;
  FIA_API_URL: string;
  FIA_AUTH_URL: string;
  MCP_SHARED_SECRET: string;
  ENVIRONMENT: string;
}

export interface ToolContext {
  env: Env;
  callCount: number;
}

export interface PageInfo {
  hasNextPage: boolean;
}

export function paginationWarning(label: string, hasNextPage: boolean): string {
  return hasNextPage
    ? `\n\n> **Warning:** More ${label} exist but were not returned. Results are truncated.\n`
    : '';
}
