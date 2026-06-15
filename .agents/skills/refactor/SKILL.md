# Refactor Skill

Use this skill when refactoring code.

## Goal

Improve code structure, readability, and maintainability without changing behavior.

## Steps

1. Understand the current behavior before editing.
2. Read `AGENTS.md`.
3. Read `docs/ai/CONVENTIONS.md`.
4. Read `docs/ai/ARCHITECTURE.md` if the refactor affects shared structure.
5. Identify duplicated, complex, or poorly organized code.
6. Refactor in small steps.
7. Keep external behavior the same.
8. Extract reusable components, hooks, utilities, or services only when useful.
9. Keep Tailwind/NativeWind styling consistent with the existing project.
10. Avoid unnecessary abstraction.
11. Run lint/typecheck when possible.

## Rules

- Do not change UI behavior unless asked.
- Do not change API contracts unless necessary.
- Do not rename public routes unless asked.
- Do not combine refactor with unrelated feature work.
- Do not over-engineer.
- Do not replace Tailwind/NativeWind with another styling approach.

## Final response

Include:

- What was refactored
- Why it was refactored
- Files changed
- How to verify behavior stayed the same
- Any follow-up suggestions