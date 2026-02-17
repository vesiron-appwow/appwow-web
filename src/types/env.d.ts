/// <reference types="astro/client" />

// Cloudflare runtime types
/// <reference types="@cloudflare/workers-types" />

interface ImportMetaEnv {
  // The ONLY VTL API environment variable
  // Must be set before any page can render
  readonly PUBLIC_VTL_API_BASE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
