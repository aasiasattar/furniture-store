---
name: furniture-product-card
description: "Generates a complete, production-ready ProductCard component for the furniture-store project. This skill should be used when creating any product card, product preview, product tile, product thumbnail, or product listing item — regardless of how the request is phrased. This skill should be used for new ProductCard components, variants (Compact, Featured, related), and refactoring existing product card code to meet project standards. This skill should not be used for admin-facing product tables or views outside the customer-facing storefront."
---

# Furniture Product Card

Produce two files every time this skill is invoked:

1. `src/components/product/ProductCard.tsx` — the React component
2. `src/components/product/ProductCard.test.tsx` — the co-located test file

If a variant is requested (e.g. `CompactProductCard`, `FeaturedProductCard`), apply the same rules and place both files in `src/components/product/`.

## Out of Scope

This skill renders the card UI only. It does NOT:
- Manage cart state — call `onWishlistToggle` / `onQuickView` props only; do not wire to any store
- Implement the Quick View modal — that is the caller's responsibility
- Handle wishlist API calls — pass the toggle handler as a prop
- Build admin-facing product cards — that is a separate component

## Reference Files

| File | Read When |
|---|---|
| `references/spec.md` | Every invocation — canonical `Product` interface, design tokens, visual requirements, accessibility checklist, test checklist |

## Variability Analysis

| What VARIES (ask user or infer) | What is CONSTANT (encoded in this skill) |
|---|---|
| Variant (Default / Compact / Featured) | `Product` TypeScript interface — never alter the shape |
| Above-the-fold (`priority` prop) | Colour palette — only the 5 tokens from CLAUDE.md |
| Existing file vs new creation | Spacing — 8px grid, Tailwind multiples of 2 only |
| Custom `className` for layout integration | Accessibility — WCAG 2.1 AA, all ARIA patterns |
| | Animation — `useReducedMotion` guard always required |
| | Test coverage — all 20 checklist items are mandatory |

## Required Dependencies

Ensure these packages are installed before generating code:

| Package | Version | Purpose | Changelog |
|---|---|---|---|
| `framer-motion` | v10+ | `useReducedMotion` hook | https://github.com/framer/motion/releases |
| `@heroicons/react` | v2 | `HeartIcon` (outline + solid) | https://github.com/tailwindlabs/heroicons/releases |
| `next` | 16 | `next/image`, `next/link` | https://github.com/vercel/next.js/releases |
| `@testing-library/react` | latest | Component tests | https://github.com/testing-library/react-testing-library/releases |
| `@testing-library/user-event` | latest | Interaction simulation | https://github.com/testing-library/user-event/releases |

If any are missing, tell the user to run `pnpm add <package>` before proceeding.

## Required Clarifications

Before writing any code, check conversation history for answers. Only ask what cannot be inferred:

1. **Variant**: Which variant should be built?
   - `Default` — full card (image, badges, wishlist, name, price, rating, stock, Quick View)
   - `Compact` — image + name + price only, no Quick View, no rating, no stock counter
   - `Featured` — full card with larger image (`aspect-[3/4]`) and optional short description
   - If not specified: build `Default` and note the assumption

2. **Above the fold**: Will this card appear in the first visible viewport (hero section, first product row)?
   - `Yes` → add `priority` prop to the primary `<Image>` component
   - `No` → leave as lazy-loaded (default)
   - If not specified: assume `No` (lazy load) and note the assumption

## Optional Clarifications

3. **Custom className**: Is a custom `className` needed for layout integration (e.g. inside a grid)?
   - If yes: note it — the prop is already defined in `ProductCardProps`
   - If not mentioned: omit from usage examples

## Automated Check (no need to ask)

4. **Existing file**: Check if `src/components/product/ProductCard.tsx` already exists.
   - If it exists: read it first, then refactor to match spec — do NOT overwrite without confirming
   - If it does not exist: create fresh

## Before Implementation

Gather context from all available sources before writing code:

| Source | What to Gather |
|---|---|
| **Codebase** | Check `src/components/product/` for existing `ProductCard.tsx` — refactor rather than overwrite. Grep `src/` for `ProductCard` to find all import sites before refactoring |
| **Conversation** | Variant, above-the-fold status, custom className, any design overrides discussed |
| **Skill References** | Read `references/spec.md` — canonical `Product` interface, design tokens, all requirements |
| **CLAUDE.md** | Confirm `font-heading` and `font-body` Tailwind aliases are configured in the project |

Do not rely on memory for design tokens, interfaces, or accessibility rules. Always read `references/spec.md` fresh.

## Workflow

### 1. Read the spec
Load `references/spec.md`. Confirm you have the `Product` interface and all requirement sections before proceeding.

### 2. Determine the variant
- **Default** — full ProductCard as specified in the spec
- **Compact** — image + name + price only, no Quick View, no rating
- **Featured** — full card plus larger image and optional short description

If the user has not specified, build the default.

### 3. Generate ProductCard.tsx
Follow this sequence strictly:

1. Write the `Product` TypeScript interface (from spec — do not alter the shape)
2. Write component props interface (`ProductCardProps`)
3. Implement `useReducedMotion` import from `framer-motion` for animation guard
4. Build the image section (next/image, hover zoom, image swap, badges, wishlist)
5. Build the card body (name, price, rating, stock counter)
6. Build the hover overlay (Quick View button)
7. Wire keyboard accessibility throughout
8. Verify every design token is from the palette in the spec — no ad-hoc colours

### 4. Generate ProductCard.test.tsx
Cover every item in the test checklist in `references/spec.md`. Do not skip edge cases.

### 5. Self-check before outputting

- [ ] `Product` interface matches spec exactly — no missing or renamed fields
- [ ] Only palette colours used (no raw Tailwind colours like `bg-white`, `text-gray-500`)
- [ ] `next/image` used — no `<img>` tag
- [ ] `useReducedMotion` guards all Framer Motion animations
- [ ] All interactive elements have keyboard handlers and ARIA attributes
- [ ] `data-testid` attributes are present on elements referenced in tests
- [ ] No `any` type without a justification comment
- [ ] Test file covers happy path, edge cases, and error/empty states
