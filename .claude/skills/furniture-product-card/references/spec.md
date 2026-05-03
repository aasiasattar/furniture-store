# ProductCard Component Spec

## Official Documentation

| Resource | URL | Use For |
|---|---|---|
| `next/image` | https://nextjs.org/docs/app/api-reference/components/image | Image optimization, `priority`, `sizes`, `fill`, `remotePatterns` |
| `useReducedMotion` | https://www.framer.com/motion/use-reduced-motion/ | Accessibility guard for all Framer Motion animations |
| React Testing Library | https://testing-library.com/docs/react-testing-library/intro/ | Component testing patterns, query priority |
| Heroicons v2 | https://heroicons.com/ | `HeartIcon` (outline + solid), install command, icon names |
| WCAG 2.1 AA | https://www.w3.org/WAI/WCAG21/quickref/ | Colour contrast ratios, keyboard navigation, ARIA patterns |

For patterns not covered in this spec, fetch from the relevant official docs above before making assumptions.
Example: to verify `next/image` `sizes` prop values for a responsive grid, fetch the `next/image` URL above rather than guessing.

---

## TypeScript Interface

```typescript
interface Product {
  id: string
  slug: string
  name: string
  price: number            // base price in PKR
  salePrice?: number       // discounted price; present means item is on sale
  images: string[]         // Cloudinary URLs; images[0] = primary, images[1] = hover swap
  rating: number           // 0–5, one decimal place
  reviewCount: number
  stock: number            // units remaining
  isOnSale: boolean        // drives "Sale" badge
  isNew: boolean           // drives "New" badge
  category: string
}

interface ProductCardProps {
  product: Product
  onWishlistToggle?: (id: string) => void
  isWishlisted?: boolean
  onQuickView?: (product: Product) => void
  className?: string
}
```

## Design Tokens

### Colour Palette (use ONLY these values)
| Token | Hex | Tailwind utility |
|---|---|---|
| Black | `#1a1a1a` | `text-[#1a1a1a]` / `bg-[#1a1a1a]` |
| Maroon | `#6B1F2E` | `text-[#6B1F2E]` / `bg-[#6B1F2E]` |
| Antique Gold | `#C9A961` | `text-[#C9A961]` / `bg-[#C9A961]` |
| Warm Beige | `#E8DCC4` | `text-[#E8DCC4]` / `bg-[#E8DCC4]` |
| Cream White | `#FAF7F2` | `text-[#FAF7F2]` / `bg-[#FAF7F2]` |

Do NOT use generic Tailwind colours (`bg-white`, `text-gray-*`, `bg-red-*`, etc.).

### Typography
- **Product name**: Playfair Display — `font-['Playfair_Display']` or the project's `font-heading` alias
- **Price, rating, body text**: Inter — `font-['Inter']` or the project's `font-body` alias

### Spacing (8px grid)
Use only Tailwind spacing at multiples of 2 units (every unit = 4px, so 2 units = 8px):
`p-2 p-4 p-6 p-8 p-10 p-12 p-16 gap-2 gap-4 gap-6 …`
Flag and remove any arbitrary spacing like `p-[13px]`.

## Visual Requirements

### Image Area
- Aspect ratio: 4:5 (portrait) — use `aspect-[4/5]` on the wrapper
- `<Image>` from `next/image` — NEVER a raw `<img>`
- `fill` layout inside the aspect-ratio wrapper with `object-cover`
- `loading="lazy"` (default for non-LCP images; add `priority` only if above the fold)
- **Hover zoom**: `scale-[1.05]` with `transition-transform duration-500 ease-in-out`
  - MUST be guarded by `useReducedMotion` from `framer-motion`
  - When `reducedMotion` is true: remove the scale transition entirely
- **Image swap on hover**: if `product.images.length >= 2`, show `images[1]` on hover
  - Implement with CSS opacity transition between two `<Image>` layers
  - Also guard with `useReducedMotion` (skip swap when motion reduced)

#### Image Swap — Implementation Patterns

✅ **Correct: CSS opacity on always-rendered layers (no layout shift)**
```tsx
{/* Layer 1: primary image — fades out on hover */}
<Image
  src={images[0]}
  alt={product.name}
  fill
  className={`object-cover transition-opacity duration-300 ${
    isHovered && !reducedMotion ? 'opacity-0' : 'opacity-100'
  }`}
/>
{/* Layer 2: hover image — fades in on hover (only when second image exists) */}
{images.length >= 2 && (
  <Image
    src={images[1]}
    alt=""
    fill
    className={`object-cover absolute inset-0 transition-opacity duration-300 ${
      isHovered && !reducedMotion ? 'opacity-100' : 'opacity-0'
    }`}
  />
)}
```

❌ **Avoid: Conditional render (causes layout shift and breaks LCP)**
```tsx
{/* Do NOT use — React unmounts/remounts on hover, causing layout shift */}
{isHovered ? (
  <Image src={images[1]} alt="" fill />
) : (
  <Image src={images[0]} alt={product.name} fill />
)}
```

#### Animation Guard — Implementation Patterns

✅ **Correct: `useReducedMotion` controls the transition class**
```tsx
const reducedMotion = useReducedMotion()

<div className={`transition-transform duration-500 ${
  !reducedMotion && isHovered ? 'scale-[1.05]' : 'scale-100'
}`}>
```

❌ **Avoid: Applying transitions without checking motion preference**
```tsx
{/* No motion guard — violates WCAG 2.3.3 / prefers-reduced-motion */}
<div className={`transition-transform duration-500 ${isHovered ? 'scale-[1.05]' : 'scale-100'}`}>
```

### Badges (top-left of image, absolute positioned)
- "Sale" badge: shown when `product.isOnSale === true`
  - Background: `#6B1F2E` (Maroon), text: `#FAF7F2` (Cream White)
- "New" badge: shown when `product.isNew === true` AND item is NOT on sale
  - Background: `#C9A961` (Antique Gold), text: `#1a1a1a` (Black)
- Both badges: `text-xs font-semibold uppercase tracking-wider px-2 py-1 rounded-sm`
- Only one badge shown at a time — Sale takes priority over New

### Wishlist Button (top-right of image, absolute positioned)
- Heart icon (`HeartIcon` from `@heroicons/react/24/outline` when not wishlisted,
  `HeartIcon` from `@heroicons/react/24/solid` when wishlisted)
- Background: semi-transparent white backdrop — `bg-[#FAF7F2]/80`
- Icon colour when wishlisted: `#6B1F2E` (Maroon)
- `aria-label`: `"Add [product.name] to wishlist"` / `"Remove [product.name] from wishlist"`
- `onClick`: call `onWishlistToggle(product.id)` — stop event propagation (prevent card navigation)
- `data-testid="wishlist-btn"`

### Card Body
- **Product name**: Playfair Display, `text-base` or `text-lg`, colour `#1a1a1a`, `line-clamp-2`
- **Price**:
  - Default: single price in PKR — `PKR {price.toLocaleString('en-PK')}`
  - On sale: show `salePrice` (Maroon `#6B1F2E`) + `price` with `line-through` (muted `#C9A961`)
- **Star Rating**: shown when `reviewCount > 0`
  - 5 stars (filled / empty), gold `#C9A961`
  - Adjacent text: `({reviewCount})`
  - `aria-label`: `"Rated {rating} out of 5 — {reviewCount} reviews"`
- **Stock Counter**: shown when `0 < product.stock <= 4`
  - Text: `"Only {stock} left!"`
  - Colour: `#6B1F2E` (Maroon), `text-xs font-medium`
  - `data-testid="stock-counter"`

### Quick View Overlay
- Appears on hover over the image area only
- Full-width button anchored to bottom of image: `"Quick View"`
- Background: `#1a1a1a` at 90% opacity, text: `#FAF7F2`
- Transition: slide up from bottom (`translateY(100%)` → `translateY(0)`)
  - Guard with `useReducedMotion` (instant show/hide when reduced)
- `onClick`: call `onQuickView(product)` — stop event propagation
- `data-testid="quick-view-btn"`
- `aria-label`: `"Quick view {product.name}"`

## Interaction Requirements

### Card Navigation
- The outer card element is a Next.js `<Link href={/products/${product.slug}}>` 
- The full card area is clickable and keyboard-focusable
- Wishlist button and Quick View button must stop propagation — they must NOT trigger navigation

### Keyboard Accessibility
- Card `<Link>` receives focus on Tab; Enter/Space triggers navigation
- Wishlist button: Tab-focusable, Enter/Space toggles
- Quick View button: Tab-focusable, Enter/Space opens modal
- Focus ring: `focus-visible:ring-2 focus-visible:ring-[#C9A961] focus-visible:ring-offset-2`
  - NEVER `outline-none` without a replacement ring

### Reduced Motion
```typescript
import { useReducedMotion } from 'framer-motion'
// Inside component:
const reducedMotion = useReducedMotion()
// Use reducedMotion to conditionally apply transitions
```

## Runtime Edge Cases

Handle these defensively — the component must not crash on malformed data:

| Scenario | Safe Handling |
|---|---|
| `product.images` is empty (`[]`) | Render a placeholder `bg-[#E8DCC4]` div with no `<Image>` — do not throw |
| `product.images.length === 1` | Disable image swap — skip Layer 2 entirely |
| `product.rating` is `0` or `NaN` | Treat as `reviewCount === 0` — hide star rating block |
| `product.stock` is negative | Treat as out-of-stock — hide stock counter |
| `product.name` is very long (>60 chars) | `line-clamp-2` in CSS handles truncation — no JS needed |
| `onWishlistToggle` is undefined | Render wishlist button as disabled (`opacity-50`, `cursor-not-allowed`) |
| `onQuickView` is undefined | Hide Quick View overlay entirely — do not render an inert button |

## Accessibility Checklist

- [ ] All images have descriptive `alt={product.name}` (primary) / `alt=""` (decorative swap image)
- [ ] Wishlist button has `aria-label` and `aria-pressed` state
- [ ] Quick View button has `aria-label`
- [ ] Stock counter has `aria-live="polite"` so screen readers announce changes
- [ ] Star rating has `aria-label` with full text
- [ ] Colour contrast: Maroon text on Cream White background passes 4.5:1
- [ ] Focus indicators visible on all interactive elements
- [ ] No `outline-none` without replacement

## Test Coverage Checklist

The co-located `ProductCard.test.tsx` MUST cover:

### Render tests
- [ ] Renders product name and base price
- [ ] Renders "Sale" badge when `isOnSale: true`
- [ ] Does NOT render "New" badge when `isOnSale: true` (Sale takes priority)
- [ ] Renders "New" badge when `isNew: true` and `isOnSale: false`
- [ ] Renders strikethrough original price and sale price when on sale
- [ ] Renders star rating when `reviewCount > 0`
- [ ] Does NOT render rating when `reviewCount === 0`
- [ ] Renders stock counter when `stock <= 4`
- [ ] Does NOT render stock counter when `stock >= 5`
- [ ] Does NOT render stock counter when `stock === 0` (out of stock edge case)

### Interaction tests
- [ ] Clicking wishlist button calls `onWishlistToggle` with `product.id`
- [ ] Clicking wishlist button does NOT navigate (event propagation stopped)
- [ ] Wishlist icon changes between outline/solid based on `isWishlisted` prop
- [ ] Clicking Quick View button calls `onQuickView` with the product object
- [ ] Clicking Quick View button does NOT navigate
- [ ] Card link points to `/products/{product.slug}`

### Accessibility tests
- [ ] Wishlist button has correct `aria-label` (includes product name)
- [ ] Quick View button has correct `aria-label`
- [ ] Star rating has descriptive `aria-label`

### Edge case tests
- [ ] Renders correctly when `images` array has only one item (no swap behaviour)
- [ ] Renders placeholder when `images` array is empty
- [ ] Renders correctly when `salePrice` is undefined
- [ ] Name truncates gracefully with a very long product name (line-clamp)
- [ ] Wishlist button is disabled when `onWishlistToggle` is undefined
- [ ] Quick View overlay is hidden when `onQuickView` is undefined

## Keeping Current

Update this spec when any of the following change:

| Trigger | Section to Update |
|---|---|
| CLAUDE.md palette or font changes | `## Design Tokens` — hex values and Tailwind utilities |
| Next.js major version bump | `## Visual Requirements` — verify `next/image` props against `node_modules/next/dist/docs/` |
| Framer Motion major version bump | `### Reduced Motion` and `#### Animation Guard` — verify `useReducedMotion` API |
| Heroicons major version bump | `### Wishlist Button` — verify import paths (`/24/outline`, `/24/solid`) |
| Test framework changes | `## Test Coverage Checklist` — update library-specific patterns |

Last verified: 2026-05
