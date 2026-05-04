# docs/specs/

This folder contains **per-feature specification files** for the furniture-store project.

A spec is written and agreed upon _before_ implementation begins. It defines what a feature
does, how it should look and behave, what APIs it calls, what edge cases exist, and what
the acceptance criteria are. This prevents scope creep and makes plan-mode faster because
Claude can read the spec instead of asking clarifying questions.

## When to add a file here

Add a spec file before starting any non-trivial feature. Reference it during planning and
link to it in the PR description.

## File naming convention

```
<feature-slug>.md

Examples:
  cart-drawer.md
  product-listing.md
  admin-product-crud.md
  ai-chatbot.md
  search-autocomplete.md
```

## Recommended spec structure

```markdown
# Feature: <Name>

## Overview

One-paragraph summary of what this feature does and why.

## User Stories

- As a [user], I want to [action] so that [benefit].

## UI / Behaviour

Describe screens, states (loading, empty, error, success), and interactions.

## Data Model

List relevant DB tables, fields, and relationships.

## API / Server Actions

List endpoints or Server Actions, their inputs, outputs, and auth requirements.

## Edge Cases

List known edge cases and how they should be handled.

## Acceptance Criteria

- [ ] Criterion 1
- [ ] Criterion 2

## Out of Scope

What this feature explicitly does NOT include.
```
