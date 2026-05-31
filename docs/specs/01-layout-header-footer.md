# Feature: Layout — Header & Footer

> Site-wide chrome that wraps every page rendered by `app/layout.tsx`.
> The Header carries identity + navigation + commerce primitives (cart, search, account).
> The Footer carries trust signals + secondary navigation + newsletter capture.
> Both are first-class components with their own files, tests, and acceptance criteria.

## Overview

Rendered once by `RootLayout` and visible on every public/account route (admin uses a
separate shell). They establish brand presence, surface navigation + conversion primitives
(cart, search), and host trust signals. Must work on 320 px / 3G, pass WCAG 2.1 AA, and
follow the CLAUDE.md §3 design system strictly — no ad-hoc colours, no Google Fonts CDN,
no `<img>` for the logo.

## User Stories

- **Shopper, any device** — see brand, navigate categories, and reach the cart from every page.
- **Shopper, mobile** — single-tap menu that doesn't cover the whole screen and is easy to dismiss.
- **Shopper searching** — search affordance always visible without dominating the layout.
- **Returning customer** — session persists across navigation; cart count updates immediately on add.
- **New visitor** — subscribe to the newsletter from any page without creating an account.
- **Shopper near checkout** — trust signals (SSL, payment options, returns) visible in the footer.
- **Keyboard / screen-reader user** — every interactive element reachable with Tab; visible focus rings; accurate ARIA labelling.

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
  Header.tsx           // Server — composition shell
  HeaderClient.tsx     // Client — owns scroll + menu state, wires session + cart store
  Logo.tsx             // Server — inline SVG, no network fetch
  MainNav.tsx          // Client — usePathname() for active link
  HeaderActions.tsx    // Client — search/wishlist/cart/account/hamburger triggers
                       //          (absorbs MobileMenuButton + AccountMenu dropdown)
  MobileDrawer.tsx     // Client — lazy-loaded Framer Motion slide-in panel
  Header.test.tsx      // RTL component tests
```

Every file MUST stay under 300 lines per CLAUDE.md §4.

## A4. Sticky / Scroll Behaviour

- `fixed top-0 left-0 right-0 z-50`; body has top padding equal to header height to avoid jump.
- Y = 0 → fully opaque cream. Y > 64 → adds `border-b border-beige` and shrinks to 64 px (desktop only).
- Transition: 200 ms `ease-out` on `height`, `box-shadow`, `background-color`.
- **No hide-on-scroll** in v1 — matches aliffnoon and avoids iOS Safari jank.
- Driven by a single `useScroll()` (Framer Motion) in `HeaderClient.tsx` — no per-frame React re-render.

## A5. Interactions

| Trigger                       | Behaviour                                                                                       |
| ----------------------------- | ----------------------------------------------------------------------------------------------- |
| Hover nav link (desktop)      | Text → maroon over 200 ms; gold underline grows from centre-out                                 |
| Active route                  | Permanent gold underline + maroon text                                                          |
| Hover icon button             | Text → maroon, scale 1.05 over 150 ms                                                           |
| Click search / cart icon      | Opens `useSearchModal()` / `useCartDrawer()` — modal+drawer contents out of scope (own specs)   |
| Click wishlist                | `<Link href="/wishlist">`                                                                       |
| Click account (out / in)      | Link to `/login` if logged out; toggle account dropdown if logged in                            |
| Click hamburger (mobile)      | Opens `<MobileDrawer>` — slide-in right, 320 ms ease-out, backdrop fades in                     |
| Inside mobile drawer          | Tap link soft-navigates + closes; tap backdrop closes; Escape closes                            |

### Account dropdown menu

Items (in order): **My Account · Orders · Wishlist · — · Sign out**.
Closes on: outside click, Escape, route change, or blur of the last focusable item.

## A6. State Management

| Concern      | Source                                                                                                    |
| ------------ | --------------------------------------------------------------------------------------------------------- |
| Cart count   | `useCartStore` (`src/stores/cart.ts`), persisted to `localStorage` via `zustand/persist`. Memoised `count` selector subscribed in `HeaderActions`. |
| Auth session | `useSession()` from `next-auth/react`. `status === 'loading'` renders a skeleton avatar (no FOUC).        |
| Local UI     | Mobile-drawer and account-menu open/close state lives in `HeaderClient.tsx` (plain `useState`).           |
| Active route | `usePathname()` in `MainNav.tsx` — derived per render, no state.                                          |

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

A four-column maroon footer on desktop → 2 × 2 on tablet → stacked accordion on mobile.
Anchored to page bottom via `mt-auto` on the body's flex column. Houses brand reassurance,
secondary nav, newsletter capture, and trust elements. Lives at `src/components/layout/Footer/`.

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
  Footer.tsx           // Server — composition, category DB fetch, brand block,
                       //          payment icons, trust badges, bottom strip
  FooterColumn.tsx     // Server/Client — one component handles Brand/Shop/Help/Connect
                       //                 and the mobile accordion behaviour
  NewsletterForm.tsx   // Client — Server Action invocation, useActionState
  SocialIcons.tsx      // Server — reads env at module scope; includes WhatsApp pill
  BackToTopButton.tsx  // Client — throttled scroll listener
  Footer.test.tsx      // RTL
```

## B4. Newsletter form

Submits to Server Action `subscribeNewsletter`. Full implementation in `14-newsletter.md`
(TBD). Contract this spec owns:

- Single `<input type="email" required>` with visually-hidden `<label>` and `aria-describedby` pointing at a status `<p aria-live="polite">`.
- Submit handled via `useActionState` (Next 16 / React 19); button renders spinner + `aria-busy="true"` during the transition.
- Validation, rate-limiting, persistence: Server Action's responsibility, not this spec's.

### Form states

| State              | UI                                                                       |
| ------------------ | ------------------------------------------------------------------------ |
| Idle               | Email input + button                                                     |
| Submitting         | Button shows spinner, disabled, `aria-busy="true"`                       |
| Success            | Inline cream-coloured success message (replaces form on first subscribe) |
| Already subscribed | Same success treatment but message reads "You're already subscribed"     |
| Validation error   | Red inline error under input, focus moves to input                       |
| Rate-limited       | Same as validation error with rate-limit message                         |

## B5. Social / Payment / Trust elements

| Element       | Source                                                                    | Notes                                                                                  |
| ------------- | ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Instagram     | `lucide-react` `Instagram`                                                | Rendered only if its env URL is set. Each social link opens in a new tab, `rel="noopener noreferrer"`, with an `aria-label`. |
| Facebook      | `lucide-react` `Facebook`                                                 | Same rule as above.                                                                    |
| TikTok        | Inline SVG at `public/icons/tiktok.svg` (lucide ships no TikTok glyph)    | Same rule as above.                                                                    |
| WhatsApp pill | `lucide-react` `MessageCircle` inside a pill button linking to `wa.me`    | Always rendered (separate from the floating WhatsApp button — that's its own spec).    |
| Payment icons | Static SVGs in `public/icons/payment/` (`cod.svg`, `bank-transfer.svg`)   | Rendered via `next/image` with explicit `width`/`height`.                              |
| Trust badges  | `lucide-react` `ShieldCheck` / `RefreshCcw` / `Lock` + caption            | Pure informational — no link.                                                          |

## B6. Back-to-top button

- `fixed bottom-6 right-6 z-40`; hidden by default, fades in at `scrollY > 600` (200 ms).
- Click → `window.scrollTo({ top: 0, behavior: 'smooth' })`; reduced motion → `behavior: 'auto'`.
- `<button aria-label="Back to top">` with `lucide-react` `ArrowUp`.
- Passive `scroll` listener throttled at 100 ms per CLAUDE.md §9; removed on unmount.

## B7. Mobile accordion

- `<FooterColumn>` is a collapsible accordion on mobile, a static block on tablet/desktop.
- Header is `<button aria-expanded aria-controls={panelId}>` with a chevron rotating 180 ° on open.
- Body height animated via Framer Motion `<AnimatePresence>` on `height: 0 ↔ 'auto'`.
- Columns are independent (multiple can be open at once).
- `prefers-reduced-motion`: no height animation — toggle visibility instantly.

## B8. Data Requirements

- **Categories** — fetched server-side via Prisma, cached with `unstable_cache` (tag `categories`, 24 h revalidate). Admin category mutations call `revalidateTag('categories')`. DB failure → fall back to `FALLBACK_CATEGORIES` in `src/lib/constants/categories.ts`.
- **Env vars** — social URLs, WhatsApp phone, and Resend credentials are validated by the env schema in `src/lib/env.ts`. A missing optional social URL omits its icon (no broken link).

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

| Concern              | Decision                                                                                              |
| -------------------- | ----------------------------------------------------------------------------------------------------- |
| Logo                 | Inline React SVG — zero network fetch, no LCP cost, CSS-styleable                                     |
| Other icons          | `lucide-react` named imports only — tree-shaken                                                       |
| Mobile drawer        | `dynamic(() => import('./MobileDrawer'), { ssr: false })`; loaded only after hamburger tap            |
| Footer               | Server-rendered; no lazy load                                                                         |
| Payment icon SVGs    | `next/image` with explicit `width`/`height`, served from `public/`                                    |
| Scroll listener      | Throttled at 100 ms per CLAUDE.md §9                                                                  |
| Cart store hydration | `zustand/persist`; reads localStorage in `useEffect` to avoid hydration mismatch                      |
| Bundle               | Header + Footer combined target: < 30 KB gzip contribution to the layout chunk                        |

## S2. Tech-stack split — Server vs. Client

| File                  | Boundary          | Reason                                                |
| --------------------- | ----------------- | ----------------------------------------------------- |
| `Header.tsx`          | **Server**        | Composition shell; no interactivity at this level     |
| `HeaderClient.tsx`    | **Client**        | Wraps interactive children, owns scroll/menu state    |
| `Logo.tsx`            | **Server**        | Pure SVG                                              |
| `MainNav.tsx`         | **Client**        | `usePathname()` for active state                      |
| `HeaderActions.tsx`   | **Client**        | Zustand cart, NextAuth session, account dropdown, hamburger toggle |
| `MobileDrawer.tsx`    | **Client**        | Animation + focus trap                                |
| `Footer.tsx`          | **Server**        | Static + Prisma DB read                               |
| `FooterColumn.tsx`    | **Client**        | Accordion open/close state on mobile                  |
| `NewsletterForm.tsx`  | **Client**        | `useActionState` for transitions                      |
| `SocialIcons.tsx`     | **Server**        | Reads env vars at module scope                        |
| `BackToTopButton.tsx` | **Client**        | Scroll listener                                       |

## S3. Design tokens

Add a `@theme` block to `src/app/globals.css` exposing `--color-brand-{black,maroon,gold,beige,cream}` (hex values per §3) and `--font-display: 'Playfair Display', ui-serif, Georgia, serif` / `--font-body: 'Inter', ui-sans-serif, system-ui`. Tailwind v4 consumes `@theme` natively — no `tailwind.config` entry needed. Replace the placeholder `Geist` fonts in `app/layout.tsx` with `next/font/google` for Playfair + Inter when this spec is implemented.

## S4. Test cases

### Vitest unit

- `useCartStore` — `add` increments count, `remove` decrements, `setQuantity` to 0 deletes, `clear` empties.
- `subscribeNewsletter` — happy path (new email), duplicate active, invalid email. (Full coverage in newsletter spec.)

### React Testing Library (component)

- **Header** — desktop renders all 5 nav items; cart badge reflects mocked count + live region announces; active route highlight matches mocked `usePathname`; mobile drawer opens on hamburger click and closes on Escape.
- **Footer** — 4-column desktop vs collapsed accordion mobile; newsletter happy path with mocked Server Action; social icon omitted when corresponding env var is missing; categories fall back to hardcoded list when prop is empty.

### Playwright E2E

1. **Sticky header** — load home, scroll 200 px, assert header has scrolled-state class.
2. **Cart counter** — add product from PDP, return to home, badge shows `1`.
3. **Mobile drawer** — viewport 375 px, tap hamburger, drawer visible, tap link, navigated + drawer closed.
4. **Newsletter happy path** — fill footer email, submit, success message visible within 2 s.
5. **Keyboard tour** — Tab from skip-link → header nav → content → footer links → newsletter input → submit → social. No traps; focus rings visible at every step.

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
- Newsletter Server Action implementation, email templates, double-opt-in flow — see [Newsletter spec — TBD].
- `NewsletterSubscriber` Prisma model — see [Database schema spec — TBD].
- Admin dashboard layout chrome — admin uses a different shell.
- Floating WhatsApp button (separate component, separate spec).
- AI chatbot launcher — separate spec.
- PWA install prompt — separate spec.

## S8. Implementation notes

- Mobile-first — smallest breakpoint first, then `sm:`/`md:`/`lg:`/`xl:` modifiers.
- All tokens consumed via Tailwind classes referencing `@theme` in `globals.css` — no inline `style={{ color: '#...' }}`.
- Visible focus state on every interactive element: `focus-visible:ring-2 ring-brand-gold ring-offset-2 ring-offset-brand-cream` on the Header; `focus-visible:ring-brand-cream` on the maroon Footer.
- `Header.test.tsx` and `Footer.test.tsx` must NOT depend on sibling components beyond their own children. Co-locate tests per CLAUDE.md §12.
- Reference `node_modules/next/dist/docs/` before using App Router APIs (`unstable_cache`, Server Actions, `useActionState`) — Next.js 16 may differ from training data.
- `data-testid` only on elements targeted by Playwright; prefer role/text queries elsewhere.
