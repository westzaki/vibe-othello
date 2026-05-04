# Architecture

## Purpose

This document defines the architecture boundaries for Vibe Othello.

AGENTS.md defines durable development rules and should stay short.
Architecture-specific details should live in this document.

The goal is to keep the core game and CPU logic simple, reusable, and independent from React, browser APIs, and runtime-specific details such as Web Workers.

---

## Directory Responsibilities

```text
src/game/
  Othello rules, session state, player setup, and game-flow helpers.
  Must stay independent from React, DOM, browser APIs, and Web Workers.

src/cpu/
  Pure CPU move selection, evaluation, search, presets, and strategy code.
  Must stay independent from React, DOM, browser APIs, Web Workers, and UI state.

src/teacher/
  Review and coaching analysis.
  May use game rules and CPU evaluation/search helpers.
  Should expose public APIs for review screens.

src/hooks/
  React hooks that connect UI to game/session/services.

src/screens/
  App-level screens and screen-specific composition.
  Should avoid owning core game, CPU, or teacher logic.

src/components/
  Reusable UI components.

src/audio/
  UI-side sound integration.

src/services/
  App-facing orchestration services.
  May decide whether to call sync CPU logic or runtime-backed CPU execution.

src/workers/
  Worker-specific runtime code.
  Contains postMessage protocol, worker clients, and worker entrypoints.
```

---

## Dependency Direction

Preferred dependency direction:

```text
React UI / hooks -> game session
React UI / hooks -> services
React UI / hooks -> teacher public API

services -> cpu
services -> workers

workers -> cpu
workers -> game rules

CPU logic -> game rules
teacher logic -> game rules / CPU evaluation helpers

game rules -> no React, no browser APIs, no DOM, no workers
```

Avoid this:

```text
game -> React
game -> workers
cpu -> React
cpu -> workers
cpu -> screens
teacher -> screens
screens -> CPU private internals
```

---

## Game and Session Boundary

Game rules should remain reusable outside React.

`src/game/othello.ts` should contain pure Othello rules such as:

- legal move detection
- applying a move
- counting discs
- winner detection
- game-over detection

`src/game/session.ts` should own game-flow behavior such as:

- current disc
- move history
- pass handling
- completed / abandoned status
- practice session creation
- undo behavior

CPU and workers must not directly mutate React state or app screens.

CPU should choose a move.
Session should apply a move.

---

## CPU Boundary

CPU logic should remain a simple pure API:

```ts
chooseCpuMove(board, disc, level): SquareIndex | null
```

CPU may use:

- game rules
- evaluation helpers
- search algorithms
- CPU presets

CPU must not use:

- React
- hooks
- screens
- DOM APIs
- browser APIs
- Web Worker APIs
- postMessage
- requestId / timeout / cancellation protocol

Worker-related logic must not leak into `src/cpu`.

---

## Worker Boundary

Web Worker integration belongs outside `src/cpu` and `src/game`.

Use this structure:

```text
src/workers/cpuMove/
  cpuMove.worker.ts
  cpuMoveWorkerClient.ts
  cpuMoveWorkerProtocol.ts

src/services/
  cpuMoveService.ts
```

Worker-specific concerns include:

- `new Worker(...)`
- `postMessage`
- worker protocol types
- request IDs
- stale response handling
- timeout handling
- fallback behavior
- worker errors

These concerns should stay in `src/workers` or `src/services`.

The worker should only return a selected move:

```ts
SquareIndex | null
```

The worker must not return or mutate:

- GameSession
- moveHistory
- screen state
- sound state
- animation state
- review state

The normal CPU flow should be:

```text
useCpuTurn
  -> cpuMoveService.chooseCpuMoveAsync
      -> level 1-5: chooseCpuMove directly
      -> level 6: cpuMove worker
          -> chooseCpuMove
  -> placeCurrentDisc
      -> session applies the move
```

---

## Review and Practice Boundary

The completed match and practice session must remain separate.

Review uses completed game history.
Practice creates a new playable session from a board snapshot.

Practice must not mutate or overwrite the completed match.

Recommended flow:

```text
completed game
  -> review screen
      -> select reviewed move
          -> create practice options from board snapshot
              -> start separate practice session
```

---

## App Screen Model

Major app-level screens:

```text
start -> game -> review -> practice
```

Important distinction:

- result is a phase inside the Game screen
- practice is a separate app-level screen/session

The final board should remain visible in the game result phase.
Review should inspect completed move history.
Practice should use a separate session.
