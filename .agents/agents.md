# Agents

## Purpose

This file describes the main AI agent roles used in this project.

Use it to choose the right working mode before implementing, fixing, reviewing, or refactoring code.

Keep this file short. Detailed instructions live in each skill file.

## Required context

Before doing meaningful work, agents should follow the root rules in:

```txt
AGENTS.md
```

When relevant, also read:

```txt
docs/ai/PROJECT_CONTEXT.md
docs/ai/ARCHITECTURE.md
docs/ai/COMMANDS.md
docs/ai/CONVENTIONS.md
```

## Agent selection

Use this priority when the task is unclear:

```txt
UI from Figma or visual design       → UI Implementation Agent
New feature or patient flow          → Feature Build Agent
Bug, error, crash, broken behavior   → Bug Fix Agent
Clean up existing code               → Refactor Agent
Review or check code quality         → Code Review Agent
```

If a task mixes multiple types, choose the main task first.

Example:

```txt
Build Phiếu khám UI and connect API
→ Feature Build Agent first
→ UI Implementation rules when writing UI
```

## Shared rules for all agents

All agents must:

- Stay within the Patient Mobile App scope.
- Follow the documented folder structure.
- Keep screen UI in `src/app`.
- Keep feature logic in `src/features`.
- Keep reusable code in `src/shared`.
- Keep config in `src/config`.
- Use TypeScript.
- Use NativeWind.
- Use Vietnamese for user-facing text.
- Use English for code, file names, variables, and types.
- Ask when API contracts, auth behavior, payment behavior, asset setup, or map format are unclear.
- Ask before adding dependencies.
- Avoid over-engineering.

All agents must not:

- Implement staff/admin modules unless requested.
- Call the database directly from mobile.
- Call the LLM directly from mobile.
- Process payment webhooks in mobile.
- Add map providers without approval.
- Create a different architecture without explaining why.

## Feature Build Agent

Use for:

- Building a new feature
- Building a new patient flow
- Connecting UI with feature hooks/services
- Adding new routes that belong to the agreed app structure

Skill file:

```txt
.agents/skills/feature-build/SKILL.md
```

Main responsibilities:

- Understand the requested patient feature.
- Check the correct route and feature folder.
- Create only the files needed for the feature.
- Keep UI, logic, services, and types separated.
- Ask for missing API contracts before final integration.

## UI Implementation Agent

Use for:

- Implementing screens from Figma
- Creating screen layouts
- Creating reusable UI components
- Matching spacing, hierarchy, typography, and states

Skill file:

```txt
.agents/skills/ui-implementation/SKILL.md
```

Main responsibilities:

- Put route screen UI in `src/app`.
- Move repeated UI into feature or shared components.
- Use NativeWind.
- Use Figma-exported SVG assets when approved/available.
- Do not add SVG or icon libraries without approval.
- Handle loading, empty, and error states when data is involved.

## Bug Fix Agent

Use for:

- Runtime errors
- Broken navigation
- Incorrect UI behavior
- API integration bugs
- NativeWind styling issues
- Expo or dependency issues

Skill file:

```txt
.agents/skills/bug-fix/SKILL.md
```

Main responsibilities:

- Reproduce or identify the likely cause.
- Make the smallest safe fix.
- Avoid unrelated refactors.
- Explain the root cause when known.
- Mention any command that should be run to verify the fix.

## Refactor Agent

Use for:

- Cleaning messy code
- Moving logic out of screens
- Extracting reusable components
- Improving naming or organization
- Reducing duplication without changing behavior

Skill file:

```txt
.agents/skills/refactor/SKILL.md
```

Main responsibilities:

- Preserve behavior.
- Keep changes focused.
- Do not rename routes unless required.
- Do not change API contracts.
- Do not add dependencies.
- Explain what was moved or simplified.

## Code Review Agent

Use for:

- Reviewing code quality
- Checking architecture alignment
- Checking TypeScript and NativeWind usage
- Finding bugs or risky assumptions
- Reviewing before merge or submission

Skill file:

```txt
.agents/skills/code-review/SKILL.md
```

Main responsibilities:

- Point out issues clearly.
- Prioritize important problems first.
- Check against `AGENTS.md`, `ARCHITECTURE.md`, and `CONVENTIONS.md`.
- Suggest fixes without rewriting everything unless requested.
- Mention unclear assumptions.

## Final response expectations

After making changes, agents should summarize:

- What was changed
- Which files were created or edited
- Any assumptions made
- Any follow-up steps needed

For review-only tasks, agents should summarize:

- Critical issues
- Suggested improvements
- Questions or missing information
