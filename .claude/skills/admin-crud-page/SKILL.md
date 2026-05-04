---
name: admin-crud-page
description: 'Generates a complete admin CRUD interface for the furniture store dashboard: list page with data table, create/edit form, delete dialog, Server Actions, and Zod schemas. This skill should be used when generating any admin CRUD page, admin management interface, admin list view with create/edit/delete, or admin resource page — for any resource type (products, categories, orders, users, etc.). This skill should not be used for customer-facing pages, public-facing product listings, or non-admin interfaces.'
---

# Admin CRUD Page

Produce the following files every time this skill is invoked.
Replace `[Resource]` with PascalCase name, `[resources]` with plural lowercase, `[resource]` with singular lowercase.

**Core output files:**

1. `src/app/admin/[resources]/page.tsx` — list page (Server Component)
2. `src/components/admin/[Resource]ListTable.tsx` — interactive data table (Client Component)
3. `src/components/admin/[Resource]Form.tsx` — create/edit form (Client Component)
4. `src/components/admin/[Resource]DeleteDialog.tsx` — delete confirmation dialog (Client Component)
5. `src/app/admin/[resources]/actions.ts` — Server Actions (create, update, softDelete)
6. `src/app/admin/[resources]/schema.ts` — Zod schemas + TypeScript types

**Route wrappers** (thin Server Components, generated alongside):

- `src/app/admin/[resources]/new/page.tsx` — renders `<[Resource]Form mode="create" />`
- `src/app/admin/[resources]/[id]/edit/page.tsx` — fetches resource, renders `<[Resource]Form mode="edit" />`

**Tests:** co-locate `.test.tsx` / `.test.ts` next to each output file.

## Naming Convention

Given `Product`: routes → `products`, components → `Product`, Prisma → `prisma.product`
Given `ProductCategory`: routes → `product-categories`, components → `ProductCategory`, Prisma → `prisma.productCategory`

## Out of Scope

This skill generates the admin CRUD UI only. It does NOT:

- Configure the Prisma schema — the caller defines models in `prisma/schema.prisma`
- Set up authentication or NextAuth.js — caller configures auth separately
- Initialize Shadcn/ui — caller must run `npx shadcn@latest init` before invoking this skill
- Build customer-facing pages — those are separate components
- Generate API routes — Server Actions replace API routes for all mutations

## Reference Files

| File                           | Read When                                                                         |
| ------------------------------ | --------------------------------------------------------------------------------- |
| `references/server-actions.md` | **Read first every invocation** — critical Next.js 16 / React 19 breaking changes |
| `references/list-view.md`      | Generating `page.tsx` and `[Resource]ListTable.tsx`                               |
| `references/form.md`           | Generating `[Resource]Form.tsx` and `[Resource]DeleteDialog.tsx`                  |
| `references/tests.md`          | Generating all test files                                                         |

## Variability Analysis

| What VARIES (ask user or infer)                  | What is CONSTANT (encoded in this skill)                              |
| ------------------------------------------------ | --------------------------------------------------------------------- |
| Resource name (Product, Category, Order…)        | Soft delete — always `deletedAt: new Date()`, never hard DELETE       |
| Resource fields, types, and validation rules     | Audit fields — always `createdBy` + `updatedBy` on every mutation     |
| Route path (default: `/admin/[resources]`)       | `'use server'` file-level directive at top of `actions.ts`            |
| Features: image upload, filters, auto-save draft | `await cookies()` / `await headers()` — async in Next.js 16           |
| Related resources needing cascade warnings       | `useActionState` from `react` — NOT `useFormState` from `react-dom`   |
| Which columns appear in list vs form             | `proxy.ts` — NOT `middleware.ts` (deprecated in Next.js 16)           |
|                                                  | Zod schema reused in both zodResolver (client) and safeParse (server) |

## Required Dependencies

Verify all are installed before generating code. If any are missing, list the install commands and stop.

| Package(s)                               | Install Command                                 | Purpose                                               | Changelog                                                   |
| ---------------------------------------- | ----------------------------------------------- | ----------------------------------------------------- | ----------------------------------------------------------- |
| `react-hook-form`, `@hookform/resolvers` | `pnpm add react-hook-form @hookform/resolvers`  | Form state + Zod validation                           | https://github.com/react-hook-form/react-hook-form/releases |
| `zod`                                    | `pnpm add zod`                                  | Schema validation (client + server)                   | https://github.com/colinhacks/zod/releases                  |
| `prisma`, `@prisma/client`               | `pnpm add -D prisma && pnpm add @prisma/client` | Database ORM                                          | https://github.com/prisma/prisma/releases                   |
| Shadcn/ui                                | `npx shadcn@latest init`                        | Dialog, Table, Button, Input, Skeleton, Badge, Select | https://ui.shadcn.com/docs/changelog                        |
| `sonner`                                 | `pnpm add sonner`                               | Toast notifications (success, undo)                   | https://github.com/emilkowalski/sonner/releases             |

**Shadcn components to add:** `npx shadcn@latest add dialog table button input label skeleton badge select`

## Required Clarifications

Before writing any code, check `prisma/schema.prisma` and conversation history. Only ask what cannot be inferred:

1. **Resource name**: What resource is being managed? (Product, Category, Order, User…)
   - Drives ALL naming — component names, routes, Prisma accessor, type names
   - No default — this is required before any code is written
   - Note the assumption: "Generating admin CRUD for `[Resource]`"

2. **Resource fields**: What fields does the resource have?
   - If `prisma/schema.prisma` exists with the model: skip this question (Automated Check #6)
   - If no schema: ask for fields in format: `name: string (required), price: number (min 0)`
   - Audit + soft-delete fields (`createdAt`, `updatedAt`, `deletedAt`, `createdBy`, `updatedBy`) are added automatically

3. **Features**: Which optional features to include?
   - Image upload (Cloudinary): yes/no — default: **no**
   - Custom filter fields beyond defaults: specify or default to `status + createdAt date range`
   - Auto-save draft: yes/no — default: **no**
   - Undo toast after delete: yes/no — default: **yes** (5-second window)
   - If not specified: apply all defaults and note them

## Optional Clarifications

4. **Custom route**: Non-default admin route path?
   - Default: `/admin/[plural-resource-name]` (e.g., `/admin/products`)
   - Only ask if user mentions a different path

5. **Cascade warnings**: Related resources orphaned on delete?
   - Example: "Deleting a Category would orphan Products in that category"
   - If yes: add warning text to the delete dialog

## Automated Check (no need to ask)

6. **Prisma model**: Check `prisma/schema.prisma` — if the named model exists, read its fields directly. Use field types to infer Zod validations (String → `z.string()`, Int → `z.number().int()`, etc.).

7. **Existing admin patterns**: Check `src/components/admin/` — if files exist, follow their naming and Shadcn usage patterns.

8. **Proxy file**: Check for `proxy.ts` / `proxy.js` at project root or `src/`. If absent, generate it as part of this skill's output (see `references/server-actions.md`).

## Before Implementation

| Source               | What to Gather                                                                                                                                                               |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Codebase**         | Read `prisma/schema.prisma` for model definition. Check `src/components/admin/` for existing patterns. Grep `src/` for `[Resource]` to find existing imports if refactoring. |
| **Conversation**     | Resource name, fields (if no schema), feature flags (image, filters, auto-save, undo)                                                                                        |
| **Skill References** | Read `references/server-actions.md` first (breaking changes). Then load the specific reference files per workflow step.                                                      |
| **CLAUDE.md**        | Confirm Shadcn/ui is initialized; confirm `font-heading`/`font-body` aliases in `globals.css`                                                                                |

Do not rely on memory for Server Action patterns, proxy config, Shadcn APIs, or React Hook Form setup. Always read the relevant reference file.

## Workflow

### 1. Read `references/server-actions.md` and confirm setup

Load `references/server-actions.md` in full. This contains critical Next.js 16 / React 19 breaking changes. Confirm resource name, fields, and feature flags before proceeding.

### 2. Generate `schema.ts`

- Define `[Resource]Schema` — Zod object with all field validations
- Export `[Resource]FormValues = z.infer<typeof [Resource]Schema>`
- Export `FormState = { success: boolean; errors?: Record<string, string[]>; message?: string }`

### 3. Generate `actions.ts`

Read `references/server-actions.md § CRUD Action Patterns`. Generate `create[Resource]`, `update[Resource]`, `softDelete[Resource]`. Each must include: `'use server'`, `await cookies()`, Zod `safeParse`, Prisma mutation, audit fields, `revalidatePath`, and redirect on success.

### 4. Generate `[Resource]Form.tsx` + `[Resource]DeleteDialog.tsx`

Read `references/form.md`. Build form with React Hook Form + zodResolver. Wire Server Action via `useActionState`. Generate delete dialog with Shadcn Dialog and sonner undo toast.

### 5. Generate list page files

Read `references/list-view.md`. Build Server Component `page.tsx` (data fetch from searchParams). Build Client Component `[Resource]ListTable.tsx` (sort, search, pagination, bulk, skeleton, empty state).

### 6. Generate route wrappers and tests

Generate thin `new/page.tsx` and `[id]/edit/page.tsx`. Generate `proxy.ts` if absent. Read `references/tests.md` and generate all co-located test files.

### 7. Self-check before outputting

- [ ] All `[Resource]` placeholders replaced — no template strings left
- [ ] `'use server'` is file-level directive at top of `actions.ts` (not inline per-function)
- [ ] `await cookies()` and `await headers()` — both awaited, confirmed async
- [ ] `useActionState` imported from `'react'` — NOT `useFormState` from `'react-dom'`
- [ ] `softDelete[Resource]` sets `deletedAt: new Date()` — no `prisma.[resource].delete()`
- [ ] `createdBy` in create action; `updatedBy` in update action — both set from session
- [ ] `revalidatePath('/admin/[resources]')` called after every mutation
- [ ] Route protection via `proxy.ts` — not `middleware.ts` (deprecated in Next.js 16)
- [ ] Zod schema is single source of truth — used in both `zodResolver` and `safeParse`
- [ ] All `<input>` / `<select>` have `<label htmlFor>` associations
- [ ] Delete dialog returns focus to its trigger element on close
- [ ] `data-testid` attributes on table, form, dialog, and all action buttons
