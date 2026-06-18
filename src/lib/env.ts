/**
 * Environment-derived configuration.
 *
 * Vite exposes only `import.meta.env.VITE_*` variables at build time.
 * This module centralises reading them so the rest of the app does not
 * scatter `import.meta.env` accesses.
 *
 * In containerised deployments the image is built once and configured at
 * runtime via `window.__APP_CONFIG__`, which is generated from environment
 * variables by the container entrypoint.
 */

declare global {
  interface Window {
    __APP_CONFIG__?: Record<string, string | undefined>
  }
}

export type ApiMode = 'local' | 'remote'
export type RouterMode = 'browser' | 'hash'

function parseBool(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback
  return value === '1' || value.toLowerCase() === 'true'
}

function parseApiMode(value: string | undefined, apiUrl: string | undefined): ApiMode {
  if (value === 'local' || value === 'remote') return value
  // Default to local data when no remote URL is configured.
  return apiUrl ? 'remote' : 'local'
}

function parseRouterMode(value: string | undefined): RouterMode {
  if (value === 'hash') return 'hash'
  return 'browser'
}

function getRuntimeValue(key: string): string | undefined {
  if (typeof window === 'undefined') return undefined
  return window.__APP_CONFIG__?.[key]
}

const runtimeApiUrl = getRuntimeValue('apiUrl') ?? (import.meta.env.VITE_API_URL as string | undefined)

export const env = {
  /**
   * Base API path. In production this should be the absolute URL of the
   * backend, e.g. https://api.scholarhub.example/api.
   */
  apiUrl: runtimeApiUrl,

  /**
   * Whether to use bundled local data (`local`) or the configured remote
   * backend (`remote`). When `VITE_API_MODE` is omitted it auto-detects
   * from the configured API URL.
   */
  apiMode: parseApiMode(
    getRuntimeValue('apiMode') ?? (import.meta.env.VITE_API_MODE as string | undefined),
    runtimeApiUrl,
  ),

  /**
   * Router mode. `browser` is the default and correct choice for real server
   * deployments. `hash` is only kept for static hosting on GitHub Pages.
   */
  routerMode: parseRouterMode(
    getRuntimeValue('routerMode') ?? (import.meta.env.VITE_ROUTER as string | undefined),
  ),

  /**
   * Base public path. Empty string for root deployments, `/scholarHUB` for
   * the GitHub Pages demo.
   */
  basePath: getRuntimeValue('basePath') ?? (import.meta.env.VITE_BASE_PATH as string | undefined) ?? '/',

  /**
   * Enable React StrictMode in development only by default.
   */
  strictMode: parseBool(import.meta.env.VITE_STRICT_MODE as string | undefined, import.meta.env.DEV),

  /**
   * True when running the Vite dev server.
   */
  isDev: import.meta.env.DEV,

  /**
   * True in the production build.
   */
  isProd: import.meta.env.PROD,
} as const

/**
 * Shared application constants that are not environment-specific.
 */
export const appConfig = {
  defaultPageSize: 20,
  maxPageSize: 200,
  tokenKey: 'scholarhub:auth_token',
  refreshTokenKey: 'scholarhub:refresh_token',
  userKey: 'scholarhub:auth_user',
} as const
