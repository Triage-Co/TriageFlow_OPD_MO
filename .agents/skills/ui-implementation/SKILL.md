# UI Implementation Skill

Use this skill when creating or updating UI screens or components.

## Goal

Build clean, consistent, responsive React Native UI using the existing Expo and Tailwind/NativeWind setup.

## Steps

1. Understand the target UI.
2. Read `AGENTS.md`.
3. Read `docs/ai/PROJECT_CONTEXT.md`.
4. Read `docs/ai/CONVENTIONS.md`.
5. Inspect existing screens, components, styles, constants, and assets.
6. Reuse existing UI components when possible.
7. Use Tailwind/NativeWind class names consistently.
8. Keep screen components clean.
9. Move repeated UI into reusable components.
10. Handle loading, empty, and error states when relevant.
11. Check layout on common mobile screen sizes when possible.

## Tailwind/NativeWind rules

- Prefer `className` for styling when supported.
- Follow existing className patterns.
- Keep className readable.
- Avoid excessive inline styles.
- Use inline styles only when needed for dynamic values that are hard to express with Tailwind/NativeWind.
- Do not introduce another UI/styling library unless explicitly asked.
- Do not modify Tailwind/NativeWind configuration unless the task requires it.

## React Native UI rules

- Use safe mobile spacing.
- Consider small screens.
- Consider keyboard behavior for forms.
- Consider loading, empty, and error UI.
- Avoid fixed widths when flexible layout is better.
- Use accessible touch targets when possible.

## Final response

Include:

- UI created or changed
- Components reused or added
- Files changed
- Any missing assets or assumptions
- How to verify