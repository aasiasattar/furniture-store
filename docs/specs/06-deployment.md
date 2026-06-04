# Feature: Deployment

> The production runbook for shipping the furniture store to Vercel. Five phases run
> in order: a **pre-deploy gate** (everything green locally) → **services setup**
> (Supabase, Cloudinary, Resend, Anthropic, NextAuth) → **Vercel deployment**
> (connect repo, env vars, migrate, seed, smoke-test) → **post-launch** (domain,
> monitoring, search console) → a **master env-var reference**. This spec is the
> single source of truth for "how do we go live" and is written before the deploy so
> nothing is improvised at 2 a.m.

## Overview

| Part | Phase                | Who / When                                           | Output                                         |
| ---- | -------------------- | ---------------------------------------------------- | ---------------------------------------------- |
| A    | Pre-deploy checklist | Dev, on every release branch before merge            | All gates green — safe to deploy               |
| B    | Services setup       | Dev, once per service (then reused)                  | Credentials for every env var                  |
| C    | Vercel deployment    | Dev, first deploy + every push to `main`             | Live production URL, migrations + seed applied |
| D    | Post-deployment      | Dev, once at launch + ongoing                        | Custom domain, monitoring, search-console      |
| E    | Env-var reference    | Reference — consumed by Parts A–D and `.env.example` | One canonical table of every variable          |

The project deploys on **Vercel via GitHub integration** (CLAUDE.md §18): every push to
`main` auto-deploys to production, every PR gets a preview deployment. There is no manual
build step on a server — Vercel runs `pnpm build` for us.

## User Stories

- **Developer shipping the first release** — follow Parts A→C top to bottom and reach a
  working production URL without guessing which env var goes where.
- **Developer pushing a feature** — open a PR, get a preview URL automatically, and
  verify the change on preview before it ever touches production.
- **Developer hit by a failed deploy** — find the failure mode (migration / build / missing
  env var / connection limit) already documented in S2 with a recovery step.
- **Reviewer / future maintainer** — read Part E once and know every secret the app needs,
  whether it is public, and where to obtain it.

---

# PART A — PRE-DEPLOYMENT CHECKLIST

> Nothing merges to `main` until every box below is ticked on the release branch. This
> mirrors the CLAUDE.md §18 pre-deploy checklist; the script names here are the **real**
> ones from `package.json`.

## A1. Code quality

| Gate                        | Command / Check                               | Pass condition                       |
| --------------------------- | --------------------------------------------- | ------------------------------------ |
| Unit + component tests      | `pnpm test` _(pending test setup — see note)_ | All tests green                      |
| TypeScript                  | `pnpm type-check` (= `tsc --noEmit`)          | Zero type errors                     |
| Lint                        | `pnpm lint`                                   | Zero ESLint errors                   |
| Format                      | `pnpm format:check`                           | No formatting drift                  |
| Production build            | `pnpm build`                                  | Build succeeds locally               |
| No stray `console.log`      | grep production code paths                    | None outside `NODE_ENV` guards (§13) |
| No hardcoded URLs / secrets | review diff                                   | No `localhost`, no inline keys       |

- [ ] `pnpm test` passes _(see note)_
- [ ] `pnpm type-check` clean
- [ ] `pnpm lint` clean
- [ ] `pnpm format:check` clean
- [ ] `pnpm build` succeeds locally
- [ ] No `console.log` in production code paths
- [ ] No hardcoded URLs or secrets in the diff

> **Note on `pnpm test`:** Vitest / Playwright are not yet installed (`package.json` has
> no `test` script today). Until the testing harness lands, this gate is "N/A — no tests
> yet"; once it lands, the gate becomes blocking. The critical E2E flows that must be
> green before launch are listed in CLAUDE.md §12 (signup→login, browse→cart→checkout,
> admin CRUD, search→filter→sort).

## A2. Performance

| Gate                | Check                                                         | Target                  |
| ------------------- | ------------------------------------------------------------- | ----------------------- |
| Lighthouse          | Run on Homepage **and** Product Detail (prod build / preview) | 90+ on all 4 categories |
| Images              | All images via `next/image` — no raw `<img>`                  | Zero raw `<img>`        |
| Unused dependencies | `pnpm dlx depcheck` (or manual review)                        | None shipped            |

- [ ] Lighthouse 90+ on Homepage
- [ ] Lighthouse 90+ on Product Detail
- [ ] All images use `next/image`
- [ ] No unused dependencies in the bundle

## A3. Database

- [ ] All Prisma migrations created and applied locally (`prisma migrate dev`)
- [ ] Seed data ready — sample products + categories (`prisma/seed.ts`)
- [ ] Backup strategy confirmed — Supabase **daily automated backups** enabled (§16)

> Migrations and the seed script do **not exist yet** — they are created alongside the
> database schema feature. This gate becomes meaningful once `prisma/schema.prisma` lands.

## A4. Environment variables

- [ ] Every variable documented in `.env.example` with a placeholder + comment (S1)
- [ ] Production values gathered for Vercel (Part C2) — see the master list in Part E
- [ ] All vars validated at app startup by a Zod schema (CLAUDE.md §15) — a missing var
      fails fast with a clear message, never a silent `undefined`

---

# PART B — SERVICES SETUP

> Each service below is created once. Each sub-section ends with the env vars it produces
> — those names are canonical and reused verbatim in Parts C, E, and `.env.example`.

## B1. Supabase (database)

1. Create a Supabase project (region closest to the target audience — choose a Singapore/
   Mumbai region for Pakistan latency).
2. From **Project Settings → Database**, copy two connection strings:
   - **`DATABASE_URL`** — the **pooler** (Transaction mode, port `6543`) connection string.
     Vercel runs serverless functions; each invocation opens a connection, so the pooler is
     mandatory to avoid exhausting Postgres connections (§16, and S2 below).
   - **`DIRECT_URL`** — the **direct** (port `5432`) connection string. Prisma uses this for
     `migrate` / `db push` because migrations need a non-pooled connection.
3. Enable **Row Level Security (RLS)** on all public tables. App writes go through the
   server (service role / Prisma), so RLS is the backstop against accidental client access.

> Prisma wiring: `datasource db { url = env("DATABASE_URL"); directUrl = env("DIRECT_URL") }`.

**Produces:** `DATABASE_URL`, `DIRECT_URL`

## B2. Cloudinary (images)

1. Create a Cloudinary account (free tier is sufficient for the portfolio).
2. From the **Dashboard**, copy **`CLOUDINARY_CLOUD_NAME`**, **`CLOUDINARY_API_KEY`**, and
   **`CLOUDINARY_API_SECRET`**.
3. Create an **unsigned upload preset** (Settings → Upload → Upload presets) for admin image
   uploads — the admin UI uploads directly to Cloudinary without round-tripping the secret.
   Restrict the preset: allowed formats (jpg/png/webp), max file size, and a folder
   (`furniture-store/products`).

> The API secret stays **server-side only** (no `NEXT_PUBLIC_` prefix). Only the unsigned
> preset name + cloud name are safe in the browser.

**Produces:** `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

## B3. Resend (email)

1. Create a Resend account.
2. **Verify a domain** (add the DNS records Resend provides) so mail sends from
   `noreply@<your-domain>`. For early testing before the domain is ready, send from
   **`onboarding@resend.dev`** — works without verification but only delivers to your own
   account email.
3. Copy **`RESEND_API_KEY`**.
4. Create an **audience** for the newsletter (layout spec §B4) and copy its ID →
   **`RESEND_AUDIENCE_ID`**.

> Email vars consumed by the contact form (chatbot/support spec §C6): `RESEND_FROM_EMAIL`
> (the verified from-address) and `CONTACT_INBOX_EMAIL` (where contact submissions land).

**Produces:** `RESEND_API_KEY`, `RESEND_AUDIENCE_ID`, `RESEND_FROM_EMAIL`, `CONTACT_INBOX_EMAIL`

## B4. Anthropic (chatbot)

1. From the Anthropic Console, create an API key → **`ANTHROPIC_API_KEY`**.
2. **Set usage / spend limits** on the key (Console → Limits) to avoid a surprise bill from
   abuse — the chatbot is rate-limited app-side (chatbot spec §A7: 20 msgs/user/hour) but a
   hard spend cap is the safety net.
3. Model + prompt-caching setup is governed by the built-in **`claude-api` skill** (chatbot
   spec §S8) — not a deploy concern, but the key must exist before the chat route works.

**Produces:** `ANTHROPIC_API_KEY`

## B5. NextAuth

1. Generate a strong secret:
   ```bash
   openssl rand -base64 32
   ```
   → **`NEXTAUTH_SECRET`**. Use a **different** secret per environment (preview vs prod).
2. Set **`NEXTAUTH_URL`** to the deployment's canonical origin:
   - Local: `http://localhost:3000`
   - Production: the custom domain (or the `*.vercel.app` URL until the domain is live).
     Update this when the custom domain is attached (Part D1).

**Produces:** `NEXTAUTH_SECRET`, `NEXTAUTH_URL`

---

# PART C — VERCEL DEPLOYMENT

## C1. Initial setup

1. Create a Vercel account (log in with GitHub).
2. **Import the repo** `aasiasattar/furniture-store`. Vercel auto-detects Next.js — no build
   config needed. Set the package manager to **pnpm** (Vercel reads `pnpm-lock.yaml`).
3. Confirm the production branch is **`main`** → every push to `main` auto-deploys to
   production; every PR auto-creates a preview deployment (C4).

## C2. Environment variables in Vercel

Add each variable under **Project → Settings → Environment Variables**. Scope production
secrets to **Production** (and a separate set, with their own secrets, to **Preview**).
Full details (example values, where to get each) are in **Part E**.

| Variable                     | Required | Scope            | Source            |
| ---------------------------- | -------- | ---------------- | ----------------- |
| `DATABASE_URL`               | ✅       | Prod + Preview   | Supabase (B1)     |
| `DIRECT_URL`                 | ✅       | Prod + Preview   | Supabase (B1)     |
| `NEXTAUTH_SECRET`            | ✅       | Prod + Preview\* | `openssl` (B5)    |
| `NEXTAUTH_URL`               | ✅       | Prod + Preview\* | Domain (B5/D1)    |
| `CLOUDINARY_CLOUD_NAME`      | ✅       | Prod + Preview   | Cloudinary (B2)   |
| `CLOUDINARY_API_KEY`         | ✅       | Prod + Preview   | Cloudinary (B2)   |
| `CLOUDINARY_API_SECRET`      | ✅       | Prod + Preview   | Cloudinary (B2)   |
| `RESEND_API_KEY`             | ✅       | Prod + Preview   | Resend (B3)       |
| `RESEND_AUDIENCE_ID`         | ✅       | Prod + Preview   | Resend (B3)       |
| `ANTHROPIC_API_KEY`          | ✅       | Prod + Preview   | Anthropic (B4)    |
| `NEXT_PUBLIC_WHATSAPP_PHONE` | ✅       | Prod + Preview   | Your WhatsApp no. |
| `NEXT_PUBLIC_INSTAGRAM_URL`  | ⬜ opt.  | Prod + Preview   | Your profile URL  |
| `NEXT_PUBLIC_FACEBOOK_URL`   | ⬜ opt.  | Prod + Preview   | Your profile URL  |

> `*` Use a **distinct** `NEXTAUTH_SECRET` for Preview, and set Preview's `NEXTAUTH_URL` to
> the preview deployment URL pattern. Vercel exposes `VERCEL_URL` which can drive this if you
> prefer not to hardcode.
>
> Also required by features but omitted from the user's short list — add them too (see Part E):
> `RESEND_FROM_EMAIL`, `CONTACT_INBOX_EMAIL`, and the Upstash rate-limit pair
> `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` (admin spec §A3, chatbot spec §A7).

## C3. Deploy steps

1. **Push to `main`** → Vercel auto-builds and deploys. Watch the build log (S2).
2. **Run database migrations against production.** Migrations are **not** run by the Vercel
   build (build env should not have the direct URL by default). Apply them from a trusted
   machine pointed at production:
   ```bash
   # DIRECT_URL set to the production direct connection
   pnpm prisma migrate deploy
   ```
   `migrate deploy` applies committed migrations without prompting — the production-safe
   command (never `migrate dev` against prod, §16).
3. **Run the seed script** (first deploy only, or when reference data changes):
   ```bash
   pnpm prisma db seed
   ```
   Seeds sample categories + products so the storefront isn't empty.
4. **Smoke-test the critical flows** on the production URL (CLAUDE.md §12):
   - Customer signup → login
   - Browse → add to cart → checkout (mock)
   - Admin login → add product → edit → delete
   - Search → filter → sort
   - Chatbot answers, WhatsApp FAB deep-links, contact form sends an email.

## C4. Preview deployments

- Every PR automatically gets a **preview URL** (Vercel comments it on the PR).
- Preview deployments use the **Preview-scoped** env vars (a separate Supabase DB or the
  same DB is a choice; for a portfolio, pointing preview at the same DB is acceptable but
  note migrations affect both).
- **Test on the preview URL before merging** to `main` (S3) — this is the staging step;
  there is no separate staging server (that's Phase 2, S5).

---

# PART D — POST-DEPLOYMENT

## D1. Domain setup (when ready)

1. Purchase a domain (Namecheap / GoDaddy / etc.).
2. In Vercel → **Project → Settings → Domains**, add the domain; follow Vercel's DNS
   instructions (either change nameservers to Vercel, or add the `A` / `CNAME` records).
3. **SSL is automatic** — Vercel provisions and renews the certificate; no action needed.
4. **Update `NEXTAUTH_URL`** (and any absolute-URL config) to the custom domain, then
   redeploy so auth callbacks resolve to the right origin.

## D2. Monitoring

| Tool                   | Setup                                                                                          | Priority       |
| ---------------------- | ---------------------------------------------------------------------------------------------- | -------------- |
| **Vercel Analytics**   | Enable in the Vercel dashboard (built-in) — Core Web Vitals tracking                           | ✅ at launch   |
| **Google Analytics 4** | Add the GA4 Measurement ID; track `signup`, `add_to_cart`, `checkout_complete`, `search` (§19) | ✅ at launch   |
| **Sentry**             | Optional but recommended — captures unhandled errors in prod (§6, §13)                         | ⬜ recommended |
| **UptimeRobot**        | Free uptime monitor pinging the production URL; alert on downtime                              | ⬜ recommended |

> Alert thresholds (§19): error rate > 1% of requests, LCP > 3 s, any 5xx sustained > 2 min.

## D3. After launch

- [ ] Submit the XML sitemap to **Google Search Console** (sitemap auto-generated per §10).
- [ ] Test on **real mobile devices** (not just devtools emulation) — Android + iOS Safari.
- [ ] Share the GitHub repo + live URL on **LinkedIn / portfolio** (this is a portfolio piece).

---

# PART E — ENVIRONMENT VARIABLES REFERENCE

The canonical list of every variable the app reads. `NEXT_PUBLIC_` is the **only** prefix
exposed to the browser bundle (§8, §15) — everything else is server-only. All of these are
validated by the startup Zod schema (S2 / §15).

| Variable                     | Required | Public? | Example value                                 | Where to get it                                          |
| ---------------------------- | -------- | ------- | --------------------------------------------- | -------------------------------------------------------- |
| `DATABASE_URL`               | ✅       | No      | `postgres://...:6543/postgres?pgbouncer=true` | Supabase → Settings → Database → **Pooler** (B1)         |
| `DIRECT_URL`                 | ✅       | No      | `postgres://...:5432/postgres`                | Supabase → Settings → Database → **Direct** (B1)         |
| `NEXTAUTH_SECRET`            | ✅       | No      | `k3J9...base64...==`                          | `openssl rand -base64 32` (B5)                           |
| `NEXTAUTH_URL`               | ✅       | No      | `https://furniture-store.com`                 | Your production origin (B5 / D1)                         |
| `CLOUDINARY_CLOUD_NAME`      | ✅       | No¹     | `dxyz1234`                                    | Cloudinary → Dashboard (B2)                              |
| `CLOUDINARY_API_KEY`         | ✅       | No      | `123456789012345`                             | Cloudinary → Dashboard (B2)                              |
| `CLOUDINARY_API_SECRET`      | ✅       | No      | `abcdEFGH...secret`                           | Cloudinary → Dashboard (B2)                              |
| `RESEND_API_KEY`             | ✅       | No      | `re_xxxxxxxxxxxx`                             | Resend → API Keys (B3)                                   |
| `RESEND_AUDIENCE_ID`         | ✅       | No      | `78261eea-...`                                | Resend → Audiences (B3)                                  |
| `RESEND_FROM_EMAIL`          | ✅       | No      | `noreply@furniture-store.com`                 | Your verified Resend domain (B3)                         |
| `CONTACT_INBOX_EMAIL`        | ✅       | No      | `hello@furniture-store.com`                   | Where contact-form mail should land (B3)                 |
| `ANTHROPIC_API_KEY`          | ✅       | No      | `sk-ant-xxxxxxxx`                             | Anthropic Console → API Keys (B4)                        |
| `UPSTASH_REDIS_REST_URL`     | ✅²      | No      | `https://xxx.upstash.io`                      | Upstash → Redis DB (admin spec §A3)                      |
| `UPSTASH_REDIS_REST_TOKEN`   | ✅²      | No      | `AX...token`                                  | Upstash → Redis DB (admin spec §A3)                      |
| `NEXT_PUBLIC_WHATSAPP_PHONE` | ✅       | **Yes** | `923000000000`                                | Your WhatsApp number, country code, no `+` (chatbot §B3) |
| `NEXT_PUBLIC_INSTAGRAM_URL`  | ⬜       | **Yes** | `https://instagram.com/yourstore`             | Your profile URL                                         |
| `NEXT_PUBLIC_FACEBOOK_URL`   | ⬜       | **Yes** | `https://facebook.com/yourstore`              | Your profile URL                                         |
| `SENTRY_DSN`                 | ⬜       | No      | `https://...@o0.ingest.sentry.io/0`           | Sentry → Project Settings (D2, optional)                 |
| `NEXT_PUBLIC_GA4_ID`         | ⬜       | **Yes** | `G-XXXXXXXXXX`                                | Google Analytics 4 (D2, optional)                        |

> ¹ `CLOUDINARY_CLOUD_NAME` is itself low-risk to expose, but keep the server-only name in
> this project; only the **unsigned upload preset name** + cloud name are referenced
> client-side for admin uploads. Do not put the API secret behind `NEXT_PUBLIC_`.
> ² Required once the rate-limited features (chatbot, contact form, admin actions) ship;
> until then the limiter has nothing to gate.

---

# SHARED REQUIREMENTS

## S1. `.env.example` file

Committed to the repo as the template every developer copies to `.env.local`. Rules
(CLAUDE.md §15): every variable listed, **placeholder** values only (never a real secret),
and a one-line comment per var explaining its purpose. Shape:

```dotenv
# ---- Database (Supabase) ----
# Pooler URL (port 6543) — used by the app at runtime on Vercel serverless
DATABASE_URL="postgres://USER:PASSWORD@HOST:6543/postgres?pgbouncer=true"
# Direct URL (port 5432) — used by Prisma migrations only
DIRECT_URL="postgres://USER:PASSWORD@HOST:5432/postgres"

# ---- Auth (NextAuth) ----
NEXTAUTH_SECRET="generate-with: openssl rand -base64 32"
NEXTAUTH_URL="http://localhost:3000"

# ---- Images (Cloudinary) ----
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# ---- Email (Resend) ----
RESEND_API_KEY="re_xxxxxxxx"
RESEND_AUDIENCE_ID="your-audience-id"
RESEND_FROM_EMAIL="noreply@yourdomain.com"   # use onboarding@resend.dev for early testing
CONTACT_INBOX_EMAIL="hello@yourdomain.com"

# ---- Chatbot (Anthropic) ----
ANTHROPIC_API_KEY="sk-ant-xxxxxxxx"

# ---- Rate limiting (Upstash Redis) ----
UPSTASH_REDIS_REST_URL="https://xxx.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-token"

# ---- Public (safe to expose in the browser bundle) ----
NEXT_PUBLIC_WHATSAPP_PHONE="923000000000"        # country code, digits only, no +
NEXT_PUBLIC_INSTAGRAM_URL=""                      # optional
NEXT_PUBLIC_FACEBOOK_URL=""                       # optional

# ---- Optional monitoring ----
# SENTRY_DSN=""
# NEXT_PUBLIC_GA4_ID=""
```

- [ ] `.env.example` lists every variable from Part E with a placeholder + comment
- [ ] `.env.local` is git-ignored; `.env*` is already in `.gitignore`
- [ ] No real secret is ever committed (CLAUDE.md §15 — rotate immediately if one leaks)

## S2. Edge cases

| Case                               | Expected handling                                                                                                                                                                                                                                                                                  |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Migration fails on production**  | `migrate deploy` is transactional per migration — a failed migration rolls back its own transaction. Recovery: fix the migration locally, `migrate dev` to verify, redeploy, re-run `migrate deploy`. Never hand-edit prod tables (§16). Take a Supabase backup before any migration on a release. |
| **Build fails on Vercel**          | Read the **Vercel build log** first — most failures are a type error or a missing env var the build needs. Reproduce with `pnpm build` locally; the gate in A1 should have caught it. Fix on a branch; the failed deploy never becomes the live one (Vercel only promotes successful builds).      |
| **Environment variable missing**   | The startup **Zod env schema** (§15) throws a clear, named error (e.g. `Invalid env: DATABASE_URL is required`) and the app refuses to boot — fail fast, never run with `undefined`. Add the var in Vercel → redeploy.                                                                             |
| **Database connection limit hit**  | Symptom: `too many connections` / timeouts under load on serverless. Cause: using the **direct** URL at runtime. Fix: ensure runtime uses the **pooler** `DATABASE_URL` (port 6543); only migrations use `DIRECT_URL` (B1).                                                                        |
| **Resend domain not yet verified** | Sends fail / only deliver to the account owner. Use `onboarding@resend.dev` for testing; verify the domain before relying on contact-form / newsletter mail in prod.                                                                                                                               |
| **`NEXT_PUBLIC_*` secret leak**    | Anything under `NEXT_PUBLIC_` ships to the browser. Never prefix a real secret. If one leaks, rotate it immediately (§15).                                                                                                                                                                         |

## S3. Test cases

- **Local production build passes before pushing** — `pnpm build` succeeds on the release
  branch (A1) so Vercel won't fail on something reproducible locally.
- **Env validated at startup** — booting with a missing/invalid var throws the Zod error and
  halts; booting with all vars present succeeds. (Add a unit test for the env schema once it
  exists.)
- **Critical flows tested on the preview deployment before merge** — the four §12 flows + the
  support surfaces (chatbot, WhatsApp FAB, contact form) all pass on the PR's preview URL
  before it merges to `main` (C4).

## S4. Acceptance criteria

- [ ] All Part A gates pass on the release branch (tests N/A until the harness lands).
- [ ] Every service in Part B is provisioned and its env vars obtained.
- [ ] Repo `aasiasattar/furniture-store` is connected to Vercel; push to `main` auto-deploys.
- [ ] All required env vars from Part E are set in Vercel (Production + Preview scopes).
- [ ] `prisma migrate deploy` and `prisma db seed` have run against production.
- [ ] All four §12 critical flows pass on the production URL.
- [ ] Every PR produces a working preview URL; changes are verified there before merge.
- [ ] Vercel Analytics + GA4 are live; Sentry + UptimeRobot configured (recommended).
- [ ] `.env.example` is complete and committed; no real secret is in the repo.
- [ ] On the custom domain (when attached): SSL is active and `NEXTAUTH_URL` is updated.

## S5. Out of scope (Phase 2)

- **CI/CD via GitHub Actions** — for v1, Vercel's build-on-push is the entire pipeline; no
  separate Actions workflow for test/lint/typecheck gating.
- **Separate staging + production environments** — v1 uses Vercel **preview** deployments as
  the staging step (C4). A dedicated long-lived staging environment is Phase 2.
- **Docker deployment** — no containerization; Vercel's managed runtime only.
- **Custom server** — no custom Node/Express server in front of Next.js; the App Router on
  Vercel's runtime is the whole backend.

## S6. Implementation reference

- **`01-layout-header-footer.md` §B4** — newsletter Server Action → introduces
  `RESEND_API_KEY`, `RESEND_AUDIENCE_ID` (Resend, B3).
- **`03-product-system.md` §B4** — "Ask on WhatsApp" CTA → consumes
  `NEXT_PUBLIC_WHATSAPP_PHONE` (B3 list / Part E).
- **`04-admin-dashboard.md` §A3** — shared Upstash rate-limiter → introduces
  `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` (Part E).
- **`05-chatbot-support.md` §A6–A7, §C6** — chat route + contact form → consume
  `ANTHROPIC_API_KEY`, the Upstash pair, `RESEND_FROM_EMAIL`, `CONTACT_INBOX_EMAIL`,
  `NEXT_PUBLIC_WHATSAPP_PHONE`.
- **CLAUDE.md §15 / §16 / §18** — env-var rules, database practices, and the canonical
  pre-deploy checklist this spec operationalizes.
- **`claude-api` skill (built-in)** — authoritative for the Anthropic setup behind
  `ANTHROPIC_API_KEY` (model IDs, prompt caching).
