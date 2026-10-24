# Kanban MVP Implementation Plan

## Summary

Build a polished, client-rendered Next.js app in `frontend`, following the project’s requirements. Use the selected light workspace style and dialog-based card creation.

The finished app will have one board, five renameable columns, draggable cards, add/delete actions, and realistic sample data. All changes reset on reload.

## 1. Scaffold and test foundation

- [x] Create the app with the latest stable Next.js, React, TypeScript, Tailwind CSS, and ESLint. Use npm and commit the lockfile.
- [x] Add current `@dnd-kit/react` for drag and drop, Radix Dialog for accessible dialogs, and Lucide for icons. Follow the current [Next.js installation guidance](https://nextjs.org/docs/app/getting-started/installation) and [dnd-kit React API](https://dndkit.com/react/quickstart/).
- [x] Configure Vitest, React Testing Library, user-event, Happy DOM, V8 coverage, and Playwright. Happy DOM supports the installed Node 22.15 runtime.
- [x] Add scripts for development, linting, type checking, unit tests, coverage, browser tests, production build, and production start.
- [x] Add `.gitignore` entries for dependencies, build output, coverage, browser reports, and local environment files.
- [x] Keep the README minimal: setup, run, test, and reset-on-reload behavior. Save this plan under `docs/superpowers/plans/2026-10-24-kanban-mvp.md` when implementation begins.

**Success criteria:** The app starts, the test runners execute a smoke test, and generated files are ignored.

## 2. Board state and behavior

- [x] Model cards as `{ id, title, details }` and columns as `{ id, title, cards }`. Keep an ordered array of exactly five columns in a local React reducer.
- [x] Implement immutable actions for adding a card, deleting a card, renaming a column, and moving a card to a destination column and index.
- [x] Initialize ten sample cards across **Backlog**, **To do**, **In progress**, **In review**, and **Done**, using stable seed IDs.
- [x] Generate new card IDs on submission. Require a nonblank title; details are optional plain text.
- [x] Append newly created cards to the selected column. Delete cards immediately through a labeled button.
- [x] Rename columns inline: Enter or blur saves a trimmed nonblank name; Escape or a blank value restores the previous name.

**Success criteria:** Unit tests verify every action, unchanged card content during moves, stable column identities, ordering, and immutable updates. All board-state branches are covered.

## 3. Interface and interactions

- [x] Build a compact header above five column panels. Use white cards, subtle borders and shadows, generous spacing, and clear typography.
- [x] Apply the specified palette: navy headings, purple submit buttons, blue focus and drag highlights, yellow accent lines, and gray supporting text. Use darker supporting text where necessary for readable contrast.
- [x] Fit all columns across a wide desktop viewport. On smaller screens, preserve the board layout with horizontal scrolling and usable column widths.
- [x] Give each column a card count and Add card button. The dialog contains labeled title/details fields, validation feedback, Cancel, and Add card actions.
- [x] Preserve multiline details and wrap long text without breaking the layout.
- [x] Support moving cards between columns, reordering within a column, and dropping into empty columns. Keep column positions fixed.
- [x] Use a dedicated drag handle, visible drop feedback, keyboard dragging, touch support, and screen-reader announcements. Canceled drags and drops outside valid targets restore the original position.
- [x] Provide visible focus states, dialog focus management, and reduced-motion support.

**Success criteria:** Component tests cover creation, validation, cancellation, deletion, renaming, counts, and empty columns. Browser checks confirm usable pointer, keyboard, and touch interactions.

## 4. Integration testing and handoff

- [x] Run Playwright against the production build in Chromium, Firefox, and WebKit.
- [x] Test initial data; adding cards to each column; optional details; blank-title rejection; deletion; rename save/cancel; and reload resetting all changes.
- [x] Test cross-column dragging, same-column reordering, empty destinations, canceled drags, and repeated moves without lost or duplicated cards.
- [x] Check desktop, tablet, and phone layouts, including horizontal scrolling and touch dragging.
- [x] Inspect screenshots for spacing, contrast, long content, empty states, and dialogs. Fix defects and rerun affected checks.
- [x] Require passing lint, TypeScript, unit/component tests, coverage, browser tests, and production build. Set component coverage minimums to 90% statements/lines/functions and 85% branches.
- [x] Finish with the development server running and verify the board loads. Report its URL and the completed checks.

**Success criteria:** All checks pass, browser runs have no application or hydration errors, and the user can immediately use the running MVP.

## Assumptions and boundaries

- The board title is **Project board**.
- Existing cards are not editable; the requested card operations are creation, movement, and deletion.
- No backend, persistence, authentication, additional boards, archive, search, filters, labels, priorities, or due dates.
- No public API is introduced. State types and reducer actions remain internal.
- Keep all project work and test artifacts in persistent project storage outside `/tmp`.

## Completion record

- Implemented in `frontend` on branch `feat/kanban-mvp`.
- Verified: lint, TypeScript, production build, 35 unit/component tests, and 51 Playwright scenarios across Chromium, Firefox, WebKit, phone, and tablet.
- Coverage: 100% statements, lines, and functions; 98.48% branches; board-state coverage is 100% in every metric.
- Independent review findings fixed: meaningful drag announcements and natural Tab focus after column renaming.
- TypeScript 6 and ESLint 9 are the latest compatible majors for the installed Next.js lint dependencies.
- Development server running at http://localhost:3000. Card creation and reset on reload were also checked against this server.
