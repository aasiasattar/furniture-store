# Form & Delete Dialog Patterns

## Table of Contents
1. [Form Component Structure](#form-component-structure)
2. [React Hook Form Setup](#react-hook-form-setup)
3. [Controlled Field Pattern](#controlled-field-pattern)
4. [useActionState Hook](#useactionstate-hook)
5. [Submit Handler Pattern](#submit-handler-pattern)
6. [Cloudinary Upload Widget](#cloudinary-upload-widget)
7. [Field-Level Error Display](#field-level-error-display)
8. [Disabled State During Submission](#disabled-state-during-submission)
9. [Redirect After Success](#redirect-after-success)
10. [Cancel and Reset Buttons](#cancel-and-reset-buttons)
11. [Delete Dialog Structure](#delete-dialog-structure)
12. [Undo Toast Pattern](#undo-toast-pattern)

---

## Form Component Structure

```typescript
// src/components/admin/[Resource]Form.tsx
'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useActionState } from 'react'         // ← from 'react', NOT react-dom
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { [Resource]Schema, type [Resource]FormValues } from '@/app/admin/[resources]/schema'
import { create[Resource], update[Resource] } from '@/app/admin/[resources]/actions'
import type { [Resource] } from '@prisma/client'

interface [Resource]FormProps {
  mode: 'create' | 'edit'
  [resource]?: [Resource]          // only present in edit mode
}

export function [Resource]Form({ mode, [resource] }: [Resource]FormProps) {
  const router = useRouter()

  const action = mode === 'create'
    ? create[Resource]
    : (data: [Resource]FormValues) => update[Resource]([resource]!.id, data)

  const [state, formAction, isPending] = useActionState(action, {
    success: false,
    errors: undefined,
    message: undefined,
  })

  const form = useForm<[Resource]FormValues>({
    resolver: zodResolver([Resource]Schema),
    defaultValues: [resource]
      ? { /* map [resource] fields to form values */ }
      : { /* empty defaults matching schema */ },
  })

  // Redirect on success
  useEffect(() => {
    if (state.success) {
      toast.success(mode === 'create' ? '[Resource] created!' : '[Resource] updated!')
      router.push('/admin/[resources]')
    }
  }, [state.success, mode, router])

  return (
    <form
      action={form.handleSubmit((data) => formAction(data)) as unknown as string}
      onSubmit={form.handleSubmit((data) => formAction(data))}
      className="space-y-4 max-w-2xl"
      data-testid="[resource]-form"
    >
      <h1 className="font-heading text-2xl text-[#1a1a1a]">
        {mode === 'create' ? 'New [Resource]' : 'Edit [Resource]'}
      </h1>

      {/* Global error */}
      {state.message && !state.success && (
        <p role="alert" className="text-red-600 text-sm">{state.message}</p>
      )}

      {/* Fields go here — see Controlled Field Pattern */}

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="bg-[#6B1F2E] text-white px-5 py-2 rounded hover:bg-[#5a1927] disabled:opacity-50"
          data-testid="[resource]-submit"
        >
          {isPending ? 'Saving…' : mode === 'create' ? 'Create [Resource]' : 'Save Changes'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-5 py-2 rounded border hover:bg-stone-50"
          data-testid="[resource]-cancel"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
```

---

## React Hook Form Setup

```typescript
// Zod schema is the SINGLE source of truth for validation
// Use the same schema exported from schema.ts — never duplicate validation logic

const form = useForm<[Resource]FormValues>({
  resolver: zodResolver([Resource]Schema),
  defaultValues: {
    name: [resource]?.name ?? '',
    price: [resource]?.price ?? 0,
    description: [resource]?.description ?? '',
    // map every field in [Resource]Schema with a safe default
  },
})

const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = form
```

**Rule:** Never skip `defaultValues` in edit mode — RHF initializes uncontrolled fields to `undefined` otherwise, causing controlled/uncontrolled switch warnings.

---

## Controlled Field Pattern

```tsx
{/* String field */}
<div className="space-y-1">
  <label htmlFor="name" className="text-sm font-medium text-stone-700">
    Name <span aria-hidden="true" className="text-red-500">*</span>
  </label>
  <input
    id="name"
    type="text"
    {...register('name')}
    disabled={isPending}
    className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6B1F2E] disabled:opacity-50"
    data-testid="[resource]-name-input"
  />
  <FieldError error={errors.name} />
</div>

{/* Number field */}
<div className="space-y-1">
  <label htmlFor="price" className="text-sm font-medium text-stone-700">Price (PKR)</label>
  <input
    id="price"
    type="number"
    step="1"
    min="0"
    {...register('price', { valueAsNumber: true })}   // ← valueAsNumber for Int/Float fields
    disabled={isPending}
    className="w-full border rounded px-3 py-2 text-sm disabled:opacity-50"
    data-testid="[resource]-price-input"
  />
  <FieldError error={errors.price} />
</div>

{/* Select / enum field */}
<div className="space-y-1">
  <label htmlFor="status" className="text-sm font-medium text-stone-700">Status</label>
  <select
    id="status"
    {...register('status')}
    disabled={isPending}
    className="w-full border rounded px-3 py-2 text-sm disabled:opacity-50"
    data-testid="[resource]-status-select"
  >
    <option value="DRAFT">Draft</option>
    <option value="ACTIVE">Active</option>
    <option value="ARCHIVED">Archived</option>
  </select>
  <FieldError error={errors.status} />
</div>

{/* Boolean field */}
<div className="flex items-center gap-2">
  <input
    id="isOnSale"
    type="checkbox"
    {...register('isOnSale')}
    disabled={isPending}
    data-testid="[resource]-isOnSale-checkbox"
  />
  <label htmlFor="isOnSale" className="text-sm text-stone-700">On Sale</label>
</div>
```

---

## useActionState Hook

```typescript
// ✅ Correct — React 19 API
import { useActionState } from 'react'

// ❌ Wrong — deprecated in React 19 / removed from react-dom
// import { useFormState } from 'react-dom'

// Signature:
// const [state, dispatchAction, isPending] = useActionState(action, initialState)
// - state: the FormState returned by the last Server Action call
// - dispatchAction: the function to call — pass it the form data
// - isPending: true while the Server Action is executing

const [state, formAction, isPending] = useActionState(
  create[Resource],
  { success: false, errors: undefined, message: undefined },
)
```

**Wire to RHF submit handler:**
```typescript
const onSubmit = form.handleSubmit((data) => {
  formAction(data)   // ← pass validated form data to the Server Action
})
```

---

## Submit Handler Pattern

```typescript
// RHF validates client-side first, then calls the Server Action
// Server Action validates again with safeParse (defense-in-depth)

<form onSubmit={form.handleSubmit((data) => formAction(data))}>
```

**Error priority:**
1. Client-side RHF/Zod errors (`errors.fieldName`) — shown immediately, no server round-trip
2. Server-side field errors (`state.errors?.fieldName`) — shown after submission if server catches something the client didn't
3. Global server message (`state.message`) — shown for auth failures or unexpected errors

```tsx
// Show server-side field errors if client-side passed but server failed
<FieldError error={errors.name ?? (state.errors?.name ? { message: state.errors.name[0] } : undefined)} />
```

---

## Cloudinary Upload Widget

Only include if image upload feature was requested.

```typescript
// Install: pnpm add next-cloudinary
import { CldUploadWidget } from 'next-cloudinary'

// In form body:
<div className="space-y-1">
  <label className="text-sm font-medium text-stone-700">Images</label>
  <CldUploadWidget
    uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_PRESET}
    onSuccess={(result) => {
      const url = (result.info as { secure_url: string }).secure_url
      setValue('imageUrl', url)   // register 'imageUrl' in the Zod schema
    }}
  >
    {({ open }) => (
      <button
        type="button"
        onClick={() => open()}
        disabled={isPending}
        className="border-2 border-dashed rounded px-4 py-3 text-sm text-stone-500 hover:bg-stone-50"
        data-testid="[resource]-image-upload"
      >
        Upload Image
      </button>
    )}
  </CldUploadWidget>
  {watch('imageUrl') && (
    <img src={watch('imageUrl')} alt="Preview" className="mt-2 h-32 object-cover rounded" />
  )}
  <FieldError error={errors.imageUrl} />
</div>
```

---

## Field-Level Error Display

```tsx
// Reusable helper — put near the top of the form file or in ui/
function FieldError({ error }: { error?: { message?: string } }) {
  if (!error?.message) return null
  return (
    <p role="alert" className="text-red-500 text-xs mt-0.5">
      {error.message}
    </p>
  )
}
```

---

## Disabled State During Submission

All interactive elements must be disabled while `isPending` is true:
- All `<input>`, `<select>`, `<textarea>` — add `disabled={isPending}`
- Submit button — shows "Saving…" text and `disabled={isPending}`
- Cancel button — may stay enabled (lets user abort) but visually indicate loading
- Image upload widget — `disabled={isPending}`

```tsx
<button type="submit" disabled={isPending}>
  {isPending ? (
    <>
      <span className="sr-only">Saving, please wait</span>
      <span aria-hidden="true">Saving…</span>
    </>
  ) : 'Save Changes'}
</button>
```

---

## Redirect After Success

```typescript
// Redirect inside useEffect, not synchronously — avoids React state update during render
useEffect(() => {
  if (state.success) {
    toast.success(mode === 'create' ? '[Resource] created!' : '[Resource] updated!')
    router.push('/admin/[resources]')
  }
}, [state.success])   // ← dependency on state.success, not state itself
```

---

## Cancel and Reset Buttons

```tsx
{/* Cancel — go back, no changes */}
<button type="button" onClick={() => router.back()} data-testid="[resource]-cancel">
  Cancel
</button>

{/* Reset — clear form to defaults (only in create mode; edit mode should Cancel) */}
{mode === 'create' && (
  <button type="button" onClick={() => reset()} data-testid="[resource]-reset">
    Reset
  </button>
)}
```

---

## Delete Dialog Structure

```tsx
// src/components/admin/[Resource]DeleteDialog.tsx
'use client'

import { useState, useRef } from 'react'
import { useTransition } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { softDelete[Resource], restore[Resource] } from '@/app/admin/[resources]/actions'

interface [Resource]DeleteDialogProps {
  id: string
  name: string
  cascadeWarning?: string   // e.g. "Deleting this category will orphan its products."
}

export function [Resource]DeleteDialog({ id, name, cascadeWarning }: [Resource]DeleteDialogProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const triggerRef = useRef<HTMLButtonElement>(null)

  function handleDelete() {
    startTransition(async () => {
      const result = await softDelete[Resource](id)
      if (!result.success) {
        toast.error(result.message ?? 'Delete failed')
        return
      }
      setOpen(false)
      triggerRef.current?.focus()   // ← return focus to trigger on close

      // Undo toast — 5-second window
      toast(`"${name}" deleted`, {
        duration: 5000,
        action: {
          label: 'Undo',
          onClick: () => restore[Resource](id),
        },
      })
    })
  }

  return (
    <>
      <button
        ref={triggerRef}
        onClick={() => setOpen(true)}
        className="text-red-600 text-sm hover:underline"
        aria-label={`Delete ${name}`}
        data-testid={`[resource]-delete-${id}`}
      >
        Delete
      </button>

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) triggerRef.current?.focus() }}>
        <DialogContent data-testid="[resource]-delete-dialog">
          <DialogHeader>
            <DialogTitle>Delete {name}?</DialogTitle>
            <DialogDescription>
              This action can be undone within 5 seconds.
              {cascadeWarning && (
                <span className="block mt-1 text-amber-700">{cascadeWarning}</span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              type="button"
              onClick={() => { setOpen(false); triggerRef.current?.focus() }}
              data-testid="[resource]-delete-cancel"
              className="px-4 py-2 border rounded text-sm hover:bg-stone-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isPending}
              data-testid="[resource]-delete-confirm"
              className="px-4 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:opacity-50"
            >
              {isPending ? 'Deleting…' : 'Delete'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
```

**Focus management checklist:**
- [ ] Trigger button stored in `triggerRef`
- [ ] `onOpenChange` calls `triggerRef.current?.focus()` when dialog closes
- [ ] `handleDelete` also calls `triggerRef.current?.focus()` after close
- [ ] Dialog has `data-testid="[resource]-delete-dialog"`

---

## Undo Toast Pattern

```typescript
// sonner toast with action button — 5-second window
import { toast } from 'sonner'

// After successful soft delete:
toast(`"${name}" deleted`, {
  duration: 5000,
  action: {
    label: 'Undo',
    onClick: async () => {
      const result = await restore[Resource](id)
      if (result.success) toast.success(`"${name}" restored`)
      else toast.error('Restore failed')
    },
  },
})
```

**Rules:**
- Soft delete does NOT redirect — caller shows undo toast first
- Hard delete disables undo — do NOT use `prisma.[resource].delete()`
- Toast duration must be exactly 5000ms — not configurable per resource

---

## Keeping Current

| Trigger | Section to Update |
|---|---|
| React 19 `useActionState` signature change | `useActionState Hook` section |
| Shadcn Dialog API change | `Delete Dialog Structure` |
| sonner API change | `Undo Toast Pattern` |
| `@hookform/resolvers` zodResolver API change | `React Hook Form Setup` |
| next-cloudinary API change | `Cloudinary Upload Widget` |

Last verified: 2026-05
