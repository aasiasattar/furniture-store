# Test Coverage Checklists

## Table of Contents

1. [Test Setup & Conventions](#test-setup--conventions)
2. [List Table Tests](#list-table-tests)
3. [Form Tests](#form-tests)
4. [Delete Dialog Tests](#delete-dialog-tests)
5. [Server Actions Tests](#server-actions-tests)
6. [Page (Route) Tests](#page-route-tests)
7. [Schema Tests](#schema-tests)

---

## Test Setup & Conventions

```typescript
// Co-located test files:
// src/components/admin/[Resource]ListTable.test.tsx
// src/components/admin/[Resource]Form.test.tsx
// src/components/admin/[Resource]DeleteDialog.test.tsx
// src/app/admin/[resources]/actions.test.ts
// src/app/admin/[resources]/page.test.tsx     (optional — route wrapper)
// src/app/admin/[resources]/schema.test.ts

// Tools:
// - Vitest (unit + component)
// - React Testing Library (component)
// - Mock all external: prisma, cookies(), getSession(), sonner toast, next/navigation
```

**Standard mock block for actions tests:**

```typescript
import { vi } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    [resource]: {
      create: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({ get: vi.fn() }),
}));

vi.mock('@/lib/auth', () => ({
  getSession: vi.fn().mockResolvedValue({ user: { id: 'user-123' } }),
}));

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next/navigation', () => ({ redirect: vi.fn() }));
```

**Standard mock block for component tests:**

```typescript
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/admin/[resources]',
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
```

---

## List Table Tests

**File:** `src/components/admin/[Resource]ListTable.test.tsx`

### Render

- [ ] Renders table with correct `data-testid="[resource]-table"` attribute
- [ ] Renders a row for each item in the `items` prop
- [ ] Renders column headers matching `COLUMNS` array
- [ ] Renders "Edit" link pointing to `/admin/[resources]/{id}/edit` per row
- [ ] Renders `[Resource]DeleteDialog` trigger per row

### Search

- [ ] Search input renders with `data-testid="[resource]-search-input"`
- [ ] Typing updates `q` in URL after 300ms debounce (use `vi.useFakeTimers`)
- [ ] Clearing search removes `q` from URL

### Sort

- [ ] Clicking a sortable column header updates `sort` and `dir` in URL
- [ ] Clicking the same header again toggles `dir` between `asc` and `desc`
- [ ] Active sort header shows directional indicator (↑ / ↓)

### Pagination

- [ ] Renders correct total page count from `total` / `pageSize`
- [ ] Current page button has `aria-current="page"`
- [ ] Previous button is disabled on page 1
- [ ] Next button is disabled on last page
- [ ] Clicking a page number updates `page` in URL
- [ ] Changing page size updates `pageSize` in URL

### Bulk Actions

- [ ] Select-all checkbox selects all visible rows
- [ ] Deselecting one row unchecks the select-all
- [ ] Bulk delete button appears only when selection > 0
- [ ] Bulk delete button shows count of selected items
- [ ] Clicking bulk delete calls `bulkSoftDelete[Resource]` with all selected IDs

### Empty State

- [ ] Renders `data-testid="[resource]-empty-state"` when `items` is empty
- [ ] Empty state contains an "Add [Resource]" CTA link

### Skeleton / Pending

- [ ] While `isPending` is true (useTransition), renders `TableSkeleton` instead of table
- [ ] `aria-busy="true"` on skeleton container

---

## Form Tests

**File:** `src/components/admin/[Resource]Form.test.tsx`

### Render — Create Mode

- [ ] Renders heading "New [Resource]"
- [ ] All required fields render with associated `<label>` (`htmlFor` matches `id`)
- [ ] Submit button text is "Create [Resource]"
- [ ] Form has `data-testid="[resource]-form"`

### Render — Edit Mode

- [ ] Renders heading "Edit [Resource]"
- [ ] Fields pre-populated with values from the `[resource]` prop
- [ ] Submit button text is "Save Changes"

### Client-Side Validation

- [ ] Submitting with empty required fields shows inline error messages
- [ ] Error messages appear adjacent to their respective field (not just a global banner)
- [ ] Error messages are accessible via `role="alert"`

### Submit — Success

- [ ] Submitting valid data calls the correct Server Action (create vs update)
- [ ] Shows success toast on `state.success = true`
- [ ] Calls `router.push('/admin/[resources]')` after success

### Submit — Server Error

- [ ] Global server message renders when `state.message` is set and `state.success = false`
- [ ] Server field errors are displayed beside the relevant fields

### Disabled State

- [ ] All inputs are disabled while `isPending` is true
- [ ] Submit button shows "Saving…" text while `isPending` is true

### Cancel

- [ ] Clicking Cancel calls `router.back()`

### Reset (create mode only)

- [ ] Clicking Reset clears all fields back to empty defaults

---

## Delete Dialog Tests

**File:** `src/components/admin/[Resource]DeleteDialog.test.tsx`

### Open / Close

- [ ] Dialog is closed by default
- [ ] Clicking the trigger button opens the dialog
- [ ] Dialog has `data-testid="[resource]-delete-dialog"`
- [ ] Dialog title shows `"Delete {name}?"`
- [ ] Dialog description mentions 5-second undo window

### Cascade Warning

- [ ] When `cascadeWarning` prop is provided, warning text is visible in the dialog
- [ ] When `cascadeWarning` is not provided, no warning element is rendered

### Cancel

- [ ] Clicking Cancel button closes the dialog
- [ ] Focus returns to the trigger button after cancel

### Confirm Delete

- [ ] Clicking Delete button calls `softDelete[Resource]` with the correct `id`
- [ ] Delete button shows "Deleting…" text while `isPending`
- [ ] On success: dialog closes
- [ ] On success: undo toast fires with 5000ms duration
- [ ] On success: focus returns to trigger button
- [ ] On error: error toast fires with `result.message`

### Undo Toast

- [ ] Clicking Undo in the toast calls `restore[Resource]` with the correct `id`
- [ ] Successful restore shows a success toast
- [ ] Failed restore shows an error toast

---

## Server Actions Tests

**File:** `src/app/admin/[resources]/actions.test.ts`

### `create[Resource]`

- [ ] Returns `{ success: false, message: 'Unauthorized' }` when no session
- [ ] Returns `{ success: false, errors: {...} }` when Zod validation fails
- [ ] Calls `prisma.[resource].create` with validated data + `createdBy` + `updatedBy`
- [ ] Calls `revalidatePath('/admin/[resources]')` on success
- [ ] Calls `redirect('/admin/[resources]')` on success

### `update[Resource]`

- [ ] Returns `{ success: false, message: 'Unauthorized' }` when no session
- [ ] Returns `{ success: false, errors: {...} }` when Zod validation fails
- [ ] Calls `prisma.[resource].update` with `where: { id, deletedAt: null }`
- [ ] Includes `updatedBy: session.user.id` in the update data
- [ ] Includes `updatedAt: new Date()` in the update data
- [ ] Calls `revalidatePath` and `redirect` on success

### `softDelete[Resource]`

- [ ] Returns `{ success: false, message: 'Unauthorized' }` when no session
- [ ] Calls `prisma.[resource].update` with `data: { deletedAt: new Date() }` — NOT `.delete()`
- [ ] Includes `updatedBy` in the update data
- [ ] Calls `revalidatePath('/admin/[resources]')` — does NOT redirect
- [ ] Returns `{ success: true }` on success

### `restore[Resource]`

- [ ] Returns `{ success: false, message: 'Unauthorized' }` when no session
- [ ] Calls `prisma.[resource].update` with `data: { deletedAt: null }`
- [ ] Returns `{ success: true }` on success

### `bulkSoftDelete[Resource]` (if implemented)

- [ ] Calls `prisma.[resource].updateMany` with `id: { in: ids }`
- [ ] All records in the batch get `deletedAt: new Date()` and `updatedBy`

---

## Page (Route) Tests

**File:** `src/app/admin/[resources]/page.test.tsx`

These are Server Component tests — render with async rendering utilities.

- [ ] Fetches `[resource].findMany` with `deletedAt: null` filter
- [ ] Passes `items`, `total`, `page`, `pageSize` to `[Resource]ListTable`
- [ ] Applies `q` searchParam to Prisma `OR` filter
- [ ] Applies `sort`/`dir` searchParams to Prisma `orderBy`
- [ ] Applies `from`/`to` to `createdAt` date range filter
- [ ] Renders breadcrumb with link to `/admin`
- [ ] Renders "Add [Resource]" link pointing to `/admin/[resources]/new`

---

## Schema Tests

**File:** `src/app/admin/[resources]/schema.test.ts`

```typescript
import { [Resource]Schema } from './schema'

describe('[Resource]Schema', () => {
  it('accepts valid input', () => {
    const result = [Resource]Schema.safeParse({ /* valid data */ })
    expect(result.success).toBe(true)
  })

  it('rejects empty required string fields', () => {
    const result = [Resource]Schema.safeParse({ name: '' })
    expect(result.success).toBe(false)
    expect(result.error?.flatten().fieldErrors.name).toBeDefined()
  })

  it('rejects negative price', () => {
    const result = [Resource]Schema.safeParse({ price: -1 })
    expect(result.success).toBe(false)
  })

  it('coerces numeric strings for number fields', () => {
    const result = [Resource]Schema.safeParse({ price: '100' })
    // If using z.coerce.number(), this should pass
  })

  // Add one test per Zod constraint — min, max, uuid, enum, etc.
})
```

---

## Keeping Current

| Trigger                                  | Section to Update                                     |
| ---------------------------------------- | ----------------------------------------------------- |
| Vitest major version bump                | Test Setup & Conventions — re-verify `vi.mock` syntax |
| React Testing Library major version bump | All component test sections                           |
| sonner API change                        | Delete Dialog Tests — undo toast assertions           |
| Prisma mock pattern change               | Server Actions Tests — mock block                     |

Last verified: 2026-05
