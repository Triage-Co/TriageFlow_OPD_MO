# Code Review Skill

## Purpose

Use this skill when reviewing code for the TriageFlowOPD Patient Mobile App.

The goal is to find important issues, risky assumptions, architecture violations, and maintainability problems before code is accepted.

## When to use

Use this skill for tasks like:

- Review a screen implementation
- Review a feature before continuing
- Review API integration
- Review folder structure
- Review NativeWind usage
- Review TypeScript types
- Review a refactor
- Check whether code follows project rules

Examples:

```txt
Review the Ticket screen
Review the payment flow code
Check if this feature follows the architecture
Review this API service
Review before I commit
```

## Required context

Before reviewing, read:

```txt
AGENTS.md
docs/ai/ARCHITECTURE.md
docs/ai/CONVENTIONS.md
```

If the review depends on patient flow behavior, also read:

```txt
docs/ai/PROJECT_CONTEXT.md
```

If commands are mentioned, read:

```txt
docs/ai/COMMANDS.md
```

## Main rule

Review the code against the project rules.

Do not rewrite everything unless the user explicitly asks.

Focus on important issues first.

Avoid nitpicking unless it affects readability, consistency, or maintainability.

## Review priorities

Review in this order:

1. Correctness
2. Patient Mobile App scope
3. Architecture and folder placement
4. Routing and navigation
5. API and backend integration
6. TypeScript safety
7. UI and NativeWind consistency
8. Loading, empty, and error states
9. Dependency and setup risks
10. Maintainability

## Scope review

Check that the code stays within Patient Mobile App scope.

Flag code that adds unsupported modules such as:

- Receptionist
- Doctor
- Ancillary Staff
- Cashier
- Admin

These modules should not be implemented unless explicitly requested.

## Architecture review

Check that code follows this structure:

```txt
src/app/       - Expo Router routes and main screen UI
src/features/  - feature logic, hooks, services, types, utils, feature components
src/shared/    - reusable components, hooks, services, types, utils, constants
src/config/    - app-level configuration
```

Flag issues such as:

- Raw API calls inside screen files
- Large business logic inside `src/app`
- Large mock data inside screen files
- Feature-specific code moved to `shared` too early
- Shared code duplicated across features
- Config values hardcoded in multiple places

## Routing review

The project uses Expo Router.

Check that:

- Routes are under `src/app`
- Route names are lowercase
- Screens use `.tsx`
- Route groups are used correctly
- Non-tab flows are outside `(tabs)`

The 5 bottom tabs are:

```txt
home.tsx
ticket.tsx
scan.tsx
navigation.tsx
profile.tsx
```

Only these 5 screens should live directly inside `(patient)/(tabs)`.

Flag route renames or route moves that are not explained.

## Screen review

Screens in `src/app` may contain:

- Layout
- UI composition
- NativeWind classes
- Calls to feature hooks
- Navigation actions

Flag screen files that contain:

- Raw API calls
- Large business logic
- Long type definitions
- Large mock data
- Payment verification
- LLM calls
- Database access
- Map pathfinding logic

## Component review

Check that components are:

- Small enough to understand
- Named with PascalCase
- Typed with clear props
- Free of unrelated business logic
- Placed in the correct folder

Feature-specific components should be in:

```txt
src/features/<feature>/components/
```

Reusable components should be in:

```txt
src/shared/components/
```

Flag components moved to `shared` before they are truly reused.

## Hook review

Check that hooks:

- Start with `use`
- Are not placed directly in `src/app`
- Keep reusable logic out of screens
- Do not mix too many responsibilities

Feature hooks should be in:

```txt
src/features/<feature>/hooks/
```

Shared hooks should be in:

```txt
src/shared/hooks/
```

## API review

The app uses Axios for API integration.

Preferred flow:

```txt
screen → feature hook → feature service → shared API client → backend API
```

Check that:

- Axios is not called directly inside screen files
- API logic is in feature services
- Shared API client is used when available
- Request and response types are clear
- API errors are handled
- Loading and error states are reflected in UI

The mobile app must not:

- Access the database directly
- Call the LLM API directly
- Process payment webhooks directly
- Sync directly with HIS or Mock-HIS

Flag any direct backend-secret, LLM-key, payment-secret, or database-credential usage in mobile code.

## TypeScript review

Check that:

- Important data has types
- Feature types are placed in feature type folders
- Shared types are placed in `src/shared/types`
- `any` is avoided unless justified
- Temporary types are clearly marked
- API response fields are not invented without backend contract

Flag unsafe type assertions that hide real problems.

## NativeWind review

Check that UI uses NativeWind consistently.

Prefer:

```tsx
<View className="flex-1 bg-white px-4">
```

Flag:

- Large inline style objects without reason
- Repeated class patterns that should be extracted
- Mixed styling systems without explanation
- NativeWind config issues

NativeWind should scan:

```js
content: ["./src/**/*.{js,jsx,ts,tsx}"]
```

## UI state review

For data-driven screens, check for:

- Loading state
- Empty state
- Error state
- Success state

Flag screens that become blank during loading or errors.

## Language review

User-facing text should be Vietnamese by default.

Code, files, variables, types, and functions should use English.

Flag mixed naming or unclear labels when it affects maintainability.

## Payment review

Payment verification belongs to backend.

Mobile may display:

- Invoice
- Dynamic QR
- Payment status
- Payment result

Flag code that:

- Manually marks payment as `Paid`
- Processes payment webhooks in mobile
- Stores payment secrets
- Invents payment status behavior without backend contract

## Scan and map review

The Scan tab is for QR checkpoint scanning.

Flag code that turns Scan into:

- CCCD/VNeID scanner without request
- General QR scanner without request
- LLM triage screen

The hospital map is custom-built by the team.

Flag assumptions about:

- Google Maps
- Mapbox
- Apple Maps
- Other map providers

Do not approve map libraries unless the user explicitly approved them.

## Asset review

Figma-exported SVG assets are preferred for icons and vector assets when possible.

Flag issues such as:

- Adding SVG or icon libraries without approval
- Asset names that are unclear or not English
- Silently converting SVG icons to PNG without reason
- Placing assets in inconsistent folders

## Dependency review

Flag any new dependency that was added without approval.

For new dependencies, check whether the implementation explains:

- Why it is needed
- What problem it solves
- Whether the project already has an alternative
- Setup steps required

This applies to:

- Axios
- AsyncStorage
- SVG libraries
- Icon libraries
- State management libraries
- Auth libraries
- Map libraries
- Notification libraries

## Review output format

When reviewing, organize feedback by severity:

```txt
Critical
Major
Minor
Questions
```

Use this meaning:

- Critical: must fix; app may break or violates major project rules.
- Major: should fix; risky or likely to cause maintainability issues.
- Minor: nice to improve; does not block progress.
- Questions: unclear requirements or missing information.

If there are no major issues, say so clearly.

## Final response

A review should include:

- Overall assessment
- Critical issues, if any
- Major issues, if any
- Minor suggestions, if useful
- Questions or missing information
- Recommended next steps

Do not rewrite the whole file unless requested.

If suggesting code changes, keep them focused and explain why.
