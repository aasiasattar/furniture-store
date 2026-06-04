# Feature: Admin Dashboard

> The operator-facing surface at `/admin/*`. Five concerns: log in securely,
> see the business at a glance, manage products, manage orders, manage categories.
> Separate visual theme from the customer storefront — clean white admin UI, not the
> maroon/cream chrome.

## Overview

The admin dashboard is the only surface that mutates the catalogue and reads
operational data. It lives entirely under the `/admin/*` route tree, served by a
**separate layout** (`app/admin/layout.tsx`) that does **not** include the storefront
Header / Footer from `01-layout-header-footer.md`. Every route in `/admin/*` is
gated by `proxy.ts` and requires `session.user.role === 'admin'`.

Five parts:

| Part | Scope                                                   | Route(s)                                        |
| ---- | ------------------------------------------------------- | ----------------------------------------------- |
| A    | Auth — login, session, RBAC, route protection           | `/admin/login`                                  |
| B    | Dashboard home — sidebar, top bar, stats, widgets       | `/admin/dashboard`                              |
| C    | Products CRUD — built via the `admin-crud-page` skill   | `/admin/products`, `.../new`, `.../[id]/edit`   |
| D    | Orders management — list + detail (status, notes)       | `/admin/orders`, `.../[id]`                     |
| E    | Categories CRUD — built via the `admin-crud-page` skill | `/admin/categories`, `.../new`, `.../[id]/edit` |

The Product / Dimensions / CartItem interfaces canonicalised in
`03-product-system.md` §S1 are consumed unchanged by Part C; this spec does not
redefine them.

## User Stories

- **Admin operator** — log in once, land on a dashboard that summarises today's revenue, recent orders, and low-stock alerts.
- **Catalogue manager** — search products, edit a price, upload new images, soft-delete with a 5-second undo window.
- **Operations team** — open an order, move it from "processing" to "shipped", leave an internal note for shipping prep.
- **Owner setting up taxonomy** — create / rename categories; the storefront footer (layout spec §B8) updates within 24 h or instantly on save via `revalidateTag('categories')`.
- **Non-admin who somehow lands on `/admin/products`** — be redirected immediately, not see a 404 leak.

---

# PART A — ADMIN AUTH

## A1. Overview

A dedicated login surface for admins, intentionally separated from the customer
login (`/login`) so the two flows can diverge (admin needs RBAC + rate limiting +
shorter session window). The route is the only `/admin/*` URL accessible without a
session.

## A2. Login page (`/admin/login`)

### Layout (ASCII)

```
┌────────────────────────────────────────────┐
│         ┌──────────────────────────┐       │
│         │   ADMIN SIGN IN          │       │
│         │   Email    [           ] │       │
│         │   Password [           ] │       │
│         │   ☐ Remember me          │       │
│         │   [       Sign in       ]│       │
│         │   ⚠ Wrong credentials    │       │
│         └──────────────────────────┘       │
└────────────────────────────────────────────┘
```

### Form contract

| Field       | Type                               | Validation                          |
| ----------- | ---------------------------------- | ----------------------------------- |
| Email       | `<input type="email" required>`    | Valid email, max 320 chars          |
| Password    | `<input type="password" required>` | 8+ chars (server enforced)          |
| Remember me | `<input type="checkbox">`          | When `true`, extend session to 30 d |

### Error states

| State                                    | UI                                                               |
| ---------------------------------------- | ---------------------------------------------------------------- |
| Idle                                     | Form + Sign in button                                            |
| Submitting                               | Button shows spinner, disabled, `aria-busy="true"`               |
| Wrong credentials                        | Inline error under form: "Wrong email or password."              |
| Account locked (rate-limited)            | Inline error: "Too many attempts. Try again in N minutes."       |
| Account not admin                        | Same generic "Wrong email or password" message (no role leak)    |
| Session expired (from `?reason=expired`) | Banner above form: "Your session expired. Please sign in again." |

### Redirect flow

- Successful login → `/admin/dashboard` (or `?callbackUrl` if present and starts with `/admin/`).
- Already-logged-in admin visiting `/admin/login` → redirect to `/admin/dashboard`.
- Non-admin user with a customer session visiting `/admin/login` → form still renders; submitting their credentials returns the generic error.

## A3. Security model

| Concern           | Decision                                                                                   |
| ----------------- | ------------------------------------------------------------------------------------------ |
| Identity provider | NextAuth.js Credentials provider                                                           |
| User shape        | `User { id, email, name, role: 'customer' \| 'admin', passwordHash, ... }` in Prisma       |
| Password hashing  | bcrypt, 10 rounds (CLAUDE.md §8)                                                           |
| Session strategy  | JWT, signed with `NEXTAUTH_SECRET`                                                         |
| Session window    | 24 h default; 30 d when "Remember me" is ticked                                            |
| Cookie attributes | `httpOnly`, `secure` (prod), `sameSite: 'strict'`                                          |
| Rate limit        | 5 attempts per IP per 15 min on `POST /api/auth/callback/credentials` via Upstash Redis    |
| CSRF              | Handled by NextAuth — no manual token required                                             |
| Audit log         | Successful + failed logins appended to `AuthAudit` table (id, userId?, ip, ua, ts, result) |

## A4. Route protection (`proxy.ts`)

Next.js 16 deprecates `middleware.ts` in favour of `proxy.ts`. The admin guard
lives at the project root in `proxy.ts` (not `middleware.ts`):

| Concern                  | Behaviour                                                                                 |
| ------------------------ | ----------------------------------------------------------------------------------------- |
| Match pattern            | `matcher: ['/admin/:path*']`                                                              |
| Allowed without session  | Only `/admin/login`                                                                       |
| Missing or invalid token | Redirect to `/admin/login?callbackUrl=<current>`                                          |
| Valid customer session   | Redirect to `/admin/login?reason=forbidden` (no role leak — same login page, just a flag) |
| Valid admin session      | Pass through                                                                              |

> **Note:** CLAUDE.md §8 currently says "Admin routes protected with Next.js
> middleware." That bullet should be updated to "Admin routes protected via
> `proxy.ts` (Next.js 16)" in a future cleanup pass. This spec is the source of
> truth for the implementation.

## A5. Files

```
src/
  proxy.ts                            // Next 16 route guard for /admin/:path*
  app/admin/login/page.tsx            // Server — renders LoginForm
  components/admin/LoginForm.tsx      // Client — form, useActionState, error UI
  lib/auth.ts                         // NextAuth config (Credentials + JWT callbacks)
  lib/ratelimit.ts                    // Shared Upstash limiter (also used by newsletter)
prisma/
  schema.prisma                       // User { role enum }, AuthAudit table
  seed.ts                             // Inserts the first admin user for v1
```

For v1 there is **no admin user management UI**. Admin users are inserted via
`prisma/seed.ts` during dev / staging — see S8.

---

# PART B — DASHBOARD HOME (`/admin/dashboard`)

## B1. Overview

The landing page after login. Snapshot of business health plus quick links into the
common admin tasks. All data is server-fetched (no client-side polling); for v1 the
dashboard is read-only (no widget interactions beyond the Quick Actions and the
"View all" links).

## B2. Layout

### ASCII

```
┌─ SIDEBAR ─┬─────────────────────────────────────────────────────┐
│  Logo     │  Hello, Aasia                         [Sign out]    │
│ ▣ Dash    ├─────────────────────────────────────────────────────┤
│ ▣ Prods   │  ┌─────────┬─────────┬─────────┬─────────┐           │
│ ▣ Cats    │  │ Revenue │ Orders  │ Products│ Custs   │           │
│ ▣ Orders  │  │ Rs 482k │ 38 ▲6%  │ 124     │ 612 ▲4% │           │
│ ▣ Custs   │  └─────────┴─────────┴─────────┴─────────┘           │
│ ▣ Setts   │  Recent Orders                       View all →     │
│           │  #1042  Ali Khan   Rs 38,500  Processing  May 30    │
│           │  Low Stock Alerts                                   │
│           │  Walnut Lounge Sofa     Only 2 left   [Restock]     │
│           │  [+ Add product]  [View orders]                     │
└───────────┴─────────────────────────────────────────────────────┘
```

### Breakpoints

| Width      | Layout                                                                              |
| ---------- | ----------------------------------------------------------------------------------- |
| `<1024 px` | Sidebar collapses to a hamburger-triggered slide-in drawer; stats grid stacks 2×2   |
| `≥1024 px` | Sidebar fixed at 240 px wide; stats grid 4×1                                        |
| `≥1280 px` | Stats row stays 4×1; Recent Orders + Low Stock can sit side-by-side (2-column grid) |

## B3. Sidebar navigation

| Item       | Route               | Icon (`lucide-react`) | Notes                                 |
| ---------- | ------------------- | --------------------- | ------------------------------------- |
| Dashboard  | `/admin/dashboard`  | `LayoutDashboard`     | Active on the home page only          |
| Products   | `/admin/products`   | `Box`                 | Active on `/admin/products/*`         |
| Categories | `/admin/categories` | `Tags`                | Active on `/admin/categories/*`       |
| Orders     | `/admin/orders`     | `ShoppingBag`         | Active on `/admin/orders/*`           |
| Customers  | `/admin/customers`  | `Users`               | List-only for v1 (read)               |
| Settings   | `/admin/settings`   | `Settings`            | Stub for v1 (profile + sign-out only) |

- `<nav aria-label="Admin">` wraps the list.
- Active route detected via `usePathname()` — text turns `--color-black`, background `bg-zinc-100`, left edge accented with a 3 px `bg-zinc-900` rail.

## B4. Stats cards

Four equal-width cards on desktop. Each card has a label, formatted value
(`toLocaleString('en-PK')`), trend arrow + percentage vs same window last month, and
a period label ("This month" / "Last 30 days"). Skeleton state renders while the
query resolves; numbers fade in on hydrate.

| Card            | Query                                                                                  |
| --------------- | -------------------------------------------------------------------------------------- |
| Revenue         | `SUM(orders.total)` where `status IN ('delivered','shipped')` AND `createdAt` in month |
| Orders          | `COUNT(orders)` in month                                                               |
| Active products | `COUNT(products)` where `isPublished=true AND deletedAt IS NULL`                       |
| Customers       | `COUNT(users)` where `role='customer'`                                                 |

## B5. Widgets

### Recent Orders

- Last 10 orders, columns: ID, Customer, Amount, Status, Date.
- "View all →" link to `/admin/orders`.
- Each row is a link to `/admin/orders/[id]`.
- Empty state: "No orders yet — once your first sale comes in, it will land here."

### Low Stock Alerts

- Products where `stock < 5 AND deletedAt IS NULL`, ordered by `stock` ascending.
- Columns: Product name, "Only N left!" (matches storefront copy), "Restock" link to `/admin/products/[id]/edit`.
- Empty state: "All products are healthily stocked."

### Quick Actions

- Two primary buttons:
  - `[+ Add product]` → `/admin/products/new`
  - `[View orders]` → `/admin/orders`

## B6. Files

```
src/app/admin/
  layout.tsx                          // Server — admin shell (NOT storefront chrome)
  dashboard/page.tsx                  // Server — composes widgets
src/components/admin/
  AdminSidebar.tsx                    // Client — usePathname for active state
  AdminTopBar.tsx                     // Client — user name, sign out
  StatsCard.tsx                       // Server-compatible
  RecentOrdersWidget.tsx              // Server — Prisma query
  LowStockWidget.tsx                  // Server — Prisma query
  QuickActions.tsx                    // Server — static buttons
```

---

# PART C — PRODUCTS CRUD

## C1. Overview

The Products CRUD is generated by the **`admin-crud-page` skill**. That skill is the
canonical source for: list table mechanics, form mechanics, delete dialog,
`useActionState` wiring, Server Actions (`'use server'` directive, `await cookies()`,
Zod `safeParse`, audit fields, `revalidatePath`), proxy.ts wiring, and the test
coverage checklist. This spec does **not** re-specify any of that. See
`.claude/skills/admin-crud-page/` (one SKILL.md + four reference files).

What this spec owns: the **resource-specific** decisions for Products.

## C2. List page (`/admin/products`)

### Columns

| Column   | Source                               | Notes                                                         |
| -------- | ------------------------------------ | ------------------------------------------------------------- |
| Image    | `product.images[0]`                  | 48 × 48 thumbnail; placeholder beige div if missing           |
| Name     | `product.name`                       | Link to `/admin/products/[id]/edit`                           |
| Category | `product.category.name`              | Plain text                                                    |
| Price    | `product.salePrice ?? product.price` | If on sale, show sale price with original `line-through`      |
| Stock    | `product.stock`                      | Coloured badge: green ≥ 5, amber 1–4, red 0                   |
| Status   | `product.isPublished`                | Badge: "Published" / "Draft"                                  |
| Actions  | —                                    | `[Edit]` `[Delete]` icon buttons; `data-testid="row-actions"` |

### Filters

| Control     | Detail                                                                                     |
| ----------- | ------------------------------------------------------------------------------------------ |
| Search      | Single input over `name`; debounced 300 ms; URL param `q`                                  |
| Category    | `<Select>` with options from `Category` table; URL param `category`                        |
| Status      | `<Select>`: All / Published / Draft; URL param `status`                                    |
| Bulk delete | Header checkbox + per-row checkbox; "Delete selected (N)" appears once any row is selected |
| Pagination  | 25 per page (skill default)                                                                |

## C3. Form fields (`/admin/products/new`, `/admin/products/[id]/edit`)

| Field                       | Input                                                  | Validation (Zod)                                                     |
| --------------------------- | ------------------------------------------------------ | -------------------------------------------------------------------- |
| Name                        | `<Input>`                                              | `z.string().min(2).max(120)` — required                              |
| Slug                        | `<Input>` (auto-generated from name on blur, editable) | `z.string().regex(/^[a-z0-9-]+$/).max(120)` — unique across products |
| Category                    | `<Select>` populated from `Category` table             | `z.string().cuid()` — required                                       |
| Description                 | `<Textarea>` (rich-text editor is Phase 2)             | `z.string().max(5000)`                                               |
| Price                       | `<Input type="number">` PKR                            | `z.number().int().positive().max(10_000_000)` — required             |
| Sale price                  | `<Input type="number">` PKR (optional)                 | `z.number().int().positive().lt(price)` — must be less than price    |
| Stock                       | `<Input type="number">`                                | `z.number().int().min(0).max(99999)` — required                      |
| Images                      | Drag-drop uploader (C4)                                | `z.array(z.string().url()).min(1).max(6)`                            |
| Material                    | `<Input>`                                              | `z.string().min(2).max(120)`                                         |
| Width / Height / Depth (cm) | three `<Input type="number">`                          | `z.number().positive().max(1000)` each — required                    |
| Weight (kg)                 | `<Input type="number">` (optional)                     | `z.number().positive().max(1000).optional()`                         |
| isNew                       | `<Switch>`                                             | `z.boolean()` (default `false`)                                      |
| isPublished                 | `<Switch>`                                             | `z.boolean()` (default `false` on create, true on edit)              |

Submit + Cancel buttons follow skill conventions. Submit calls
`createProduct` / `updateProduct` Server Action; success → `revalidatePath('/admin/products')` + redirect.

## C4. Image upload

- **UI** — `react-dropzone` drag-and-drop with click-to-pick fallback.
- **Limits** — 1–6 images per product; UI blocks the 7th, server enforces min via Zod.
- **Reorder** — drag handles; first thumbnail is the primary card image.
- **Upload** — Cloudinary **signed upload**; signature minted by a Server Action so `CLOUDINARY_API_SECRET` stays server-side.
- **Files** — accept `image/{jpeg,png,webp}`; reject > 5 MB per file with inline error.
- **Failure UX** — failing thumbnail shows error overlay + Retry; rest of the form is preserved.
- **Persistence** — Cloudinary URLs stored in `product.images: string[]`.

## C5. Delete

- Soft delete only — sets `deletedAt: new Date()` per skill conventions; never `prisma.product.delete()`.
- 5-second undo toast (sonner) — clicking Undo within the window calls a `restoreProduct` Server Action that clears `deletedAt`.
- **Guard:** if the product is referenced by any order in status `pending` or `processing`, deletion is blocked with a dialog: "This product is in N active orders. Mark as draft instead?" The dialog offers an "Unpublish" button (sets `isPublished=false`) and a Cancel.

## C6. Files

Per the skill's naming convention with `Product` resource:

```
src/app/admin/products/
  page.tsx                            // Server — list page
  loading.tsx                         // Skeleton table
  new/page.tsx                        // Wrapper for <ProductForm mode="create" />
  [id]/edit/page.tsx                  // Wrapper for <ProductForm mode="edit" />
  actions.ts                          // 'use server' — create / update / softDelete / restore / signUpload
  schema.ts                           // ProductSchema (Zod) + FormState
src/components/admin/
  ProductListTable.tsx                // Client — sort, search, pagination, bulk
  ProductForm.tsx                     // Client — RHF + zodResolver + useActionState
  ProductDeleteDialog.tsx             // Client — Shadcn Dialog + sonner undo
  ProductImageUploader.tsx            // Client — drag-drop + Cloudinary signed upload
```

---

# PART D — ORDERS MANAGEMENT

## D1. Overview

Orders are read-mostly from the admin's perspective: customers create them; admins
review and progress them. The **list page** follows the `admin-crud-page` skill's
table patterns; the **detail page** is custom (it's not a CRUD form — it composes
read-only customer info with a single status-update action and an internal notes
textarea).

## D2. List page (`/admin/orders`)

### Columns

| Column   | Source                            | Notes                                          |
| -------- | --------------------------------- | ---------------------------------------------- |
| Order ID | `order.id` (formatted `#N`)       | Link to `/admin/orders/[id]`                   |
| Customer | `order.user.name` + email tooltip | Plain text                                     |
| Items    | `order.items.length`              | Number with a chevron expanding inline preview |
| Total    | `order.total`                     | `Rs N` formatted                               |
| Status   | `order.status`                    | Coloured badge (see D4)                        |
| Date     | `order.createdAt`                 | `2026-05-30` format; tooltip with time         |

### Filters

| Filter     | Detail                                                                        |
| ---------- | ----------------------------------------------------------------------------- |
| Status     | Multi-select chip group (pending, processing, shipped, delivered, cancelled)  |
| Date range | Two date pickers (from / to); URL params `from`, `to`                         |
| Search     | Single input over `order.id` and `order.user.name`; debounced 300 ms; URL `q` |
| Pagination | 25 per page                                                                   |

Empty state when no orders: illustration + "No orders yet."

## D3. Detail page (`/admin/orders/[id]`)

### Layout (ASCII)

```
┌────────────────────────────────────────────────────────────┐
│  ◀ Back to orders        Order #1042  ·  May 30 2026       │
├────────────────────────────────────────────────────────────┤
│  CUSTOMER  Ali Khan · ali@example.com · +92 300 1234567    │
│            Karachi, Pakistan                               │
├────────────────────────────────────────────────────────────┤
│  ITEMS                                                     │
│  [img] Walnut Lounge Sofa  Rs 38,500 × 2    Rs 77,000      │
│  [img] Brass Side Table    Rs 14,500 × 1    Rs 14,500      │
├────────────────────────────────────────────────────────────┤
│  Subtotal                                 Rs 91,500        │
│  Shipping                                 Rs 500           │
│  Promo (WELCOME10)                       -Rs 9,150         │
│  Grand total                              Rs 82,850        │
├────────────────────────────────────────────────────────────┤
│  STATUS  [Processing ▾]            [Update status]         │
│  NOTES   [ textarea ]              [Save notes]            │
└────────────────────────────────────────────────────────────┘
```

### Fields

| Block            | Content                                                                                    |
| ---------------- | ------------------------------------------------------------------------------------------ |
| Customer info    | `name`, `email`, `phone`, shipping address (city + country); read-only                     |
| Line items       | Thumbnail, name, variant, unit price × qty, line subtotal; from `order.items` join         |
| Totals breakdown | Subtotal, shipping, promo discount (if any), grand total                                   |
| Status update    | `<Select>` with allowed transitions per D4; submit calls `updateOrderStatus` Server Action |
| Internal notes   | `<Textarea>` (max 2000 chars); separate Save button; appends to a history table            |

## D4. Status state machine

Allowed transitions:

| From         | Can move to                         |
| ------------ | ----------------------------------- |
| `pending`    | `processing`, `cancelled`           |
| `processing` | `shipped`, `cancelled`              |
| `shipped`    | `delivered`                         |
| `delivered`  | (terminal — no further transitions) |
| `cancelled`  | (terminal — no further transitions) |

Server-side `updateOrderStatus` validates the transition against this table; invalid
transitions return a `FormState` error and the Select reverts. Each successful
transition calls `revalidatePath('/admin/orders')` plus the detail page.

Badge colours:

| Status       | Badge                         |
| ------------ | ----------------------------- |
| `pending`    | Amber                         |
| `processing` | Blue                          |
| `shipped`    | Indigo                        |
| `delivered`  | Green                         |
| `cancelled`  | Zinc grey, strikethrough text |

## D5. Files

```
src/app/admin/orders/
  page.tsx                            // Server — list page (filters from searchParams)
  loading.tsx                         // Skeleton table
  [id]/page.tsx                       // Server — detail page
  actions.ts                          // 'use server' — updateOrderStatus / saveInternalNotes
  schema.ts                           // OrderStatusSchema, NotesSchema, status transition map
src/components/admin/
  OrderListTable.tsx                  // Client — table + filters + pagination
  OrderStatusBadge.tsx                // Server-compatible badge
  OrderStatusDropdown.tsx             // Client — allowed-transition <Select>
  OrderLineItems.tsx                  // Server — read-only line rows
  OrderTotals.tsx                     // Server — totals block
  OrderInternalNotes.tsx              // Client — textarea + Save action
```

---

# PART E — CATEGORIES CRUD

## E1. Overview

The simplest CRUD in the admin. Built straight from the **`admin-crud-page` skill**
with the `Category` resource. The only non-default concern is the delete guard
(E3) and the cross-storefront cache invalidation.

## E2. Form fields (`/admin/categories/new`, `/admin/categories/[id]/edit`)

| Field       | Input                                                | Validation (Zod)                                            |
| ----------- | ---------------------------------------------------- | ----------------------------------------------------------- |
| Name        | `<Input>`                                            | `z.string().min(2).max(60)` — required                      |
| Slug        | `<Input>` (auto from name on blur, editable)         | `z.string().regex(/^[a-z0-9-]+$/).max(60)` — unique         |
| Image       | Single Cloudinary upload (same pattern as C4, max 1) | `z.string().url()`                                          |
| Description | `<Textarea>` (optional)                              | `z.string().max(500).optional()`                            |
| Sort order  | `<Input type="number">`                              | `z.number().int().min(0).max(999)` — drives footer ordering |
| isPublished | `<Switch>`                                           | `z.boolean()`                                               |

## E3. Delete guard

The skill's default soft-delete + undo toast is **disabled** here in favour of a
hard-block guard:

1. Server Action `softDeleteCategory` first runs `prisma.product.count({ where: { categoryId, deletedAt: null } })`.
2. If count > 0 → return `FormState` error `"Cannot delete: N active products are in this category."` The dialog shows the count and a "Cannot delete" headline, with a "Move products to another category" affordance.
3. The "Move products" affordance is **Phase 2** — listed in S8.
4. If count is 0 → proceed with the standard skill soft-delete + 5 s undo toast.

After every category mutation (create / update / delete / restore), the action
calls `revalidateTag('categories')` so the storefront footer
(`01-layout-header-footer.md` §B8) picks up the change instantly.

## E4. Files

Per skill convention with the `Category` resource:

```
src/app/admin/categories/
  page.tsx                            // Server — list
  new/page.tsx                        // Wrapper
  [id]/edit/page.tsx                  // Wrapper
  actions.ts                          // create / update / softDelete with the count guard
  schema.ts                           // CategorySchema
src/components/admin/
  CategoryListTable.tsx
  CategoryForm.tsx
  CategoryDeleteDialog.tsx
```

---

# SHARED REQUIREMENTS

## S1. Admin theme

Distinct from the storefront chrome — no maroon, no cream backgrounds.

| Element           | Token / class                                                   | Notes                                          |
| ----------------- | --------------------------------------------------------------- | ---------------------------------------------- |
| Page background   | `bg-white`                                                      | Default; never `bg-brand-cream`                |
| Borders           | `border-zinc-200`                                               | All table cells, card outlines                 |
| Body text         | `text-zinc-900` / `text-zinc-600` (muted)                       | Inter — same body font as storefront           |
| Page title `<h1>` | Playfair Display 700, `text-2xl`                                | Single carry-over from CLAUDE.md §3 typography |
| Buttons           | Shadcn `Button` variants (default, outline, destructive, ghost) | Primary = `bg-zinc-900 text-white`             |
| Inputs            | Shadcn `Input`                                                  | Default ring uses `ring-zinc-900`              |
| Status badges     | Shadcn `Badge` with the colour map per D4                       |                                                |
| Toasts            | `sonner` — bottom-right; respects `prefers-reduced-motion`      |                                                |

Shadcn components to add (per the admin-crud-page skill): `dialog table button input
label skeleton badge select switch textarea form sheet toast`.

## S2. Tech stack & conventions

| Concern       | Decision                                                                                                   |
| ------------- | ---------------------------------------------------------------------------------------------------------- |
| Data fetching | Server Components only — never client-side fetches for admin lists/detail                                  |
| Mutations     | Server Actions per `admin-crud-page` skill (`'use server'`, async `await cookies()`, Zod `safeParse`)      |
| ORM           | Prisma with indexes on every filter field (`isPublished`, `category`, `status`, `deletedAt`)               |
| Soft delete   | `deletedAt: DateTime?` on every domain table; queries scoped to `deletedAt: null`                          |
| Audit fields  | `createdAt`, `updatedAt`, `createdBy`, `updatedBy` on every domain table                                   |
| Caching       | None on `/admin/*` — always fresh; never `unstable_cache` here                                             |
| Revalidation  | Each mutation calls `revalidatePath('/admin/[resource]')` + tag invalidation for affected storefront pages |
| File upload   | Cloudinary signed upload (server mints signature); `CLOUDINARY_API_SECRET` never client-side               |

## S3. Performance

| Concern         | Decision                                                                           |
| --------------- | ---------------------------------------------------------------------------------- |
| List skeletons  | `app/admin/[resource]/loading.tsx` renders a skeleton table while data loads       |
| Stats skeletons | `StatsCard` renders a shimmer while its prop is undefined                          |
| Search debounce | 300 ms before URL update (CLAUDE.md §9)                                            |
| Pagination size | 25 per page across all admin list pages                                            |
| Delete dialog   | Dynamic import — only loaded when a delete is initiated                            |
| Image uploader  | Lazy import in `ProductForm` so the dropzone isn't shipped to non-form admin pages |
| Bundle target   | Admin shared chunk: `< 80 KB gzip` (Shadcn + RHF + sonner + zod combined)          |

## S4. Accessibility

| Requirement       | How                                                                                                     |
| ----------------- | ------------------------------------------------------------------------------------------------------- |
| Sidebar           | `<nav aria-label="Admin">`; active link has `aria-current="page"`                                       |
| Tables            | `<thead>` + `<th scope="col">`; sortable headers also have `aria-sort`                                  |
| Form labels       | Every input has a `<label htmlFor>`; required fields have `aria-required="true"` + visible asterisk     |
| Validation errors | Inline `id="<field>-error"` referenced by `aria-describedby`; focus jumps to first error on submit fail |
| Delete dialog     | `role="dialog" aria-modal="true"`; focus trap; Escape closes; focus returns to trigger                  |
| Status badges     | `aria-label` includes the textual status (colour is not the only signal)                                |
| Mobile drawer     | `role="dialog" aria-modal="true"` with focus trap; closes on backdrop + Escape                          |
| Reduced motion    | Sonner respects `prefers-reduced-motion`; Shadcn defaults already comply                                |
| Colour contrast   | All zinc-on-white and white-on-zinc combinations ≥ 4.5:1                                                |

## S5. Edge cases

| Case                                      | Expected                                                                                                                                                |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| No orders yet                             | Empty illustration + "No orders yet" in widget and list page                                                                                            |
| `product.stock === 0`                     | Red stock badge in list; surfaced in Low Stock widget; storefront marks "Out of stock" (per `03-product-system`)                                        |
| Category delete with existing products    | Hard-blocked at the action; dialog shows count + "Cannot delete" headline (E3)                                                                          |
| Image upload fails                        | Thumbnail shows error overlay + Retry; rest of the form retained; submit blocked until retry or remove                                                  |
| Session expires mid-form                  | Save form values to `localStorage` (key `admin-draft-<route>`); redirect to `/admin/login?reason=expired&callbackUrl=<current>`; restore on return      |
| Concurrent edit (two admins, same record) | Last-write-wins; server compares `updatedAt` from the form against the row — mismatch shows toast: "Another admin updated this. Refresh to see latest." |
| Slug collision                            | Zod refinement returns `errors.slug = ["Slug already in use"]`; inline field error                                                                      |
| Sale price ≥ price                        | Zod rejects on client and server; inline field error                                                                                                    |
| Bulk delete with referenced products      | Partial success; toast lists which products were blocked (per C5 guard)                                                                                 |
| Admin demoted to customer mid-session     | Next route navigation hits `proxy.ts` and redirects to `/admin/login?reason=forbidden` (role re-checked per request)                                    |

## S6. Test cases

### Vitest unit

- `productSchema` accepts valid input; rejects empty name, negative stock, salePrice ≥ price, slug with spaces.
- `categorySchema` enforces unique slug pattern.
- Status transition map: `pending → shipped` is rejected; `pending → processing` is accepted; `delivered → *` is rejected.
- `slugify(name)` is deterministic, lowercases, replaces spaces with `-`, strips diacritics.

### React Testing Library (component)

- **LoginForm** — submitting an invalid email shows inline error before hitting the action; rate-limit error renders with the "Try again in N minutes" copy.
- **ProductListTable** — checking the header checkbox selects every visible row; "Delete selected (N)" appears; pagination updates the URL.
- **ProductForm** — required field validation blocks submit; saved state shows success toast; cancel returns to the list.
- **ProductDeleteDialog** — focus is trapped while open; Escape closes; focus returns to the row's Delete button.
- **OrderStatusDropdown** — only allowed-transition options appear; selecting an invalid value disables the Update button.
- **CategoryDeleteDialog** — when count > 0, the dialog shows "Cannot delete" and the Delete button is disabled.

### Playwright E2E

1. **Login flow** — bad password 6× triggers rate-limit message; valid credentials land on `/admin/dashboard` with the admin's name in the top bar.
2. **Add + edit product** — create from `/admin/products/new` (form, image upload, submit); row appears in list; open and change price; list reflects update.
3. **Soft-delete + undo** — delete a product; toast appears; Undo restores the row.
4. **Block delete in active order** — try to delete a product referenced in a `processing` order; dialog blocks and offers Unpublish.
5. **Order status update** — move an order from `processing` → `shipped`; status badge updates and list reflects it.
6. **Category cache invalidation** — rename a category; reload the storefront `/` and confirm the footer column reflects the new name.
7. **Non-admin redirect** — log in as a customer, try to visit `/admin/products`; redirected to `/admin/login?reason=forbidden`.
8. **Session expiry preserves draft** — start editing a product, simulate session expiry, submit; redirected to login with `?reason=expired`; on re-login, draft is restored to the form.

## S7. Acceptance criteria

### Auth (Part A)

- [ ] `/admin/login` renders the form and supports email + password + remember-me + error states.
- [ ] NextAuth Credentials provider issues a 24 h JWT (30 d with remember-me).
- [ ] Rate limit blocks the 6th attempt per IP per 15 min window.
- [ ] `proxy.ts` redirects unauthenticated users to `/admin/login?callbackUrl=...`.
- [ ] Non-admin users hit the same login page (no role leak).

### Dashboard (Part B)

- [ ] `/admin/dashboard` renders sidebar + top bar + stats grid + widgets at all three breakpoints.
- [ ] All four stats cards show value, period label, and trend arrow.
- [ ] Recent Orders renders the 10 latest with row-level links to the detail page.
- [ ] Low Stock alerts list products with `stock < 5`.
- [ ] Quick Actions link to `/admin/products/new` and `/admin/orders`.

### Products CRUD (Part C)

- [ ] List page columns + filters + bulk delete match C2.
- [ ] Form fields + Zod validation match C3.
- [ ] Image upload allows up to 6 images via drag-drop with reorder; rejects > 5 MB; preserves form on failure.
- [ ] Soft delete with 5 s undo; blocked when product is in `pending`/`processing` orders.

### Orders (Part D)

- [ ] List page columns + filters match D2.
- [ ] Detail page renders customer info + line items + totals + status update + internal notes (D3).
- [ ] Status state machine enforces allowed transitions only (D4).
- [ ] Each transition revalidates the orders list cache.

### Categories CRUD (Part E)

- [ ] CRUD generated from `admin-crud-page` skill with the fields in E2.
- [ ] Delete is blocked when products in the category exist; dialog shows the count.
- [ ] Every mutation calls `revalidateTag('categories')`.

### Cross-cutting

- [ ] All `/admin/*` routes pass through `proxy.ts`; non-admins are redirected.
- [ ] No file exceeds 300 lines (CLAUDE.md §4).
- [ ] No `any` types without a justification comment.
- [ ] No raw `<img>` — `next/image` everywhere.
- [ ] All scripts pass: `pnpm lint`, `pnpm format:check`, `pnpm type-check`, `pnpm test`.
- [ ] Lighthouse a11y ≥ 95 on `/admin/dashboard`.

## S8. Out of scope (Phase 2 unless noted)

- **Analytics charts** — sparkline / bar charts on the dashboard. Phase 2.
- **CSV export** — exporting orders or product lists. Phase 2.
- **Admin user management UI** — for v1, admin users are inserted via `prisma/seed.ts` (one admin row at staging time). No `/admin/users` route. Phase 2.
- **Email templates editor** — for the order-confirmation / shipping emails. Phase 2.
- **Customer detail page** — `/admin/customers/[id]` deeper than the v1 read-only list. Phase 2.
- **"Move products to another category"** affordance on category delete. Phase 2.
- **Rich-text editor** for product description — v1 uses a plain `<Textarea>`. Phase 2.
- **Real-time concurrent-edit collaboration** — v1 uses last-write-wins with a toast (S5). Phase 2 if needed.
- **Audit log viewer** — `AuthAudit` rows are written but no UI for them in v1.

## S9. Implementation reference

- **Admin CRUD mechanics (table / form / delete dialog / Server Actions / Zod / proxy)** — `.claude/skills/admin-crud-page/` (SKILL.md + `server-actions.md` + `list-view.md` + `form.md` + `tests.md`).
- **Canonical Product / Dimensions / CartItem interfaces** — `docs/specs/03-product-system.md` §S1.
- **Storefront chrome boundary** — `docs/specs/01-layout-header-footer.md`. The admin shell at `app/admin/layout.tsx` is **separate** — do not import the storefront Header / Footer.
- **Categories cache invalidation pattern** — `docs/specs/01-layout-header-footer.md` §B8 (`revalidateTag('categories')`).
- **Order schema, payment flow, email templates** — future order / checkout / notifications specs (TBD).
