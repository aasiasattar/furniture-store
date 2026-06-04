# Feature: Chatbot & Customer Support

> Three escalating support channels layered on every storefront page:
> AI chatbot (instant, automated) → WhatsApp (one-tap human) → Contact form
> (asynchronous, paper trail). The first two are floating action buttons stacked at
> the bottom-right; the third is its own page at `/contact`.

## Overview

Three parts:

| Part | Surface                | Channel                 | Trigger                                                                 |
| ---- | ---------------------- | ----------------------- | ----------------------------------------------------------------------- |
| A    | Floating chat launcher | AI chatbot (Claude API) | `fixed bottom-6 right-6` FAB → opens chat window                        |
| B    | Floating WhatsApp FAB  | wa.me deep link         | `fixed bottom-24 right-6` (stacked above A) → opens WhatsApp in new tab |
| C    | `/contact` page        | Email (via Resend)      | Form submit → admin inbox; reply-to set to customer                     |

This spec delivers two items that `01-layout-header-footer.md` §S7 listed as
out-of-scope at the time: the **floating WhatsApp button** (distinct from the
**footer WhatsApp pill** specified in layout spec §B5 — the pill is inline in the
Connect column, the FAB here is fixed-position on every page) and the **AI chatbot
launcher**. Both FABs are rendered once at the root layout (`app/layout.tsx`) so
they appear on every public route.

## User Stories

- **Visitor browsing late at night** — get an instant answer about delivery time without waiting for business hours.
- **Shopper considering a specific sofa** — tap the WhatsApp FAB on the product page and start a chat that auto-fills the product name.
- **Customer with a return query** — submit a contact form with the "Returns" subject so the right admin sees it.
- **Visitor who hits the chatbot's limits** — be redirected gracefully to WhatsApp or the contact form for anything the bot can't resolve.
- **Keyboard / screen-reader user** — open the chat window with Tab + Enter; window traps focus; Escape closes and returns focus to the launcher.

---

# PART A — AI CHATBOT

## A1. Overview

A floating launcher in the bottom-right corner opens a chat panel that streams
responses from Claude via `POST /api/chat`. The bot is context-aware (its system
prompt carries store details, policies, and the WhatsApp number) but stateless —
no chat history is persisted to the DB in v1. Implementation reference:
the **`claude-api` skill** (built-in) — that skill is authoritative for the
Anthropic SDK setup, prompt-caching breakpoint, streaming, and current model IDs.

## A2. Floating launcher

| Property   | Value                                                                               |
| ---------- | ----------------------------------------------------------------------------------- |
| Position   | `fixed bottom-6 right-6 z-40`                                                       |
| Size       | 56 × 56 px, rounded-full                                                            |
| Background | `--color-maroon` (`#6B1F2E`)                                                        |
| Icon       | `lucide-react` `MessageSquare`, `--color-cream`, 24 × 24                            |
| Animation  | Subtle pulse on the outer ring (2 s loop) — disabled under `prefers-reduced-motion` |
| Hover      | Scale 1.05, 150 ms ease-out                                                         |
| ARIA       | `<button aria-label="Open chat" aria-expanded={open} aria-controls="chat-window">`  |
| Visibility | Hidden inside `/admin/*` (admin shell does not load the FABs)                       |

## A3. Chat window

### Layout (ASCII)

```
┌──────────────────────────────────────┐
│  Ask us anything             ✕       │
├──────────────────────────────────────┤
│                                      │
│  ┌────────────────────────┐          │
│  │ Hi! How can I help?    │          │
│  └────────────────────────┘          │
│                                      │
│           ┌────────────────────────┐ │
│           │ Do you have sofas      │ │
│           │ under Rs 30,000?       │ │
│           └────────────────────────┘ │
│                                      │
│  ┌────────────────────────┐          │
│  │ Yes — our Karachi      │          │
│  │ branch has 4 models …  │          │
│  └────────────────────────┘          │
│                                      │
│  ● ● ●  (typing)                     │
│                                      │
├──────────────────────────────────────┤
│  [ Type a message … ]      [Send →]  │
└──────────────────────────────────────┘
```

### Dimensions

| Viewport            | Window                                                         |
| ------------------- | -------------------------------------------------------------- |
| Mobile (`<768 px`)  | Full-screen overlay; backdrop is the body itself (no scrim)    |
| Desktop (`≥768 px`) | 380 px wide × 520 px tall, anchored bottom-right above the FAB |

### Header bar

Title "Ask us anything" + close button (✕). Optional sub-line: "Powered by AI —
for urgent issues, use WhatsApp."

## A4. Message UI

| Bubble    | Alignment | Background       | Text colour     | Border radius                      |
| --------- | --------- | ---------------- | --------------- | ---------------------------------- |
| User      | Right     | `--color-maroon` | `--color-cream` | rounded-2xl, sharp bottom-right    |
| Assistant | Left      | `--color-cream`  | `--color-black` | rounded-2xl, sharp bottom-left     |
| System    | Centre    | transparent      | muted gold      | small italic copy (errors, status) |

- Max width per bubble: 80 % of the message list width.
- Markdown-lite rendering: bold (`**`), inline code (`` ` ``), and bullet lists only.
  Links are auto-detected and rendered as `<a target="_blank" rel="noopener noreferrer">`.
- Timestamps are not rendered for v1.

### Typing indicator

Three pulsing dots (`● ● ●`) in a left-aligned bubble while the request is in
flight. Dots scale `0.8 ↔ 1.0` over 600 ms each, staggered 200 ms. Disabled
under `prefers-reduced-motion` — render a static "Typing…" label instead.

## A5. Capabilities & system prompt

### What the bot answers

| Topic           | Example question                                     |
| --------------- | ---------------------------------------------------- |
| Product surface | "Do you have sofas under Rs 30,000?"                 |
| Sizing          | "What are the dimensions of the Walnut Lounge Sofa?" |
| Shipping        | "How long does delivery take to Lahore?"             |
| Returns         | "What's your return policy?"                         |
| Payment methods | "Do you accept bank transfer?"                       |
| Store basics    | "Where are you located? What are your hours?"        |

### What the bot redirects

For order status, complaints, custom orders, or anything requiring a human, the
bot replies with: "For this I'd recommend our WhatsApp — `https://wa.me/<phone>` —
where the team can help directly." The launcher does not auto-open WhatsApp; the
user clicks the link.

### System prompt outline

The system prompt is a single static block defined in
`src/lib/chat-system-prompt.ts` and templated at build time with env values. It
contains:

- Store identity — name, address, city, country, phone, email, business hours.
- Product categories carried (Sofas, Beds, Dining, Office, Storage, Decor).
- Shipping policy — 3–7 days, free over Rs 5,000, courier name.
- Return policy — 7-day window, conditions, how to start a return.
- Payment methods — Cash on Delivery + Bank Transfer (no online card payments).
- WhatsApp redirect copy and the wa.me URL.
- Tone — warm, concise, never markdown headings, never code blocks beyond inline.
- Hard constraints — never invent product names, prices, or stock numbers;
  decline to discuss anything off-topic (politics, other retailers, etc.).

## A6. API route

| Concern           | Decision                                                                                                                             |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Endpoint          | `POST /api/chat` — **API route, not a Server Action.** Streaming responses are the use case and Server Actions don't stream cleanly. |
| Request body      | `{ messages: { role: 'user' \| 'assistant'; content: string }[] }` — caller sends last 10 messages                                   |
| Model             | `claude-haiku-4-5` (current Claude 4.x Haiku; defer to the `claude-api` skill if a newer Haiku ships before impl)                    |
| Max output tokens | 500 per response                                                                                                                     |
| History window    | Last 10 messages from the caller; older messages dropped client-side before send                                                     |
| Streaming         | Server-Sent Events; client appends tokens to the in-progress assistant bubble                                                        |
| Prompt caching    | System prompt is cached server-side via the Anthropic prompt-caching feature (per `claude-api` skill)                                |
| Error handling    | API failure → return 503 with `{ error: 'chat_unavailable' }`; client renders the fallback (S4)                                      |

## A7. Rate limit & abuse guard

- **20 messages per user per hour** — keyed on session user ID when signed in, on
  IP otherwise. Uses the shared Upstash Redis limiter (admin dashboard §A3).
- 429 response → client renders a system-message bubble: "You've sent a lot of
  messages. Please try again in N minutes — or use WhatsApp."
- Server-side guard: reject any user message > 500 chars (UI also truncates, but
  the server is the source of truth).
- Server-side guard: reject more than 10 messages in the request body.

## A8. Privacy

- **No chat history persisted to the DB in v1.** State lives in the browser only.
- No PII collected via chat — system prompt never asks for personal data; if the
  user volunteers it, the bot is instructed to not echo it back.
- Refresh / close tab → history lost. The window header copy notes this.
- "End chat" button purges the in-memory history and closes the window.

## A9. Files

```
src/
  app/api/chat/route.ts                // POST handler — streams Anthropic responses
  components/chat/ChatLauncher.tsx     // Client — FAB + pulse animation
  components/chat/ChatWindow.tsx       // Client — dialog shell, message list, focus trap
  components/chat/ChatMessage.tsx      // Server-compatible — renders one bubble
  components/chat/ChatInput.tsx        // Client — textarea + send + 500-char counter
  components/chat/TypingIndicator.tsx  // Client — three pulsing dots
  lib/chat-system-prompt.ts            // Server — builds the system prompt from env
```

`ChatWindow.tsx` is dynamically imported by `ChatLauncher.tsx`
(`dynamic(() => import('./ChatWindow'), { ssr: false })`) so the chat bundle does
not ship to users who never open the panel.

---

# PART B — FLOATING WHATSAPP BUTTON

## B1. Overview

A second floating action button stacked **above** the chat launcher
(`fixed bottom-24 right-6`). On every page, one tap opens WhatsApp in a new tab
with a pre-filled message. This is **distinct** from the inline WhatsApp pill in
the footer (layout spec §B5) — the pill lives inside the Connect column, the FAB
is fixed-position and visible without scrolling.

## B2. Visual design

| Property       | Value                                                                                                                               |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Position       | `fixed bottom-24 right-6 z-40` (24 = 6 + button height + 6 px gap)                                                                  |
| Size           | 56 × 56 px, rounded-full                                                                                                            |
| Background     | `#25D366` — WhatsApp brand green. This is the **only** place this hex appears in the codebase; do not promote it to a design token. |
| Icon           | `lucide-react` `MessageCircle`, white, 24 × 24                                                                                      |
| Drop shadow    | `shadow-lg` (subtle)                                                                                                                |
| Hover          | Scale 1.05, 150 ms ease-out; tooltip "Chat on WhatsApp" appears after 400 ms                                                        |
| Reduced motion | No hover scale; tooltip still appears                                                                                               |
| ARIA           | `<a aria-label="Chat on WhatsApp" target="_blank" rel="noopener noreferrer">`                                                       |

## B3. Behaviour

`href` is composed at render time:

```
https://wa.me/${NEXT_PUBLIC_WHATSAPP_PHONE}?text=<URL-encoded-message>
```

| Context                             | Pre-filled message                                  |
| ----------------------------------- | --------------------------------------------------- |
| Any page (default)                  | `Hi! I have a question about your furniture.`       |
| Product detail (`/products/[slug]`) | `Hi! I'm interested in [Product Name].`             |
| Cart drawer open (Phase 2)          | `Hi! I'd like help with my cart.` — Phase 2, not v1 |

The product name is sourced from the Product object on the detail page (see
product-system spec §B4). For non-product pages the component does not need to
read any state. Detection uses `usePathname()` and a small helper.

## B4. Visibility

- Hidden when `NEXT_PUBLIC_WHATSAPP_PHONE` is unset or fails the env schema (no
  broken link rendered).
- Hidden inside `/admin/*` (the admin layout does not include either FAB).
- Hidden inside the open chat window's modal overlay (`z-40` puts the FABs below
  the dialog at `z-50` — the dialog naturally covers them).
- Always rendered as an `<a>` (not a button) so middle-click / Ctrl-click opens in
  a new tab naturally.

## B5. Files

```
src/components/chat/WhatsAppFab.tsx     // Client — usePathname + product context
```

A small helper for URL composition lives in `src/lib/whatsapp.ts` and is shared
with the product detail page's "Ask on WhatsApp" CTA (product-system spec §B4) so
the encoded message format stays consistent.

---

# PART C — CONTACT FORM (`/contact`)

## C1. Overview

A two-column page: contact info on the left, contact form on the right. The form
posts to a Server Action that validates with Zod, rate-limits via the shared
Upstash limiter, and emails the admin inbox via Resend. Pattern is the same as
the newsletter Server Action defined in layout spec §B4.

### Layout (ASCII)

```
┌──────────────────────────────────────────────────────────────────┐
│  Contact us                                                      │
├──────────────────────────────────┬───────────────────────────────┤
│  CONTACT INFO                    │  FORM                         │
│                                  │                               │
│  📍 Street, City                  │  Name      [           ]      │
│  📞 +92 300 0000000               │  Email     [           ]      │
│  ✉️  hello@furniture.com          │  Phone     [           ]      │
│  💬 WhatsApp →                    │  Subject   [General      ▾]   │
│                                  │                               │
│  Hours: Mon–Sat 10 am – 8 pm     │  Message                      │
│                                  │  [                       ]    │
│                                  │  [                       ]    │
│                                  │                               │
│                                  │  [        Send message     ]  │
└──────────────────────────────────┴───────────────────────────────┘
```

Breakpoints: stacked on mobile (`<768 px`), 40 / 60 split desktop.

## C2. Contact info block

| Item     | Source                                     | Rendering                                             |
| -------- | ------------------------------------------ | ----------------------------------------------------- |
| Address  | Constant in `src/lib/constants/contact.ts` | Plain text                                            |
| Phone    | Same                                       | `<a href="tel:...">` with `lucide-react` `Phone` icon |
| Email    | Same                                       | `<a href="mailto:...">` with `Mail` icon              |
| WhatsApp | `NEXT_PUBLIC_WHATSAPP_PHONE` (env)         | Same wa.me link as Part B                             |
| Hours    | Constant                                   | Plain text                                            |

## C3. Form fields

| Field   | Input                           | Validation (Zod)                                    |
| ------- | ------------------------------- | --------------------------------------------------- |
| Name    | `<Input>`                       | `z.string().min(2).max(120)` — required             |
| Email   | `<Input type="email">`          | `z.string().email().max(320)` — required            |
| Phone   | `<Input type="tel">` (optional) | `z.string().regex(/^\+?[\d\s-]{7,20}$/).optional()` |
| Subject | `<Select>` — see C4             | `z.enum([...])` — required, defaults to `general`   |
| Message | `<Textarea>` (rows 6)           | `z.string().min(20).max(2000)` — required           |

All inputs use Shadcn/ui components with associated `<label htmlFor>`.

## C4. Subject dropdown

| Value          | Label           |
| -------------- | --------------- |
| `general`      | General enquiry |
| `order-query`  | Order query     |
| `product-info` | Product info    |
| `returns`      | Returns         |
| `other`        | Other           |

The selected value drives the email subject prefix
(e.g. `[Contact: Returns] Aasia Sattar`).

## C5. Submission flow

`submitContactForm` Server Action (`'use server'`) — mirrors the structure of the
newsletter Server Action in layout spec §B4:

1. `await headers()` → extract `x-forwarded-for` for rate-limit key.
2. Rate limit: **3 submissions per IP per hour** via the shared Upstash limiter
   (admin dashboard §A3). Exceeded → return `{ ok: false, code: 'rate_limited' }`.
3. `safeParse` the `FormData` against the Zod schema. Invalid → return
   `{ ok: false, errors: {...} }`.
4. Send the email via Resend (C6). Failure → return
   `{ ok: false, code: 'email_failed' }` and log to Sentry.
5. Success → return `{ ok: true, message: 'Thanks — we'll get back to you within 1 business day.' }`.

Client uses `useActionState` to drive the UI states in C7.

## C6. Email content

| Field       | Value                                                                                                       |
| ----------- | ----------------------------------------------------------------------------------------------------------- |
| From        | `noreply@<domain>` (env `RESEND_FROM_EMAIL`)                                                                |
| To          | Admin inbox (env `CONTACT_INBOX_EMAIL`)                                                                     |
| Reply-To    | Customer email (so admins can hit Reply naturally)                                                          |
| Subject     | `[Contact: <Subject label>] <Name>`                                                                         |
| Body (HTML) | Name, Email, Phone, Subject, Message (preserved line breaks), timestamp, source page (referer if available) |
| Body (text) | Same fields, plain text fallback for clients that block HTML                                                |

The email template lives in `src/lib/email/templates/contact.tsx` (React Email
component) so HTML and plain-text renderings stay in sync.

## C7. UI states

| State            | UI                                                                                                                 |
| ---------------- | ------------------------------------------------------------------------------------------------------------------ |
| Idle             | Form fields editable; "Send message" enabled                                                                       |
| Submitting       | Button shows spinner, disabled, `aria-busy="true"`                                                                 |
| Success          | Form replaced by a confirmation card: "Thanks! We'll get back to you within 1 business day." + "Send another" link |
| Validation error | Inline error under the offending field; focus moves to the first invalid input                                     |
| Rate-limited     | Inline banner above the form: "You've sent a few messages already. Please try again in N minutes."                 |
| Resend down      | Toast (sonner): "We couldn't send your message. Please WhatsApp us instead." with a deep link                      |

## C8. Files

```
src/
  app/contact/page.tsx                 // Server — composes ContactInfo + ContactForm
  app/contact/actions.ts               // 'use server' — submitContactForm
  app/contact/schema.ts                // Zod ContactFormSchema + FormState
  components/contact/ContactInfo.tsx   // Server — static block
  components/contact/ContactForm.tsx   // Client — useActionState + react-hook-form
  lib/email/templates/contact.tsx      // React Email template
```

---

# SHARED REQUIREMENTS

## S1. Combined file tree

```
src/
  app/
    api/chat/route.ts                  // POST — Claude streaming
    contact/
      page.tsx                         // Server
      actions.ts                       // 'use server'
      schema.ts                        // Zod
  components/
    chat/
      ChatLauncher.tsx                 // FAB — maroon
      ChatWindow.tsx                   // Lazy-loaded dialog
      ChatMessage.tsx
      ChatInput.tsx
      TypingIndicator.tsx
      WhatsAppFab.tsx                  // FAB — green, stacked above ChatLauncher
    contact/
      ContactInfo.tsx
      ContactForm.tsx
  lib/
    chat-system-prompt.ts              // Static system prompt template
    whatsapp.ts                        // wa.me URL composer (shared with product page)
    email/templates/contact.tsx        // React Email
```

`ChatLauncher` and `WhatsAppFab` are both mounted once in `app/layout.tsx` (and
NOT in `app/admin/layout.tsx`).

## S2. Accessibility

| Requirement         | How                                                                                                                    |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Chat launcher       | `<button aria-label="Open chat" aria-expanded aria-controls="chat-window">`                                            |
| Chat window         | `role="dialog" aria-modal="true" aria-labelledby="chat-heading"`; focus trap; Escape closes; focus returns to launcher |
| Message list        | `aria-live="polite" aria-atomic="false"` so assistant tokens are announced as they stream                              |
| Send button         | `aria-label="Send message"`; disabled state has `aria-disabled="true"`                                                 |
| WhatsApp FAB        | `<a aria-label="Chat on WhatsApp" target="_blank" rel="noopener noreferrer">`                                          |
| Contact form labels | Every `<input>` / `<select>` / `<textarea>` has `<label htmlFor>`; required fields have `aria-required="true"`         |
| Validation errors   | Inline error with `id="<field>-error"` referenced by `aria-describedby`; focus jumps to first invalid on submit fail   |
| Reduced motion      | Pulse, typing dots, FAB hover scale, and chat window slide-in are all disabled when `prefers-reduced-motion: reduce`   |
| Colour contrast     | Cream-on-maroon (chat) = 9.2:1 ✓ · White-on-green (#25D366 / `#FFFFFF`) = 4.7:1 ✓                                      |
| Tab order           | Skip link → page content → FABs (last tab stop on the page so they don't interrupt browsing)                           |

## S3. Performance

| Concern           | Decision                                                                                                                                                          |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Chat window       | `dynamic(() => import('./ChatWindow'), { ssr: false })` — bundle only loads after the launcher is clicked                                                         |
| FAB bundle        | `ChatLauncher` + `WhatsAppFab` combined: `< 10 KB gzip` contribution to the layout chunk                                                                          |
| Prompt caching    | System prompt block sent with `cache_control: { type: 'ephemeral' }` per the `claude-api` skill — system prompt is the cache breakpoint, user messages come after |
| Streaming         | API route returns an SSE stream; client appends tokens incrementally; no full-response buffer on the server                                                       |
| Resend send       | `submitContactForm` awaits the Resend send — typical latency 200–500 ms; user sees the spinner during                                                             |
| Rate-limit lookup | Upstash Redis (shared instance) — added latency negligible (< 30 ms global)                                                                                       |

## S4. Edge cases

| Case                                 | Expected                                                                                                                |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| Claude API returns 5xx               | Stream emits a sentinel; client renders: "Sorry, chat is unavailable right now. Please try WhatsApp →" with a deep link |
| Chat rate limit hit (20/hour)        | System bubble: "You've sent a lot of messages. Please try again in N minutes — or use WhatsApp."                        |
| Contact rate limit hit (3/hour)      | Inline banner: "You've sent a few messages already. Please try again in N minutes."                                     |
| Empty chat message                   | Send button is disabled; Enter key ignored                                                                              |
| User message > 500 chars             | Input truncates at 500; counter shows `500 / 500` in red; submit blocked                                                |
| `NEXT_PUBLIC_WHATSAPP_PHONE` unset   | WhatsApp FAB is not rendered; product-page "Ask on WhatsApp" CTA is not rendered (per product-system spec §B4)          |
| Network offline mid-send (chat)      | Toast: "You're offline. Reconnecting…"; in-flight message kept in the input on next online event                        |
| Network offline mid-submit (contact) | Toast: "Couldn't send. Check your connection."; form preserved                                                          |
| User opens chat, refreshes page      | History lost (no persistence in v1); window reopens empty with the greeting message                                     |
| Contact form submitted twice rapidly | Server-side idempotency via a UUID stored in the form; second identical submit within 30 s → silent ignore              |
| Reduced motion preference            | All animations disabled — pulse, typing dots, FAB hover scale, chat window slide-in                                     |
| User on `/admin/*`                   | Neither FAB is rendered (admin layout does not mount them)                                                              |

## S5. Test cases

### Vitest unit

- `ContactFormSchema` accepts valid input; rejects names < 2 chars, invalid email, message < 20 chars.
- `composeWhatsAppUrl(phone, message)` URL-encodes the message and produces a `wa.me/<phone>?text=...` string.
- Rate-limit helper returns `{ ok: false, retryAfterMs }` on the (N+1)th call within the window.

### React Testing Library (component)

- **ChatLauncher** — clicking the button toggles the window; `aria-expanded` flips; Escape closes and focus returns.
- **ChatWindow** — sending a message renders the user bubble immediately, then the assistant bubble as the mocked stream emits tokens.
- **ChatWindow** — when the mock returns 503, the system bubble shows the fallback copy with a WhatsApp link.
- **WhatsAppFab** — on `/products/walnut-lounge-sofa`, the `href` contains `text=Hi%21+I%27m+interested+in+Walnut+Lounge+Sofa.`; on `/`, the default greeting is used.
- **WhatsAppFab** — when the env phone is undefined, the FAB does not render.
- **ContactForm** — submitting an empty form shows field errors and focuses the Name input.
- **ContactForm** — successful submit replaces the form with the confirmation card; "Send another" restores the empty form.
- **ContactForm** — rate-limited response renders the banner copy with the retry-in-minutes value.

### Playwright E2E

1. **Chat happy path** — open the chat launcher, send "Where are you located?", mocked stream emits the answer, assistant bubble renders with the city name.
2. **WhatsApp deep link on product page** — visit a product detail page, click the WA FAB, assert the new-tab URL contains the encoded product name in the `text` query param.
3. **Contact form happy path** — fill all fields, submit, success card appears within 3 s.
4. **Contact form rate-limit** — submit 4 times in succession; the 4th is rejected with the rate-limit banner.
5. **Reduced motion** — emulate `prefers-reduced-motion: reduce`; pulse on the chat FAB is not applied; typing indicator shows "Typing…" instead of pulsing dots.

## S6. Acceptance criteria

### AI chatbot (Part A)

- [ ] Chat launcher FAB renders on every public route at `fixed bottom-6 right-6`, hidden under `/admin/*`.
- [ ] Clicking the launcher opens a 380 × 520 px window (full-screen on mobile) with focus trap and `aria-live` message list.
- [ ] `POST /api/chat` streams responses from `claude-haiku-4-5` with prompt caching applied to the system prompt.
- [ ] Rate limit blocks the 21st message per user per hour with a friendly inline message and a WhatsApp deep link.
- [ ] No chat history is persisted to the DB; refresh clears state.

### Floating WhatsApp (Part B)

- [ ] FAB renders at `fixed bottom-24 right-6` (stacked above the chat launcher) on every public route.
- [ ] Click opens `wa.me/<phone>?text=<encoded>` in a new tab with the context-aware message.
- [ ] FAB is hidden when `NEXT_PUBLIC_WHATSAPP_PHONE` is unset and inside `/admin/*`.
- [ ] Shares URL composition with the product detail page's "Ask on WhatsApp" CTA (via `src/lib/whatsapp.ts`).

### Contact form (Part C)

- [ ] `/contact` renders the two-column page (stacked on mobile).
- [ ] Zod validation per C3; subject dropdown options per C4; rate limit 3/hour/IP enforced.
- [ ] Successful submit emails the admin inbox via Resend with `reply-to` set to the customer; UI shows the success card.
- [ ] Resend failure surfaces the WhatsApp fallback toast.

### Cross-cutting

- [ ] No file exceeds 300 lines (CLAUDE.md §4).
- [ ] No `any` types without a justification comment.
- [ ] Only design-system colours (chat) — except the WhatsApp brand green (`#25D366`) which is scoped to the WhatsApp FAB.
- [ ] All scripts pass: `pnpm lint`, `pnpm format:check`, `pnpm type-check`, `pnpm test`.
- [ ] Lighthouse a11y ≥ 95 on `/` (with FABs rendered) and `/contact`.

## S7. Out of scope (Phase 2 unless noted)

- **Chat history persistence** — v1 is stateless. Phase 2 adds a `ChatSession` table keyed by user, with the user's consent.
- **WhatsApp Business API webhook** — for v1 the WhatsApp channel is a one-way deep link (browser → wa.me). Inbound messages stay in the WhatsApp app. Phase 2.
- **Live agent takeover** — escalate an in-progress AI chat to a human via a queue. Phase 2.
- **Chatbot tool use** — letting the bot search products / look up orders via Anthropic tool use. Phase 2 — for v1 the bot answers from the static system prompt only.
- **Map embed on `/contact`** — Google Maps / OpenStreetMap embed of the store location. Phase 2.
- **Multi-language chatbot** — Roman Urdu + English in the same conversation. Phase 2.
- **Chat transcript email** — emailing the conversation to the user. Phase 2 (requires persistence).
- **Image upload in chat** — Phase 2.

## S8. Implementation reference

- **`claude-api` skill (built-in)** — implementation reference for Part A: Anthropic SDK setup, prompt caching at the system-prompt cache breakpoint, streaming responses, error handling, and current model IDs. If `claude-haiku-4-5` is superseded before implementation, defer to the skill.
- **`01-layout-header-footer.md` §B4** — newsletter Server Action pattern reused by the contact form Server Action (Zod safeParse, rate limit via shared limiter, Resend, `useActionState`, `FormState` shape).
- **`01-layout-header-footer.md` §B5** — footer WhatsApp pill (distinct component from the FAB in Part B). The pill is rendered inline in the footer's Connect column.
- **`01-layout-header-footer.md` §S7** — out-of-scope list that this spec closes out (floating WhatsApp + chatbot launcher).
- **`04-admin-dashboard.md` §A3** — shared Upstash Redis rate-limit utility (`lib/ratelimit.ts`); both `/api/chat` (20/h) and the contact form (3/h) consume it.
- **`03-product-system.md` §B4** — product detail page already names the "Ask on WhatsApp" CTA tied to the same env phone; the FAB in Part B and that CTA share `src/lib/whatsapp.ts`.
