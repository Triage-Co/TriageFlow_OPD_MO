# Coding Conventions

## General

- Use TypeScript.
- Use functional components.
- Keep code simple and readable.
- Prefer explicit types for props, API responses, and shared models.
- Avoid `any` unless absolutely necessary.
- Avoid duplicated logic.
- Avoid unrelated code changes.
- Follow the existing style in the project.

## File naming

Use these conventions unless the project already uses a different pattern:

- Components: `PascalCase.tsx`
- Hooks: `useSomething.ts`
- Services: `something.service.ts`
- Types: `something.types.ts`
- Utilities: `something.utils.ts`
- Constants: `something.constants.ts`

## Components

- Reuse existing components before creating new ones.
- Keep components focused.
- Move repeated UI into reusable components.
- Keep screen components mostly responsible for layout and flow.
- Avoid putting too much business logic directly inside UI components.

## Hooks

- Hooks must start with `use`.
- Use hooks for reusable stateful logic.
- Keep hooks focused on one responsibility.

## Services

- Put API calls and external service logic in service files when possible.
- Do not scatter API calls across many UI components.
- Handle API errors clearly.
- Type API inputs and outputs when possible.

## Types

- Prefer shared types for reused data models.
- Keep types close to the feature if they are feature-specific.
- Move types to a shared location only when reused.

## Styling with Tailwind/NativeWind

- Use Tailwind/NativeWind class names when the project is configured for it.
- Prefer `className` styling over inline styles when possible.
- Keep class names readable.
- Avoid very long className strings when a reusable component would be clearer.
- Reuse existing UI components and style patterns.
- Do not introduce a second styling system unless necessary.
- Avoid hardcoding repeated colors, spacing, or typography if the project already has theme values.
- Keep UI responsive for common mobile screen sizes.

## Error handling

- Handle loading states.
- Handle empty states.
- Handle error states.
- Avoid silent failures.

## Dependencies

- Do not add new libraries unless necessary.
- Prefer built-in React Native, Expo, NativeWind, or existing project dependencies.
- Explain why a new dependency is needed before adding it.

## Code changes

- Keep changes small and focused.
- Do not rename files or folders unless necessary.
- Do not rewrite large files unless the task requires it.
- Do not change unrelated behavior.