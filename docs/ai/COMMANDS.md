# Commands

## Rule

Prefer commands already defined in `package.json`.

If a command below does not exist or does not work, inspect `package.json` first and use the correct project command.

## Package manager

Default package manager:

```bash
npm
```

Update this section later if the project uses:

```bash
yarn
pnpm
bun
```

## Install dependencies

```bash
npm install
```

## Start development server

```bash
npx expo start
```

## Run on Android

```bash
npx expo start --android
```

## Run on iOS

```bash
npx expo start --ios
```

## Run on web

```bash
npx expo start --web
```

## Typecheck

```bash
npx tsc --noEmit
```

## Lint

```bash
npm run lint
```

## Test

```bash
npm test
```

Only use this if the project has a test script.

## Build

Use the project-specific build command from `package.json` or Expo/EAS configuration.

Common examples:

```bash
npx expo export
```

```bash
eas build
```

Do not add or change build configuration unless the task requires it.

## Tailwind/NativeWind notes

If styling issues happen, inspect these files when they exist:

- `tailwind.config.js`
- `babel.config.js`
- `global.css`
- `nativewind-env.d.ts`
- `metro.config.js`

Do not modify Tailwind/NativeWind configuration unless the issue is related to styling setup.

## Notes

- Check `package.json` before assuming scripts.
- Do not add new scripts unless useful.
- Do not change dependency versions unless needed.