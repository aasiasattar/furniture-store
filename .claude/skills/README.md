# .claude/skills/

This folder contains **custom skill definitions** for the furniture-store project.

Skills are reusable, invokable instructions that extend Claude Code's default behavior
for this specific project. They can be triggered via slash commands and encapsulate
multi-step workflows that would otherwise need to be re-explained every session.

## When to add a file here

Add a skill when you have a multi-step workflow that you run repeatedly — e.g. generating
a new feature spec, running the full pre-deploy checklist, or scaffolding a new page with
all required files (loading.tsx, error.tsx, page.tsx).

## File naming convention

```
<verb>-<noun>.md

Examples:
  scaffold-page.md
  run-deploy-checklist.md
  generate-spec.md
```

## File structure

Each skill file should include:

- **Purpose** — what the skill does
- **Trigger** — the slash command name (e.g. `/scaffold-page`)
- **Steps** — the ordered list of actions Claude will take
- **Inputs** — any arguments the skill accepts
