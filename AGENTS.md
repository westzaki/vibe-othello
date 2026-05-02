# AGENTS.md

## Project Purpose

This project is for learning vibe-coding and modern React / TypeScript architecture by building a browser-based Othello/Reversi game.

The final goal is to build a playable browser Othello game with CPU opponents, including increasingly stronger CPU logic over time.

This is a learning project. The code should be easy to read, easy to modify, and useful for understanding good frontend architecture.

## Product Goal

Build a browser-based Othello/Reversi game.

Planned progression:

1. Human vs human playable game
2. Legal move highlighting
3. Random CPU opponent
4. Heuristic CPU opponent
5. Minimax CPU opponent
6. Alpha-beta pruning
7. UI/UX polish
8. Optional features such as move history, undo, difficulty selection, and analysis mode

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
- Summarize the result

Examples of acceptable small steps:

- Render an empty 8x8 board
- Add the initial four discs
- Add basic click handling
- Implement legal move detection
- Implement disc flipping
- Show the current player
- Show valid move hints
- Add pass handling
- Add game-over detection
- Add random CPU

Examples of steps that are too large:

- Build the full Othello game with CPU
- Implement all CPU difficulty levels
- Refactor the full architecture and add features at the same time
- Add UI polish while changing game rules

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

Do not add new dependencies unless explicitly approved by the user.

## Architecture Principles

The application should be designed so that the Othello domain logic can be reused outside React.

Separate the code into three major areas over time:

1. React UI layer
2. Vanilla TypeScript Othello rules layer
3. Vanilla TypeScript CPU / AI layer

The exact file structure does not need to be perfect from the beginning. Start simple, then refactor as responsibilities become clear.

## Dependency Direction

Keep dependency direction simple.

React UI and React hooks may import vanilla TypeScript game modules.

CPU logic may import Othello rules.

Othello rules must not import React, React components, browser APIs, or DOM APIs.

The dependency direction should be:

```text
React UI / hooks -> game rules
React UI / hooks -> CPU logic
CPU logic -> game rules
game rules -> no React, no browser APIs, no DOM dependencies