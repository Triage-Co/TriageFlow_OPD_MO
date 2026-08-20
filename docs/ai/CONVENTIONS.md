# Conventions

## Status

This document defines coding conventions for the TriageFlowOPD Patient Mobile App.

Keep this file practical. It should help AI agents write consistent code without over-engineering.

Do not introduce new conventions unless they clearly improve the project.

## Tech stack

- React Native
- Expo
- Expo Router
- TypeScript
- NativeWind
- Axios for API client

## Language

User-facing text should be Vietnamese by default.

Examples:

```tsx
<Text>Phiếu khám</Text>
<Text>Đang tải dữ liệu...</Text>
<Text>Không có dữ liệu</Text>
```

Code, file names, variables, types, and functions should use English.

Examples:

```txt
ticket.tsx
TicketCard.tsx
useCurrentTicket.ts
PaymentStatus
QueueTicket
```

## File extensions

Use `.tsx` for:

- Screens
- React Native components

Use `.ts` for:

- Hooks
- Services
- Types
- Utilities
- Constants
- Config files

Do not use `.jsx` in this TypeScript project.

Use `.js` only when a tool or config file specifically requires it.

## File naming

Use lowercase route names in `src/app`.

Examples:

```txt
home.tsx
ticket.tsx
scan.tsx
navigation.tsx
profile.tsx
```

Use PascalCase for React components.

Examples:

```txt
TicketCard.tsx
MasterQrCard.tsx
LoadingState.tsx
```

Use camelCase for hooks and utilities.

Examples:

```txt
useCurrentTicket.ts
usePaymentStatus.ts
formatQueueNumber.ts
```

Use descriptive service file names.

Examples:

```txt
ticket.service.ts
payment.service.ts
scan.service.ts
```

Use descriptive type file names.

Examples:

```txt
ticket.types.ts
payment.types.ts
navigation.types.ts
```

## Folder conventions

Use this high-level structure:

```txt
src/app/       - routes and main screen UI
src/features/  - feature-specific code
src/shared/    - reusable shared code
src/config/    - app-level config
```

Main screen UI may live in `src/app`.

Feature logic should live in `src/features`.

Reusable UI and helpers should live in `src/shared`.

App-level configuration should live in `src/config`.

## Screen conventions

Screens in `src/app` should stay readable and focused.

Screens may contain:

- Layout
- UI composition
- NativeWind classes
- Calls to feature hooks
- Navigation actions

Screens should not contain:

- Raw API calls
- Large business logic
- Large mock data
- Payment verification
- LLM calls
- Database access
- Long type definitions
- Map pathfinding logic

## Component conventions

Use function components.

Prefer typed props.

Example:

```tsx
type TicketCardProps = {
  queueNumber: string;
  roomName: string;
};

export function TicketCard({ queueNumber, roomName }: TicketCardProps) {
  return null;
}
```

Keep components small.

Move repeated UI into feature components or shared components.

Do not put business logic inside shared UI components.

## Hook conventions

Use hooks for reusable UI or data logic.

Hook names must start with `use`.

Examples:

```txt
useCurrentTicket
usePaymentStatus
useCheckpointScanner
```

Feature-specific hooks should live in:

```txt
src/features/<feature>/hooks/
```

Reusable hooks should live in:

```txt
src/shared/hooks/
```

Do not place hooks directly in `src/app`.

## API conventions

Use Axios for API integration.

Create a shared Axios API client when API integration starts.

Recommended location:

```txt
src/shared/services/api-client.ts
```

Feature services should call the shared API client.

Recommended flow:

```txt
src/shared/services/api-client.ts
→ src/features/<feature>/services/<feature>.service.ts
→ src/features/<feature>/hooks/useSomething.ts
→ src/app/.../screen.tsx
```

Do not call Axios directly inside screen files.

The mobile app should call only the deployed TriageFlow Backend API.

The mobile app must not:

- Access the database directly
- Call the LLM API directly
- Process payment webhooks directly
- Sync directly with HIS or Mock-HIS

If an API endpoint or response contract is not confirmed, ask for it or use clearly marked temporary placeholder data.

## TypeScript conventions

Prefer explicit types for API data and important domain objects.

Feature-specific types should live in:

```txt
src/features/<feature>/types/
```

Shared types should live in:

```txt
src/shared/types/
```

Do not invent final API response fields if backend contracts are not confirmed.

Use temporary types only when clearly marked.

## Styling conventions

Use NativeWind for styling.

Prefer:

```tsx
<View className="flex-1 bg-white px-4">
```

Avoid large inline style objects unless needed for dynamic values or unsupported styling.

Keep class names readable.

Extract repeated UI patterns into components.

Do not replace NativeWind with another styling system unless explicitly requested.

NativeWind should scan the whole `src` folder:

```js
content: ["./src/**/*.{js,jsx,ts,tsx}"]
```

## Navigation conventions

Use Expo Router conventions.

Rules:

- Use lowercase route file names.
- Use route groups for organization.
- Keep only the 5 bottom tabs inside `(patient)/(tabs)`.
- Put non-tab flows outside `(tabs)`.
- Do not rename routes unless required.
- Do not change navigation behavior without explaining why.

The 5 bottom tabs are:

```txt
home.tsx
ticket.tsx
scan.tsx
navigation.tsx
profile.tsx
```

## Asset and icon conventions

Figma-exported SVG assets are preferred for icons and vector assets when possible.

Rules:

- Prefer SVG exports from Figma for icons.
- Keep asset names in English.
- Do not add SVG or icon libraries without approval.
- If SVG support requires new setup, explain the dependency and setup before implementation.
- Do not silently convert SVG icons to PNG unless requested.

For non-vector images such as banners or illustrations, PNG or WebP exports are acceptable.

Recommended asset folders:

```txt
assets/images/
assets/icons/
```

or, if the project later keeps assets under `src`:

```txt
src/shared/assets/images/
src/shared/assets/icons/
```

Follow the existing asset structure once it is established.

## Authentication conventions

Authentication details are not fully documented yet.

Use AsyncStorage for app session persistence when authentication is implemented.

Rules:

- Do not invent final auth flow without backend contract.
- Do not invent token refresh behavior without backend contract.
- Do not store backend secrets, LLM keys, payment secrets, or database credentials in the mobile app.
- Do not store more sensitive data than necessary.
- If AsyncStorage dependency/setup is missing, explain what is needed before implementation.

Document later:

- Login flow
- Register flow
- Logout flow
- Token/session storage details
- Protected routes/screens

## State management conventions

Use the simplest state management approach first.

Prefer:

- Local component state
- `useState`
- `useEffect`
- Custom hooks
- Feature hooks

Do not introduce Zustand, Redux, React Query, or another state library unless explicitly requested.

State management can be revisited later when the app has real complexity.

## Mock data conventions

Because the backend API is already deployed, prefer real API integration when endpoint contracts are available.

Use mock data only when:

- The endpoint is not ready
- The endpoint contract is not confirmed
- UI needs temporary placeholder data

Do not hardcode large mock data directly inside screens.

Prefer:

```txt
src/features/<feature>/mocks/
```

or:

```txt
src/features/<feature>/services/<feature>.mock.ts
```

Mock data should be typed and clearly marked as temporary.

## Loading and error states

For screens that load data, handle:

- Loading state
- Empty state
- Error state
- Success state

Use shared components when available:

```txt
LoadingState
EmptyState
ErrorState
```

Do not leave screens blank during loading or errors.

## Payment conventions

Mobile displays payment information from backend.

Mobile must not manually mark payment as `Paid`.

Payment verification belongs to backend.

Dynamic QR, invoice, and payment status should be handled through backend API responses.

## Scan and map conventions

The Scan tab is for QR checkpoint scanning.

Do not assume CCCD/VNeID scanning in the Scan tab unless explicitly requested.

The hospital map is custom-built by the team.

Do not assume Google Maps, Mapbox, Apple Maps, or another map provider.

Do not add map libraries unless explicitly approved.

Map data format is TBD.

Backend may provide GeoJSON or another route/map format later.

## Import conventions

If path alias is configured, prefer:

```ts
import { Button } from "@/shared/components/Button";
```

If alias is not configured, use relative imports.

Do not assume alias behavior if `tsconfig.json` does not define it.

## Dependency conventions

Do not add new dependencies without approval.

Before adding a dependency, explain:

- Why it is needed
- What problem it solves
- Whether the project already has an alternative
- Any setup steps required

This applies to dependencies such as:

- Axios
- AsyncStorage
- SVG libraries
- Icon libraries
- State management libraries
- Auth libraries
- Map libraries
- Notification libraries

## Comment conventions

Use comments only when they clarify non-obvious logic.

Do not comment obvious code.

Prefer readable code over excessive comments.

## AI agent rules

- Follow the existing project structure.
- Keep changes small and focused.
- Do not over-engineer.
- Do not move files unnecessarily.
- Do not rename routes without explaining why.
- Do not add dependencies without approval.
- Do not create all folders in advance.
- Ask when API contracts, auth behavior, payment behavior, asset setup, or map format are unclear.
