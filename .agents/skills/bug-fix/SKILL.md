# Bug Fix Skill

## Purpose

Use this skill when fixing bugs, errors, broken behavior, or unexpected app issues in the TriageFlowOPD Patient Mobile App.

The goal is to make the smallest safe fix without changing unrelated code.

## When to use

Use this skill for tasks like:

- Fix Expo startup errors
- Fix route/navigation errors
- Fix broken screen rendering
- Fix NativeWind styling not applying
- Fix API integration errors
- Fix TypeScript errors
- Fix incorrect loading/error behavior
- Fix payment, ticket, scan, or navigation UI bugs

Examples:

```txt
Fix the Ticket screen crash
Fix route not found
Fix NativeWind className not working
Fix API call returning undefined
Fix QR scan screen permission issue
```

## Required context

Before fixing, read:

```txt
AGENTS.md
docs/ai/ARCHITECTURE.md
docs/ai/COMMANDS.md
docs/ai/CONVENTIONS.md
```

If the bug is related to project behavior or patient flow, also read:

```txt
docs/ai/PROJECT_CONTEXT.md
```

## Main rule

Fix the actual problem with the smallest safe change.

Do not refactor unrelated files.

Do not rename routes unless the bug is caused by route naming.

Do not add dependencies unless the fix truly requires it and the user approves.

## Debugging process

Before changing code:

- Identify the error message or broken behavior.
- Identify the likely file or feature involved.
- Check whether the issue is caused by route structure, imports, API data, styling, config, or dependency setup.
- Prefer reading nearby files before editing.
- Ask for missing logs, screenshots, or API responses if needed.

## Common issue areas

Check these first when relevant:

```txt
package.json
app.json or app.config.*
babel.config.js
tailwind.config.js
tsconfig.json
src/app/
src/features/
src/shared/
src/config/
```

## Expo issues

If Expo cannot start, check:

- `expo` exists in `dependencies`
- `node_modules` exists
- `package-lock.json` is consistent
- `main` is set to `expo-router/entry`
- route files exist under `src/app`

Useful commands are documented in:

```txt
docs/ai/COMMANDS.md
```

Do not invent commands.

Do not run reset commands unless the user explicitly asks.

## Route and navigation bugs

The project uses Expo Router.

Routes should live under:

```txt
src/app/
```

Use lowercase route names.

Use `.tsx` files for screens.

The 5 bottom tabs are:

```txt
home.tsx
ticket.tsx
scan.tsx
navigation.tsx
profile.tsx
```

Only these 5 screens should live directly inside `(patient)/(tabs)`.

When fixing route bugs:

- Check file names.
- Check route group names.
- Check `_layout.tsx` files.
- Check imports.
- Do not move routes without explaining why.

## NativeWind bugs

If NativeWind styles do not apply, check:

- `tailwind.config.js`
- content paths
- Babel setup
- NativeWind setup
- Whether the file is inside the scanned path

Recommended content setting:

```js
content: ["./src/**/*.{js,jsx,ts,tsx}"]
```

Do not replace NativeWind with another styling system.

## API bugs

The app uses Axios for API integration.

Do not call Axios directly inside screen files.

Preferred flow:

```txt
screen → feature hook → feature service → shared API client → backend API
```

When fixing API bugs, check:

- API base URL
- endpoint path
- request method
- request body
- response shape
- auth/session requirement
- error response shape

If API contract is unclear, ask before guessing.

The mobile app must not:

- Access the database directly
- Call the LLM API directly
- Process payment webhooks directly
- Sync directly with HIS or Mock-HIS

## TypeScript bugs

When fixing TypeScript issues:

- Prefer correct types over `any`.
- Keep feature-specific types in `src/features/<feature>/types/`.
- Keep shared types in `src/shared/types/`.
- Do not invent final API response fields if contracts are not confirmed.
- Use temporary types only when clearly marked.

## UI bugs

When fixing UI issues:

- Preserve the intended layout.
- Use NativeWind.
- Keep user-facing text in Vietnamese.
- Do not change visual design beyond the bug fix unless requested.
- Keep components small.
- Move repeated UI only if it clearly improves the fix.

## Payment bugs

Payment verification belongs to backend.

Mobile may display:

- Invoice
- Dynamic QR
- Payment status
- Payment result

Mobile must not:

- Manually mark payment as `Paid`
- Process payment webhooks
- Store payment secrets

If payment status is wrong, check backend response and frontend state handling first.

## Scan and navigation bugs

The Scan tab is for QR checkpoint scanning.

Do not assume CCCD/VNeID scanning unless explicitly requested.

Do not add camera, scanner, SVG, icon, or map libraries without approval.

The hospital map is custom-built by the team.

Do not assume Google Maps, Mapbox, Apple Maps, or another map provider.

## Dependency bugs

Before adding or changing a dependency, explain:

- Why it is needed
- What problem it solves
- Whether the project already has an alternative
- Setup steps required

Do not add dependencies without approval.

## Fix checklist

Before finishing, check:

- The fix is focused on the reported issue.
- No unrelated refactor was added.
- No route was renamed unnecessarily.
- No dependency was added without approval.
- API calls are not moved into screen files.
- NativeWind remains the styling approach.
- TypeScript types are not weakened unnecessarily.
- Patient Mobile App scope is preserved.

## Verification

When possible, suggest a command to verify the fix.

Use commands from:

```txt
docs/ai/COMMANDS.md
```

Examples:

```bash
npm start
npx expo start --clear
npm run lint
```

Only mention commands that are documented or available.

## Final response

After fixing, summarize:

- What the bug was
- What caused it, if known
- What files were changed
- How to verify the fix
- Any assumptions or missing information

If the root cause is unclear, say so honestly and explain the safest next step.
