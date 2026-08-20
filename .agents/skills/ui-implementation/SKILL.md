# UI Implementation Skill

## Purpose

Use this skill when implementing UI screens or components for the TriageFlowOPD Patient Mobile App.

This skill is especially useful when working from Figma designs.

## When to use

Use this skill for tasks like:

- Build a screen from Figma
- Build a reusable UI component
- Implement bottom tab UI
- Match spacing, typography, layout, and visual hierarchy
- Create loading, empty, error, and success UI states
- Convert a visual design into React Native + NativeWind code

Examples:

```txt
Build the Home screen from Figma
Build the Phiếu khám tab UI
Build the QR checkpoint scan screen
Create a TicketCard component
Create a reusable Button component
```

## Required context

Before implementing UI, read:

```txt
AGENTS.md
docs/ai/ARCHITECTURE.md
docs/ai/CONVENTIONS.md
```

If the UI depends on project behavior or patient flow, also read:

```txt
docs/ai/PROJECT_CONTEXT.md
```

## Main rule

Screen UI may live directly inside `src/app`.

Repeated UI should move into feature components or shared components.

Use this structure:

```txt
src/app/       - route screens and main screen UI
src/features/  - feature-specific components and UI logic
src/shared/    - reusable UI components
```

## Route screen placement

Place tab screens in:

```txt
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

Place non-tab flow screens outside `(tabs)`.

Examples:

```txt
src/app/(patient)/visit/
src/app/(patient)/payment/
src/app/(patient)/care-options/
src/app/(patient)/notifications/
src/app/(patient)/journey/
```

## Component placement

Use feature components for UI that belongs to one feature.

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
src/shared/components/ErrorState.tsx
```

Do not move feature-specific UI into `shared` too early.

## Styling rules

Use NativeWind.

Prefer:

```tsx
<View className="flex-1 bg-white px-4">
```

Avoid large inline style objects unless needed for:

- Dynamic values
- Unsupported NativeWind styles
- Runtime-calculated layout

Keep class names readable.

Extract repeated UI patterns into components.

Do not replace NativeWind with another styling system unless explicitly requested.

## Language rules

User-facing text should be Vietnamese by default.

Examples:

```tsx
<Text>Phiếu khám</Text>
<Text>Đang tải dữ liệu...</Text>
<Text>Không có dữ liệu</Text>
```

Code, file names, variables, and types should use English.

## Figma rules

When using Figma:

- Match layout hierarchy first.
- Match spacing and alignment as closely as practical.
- Keep components reusable when the same pattern appears multiple times.
- Use Figma-exported SVG assets for icons and vector assets when possible.
- Use PNG or WebP for non-vector images such as banners or illustrations.

Do not add SVG or icon libraries without approval.

If SVG support requires new setup, explain the dependency and setup before implementation.

## Asset rules

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

Keep asset file names in English.

Examples:

```txt
home-icon.svg
ticket-icon.svg
hospital-banner.webp
```

## Data state UI

For screens that load backend data, provide UI states for:

- Loading
- Empty
- Error
- Success

Use shared components if they exist:

```txt
LoadingState
EmptyState
ErrorState
```

Do not leave screens blank during loading or error states.

## Accessibility and usability

Keep touch targets large enough for mobile use.

Avoid tiny text for important patient information.

Use clear labels.

Use visual hierarchy for important data such as:

- Queue number
- Room name
- Payment status
- Current step
- Next destination
- Master QR

## Patient app UI rules

The app is for patients.

UI should be:

- Clear
- Simple
- Mobile-friendly
- Easy to understand
- Safe for hospital context

Avoid overly technical wording in patient-facing UI.

## Ticket UI rules

The Ticket tab should be able to display:

- Digital examination ticket
- Master QR
- Queue number
- Current specialty or room
- Queue status
- Estimated waiting time
- Payment-gated visit status

Queue information belongs inside the Ticket tab.

## Scan UI rules

The Scan tab is for QR checkpoint scanning.

Do not design it as:

- CCCD/VNeID scanner
- General QR scanner for all use cases
- LLM triage screen

If camera/scanner dependency is needed, explain and ask before adding it.

## Navigation UI rules

The Navigation tab may use placeholder UI until map data format is confirmed.

Do not assume:

- Google Maps
- Mapbox
- Apple Maps
- Any third-party map provider

The hospital map is custom-built by the team.

## Payment UI rules

Payment UI may display:

- Invoice information
- Dynamic QR
- Payment status
- Payment result

Payment verification belongs to backend.

Mobile must not manually mark payment as `Paid`.

## Implementation checklist

Before finishing, check:

- Route files are in the correct `src/app` location.
- Repeated UI is extracted when useful.
- NativeWind is used consistently.
- Text is Vietnamese for users.
- File names are English.
- Loading, empty, and error states exist when needed.
- No new dependency was added without approval.
- UI does not introduce backend, LLM, payment, or map assumptions.

## Final response

After implementing UI, summarize:

- What UI was created
- Which files were created or edited
- Whether it follows Figma or placeholder design
- Any assets needed
- Any missing dependency or setup
- Any follow-up steps
