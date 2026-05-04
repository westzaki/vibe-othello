# AGENTS.md

## Project Purpose

This project is for learning vibe-coding and modern React / TypeScript architecture by building a browser-based Othello/Reversi game.

The product goal is to create a polished, family-friendly browser Othello game where elementary upper-grade to junior high school beginners can enjoy playing while getting better at actually winning.

The game should help players improve through:

- 1P and 2P modes
- CPU opponents with multiple difficulty levels
- In-game coaching hints
- Teacher / coach review mode
- Practice from reviewed positions
- Useful learning feedback
- Soft, playful UI polish after the core features are stable

This is both a learning project and a product design project. The code should be easy to read, easy to modify, and useful for understanding good frontend architecture, while feature decisions should support the product vision.

## Product Design References

The product vision, coach persona, and learning design are defined in:

- docs/product-vision.md
- docs/coach-persona.md
- docs/learning-design.md

All product, UI, coaching, review, practice, and learning-related changes must align with these documents.

If a proposed change does not clearly support:

- helping the player win
- improving understanding
- maintaining a fun and light experience
- making the player feel "I can win next time"

then it should be reconsidered or split into a smaller step.

Do not duplicate the full contents of these documents in AGENTS.md.

Use AGENTS.md for durable development rules and use the docs files for product-specific design details.

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

## Repository / Git / Pull Request Rules

Work should be done through pull requests.

For code, documentation, or configuration changes, prefer this flow:

1. Start from the latest main
2. Create a new work branch
3. Make changes in a meaningful unit
4. Make small, clear local commits
5. Run verification commands
6. Push the work branch to the remote repository using local git
7. Create a GitHub pull request targeting main using GitHub CLI (gh)
8. Stop and wait for the user to review and merge

For parallel Codex work on this repository, use Codex App Worktree mode instead of Local mode.

Use one Codex thread = one worktree = one branch.

Do not run multiple Codex threads in Local mode on the same repository checkout.

If the current worktree, branch, or git status is unexpected, stop and report it before editing files.

After the pull request is merged or the task is abandoned, remove the temporary worktree.

Before creating a work branch, make sure local main is up to date with origin/main.

Preferred branch start flow:

- git status
- git switch main
- git fetch origin
- git pull --ff-only origin main
- git switch -c <branch-name>

The agent must not discard, overwrite, stash, reset, or revert user changes unless explicitly requested by the user.

If there are uncommitted local changes, stop and report them instead of overwriting them.

If git pull --ff-only fails, stop and report the issue instead of forcing the update.

Use local git and GitHub CLI (gh) for branch push and pull request creation.

Do not rely on the ChatGPT GitHub connector or GitHub integration to create branches, update files, push commits, or open pull requests.

The GitHub connector may be used for reading repository files, inspecting pull requests, or reviewing diffs, but write operations should be done through local git and gh.

Before pushing a branch or creating a pull request, verify GitHub CLI authentication:

- gh auth status

If gh auth status reports an authentication problem, stop and report it to the user.

Do not attempt to create a pull request until GitHub CLI authentication is working.

Preferred pull request creation flow:

- git push -u origin <branch-name>
- gh pr create --base main --head <branch-name> --title "<title>" --body-file <body-file>

Use the repository pull request template when creating pull requests.

If .github/pull_request_template.md exists, create a pull request body file based on that template and pass it with --body-file.

Pull request descriptions must be written in Japanese unless the user requests otherwise.

The agent may push feature, refactor, fix, CI, or documentation branches to the remote repository only for the purpose of creating pull requests.

The agent must not:

- Push directly to main
- Merge pull requests
- Squash and merge pull requests
- Rebase or force-push shared branches unless explicitly requested
- Delete remote branches unless explicitly requested
- Change remote configuration
- Change repository ownership, visibility, or hosting settings
- Change GitHub repository settings unless explicitly requested
- Use GitHub connector write actions for creating branches, updating files, pushing commits, creating pull requests, or merging pull requests

If a push reports “Bypassed rule violations” for main, treat it as a mistake and stop.

Do not rely on bypass permissions.

All changes must go through pull requests unless the user explicitly requests otherwise.

Pull requests should be created in meaningful units.

Prefer one pull request for one purpose, such as:

- One feature
- One bounded refactor
- One bug fix
- One CI/workflow change
- One documentation update
- One test improvement

Avoid mixing unrelated changes in the same pull request.

If a requested task becomes too large, split it into multiple pull requests and explain the proposed split.

Branch names should be clear and scoped.

Examples:

- feature/teacher-review-turning-points
- feature/settings-screen
- refactor/architecture-sweep-1
- refactor/review-boundaries
- fix/review-playback-practice-start
- ci/add-github-actions
- docs/update-agents-pr-rules

Commit messages should be clear and meaningful.

Prefer conventional-style commit messages such as:

- feat(review): add turning point analysis
- refactor(hooks): gate game effects by enabled option
- refactor(game): extract practice session helpers
- fix(review): correct practice start position
- ci(actions): add pull request checks
- docs(agents): update pull request rules

Pull request titles should be clear and concise.

Before creating a pull request, run:

- npm run build
- npm run lint
- npm run test:run

If any verification command fails, do not hide the failure.

Report:

- Which command failed
- The relevant error summary
- Whether a fix was attempted
- What remains unresolved

Do not create a pull request with failing checks unless the user explicitly asks for a draft or work-in-progress pull request.

If creating a draft or work-in-progress pull request, clearly mark it as such in the title and description.

The user will review and merge pull requests manually, usually with Squash and merge.

The agent must stop after creating the pull request and must not merge it.

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
  - The completed result should be treated as a phase inside the Game screen, not as a separate app-level screen

- Review screen:
  - Shows teacher/coach review after a completed game
  - Uses completed game history
  - Should feel encouraging and educational
  - Allows move playback and board inspection
  - Selecting reviewed moves should not mutate the completed game session

- Practice screen:
  - Allows the user to restart from a reviewed position
  - Uses a separate practice game session
  - Must not mutate or overwrite the completed match being reviewed
  - Should allow returning to the Review screen when appropriate

Major app-level screens should be:
```text
start -> game -> review -> practice
```
Important distinction:

- result = a phase inside Game screen
- practice = a separate app-level screen/session

The completed match and the practice session should be kept separate.

Practice mode should start from a reviewed position by creating a new playable session from a board snapshot, such as `boardBefore`, instead of rewinding or mutating the completed match.