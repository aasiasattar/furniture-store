# Server Actions, Proxy, and Breaking Changes

## Table of Contents

1. [⚠️ Next.js 16 / React 19 Breaking Changes](#breaking-changes)
2. [Official Documentation](#official-documentation)
3. [Zod Schema Patterns](#zod-schema-patterns)
4. [CRUD Action Patterns](#crud-action-patterns)
5. [Soft Delete Pattern](#soft-delete-pattern)
6. [Audit Logging](#audit-logging)
7. [revalidatePath Usage](#revalidatepath-usage)
8. [Admin Route Protection — proxy.ts](#admin-route-protection)

---

## ⚠️ Next.js 16 / React 19 Breaking Changes

**Read this section before writing any Server Actions or form components.**

| API                       | ❌ Wrong (old)                    | ✅ Correct (Next.js 16 / React 19)              |
| ------------------------- | --------------------------------- | ----------------------------------------------- |
| Route protection file     | `middleware.ts`                   | `proxy.ts` — deprecated and renamed in v16.0.0  |
| Exported function name    | `export function middleware(req)` | `export function proxy(req)`                    |
| `cookies()` / `headers()` | `const c = cookies()`             | `const c = await cookies()` — async since v15   |
| Form action hook          | `useFormState` from `react-dom`   | `useActionState` from `react` — React 19 rename |
| LCP image prop            | `priority` on `<Image>`           | `preload={true}` — `priority` deprecated        |

For patterns not covered here, fetch from the official docs below before making assumptions.
Example: to verify the shape of `useActionState`'s return tuple in React 19, fetch the React docs URL rather than guessing.

---

## Official Documentation

| Resource                    | URL                                                                                              | Use For                                    |
| --------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------ |
| Server Actions              | https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations | `'use server'`, revalidation, redirect     |
| `useActionState` (React 19) | https://react.dev/reference/react/useActionState                                                 | Form state from server action, `isPending` |
| `cookies()` / `headers()`   | https://nextjs.org/docs/app/api-reference/functions/cookies                                      | Async access in Next.js 16                 |
| Proxy (route protection)    | https://nextjs.org/docs/app/api-reference/file-conventions/proxy                                 | Admin route matcher config                 |
| Zod                         | https://zod.dev                                                                                  | Schema validation patterns                 |
| Prisma CRUD                 | https://www.prisma.io/docs/orm/prisma-client/queries/crud                                        | findMany, create, update, updateMany       |

---

## Zod Schema Patterns

```typescript
// src/app/admin/[resources]/schema.ts

import { z } from 'zod';

// Field type → Zod mapping (infer from Prisma model)
// String (required)  → z.string().min(1, 'Field is required')
// String (optional)  → z.string().optional()
// Int                → z.number().int().min(0)
// Float              → z.number().min(0)
// Boolean            → z.boolean()
// DateTime           → z.coerce.date()
// Enum               → z.enum(['VALUE_A', 'VALUE_B'])
// Relation (FK id)   → z.string().uuid()

export const ProductSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  price: z.number().int().min(0, 'Price must be non-negative'),
  description: z.string().optional(),
  categoryId: z.string().uuid(),
  isOnSale: z.boolean().default(false),
  // images, salePrice, etc. as needed
});

export type ProductFormValues = z.infer<typeof ProductSchema>;

// Standard return type for ALL Server Actions in this project
export type FormState = {
  success: boolean;
  errors?: Record<string, string[]>;
  message?: string;
};
```

---

## CRUD Action Patterns

### Create Action

✅ **Correct: file-level `'use server'`, await cookies, safeParse, audit fields**

```typescript
// src/app/admin/products/actions.ts
'use server'   ← MUST be at the very top — file-level directive

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { ProductSchema, type FormState } from './schema'
import { getSession } from '@/lib/auth'

export async function createProduct(data: ProductFormValues): Promise<FormState> {
  // 1. Auth — always check before any DB write
  const cookieStore = await cookies()      // ← await required in Next.js 16
  const session = await getSession(cookieStore)
  if (!session?.user?.id) return { success: false, message: 'Unauthorized' }

  // 2. Validate
  const validated = ProductSchema.safeParse(data)
  if (!validated.success) {
    return { success: false, errors: validated.error.flatten().fieldErrors }
  }

  // 3. Write with audit fields
  await prisma.product.create({
    data: {
      ...validated.data,
      createdBy: session.user.id,
      updatedBy: session.user.id,
    },
  })

  // 4. Revalidate + redirect
  revalidatePath('/admin/products')
  redirect('/admin/products')
}
```

❌ **Avoid: inline `'use server'` per-function — does not apply file-level caching optimization**

```typescript
// This still works but misses optimization; use file-level directive instead
export async function createProduct(data: ProductFormValues) {
  'use server'; // ← per-function directive
  // ...
}
```

### Update Action

```typescript
export async function updateProduct(id: string, data: ProductFormValues): Promise<FormState> {
  const cookieStore = await cookies();
  const session = await getSession(cookieStore);
  if (!session?.user?.id) return { success: false, message: 'Unauthorized' };

  const validated = ProductSchema.safeParse(data);
  if (!validated.success) {
    return { success: false, errors: validated.error.flatten().fieldErrors };
  }

  await prisma.product.update({
    where: { id, deletedAt: null }, // never update soft-deleted records
    data: {
      ...validated.data,
      updatedBy: session.user.id,
      updatedAt: new Date(),
    },
  });

  revalidatePath('/admin/products');
  redirect('/admin/products');
}
```

---

## Soft Delete Pattern

✅ **Correct: set `deletedAt`, never hard-delete**

```typescript
export async function softDeleteProduct(id: string): Promise<FormState> {
  const cookieStore = await cookies();
  const session = await getSession(cookieStore);
  if (!session?.user?.id) return { success: false, message: 'Unauthorized' };

  await prisma.product.update({
    where: { id, deletedAt: null },
    data: {
      deletedAt: new Date(),
      updatedBy: session.user.id,
    },
  });

  revalidatePath('/admin/products');
  return { success: true, message: 'Product deleted' };
  // Do NOT redirect — caller shows undo toast before navigating
}

// Undo soft delete (restore)
export async function restoreProduct(id: string): Promise<FormState> {
  const cookieStore = await cookies();
  const session = await getSession(cookieStore);
  if (!session?.user?.id) return { success: false, message: 'Unauthorized' };

  await prisma.product.update({
    where: { id },
    data: { deletedAt: null, updatedBy: session.user.id },
  });

  revalidatePath('/admin/products');
  return { success: true };
}
```

❌ **Avoid: hard delete — loses audit trail and prevents undo**

```typescript
// NEVER use — unrecoverable, breaks undo toast
await prisma.product.delete({ where: { id } });
```

**All Prisma `findMany` queries must filter soft-deleted records:**

```typescript
await prisma.product.findMany({
  where: {
    deletedAt: null, // ← always include this
    // ...other filters
  },
});
```

---

## Audit Logging

Every Prisma mutation must include audit fields. Add these to all Prisma models:

```prisma
// prisma/schema.prisma — add to every admin-managed model
model Product {
  id          String    @id @default(cuid())
  // ... business fields ...
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  deletedAt   DateTime?            // soft delete
  createdBy   String               // userId of creator
  updatedBy   String               // userId of last editor
}
```

---

## `revalidatePath` Usage

Call `revalidatePath` after every mutation to purge the list page cache:

```typescript
revalidatePath('/admin/products'); // invalidates list page
revalidatePath(`/admin/products/${id}`); // invalidates specific item page if cached
```

- Call BEFORE `redirect()` — `redirect()` throws (Next.js internally), so code after it won't run
- In softDelete actions that return (not redirect): call before `return`

---

## Admin Route Protection

### ✅ Correct: `proxy.ts` (Next.js 16)

```typescript
// proxy.ts  ← at project root (or src/proxy.ts)
// NOTE: this file is named proxy.ts, NOT middleware.ts
// middleware.ts was deprecated and renamed to proxy.ts in Next.js 16.0.0

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  // Read session token from cookie
  const token =
    request.cookies.get('next-auth.session-token') ||
    request.cookies.get('__Secure-next-auth.session-token');

  if (!token) {
    // Redirect to login, preserving the intended URL
    const loginUrl = new URL('/admin/login', request.url);
    loginUrl.searchParams.set('callbackUrl', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'], // protects all /admin/* routes
};
```

### ❌ Avoid: `middleware.ts` — deprecated in Next.js 16.0.0

```typescript
// ❌ DO NOT CREATE THIS FILE — it no longer works in Next.js 16
// middleware.ts (deprecated) → use proxy.ts instead
```

Migration codemod if converting an existing project:

```bash
npx @next/codemod@canary middleware-to-proxy .
```

---

## Keeping Current

| Trigger                    | Section to Update                                                                    |
| -------------------------- | ------------------------------------------------------------------------------------ |
| Next.js major version bump | `## ⚠️ Breaking Changes` table and `## Admin Route Protection` — re-verify proxy API |
| React major version bump   | `useActionState` import — re-verify hook name and signature                          |
| Prisma major version bump  | `## CRUD Action Patterns` — verify `safeParse` integration and query API             |
| Zod major version bump     | `## Zod Schema Patterns` — verify field type mapping                                 |

Last verified: 2026-05
