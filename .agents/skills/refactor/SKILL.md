# Refactor Skill

## Purpose

Use this skill when improving existing code structure without changing user-visible behavior.

The goal is to make code cleaner, easier to maintain, and more aligned with the project architecture.

## When to use

Use this skill for tasks like:

- Clean up messy code
- Move heavy logic out of a screen
- Extract reusable components
- Extract reusable hooks
- Move API logic into services
- Improve file naming
- Reduce duplication
- Organize feature files
- Improve TypeScript types without changing behavior

Examples:

```txt
Refactor the Ticket screen
Move API calls out of Home screen
Extract repeated cards into components
Clean up payment flow code
Refactor scan logic into a hook
```

## Required context

Before refactoring, read:

```txt
AGENTS.md
docs/ai/ARCHITECTURE.md
docs/ai/CONVENTIONS.md
```

If the refactor touches patient flow behavior, also read:

```txt
docs/ai/PROJECT_CONTEXT.md
```

If commands are needed, read:

```txt
docs/ai/COMMANDS.md
```

## Main rule

Refactor without changing behavior.

Do not introduce new features during refactor.

Do not fix unrelated bugs unless the user asks or the bug blocks the refactor.

Do not add dependencies unless explicitly approved.

## Refactor scope

Before editing, identify:

- What code is being refactored
- Why the refactor is needed
- Which files will be touched
- Whether behavior must remain exactly the same
- Whether API contracts are involved
- Whether route names or navigation behavior could be affected

If the refactor may affect many files, provide a short plan before changing them.

## Safe refactor types

Allowed refactors:

- Extract repeated UI into components
- Extract reusable logic into hooks
- Move raw API calls into feature services
- Move feature-specific types into feature type files
- Move truly reusable code into `src/shared`
- Rename internal variables for clarity
- Split a large component into smaller components
- Replace duplicated constants with shared constants
- Improve loading, empty, and error state structure without changing behavior

Risky refactors that require explanation first:

- Rename routes
- Move route files
- Change navigation behavior
- Change API request or response shapes
- Change auth/session behavior
- Change payment status logic
- Change map/navigation assumptions
- Add new dependencies
- Replace state management approach
- Change global styling setup

## Folder rules

Follow this structure:

```txt
src/app/       - Expo Router routes and main screen UI
src/features/  - feature logic, hooks, services, types, utils, feature components
src/shared/    - reusable components, hooks, services, types, utils, constants
src/config/    - app-level configuration
```

Keep screen UI in `src/app`.

Move feature logic into `src/features`.

Move only truly reusable code into `src/shared`.

Do not create a new architecture style.

## Screen refactor rules

Screens in `src/app` may contain:

- Layout
- UI composition
- NativeWind classes
- Calls to feature hooks
- Navigation actions

Move these out of screens when possible:

- Raw API calls
- Large business logic
- Large mock data
- Long type definitions
- Payment verification logic
- LLM logic
- Database logic
- Map pathfinding logic

## Component extraction rules

Extract a component when:

- The UI is repeated
- The screen is too large
- A section has a clear responsibility
- A card/list/item pattern appears more than once

Use feature components for feature-specific UI.

Examples:

```txt
src/features/ticket/components/TicketCard.tsx
src/features/payment/components/PaymentQrCard.tsx
src/features/scan/components/CheckpointScanHint.tsx
```

Use shared components only when reused across multiple features.

Examples:

```txt
src/shared/components/Button.tsx
src/shared/components/Card.tsx
src/shared/components/LoadingState.tsx
```

Do not move components into `shared` too early.

## Hook extraction rules

Extract a hook when logic is reusable or makes a screen too complex.

Examples:

```txt
useCurrentTicket.ts
usePaymentStatus.ts
useCheckpointScanner.ts
```

Feature hooks should live in:

```txt
src/features/<feature>/hooks/
```

Shared hooks should live in:

```txt
src/shared/hooks/
```

Do not place hooks directly in `src/app`.

## API refactor rules

Use Axios for API integration.

Do not call Axios directly inside screen files.

Preferred flow:

```txt
screen → feature hook → feature service → shared API client → backend API
```

Recommended shared API client location:

```txt
src/shared/services/api-client.ts
```

Feature service example:

```txt
src/features/ticket/services/ticket.service.ts
```

Do not change API contracts during refactor unless explicitly requested.

If API behavior is unclear, ask before changing it.

## Type refactor rules

Feature-specific types should live in:

```txt
src/features/<feature>/types/
```

Shared types should live in:

```txt
src/shared/types/
```

Prefer clear types over `any`.

Do not invent final API response fields if backend contracts are not confirmed.

## Styling refactor rules

Use NativeWind.

Do not replace NativeWind with another styling system.

Keep class names readable.

Extract repeated UI patterns into components.

Avoid large inline styles unless needed for dynamic values or unsupported styling.

## Route refactor rules

The project uses Expo Router.

Use lowercase route file names.

Use `.tsx` for route screens.

Do not rename or move route files unless required.

If a route must be renamed or moved, explain why first.

The 5 bottom tabs are:

```txt
home.tsx
ticket.tsx
scan.tsx
navigation.tsx
profile.tsx
```

Only these 5 screens should live directly inside `(patient)/(tabs)`.

## Payment refactor rules

Payment verification belongs to backend.

Mobile must not:

- Manually mark payment as `Paid`
- Process payment webhooks
- Store payment secrets

Do not change payment status logic unless explicitly requested.

## Scan and navigation refactor rules

The Scan tab is for QR checkpoint scanning.

Do not change it into CCCD/VNeID scanning unless explicitly requested.

The hospital map is custom-built by the team.

Do not introduce Google Maps, Mapbox, Apple Maps, or another map provider.

Do not add map libraries without approval.

## Dependency rules

Do not add dependencies during refactor unless explicitly approved.

Before adding a dependency, explain:

- Why it is needed
- What problem it solves
- Whether the project already has an alternative
- Required setup steps

## Refactor checklist

Before finishing, check:

- Behavior is preserved.
- No unrelated feature was added.
- No unrelated bug fix was mixed in.
- No route was renamed unnecessarily.
- No dependency was added without approval.
- API calls are not inside screen files.
- Feature code is not moved to `shared` too early.
- NativeWind remains the styling approach.
- TypeScript types are not weakened unnecessarily.
- Patient Mobile App scope is preserved.

## Verification

When possible, suggest a command to verify the refactor.

Use commands documented in:

```txt
docs/ai/COMMANDS.md
```

Examples:

```bash
npm start
npm run lint
```

Only mention commands that exist or are documented.

## Final response

After refactoring, summarize:

- What was refactored
- Which files were changed
- What behavior was preserved
- Any assumptions made
- Any follow-up steps needed

If the refactor was intentionally small, say so.
