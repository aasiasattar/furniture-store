# .claude/commands/

This folder contains **custom slash command definitions** for the furniture-store project.

Slash commands are project-specific shortcuts that can be typed in the Claude Code prompt
(e.g. `/new-spec`, `/deploy-check`). Each `.md` file in this folder defines one command —
its name, description, and the instructions Claude follows when it is invoked.

## When to add a file here

Add a command for any action you find yourself asking Claude to do repeatedly in this
project. Good candidates: generating boilerplate, running checklists, creating spec files,
or performing project-specific code reviews.

## File naming convention

```
<command-name>.md   (matches the slash command, no leading slash)

Examples:
  new-spec.md        →  /new-spec
  deploy-check.md    →  /deploy-check
  new-component.md   →  /new-component
```

## File structure

Each command file should include:

- **Description** — one line shown in the command picker
- **Usage** — `/command-name [arguments]`
- **Instructions** — what Claude does when the command is run
