# List View — Page & Table Patterns

## Table of Contents
1. [Page Component Structure](#page-component-structure)
2. [ListTable Component Structure](#listtable-component-structure)
3. [Column Definition Pattern](#column-definition-pattern)
4. [Sortable Column Header](#sortable-column-header)
5. [Search Bar (Debounced)](#search-bar)
6. [Filter Patterns](#filter-patterns)
7. [Pagination](#pagination)
8. [Bulk Actions](#bulk-actions)
9. [Loading Skeleton](#loading-skeleton)
10. [Empty State](#empty-state)
11. [Breadcrumbs](#breadcrumbs)
12. [Add New Button](#add-new-button)

---

## Page Component Structure

```typescript
// src/app/admin/[resources]/page.tsx  ← Server Component
import { prisma } from '@/lib/prisma'
import { [Resource]ListTable } from '@/components/admin/[Resource]ListTable'

interface SearchParams {
  q?: string
  status?: string
  from?: string
  to?: string
  sort?: string
  dir?: 'asc' | 'desc'
  page?: string
  pageSize?: string
}

export default async function [Resource]sPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const page = Number(searchParams.page ?? 1)
  const pageSize = Number(searchParams.pageSize ?? 20)

  const where = {
    deletedAt: null,                         // ← always filter soft-deleted
    ...(searchParams.q && {
      OR: [
        { name: { contains: searchParams.q, mode: 'insensitive' } },
        // add other searchable fields here
      ],
    }),
    // status filter if your model has a status field:
    ...(searchParams.status && { status: searchParams.status }),
    // date range filter:
    ...(searchParams.from || searchParams.to ? {
      createdAt: {
        ...(searchParams.from && { gte: new Date(searchParams.from) }),
        ...(searchParams.to && { lte: new Date(searchParams.to) }),
      },
    } : {}),
  }

  const [items, total] = await prisma.$transaction([
    prisma.[resource].findMany({
      where,
      orderBy: { [searchParams.sort ?? 'createdAt']: searchParams.dir ?? 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.[resource].count({ where }),
  ])

  return (
    <main className="p-6">
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-stone-500">
        <ol className="flex items-center gap-1.5">
          <li><a href="/admin" className="hover:underline">Admin</a></li>
          <li aria-hidden="true">/</li>
          <li aria-current="page">[Resource]s</li>
        </ol>
      </nav>

      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-2xl text-[#1a1a1a]">[Resource]s</h1>
        <a
          href="/admin/[resources]/new"
          className="inline-flex items-center gap-2 bg-[#6B1F2E] text-white px-4 py-2 rounded hover:bg-[#5a1927] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6B1F2E]"
        >
          + Add [Resource]
        </a>
      </div>

      <[Resource]ListTable
        items={items}
        total={total}
        page={page}
        pageSize={pageSize}
      />
    </main>
  )
}
```

---

## ListTable Component Structure

```typescript
// src/components/admin/[Resource]ListTable.tsx
'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback, useTransition } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { [Resource]DeleteDialog } from './[Resource]DeleteDialog'
import type { [Resource] } from '@prisma/client'

interface [Resource]ListTableProps {
  items: [Resource][]
  total: number
  page: number
  pageSize: number
}

export function [Resource]ListTable({ items, total, page, pageSize }: [Resource]ListTableProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const pushParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString())
      for (const [key, val] of Object.entries(updates)) {
        if (val === null) params.delete(key)
        else params.set(key, val)
      }
      startTransition(() => router.push(`${pathname}?${params}`))
    },
    [pathname, router, searchParams],
  )

  // ... (search bar, filters, table, pagination — see sections below)
}
```

---

## Column Definition Pattern

```typescript
// Define columns as a typed array; drives both <th> headers and <td> cells
interface Column<T> {
  key: keyof T | string
  label: string
  sortable?: boolean
  render?: (item: T) => React.ReactNode
}

const COLUMNS: Column<[Resource]>[] = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'status', label: 'Status', render: (item) => <Badge>{item.status}</Badge> },
  { key: 'createdAt', label: 'Created', sortable: true, render: (item) =>
      new Date(item.createdAt).toLocaleDateString('en-PK') },
  // add resource-specific columns
]
```

---

## Sortable Column Header

```typescript
function SortableHeader({
  column,
  currentSort,
  currentDir,
  onSort,
}: {
  column: Column<any>
  currentSort: string
  currentDir: string
  onSort: (key: string) => void
}) {
  const isActive = currentSort === column.key
  const nextDir = isActive && currentDir === 'asc' ? 'desc' : 'asc'

  if (!column.sortable) return <th scope="col">{column.label}</th>

  return (
    <th scope="col">
      <button
        onClick={() => onSort(String(column.key))}
        className="flex items-center gap-1 hover:underline"
        aria-label={`Sort by ${column.label} ${isActive ? `(currently ${currentDir})` : ''}`}
      >
        {column.label}
        {isActive && <span aria-hidden="true">{currentDir === 'asc' ? '↑' : '↓'}</span>}
      </button>
    </th>
  )
}
```

---

## Search Bar

```typescript
// Debounce 300ms — do NOT push on every keystroke
import { useEffect, useRef, useState } from 'react'

function SearchBar({ defaultValue, onSearch }: { defaultValue: string; onSearch: (q: string) => void }) {
  const [value, setValue] = useState(defaultValue)
  const timer = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => onSearch(value), 300)
    return () => clearTimeout(timer.current)
  }, [value, onSearch])

  return (
    <label className="flex items-center gap-2">
      <span className="sr-only">Search [resource]s</span>
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search…"
        className="border rounded px-3 py-1.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6B1F2E]"
        data-testid="[resource]-search-input"
      />
    </label>
  )
}
```

---

## Filter Patterns

```typescript
// Status filter — use shadcn Select
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

function StatusFilter({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-36" aria-label="Filter by status">
        <SelectValue placeholder="All statuses" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="">All</SelectItem>
        <SelectItem value="ACTIVE">Active</SelectItem>
        <SelectItem value="DRAFT">Draft</SelectItem>
        <SelectItem value="ARCHIVED">Archived</SelectItem>
      </SelectContent>
    </Select>
  )
}

// Date range filter
function DateRangeFilter({
  from,
  to,
  onFromChange,
  onToChange,
}: {
  from: string
  to: string
  onFromChange: (v: string) => void
  onToChange: (v: string) => void
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <label htmlFor="date-from">From</label>
      <input id="date-from" type="date" value={from} onChange={(e) => onFromChange(e.target.value)}
        className="border rounded px-2 py-1" />
      <label htmlFor="date-to">To</label>
      <input id="date-to" type="date" value={to} onChange={(e) => onToChange(e.target.value)}
        className="border rounded px-2 py-1" />
    </div>
  )
}
```

---

## Pagination

```typescript
const totalPages = Math.ceil(total / pageSize)

function Pagination({
  page,
  totalPages,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: {
  page: number
  totalPages: number
  pageSize: number
  onPageChange: (p: number) => void
  onPageSizeChange: (s: number) => void
}) {
  return (
    <nav aria-label="Pagination" className="flex items-center justify-between mt-4 text-sm">
      <div className="flex items-center gap-2">
        <label htmlFor="page-size">Rows per page</label>
        <select
          id="page-size"
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="border rounded px-2 py-1"
        >
          {[10, 20, 50].map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>

      <div className="flex items-center gap-1" role="group" aria-label="Page navigation">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
          className="px-2 py-1 border rounded disabled:opacity-40"
        >
          ‹
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            aria-current={p === page ? 'page' : undefined}
            className={`px-3 py-1 border rounded ${p === page ? 'bg-[#6B1F2E] text-white' : 'hover:bg-stone-100'}`}
          >
            {p}
          </button>
        ))}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Next page"
          className="px-2 py-1 border rounded disabled:opacity-40"
        >
          ›
        </button>
      </div>
    </nav>
  )
}
```

---

## Bulk Actions

```typescript
// Checkbox column + select-all + bulk delete
const [selected, setSelected] = useState<Set<string>>(new Set())

function toggleAll(checked: boolean) {
  setSelected(checked ? new Set(items.map((i) => i.id)) : new Set())
}

function toggleOne(id: string) {
  setSelected((prev) => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })
}

// In table header:
<th scope="col">
  <input
    type="checkbox"
    aria-label="Select all"
    checked={selected.size === items.length && items.length > 0}
    onChange={(e) => toggleAll(e.target.checked)}
    data-testid="[resource]-select-all"
  />
</th>

// Bulk delete button (shown only when selection > 0):
{selected.size > 0 && (
  <button
    onClick={() => handleBulkDelete([...selected])}
    className="text-red-600 text-sm underline"
    data-testid="[resource]-bulk-delete"
  >
    Delete selected ({selected.size})
  </button>
)}
```

**Bulk delete Server Action:**
```typescript
// actions.ts — add alongside single-delete:
export async function bulkSoftDelete[Resource](ids: string[]): Promise<FormState> {
  const cookieStore = await cookies()
  const session = await getSession(cookieStore)
  if (!session?.user?.id) return { success: false, message: 'Unauthorized' }

  await prisma.[resource].updateMany({
    where: { id: { in: ids }, deletedAt: null },
    data: { deletedAt: new Date(), updatedBy: session.user.id },
  })

  revalidatePath('/admin/[resources]')
  return { success: true, message: `${ids.length} records deleted` }
}
```

---

## Loading Skeleton

```typescript
// Shown when isPending (useTransition) is true during navigation
function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <table className="w-full" aria-busy="true" aria-label="Loading [resource]s">
      <tbody>
        {Array.from({ length: rows }).map((_, r) => (
          <tr key={r} className="border-b">
            {Array.from({ length: cols }).map((_, c) => (
              <td key={c} className="py-3 px-4">
                <Skeleton className="h-4 w-full rounded" />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

// Usage in ListTable — wrap table with conditional:
{isPending ? <TableSkeleton /> : (
  <table data-testid="[resource]-table" ...>
    ...
  </table>
)}
```

---

## Empty State

```typescript
// Show when items.length === 0 after data load
function EmptyState() {
  return (
    <div
      className="flex flex-col items-center justify-center py-20 text-center"
      data-testid="[resource]-empty-state"
    >
      {/* Simple SVG placeholder — replace with actual illustration if available */}
      <svg width="80" height="80" viewBox="0 0 80 80" aria-hidden="true" className="text-stone-300 mb-4">
        <rect width="80" height="80" rx="8" fill="currentColor" opacity="0.3" />
        <path d="M24 40h32M40 24v32" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
      <p className="text-stone-500 text-sm mb-4">No [resource]s found. Get started by adding one.</p>
      <a
        href="/admin/[resources]/new"
        className="inline-flex items-center gap-2 bg-[#6B1F2E] text-white px-4 py-2 rounded text-sm hover:bg-[#5a1927]"
      >
        + Add [Resource]
      </a>
    </div>
  )
}
```

---

## Breadcrumbs

Always render above `<h1>`. Pattern shown in [Page Component Structure](#page-component-structure).
- Use semantic `<nav aria-label="Breadcrumb">` → `<ol>` → `<li>`
- Last item: `aria-current="page"`, not a link
- Separator: `aria-hidden="true"`

---

## Add New Button

- Top right of the page, beside `<h1>`
- `href="/admin/[resources]/new"` — NOT a `<button>` (it navigates)
- Maroon background: `bg-[#6B1F2E]`, white text
- Focus ring: `focus-visible:ring-2 focus-visible:ring-[#6B1F2E]`
- `data-testid="[resource]-add-new"`

---

## Full Table Markup Pattern

```tsx
<div className="overflow-x-auto rounded border">
  <table
    className="w-full text-sm"
    data-testid="[resource]-table"
    role="grid"           // ← role="grid" because rows have interactive cells
  >
    <thead className="bg-stone-50 text-stone-600">
      <tr>
        <th scope="col" className="w-10 px-4 py-3">
          {/* select-all checkbox */}
        </th>
        {COLUMNS.map((col) => (
          <SortableHeader key={String(col.key)} column={col} ... />
        ))}
        <th scope="col" className="px-4 py-3">Actions</th>
      </tr>
    </thead>
    <tbody>
      {items.map((item) => (
        <tr key={item.id} className="border-t hover:bg-stone-50">
          <td className="px-4 py-3">
            <input type="checkbox" aria-label={`Select ${item.name}`} ... />
          </td>
          {COLUMNS.map((col) => (
            <td key={String(col.key)} className="px-4 py-3">
              {col.render ? col.render(item) : String(item[col.key as keyof typeof item])}
            </td>
          ))}
          <td className="px-4 py-3 flex gap-2">
            <a
              href={`/admin/[resources]/${item.id}/edit`}
              className="text-[#6B1F2E] hover:underline text-sm"
              data-testid={`[resource]-edit-${item.id}`}
            >
              Edit
            </a>
            <[Resource]DeleteDialog id={item.id} name={item.name} />
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

---

## Keeping Current

| Trigger | Section to Update |
|---|---|
| Shadcn Table or Select API change | Column Definition Pattern and Filter Patterns |
| Next.js `useRouter`/`useSearchParams` API change | ListTable Component Structure |
| Prisma `findMany`/`$transaction` API change | Page Component Structure |
| Design system color change | All hardcoded hex values |

Last verified: 2026-05
