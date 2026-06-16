# Architecture

## Status

This document defines the core architecture rules for the TriageFlowOPD Patient Mobile App.

Keep this file short, practical, and easy for AI agents to follow.

Do not assume architecture details that are not documented here or visible in the project.

## Tech stack

- React Native
- Expo
- Expo Router
- TypeScript
- NativeWind

## Repository scope

This repository is for the Patient Mobile App only.

Primary role:

- Patient / Bệnh nhân

Do not implement Receptionist, Doctor, Ancillary Staff, Cashier, or Admin modules unless explicitly requested.

## Core structure

Use this structure:

```txt
src/app/       - Expo Router routes and main screen UI
src/features/  - feature logic, hooks, services, types, utils, feature components
src/shared/    - reusable components, hooks, services, types, utils, constants
src/config/    - app-level configuration
```

Main screen UI may live directly inside `src/app`.

Do not put heavy logic inside `src/app`.

## `src/app` rules

`src/app` may contain:

- Screen layout
- Screen UI composition
- NativeWind `className`
- Calls to feature hooks
- Rendering feature components
- Navigation actions

`src/app` should not contain:

- Raw API calls
- Large business logic
- Large mock data
- Payment verification logic
- LLM logic
- Database logic
- Long type definitions
- Map pathfinding algorithms

## Routing

The project uses Expo Router.

The app entry in `package.json` is:

```json
"main": "expo-router/entry"
```

Routes are under:

```txt
src/app/
```

Recommended route groups:

```txt
src/app/(auth)/
src/app/(patient)/
src/app/(patient)/(tabs)/
```

Use lowercase route names and `.tsx` files.

Do not use `.jsx` in this TypeScript project.

## Recommended app routes

```txt
src/app/
├─ _layout.tsx
├─ index.tsx
├─ (auth)/
│  ├─ _layout.tsx
│  ├─ login.tsx
│  └─ register.tsx
└─ (patient)/
   ├─ _layout.tsx
   ├─ (tabs)/
   │  ├─ _layout.tsx
   │  ├─ home.tsx
   │  ├─ ticket.tsx
   │  ├─ scan.tsx
   │  ├─ navigation.tsx
   │  └─ profile.tsx
   ├─ visit/
   ├─ payment/
   ├─ care-options/
   ├─ notifications/
   └─ journey/
```

Do not create all folders immediately.

Create folders when the related feature is implemented.

## Bottom tabs

The app has 5 patient-facing bottom tabs:

```txt
home.tsx        - Trang chủ
ticket.tsx      - Phiếu khám
scan.tsx        - Quét mã
navigation.tsx  - Dẫn đường
profile.tsx     - Hồ sơ
```

Only these 5 screens should live directly inside `(patient)/(tabs)`.

## Tab responsibilities

### Home

Purpose:

- Patient dashboard
- Current visit overview
- Quick actions
- Entry point to visit, payment, notification, and journey flows

### Ticket

Purpose:

- Digital examination ticket
- Master QR
- Queue number
- Current specialty or room
- Queue status
- Estimated waiting time
- Payment-gated visit status

Queue information belongs inside the Ticket tab.

There is no separate queue tab in the current UI.

### Scan

Purpose:

- Scan QR checkpoints for hospital navigation

Rules:

- Scan is for QR checkpoint scanning.
- Do not assume CCCD/VNeID scanning here unless explicitly requested.
- After scanning a checkpoint, send checkpoint data to backend.

### Navigation

Purpose:

- Display hospital navigation and route guidance

Current status:

- Map/navigation implementation is TBD.
- Placeholder UI is acceptable until map data format is confirmed.

Rules:

- The hospital map is custom-built by the team.
- Do not assume Google Maps, Mapbox, Apple Maps, or other map providers.
- Do not add map libraries without approval.
- Backend may provide GeoJSON or another route/map format later.

### Profile

Purpose:

- Patient profile
- Personal information
- Administrative information
- Insurance or identity information if provided by backend
- App account information

## Non-tab flows

Non-tab screens should be outside `(tabs)`.

Recommended areas:

```txt
src/app/(patient)/visit/          - new visit, triage, doctor selection, summary
src/app/(patient)/payment/        - invoice, QR payment, payment result
src/app/(patient)/care-options/   - health packages, direct-to-lab
src/app/(patient)/notifications/  - notification list and detail
src/app/(patient)/journey/        - journey log and timeline
```

Use `care-options` instead of `services` to avoid confusion with API service files.

## Features

Use `src/features` for feature-specific code.

Recommended feature folders:

```txt
auth/
visit/
triage/
appointment/
payment/
ticket/
queue/
scan/
navigation/
journey/
profile/
notifications/
```

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

Do not use `screens/` inside features by default because main screen UI lives in `src/app`.

## Shared code

Use `src/shared` only for code reused across multiple features.

Recommended folders:

```txt
components/
hooks/
services/
types/
utils/
constants/
```

Shared components may include:

- Button
- Card
- Input
- ScreenContainer
- LoadingState
- EmptyState
- ErrorState
- StatusBadge
- AppHeader

Keep shared components simple and free of business logic.

## API layer

The mobile app communicates with the deployed TriageFlow Backend API.

The mobile app must not:

- Access the database directly
- Call the LLM API directly
- Process payment webhooks directly
- Sync directly with HIS or Mock-HIS

Correct flow:

```txt
Mobile App → TriageFlow Backend API → External systems if needed
```

Use a shared API client when API integration starts:

```txt
src/shared/services/api-client.ts
```

Feature services should call the shared API client.

Do not put raw `fetch` or `axios` calls directly inside screen files.

If an endpoint is not confirmed, ask for it or use clearly marked temporary placeholder data.

## Mock data

Because the backend API already exists, prefer real API integration when endpoint contracts are available.

Use mock data only when:

- Endpoint is not ready
- Endpoint contract is not confirmed
- UI needs temporary placeholder data

Do not hardcode large mock data directly inside `src/app` screens.

## Triage

Mobile does not call the LLM directly.

Correct flow:

```txt
Mobile Body Map + symptoms → Backend → LLM processing → structured triage result → Mobile
```

Mobile should only display the structured triage result returned by backend.

Do not present AI triage as a final medical diagnosis.

## Payment

Payment UI belongs to mobile.

Payment verification belongs to backend.

Rules:

- Mobile displays invoice and Dynamic QR.
- Mobile displays payment status from backend.
- Mobile may refresh or poll payment status if required.
- Mobile must not manually mark payment as `Paid`.
- Mobile must not process payment webhooks.

## Scan and navigation

Scan flow:

```txt
Patient scans QR checkpoint → Mobile sends checkpoint to backend → Backend returns navigation context → Mobile updates UI
```

Map/navigation rules:

- Custom hospital map only.
- Map format is TBD.
- GeoJSON or another format may be provided later.
- Do not implement final pathfinding in mobile unless explicitly required.

## Authentication

Authentication details are not fully documented yet.

Document later:

- Login flow
- Register flow
- Logout flow
- Token/session storage
- Protected routes/screens

Rules:

- Session validation should go through backend.
- Do not invent final auth provider.
- Do not store sensitive tokens insecurely.

## State management

Use the simplest state management approach that fits the feature.

Rules:

- Use local component state for simple UI state.
- Use hooks for reusable logic.
- Keep server data access inside feature hooks and services.
- Do not introduce new state libraries unless necessary.

## Storage

The mobile app does not access the database directly.

Database access belongs to backend.

Mobile storage is only for client-side needs such as:

- Session data, if required
- Local preferences
- Temporary UI state
- Cached non-sensitive data, if required

Do not store backend secrets, LLM keys, payment secrets, or database credentials in the mobile app.

## Styling

The app uses NativeWind.

Rules:

- Prefer NativeWind `className` over inline styles.
- Use inline styles only for dynamic values or unsupported cases.
- Keep class names readable.
- Extract repeated UI into reusable components.
- Do not replace NativeWind with another styling system unless requested.

NativeWind should scan all source files:

```js
content: ["./src/**/*.{js,jsx,ts,tsx}"]
```

## Config

Use `src/config/` for app-level configuration.

Examples:

```txt
src/config/env.ts
src/config/app.config.ts
```

Rules:

- Do not hardcode API base URLs across many files.
- Do not commit secrets into the mobile app.
- Store only public mobile configuration in the app.

## Import aliases

If path alias is configured, prefer clean imports:

```ts
import { Button } from "@/shared/components/Button";
```

If alias is not configured, use relative imports until alias configuration is confirmed.

## Architecture rules

- Follow the existing architecture.
- Keep screen UI in `src/app` readable and focused.
- Keep heavy logic out of `src/app`.
- Keep API calls out of UI screens.
- Keep business rules out of UI screens when possible.
- Prefer feature-based organization for logic.
- Use `shared` only for truly reusable code.
- Create folders only when needed.
- Use TypeScript types for important data.
- Use NativeWind consistently.
- Avoid over-engineering.
- Avoid large architecture changes unless explicitly requested.
- Do not add new dependencies unless necessary.
