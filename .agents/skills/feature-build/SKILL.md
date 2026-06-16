# Feature Build Skill

## Purpose

Use this skill when building a new feature or patient flow for the TriageFlowOPD Patient Mobile App.

This skill helps the agent create the right files in the right places without over-engineering.

## When to use

Use this skill for tasks like:

- Build a new patient screen
- Build a new patient flow
- Add a new route
- Connect a screen to a feature hook
- Connect a feature to backend API
- Add feature-specific components, services, hooks, or types

Examples:

```txt
Build the Phiếu khám screen
Build the QR checkpoint scan flow
Add payment QR result screen
Connect ticket screen to backend API
Build health package selection flow
```

## Required context

Before implementing, read:

```txt
AGENTS.md
docs/ai/PROJECT_CONTEXT.md
docs/ai/ARCHITECTURE.md
docs/ai/CONVENTIONS.md
```

Use these files as the source of truth.

If commands are needed, read:

```txt
docs/ai/COMMANDS.md
```

## Project scope

This mobile app is for Patient / Bệnh nhân only.

Do not build staff/admin modules unless explicitly requested.

Do not implement:

- Receptionist module
- Doctor module
- Ancillary Staff module
- Cashier module
- Admin module

## Core structure

Follow this structure:

```txt
src/app/       - Expo Router routes and main screen UI
src/features/  - feature logic, hooks, services, types, utils, feature components
src/shared/    - reusable components, hooks, services, types, utils, constants
src/config/    - app-level configuration
```

Main screen UI may live directly inside `src/app`.

Heavy logic must not live directly inside `src/app`.

## Before building

First identify:

- What patient feature is being requested
- Which route or screen is involved
- Which feature folder owns the logic
- Whether API endpoint details are available
- Whether Figma/UI details are available
- Whether new dependencies are required

If important information is missing, ask before implementing.

## File creation rules

Create only the files needed for the requested task.

It is okay to create folders because the project is still early, but follow the documented structure.

Do not create a large folder tree unrelated to the task.

If the task requires many new files, provide a short file plan before creating them.

## Route placement

Use `src/app` for route screens.

Examples:

```txt
src/app/(patient)/(tabs)/ticket.tsx
src/app/(patient)/(tabs)/scan.tsx
src/app/(patient)/payment/qr-payment.tsx
src/app/(patient)/visit/triage.tsx
```

Only these 5 screens should live directly inside `(patient)/(tabs)`:

```txt
home.tsx
ticket.tsx
scan.tsx
navigation.tsx
profile.tsx
```

Non-tab flows should live outside `(tabs)`.

Examples:

```txt
src/app/(patient)/visit/
src/app/(patient)/payment/
src/app/(patient)/care-options/
src/app/(patient)/notifications/
src/app/(patient)/journey/
```

## Feature placement

Use `src/features/<feature>/` for feature-specific code.

A feature may contain:

```txt
components/
hooks/
services/
types/
utils/
mocks/
```

Do not create all subfolders unless needed.

Example for Ticket:

```txt
src/app/(patient)/(tabs)/ticket.tsx
src/features/ticket/components/TicketCard.tsx
src/features/ticket/hooks/useCurrentTicket.ts
src/features/ticket/services/ticket.service.ts
src/features/ticket/types/ticket.types.ts
```

## Shared placement

Use `src/shared` only for code reused by multiple features.

Good shared examples:

```txt
src/shared/components/Button.tsx
src/shared/components/LoadingState.tsx
src/shared/components/ErrorState.tsx
src/shared/services/api-client.ts
src/shared/types/api.types.ts
src/shared/utils/formatDate.ts
```

Do not move feature-specific code into `shared` too early.

## API rules

Use Axios for API integration.

Do not call Axios directly inside screen files.

Preferred flow:

```txt
screen → feature hook → feature service → shared API client → backend API
```

Example:

```txt
src/app/(patient)/(tabs)/ticket.tsx
→ src/features/ticket/hooks/useCurrentTicket.ts
→ src/features/ticket/services/ticket.service.ts
→ src/shared/services/api-client.ts
```

The mobile app must call only the deployed TriageFlow Backend API.

The mobile app must not:

- Access the database directly
- Call the LLM API directly
- Process payment webhooks directly
- Sync directly with HIS or Mock-HIS

If endpoint details are missing, ask for:

- URL/path
- Method
- Request body
- Response shape
- Auth/session requirement
- Error response shape

## UI rules

Use NativeWind for styling.

User-facing text should be Vietnamese.

Code and file names should be English.

Use `.tsx` for screens and components.

Use `.ts` for hooks, services, types, utils, constants, and config.

Do not use `.jsx`.

## State rules

Use simple state first:

- `useState`
- `useEffect`
- Custom hooks
- Feature hooks

Do not introduce Zustand, Redux, React Query, or another state library unless explicitly requested.

## Loading and error states

For data screens, handle:

- Loading state
- Empty state
- Error state
- Success state

Use shared components if available:

```txt
LoadingState
EmptyState
ErrorState
```

Do not leave a screen blank while loading or when an error occurs.

## Payment rules

Mobile may display:

- Invoice
- Dynamic QR
- Payment status
- Payment result

Mobile must not:

- Manually mark payment as `Paid`
- Process payment webhooks
- Store payment secrets

Payment verification belongs to backend.

## Triage rules

Mobile does not call the LLM directly.

Correct flow:

```txt
Mobile Body Map + symptoms
→ Backend API
→ Backend handles LLM
→ Backend returns structured triage result
→ Mobile displays result
```

## Scan and navigation rules

The Scan tab is for QR checkpoint scanning.

Do not assume CCCD/VNeID scanning unless explicitly requested.

The hospital map is custom-built by the team.

Do not assume Google Maps, Mapbox, Apple Maps, or another map provider.

Do not add map libraries without approval.

Map format is TBD.

## Asset rules

Figma-exported SVG assets are preferred for icons and vector assets when possible.

Do not add SVG or icon libraries without approval.

If SVG support requires setup, explain the dependency and setup before implementation.

## Dependency rules

Do not add new dependencies without approval.

Before adding a dependency, explain:

- Why it is needed
- What problem it solves
- Whether the project already has an alternative
- Setup steps required

## Implementation checklist

Before finishing, check:

- Files are in the correct folders.
- Route files are lowercase.
- Components are PascalCase.
- Hooks start with `use`.
- API calls are not inside screen files.
- NativeWind is used consistently.
- Loading, empty, and error states are handled if needed.
- No new dependency was added without approval.
- No staff/admin scope was added by accident.

## Final response

After implementation, summarize:

- What was built
- Which files were created or edited
- Any assumptions made
- Any missing API details
- Any commands the user should run
