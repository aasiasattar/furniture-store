<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# CLAUDE.md — Furniture Store Project Constitution

> This file is the single source of truth for how this project is built and maintained.
> Every rule here must be followed in every session, no exceptions.

---

## 1. PROJECT OVERVIEW

- Furniture ecommerce portfolio project
- Built with Next.js 16, TypeScript, Tailwind CSS
- Inspired by aliffnoon.com design aesthetic
- Target: Production-quality portfolio piece demonstrating full-stack skills
- Audience: Potential employers / clients reviewing portfolio

---

## 2. TECH STACK

| Layer | Technology |
|---|---|
| Frontend & Backend | Next.js 16 (App Router) + TypeScript |
| Styling | Tailwind CSS + Shadcn/ui |
| Animations | Framer Motion |
| Database | Supabase (PostgreSQL) + Prisma ORM |
| Auth | NextAuth.js |
| Image hosting | Cloudinary |
| Email | Resend |
| AI Chatbot | Claude API |
| Hosting | Vercel |
| Package manager | pnpm |

---

## 3. DESIGN SYSTEM

### Colors
| Name | Hex |
|---|---|
| Black | `#1a1a1a` |
| Maroon | `#6B1F2E` |
| Antique Gold | `#C9A961` |
| Warm Beige | `#E8DCC4` |
| Cream White | `#FAF7F2` |

### Typography
- **Headings:** Playfair Display
- **Body:** Inter

### Style
- Premium, luxurious, warm
- No harsh whites or cold greys — always use cream/beige tones

---

## 4. CODING STANDARDS

- TypeScript strict mode — no `any` unless justified with a comment explaining why
- Server Components by default; add `'use client'` only when required (event handlers, hooks, browser APIs)
- Server Actions preferred over API routes for mutations
- Always check `node_modules/next/dist/docs/` before using any Next.js API — do not rely on training data alone
- Absolute imports with `@/` prefix (e.g. `@/components/ui/Button`)

### Naming conventions
| Thing | Convention |
|---|---|
| Components | `PascalCase` |
| Utilities / helpers | `camelCase` |
| Custom hooks | `use` prefix (e.g. `useCart`) |
| Constants | `UPPER_SNAKE_CASE` |
| Types / Interfaces | `PascalCase` |

### File rules
- One component per file
- Max file length: 300 lines — split into sub-components if exceeded
- All components must meet WCAG 2.1 AA accessibility standards
- Mobile-first responsive design (design for 320px first, then scale up)

---

## 5. FOLDER STRUCTURE

```
src/
  app/               # Pages — App Router file conventions
  components/
    ui/              # Reusable, generic UI components (Button, Input, Modal…)
    layout/          # Header, Footer, Sidebar
    home/            # Homepage-specific sections
    product/         # Product card, gallery, reviews, stock counter
    admin/           # Admin dashboard components
  lib/               # Utilities, helpers, third-party configs
  hooks/             # Custom React hooks
  types/             # TypeScript types and interfaces
  stores/            # Zustand global state

prisma/              # Database schema and migrations
docs/specs/          # Per-feature specification files
tests/               # E2E and integration tests
```

---

## 6. ERROR HANDLING & RESILIENCE

- `try-catch` in every async operation — no unhandled promise rejections
- Custom error classes for distinct error types (e.g. `AuthError`, `NotFoundError`)
- `error.tsx` files in every route segment
- `not-found.tsx` for 404s
- `global-error.tsx` as top-level error boundary
- User-facing error messages must be friendly — never expose stack traces
- Log errors to Sentry in production; `console.error` in development only
- Graceful degradation: show cached/stale data if live API fails
- Retry logic for network requests: max 3 attempts with exponential backoff
- Form validation errors must be specific and actionable (e.g. "Password must be at least 8 characters" not just "Invalid input")

---

## 7. LOADING & UX STATES

- `loading.tsx` in every route segment
- Skeleton screens for content loading — no spinners
- Optimistic UI updates for cart and wishlist actions
- Suspense boundaries around all async components
- Empty states: include an illustration and a clear CTA (e.g. "Your cart is empty — Browse products")
- Disabled states must explain why the element is disabled
- Success states: confirm the action completed (e.g. "Added to cart!")

---

## 8. SECURITY REQUIREMENTS

- Never expose secrets client-side — use `NEXT_PUBLIC_` prefix only for truly public values
- All sensitive operations (payments, admin actions, DB writes) server-side only
- CSRF protection on all forms
- Rate limiting on auth endpoints: 5 attempts per 15 minutes
- Input sanitization via Zod schemas at all entry points
- SQL injection prevention: Prisma parameterizes all queries automatically
- XSS prevention: React escapes by default; never use `dangerouslySetInnerHTML` without sanitization
- Cookies: `httpOnly`, `secure`, `sameSite: 'strict'`
- Password hashing: bcrypt, minimum 10 rounds
- HTTPS only in production
- Content Security Policy headers configured
- Error details hidden in production (show generic message, log full error to Sentry)
- Admin routes protected with Next.js middleware (redirect unauthenticated users)

---

## 9. PERFORMANCE STANDARDS

### Targets
- Lighthouse: 90+ on all 4 categories (Performance, Accessibility, Best Practices, SEO)
- Core Web Vitals: LCP < 2.5s, FID < 100ms, CLS < 0.1
- Page JS bundles: < 200KB per page

### Rules
- Use `next/image` for ALL images — never a raw `<img>` tag
- Use `next/font` for fonts — no Google Fonts CDN link
- Lazy load all below-the-fold content
- Dynamic imports for heavy components (e.g. modals, rich text editors)
- Database queries: add indexes on all frequently queried fields, avoid N+1 queries
- `React.memo` for expensive pure components
- Debounce search inputs: 300ms
- Throttle scroll event handlers: 100ms
- Caching strategy: ISR for product pages, on-demand revalidation on admin edits
- Use Vercel Edge Functions where latency is critical

---

## 10. SEO REQUIREMENTS

- Server-side render all public-facing pages (no client-only rendering for content pages)
- `generateMetadata` for unique title + description on every page
- Open Graph tags on all pages
- Twitter Cards on all pages
- Structured data (JSON-LD): `Product`, `BreadcrumbList`, `Organization`, `Review`
- Auto-generated XML sitemap
- `robots.txt` configured (block `/admin`, `/api`)
- Canonical URLs on all pages
- Clean URL slugs — no numeric IDs (e.g. `/products/walnut-dining-table` not `/products/42`)
- Image `alt` text mandatory — treat missing alt as a lint error
- One `<h1>` per page, no heading levels skipped

---

## 11. ACCESSIBILITY (WCAG 2.1 AA)

- Semantic HTML always — no `<div>` soup; use `<nav>`, `<main>`, `<section>`, `<article>`, etc.
- All interactive elements keyboard accessible (Tab, Enter, Space, Arrow keys as appropriate)
- Focus indicators always visible — never `outline: none` without a replacement
- Color contrast: 4.5:1 for body text, 3:1 for large text and UI components
- Form labels properly associated via `htmlFor` / `id`
- ARIA labels on icon-only buttons (e.g. close, search, cart icon)
- Skip navigation link at the top of every page
- Respect `prefers-reduced-motion` — wrap Framer Motion animations in a check
- All dynamic content updates announced via `aria-live` regions
- No keyboard traps — user can always Tab out of any component

---

## 12. TESTING STANDARDS

### Tools
| Type | Tool |
|---|---|
| Unit tests | Vitest |
| Component tests | React Testing Library |
| E2E tests | Playwright |

### Critical flows requiring E2E coverage
1. Customer signup → login
2. Browse → Add to cart → Checkout (mock)
3. Admin login → Add product → Edit → Delete
4. Search → Filter → Sort

### Rules
- Test files co-located: `Component.test.tsx` next to `Component.tsx`
- Coverage target: 70%+ for all business logic (cart, pricing, auth, search)
- Every test covers: happy path + edge cases + error cases
- Mock all external APIs in tests (Supabase, Cloudinary, Resend, Claude API)
- Pre-commit hook runs tests automatically — no committing with failing tests
- Visual regression tests for critical UI components (Hero, ProductCard, CartDrawer)

---

## 13. DEBUGGING APPROACH

- `console.log` only in development — strip before committing or guard with `process.env.NODE_ENV`
- Sentry for production error tracking — all unhandled errors captured automatically
- Source maps enabled in production (for Sentry; not exposed publicly)
- Use breakpoints over `console.log` for tracing complex logic
- Add `data-testid` attributes to elements targeted by E2E tests
- Prisma Studio for inspecting database state during development
- Check the Network tab first for API-related issues
- Use `git bisect` to locate regression-introducing commits
- Document tricky bugs in a code comment referencing the issue

---

## 14. GIT WORKFLOW

### Branch naming
```
feature/   — new functionality
fix/       — bug fixes
refactor/  — code changes that don't change behaviour
docs/      — documentation only
test/      — adding or updating tests
chore/     — build, deps, tooling
```

### Commit message format
```
type(scope): short description

Examples:
feat(cart): add slide-out drawer with Framer Motion
fix(checkout): resolve quantity update not persisting
docs(readme): update local setup instructions
refactor(product): extract ProductGallery into sub-component
```

### Rules
- Never commit directly to `main` — always use a PR, even solo
- Atomic commits — one logical change per commit
- Commit often, push frequently
- Never commit: `.env` files, `node_modules`, build artifacts, secrets
- Squash messy WIP commits before merging

---

## 15. ENVIRONMENT VARIABLES

- `.env.local` for local dev — never commit this file
- `.env.example` committed as a template with placeholder values and purpose comments
- All env vars validated at app startup with a Zod schema
- `NEXT_PUBLIC_` prefix only for values safe to expose in the browser bundle
- Three environments: `development`, `preview` (Vercel), `production`
- Rotate any secret that is accidentally committed immediately

---

## 16. DATABASE PRACTICES

- All schema changes via Prisma migrations (`prisma migrate dev`) — never alter production DB directly
- Soft deletes: add `deletedAt DateTime?` field instead of hard-deleting rows
- Audit fields on every table: `createdAt`, `updatedAt`, `createdBy`, `updatedBy`
- Wrap multi-step operations in Prisma transactions
- Add indexes on all fields used in `WHERE`, `ORDER BY`, or `JOIN` clauses
- Enforce database constraints: unique, not null, foreign key
- Daily automated backups configured in Supabase
- Connection pooling configured for Vercel serverless (use Supabase's pooler endpoint)

---

## 17. API DESIGN

- RESTful route naming: `GET /api/v1/products`, `POST /api/v1/orders`
- Consistent response envelope:
  ```json
  { "success": true, "data": {...} }
  { "success": false, "error": "Human-readable message" }
  ```
- Correct HTTP status codes: 200, 201, 400, 401, 403, 404, 422, 500
- Pagination on all list endpoints: `limit` + `cursor` (cursor-based preferred over offset)
- Rate limiting per endpoint via Upstash or Vercel middleware
- API versioned from day one: `/api/v1/`
- Zod validation on all inputs (request body, query params, route params)
- Zod validation on all outputs before returning
- Document every endpoint with a JSDoc comment describing params, response, and auth requirement

---

## 18. DEPLOYMENT REQUIREMENTS

### Pre-deploy checklist
- [ ] All tests passing (`pnpm test`)
- [ ] No TypeScript errors (`pnpm tsc --noEmit`)
- [ ] No ESLint errors (`pnpm lint`)
- [ ] Build succeeds locally (`pnpm build`)
- [ ] Lighthouse 90+ on at least Homepage and Product Detail
- [ ] All env vars verified in Vercel dashboard
- [ ] Prisma migrations run against target DB
- [ ] No hardcoded localhost URLs
- [ ] No `console.log` left in production code paths

### Infrastructure
- Deploy on Vercel via GitHub integration (auto-deploy on push to `main`)
- Staging via Vercel preview deployments (auto-created for every PR)
- Encrypted env vars in Vercel Environment Variables — never in code
- Uptime monitoring via UptimeRobot or BetterStack
- Sentry error tracking live before public launch
- Vercel Analytics + Google Analytics 4 set up before launch
- DNS + SSL handled by Vercel
- Custom domain configured when ready
- Database backup taken before every major release

---

## 19. MONITORING & ANALYTICS

- **Sentry** — all production errors captured and alerted
- **Vercel Analytics** — Core Web Vitals tracking
- **Google Analytics 4** — user behaviour

### Key events to track
- `signup` — new user registered
- `add_to_cart` — product added to cart
- `checkout_complete` — order placed
- `search` — search query submitted

### Alerts
Set up alerts for:
- Error rate spike (> 1% of requests)
- Performance degradation (LCP > 3s)
- Downtime (any 5xx for > 2 min)

Review analytics weekly.

---

## 20. KEY FEATURES TO BUILD

- [ ] Header (nav, search, cart icon with count, wishlist icon)
- [ ] Hero carousel with Framer Motion animations
- [ ] Product listing page (filters, sort, pagination)
- [ ] Product detail page (image gallery, zoom, reviews)
- [ ] Cart drawer (slide-out, persisted to localStorage/DB)
- [ ] Search with autocomplete
- [ ] Reviews & ratings system
- [ ] Live stock counter ("Only 2 left!")
- [ ] Mock checkout (Cash on Delivery + Bank Transfer)
- [ ] Admin login + dashboard
- [ ] Admin CRUD (products, categories, orders)
- [ ] AI chatbot (Claude API)
- [ ] WhatsApp floating button
- [ ] Contact form (via Resend)
- [ ] About, FAQ, and custom 404 pages
- [ ] PWA setup (manifest + service worker)

---

## 21. WHAT NOT TO BUILD (OUT OF SCOPE)

- Real payment gateways (Stripe, JazzCash, EasyPaisa)
- Multi-currency support — PKR only
- Native mobile app — PWA only
- Wishlist, compare products, recently viewed
- Blog section
- Multi-language / i18n
- AR room visualization
- Subscription / recurring orders model

---

## 22. WORKFLOW RULES FOR CLAUDE CODE

- **ALWAYS** use plan mode before making any non-trivial change
- **ALWAYS** read the relevant Next.js 16 docs in `node_modules/next/dist/docs/` before using any Next.js API
- **ALWAYS** use proper TypeScript types — no shortcuts
- **ALWAYS** implement loading, error, and empty states for every data-fetching component
- **ALWAYS** test changes after implementation
- **NEVER** use `any` without a justification comment
- **NEVER** commit secrets, API keys, or `.env` files
- **NEVER** skip accessibility considerations — even on "internal" pages
- **ASK** before installing any new dependency
- **DOCUMENT** non-obvious decisions with a brief code comment
- **REUSE** existing components and utilities before creating new ones
- **FOLLOW** the design system strictly — no ad-hoc colors or fonts
- **KEEP** the user informed of progress on long-running tasks

---

## 23. COMMUNICATION STYLE

- User communicates in a mix of Roman Urdu and English — match that style naturally
- Be concise — user prefers short, direct answers when possible
- Use bullet points and tables for structured information
- Show the plan before doing it (use plan mode)
- Confirm major architectural decisions before implementing
- For quick questions, a one-liner answer is better than a paragraph
