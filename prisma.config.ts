// Prisma 7 config. Prisma does NOT auto-load env files, so we load `.env.local`
// explicitly using Node's built-in env-file loader (Node ≥20.12) — no dotenv
// dependency needed. This project keeps a single source of truth in `.env.local`
// (CLAUDE.md §15), which Next.js also loads, so the app runtime and the Prisma CLI
// stay in sync. In CI / Vercel there is no `.env.local` (env vars are set directly),
// so the load is guarded by an existence check.
import { existsSync } from 'node:fs';

import { defineConfig } from 'prisma/config';

if (existsSync('.env.local')) {
  process.loadEnvFile('.env.local');
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // Prisma Migrate / introspection must run over a DIRECT (non-pooled)
    // connection. The pooled DATABASE_URL is only for the serverless runtime.
    url: process.env['DIRECT_URL'] ?? process.env['DATABASE_URL'],
  },
});
