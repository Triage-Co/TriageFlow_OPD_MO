# AGENTS

## Purpose

This file gives high-level instructions for AI agents working in this repository.

This repository is the Patient Mobile App for TriageFlowOPD.

The app is built with:

- React Native
- Expo
- Expo Router
- TypeScript
- NativeWind

Primary role:

- Patient / Bệnh nhân

Respond to the user in Vietnamese by default.

## Required reading order

Before implementing code, read these files when relevant:

```txt
docs/ai/PROJECT_CONTEXT.md
docs/ai/ARCHITECTURE.md
docs/ai/COMMANDS.md
docs/ai/CONVENTIONS.md
```

Use them as the source of truth for:

- Project scope
- Folder structure
- Routing structure
- Coding conventions
- Commands
- API rules
- Mobile app responsibilities

Do not ignore these files when making architecture or implementation decisions.

## Project scope

This repository is for the Patient Mobile App only.

Do not implement these modules unless explicitly requested:

- Receptionist
- Doctor
- Ancillary Staff
- Cashier
- Admin

These roles may exist in the full TriageFlowOPD system, but they are not part of this mobile app by default.

## Core architecture

Follow this structure:

```txt
src/app/       - Expo Router routes and main screen UI
src/features/  - feature logic, hooks, services, types, utils, feature components
src/shared/    - reusable components, hooks, services, types, utils, constants
src/config/    - app-level configuration
```

Main screen UI may live directly inside `src/app`.

Keep heavy logic out of `src/app`.

## File creation rules

The project is still early and may not contain all folders yet.

AI agents may create new folders and files when they are needed for the requested task, but they must follow the structure documented in:

```txt
docs/ai/ARCHITECTURE.md
docs/ai/CONVENTIONS.md
```

Allowed:

- Create documented route groups when needed.
- Create documented feature folders when implementing that feature.
- Create shared components when a component is truly reused.
- Create config files when app-level config is needed.

Not allowed without approval:

- Create a new architecture style.
- Create large folder structures unrelated to the current task.
- Create staff/admin modules by default.
- Create files outside the documented structure without explaining why.
- Add new dependencies without approval.
- Add map, auth, storage, notification, or state libraries without approval.

If a task requires many new files, first provide a short planned file list and wait for confirmation unless the user clearly asked to generate the full structure.

## Routing rules

The project uses Expo Router.

Routes are under:

```txt
src/app/
```

Use route groups such as:

```txt
src/app/(auth)/
src/app/(patient)/
src/app/(patient)/(tabs)/
```

The 5 bottom tabs are:

```txt
home.tsx
ticket.tsx
scan.tsx
navigation.tsx
profile.tsx
```

Only these 5 screens should live directly inside `(patient)/(tabs)`.

Use lowercase route names.

Use `.tsx` for screens and components.

Do not use `.jsx` in this TypeScript project.

## API rules

The mobile app communicates with the deployed TriageFlow Backend API.

The mobile app must not:

- Access the database directly
- Call the LLM API directly
- Process payment webhooks directly
- Sync directly with HIS or Mock-HIS

Use Axios for API integration.

Create a shared API client when API integration starts:

```txt
src/shared/services/api-client.ts
```

Feature API services should call the shared API client.

Do not call Axios directly inside screen files.

If an API endpoint, request body, response shape, auth behavior, payment behavior, or map format is unclear, ask before implementing.

## Payment rules

Payment UI belongs to the mobile app.

Payment verification belongs to backend.

The mobile app may:

- Display invoice data
- Display Dynamic QR payment data
- Display payment status from backend
- Refresh or poll payment status if required

The mobile app must not:

- Manually mark payment as `Paid`
- Process payment webhooks
- Store payment secrets

## Triage rules

Mobile does not call the LLM directly.

Correct flow:

```txt
Mobile Body Map + symptoms
→ TriageFlow Backend API
→ LLM processing on backend side
→ Structured triage result
→ Mobile displays result
```

Do not add direct LLM API calls to the mobile app.

## Scan and navigation rules

The Scan tab is for QR checkpoint scanning.

Do not assume CCCD/VNeID scanning in the Scan tab unless explicitly requested.

The hospital map is custom-built by the team.

Do not assume:

- Google Maps
- Mapbox
- Apple Maps
- Any third-party map provider

Map format is TBD.

Backend may provide GeoJSON or another route/map format later.

Do not add map libraries without approval.

## Auth and storage rules

Authentication details are not fully documented yet.

Use AsyncStorage for app session persistence when authentication is implemented.

Do not invent final auth behavior without backend contract.

Do not invent token refresh behavior without backend contract.

Do not store these in the mobile app:

- Backend secrets
- LLM keys
- Payment secrets
- Database credentials

## Asset rules

Figma-exported SVG assets are preferred for icons and vector assets when possible.

Do not add SVG or icon libraries without approval.

If SVG support requires setup, explain the dependency and setup before implementation.

For non-vector images, PNG or WebP exports are acceptable.

## Dependency rules

Do not add new dependencies without approval.

Before adding a dependency, explain:

- Why it is needed
- What problem it solves
- Whether the project already has an alternative
- Required setup steps

This rule applies to:

- Axios
- AsyncStorage
- SVG libraries
- Icon libraries
- State management libraries
- Auth libraries
- Map libraries
- Notification libraries

## Command rules

Use commands documented in:

```txt
docs/ai/COMMANDS.md
```

Prefer commands already defined in `package.json`.

Do not invent commands.

Do not run destructive commands without warning.

Do not run reset commands unless the user explicitly asks.

## Implementation style

Follow conventions documented in:

```txt
docs/ai/CONVENTIONS.md
```

General rules:

- Keep changes small and focused.
- Keep screen UI readable.
- Keep API calls out of screen files.
- Keep business logic out of screen files when possible.
- Use TypeScript types for important data.
- Use NativeWind consistently.
- Handle loading, empty, error, and success states for data screens.
- Avoid over-engineering.
- Ask when requirements are unclear.

## Review behavior

When making a non-trivial change, summarize:

- What was changed
- Which files were created or edited
- Any assumptions made
- Any follow-up steps needed

Be explicit about anything that is still TBD.
