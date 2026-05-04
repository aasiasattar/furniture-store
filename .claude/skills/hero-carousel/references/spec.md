# HeroCarousel Component Spec

## Official Documentation

| Resource                        | URL                                                           | Use For                                                    |
| ------------------------------- | ------------------------------------------------------------- | ---------------------------------------------------------- |
| `next/image`                    | https://nextjs.org/docs/app/api-reference/components/image    | `preload`, `fill`, `sizes`, lazy loading, `onError`        |
| Framer Motion `AnimatePresence` | https://www.framer.com/motion/animate-presence/               | Exit animations, `mode="wait"` vs default, `custom` prop   |
| `useReducedMotion`              | https://www.framer.com/motion/use-reduced-motion/             | Accessibility guard for all Framer Motion animations       |
| WAI-ARIA Carousel Pattern       | https://www.w3.org/WAI/ARIA/apg/patterns/carousel/            | `carousel`/`slide` roles, `aria-live`, keyboard navigation |
| React Testing Library           | https://testing-library.com/docs/react-testing-library/intro/ | Component testing patterns, query priority                 |

For patterns not covered in this spec, fetch from the relevant official docs above before making assumptions.
Example: to verify `AnimatePresence` `mode` prop behaviour during rapid consecutive slide changes, fetch the Framer Motion URL above rather than guessing.

---

## TypeScript Interface

```typescript
interface Slide {
  id: string;
  image: string; // Cloudinary URL
  heading: string;
  subheading: string;
  ctaText: string;
  ctaLink: string; // internal path ("/products/...") or external URL ("https://...")
  alt: string; // descriptive alt text for the slide background image
}

interface HeroCarouselProps {
  slides: Slide[];
  autoPlay?: boolean; // default: true
  interval?: number; // ms between slides; default: 6000; clamped to min 1000
  showArrows?: boolean; // default: true
  showDots?: boolean; // default: true
  className?: string;
}
```

## Design Tokens

### Colour Palette (use ONLY these values)

| Token        | Hex       | Tailwind utility                  |
| ------------ | --------- | --------------------------------- |
| Black        | `#1a1a1a` | `text-[#1a1a1a]` / `bg-[#1a1a1a]` |
| Maroon       | `#6B1F2E` | `text-[#6B1F2E]` / `bg-[#6B1F2E]` |
| Antique Gold | `#C9A961` | `text-[#C9A961]` / `bg-[#C9A961]` |
| Warm Beige   | `#E8DCC4` | `text-[#E8DCC4]` / `bg-[#E8DCC4]` |
| Cream White  | `#FAF7F2` | `text-[#FAF7F2]` / `bg-[#FAF7F2]` |

Do NOT use generic Tailwind colours (`bg-white`, `text-gray-*`, `bg-black`, etc.).

### Typography

- **Slide headings**: Playfair Display — use `font-heading` Tailwind alias if configured in `globals.css @theme inline`, otherwise `font-['Playfair_Display']`
- **Subheadings, CTA text, body**: Inter — use `font-body` alias if configured, otherwise `font-['Inter']`
- Verify alias availability in `globals.css` before choosing approach

### Spacing (8px grid)

Use Tailwind spacing at multiples of 2 units only: `p-2 p-4 p-6 p-8 p-12 p-16 gap-4 gap-8 …`
No arbitrary spacing like `p-[13px]`.

## Visual Requirements

### Dimensions

- **Desktop**: `h-[85vh]` — use `md:h-[85vh]` breakpoint
- **Mobile**: `h-[70vh]` — base class
- Full viewport width — no max-width constraint
- Combined: `className="w-full h-[70vh] md:h-[85vh] relative overflow-hidden"`

### Slide Structure

```
<section>                        ← carousel root, full w/h, relative
  <a href="#after-hero">         ← skip link, sr-only by default
  <div aria-live>                ← screen reader announcer, sr-only
  <motion.div>                   ← active slide, absolute inset-0 (AnimatePresence child)
    <motion.div>                 ← Ken Burns image wrapper, absolute inset-0
      <Image>                    ← next/image, fill, object-cover
    </motion.div>
    <div>                        ← dark scrim overlay, bg-[#1a1a1a]/40, absolute inset-0
    <div>                        ← content container, relative z-10, centered
      <h1 or h2>                 ← slide heading, Playfair Display, text-[#FAF7F2]
      <p>                        ← subheading, Inter, text-[#E8DCC4]
      <Link or a>                ← CTA button
  </motion.div>
  <button>                       ← prev arrow, hidden on mobile
  <button>                       ← next arrow, hidden on mobile
  <div role="tablist">           ← dots, bottom-center
  <button>                       ← pause/play, bottom-right
</section>
<div id="after-hero" />          ← skip link target
```

### CTA Button

- Background: `bg-[#C9A961]`, text: `text-[#1a1a1a]`, font: Inter
- Hover: `hover:bg-[#FAF7F2]`
- Padding: `px-8 py-3`, `font-semibold uppercase tracking-wider text-sm`
- Focus ring: `focus-visible:ring-2 focus-visible:ring-[#FAF7F2] focus-visible:ring-offset-2`
- Internal links (`ctaLink` does NOT start with "http"): render as `<Link href={ctaLink}>`
- External links (`ctaLink` starts with "http"): render as `<a href target="_blank" rel="noopener noreferrer">`

### Arrow Buttons

- `absolute top-1/2 -translate-y-1/2`, hidden on mobile: `hidden md:flex items-center justify-center`
- Prev: `left-4`; Next: `right-4`
- Size: `w-12 h-12 rounded-full`
- Background: `bg-[#FAF7F2]/20 hover:bg-[#FAF7F2]/40 transition-colors`
- Icon: `ChevronLeftIcon` / `ChevronRightIcon` from `@heroicons/react/24/outline`, `w-6 h-6 text-[#FAF7F2]`
- Focus ring: `focus-visible:ring-2 focus-visible:ring-[#C9A961] focus-visible:ring-offset-2`
- `data-testid="prev-btn"` / `data-testid="next-btn"`

### Dot Indicators

- `absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2`
- Inactive: `w-2 h-2 rounded-full bg-[#FAF7F2]/50 transition-all duration-300`
- Active: `w-3 h-2 rounded-full bg-[#C9A961] transition-all duration-300` (wider pill)
- `data-testid="dot-{index}"` on each button

### Pause/Play Button

- `absolute bottom-6 right-6 w-8 h-8 rounded-full flex items-center justify-center`
- Background: `bg-[#1a1a1a]/40 hover:bg-[#1a1a1a]/70 transition-colors`
- Icon: `PauseIcon` / `PlayIcon` from `@heroicons/react/24/solid`, `w-4 h-4 text-[#FAF7F2]`
- `data-testid="pause-btn"`

## Animation Implementation Patterns

### Slide Transition

✅ **Correct: direction-aware `AnimatePresence` with `custom` prop**

```tsx
const [[currentSlide, direction], setPage] = useState([0, 0])

const paginate = (dir: number) => {
  setPage(([page]) => [(page + dir + slides.length) % slides.length, dir])
}

const slideVariants = reducedMotion
  ? {
      enter: { opacity: 0 },
      center: { opacity: 1 },
      exit: { opacity: 0 },
    }
  : {
      enter: (d: number) => ({ x: d > 0 ? '100%' : '-100%', opacity: 0 }),
      center: { x: 0, opacity: 1 },
      exit: (d: number) => ({ x: d < 0 ? '100%' : '-100%', opacity: 0 }),
    }

<AnimatePresence initial={false} custom={direction}>
  <motion.div
    key={currentSlide}
    custom={direction}
    variants={slideVariants}
    initial="enter"
    animate="center"
    exit="exit"
    transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
    className="absolute inset-0"
  >
    {/* slide content */}
  </motion.div>
</AnimatePresence>
```

❌ **Avoid: CSS opacity toggle — no exit animation, old slide disappears instantly**

```tsx
{/* Flickers on change; previous slide vanishes without transition */}
<div className={`absolute inset-0 transition-opacity duration-400 ${
  index === currentSlide ? 'opacity-100' : 'opacity-0 pointer-events-none'
}`}>
```

### Ken Burns Effect

✅ **Correct: `motion.div` wrapping `Image`, keyed to reset on every slide change**

```tsx
<motion.div
  key={`kb-${currentSlide}`}
  className="absolute inset-0"
  initial={{ scale: 1 }}
  animate={reducedMotion ? { scale: 1 } : { scale: 1.08 }}
  transition={{ duration: Math.max(interval ?? 6000, 1000) / 1000, ease: 'linear' }}
>
  <Image src={slide.image} alt={slide.alt} fill className="object-cover" />
</motion.div>
```

❌ **Avoid: CSS `@keyframes` without key reset — zoom continues across slide changes**

```tsx
{/* Animation state not reset on slide change — produces continuous drifting zoom */}
<div className="absolute inset-0 animate-[kenburns_6s_linear_infinite]">
  <Image ... />
</div>
```

### Auto-play (interval cleanup is mandatory)

✅ **Correct: cleanup prevents interval stacking on re-render**

```tsx
useEffect(() => {
  if (!autoPlay || isPaused || reducedMotion) return;
  const clampedInterval = Math.max(interval ?? 6000, 1000);
  const id = setInterval(() => paginate(1), clampedInterval);
  return () => clearInterval(id);
}, [autoPlay, isPaused, interval, reducedMotion, currentSlide]);
```

❌ **Avoid: missing cleanup — intervals accumulate on every render, causing rapid firing**

```tsx
useEffect(() => {
  // No return — a new interval is added every time any dependency changes
  if (autoPlay && !isPaused) setInterval(() => paginate(1), interval);
}, [autoPlay, isPaused]);
```

### Touch Swipe

✅ **Correct: Framer Motion `drag` with velocity-aware confidence threshold**

```tsx
const SWIPE_THRESHOLD = 10000
const swipePower = (offset: number, velocity: number) => Math.abs(offset) * velocity

<motion.div
  drag={reducedMotion ? false : 'x'}
  dragConstraints={{ left: 0, right: 0 }}
  dragElastic={1}
  onDragEnd={(_e, { offset, velocity }) => {
    const power = swipePower(offset.x, velocity.x)
    if (power < -SWIPE_THRESHOLD) paginate(1)
    else if (power > SWIPE_THRESHOLD) paginate(-1)
  }}
  className="absolute inset-0"
>
```

❌ **Avoid: native `touchstart`/`touchend` — misses velocity; slow drags don't register**

```tsx
// A slow deliberate drag is ignored; fast flicks on desktop don't work
onTouchEnd={e => {
  if (touchStart - touchEnd > 50) next()
}}
```

## ARIA Structure

Place the skip link BEFORE the `<section>`. Place `<div id="after-hero" />` AFTER the `</section>`.

```html
<!-- Skip link -->
<a
  href="#after-hero"
  className="sr-only focus:not-sr-only focus:absolute focus:z-50
             focus:top-4 focus:left-4 focus:bg-[#FAF7F2] focus:text-[#1a1a1a]
             focus:px-4 focus:py-2 focus:rounded"
>
  Skip carousel
</a>

<section
  aria-roledescription="carousel"
  aria-label="Featured furniture collection"
  onMouseEnter={() => setIsPaused(true)}
  onMouseLeave={() => setIsPaused(false)}
  onFocus={() => setIsPaused(true)}
  onBlur={() => setIsPaused(false)}
  onKeyDown={handleKeyDown}
>
  <!-- Screen reader live region — update content on every slide change -->
  <div aria-live="polite" aria-atomic="true" className="sr-only">
    Slide {currentSlide + 1} of {slides.length}: {slides[currentSlide].heading}
  </div>

  <!-- Active slide (AnimatePresence child) -->
  <motion.div
    role="group"
    aria-roledescription="slide"
    aria-label={`${currentSlide + 1} of ${slides.length}: ${slides[currentSlide].heading}`}
  >
    ...
  </motion.div>

  <!-- Arrows -->
  <button aria-label="Previous slide">...</button>
  <button aria-label="Next slide">...</button>

  <!-- Dots -->
  <div role="tablist" aria-label="Carousel navigation">
    <button
      role="tab"
      aria-selected={index === currentSlide}
      aria-label={`Go to slide ${index + 1}: ${slide.heading}`}
    />
  </div>

  <!-- Pause/Play -->
  <button
    aria-label={isPaused ? 'Play carousel' : 'Pause carousel'}
    aria-pressed={isPaused}
  >
    ...
  </button>
</section>

<div id="after-hero" />
```

## Keyboard Interaction

```typescript
const handleKeyDown = (e: React.KeyboardEvent) => {
  if (e.key === 'ArrowRight') {
    e.preventDefault();
    paginate(1);
  }
  if (e.key === 'ArrowLeft') {
    e.preventDefault();
    paginate(-1);
  }
};
```

Attach to `<section onKeyDown={handleKeyDown}>`. `e.preventDefault()` prevents page scrolling.

## Performance Requirements

| Concern            | Implementation                                                                             |
| ------------------ | ------------------------------------------------------------------------------------------ |
| First slide LCP    | `preload={true}` on `slides[0]` image — **`priority` is deprecated in Next.js 16**         |
| Other slides       | No `preload` prop — lazy-loaded by default                                                 |
| Preload next slide | Apply `preload={true}` to `slides[(currentSlide + 1) % slides.length]` rendered off-screen |
| Image sizing       | `sizes="100vw"` on all carousel images — always full-viewport-width                        |
| WebP/AVIF          | Handled automatically by Cloudinary CDN + `next/image` format negotiation                  |

## Runtime Edge Cases

| Scenario                    | Safe Handling                                                                       |
| --------------------------- | ----------------------------------------------------------------------------------- |
| `slides` is empty (`[]`)    | Return `null` — render nothing, do not throw                                        |
| `slides.length === 1`       | Render the slide; hide all navigation (arrows, dots, pause button)                  |
| `interval` < 1000ms         | Clamp to `Math.max(interval, 1000)` to prevent flashing                             |
| `slide.image` fails to load | Add `onError` handler to swap in `bg-[#E8DCC4]` placeholder div                     |
| `ctaLink` is external URL   | Render `<a href rel="noopener noreferrer" target="_blank">` — not `<Link>`          |
| `autoPlay={false}`          | Skip timer entirely; do not render pause/play button                                |
| `useReducedMotion` true     | Disable all motion: no slide animation, no Ken Burns, no drag; instant opacity cuts |

## Accessibility Checklist

- [ ] Skip carousel `<a href="#after-hero">` present before `<section>`; `<div id="after-hero" />` present after
- [ ] `<section>` has `aria-roledescription="carousel"` and `aria-label`
- [ ] `aria-live="polite" aria-atomic="true"` region updates on every slide change
- [ ] Active slide `motion.div` has `role="group" aria-roledescription="slide" aria-label`
- [ ] Prev/next buttons have descriptive `aria-label`
- [ ] Dots container has `role="tablist" aria-label`; each dot has `role="tab" aria-selected aria-label`
- [ ] Pause/play button has `aria-label` and `aria-pressed`
- [ ] Carousel pauses on both `onMouseEnter` AND `onFocus` events
- [ ] All interactive elements have visible focus rings (`focus-visible:ring-2`)
- [ ] `useReducedMotion` disables all transitions, Ken Burns, and drag

## Test Coverage Checklist

### Render tests

- [ ] Renders first slide heading and subheading
- [ ] Renders CTA button with correct text
- [ ] Renders arrows when `showArrows={true}`; hides them when `false`
- [ ] Renders dots when `showDots={true}`; hides them when `false`
- [ ] Hides all navigation when `slides.length === 1`
- [ ] Renders nothing (`null`) when `slides` array is empty

### Navigation tests

- [ ] Clicking `data-testid="next-btn"` advances to slide 2
- [ ] Clicking `data-testid="prev-btn"` from slide 1 wraps to last slide
- [ ] Clicking `data-testid="dot-1"` navigates to slide 2
- [ ] Active dot has `aria-selected="true"`

### Keyboard tests

- [ ] `ArrowRight` key triggers next slide
- [ ] `ArrowLeft` key triggers previous slide
- [ ] Pause button (`data-testid="pause-btn"`) toggles `aria-pressed`

### Auto-play tests (`vi.useFakeTimers()`)

- [ ] Slide advances after `interval` ms when `autoPlay={true}`
- [ ] No advance when `autoPlay={false}`
- [ ] `mouseenter` event on carousel sets paused state
- [ ] `focus` event on carousel sets paused state

### Accessibility tests

- [ ] `<section>` has `aria-roledescription="carousel"`
- [ ] `aria-live` region contains current slide heading text
- [ ] Skip link `href` is `#after-hero`
- [ ] Pause/play button has `aria-pressed`

### Edge case tests

- [ ] Renders `null` when `slides` is empty
- [ ] No navigation controls rendered when `slides.length === 1`
- [ ] External `ctaLink` renders as `<a>` with `rel="noopener noreferrer"`
- [ ] Internal `ctaLink` renders as Next.js `<Link>`

## Keeping Current

| Trigger                           | Section to Update                                                                                        |
| --------------------------------- | -------------------------------------------------------------------------------------------------------- |
| CLAUDE.md palette or font changes | `## Design Tokens` — hex values, Tailwind utilities                                                      |
| Next.js major version bump        | `## Performance Requirements` — verify `preload`, `fill`, `sizes` against `node_modules/next/dist/docs/` |
| Framer Motion major version bump  | `## Animation Implementation Patterns` — verify `AnimatePresence`, `drag`, `useReducedMotion` API        |
| Heroicons major version bump      | `### Arrow Buttons`, `### Pause/Play Button` — verify import paths (`/24/outline`, `/24/solid`)          |
| WAI-ARIA Carousel Pattern update  | `## ARIA Structure` — re-verify roles, properties, keyboard interaction                                  |

Last verified: 2026-05
