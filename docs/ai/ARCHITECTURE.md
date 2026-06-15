# Architecture

## Status

This architecture document is a starting template.

The real project structure should be documented after inspecting the codebase.

Do not assume architecture details that are not documented here or visible in the project.

## Tech stack

- React Native
- Expo
- TypeScript
- Tailwind/NativeWind

## Expected project areas

Depending on the actual project structure, the app may contain:

- Screens or routes
- Reusable components
- Hooks
- Services
- API logic
- Types
- Utilities
- Constants
- Assets
- Authentication logic
- State management
- Database or storage logic
- Tailwind/NativeWind configuration

## Folder structure

To be filled after reviewing the project.

Example structure only:

```txt
app/ or src/screens/     - Screens and routes
src/components/          - Reusable UI components
src/hooks/               - Reusable hooks
src/services/            - API and external service logic
src/types/               - Shared TypeScript types
src/utils/               - Helper functions
src/constants/           - Constants and configuration
assets/                  - Images, icons, fonts
```

If the real project does not use this structure, follow the real structure instead.

## Navigation

To be filled later.

Document whether the project uses:

- Expo Router
- React Navigation
- Another routing/navigation approach

Rules:

- Do not rename routes unless required.
- Do not change navigation behavior without explaining why.
- Follow the existing routing pattern.

## Styling

The project uses Tailwind/NativeWind if configured.

Rules:

- Prefer existing Tailwind/NativeWind class patterns.
- Do not replace Tailwind/NativeWind with another styling system unless explicitly asked.
- Keep class names readable.
- Extract repeated UI into reusable components when useful.
- Use theme tokens or shared constants if the project already defines them.

## Authentication

To be filled later.

Document:

- Login flow
- Register flow
- Logout flow
- Token/session storage
- Protected routes/screens

## API layer

To be filled later.

Rules:

- Keep API logic separate from UI when possible.
- Prefer service files for reusable API calls.
- Type API responses when possible.
- Handle loading, success, and error states clearly.

## State management

To be filled later.

Rules:

- Use local component state for simple UI state.
- Use hooks for reusable logic.
- Follow the existing state management approach.
- Do not introduce new state libraries unless necessary.

## Database / storage

To be filled later.

Document whether the project uses:

- Local storage
- AsyncStorage
- SQLite
- Firebase
- Supabase
- Custom backend
- Other storage/database

## Architecture rules

- Follow the existing architecture.
- Keep feature changes close to related files when the project is small.
- Extract reusable logic only when it improves clarity.
- Avoid large architecture changes unless explicitly requested.