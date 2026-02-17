/**
 * src/lib/api.ts
 *
 * THE ONLY FILE IN APPWOW THAT CALLS THE VTL PLATFORM API
 *
 * Contract: AppWow API Contract v1 — February 2026 (LOCKED)
 * Worker:   https://vtl-platform-api.mja-226.workers.dev
 *
 * Rules:
 * 1. No other file in this project may call fetch() against the VTL API
 * 2. All functions here map exactly to routes defined in the API Contract v1
 * 3. PUBLIC_VTL_API_BASE is the only allowed base URL — never hardcoded
 * 4. If a route needs changing, only this file changes
 *
 * API Contract v1 routes covered:
 * - GET /api/v1/catalog/apps         → getCatalogApps()
 * - GET /api/v1/catalog/apps/:id     → getAppDetail()
 * - GET /api/v1/members/me           → getMe()
 */

// ── TYPES (matching API Contract v1 response shapes exactly) ──

export interface AppItem {
  id: string;
  app_name: string;
  short_name: string | null;
  category: string;
  short_description: string | null;
  app_url: string;
  icon_r2_key: string | null;
  is_evosystem: 0 | 1;
  is_featured: 0 | 1;
  listing_status: string;  // NEVER REMOVE
  created_at: string;      // NEVER REMOVE
}

export interface CatalogResponse {
  apps: AppItem[];
  count: number;
  source: string;  // NEVER REMOVE — "kv-cache" | "d1"
}

export interface AppDetail extends AppItem {
  description: string;
  manifest_url: string | null;
  screenshots_r2_keys: string | null;  // JSON array string — parse before use
  developer_id: string | null;          // NEVER REMOVE
  verification_status: string | null;
  verification_score: number | null;
  last_verified_at: string | null;
}

export interface Entitlements {
  link3_stage1: boolean;
  link3_stage2: boolean;
  link3_stage3: boolean;
  linxmart_view: boolean;
  full_evosystem: boolean;
}

export interface Member {
  id: string;
  email: string;
  membership_tier: string;
  membership_status: string;
}

export interface MeResponse {
  authenticated: boolean;
  member: Member | null;
  entitlements: Entitlements;
  _phase: number;  // NEVER REMOVE — 1 = mocked, 2 = real auth
}

export interface CatalogParams {
  category?: string;
  featured?: boolean;
  evosystem?: boolean;
  limit?: number;
}

// ── BASE URL ──
// Reads from environment variable — never hardcoded
// Set PUBLIC_VTL_API_BASE in:
//   - .env for local development
//   - Cloudflare Pages environment variables for production

function getBase(): string {
  const base = import.meta.env.PUBLIC_VTL_API_BASE;
  if (!base) {
    throw new Error(
      'PUBLIC_VTL_API_BASE is not set. ' +
      'Add it to .env for local development or Cloudflare Pages environment variables for production.'
    );
  }
  return base;
}

// ── API FUNCTIONS ──

/**
 * GET /api/v1/catalog/apps
 * Returns list of verified Instant Applications
 * Contract: Section 2 — Homepage Contract
 */
export async function getCatalogApps(params: CatalogParams = {}): Promise<CatalogResponse> {
  const base = getBase();
  const qs = new URLSearchParams();

  if (params.category)              qs.set('category', params.category);
  if (params.featured  === true)    qs.set('featured', 'true');
  if (params.evosystem === true)    qs.set('evosystem', 'true');
  if (params.limit !== undefined)   qs.set('limit', String(params.limit));

  const url = qs.toString()
    ? `${base}/api/v1/catalog/apps?${qs}`
    : `${base}/api/v1/catalog/apps`;

  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`getCatalogApps failed: ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<CatalogResponse>;
}

/**
 * GET /api/v1/catalog/apps/:id
 * Returns full detail for a single verified app
 * Contract: Section 3 — App Detail Contract
 */
export async function getAppDetail(id: string): Promise<AppDetail> {
  const base = getBase();
  const res = await fetch(`${base}/api/v1/catalog/apps/${id}`);

  if (res.status === 404) {
    throw new Error(`App not found: ${id}`);
  }

  if (!res.ok) {
    throw new Error(`getAppDetail failed: ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<AppDetail>;
}

/**
 * GET /api/v1/members/me
 * Returns current user authentication state and entitlements
 * Contract: Section 4 — User State Contract
 *
 * IMPORTANT: Always returns a valid MeResponse shape regardless of auth state.
 * Check response.authenticated before accessing response.member.
 * response.entitlements is always present — all false when not authenticated.
 */
export async function getMe(): Promise<MeResponse> {
  const base = getBase();
  const res = await fetch(`${base}/api/v1/members/me`);

  if (!res.ok) {
    // Return safe unauthenticated default rather than throwing
    // This ensures UI always has a valid state to render
    return {
      authenticated: false,
      member: null,
      entitlements: {
        link3_stage1: false,
        link3_stage2: false,
        link3_stage3: false,
        linxmart_view: false,
        full_evosystem: false,
      },
      _phase: 1,
    };
  }

  return res.json() as Promise<MeResponse>;
}
