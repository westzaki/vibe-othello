# Learning Fixture Validation

## Purpose

This document explains how Vibe Othello validates in-game hints and review analysis against beginner-to-intermediate Othello learning themes.

The goal is not to test advanced openings, deep parity theory, or professional-level perfect play.
The goal is to keep the app aligned with the learning design:

- notice corners
- avoid giving away corners
- treat X/C squares near open corners with care
- value mobility over early disc count
- help the player find one useful thing to try next

## Source Themes

The current fixture themes come from ideas repeated across beginner-friendly Othello strategy material:

- World Othello Federation, `Othello: From Beginner to Master`
  - https://www.worldothello.org/download_file/view/58058c57-3cc5-409e-8cac-8d1cdb18360b/590
- Nederlandse Othello Vereniging strategy guide
  - https://www.othello.nl/content/guides/comteguide/strategy.html
- Reversi strategy guide documentation
  - https://documentation.help/Reversi-Rules/strategy.htm

These sources consistently support the same intermediate learning targets:

- corners are valuable because corner discs are stable
- X-squares and C-squares near open corners are risky
- mobility is a core skill because low mobility can force bad moves
- taking many discs early is often less important than keeping good choices

## Test Strategy

The fixture tests live in:

- `src/teacher/learningFixtures.ts`
- `src/teacher/learningFixtures.test.ts`

The first pack contains 32 fixtures: four curated seed positions expanded through the eight board symmetries.
This checks the same source-backed learning principles across different corners, edges, and orientations without adding unclear advanced positions.

Each fixture defines:

- the board
- the side to move
- the learning theme
- the source-backed principle being exercised
- the square being validated
- expected candidate reasons
- expected play coach hints
- expected shape signals
- expected review classification when applicable

This lets future changes to hint, shape, and review logic fail loudly when they drift away from the product's learning goals.

The fixtures do not use AI output as the source of truth.
Search scores and candidate ordering may help the app explain a position, but fixture correctness should be based on documented learning principles such as corner stability, open-corner adjacent risk, and mobility quality.

## Scope

These fixtures are intentionally small and curated.

They are not a full game database, opening book, or engine benchmark.
When adding a fixture, prefer a position that teaches one clear concept over a position that requires deep calculation.
