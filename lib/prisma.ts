import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '@/lib/generated/prisma/client';

// Prisma 7 requires a driver adapter — a bare connection string no longer connects
// at runtime (the query compiler replaced the bundled query engine). We use the pg
// adapter against the Supabase transaction-mode pooler (DATABASE_URL).
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

// Reuse a single client across hot reloads (dev) and warm serverless invocations so
// we don't exhaust the connection pool.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
