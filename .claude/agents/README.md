# .claude/agents/

This folder contains **subagent definition files** for the furniture-store project.

Subagents are specialized Claude agents scoped to a specific task type. Each file defines
a subagent's persona, tools, and instructions so it can be launched with consistent behavior
across sessions.

## When to add a file here

Add a new `.md` file when you have a repeatable, well-scoped task that benefits from a
dedicated agent — e.g. a database migration reviewer, a Lighthouse audit runner, or a
Prisma schema validator.

## File naming convention

```
<task-domain>.md

Examples:
  db-reviewer.md
  a11y-auditor.md
  api-tester.md
```

## Reference

Claude Code subagent docs: `node_modules/next/dist/docs/` (for Next.js specifics)
General Claude agent SDK: https://docs.anthropic.com/
