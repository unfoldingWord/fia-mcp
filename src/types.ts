export interface Env {
  FIA_ACCESS_KEY: string;
  FIA_API_URL: string;
  FIA_AUTH_URL: string;
  ENVIRONMENT: string;
}

export interface ToolContext {
  env: Env;
  callCount: number;
}
