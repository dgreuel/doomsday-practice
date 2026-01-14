# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project overview

This is a small React + TypeScript + Vite single-page app that teaches and drills the Doomsday algorithm (Odd+11 method) for computing days of the week. All logic runs entirely in the browser; there is no backend.

## Common commands

All commands are intended to be run from the project root.

### Install dependencies
- `npm install`

### Development server
- `npm run dev`
  - Starts the Vite dev server for local development.

### Type-check and build
- `npm run build`
  - Runs TypeScript project builds (`tsc -b`) and then `vite build` to produce a production bundle.

### Linting
- `npm run lint`
  - Runs ESLint using the flat config in `eslint.config.js` over the repo (TypeScript + React Hooks + React Refresh rules).

### Preview production build
- `npm run preview`
  - Serves the built assets. Run `npm run build` first.

### Tests
- There is currently no test runner configured (no `npm test` script or test-related tooling). Running single tests is not applicable until a test framework (e.g. Vitest/Jest) is added.

## Architecture and code structure

### Tooling and configuration

- `vite.config.ts`
  - Vite configuration using `@vitejs/plugin-react`.
  - Custom `server.allowedHosts` is set to `["mbp"]` to allow that hostname during development.
- `tsconfig.app.json`
  - TypeScript compiler options for the browser app, in bundler mode with `strict` type-checking and JSX set to `react-jsx`.
  - Includes only `src`, so any new app code should live under `src/`.
- `tsconfig.node.json`
  - Narrow Node-side TypeScript config for Vite tooling, currently including only `vite.config.ts`.
- `eslint.config.js`
  - Flat ESLint config combining `@eslint/js`, `typescript-eslint`, `eslint-plugin-react-hooks`, and `eslint-plugin-react-refresh`.
  - Uses `globalIgnores(['dist'])` to avoid linting the build output.

### Runtime entrypoint

- `src/main.tsx`
  - React entrypoint that imports global styles (`index.css`) and the root `App` component.
  - Uses `createRoot` and wraps `<App />` in `React.StrictMode` before rendering into the `#root` element.
  - If you need to add global providers (e.g. context, theming), they should typically wrap `App` here.

### Core application logic (`src/App.tsx`)

All domain logic and UI for the trainer currently live in a single component file.

#### Doomsday algorithm helpers

Defined at the top of `App.tsx` as pure functions:
- `isLeapYear(year: number)` — Gregorian leap-year check.
- `getDoomsdayForMonth(month: number, year: number)` — Returns the doomsday date for a given month, handling January/February leap year adjustments.
- `getYearDoomsday(year: number)` — Implements the Odd+11 method for a year, returning both the numeric doomsday (0–6, mapped to days) and a `steps: string[]` explanation used for hints and solutions.
- `getDayOfWeek(month: number, day: number, year: number)` — Uses the year doomsday and that month’s doomsday date to compute the actual weekday for a specific date.
- `generateRandomDate(startYear, endYear)` — Generates random practice dates in the range 1900–2100 (defaults).
- `formatDate(month, day, year)` — Formats dates for display.

These helpers are reused across modes for both checking answers and generating explanations; if you add new features that need date calculations, prefer reusing or extracting these helpers rather than duplicating logic.

#### React state and modes

`App` manages all interactive state via React hooks:
- `mode: 'learn' | 'practice' | 'speed'` — Determines which screen and interaction pattern is active.
- `learnStep` (0–3) — Tracks which step of the instructional walkthrough is shown.
- `currentDate` — Target date the user must classify; created via `generateRandomDate`.
- `selectedDay`, `showAnswer` — Track the user’s chosen weekday and whether the correct answer and explanation are visible.
- `showHint` — Toggles an intermediate hint view (doomsday and Odd+11 steps) in practice mode.
- Performance tracking:
  - `streak`, `bestStreak` — Current correct-answer streak and all-time best.
  - `totalCorrect`, `totalAttempts` — Aggregate accuracy used for the summary stats bar.
  - `startTime`, `times` — Per-question timing data used only in speed mode (average/best times and solved-count).

`useEffect` hooks are used to:
- Initialize or reset the per-question timer when entering speed mode.
- Attach a `keydown` handler on `window` in practice/speed modes for keyboard shortcuts and clean it up on unmount or dependency changes.

#### Interaction model

- Mode selection is handled via a tab-like `<nav>` with buttons that set `mode` and, for practice/speed, call `nextQuestion` (and reset timing data for speed mode).
- In practice and speed modes:
  - The current date is displayed using `formatDate`.
  - Users answer by clicking one of seven weekday buttons or by pressing number keys `1`–`7` mapped to Sunday–Saturday.
  - Once an answer is chosen, the app reveals correctness, updates streaks and aggregates, and (in practice mode) shows a detailed step-by-step explanation including Odd+11 steps, the month’s doomsday date, and the offset.
  - A “Next Question” button advances to a new random date via `nextQuestion`.
- In learn mode:
  - A stepper-style UI (`learnStep`) walks through: century anchors, the Odd+11 method, the doomsday dates per month, and a worked example combining all steps.

### Layout and styling

- `src/App.css` and `src/index.css` contain all visual styling for the app, including layout (header/main/footer), the mode tabs, learning content, practice cards, stats bars, and button states (normal/correct/incorrect).
- The React markup in `App.tsx` relies on class names such as `app`, `mode-tabs`, `learn-section`, `practice-section`, `day-btn`, `answer-feedback`, `stats-bar`, etc.; adjust styles in these CSS files when changing structure or adding UI elements.

### Assets

- `src/assets/react.svg` is the standard Vite React logo. It is currently unused in the main app logic and can be removed or repurposed if desired.

### Extending the app

- If you start decomposing `App.tsx`, a common pattern is to move pure date/algorithm utilities into a separate module (for example, `src/lib/doomsday.ts`) and UI pieces into `src/components/` while keeping `App` as a composition/root container.
