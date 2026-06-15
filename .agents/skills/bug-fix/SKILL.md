# Bug Fix Skill

Use this skill when fixing a bug.

## Goal

Find the root cause and apply the smallest safe fix.

## Steps

1. Understand the bug from the user description.
2. Read `AGENTS.md`.
3. Read `docs/ai/PROJECT_CONTEXT.md`.
4. Read `docs/ai/CONVENTIONS.md`.
5. Read `docs/ai/ARCHITECTURE.md` if the bug involves navigation, API, auth, state, database, styling, or shared structure.
6. Identify related files.
7. Inspect the smallest relevant area first.
8. Find the root cause before editing.
9. Fix the root cause, not only the symptom.
10. Check if similar bugs exist nearby.
11. Avoid unrelated refactors.
12. Run lint/typecheck when possible.

## Tailwind/NativeWind bug notes

If the bug is related to styling:

- Check if the component uses `className` correctly.
- Check if Tailwind/NativeWind is already configured.
- Check existing components for the correct styling pattern.
- Do not rewrite styling setup unless the bug is caused by configuration.

## Rules

- Keep the fix small.
- Do not rewrite unrelated code.
- Do not change public behavior unless needed to fix the bug.
- Do not add new dependencies for simple fixes.
- Do not replace the styling system for a styling bug.

## Final response

Include:

- Root cause
- Fix applied
- Files changed
- How to verify
- Any remaining risks