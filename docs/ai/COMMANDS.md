# Commands

## Status

This document lists the project commands that AI agents should use for the TriageFlowOPD Patient Mobile App.

Do not invent commands that are not available in `package.json`.

If a command is missing, explain it before suggesting changes.

## Package manager

Use npm by default.

```bash
npm install
```

## Main commands

Start the Expo development server:

```bash
npm start
```

Start with a cleared Expo cache:

```bash
npx expo start --clear
```

Run on Android:

```bash
npm run android
```

Run on iOS:

```bash
npm run ios
```

Run on web:

```bash
npm run web
```

Run lint:

```bash
npm run lint
```

## Current package scripts

The current `package.json` includes:

```json
{
  "start": "expo start",
  "android": "expo start --android",
  "ios": "expo start --ios",
  "web": "expo start --web",
  "lint": "expo lint",
  "reset-project": "node ./scripts/reset-project.js"
}
```

## Reset project warning

Do not run:

```bash
npm run reset-project
```

unless `scripts/reset-project.js` exists.

The project was reset earlier and the `scripts/` folder may no longer exist.

If the reset script is missing, either remove the script from `package.json` or avoid using it.

## Dependency checks

Check installed Expo version:

```bash
npm ls expo
```

Check installed React Native version:

```bash
npm ls react-native
```

Check NativeWind installation:

```bash
npm ls nativewind
```

## When Expo cannot be found

If the terminal shows an error like:

```txt
Unable to find expo in this project
```

try:

```bash
npm install
npx expo start --clear
```

If it still fails, check that `expo` exists in `dependencies`.

## NativeWind config check

NativeWind should scan the whole `src` folder.

Recommended `tailwind.config.js` content setting:

```js
content: ["./src/**/*.{js,jsx,ts,tsx}"]
```

## TypeScript

No dedicated TypeScript check command is currently documented.

If a type-check script is added later, document it here.

Possible future script:

```json
"typecheck": "tsc --noEmit"
```

Do not assume this command exists until it is added to `package.json`.

## Tests

No test command is currently documented.

Do not run or invent test commands unless testing tools are added to the project.

If tests are added later, document the exact command here.

## Build commands

No production build command is currently documented.

Do not invent EAS build commands unless EAS is configured in the project.

If EAS is added later, document the exact commands here.

## Command rules for AI agents

- Prefer commands already defined in `package.json`.
- Do not add new scripts unless explicitly requested.
- Do not add new dependencies just to run a command.
- Do not run destructive commands without warning.
- Do not run reset commands unless the user explicitly asks.
- If a command fails, explain the likely reason and suggest the smallest safe fix.
