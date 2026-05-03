---
name: hero-carousel
description: "Generates a complete, production-ready HeroCarousel component for the furniture store homepage. This skill should be used when creating any hero carousel, hero slider, homepage banner, image slider, or hero section component — regardless of how the request is phrased. This skill should be used for new HeroCarousel components and refactoring existing carousel code to meet project standards. This skill should not be used for product image galleries, thumbnail carousels, or admin-facing components."
---

# Hero Carousel

Produce two files every time this skill is invoked:

1. `src/components/home/HeroCarousel.tsx` — the React component
2. `src/components/home/HeroCarousel.test.tsx` — the co-located test file

## Out of Scope

This skill renders the carousel UI only. It does NOT:
- Fetch slide data from Supabase — accept the `slides` prop; data fetching is the caller's responsibility
- Implement modal or lightbox behaviour — CTA buttons navigate via `ctaLink`
- Build thumbnail or product-image carousels — those are separate components
- Build admin carousel management UI — that is a separate component

## Reference Files

| File | Read When |
|---|---|
| `references/spec.md` | Every invocation — canonical `Slide` interface, design tokens, animation specs, ARIA structure, test checklist |

## Variability Analysis

| What VARIES (ask user or infer) | What is CONSTANT (encoded in this skill) |
|---|---|
| Slide content (headings, images, CTAs) | `Slide` TypeScript interface — never alter the shape |
| `autoPlay` / `interval` / `showArrows` / `showDots` props | Colour palette — only the 5 tokens from CLAUDE.md |
| Custom `className` for layout integration | Animation — 400ms cubic-bezier slide transition, 6s Ken Burns zoom |
| Static vs prop-driven slide data | ARIA structure — carousel/slide roles, aria-live always present |
| Existing file vs new creation | Performance — first slide always `preload={true}`; others lazy |
| | Test coverage — all checklist items mandatory |

## Required Dependencies

Ensure these packages are installed before generating code:

| Package | Version | Purpose | Changelog |
|---|---|---|---|
| `framer-motion` | v10+ | `AnimatePresence`, `motion`, `useReducedMotion`, drag gestures | https://github.com/framer/motion/releases |
| `next` | 16 | `next/image` (`preload`, `fill`), `next/link` | https://github.com/vercel/next.js/releases |
| `@heroicons/react` | v2 | `ChevronLeftIcon`, `ChevronRightIcon`, `PauseIcon`, `PlayIcon` | https://github.com/tailwindlabs/heroicons/releases |
| `@testing-library/react` | latest | Component tests | https://github.com/testing-library/react-testing-library/releases |
| `@testing-library/user-event` | latest | Interaction simulation | https://github.com/testing-library/user-event/releases |

If `framer-motion` is missing, tell the user to run `pnpm add framer-motion` before proceeding.

## Required Clarifications

Before writing any code, check conversation history for answers. Only ask what cannot be inferred:

1. **Slide data strategy**: Should slides be passed via the `slides` prop (flexible, recommended) or hardcoded as a constant inside the component file?
   - Props-based → standard implementation; add a `PLACEHOLDER_SLIDES` constant as a usage example
   - Hardcoded → define `DEFAULT_SLIDES` inside the file; still export the `HeroCarouselProps` interface
   - If not specified: props-based with a `PLACEHOLDER_SLIDES` constant

## Optional Clarifications

2. **Custom className**: Is a custom `className` needed for integration into a page layout?
   - If yes: the prop is already defined in `HeroCarouselProps`
   - If not mentioned: omit from usage examples

## Automated Check (no need to ask)

3. **Existing file**: Check if `src/components/home/HeroCarousel.tsx` already exists.
   - If it exists: read it first, then refactor to match spec — do NOT overwrite without confirming
   - If it does not exist: create fresh

## Before Implementation

Gather context from all available sources before writing code:

| Source | What to Gather |
|---|---|
| **Codebase** | Check `src/components/home/` for existing `HeroCarousel.tsx` — refactor rather than overwrite. Grep `src/` for `HeroCarousel` to find all import sites before refactoring |
| **Conversation** | Slide content, autoPlay preference, className, any design overrides discussed |
| **Skill References** | Read `references/spec.md` — canonical `Slide` interface, animation specs, ARIA structure, test checklist |
| **CLAUDE.md** | Confirm `font-heading` and `font-body` aliases exist in `globals.css @theme inline`; if absent, use `font-['Playfair_Display']` / `font-['Inter']` directly |

Do not rely on memory for design tokens, animation values, or ARIA patterns. Always read `references/spec.md` fresh.

## Workflow

### 1. Read the spec
Load `references/spec.md`. Confirm you have the `Slide` interface, design tokens, animation specs, ARIA structure, and test checklist before proceeding.

### 2. Determine slide data strategy
- **Props-based** (default): `slides: Slide[]` required prop; add `PLACEHOLDER_SLIDES` example constant
- **Hardcoded**: define `DEFAULT_SLIDES` inside file; component still exports `HeroCarouselProps`

### 3. Generate HeroCarousel.tsx

Follow this sequence strictly:

1. Write the `Slide` TypeScript interface (from spec — do not alter the shape)
2. Write the `HeroCarouselProps` interface
3. Import `useReducedMotion`, `AnimatePresence`, `motion` from `framer-motion`
4. Define `slideVariants` — direction-aware enter/center/exit; fade-only when `reducedMotion` is true
5. Implement auto-play: `setInterval` with cleanup, paused by hover and focus events
6. Build slide container: `AnimatePresence` wrapping the active `motion.div` slide
7. Inside each slide: Ken Burns `motion.div` wrapping `next/image` (guarded by `reducedMotion`)
8. Build slide content overlay (heading, subheading, CTA button or link)
9. Build navigation: arrow buttons (desktop only), dot indicators, pause/play button
10. Implement swipe via Framer Motion `drag="x"` with `swipePower` confidence threshold
11. Add `onKeyDown` on the `<section>` for Left/Right arrow key navigation
12. Wire all ARIA attributes per spec (carousel section, live region, slide groups, dots tablist)
13. Add skip carousel `<a>` link before the section; add `<div id="after-hero" />` after
14. Verify every design token is from the palette — no ad-hoc colours

### 4. Generate HeroCarousel.test.tsx
Cover every item in the test checklist in `references/spec.md`. Use `vi.useFakeTimers()` for auto-play tests. Mock `useReducedMotion` to test both motion states. Do not skip edge cases.

### 5. Self-check before outputting

- [ ] `Slide` interface matches spec exactly — no missing or renamed fields
- [ ] Only palette colours used (no raw Tailwind colours like `bg-white`, `text-gray-*`)
- [ ] `next/image` used — no `<img>` tag
- [ ] First slide has `preload={true}`; no other slides have `preload` (Next.js 16 — `priority` is deprecated)
- [ ] `useReducedMotion` guards ALL animations: slide transitions, Ken Burns, drag gestures
- [ ] `AnimatePresence` wraps active slide with direction-aware `custom` variants and `exit` defined
- [ ] `aria-roledescription="carousel"` on root `<section>`
- [ ] `aria-live="polite"` region present and updates on each slide change
- [ ] Skip carousel `<a href="#after-hero">` present before section; `<div id="after-hero" />` present after
- [ ] `data-testid` attributes on `next-btn`, `prev-btn`, `dot-{index}`, `pause-btn`
- [ ] No `any` type without a justification comment
- [ ] Test file covers render, navigation, keyboard, auto-play, accessibility, and edge cases
