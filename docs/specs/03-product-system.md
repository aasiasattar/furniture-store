# Feature: Product System

> Three customer-facing surfaces that drive the storefront's commerce loop:
> **Listing → Detail → Cart**. Browse products with filters, view one in depth,
> add it to a slide-out cart that persists across sessions.

## Overview

The product system covers every flow a shopper traverses from first contact with
the catalogue through "add to cart":

| Surface      | Route                 | Render strategy                                                          |
| ------------ | --------------------- | ------------------------------------------------------------------------ |
| Listing page | `/shop`               | Server Component (filters via URL searchParams) + client filter controls |
| Detail page  | `/products/[slug]`    | ISR — 24 h revalidate, on-demand revalidation on admin edit              |
| Cart drawer  | Overlay on every page | Client Component driven by `useCartStore`                                |

Lives at `src/app/shop/`, `src/app/products/[slug]/`, and
`src/components/cart/CartDrawer.tsx`. All three use the design system from CLAUDE.md
§3 strictly. The cart store referenced here is the same `useCartStore` introduced in
`01-layout-header-footer.md` §A6 (Zustand + `persist` middleware).

## User Stories

- **Shopper browsing** — see a grid of products, filter by category / material / colour / price, sort the result, and share the URL with a friend.
- **Shopper on mobile** — open filters in a bottom-sheet drawer that doesn't hijack the viewport.
- **Shopper deciding** — view a single product with multiple images, exact dimensions, materials, stock, and delivery estimate, then add to cart with the right quantity.
- **Shopper at checkout intent** — open the cart drawer, see the running subtotal, watch the free-shipping bar fill as items are added, then proceed to checkout.
- **Returning visitor** — find the same items in the cart as before, persisted across browser sessions.
- **Keyboard / screen-reader user** — every filter, gallery thumbnail, qty stepper, and cart action is reachable via Tab; the cart drawer traps focus until dismissed.

---

# PART A — LISTING PAGE (`/shop`)

## A1. Overview

The shop page renders a paginated grid of `ProductCard`s with a left sidebar of
filters and a top sort bar. All filter / sort state lives in the URL so any view is
shareable and bookmarkable. Lives at `app/shop/page.tsx`.

## A2. Visual Design

### Grid

| Width           | Columns | Gap     |
| --------------- | ------- | ------- |
| `<640 px`       | 1       | `gap-6` |
| `640 – 1023 px` | 2       | `gap-6` |
| `≥1024 px`      | 4       | `gap-8` |

### Layout

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Showing 24 of 48 products             [Sort ▾]   [▦ Grid] [≡ List]      │
│  [Sofas ✕] [Wood ✕] [Rs 5k–25k ✕]    Clear all                           │
├──────────────┬───────────────────────────────────────────────────────────┤
│              │                                                           │
│  FILTERS     │   ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐                  │
│              │   │ card  │ │ card  │ │ card  │ │ card  │                  │
│  Price       │   └───────┘ └───────┘ └───────┘ └───────┘                  │
│  ▭━━━━━●━━━  │                                                           │
│              │   ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐                  │
│  Category    │   │ card  │ │ card  │ │ card  │ │ card  │                  │
│  ☐ Sofas     │   └───────┘ └───────┘ └───────┘ └───────┘                  │
│  ☑ Beds      │                                                           │
│  ☐ Dining    │           ◀  1  2  3  …  10  ▶                            │
│              │                                                           │
└──────────────┴───────────────────────────────────────────────────────────┘
```

Mobile reorders: filter toggle button → results-count + sort → grid.

### Colours

Re-uses the same design tokens as the rest of the storefront (CLAUDE.md §3). Filter
chip background is `--color-beige`; active swatch uses a 2 px `--color-gold` ring.

## A3. Product Card

Cards in the grid are produced by the **furniture-product-card skill**. Implementation
details — image swap, hover zoom, "Sale" / "New" badges, wishlist button, Quick View
overlay, stock counter — live in
`.claude/skills/furniture-product-card/references/spec.md`. This spec does not
re-specify those concerns. Each card needs:

- `product` (full `Product` shape — see S1)
- `priority={true}` only for the first row of cards (first 4 on desktop, first 2 on
  tablet, first 1 on mobile)
- `onQuickView` wired to open a Quick View modal (modal itself is out of scope here —
  separate spec)

## A4. Filters

| Filter   | Control                                                          | Notes                                             |
| -------- | ---------------------------------------------------------------- | ------------------------------------------------- |
| Price    | Dual-handle range slider, `Rs 0` – `Rs 100,000`, step `Rs 1,000` | Debounced 300 ms before URL update (CLAUDE.md §9) |
| Category | Checkboxes: Sofas, Beds, Dining, Office, Storage, Decor          | Multi-select; counts shown beside each label      |
| Material | Checkboxes: Wood, Metal, Fabric, Leather                         | Multi-select                                      |
| Colour   | Swatches (24 px circles) with 2 px gold ring when active         | Multi-select; `aria-pressed` state                |
| Reset    | "Clear all filters" link                                         | Visible only when at least one filter is active   |

**Mobile** — filters move into a bottom-sheet drawer triggered by a "Filters" button.
Drawer slides up from bottom, traps focus, closes on Escape / backdrop / Apply.

**Active filter chips** render above the grid; clicking the ✕ on a chip removes that
single value from its URL param.

## A5. Sort & Pagination

### Sort dropdown

| Option            | Query value    |
| ----------------- | -------------- |
| Price: low → high | `price-asc`    |
| Price: high → low | `price-desc`   |
| Newest            | `newest`       |
| Best sellers      | `best-sellers` |

Default when `sort` is absent: `newest`.

### Pagination

- Numbered (1, 2, 3, … last) with "..." truncation when > 7 pages.
- Page size: **24** products per page.
- Results count text above the grid: `Showing 1–24 of 96 products`.
- View toggle (grid vs list) persists via `view` URL param.

## A6. URL Structure

All filter / sort / pagination state is reflected in the URL — every view is
shareable and bookmarkable.

| Param       | Example value     | Notes                                      |
| ----------- | ----------------- | ------------------------------------------ |
| `category`  | `sofas,beds`      | Comma-separated; absent = no filter        |
| `material`  | `wood,fabric`     | Comma-separated                            |
| `color`     | `walnut,charcoal` | Comma-separated; lowercase swatch slugs    |
| `price_min` | `5000`            | PKR; absent = `0`                          |
| `price_max` | `25000`           | PKR; absent = `100000`                     |
| `sort`      | `price-asc`       | One of the values in A5; absent = `newest` |
| `view`      | `grid` or `list`  | Absent = `grid`                            |
| `page`      | `2`               | Absent = `1`                               |

Example: `/shop?category=sofas&material=wood&sort=price-asc&page=2`.

## A7. Files

```
src/app/shop/
  page.tsx                 // Server — reads searchParams, fetches filtered products
  loading.tsx              // Skeleton grid
  error.tsx                // Friendly error UI

src/components/shop/
  ShopFilters.tsx          // Client — desktop sidebar
  ShopSort.tsx             // Client — sort dropdown + view toggle
  ShopGrid.tsx             // Server — renders the cards
  ActiveFilterChips.tsx    // Client — removable chips
  Pagination.tsx           // Client — number buttons + URL update
  MobileFilterDrawer.tsx   // Client — bottom-sheet drawer (lazy-loaded)
```

---

# PART B — DETAIL PAGE (`/products/[slug]`)

## B1. Overview

Single-product page composed of a gallery (left) and product info (right). Server-
rendered with ISR (24 h fallback + on-demand `revalidateTag('product')` from admin
edit actions). Lives at `app/products/[slug]/page.tsx`.

## B2. Visual Design

### Layout

```
┌────────────────────────────────────────────────────────────────────────────┐
│  Home / Shop / Sofas / Walnut Lounge Sofa                                  │
├──────────────────────────────────────┬─────────────────────────────────────┤
│  ┌──────────────────────────────┐    │  Walnut Lounge Sofa                 │
│  │                              │    │  ★ ★ ★ ★ ☆  (42 reviews)            │
│  │     [ main image, zoom ]     │    │                                     │
│  │                              │    │  Rs 38,500    Rs 45,000             │
│  │                              │    │                                     │
│  └──────────────────────────────┘    │  Soft-edged lounge sofa in solid    │
│  [thumb] [thumb] [thumb] [thumb]     │  walnut frame and bouclé upholstery │
│                                      │                                     │
│                                      │  Colour:  ●  ○  ○                   │
│                                      │  Quantity: [ − ] 2 [ + ]            │
│                                      │                                     │
│                                      │  ┌────────────────────────────────┐ │
│                                      │  │      ADD TO CART  (maroon)     │ │
│                                      │  └────────────────────────────────┘ │
│                                      │  ┌────────────────────────────────┐ │
│                                      │  │  ASK ON WHATSAPP  (green)      │ │
│                                      │  └────────────────────────────────┘ │
│                                      │                                     │
│                                      │  Dimensions (cm) · Material · ETA   │
└──────────────────────────────────────┴─────────────────────────────────────┘

  [ Description | Specifications | Reviews ]
  ────────────────────────────────────────────────────

  You may also like

  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐
  │ card│ │ card│ │ card│ │ card│
  └─────┘ └─────┘ └─────┘ └─────┘
```

### Breakpoints

| Width      | Layout                               |
| ---------- | ------------------------------------ |
| `<1024 px` | Stacked — gallery on top, info below |
| `≥1024 px` | Two-column split, 60 % / 40 %        |

## B3. Image Gallery

- **Main image** — `aspect-[4/5]`, `next/image` with `priority={true}`.
- **Thumbnail strip** — horizontal row of 4–6 thumbnails below main image on desktop,
  vertical strip on the left at `xl:`. Active thumbnail outlined with 2 px gold ring.
- **Desktop hover zoom** — magnifies the cursor area; CSS `background-image` overlay
  on a transparent lens to avoid loading a second high-res `<img>`.
- **Mobile pinch zoom** — handled by the browser's native gesture on a fullscreen
  lightbox opened by tapping the main image.
- **Keyboard** — Left / Right arrows on the focused gallery cycle thumbnails.

## B4. Product Info (right column)

| Element           | Detail                                                                                                             |
| ----------------- | ------------------------------------------------------------------------------------------------------------------ |
| Breadcrumb        | `Home / Shop / [Category] / [Product]` — semantic `<nav aria-label="Breadcrumb">` with ordered list                |
| Name              | Playfair Display 700, `text-3xl lg:text-4xl`, colour `--color-black`                                               |
| Price             | `Rs 38,500`. If `salePrice` set, render sale price in `--color-maroon` and base price `line-through` in muted gold |
| Rating            | 5 stars + count; clicking scrolls to Reviews tab                                                                   |
| Short description | Inter, 2–3 sentences, colour `--color-black`                                                                       |
| Variant selector  | Colour swatches (24 px circles) and / or size pills; one active at a time; `aria-pressed`                          |
| Quantity stepper  | `[ − ] N [ + ]`, clamped to `[1, product.stock]`                                                                   |
| Add to cart       | Full-width maroon button. On click → call `useCartStore.add(cartItem)`, open cart drawer                           |
| Ask on WhatsApp   | Full-width WhatsApp-green button (`#25D366`); link to `wa.me/${NEXT_PUBLIC_WHATSAPP_PHONE}?text=...`               |
| Dimensions table  | `Width / Height / Depth / Weight` (cm and kg) — see S1 `Dimensions` interface                                      |
| Material info     | One-line copy: "Solid walnut frame, polyester-blend bouclé upholstery"                                             |
| Delivery estimate | "Delivery in 7–10 days within Karachi / Lahore / Islamabad. 14+ days elsewhere."                                   |

If `product.stock === 0`, the qty stepper and Add to Cart button are disabled and
replaced with a "Notify me when back in stock" stub (link to future spec).

## B5. Tabs

| Tab            | Content                                                                                                 |
| -------------- | ------------------------------------------------------------------------------------------------------- |
| Description    | Long-form rich text (sanitised HTML from the admin editor). Server-rendered.                            |
| Specifications | Two-column key / value table — dimensions, materials, weight, warranty, country of origin.              |
| Reviews        | Aggregate rating bar (1–5 distribution) + paginated list. Review submission is out of scope (own spec). |

Tabs follow WAI-ARIA tab pattern: `role="tablist"`, `role="tab"`, `role="tabpanel"`,
`aria-selected`, `aria-controls`, arrow-key navigation.

## B6. Related Products

"You may also like" row below the tabs — exactly **4** cards via the
furniture-product-card skill. Selection logic (same category, exclude current product,
order by best-sellers) is implementation-side; the spec only requires that 4 distinct
products appear.

## B7. Files

```
src/app/products/[slug]/
  page.tsx                 // Server — ISR, generateMetadata for SEO
  loading.tsx              // Skeleton split layout
  not-found.tsx            // 404 for unknown slug

src/components/product/
  ProductGallery.tsx       // Client — main image + thumbs + zoom
  ProductInfo.tsx          // Client — variant / qty / CTAs
  ProductTabs.tsx          // Client — ARIA-tab pattern
  RelatedProducts.tsx      // Server — fetches and composes cards
  Breadcrumb.tsx           // Server — generic breadcrumb (also reusable)
```

---

# PART C — CART DRAWER

## C1. Overview

Slide-out panel anchored to the right edge of the viewport. Opens on
`useCartDrawer().open()` (called by Add to Cart, header cart icon, or
URL-deep-linked from email). Renders above all page content. Lives at
`src/components/cart/CartDrawer.tsx`. State source is the shared `useCartStore`
defined in `01-layout-header-footer.md` §A6.

## C2. Visual Design

### Layout

```
                                    ┌────────────────────────────────────┐
                                    │ Your Cart (3)                  ✕   │
                                    ├────────────────────────────────────┤
                                    │  ┌─────┐ Walnut Lounge Sofa        │
                                    │  │ img │ Walnut · Qty [−] 2 [+]    │
                                    │  └─────┘ Rs 77,000        Remove   │
                                    │  ──────────────────────────────    │
                                    │  ┌─────┐ Brass Side Table          │
        (backdrop · dim · click     │  │ img │ Qty [−] 1 [+]             │
         to close)                  │  └─────┘ Rs 14,500        Remove   │
                                    │  ──────────────────────────────    │
                                    │  Add Rs 1,500 more for free        │
                                    │  shipping ▰▰▰▰▰▰▰▱▱▱                 │
                                    │                                    │
                                    │  Promo code [          ] Apply     │
                                    │  ──────────────────────────────    │
                                    │  Subtotal               Rs 91,500  │
                                    │  Shipping            Calculated at │
                                    │                          checkout  │
                                    ├────────────────────────────────────┤
                                    │  ┌────────────────────────────────┐│
                                    │  │       CHECKOUT  (maroon)       ││
                                    │  └────────────────────────────────┘│
                                    │       Continue shopping            │
                                    └────────────────────────────────────┘
```

| Element        | Style                                           |
| -------------- | ----------------------------------------------- |
| Drawer width   | `w-full sm:w-[420px]`, full-height              |
| Background     | `--color-cream`                                 |
| Backdrop       | `bg-black/40 backdrop-blur-sm`                  |
| Slide-in       | 320 ms `ease-out` translateX from `100%` to `0` |
| Reduced motion | Opacity fade only, no transform                 |

## C3. Empty state

When `useCartStore.count === 0`:

- Centred illustration (cream-tinted SVG)
- Heading: "Your cart is empty"
- Subcopy: "Browse our furniture collection and start your space"
- CTA button: "Start Shopping" — closes drawer and navigates to `/shop`

## C4. Line items

Each `CartLineItem` shows:

| Slot      | Content                                                          |
| --------- | ---------------------------------------------------------------- |
| Thumbnail | 80 × 80 `next/image`, `aspect-square object-cover`               |
| Name      | Playfair Display, line-clamp-2                                   |
| Variant   | "Walnut" / "Charcoal" — inline below name (Inter 12 px)          |
| Quantity  | `[ − ] N [ + ]` stepper; clamped to `[1, item.stock]`            |
| Price     | `Rs N` per-line subtotal (qty × unit price)                      |
| Remove    | "Remove" text button or trash icon; `aria-label="Remove {name}"` |

Optimistic UI: qty changes and removes update the store immediately; if the server-
side stock check fails (future order spec), revert with a toast.

## C5. Free-shipping bar

- Threshold constant: `FREE_SHIPPING_THRESHOLD = 5000` (PKR), single source in `src/lib/constants/shipping.ts`.
- Visible when `subtotal < FREE_SHIPPING_THRESHOLD`.
- Copy: `Add Rs {threshold − subtotal} more for free shipping`.
- Once met, copy switches to: `🎉 You unlocked free shipping`.
- Bar fill: `width: ${(subtotal / threshold) * 100}%`, clamped to 100 %.

## C6. Promo code

Input + Apply button (Inter, `--color-maroon` background). Server-side validation is
**out of scope for this spec** — the field exists in the UI and stores the entered
code in `useCartStore.promoCode` for the checkout step. The validation API lives in
the future order / checkout spec.

## C7. Behaviour

| Trigger                | Behaviour                                                                                                           |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Add to Cart anywhere   | Drawer opens automatically. Header cart badge increments live via the same store.                                   |
| Increment qty          | Increments `item.quantity`. If `quantity === item.stock`, the `[+]` button disables with an `aria-disabled` reason. |
| Decrement qty          | Decrements. At `1`, `[−]` disables; user must use Remove to clear the line.                                         |
| Remove                 | Removes the line; if cart becomes empty, drawer renders the empty state (drawer stays open).                        |
| Close drawer           | ✕ button, backdrop click, Escape key, or successful checkout navigation.                                            |
| Refresh / new tab      | Cart contents survive via `zustand/persist` to `localStorage` (key `furniture-store-cart`).                         |
| Checkout               | Navigates to `/checkout` (future spec). Drawer closes on route change.                                              |
| Continue shopping link | Closes drawer; does not navigate. Focus returns to the element that opened the drawer.                              |

## C8. Files

```
src/components/cart/
  CartDrawer.tsx           // Client — drawer shell + focus trap
  CartLineItem.tsx         // Client — single row
  CartEmptyState.tsx       // Server-compatible static
  FreeShippingBar.tsx      // Client — reads subtotal selector
  PromoCodeInput.tsx       // Client — local controlled input
```

---

# SHARED REQUIREMENTS

## S1. TypeScript interfaces

```ts
interface Dimensions {
  width: number; // cm
  height: number; // cm
  depth: number; // cm
  weight: number; // kg
}

interface Product {
  id: string;
  slug: string;
  name: string;
  price: number; // PKR base price
  salePrice?: number; // PKR; present means item is on sale
  images: string[]; // Cloudinary URLs; images[0] = primary, images[1] = hover swap
  stock: number; // units remaining; 0 means out of stock
  category: string; // slug — e.g. 'sofas'
  material: string; // free-text e.g. 'Solid walnut + bouclé'
  dimensions: Dimensions;
  rating: number; // 0–5, one decimal place
  reviewCount: number;
  isNew: boolean;
  isOnSale: boolean;
}

interface CartItem {
  productId: string;
  name: string;
  price: number; // unit price at the moment of add (sale price if applicable)
  image: string; // images[0]
  quantity: number;
  stock: number; // snapshot of available stock at add time
}
```

> **Note:** The `furniture-product-card` skill spec lists a 12-field subset of
> `Product` (no `material`, no `dimensions`) because the card doesn't need them. The
> shape above is the canonical full record; cards consume only the fields they
> render.

## S2. Performance

| Concern              | Decision                                                                                                                                   |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `/shop` rendering    | Server Component reads `searchParams`; filtered query runs against Prisma with indexes on filter fields                                    |
| `/products/[slug]`   | ISR — `revalidate: 86400` + on-demand `revalidateTag('product')` from admin edit actions                                                   |
| Skeleton loading     | `app/shop/loading.tsx` renders 8 skeleton cards while data fetches                                                                         |
| Optimistic cart      | `add`, `remove`, `setQuantity` mutate the store immediately; no network round-trip                                                         |
| Image sizing         | Listing cards: `sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"`; gallery main: `sizes="(min-width: 1024px) 60vw, 100vw"` |
| Mobile filter drawer | Dynamic import — only loaded when user taps the Filters button                                                                             |
| Cart drawer          | Mounted on every layout but lazy-imported via `dynamic(() => import('./CartDrawer'))`                                                      |
| Bundle target        | Listing page + ProductCard chunk: `< 80 KB gzip`. Cart drawer contribution: `< 20 KB gzip`                                                 |

## S3. Accessibility

| Requirement          | How                                                                                                  |
| -------------------- | ---------------------------------------------------------------------------------------------------- |
| Filter form          | Each filter group is a `<fieldset>` with `<legend>`; checkboxes labelled via `htmlFor` / `id`        |
| Range slider         | Native `<input type="range">` per handle, with `aria-label="Minimum price"` / `"Maximum price"`      |
| Active filter chips  | Each chip is a `<button aria-label="Remove filter: Sofas">`                                          |
| Mobile filter drawer | `role="dialog" aria-modal="true" aria-labelledby="filter-drawer-heading"`; focus trap; Escape closes |
| Product gallery      | Thumbnails are `<button aria-label="View image N of M">`; focus indicator visible                    |
| Variant selector     | Swatch buttons with `aria-pressed`; group has an accessible name                                     |
| Qty stepper          | `<input type="number">` with `aria-label="Quantity"`; `[−] / [+]` buttons have own labels            |
| Tabs                 | WAI-ARIA tab pattern (`role="tablist" tab tabpanel`, `aria-selected`, arrow-key cycling)             |
| Cart drawer          | `role="dialog" aria-modal="true" aria-labelledby="cart-heading"`; focus trap; ✕ button labelled      |
| Live-region updates  | Cart line removal + qty change announced via `aria-live="polite"` region inside the drawer           |
| Image alt text       | Mandatory — gallery main / thumbs use product name + image index; never empty                        |
| Colour contrast      | All cream-on-maroon / maroon-on-cream pairings ≥ 4.5:1 (verified in CLAUDE.md §3)                    |

## S4. Edge cases

| Case                             | Expected                                                                                                              |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `product.stock === 0`            | Card overlay "Out of stock"; detail page disables qty + Add to Cart; offers "Notify me" stub                          |
| 0 search results                 | Listing renders empty illustration + "No products match your filters" + "Clear all filters" CTA                       |
| Single-image product             | Detail page hides thumbnail strip; gallery shows just the main image                                                  |
| Very long product name           | Tailwind `line-clamp-2` in card; full text in `title` attr and detail page                                            |
| Empty cart                       | Drawer renders empty state (C3) instead of line items                                                                 |
| `quantity > product.stock`       | Qty stepper [+] disabled at `stock`; if stale localStorage cart has qty > current stock, clamp on open and show toast |
| Promo code invalid               | Display under input: "We don't recognise that code." (UI only — server validation is future spec)                     |
| Sale + new badges collide        | Sale takes priority over New (per furniture-product-card skill spec)                                                  |
| `salePrice >= price`             | Treat as not-on-sale: render base price only, hide strike-through (defensive guard)                                   |
| `prefers-reduced-motion: reduce` | Cart drawer fades in/out instead of sliding; card hover zoom disabled per skill spec                                  |
| URL has unknown filter value     | Server filter ignores it; chip is not rendered                                                                        |
| URL `page` exceeds total pages   | Redirect to last valid page; flash a one-time inline notice                                                           |

## S5. Test cases

### Vitest unit

- `useCartStore`: `add` increments count, `remove` decrements, `setQuantity` clamps to `[1, stock]`, `clear` empties, `subtotal` selector matches qty × price.
- Free-shipping threshold helper: returns correct `remaining` and `percent` for boundary values (`0`, mid, `≥ threshold`).
- URL → filter-state parser: converts comma-separated strings to arrays and back without losing order.

### React Testing Library (component)

- **ShopFilters** — checking a category checkbox updates the URL query param; pressing "Clear all" empties every group.
- **ShopGrid** — renders one card per product; "0 results" empty state when product list is empty.
- **Pagination** — clicking page 2 updates the URL; current page button is `aria-current="page"`.
- **ProductGallery** — clicking a thumbnail updates the main image and the active outline.
- **ProductTabs** — `ArrowRight` on the active tab moves focus to the next tab; `Enter` activates.
- **CartDrawer** — empty state renders when store has no items; line item renders correctly; qty stepper respects stock bound; Remove deletes the line.
- **CartDrawer** — focus is trapped while open; Escape closes the drawer and returns focus to the trigger.

### Playwright E2E

1. **Browse + filter** — load `/shop`, check the Sofas filter, sort by price ascending, assert URL contains `category=sofas&sort=price-asc`, first card matches expectation.
2. **Filter → detail → cart** — from the listing, click a product, change qty to 2, click Add to Cart, drawer opens with line item showing qty 2, header badge shows `2`.
3. **Cart persistence** — add a product, hard-reload page, drawer can be opened with the item still present.
4. **Out-of-stock guard** — visit a product with `stock: 0`, assert Add to Cart is disabled, Notify-me stub visible.
5. **Mobile filter drawer** — viewport 375 px, tap Filters, drawer opens, tap a category, tap Apply, drawer closes, grid updates.
6. **Keyboard tour** — Tab from `/shop` skip-link through filters → grid → pagination; no traps; focus rings visible.

## S6. Acceptance criteria

### Listing page

- [ ] `/shop` renders at all three breakpoints with the correct column counts (1 / 2 / 4).
- [ ] Filter sidebar (desktop) and bottom-sheet drawer (mobile) operate per A4.
- [ ] Active filter chips render and remove cleanly.
- [ ] Sort, view toggle, pagination, and results-count text all match A5.
- [ ] Every filter / sort / pagination change updates the URL per A6; reloading the page reproduces the same view.

### Detail page

- [ ] Renders at `/products/[slug]` via ISR; admin edits trigger on-demand revalidation.
- [ ] Gallery supports hover zoom (desktop) and pinch zoom (mobile); thumbnail strip syncs with main image.
- [ ] Product info block matches B4, including disabled state when `stock === 0`.
- [ ] Tabs follow the WAI-ARIA tab pattern (B5).
- [ ] "You may also like" renders exactly 4 cards from the same category.

### Cart drawer

- [ ] Opens on Add to Cart, on header cart-icon click, and on `useCartDrawer().open()`.
- [ ] Line items, qty stepper, remove, free-shipping bar, and promo input all render per C2 – C6.
- [ ] State persists across page reloads (zustand persist to `localStorage`).
- [ ] Qty stepper is clamped to `[1, item.stock]`; [+] disables at stock.
- [ ] Closes on ✕, backdrop click, Escape, or successful checkout navigation; focus returns to the trigger.

### Cross-cutting

- [ ] No files exceed 300 lines (CLAUDE.md §4).
- [ ] No `any` types without a justification comment.
- [ ] Only design-system colours (`bg-brand-cream`, `text-brand-maroon`, …) — no `bg-white`, `text-gray-*`.
- [ ] Every image uses `next/image` with explicit `sizes`.
- [ ] Lighthouse a11y ≥ 95 on `/shop` and `/products/[slug]`.
- [ ] Visual-regression snapshots at 320 / 768 / 1280 widths for the grid, gallery, and drawer.
- [ ] All scripts pass: `pnpm lint`, `pnpm format:check`, `pnpm type-check`, `pnpm test`.

## S7. Out of scope

- **Wishlist** — Phase 2; the heart icon on cards is rendered by the furniture-product-card skill but the persistence layer is not built here.
- **Compare products** — Phase 2.
- **Recently viewed** — Phase 2.
- **Review submission flow** — separate spec (this spec only renders existing reviews).
- **Search modal / autocomplete** — separate spec; filter dropdowns are not a search affordance.
- **Quick View modal contents** — this spec wires the `onQuickView` callback but does not specify the modal itself.
- **Real payment gateways** — out of scope per CLAUDE.md §21.
- **Notify-me-when-back-in-stock** persistence — UI stub only; backend lives in a future notifications spec.

## S8. Implementation reference

- **ProductCard** — full visual + behavioural spec at
  `.claude/skills/furniture-product-card/references/spec.md`.
- **Cart store + persistence + header badge wiring** — defined in
  `docs/specs/01-layout-header-footer.md` §A6.
- **Search modal, Cart drawer contents at line-item-level animations, payment, checkout** — future specs (TBD).
