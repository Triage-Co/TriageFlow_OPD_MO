# AGENTS.md

## Project type

This is a React Native mobile app built with Expo, TypeScript, and Tailwind/NativeWind.

Project-specific details may not be fully documented yet. Do not invent project behavior, business logic, API contracts, routes, database schema, or folder structure. Inspect the existing codebase before making conclusions.

## Always read first

Before making code changes, read:

- `docs/ai/PROJECT_CONTEXT.md`
- `docs/ai/CONVENTIONS.md`

## Read when relevant

- Read `docs/ai/ARCHITECTURE.md` when changing navigation, authentication, API logic, state management, database logic, folder structure, or shared architecture.
- Read `docs/ai/COMMANDS.md` when installing dependencies, running the app, testing, linting, typechecking, or building the project.

## Antigravity agent setup

Use `.agents/agents.md` to understand the default agent role.

Use the matching skill for the task:

- Feature build: `.agents/skills/feature-build/SKILL.md`
- Bug fix: `.agents/skills/bug-fix/SKILL.md`
- Code review: `.agents/skills/code-review/SKILL.md`
- Refactor: `.agents/skills/refactor/SKILL.md`
- UI implementation: `.agents/skills/ui-implementation/SKILL.md`

## Core workflow

Before editing code:

1. Understand the task.
2. Read the relevant docs.
3. Inspect related files.
4. Explain the plan briefly.
5. Make small, focused changes.
6. Avoid unrelated edits.
7. Summarize changed files and how to verify.

## General rules

- Prefer simple, maintainable solutions.
- Follow the existing folder structure and coding conventions.
- Use TypeScript.
- Use Tailwind/NativeWind for styling if the project is already configured for it.
- Avoid `any` unless absolutely necessary.
- Reuse existing components, hooks, services, types, and utilities before creating new ones.
- Do not add new dependencies unless there is a clear reason.
- Do not rewrite large parts of the project unless explicitly asked.
- Do not change navigation routes, API contracts, database schema, environment variables, or public behavior without explaining the reason first.
- Do not delete files unless the task clearly requires it.
- Do not rename files or folders unless necessary.
- Keep code readable for a student project while still following professional practices.

## Final response format

After making changes, include:

- What was changed
- Files changed
- Why the change was made
- How to verify
- Any assumptions or follow-up work