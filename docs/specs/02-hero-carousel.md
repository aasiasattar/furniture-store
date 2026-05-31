# Feature: Hero Carousel

> Full-width homepage hero with 3–5 rotating slides. First impression for every
> visitor — premium aliffnoon-style feel, accessible, performant, motion-respecting.

## Overview

The HeroCarousel is the topmost component on the homepage (`app/page.tsx`), occupying
~85 % of the viewport on desktop and 70 % on mobile. It cycles 3–5 image slides, each
carrying a heading, subheading, and CTA button. Auto-plays at 6 s intervals, pauses on
hover and focus, and respects `prefers-reduced-motion`. Lives at
`src/components/home/HeroCarousel.tsx`.

## User Stories

- **Shopper landing on the homepage** — see a hero image, headline, and "Shop now" CTA above the fold.
- **Shopper on mobile** — swipe between slides naturally; no arrow buttons blocking the image.
- **Keyboard / screen-reader user** — navigate slides with arrow keys; "Skip carousel" link bypasses the section; each slide is announced via `aria-live`.
- **User with `prefers-reduced-motion`** — no Ken Burns zoom, no horizontal slide animation, no auto-advance.
- **Brand stakeholder** — premium aesthetic (Playfair headline on cream, gold CTA on muted overlay) matches the aliffnoon reference.

---

## Visual Design

### Dimensions

| Viewport            | Height | Width                    |
| ------------------- | ------ | ------------------------ |
| Mobile (`<768 px`)  | `70vh` | full-width, edge-to-edge |
| Desktop (`≥768 px`) | `85vh` | full-width, edge-to-edge |

### Slide layout

```
┌────────────────────────────────────────────────────────────────────┐
│                                                                    │
│  ◀                                                              ▶  │
│                                                                    │
│                    HEADING (Playfair, cream)                       │
│                                                                    │
│                   Subheading (Inter, beige)                        │
│                                                                    │
│                          [ SHOP NOW ]                              │
│                                                                    │
│                                                                    │
│                       ● ● ●        ▷ (pause)                       │
└────────────────────────────────────────────────────────────────────┘
```

Each slide stacks: background image (`fill`, `object-cover`) → dark overlay (`bg-black/40`) → centred content column.

### Colours (from CLAUDE.md §3)

| Element                 | Token                  | Hex       |
| ----------------------- | ---------------------- | --------- |
| Dark overlay over image | `--color-black` @ 40 % | `#1a1a1a` |
| Heading                 | `--color-cream`        | `#FAF7F2` |
| Subheading              | `--color-beige`        | `#E8DCC4` |
| CTA background          | `--color-gold`         | `#C9A961` |
| CTA text                | `--color-black`        | `#1a1a1a` |
| CTA hover background    | `--color-cream`        | `#FAF7F2` |
| Active dot / focus ring | `--color-gold`         | `#C9A961` |
| Inactive dot            | `--color-cream` @ 50 % | —         |

### Typography

- **Heading** — Playfair Display 700, `clamp(2rem, 6vw, 4.5rem)`, tight leading.
- **Subheading** — Inter 400, `clamp(1rem, 2vw, 1.25rem)`, max width 60 ch.
- **CTA** — Inter 600, `text-sm`, `uppercase`, `tracking-wider`.

### Controls

| Control            | Position                                         | Size                                         | Visibility                                              |
| ------------------ | ------------------------------------------------ | -------------------------------------------- | ------------------------------------------------------- |
| Prev / next arrows | `left-4` / `right-4`, `top-1/2 -translate-y-1/2` | `w-12 h-12`, rounded-full                    | Desktop only (`hidden md:flex`)                         |
| Dot indicators     | `bottom-6 left-1/2 -translate-x-1/2`             | `w-2 h-2` inactive / `w-3 h-2` active (pill) | All viewports                                           |
| Pause / play       | `bottom-6 right-6`                               | `w-8 h-8`, rounded-full                      | Hidden when `autoPlay={false}` or `slides.length === 1` |

---

## Animations & Reduced Motion

- **Slide transition** — direction-aware horizontal slide via Framer Motion `AnimatePresence` + `custom` prop. Duration **400 ms**, easing `[0.25, 0.1, 0.25, 1]`.
- **Ken Burns** — active slide image scales `1 → 1.08` over `interval / 1000` seconds, linear easing. Wrapping `motion.div` is keyed by `currentSlide` so the zoom resets per slide.
- **Auto-play** — `setInterval` advancing one slide every **6000 ms** (configurable, clamped to ≥ 1000 ms). Cleanup on unmount and on every dependency change to prevent interval stacking.
- **Pause** — auto-play pauses on `mouseenter`, on `focus`, AND when the pause button is toggled on. Resumes on `mouseleave` + `blur` + button toggle off.
- **`prefers-reduced-motion: reduce`** — guarded via `useReducedMotion()`. Slide transition becomes opacity-only; Ken Burns, drag, and auto-play are all disabled. Controls remain fully functional.

---

## Navigation

| Trigger                           | Behaviour                                                                                  |
| --------------------------------- | ------------------------------------------------------------------------------------------ |
| Click next / prev arrow (desktop) | Advance / rewind one slide; wraps at boundaries                                            |
| Click dot indicator               | Jump directly to that slide; direction inferred from relative index                        |
| Swipe left / right (mobile)       | Framer Motion `drag="x"` with velocity-aware power threshold (> 10000)                     |
| `ArrowRight` / `ArrowLeft` key    | Advance / rewind one slide; `e.preventDefault()` blocks page scroll                        |
| Click pause / play                | Toggles auto-play; updates `aria-pressed`                                                  |
| Click "Skip carousel" link        | Focus moves to `<div id="after-hero" />` placed immediately after the carousel `<section>` |

---

## Data Shape (TypeScript)

```ts
interface Slide {
  id: string;
  image: string; // Cloudinary URL
  heading: string;
  subheading: string;
  ctaText: string;
  ctaLink: string; // internal path "/products/..." OR external "https://..."
  alt: string; // descriptive alt text for the background image
}

interface HeroCarouselProps {
  slides: Slide[];
  autoPlay?: boolean; // default: true
  interval?: number; // ms between slides; default: 6000; clamped to >= 1000
  showArrows?: boolean; // default: true (still hidden on mobile via CSS)
  showDots?: boolean; // default: true
  className?: string; // for layout integration
}
```

`ctaLink` starting with `http` → `<a target="_blank" rel="noopener noreferrer">`. Otherwise → Next.js `<Link>`.

---

## Performance

| Concern            | Decision                                                                                        |
| ------------------ | ----------------------------------------------------------------------------------------------- |
| First slide LCP    | `next/image` with `preload={true}` — **Next.js 16 deprecates `priority`**                       |
| Other slides       | No `preload` — lazy-loaded by default                                                           |
| Next-slide warmup  | Off-screen render of `slides[(current + 1) % len]` with `preload={true}` for snappy transitions |
| Image sizing       | `sizes="100vw"` on all carousel images (always full-viewport-width)                             |
| WebP / AVIF        | Negotiated automatically by Cloudinary + `next/image`                                           |
| Auto-play interval | `setInterval` cleanup on every effect re-run prevents stacking                                  |
| Bundle             | Component target: < 15 KB gzip (excluding the Framer Motion chunk shared with layout)           |

---

## Accessibility

| Requirement       | How                                                                                                                                           |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Carousel landmark | `<section aria-roledescription="carousel" aria-label="Featured furniture collection">`                                                        |
| Live region       | `<div aria-live="polite" aria-atomic="true" class="sr-only">Slide X of Y: {heading}</div>` updates on every slide change                      |
| Active slide      | `<motion.div role="group" aria-roledescription="slide" aria-label="X of Y: {heading}">`                                                       |
| Skip link         | `<a href="#after-hero" class="sr-only focus:not-sr-only">Skip carousel</a>` placed BEFORE the section; `<div id="after-hero" />` placed AFTER |
| Arrow buttons     | `aria-label="Previous slide"` / `aria-label="Next slide"`                                                                                     |
| Dot list          | `<div role="tablist" aria-label="Carousel navigation">` with `<button role="tab" aria-selected aria-label="Go to slide N: {heading}">`        |
| Pause / play      | `aria-label="Pause carousel"` / `"Play carousel"` + `aria-pressed={isPaused}`                                                                 |
| Pause on focus    | Auto-play pauses on `onFocus` AND on `onMouseEnter`                                                                                           |
| Reduced motion    | `useReducedMotion()` disables slide animation, Ken Burns, drag, and auto-play                                                                 |
| Colour contrast   | Cream on dark overlay = 12.4:1 ✓ · Gold-on-black CTA = 9.6:1 ✓                                                                                |

---

## Files Required

```
src/components/home/
  HeroCarousel.tsx       // Client component — animations, state, gestures, ARIA
  HeroCarousel.test.tsx  // RTL component tests + Vitest fake timers for auto-play
```

Wholly client-side (`'use client'`) — owns slide index, paused state, swipe handler, keyboard handler, and Framer Motion machinery. Slide data is passed via props; fetching is the caller's responsibility.

---

## Edge Cases

| Case                               | Expected                                                                           |
| ---------------------------------- | ---------------------------------------------------------------------------------- |
| `slides` is `[]`                   | Return `null` — render nothing (do not throw)                                      |
| `slides.length === 1`              | Render the single slide; hide arrows, dots, and pause/play button                  |
| `slide.image` fails to load        | `onError` swaps in a beige (`bg-[#E8DCC4]`) placeholder div behind the overlay     |
| `interval < 1000`                  | Clamp to `Math.max(interval, 1000)` to prevent strobing                            |
| Very long heading (> ~80 chars)    | `line-clamp-3` + `max-w-prose` on the heading container                            |
| `ctaLink` starts with `http`       | Render `<a target="_blank" rel="noopener noreferrer">` (security)                  |
| `ctaLink` is an internal path      | Render Next.js `<Link>` for soft navigation                                        |
| `autoPlay={false}`                 | Skip the interval entirely; hide the pause/play button (no state to toggle)        |
| `prefers-reduced-motion: reduce`   | No slide animation, no Ken Burns, no drag, no auto-play; controls still functional |
| User tab-traps inside the carousel | Skip link is the first focusable element — Tab once + Enter exits the section      |

---

## Test Cases

### Vitest + React Testing Library (component)

- Renders the first slide's heading, subheading, and CTA on mount.
- Renders `null` when `slides` is empty.
- Hides arrows, dots, and pause button when `slides.length === 1`.
- Clicking `data-testid="next-btn"` advances to slide 2; from the last slide, wraps to the first.
- Clicking `data-testid="dot-1"` jumps to slide 2; that dot's `aria-selected` becomes `"true"`.
- Pressing `ArrowRight` / `ArrowLeft` triggers next / prev.
- `mouseenter` and `focus` on the section pause auto-play; `mouseleave` + `blur` resume.
- With `vi.useFakeTimers()` and `autoPlay={true}`, advancing time by `interval` ms moves to the next slide.
- With `useReducedMotion` mocked to `true`, no slide-transition `transform` is applied and the auto-play timer is never started.
- External `ctaLink` (`https://…`) renders as `<a target="_blank">`; internal renders as Next.js `<Link>`.

### Playwright E2E

1. **Auto-play happy path** — load `/`, wait 7 s, assert slide 2's heading is in the DOM and the `aria-live` region announces it.
2. **Swipe on mobile** — emulate 375 px viewport, drag left on the carousel, slide 2 becomes active.
3. **Keyboard tour** — Tab focuses skip link first; Enter on skip link moves focus past the carousel; from the active section, Right arrow advances the slide.

---

## Acceptance Criteria

- [ ] Component lives at `src/components/home/HeroCarousel.tsx` and is composed into `app/page.tsx`.
- [ ] Heights: `70vh` on mobile, `85vh` from `md:` upward; full-width.
- [ ] Auto-play advances slides every 6000 ms; pauses on hover, focus, and pause-button toggle.
- [ ] Direction-aware slide transition runs in 400 ms.
- [ ] Ken Burns zoom is active on the visible slide and resets on slide change.
- [ ] Dots, arrows (desktop only), and pause button render and operate per the navigation table.
- [ ] Swipe (mobile) and Left/Right arrow keys navigate slides.
- [ ] First slide image uses `next/image` with `preload={true}`; others lazy.
- [ ] All ARIA roles, labels, and live region announcements present per the accessibility table.
- [ ] `useReducedMotion()` disables all motion and auto-play.
- [ ] Every edge case in the table above is handled.
- [ ] Lighthouse a11y ≥ 95 on `/`.
- [ ] No `any` types without a justification comment.
- [ ] Only design-system colours used (no `bg-white`, `text-gray-*`, etc.).
- [ ] `HeroCarousel.test.tsx` covers every Vitest/RTL case listed above.

---

## Out of Scope (Phase 2)

- Slide content management from the admin dashboard — slides are passed as props for v1; CRUD UI lands in a later spec.
- Video slides — image only for v1.
- Per-slide animation overrides (each slide picking its own transition).
- A/B testing or analytics-driven slide ordering.

---

## Implementation Reference

Animation code patterns, ARIA markup snippets, and the detailed test-checklist with `data-testid` conventions live in `.claude/skills/hero-carousel/references/spec.md`. That file is the canonical implementation reference; this file is the feature contract.
