# Code Review Skill

Use this skill when reviewing code.

## Goal

Review code for correctness, maintainability, readability, user experience, and consistency.

## Steps

1. Read `AGENTS.md`.
2. Read `docs/ai/PROJECT_CONTEXT.md`.
3. Read `docs/ai/CONVENTIONS.md`.
4. Inspect the relevant files.
5. Identify real issues, not stylistic preferences only.
6. Prioritize important problems first.
7. Suggest small and practical improvements.

## Review checklist

Check for:

- TypeScript issues
- Possible runtime bugs
- Incorrect assumptions
- Naming problems
- Unused code
- Duplicated logic
- Large or complex components
- Bad folder placement
- Missing loading states
- Missing empty states
- Missing error states
- API error handling issues
- Inconsistent Tailwind/NativeWind usage
- Overly long className strings
- Unnecessary inline styles
- Unnecessary dependencies
- Over-engineering

## Rules

- Do not edit code unless the user asks.
- Do not nitpick too much.
- Focus on issues that affect correctness, maintainability, consistency, or user experience.
- Explain why each issue matters.

## Final response

Include:

- Critical issues
- Suggested improvements
- Optional improvements
- Files reviewed