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

## Current task boundary

Only create files and folders directly required by the current user request.

Architecture examples are not permission to scaffold the whole app.

Do not create routes, feature folders, mocks, screens, services, or shared files for unrelated features just because they are listed in the architecture document.

For every task:

- Identify the exact feature or flow being requested.
- Create only files directly needed for that feature or flow.
- Do not create future screens, future features, placeholder modules, or full app scaffolding.
- Do not create unrelated tab screens, feature folders, mocks, services, or components.
- If unsure whether a file is needed, ask before creating it.

Examples:

- Auth task → create only auth routes, auth feature files, and shared/config files directly needed by Auth.
- Payment task → create only payment routes, payment feature files, and shared/config files directly needed by Payment.
- Ticket task → create only ticket/queue files directly needed by Ticket.
- Scan task → create only scan/checkpoint files directly needed by Scan.
- Navigation task → create only navigation/map files directly needed by Navigation.
- Profile task → create only profile files directly needed by Profile.

Do not create files for other features unless the user explicitly asks.

If a task requires many new files, first provide a short planned file list and wait for confirmation unless the user clearly asked to generate the full structure.

## File creation rules

The project is still early and may not contain all folders yet.

AI agents may create new folders and files when they are needed for the current task, but they must follow the structure documented in:

```txt
docs/ai/ARCHITECTURE.md
docs/ai/CONVENTIONS.md
```

Allowed:

- Create documented route groups when needed for the current task.
- Create documented feature folders when implementing that feature.
- Create shared components only when they are directly used by the current task or clearly reused.
- Create config files only when app-level config is needed by the current task.

Not allowed without approval:

- Scaffold the whole app just because the architecture document lists future folders.
- Create a new architecture style.
- Create large folder structures unrelated to the current task.
- Create staff/admin modules by default.
- Create files outside the documented structure without explaining why.
- Add new dependencies without approval.
- Add map, auth, storage, notification, or state libraries without approval.

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

## API reading scope

Do not crawl or read the entire Swagger/API documentation by default.

For each task, only inspect the API group and endpoints directly related to the current user request.

Examples:

- Auth task → only read Auth endpoints.
- Payment task → only read Payment endpoints.
- Ticket task → only read Ticket/Queue endpoints.
- Scan task → only read Scan/Checkpoint endpoints.
- Navigation task → only read Map/Checkpoint/Route endpoints.
- Profile task → only read Profile/User endpoints.
- Notification task → only read Notification endpoints.

Do not read unrelated API groups unless the user explicitly asks or you explain why they are required for the current task.

When API details are unclear, ask the user for the specific endpoint schema instead of scanning the whole API documentation.

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
