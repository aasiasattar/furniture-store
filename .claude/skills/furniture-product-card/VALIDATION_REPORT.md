# Skill Validation Report: furniture-product-card

**Skill Type**: Builder (creates ProductCard.tsx + ProductCard.test.tsx)
**Rating**: Adequate
**Overall Score**: 64/100

---

## Summary

The `furniture-product-card` skill has an exceptionally strong domain standards core — its design system enforcement, accessibility requirements, and test coverage checklist are production-grade. However, it has two significant structural gaps that keep it in the Adequate tier: a complete absence of external documentation links (Documentation score: 27/100) and no formal user clarification section, which is a required element for Builder-type skills. Addressing these two areas would likely push this skill into the Good (75–89) range.

---

## Category Scores

| Category | Criteria Scores | Raw | Score | Weight | Weighted |
|---|---|---|---|---|---|
| Structure & Anatomy | 3+3+3+3+2+1+3+2 | 20/24 | 83/100 | 12% | 9.96 |
| Content Quality | 3+3+2+1+3+3 | 15/18 | 83/100 | 15% | 12.45 |
| User Interaction | 1+0+2+3+3+1 | 10/18 | 56/100 | 12% | 6.72 |
| Documentation & References | 0+3+0+0+1 | 4/15 | 27/100 | 10% | 2.70 |
| Domain Standards | 3+3+3+3 | 12/12 | 100/100 | 10% | 10.00 |
| Technical Robustness | 1+3+0+3+3 | 10/15 | 67/100 | 8% | 5.36 |
| Maintainability | 3+0+2+3 | 8/12 | 67/100 | 8% | 5.36 |
| Zero-Shot Implementation | 2+0+1+3+3 | 9/15 | 60/100 | 12% | 7.20 |
| Reusability | 2+2+3+2+2 | 11/15 | 73/100 | 13% | 9.49 |
| **Subtotal** | | | | | **69.24** |
| **Type-Specific Deduction** | Missing: Required Clarifications | | | | **−5.00** |
| **TOTAL** | | | | | **64/100** |

---

## Criterion-Level Breakdown

### 1. Structure & Anatomy — 83/100

| Criterion | Score | Notes |
|---|---|---|
| SKILL.md exists | 3 | Present at root |
| Line count | 3 | 56 lines — excellent (target <300) |
| Frontmatter complete | 3 | `name` + `description` present, valid YAML |
| Name constraints | 3 | `furniture-product-card` — lowercase, hyphens, 24 chars ✓ |
| Description format | 2 | [What] + [When] present, but style is imperative not third-person |
| Description style | 1 | Uses "ALWAYS invoke" — should use "This skill should be used when…" |
| No extraneous files | 3 | Only SKILL.md + references/ — clean |
| Progressive disclosure | 2 | `references/spec.md` exists but SKILL.md has no "Reference Files" table with "when to read" guidance |

### 2. Content Quality — 83/100

| Criterion | Score | Notes |
|---|---|---|
| Conciseness | 3 | Every line earns its place; workflow is table-free but tight |
| Imperative form | 3 | "Read", "Cover", "Follow", "Verify" — consistent throughout |
| Appropriate freedom | 2 | Strict where needed; but no explicit Required/Optional split |
| Scope clarity | 1 | Output defined clearly; "What this does NOT do" section absent |
| No hallucination risk | 3 | "Do not rely on memory for these details" — gold standard |
| Output specification | 3 | Two files with exact paths — unambiguous |

### 3. User Interaction — 56/100

| Criterion | Score | Notes |
|---|---|---|
| Clarification triggers | 1 | Variant defaulting implicit; no structured clarification section |
| Required vs optional | 0 | No separation; no questions at all |
| Graceful handling | 2 | "If user has not specified, build the default" handles variant ambiguity |
| No over-asking | 3 | Asks nothing unnecessary — appropriate for locked-down project skill |
| Question pacing | 3 | N/A; no issues |
| Context awareness | 1 | Only variant defaulting; no codebase/conversation context guidance |

**Key gap**: A Builder skill must ask before acting on ambiguity. Missing questions: (1) Is the image above the fold? (`priority` prop decision); (2) Which specific variant? (3) Does an existing ProductCard already exist in the codebase that should be refactored rather than overwritten?

### 4. Documentation & References — 27/100

| Criterion | Score | Notes |
|---|---|---|
| Source URLs | 0 | Zero external links in either file |
| Reference files | 3 | `spec.md` is well-structured and comprehensive |
| Fetch guidance | 0 | No guidance for patterns not covered in spec |
| Version awareness | 0 | No note about Next.js 16 image API, Framer Motion v10+, etc. |
| Example coverage | 1 | spec.md has requirements; neither file has good/bad code examples |

**Key gap**: Missing documentation links for: `next/image` (Next.js 16 docs), `useReducedMotion` (Framer Motion API), `@heroicons/react` (v2 install), React Testing Library query priority guide.

### 5. Domain Standards — 100/100

| Criterion | Score | Notes |
|---|---|---|
| Best practices | 3 | WCAG 2.1 AA, colour enforcement, accessibility checklist all present |
| Enforcement mechanism | 3 | 8-item self-check checklist before outputting |
| Anti-patterns | 3 | "NEVER `<img>`", "no raw Tailwind colours", "no `outline-none` without replacement" |
| Quality gates | 3 | Self-check list is specific, actionable, and gatekeeps output |

**This is the skill's standout strength.** The domain standards coverage is more thorough than most production skills.

### 6. Technical Robustness — 67/100

| Criterion | Score | Notes |
|---|---|---|
| Error handling | 1 | Test checklist covers `images.length === 1` edge case; no runtime guidance for empty array or broken Cloudinary URLs |
| Security | 3 | N/A for pure React UI — no secrets, no SQL, output is JSX |
| Dependencies | 0 | Not listed anywhere: `framer-motion`, `@heroicons/react`, `@testing-library/react`, `@testing-library/user-event` |
| Edge cases | 3 | stock=0, single image, undefined salePrice, long name — all in test checklist |
| Testability | 3 | 20-item checklist across render/interaction/accessibility/edge cases |

### 7. Maintainability — 67/100

| Criterion | Score | Notes |
|---|---|---|
| Modularity | 3 | `spec.md` is self-contained and independently readable |
| Update path | 0 | No guidance: what changes if design tokens update? If Next.js image API changes? |
| No hardcoded values | 2 | Hex values hardcoded by design (good for consistency); no update mechanism |
| Clear organization | 3 | Logical flow: output definition → pre-work → workflow → checklist |

### 8. Zero-Shot Implementation — 60/100

| Criterion | Score | Notes |
|---|---|---|
| Before Implementation section | 2 | Present ("Before writing any code") but only points to spec.md; no structured context-gathering table |
| Codebase context | 0 | No guidance to check if a ProductCard already exists before implementing |
| Conversation context | 1 | Implicit only (variant defaulting) |
| Embedded expertise | 3 | All domain knowledge in `spec.md`; no runtime discovery required |
| User-only questions | 3 | Never asks domain knowledge questions — expertise is embedded |

### 9. Reusability — 73/100

| Criterion | Score | Notes |
|---|---|---|
| Handles variations | 2 | Three variants (Default/Compact/Featured) named; only Default fully specified |
| Variable elements | 2 | Variant captured; `priority` (above-the-fold) and className not explicitly surfaced |
| Constant patterns | 3 | Design system, TypeScript interface, accessibility, test patterns — all encoded |
| Not requirement-specific | 2 | Intentionally project-scoped; acceptable for this use case |
| Abstraction level | 2 | Tool-specific (furniture store), workflow-agnostic within that scope |

---

## Type-Specific Deduction: Builder (−5 points)

| Required Element | Status |
|---|---|
| Required Clarifications section | ❌ Missing |
| Output Specification | ✅ Present (2 files with exact paths) |
| Domain Standards (Must Follow/Must Avoid) | ✅ Present (comprehensive) |
| Output Checklist | ✅ Present (8-item self-check) |

Missing 1 of 4 required Builder elements → **−5 points**

---

## Critical Issues

- **No Required Clarifications section**: Builder skills must ask before acting on ambiguity. At minimum, the skill should ask: (1) which variant, (2) is the image above the fold (affects `priority` prop), (3) does a ProductCard already exist in the codebase (refactor vs create). Without this, Claude may silently overwrite an existing component or make wrong assumptions.

---

## Improvement Recommendations

### High Priority

1. **Add Required Clarifications section** — Add to SKILL.md immediately after the output declaration:
   ```markdown
   ## Required Clarifications

   Before writing any code, check conversation history for answers to these questions.
   Only ask the user for what cannot be inferred:

   1. **Variant**: Default, Compact, or Featured? (default: Default)
   2. **Above the fold**: Will this card appear in the hero or first visible row?
      → Yes: add `priority` to the primary `<Image>`
      → No: leave as lazy-loaded (default)
   3. **Existing component**: Does `src/components/product/ProductCard.tsx` already exist?
      → Yes: refactor to meet spec, do not overwrite without confirming
      → No: create fresh
   ```

2. **Add official documentation links** — Add a References table to SKILL.md:
   ```markdown
   ## Official Documentation

   | Resource | URL | When to Use |
   |---|---|---|
   | next/image API | https://nextjs.org/docs/app/api-reference/components/image | Image props, remotePatterns |
   | useReducedMotion | https://www.framer.com/motion/use-reduced-motion/ | Animation guard API |
   | Heroicons v2 | https://heroicons.com | Icon names, install command |
   | RTL query guide | https://testing-library.com/docs/queries/about | Query priority reference |
   ```

3. **Add "Before Implementation" context-gathering table** — Replace the current "Before writing any code" section with:
   ```markdown
   ## Before Implementation

   | Source | Gather |
   |---|---|
   | **Codebase** | Check if ProductCard already exists at `src/components/product/` |
   | **Conversation** | Variant requested, above-the-fold status, any design overrides |
   | **Skill References** | Load `references/spec.md` — canonical interface and all requirements |
   | **CLAUDE.md** | Confirm font aliases (`font-heading`, `font-body`) are configured |
   ```

### Medium Priority

4. **Document dependencies** — Add to SKILL.md or spec.md:
   ```markdown
   ## Required Dependencies
   - `framer-motion` — `useReducedMotion` hook
   - `@heroicons/react` (v2) — `HeartIcon` outline and solid variants
   - `@testing-library/react` + `@testing-library/user-event` — component tests
   ```

5. **Add scope boundary** — Add to SKILL.md after the output declaration:
   ```markdown
   ## Out of Scope
   - ProductCard modal (Quick View modal implementation is the caller's responsibility)
   - Cart state management (call `onWishlistToggle` only; do not wire to a store)
   - ProductCard for Admin dashboard (different component, different skill)
   ```

6. **Fully specify Compact and Featured variants** — Currently only Default is fully specified. Add variant-specific requirements to `references/spec.md`:
   ```
   ### Compact Variant
   - Image + Name + Price only
   - No Quick View button
   - No star rating
   - No stock counter
   - Suitable for: "Related Products" strip

   ### Featured Variant
   - Full Default card
   - Larger image (aspect-[3/4] instead of 4/5)
   - Optional `shortDescription?: string` prop
   - Suitable for: Hero or "Featured Product" spotlight
   ```

### Low Priority

7. **Fix description style** — Current description uses imperative ("ALWAYS invoke"). The skill-validator standard requires third-person. Replace opening line with:
   ```
   "Generates a complete, production-ready ProductCard component for the furniture-store project. This skill should be used when creating any product card, product preview, product tile, or product listing item…"
   ```

8. **Add update path** — Add to spec.md footer:
   ```markdown
   ## Keeping Current
   - Design tokens: update hex values here if CLAUDE.md palette changes
   - Next.js image API: verify props against node_modules/next/dist/docs/ on major version bumps
   - Last verified: 2026-05
   ```

9. **Add "Reference Files" table to SKILL.md**:
   ```markdown
   ## Reference Files

   | File | When to Read |
   |---|---|
   | `references/spec.md` | Always — before writing any code. Contains the TypeScript interface, all visual/interaction requirements, design tokens, and test checklist. |
   ```

---

## Strengths

- **Domain standards are production-grade**: The combination of a self-check checklist, explicit anti-patterns ("NEVER `<img>`", "no raw Tailwind colours"), and the full accessibility checklist in spec.md is as thorough as any production skill reviewed. This section alone would score 100/100 on any validator.
- **No hallucination risk**: The explicit instruction "Do not rely on memory for these details — read spec.md" is exactly the right pattern for a skill with precise, project-specific constraints.
- **Embedded expertise**: All domain knowledge is pre-embedded in `references/spec.md`. The consuming Claude instance never needs to discover design tokens, accessibility rules, or test patterns at runtime.
- **Lean SKILL.md**: At 56 lines, SKILL.md stays well within the context-budget guidelines. The progressive disclosure to spec.md is correctly implemented.
- **Test coverage checklist**: The 20-item, categorised test checklist (render / interaction / accessibility / edge cases) in spec.md is comprehensive and would be unusual to find even in hand-written test suites.
- **Anti-pattern explicitness**: The "Must Avoid" items in spec.md are written as specific, detectable violations rather than vague guidance — making them enforceable by the design-reviewer subagent as well.

---

*Validated using: `skill-validator` skill — criteria from `references/detailed-criteria.md`, calibrated against `references/scoring-examples.md`*
*Validated: 2026-05-02*
