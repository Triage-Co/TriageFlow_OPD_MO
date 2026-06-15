# Feature Build Skill

Use this skill when implementing a new feature.

## Goal

Build the requested feature while following the existing project structure, conventions, and architecture.

## Steps

1. Understand the requested feature.
2. Read `AGENTS.md`.
3. Read `docs/ai/PROJECT_CONTEXT.md`.
4. Read `docs/ai/CONVENTIONS.md`.
5. Read `docs/ai/ARCHITECTURE.md` if the feature affects navigation, API, auth, state, database, styling system, or folder structure.
6. Inspect related screens, components, hooks, services, types, utilities, and styles.
7. Reuse existing patterns before creating new ones.
8. Implement the smallest complete version first.
9. Add or update types when needed.
10. Handle loading, empty, and error states when relevant.
11. Use Tailwind/NativeWind consistently when building UI.
12. Avoid unrelated changes.
13. Run lint/typecheck when possible.

## Rules

- Do not invent business logic.
- Do not add new dependencies unless necessary.
- Do not change existing behavior unless the feature requires it.
- Do not perform large refactors while building a feature unless explicitly asked.
- Do not replace the existing styling approach.

## Final response

Include:

- What was implemented
- Files changed
- Why the changes were made
- How to verify
- Any assumptions or follow-up work