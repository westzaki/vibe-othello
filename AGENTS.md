# AGENTS.md

## Project Purpose

This project is for learning vibe-coding and modern React / TypeScript architecture by building a browser-based Othello/Reversi game.

The final goal is to build a polished, family-friendly browser Othello game with:

- 1P and 2P modes
- CPU opponents with multiple difficulty levels
- Teacher / coach review mode
- Useful learning feedback
- Cute, playful UI polish after the core features are stable

This is a learning project. The code should be easy to read, easy to modify, and useful for understanding good frontend architecture.

## Product Goal

Build a browser-based Othello/Reversi game.

Planned progression:

1. Human vs human playable game
2. Legal move highlighting
3. CPU opponent
4. Multiple CPU levels
5. Result phase that keeps the final board visible
6. Teacher / coach review mode
7. Sound toggle
8. Undo
9. Pass notice
10. CPU / review performance improvements
11. Final cute UI polish

## Incremental Development Rule

Work incrementally.

Do not try to build the final product in one step.

Each task should have a small, clearly defined scope.

Prefer one feature or one refactor per change.

Do not combine feature implementation and refactoring in the same step unless explicitly requested.

Do not implement future planned features unless explicitly requested.

When the user asks to start or continue, first propose the next small step and wait for approval before modifying files, unless the user explicitly asks to implement immediately.

For each implementation step:

- State the goal of the step
- State what will not be included in the step
- Change only the files needed for that step
- Run `npm run build`
- Run `npm test:run` if available
- Summarize the result

Examples of acceptable small steps:

- Add one screen or one screen transition
- Connect an existing review component to the UI
- Add one teacher review reason fix
- Add a sound on/off toggle
- Add one undo behavior
- Add one temporary pass notice
- Extract one CPU configuration module
- Add one small type/readability refactor

Examples of steps that are too large:

- Build the full Othello game with CPU
- Implement all CPU difficulty levels at once
- Redesign the whole UI while changing game logic
- Refactor CPU architecture and add new CPU strength at the same time
- Add teacher review analysis, UI, and Japanese messages all at once

## Repository / Git Rules

- Local git commits are allowed.
- Do not push to any remote repository.
- The user will handle all remote pushes manually.
- Do not create or modify remote configuration.
- Do not change repository ownership, visibility, or hosting settings.
- Keep changes logically small and easy to review.

## Tech Stack

- React
- TypeScript
- Vite
- npm
- CSS

Do not add new dependencies unless explicitly approved by the user.

Do not add React Router unless explicitly approved.

## Architecture Principles

The application should be designed so that the Othello domain logic can be reused outside React.

Separate the code into major areas:

1. React UI layer
2. Vanilla TypeScript Othello rules layer
3. Vanilla TypeScript session/game-flow layer
4. Vanilla TypeScript CPU / AI layer
5. Vanilla TypeScript teacher / coach review layer
6. UI-side audio and animation layer

The exact file structure does not need to be perfect from the beginning. Start simple, then refactor as responsibilities become clear.

## Dependency Direction

Keep dependency direction simple.

React UI and React hooks may import vanilla TypeScript game modules.

CPU logic may import Othello rules and reusable evaluation helpers.

Teacher / coach logic may import Othello rules, CPU evaluation helpers, and move history types.

Othello rules must not import React, React components, browser APIs, or DOM APIs.

CPU strategy and evaluation logic should not import React or React components.

The dependency direction should be:

```text
React UI / hooks -> game session
React UI / hooks -> CPU public API
React UI / hooks -> teacher review public API
CPU logic -> game rules
teacher logic -> game rules / CPU evaluation helpers
game rules -> no React, no browser APIs, no DOM dependencies
```

## Expected App Structure

The app is evolving into a small browser game with multiple screens and game phases.

Use this mental model:

- Start screen:
  - Choose 1P or 2P mode
  - In 1P mode, choose CPU level
  - In 1P mode, choose the human disc color: Black or White
  - If the human chooses Black, the human plays first
  - If the human chooses White, the CPU plays Black and moves first
- Game screen:
  - Contains both the active playing state and the completed result phase
  - The board should remain in the same central position when the game ends
  - Do not navigate to a separate result screen that hides or relocates the final board
- Review screen:
  - Shows teacher/coach review after a completed game
  - Uses completed game history
  - Should feel encouraging and educational

Major app-level screens should be:

```text
start -> game -> review
```

The completed result should be treated as a phase inside the Game screen, not as a separate app-level screen.