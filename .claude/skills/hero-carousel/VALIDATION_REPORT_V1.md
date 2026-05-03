# Skill Validation Report V1: hero-carousel

**Skill Type**: Builder (creates HeroCarousel.tsx + HeroCarousel.test.tsx)
**Rating**: Production
**Overall Score**: 96/100

---

## Summary

The hero-carousel skill scores Production on its first validation run, benefiting from all lessons learned iterating on the furniture-product-card skill. Five categories score 100/100 — Structure, Content Quality, Documentation, Domain Standards, and Zero-Shot Implementation — each meeting every criterion at the excellent level. Three minor gaps prevent a perfect score: graceful handling lacks an explicit "note the assumption" instruction, Technical Robustness lacks error-boundary guidance, and Reusability is intentionally project-scoped. No iterations required; the skill is ready for production use.

---

## Category Scores

| Category | Score | Weight | Weighted |
|---|---|---|---|
| Structure & Anatomy | 100/100 | 12% | 12.00 |
| Content Quality | 100/100 | 15% | 15.00 |
| User Interaction | 94/100 | 12% | 11.28 |
| Documentation & References | 100/100 | 10% | 10.00 |
| Domain Standards | 100/100 | 10% | 10.00 |
| Technical Robustness | 89/100 | 8% | 7.12 |
| Maintainability | 92/100 | 8% | 7.36 |
| Zero-Shot Implementation | 100/100 | 12% | 12.00 |
| Reusability | 87/100 | 13% | 11.31 |
| **Type-Specific Deduction** | 0 | — | 0 |
| **TOTAL** | | | **96.07 → 96/100** |

---

## Criterion-Level Breakdown

### 1. Structure & Anatomy — 100/100

| Criterion | Score | Notes |
|---|---|---|
| SKILL.md exists | 3 | ✅ Present |
| Line count | 3 | ~130 lines — lean |
| Frontmatter complete | 3 | name + description present |
| Name constraints | 3 | `hero-carousel` — lowercase, hyphens, ≤64 chars |
| Description format | 3 | [What] + [When]; third-person style |
| Description style | 3 | "This skill should be used when…" ✓ |
| No extraneous files | 3 | Only SKILL.md + references/spec.md |
| Progressive disclosure | 3 | Formal `## Reference Files` table with "when to read" column |

**Score: 24/24 = 100/100**

### 2. Content Quality — 100/100

| Criterion | Score | Notes |
|---|---|---|
| Conciseness | 3 | 130 lines — minimal context footprint |
| Imperative form | 3 | "Produce", "Load", "Follow this sequence strictly", "Verify" throughout |
| Appropriate freedom | 3 | Required/Optional/Automated split; explicit defaults for every question |
| Scope clarity | 3 | Out of Scope section with 4 explicit exclusions |
| No hallucination risk | 3 | "Do not rely on memory"; "Always read spec.md fresh" |
| Output specification | 3 | 2 files with exact paths, variant handling |

**Score: 18/18 = 100/100**

### 3. User Interaction — 94/100

| Criterion | Score | Notes |
|---|---|---|
| Clarification triggers | 3 | Specific, actionable questions |
| Required vs optional | 3 | Canonical Required / Optional / Automated Check sections |
| Graceful handling | **2** | Defaults provided ("If not specified: props-based") but no explicit "note the assumption" instruction |
| No over-asking | 3 | 1 user question; codebase check automated — minimal friction |
| Question pacing | 3 | 1 required question, 1 optional — perfect pacing |
| Context awareness | 3 | "Check conversation history for answers. Only ask what cannot be inferred." |

**Score: 17/18 = 94/100**

Gap: Add "and note the assumption" to the graceful handling fallback to match furniture-product-card pattern.

### 4. Documentation & References — 100/100

| Criterion | Score | Notes |
|---|---|---|
| Source URLs | 3 | 5 official URLs in structured table |
| Reference files | 3 | spec.md in `references/` |
| Fetch guidance | 3 | Explicit example: "to verify AnimatePresence mode prop...fetch the URL above" |
| Version awareness | 3 | Changelog URLs for all 5 packages; `preload` deprecation notice for Next.js 16 |
| Example coverage | 3 | 4 ✅❌ example pairs: slide transition, Ken Burns, auto-play cleanup, swipe |

**Score: 15/15 = 100/100**

### 5. Domain Standards — 100/100

| Criterion | Score | Notes |
|---|---|---|
| Best practices | 3 | WCAG 2.1 AA, WAI-ARIA carousel pattern, `prefers-reduced-motion`, LCP `preload` |
| Enforcement mechanism | 3 | 12-item self-check + 10-item accessibility checklist + 20-item test checklist |
| Anti-patterns | 3 | 4 ❌ patterns: CSS opacity toggle, CSS keyframes without key, leaked interval, native touch events |
| Quality gates | 3 | "Self-check before outputting" with 12 mandatory checkboxes |

**Score: 12/12 = 100/100**

### 6. Technical Robustness — 89/100

| Criterion | Score | Notes |
|---|---|---|
| Error handling | **2** | 7 runtime edge cases with safe handling; no error boundary / catastrophic failure guidance |
| Security | 3 | `rel="noopener noreferrer"` on external CTA links explicitly required |
| Dependencies | 3 | 5-package table with versions, purposes, changelog URLs |
| Edge cases | 3 | Empty slides, single slide, broken image, external URL, clamped interval, disabled autoPlay |
| Testability | 3 | 20-item test checklist; `data-testid` attributes named on all tested elements |

**Score: 14/15 = 89/100**

### 7. Maintainability — 92/100

| Criterion | Score | Notes |
|---|---|---|
| Modularity | 3 | spec.md self-contained; SKILL.md is procedural only |
| Update path | 3 | Keeping Current table — 5 triggers mapped to specific sections + "Last verified: 2026-05" |
| No hardcoded values | **2** | Design token hex values necessarily hardcoded for design system enforcement |
| Clear organization | 3 | Logical section ordering throughout |

**Score: 11/12 = 92/100**

### 8. Zero-Shot Implementation — 100/100

| Criterion | Score | Notes |
|---|---|---|
| Before Implementation section | 3 | Canonical 4-source context-gathering table |
| Codebase context | 3 | Grep pattern: "Grep `src/` for `HeroCarousel` to find all import sites before refactoring" |
| Conversation context | 3 | Explicit row: "Slide content, autoPlay preference, className, design overrides" |
| Embedded expertise | 3 | All animation variants, ARIA structure, performance rules embedded in spec.md |
| User-only questions | 3 | 1 user question (slide data strategy) — a genuine user preference, not domain knowledge |

**Score: 15/15 = 100/100**

### 9. Reusability — 87/100

| Criterion | Score | Notes |
|---|---|---|
| Handles variations | 3 | 6 props (slides, autoPlay, interval, showArrows, showDots, className) |
| Variable elements | 3 | Variability Analysis table — 6 variable elements explicitly mapped |
| Constant patterns | 3 | Design tokens, ARIA structure, animation timing, `preload` rule all encoded as constants |
| Not requirement-specific | **2** | Intentionally project-scoped; design tokens are furniture-store specific |
| Abstraction level | **2** | Project-specific tool; component logic is variant-agnostic, design system is not |

**Score: 13/15 = 87/100**

---

## Type-Specific: Builder — 0 deduction

All 4 required Builder elements present:
- ✅ Required Clarifications — 1 user question + 1 optional + 1 automated codebase check
- ✅ Output Specification — 2 files with exact paths; variant handling noted
- ✅ Domain Standards — ARIA structure, accessibility checklist, test checklist, 4 ❌ anti-patterns
- ✅ Output Checklist — 12-item self-check before outputting

---

## Critical Issues

None. Skill is ready for production use at 96/100.

---

## Improvement Recommendations

### Low Priority (optional polish, ~+2 pts toward ~98)

1. **Graceful handling** (User Interaction: 2→3, +0.5 pts): Add "and note the assumption" to the slide data strategy fallback:
   ```
   If not specified: props-based with a `PLACEHOLDER_SLIDES` constant — and note the assumption to the user
   ```

2. **Error boundary guidance** (Technical Robustness: 2→3, +0.5 pts): Add to spec.md:
   > If the component throws at runtime (e.g. framer-motion version mismatch), wrap with a Suspense boundary in the parent page that renders a static fallback image.

3. **Reusability** (not requirement-specific: 2→3, +0.6 pts): Extracting design tokens to a shared `references/design-tokens.md` would make the skill adaptable to other projects — but this is intentional for the furniture-store design system.

---

## Strengths

- **Five perfect categories (100/100)**: Structure, Content Quality, Documentation, Domain Standards, and Zero-Shot Implementation each meet every criterion at the excellent level — a first for this project's skill set.
- **4 ✅❌ code examples covering the 4 most error-prone patterns**: Slide transition (AnimatePresence vs CSS), Ken Burns (keyed motion.div vs CSS animation), auto-play cleanup (useEffect return vs leaked interval), and swipe (Framer drag vs native touch). Each explains the *why* behind the failure.
- **Next.js 16 correctness**: Explicitly uses `preload={true}` (not the deprecated `priority` prop) — caught via docs research before writing the spec.
- **Full WAI-ARIA carousel implementation**: Complete ARIA structure with skip link, aria-roledescription, aria-live, tablist dots, and aria-pressed pause/play — all in the spec with exact HTML structure.
- **Zero runtime discovery**: Every design token, animation value, ARIA attribute, and test case is embedded in spec.md. A zero-shot agent never needs to look anything up.
- **Lean context footprint**: SKILL.md at ~130 lines, spec.md at ~270 lines — well within budget.

---

*Validated using: `skill-validator` skill*
*V1: 96/100 (Production)*
*Validated: 2026-05-03*
