# Feature: Layout — Header & Footer

> Site-wide chrome that wraps every page rendered by `app/layout.tsx`.
> The Header carries identity + navigation + commerce primitives (cart, search, account).
> The Footer carries trust signals + secondary navigation + newsletter capture.
> Both are first-class components with their own files, tests, and acceptance criteria.

## Overview

The Header and Footer are rendered once per session by the root `RootLayout` and are visible
on every route — public, account, and admin (admin will compose a different shell, but the
Header and Footer described here are the **storefront** chrome). They establish brand
presence, give users a predictable path to navigation and conversion primitives, and host
trust signals required to make a portfolio ecommerce site believable.

Both components must work on the slowest device the spec targets (320 px Android, 3G
network) and pass WCAG 2.1 AA. Both must use the design system in CLAUDE.md §3 strictly —
no ad-hoc colours, no Google Fonts CDN links, no `<img>` for the logo.

## User Stories

- **As a shopper on any device**, I want to see the brand name, navigate to product
  categories, and access my cart from any page so I never feel lost.
- **As a shopper on mobile**, I want a single-tap menu that doesn't cover the whole screen
  and is easy to dismiss.
- **As a shopper looking for a specific item**, I want a search affordance that's always
  visible without dominating the layout.
- **As a returning customer**, I want my session to persist across navigation and to see my
  cart count update immediately when I add an item.
- **As a brand-new visitor**, I want to subscribe to the newsletter from any page without
  creating an account.
- **As a shopper considering checkout**, I want to see trust signals (payment options, SSL,
  money-back guarantee) in the footer before I commit.
- **As a keyboard-only or screen-reader user**, I want every interactive element reachable
  with Tab, with visible focus rings and accurate ARIA labelling.

---

# PART A — HEADER

## A1. Overview

The Header is a sticky, three-zone bar that transitions visual weight as the user scrolls.

```
┌──────────────────────────────────────────────────────────────────┐
│  [Logo]      Home  Shop  About  Contact  FAQ      [🔍] [♡] [🛒²] [👤]  │
└──────────────────────────────────────────────────────────────────┘
```

Lives at `src/components/layout/Header/` and is composed into `app/layout.tsx`.

## A2. Visual Design

### Breakpoints (Tailwind defaults — `sm`, `md`, `lg`)

| Width           | Class prefix | Header layout                                                                                           |
| --------------- | ------------ | ------------------------------------------------------------------------------------------------------- |
| `<640 px`       | (mobile)     | Logo left · hamburger right · no inline nav · cart icon retained for quick access                       |
| `640 – 1023 px` | `sm:`        | Logo left · condensed nav (Home / Shop / About) center · cart + account icons · hamburger for full menu |
| `≥1024 px`      | `lg:`        | Full layout — logo · all 5 nav items · all 4 action icons                                               |
| `≥1440 px`      | `xl:`        | Same as desktop with wider container (`max-w-7xl`)                                                      |

### Heights

| State                 | Mobile | Desktop |
| --------------------- | ------ | ------- |
| Initial (top of page) | 56 px  | 72 px   |
| Scrolled (Y > 64)     | 56 px  | 64 px   |

### Colours (from CLAUDE.md §3)

| Element                        | Token                                               | Hex       |
| ------------------------------ | --------------------------------------------------- | --------- |
| Background, top of page        | `--color-cream`                                     | `#FAF7F2` |
| Background, scrolled           | `--color-cream` + 95 % opacity + `backdrop-blur-sm` | —         |
| Border under header (scrolled) | `--color-beige`                                     | `#E8DCC4` |
| Logo wordmark                  | `--color-black`                                     | `#1a1a1a` |
| Nav link (default)             | `--color-black`                                     | `#1a1a1a` |
| Nav link (hover)               | `--color-maroon`                                    | `#6B1F2E` |
| Active nav underline           | `--color-gold`                                      | `#C9A961` |
| Icon (default)                 | `--color-black`                                     | `#1a1a1a` |
| Cart count badge               | bg `--color-maroon`, text `--color-cream`           | —         |

### Typography

- Logo wordmark — Playfair Display 600, tracking-wide, 20 px (mobile) / 24 px (desktop).
- Nav links — Inter 500, 14 px, uppercase, tracking-wider.
- Cart badge — Inter 600, 11 px.

## A3. Component File Structure

```
src/components/layout/Header/
  Header.tsx                  // Server Component — composition shell
  HeaderClient.tsx            // 'use client' — wires session + cart count from stores
  Logo.tsx                    // Server — inline SVG, no network fetch
  MainNav.tsx                 // 'use client' — uses usePathname() for active link
  HeaderActions.tsx           // 'use client' — search / wishlist / cart / account triggers
  AccountMenu.tsx             // 'use client' — dropdown when authenticated
  MobileMenuButton.tsx        // 'use client' — toggles mobile drawer
  MobileDrawer.tsx            // 'use client' — Framer Motion slide-in panel (lazy)
  Header.test.tsx             // RTL component tests
```

Every file MUST stay under 300 lines per CLAUDE.md §4.

## A4. Sticky / Scroll Behaviour

- Position: `fixed top-0 left-0 right-0 z-50`.
- Page body needs top padding equal to header height to avoid jump.
- At scroll Y = 0 → fully opaque cream.
- At scroll Y > 64 → adds `border-b border-beige` and shrinks height to 64 px (desktop only).
- Transition: 200 ms `ease-out` on `height`, `box-shadow`, `background-color`.
- **Hide-on-scroll behaviour**: NOT implemented in v1 (always visible) — matches aliffnoon
  reference and avoids the jank common with hide-on-scroll on iOS Safari.
- Implementation: a single `useScroll()` from Framer Motion in `HeaderClient.tsx` driving a
  `motion.header` style — no per-frame React re-render.

## A5. Interactions

| Trigger                         | Behaviour                                                                                           |
| ------------------------------- | --------------------------------------------------------------------------------------------------- |
| Hover over nav link (desktop)   | Colour shifts to maroon over 200 ms; gold underline grows from centre-out                           |
| Click nav link                  | Standard Next `<Link>` — soft navigation                                                            |
| Active route                    | Permanent gold underline + maroon text colour                                                       |
| Hover icon button               | Colour shifts to maroon, scale 1.05 over 150 ms                                                     |
| Click search icon               | Triggers `useSearchModal().open()` — modal contents are out of scope (see [Search spec — TBD])      |
| Click cart icon                 | Triggers `useCartDrawer().open()` — drawer contents are out of scope (see [Cart drawer spec — TBD]) |
| Click wishlist icon             | `<Link href="/wishlist">`                                                                           |
| Click account icon (logged out) | `<Link href="/login">`                                                                              |
| Click account icon (logged in)  | Toggles `<AccountMenu>` dropdown                                                                    |
| Click hamburger (mobile)        | Opens `<MobileDrawer>` — slides in from right, 320 ms ease-out, backdrop fades in                   |
| Inside mobile drawer            | Tap link soft-navigates and closes drawer; tap backdrop closes drawer; press Escape closes drawer   |

### Account dropdown menu

```
┌──────────────────┐
│ My Account       │
│ Orders           │
│ Wishlist         │
│ ──────────────── │
│ Sign out         │
└──────────────────┘
```

Closes on: outside click, Escape, route change, blur of last focusable item.

## A6. State Management

Three concerns, three sources:

1. **Cart count** — Zustand store `useCartStore` at `src/stores/cart.ts`.

   ```ts
   type CartStore = {
     items: CartItem[];
     count: number; // derived selector — sum of qty
     add: (item: CartItem) => void;
     remove: (productId: string) => void;
     setQuantity: (productId: string, qty: number) => void;
     clear: () => void;
   };
   ```

   Persisted to `localStorage` via `zustand/middleware/persist`.
   Subscribed in `HeaderActions.tsx` via a memoised `count` selector.

2. **Auth session** — `useSession()` from `next-auth/react`. Header reads `data?.user`. Uses
   `status === 'loading'` to show a skeleton avatar (no flash of "logged out" UI).

3. **Local UI state** — plain `useState` in `HeaderClient.tsx`:

   ```ts
   const [mobileOpen, setMobileOpen] = useState(false);
   const [accountMenuOpen, setAccountMenuOpen] = useState(false);
   ```

   Lifted into `HeaderClient` so the Server `Header` shell stays static.

4. **Active route** — `usePathname()` in `MainNav.tsx`. No state — derived per render.

## A7. Accessibility

| Requirement     | How                                                                                                                                            |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Landmark        | `<header role="banner">` (implicit — `<header>` direct child of `<body>` is a banner)                                                          |
| Nav landmark    | `<nav aria-label="Primary">`                                                                                                                   |
| Skip link       | First focusable element: `<a href="#main">Skip to content</a>` — visually hidden until focused                                                 |
| Icon buttons    | `aria-label="Search"`, `aria-label="Cart, 3 items"` (count interpolated), etc.                                                                 |
| Cart count      | Live region: `<span aria-live="polite" aria-atomic="true">{count}</span>` so screen-reader users hear the count change                         |
| Mobile drawer   | `role="dialog" aria-modal="true" aria-labelledby="mobile-menu-heading"`; focus trap; Escape closes; focus returns to hamburger button on close |
| Account menu    | `role="menu"` with `role="menuitem"` children; arrow keys move focus; Escape closes                                                            |
| Reduced motion  | Wrap all Framer Motion in `useReducedMotion()` — fall back to opacity-only transitions                                                         |
| Colour contrast | Maroon on cream = 7.4:1 ✓ · Black on cream = 16.5:1 ✓                                                                                          |

---

# PART B — FOOTER

## B1. Overview

A four-column maroon footer on desktop that becomes two columns on tablet and a stacked
accordion on mobile. Anchors the page bottom via `mt-auto` on the body's flex column.
Contains brand reassurance, secondary navigation, newsletter capture, and trust elements.

Lives at `src/components/layout/Footer/`.

## B2. Visual Design

### Layout grid

| Width           | Layout                                                                         |
| --------------- | ------------------------------------------------------------------------------ |
| `<640 px`       | Single column · each column is a collapsible accordion · Brand always expanded |
| `640 – 1023 px` | 2 × 2 grid · all open                                                          |
| `≥1024 px`      | 4-column flex grid (`gap-12`) · all open                                       |

### Columns

```
┌─── BRAND ───┬─── SHOP ────┬─── HELP ────┬── CONNECT ──┐
│ Logo        │ Sofas       │ FAQ         │ Newsletter  │
│ Tagline     │ Beds        │ Shipping    │ ┌─────────┐ │
│ Short copy  │ Dining      │ Returns     │ │ email   │ │
│ Phone       │ Office      │ Contact     │ └─────────┘ │
│ Address     │ Storage     │ Track Order │ [Subscribe] │
│             │ View all →  │             │             │
│             │             │             │ Social ⓘ ⓕ ⓣ │
│             │             │             │ WhatsApp ⓦ  │
└─────────────┴─────────────┴─────────────┴─────────────┘
                          ─────
       Trust badges:  🛡️ SSL Secure   🔄 Money-Back   💵 COD   🏦 Bank Transfer
                          ─────
        © 2026 Furniture Store · Privacy · Terms · Sitemap
```

### Colours

| Element               | Token                                   | Hex       |
| --------------------- | --------------------------------------- | --------- |
| Background            | `--color-maroon`                        | `#6B1F2E` |
| Heading text          | `--color-gold`                          | `#C9A961` |
| Body text             | `--color-cream`                         | `#FAF7F2` |
| Link hover            | `--color-gold`                          | `#C9A961` |
| Newsletter input bg   | `--color-cream`                         | `#FAF7F2` |
| Newsletter input text | `--color-black`                         | `#1a1a1a` |
| Subscribe button      | bg `--color-gold`, text `--color-black` | —         |
| Bottom strip bg       | maroon darkened 8 %                     | —         |

Verified contrasts: cream on maroon = 9.2:1 ✓ · gold on maroon = 4.7:1 ✓

### Spacing

- Footer top padding: `pt-16` (64 px) desktop, `pt-12` mobile.
- Bottom strip padding: `py-4`.
- Column gap: `gap-12` desktop, `gap-8` tablet.

## B3. Component File Structure

```
src/components/layout/Footer/
  Footer.tsx                  // Server — composition + DB fetch for categories
  FooterBrand.tsx             // Server
  FooterShop.tsx              // Server — receives categories prop
  FooterHelp.tsx              // Server — static links
  FooterConnect.tsx           // Server — composes Newsletter + Social + WhatsApp
  NewsletterForm.tsx          // 'use client' — Server Action invocation, optimistic UI
  SocialIcons.tsx             // Server — reads NEXT_PUBLIC_* env at module scope
  PaymentIcons.tsx            // Server
  TrustBadges.tsx             // Server
  FooterAccordion.tsx         // 'use client' — wraps columns on mobile
  BottomStrip.tsx             // Server
  BackToTopButton.tsx         // 'use client' — scroll listener + smooth scroll
  Footer.test.tsx             // RTL
```

## B4. Newsletter form

### Markup

```tsx
<form action={subscribeNewsletter}>
  <label htmlFor="newsletter-email" className="sr-only">
    Email address
  </label>
  <input
    id="newsletter-email"
    name="email"
    type="email"
    required
    placeholder="you@example.com"
    aria-describedby="newsletter-status"
  />
  <button type="submit">Subscribe</button>
  <p id="newsletter-status" aria-live="polite" />
</form>
```

### Server Action

```ts
// src/app/(actions)/newsletter.ts
'use server';

import { z } from 'zod';
import { ratelimit } from '@/lib/ratelimit';
import { prisma } from '@/lib/prisma';
import { resend } from '@/lib/resend';

const SubscribeSchema = z.object({ email: z.string().email().max(320) });

export async function subscribeNewsletter(_: FormState, fd: FormData): Promise<FormState> {
  const ip = (await headers()).get('x-forwarded-for') ?? 'unknown';
  const { success } = await ratelimit.newsletter.limit(ip);
  if (!success) return { ok: false, message: 'Too many attempts. Try again in a minute.' };

  const parsed = SubscribeSchema.safeParse({ email: fd.get('email') });
  if (!parsed.success) return { ok: false, message: 'Please enter a valid email.' };

  const existing = await prisma.newsletterSubscriber.findUnique({
    where: { email: parsed.data.email },
  });
  if (existing?.status === 'active') {
    return { ok: true, message: "You're already subscribed — thanks!" };
  }

  await prisma.newsletterSubscriber.upsert({
    where: { email: parsed.data.email },
    update: { status: 'active', resubscribedAt: new Date() },
    create: { email: parsed.data.email, status: 'active', source: 'footer' },
  });

  await resend.contacts.create({
    email: parsed.data.email,
    audienceId: process.env.RESEND_AUDIENCE_ID!,
    unsubscribed: false,
  });

  return { ok: true, message: 'Subscribed! Welcome to the family.' };
}
```

Client component uses `useActionState` (Next 16 / React 19) for transitional state.

### Form states

| State              | UI                                                                       |
| ------------------ | ------------------------------------------------------------------------ |
| Idle               | Email input + button                                                     |
| Submitting         | Button shows spinner, disabled, `aria-busy="true"`                       |
| Success            | Inline cream-coloured success message (replaces form on first subscribe) |
| Already subscribed | Same success treatment but message reads "You're already subscribed"     |
| Validation error   | Red inline error under input, focus moves to input                       |
| Rate-limited       | Same as validation error with rate-limit message                         |

### Data model — Prisma

```prisma
model NewsletterSubscriber {
  id              String   @id @default(cuid())
  email           String   @unique
  status          NewsletterStatus @default(active) // active | unsubscribed | bounced
  source          String   // 'footer' | 'checkout' | 'admin'
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  resubscribedAt  DateTime?
  unsubscribedAt  DateTime?

  @@index([status])
}

enum NewsletterStatus { active unsubscribed bounced }
```

## B5. Social / Payment / Trust elements

### Social icons (`SocialIcons.tsx`)

| Platform  | Icon source                                                          | URL env var                 |
| --------- | -------------------------------------------------------------------- | --------------------------- |
| Instagram | `lucide-react` `Instagram`                                           | `NEXT_PUBLIC_INSTAGRAM_URL` |
| Facebook  | `lucide-react` `Facebook`                                            | `NEXT_PUBLIC_FACEBOOK_URL`  |
| TikTok    | Inline SVG at `public/icons/tiktok.svg` (lucide doesn't ship TikTok) | `NEXT_PUBLIC_TIKTOK_URL`    |

URLs validated by the env Zod schema in `src/lib/env.ts`. Missing URL → that icon is omitted
(no broken link rendered).

Each icon is an `<a target="_blank" rel="noopener noreferrer" aria-label="Follow on Instagram">`.

### WhatsApp button

- Uses `lucide-react` `MessageCircle` inside a pill button.
- `href="https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_PHONE}?text=Hi%20%E2%80%94%20I%20have%20a%20question"`
- Always rendered (NOT the floating WhatsApp button — that's a separate component).

### Payment icons (`PaymentIcons.tsx`)

- Static SVGs in `public/icons/payment/`:
  - `cod.svg` — COD badge
  - `bank-transfer.svg` — bank transfer badge
- Imported as `<Image src="/icons/payment/cod.svg" alt="Cash on Delivery" width={48} height={32} />`.
- Aligned in a row, `gap-3`, beneath trust badges on desktop and in the accordion on mobile.

### Trust badges (`TrustBadges.tsx`)

- 🛡️ "SSL Secure" — `lucide-react` `ShieldCheck`
- 🔄 "30-Day Returns" — `lucide-react` `RefreshCcw`
- 🔒 "Privacy First" — `lucide-react` `Lock`

Each badge is icon + caption. No external service or link — purely informational.

## B6. Back-to-top button

- File: `src/components/layout/Footer/BackToTopButton.tsx`.
- Position: `fixed bottom-6 right-6 z-40`.
- Visibility: hidden by default; appears at `scrollY > 600` with `opacity` transition over
  200 ms.
- Click: `window.scrollTo({ top: 0, behavior: 'smooth' })`. Respects
  `prefers-reduced-motion` — falls back to `behavior: 'auto'`.
- ARIA: `<button aria-label="Back to top">` with `lucide-react` `ArrowUp` icon.
- Implementation: `useEffect` adds a passive `scroll` listener, throttled at 100 ms per
  CLAUDE.md §9. Listener removed on unmount.

## B7. Mobile accordion

- `<FooterAccordion>` wraps each non-Brand column on mobile (`md:hidden`).
- Each column header is `<button aria-expanded={open} aria-controls={panelId}>` with a chevron
  that rotates 180 ° on open.
- Body height animated via Framer Motion `<AnimatePresence>` and `initial/animate/exit` on
  `height: 0 ↔ 'auto'`.
- All accordions independent (multiple can be open at once) — matches user expectation for
  footer columns.
- `prefers-reduced-motion`: no height animation, just toggle visibility instantly.

## B8. Data Requirements

### Categories

```ts
// src/components/layout/Footer/Footer.tsx
import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';

const getFooterCategories = unstable_cache(
  async () =>
    prisma.category.findMany({
      where: { isPublished: true },
      orderBy: { sortOrder: 'asc' },
      take: 6,
      select: { slug: true, name: true },
    }),
  ['footer-categories'],
  { tags: ['categories'], revalidate: 86400 },
);
```

Revalidation strategy:

- 24 h fallback (`revalidate: 86400`).
- On-demand via `revalidateTag('categories')` from the admin category create / edit / delete
  Server Actions. See admin spec — TBD.

If the DB query throws (e.g. cold start, connection pool exhausted), `Footer.tsx` falls back
to hardcoded category names from `src/lib/constants/categories.ts` rather than crashing
the entire layout.

### Social URLs (env vars)

```ts
// src/lib/env.ts (extension)
NEXT_PUBLIC_INSTAGRAM_URL: z.string().url().optional(),
NEXT_PUBLIC_FACEBOOK_URL:  z.string().url().optional(),
NEXT_PUBLIC_TIKTOK_URL:    z.string().url().optional(),
NEXT_PUBLIC_WHATSAPP_PHONE: z.string().regex(/^\d{10,15}$/).optional(),
```

Zod validation runs at app startup per CLAUDE.md §15. Missing values do not crash the app —
the corresponding icon is omitted.

### Resend integration env vars

```ts
RESEND_API_KEY:      z.string().startsWith('re_'),
RESEND_AUDIENCE_ID:  z.string().uuid(),
```

These are server-only (no `NEXT_PUBLIC_` prefix).

## B9. Accessibility

| Requirement       | How                                                                                                                                       |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Landmark          | `<footer role="contentinfo">` (implicit on direct-child `<footer>`)                                                                       |
| Headings          | Each column has `<h2>` (Brand, Shop, Help, Connect). One `<h1>` rule (CLAUDE.md §10) preserved — page-level `<h1>` lives in route content |
| Newsletter input  | `<label htmlFor="newsletter-email">` (visually hidden, screen-reader present)                                                             |
| Newsletter status | `<p aria-live="polite">` so success / error is announced                                                                                  |
| Social links      | `aria-label="Follow on Instagram"` (icon-only buttons forbidden by CLAUDE.md §11)                                                         |
| Accordion         | `aria-expanded`, `aria-controls`, focus stays on trigger after toggle                                                                     |
| Back-to-top       | `aria-label="Back to top"`; focus returns to top of page after smooth scroll completes                                                    |
| Colour contrast   | All cream-on-maroon and gold-on-maroon combinations verified (see colour table)                                                           |
| Keyboard          | All links and buttons in document order; no `tabindex > 0`; focus rings visible (cream outline 2 px)                                      |

---

# SHARED REQUIREMENTS

## S1. Performance

| Concern              | Decision                                                                                                                 |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Logo                 | Inline React SVG component — zero network fetch, no LCP cost, can be styled via CSS                                      |
| Other icons          | `lucide-react` named imports only (`import { Search } from 'lucide-react'`) — tree-shaken                                |
| Mobile drawer        | Lazy-loaded via `dynamic(() => import('./MobileDrawer'), { ssr: false })`; only loaded after the user taps the hamburger |
| Footer               | Server-rendered; no lazy load needed (small DOM, no images above the fold-in-view)                                       |
| Payment icon SVGs    | Loaded via `next/image` with explicit `width`/`height`, served from `public/`                                            |
| Scroll listener      | Throttled at 100 ms (back-to-top + sticky header) per CLAUDE.md §9                                                       |
| Cart store hydration | Persisted via `zustand/persist`; reads localStorage in a `useEffect` to avoid hydration mismatch                         |
| Bundle               | Header + Footer combined target: < 30 KB gzip JS contribution to the layout chunk                                        |

## S2. Tech-stack split — Server vs. Client

| File                                        | Boundary   | Reason                                             |
| ------------------------------------------- | ---------- | -------------------------------------------------- |
| `Header.tsx`                                | **Server** | Composition shell; no interactivity at this level  |
| `HeaderClient.tsx`                          | **Client** | Wraps interactive children, owns scroll/menu state |
| `Logo.tsx`                                  | **Server** | Pure SVG                                           |
| `MainNav.tsx`                               | **Client** | `usePathname()` for active state                   |
| `HeaderActions.tsx`                         | **Client** | Hooks into Zustand cart store, NextAuth            |
| `AccountMenu.tsx`                           | **Client** | Local open state, click-outside hook               |
| `MobileMenuButton.tsx`                      | **Client** | Toggles parent state                               |
| `MobileDrawer.tsx`                          | **Client** | Animation + focus trap                             |
| `Footer.tsx`                                | **Server** | Static + Prisma DB read                            |
| `FooterBrand` / `FooterHelp` / `FooterShop` | **Server** | Static or prop-fed                                 |
| `NewsletterForm.tsx`                        | **Client** | `useActionState` for transitions                   |
| `SocialIcons.tsx`                           | **Server** | Reads env vars at module scope                     |
| `FooterAccordion.tsx`                       | **Client** | UI state only                                      |
| `BackToTopButton.tsx`                       | **Client** | Scroll listener                                    |
| `BottomStrip.tsx`                           | **Server** | Static                                             |

## S3. Design tokens

Add to `src/app/globals.css`:

```css
@theme {
  --color-brand-black: #1a1a1a;
  --color-brand-maroon: #6b1f2e;
  --color-brand-gold: #c9a961;
  --color-brand-beige: #e8dcc4;
  --color-brand-cream: #faf7f2;

  --font-display: 'Playfair Display', ui-serif, Georgia, serif;
  --font-body: 'Inter', ui-sans-serif, system-ui;
}
```

Replace the placeholder `Geist` fonts in `app/layout.tsx` with `next/font/google` for
Playfair + Inter when this spec is implemented.

`tailwind.config` consumed via `@theme` (Tailwind v4 native).

## S4. Test cases

### Vitest unit

- `subscribeNewsletter` — happy path (new email), duplicate active, duplicate unsubscribed
  (resubscribe), invalid email, rate-limit hit, Resend failure rolls back DB upsert.
- `useCartStore` — `add` increments count, `remove` decrements, `setQuantity` to 0 deletes,
  `clear` empties.
- Env validation — missing required `RESEND_API_KEY` throws at startup.

### React Testing Library (component)

- **Header**
  - Renders all 5 nav items at desktop width.
  - Cart badge shows mocked count `3`; live region announces.
  - Active route highlight matches mocked `usePathname`.
  - Hamburger hidden at desktop, visible at mobile.
  - Mobile drawer opens on hamburger click; closes on Escape; closes on backdrop click.
  - Account icon links to `/login` when no session; opens menu when session present.
- **Footer**
  - All four columns render at desktop width; only the heading buttons render initially
    (collapsed) at mobile width.
  - Newsletter form rejects empty submission; rejects invalid format; shows success on valid
    submission with mocked Server Action.
  - Newsletter "already subscribed" path renders correct message.
  - Social icons omitted when corresponding env var is missing.
  - Categories rendered from passed prop; falls back to hardcoded list when prop is empty.
  - Back-to-top button hidden at scroll Y = 0; visible at Y > 600 (use a controllable
    `IntersectionObserver` mock or scroll the test window).

### Playwright E2E

1. **Sticky header** — load home, scroll 200 px, assert header has scrolled-state class
   (`data-scrolled="true"` or computed style).
2. **Cart counter** — add product to cart from PDP, return to home, header badge shows `1`.
3. **Mobile drawer** — set viewport to 375 px, tap hamburger, drawer visible, tap link,
   navigated + drawer closed.
4. **Newsletter happy path** — fill footer email, submit, success message visible within 2 s.
5. **Newsletter duplicate** — submit same email twice, second submission shows "already
   subscribed" message.
6. **Back-to-top** — scroll to bottom, button visible, click, page scrolled to Y = 0.
7. **Keyboard tour** — Tab from skip-link → header nav → content → footer links → newsletter
   input → submit → social. No traps; focus rings visible at every step.
8. **Reduced motion** — emulate `prefers-reduced-motion: reduce`; verify no Framer Motion
   transitions fire (no `transform` style on header at scroll, drawer pops in instantly).

### Manual / accessibility audit

- axe-core (Playwright `@axe-core/playwright`) on home page — zero violations.
- Lighthouse accessibility score ≥ 95 on `/` (CLAUDE.md §9).
- VoiceOver smoke test: tab through header, hear correct labels and counts.

## S5. Edge cases

| Case                                      | Expected                                                                                                                                                                       |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Empty cart                                | Cart icon renders without badge (badge is conditional on `count > 0`)                                                                                                          |
| Logged-out user clicks account icon       | Soft-navigates to `/login?callbackUrl=<current>`                                                                                                                               |
| Newsletter — duplicate active email       | Friendly success-tone "Already subscribed"                                                                                                                                     |
| Newsletter — duplicate unsubscribed email | Resubscribes, sets `resubscribedAt`, mirrors to Resend, success message                                                                                                        |
| Newsletter — Resend API down              | DB upsert succeeds, log error to Sentry, return success to user (Resend can be back-filled by an admin job)                                                                    |
| Footer category fetch fails               | Falls back to hardcoded `FALLBACK_CATEGORIES`; emit `console.error` (dev) / Sentry (prod)                                                                                      |
| 0 published categories in DB              | Renders "Coming soon" placeholder + link to `/products`                                                                                                                        |
| Long category name (> 20 chars)           | `truncate` Tailwind utility with `title` attribute for full text                                                                                                               |
| `prefers-reduced-motion: reduce`          | All Framer Motion respected via `useReducedMotion`; CSS transitions fall back to opacity-only                                                                                  |
| `prefers-color-scheme: dark`              | Out of scope — keep cream theme always                                                                                                                                         |
| JS disabled                               | Header degrades to static bar; cart icon links to `/cart` page (non-drawer); search icon links to `/search`; mobile menu unavailable (links collapse into a `<details>` block) |
| 3G slow network                           | LCP fires before non-critical icons hydrate; cart count populates from `localStorage` synchronously via Zustand persist                                                        |
| Header overlapping content                | Body has `pt-[56px] lg:pt-[72px]`; consumed via a `<HeaderSpacer />` component that mirrors current header height                                                              |
| User with cart count > 99                 | Show `99+` badge                                                                                                                                                               |

## S6. Acceptance criteria

### Header

- [ ] Renders on every public route (`/`, `/products`, `/products/[slug]`, `/about`, `/contact`, `/faq`, `/cart`, `/login`).
- [ ] Three responsive layouts (mobile / tablet / desktop) match the visual design above.
- [ ] Sticky on scroll with the height + opacity transition described.
- [ ] Cart badge reflects `useCartStore` count and updates live.
- [ ] Active nav item highlighted via `usePathname`.
- [ ] Mobile hamburger opens a focus-trapped drawer; closes via Escape, backdrop, or link click.
- [ ] All icons have `aria-label`; all interactive elements keyboard reachable.
- [ ] Lighthouse a11y ≥ 95 on `/`.

### Footer

- [ ] Renders on every public route.
- [ ] Three responsive layouts (4-col / 2-col / accordion) match the visual design.
- [ ] Newsletter form: validates, submits to Server Action, shows correct state per the
      states table, persists to DB, mirrors to Resend.
- [ ] Social icons render only for env-configured platforms.
- [ ] Payment + trust badges render statically.
- [ ] Back-to-top button appears at `Y > 600`, smooth-scrolls, respects reduced motion.
- [ ] Mobile accordion: independent expand/collapse, ARIA-correct, focus stays on trigger.
- [ ] Categories fetched from DB and ISR-cached for 24 h; falls back gracefully on failure.

### Cross-cutting

- [ ] All files under 300 lines (CLAUDE.md §4).
- [ ] No `any` without an explanatory comment.
- [ ] No hardcoded colours — only design-token classes (`bg-brand-cream`, `text-brand-maroon`, …).
- [ ] No raw `<img>` — `next/image` or inline SVG.
- [ ] `next/font` for Playfair + Inter, no Google CDN link.
- [ ] All scripts pass: `pnpm lint`, `pnpm format:check`, `pnpm type-check`, `pnpm test`.
- [ ] Visual regression snapshot for Header and Footer at 320 / 768 / 1280 widths.

## S7. Out of scope (for THIS spec)

- Search modal contents and search algorithm — see [Search spec — TBD].
- Cart drawer contents (line items, totals, checkout button) — see [Cart drawer spec — TBD].
- Account dropdown menu items beyond the four listed (e.g. order history page) — see [Auth spec — TBD].
- Newsletter email templates / double-opt-in flow — see [Newsletter spec — TBD].
- Admin dashboard layout chrome — admin uses a different shell.
- Floating WhatsApp button (separate component, separate spec).
- AI chatbot launcher — separate spec.
- PWA install prompt — separate spec.

## S8. Implementation notes

- Mobile-first — write Tailwind classes for the smallest breakpoint first, then layer up
  with `sm:`, `md:`, `lg:`, `xl:` modifiers.
- All colour, font, and spacing tokens consumed via Tailwind classes referencing the
  `@theme` block in `globals.css` — no inline `style={{ color: '#...' }}`.
- Every interactive element MUST have a visible focus state. Default Tailwind
  `focus-visible:ring-2 ring-brand-gold ring-offset-2 ring-offset-brand-cream` works for the
  Header; on the maroon Footer use `focus-visible:ring-brand-cream`.
- Both components must be tested in isolation — `Header.test.tsx` and `Footer.test.tsx` MUST
  NOT depend on any sibling component beyond the children they own.
- Reference `node_modules/next/dist/docs/` before using App Router APIs (`unstable_cache`,
  Server Actions, `useActionState`) — Next.js 16 conventions may differ from training data
  per CLAUDE.md preamble.
- Co-locate tests next to components per CLAUDE.md §12.
- Add `data-testid` attributes only on elements targeted by Playwright tests; prefer
  role/text queries elsewhere.
