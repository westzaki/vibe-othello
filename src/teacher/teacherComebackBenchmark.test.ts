import { describe, expect, it } from "vitest";
import { calculateAdvantage, chooseCpuMove } from "../cpu";
import {
  countDiscs,
  createInitialBoard,
  getLegalMoves,
  getNextDisc,
  getWinner,
  isGameOver,
  placeDisc,
  type Board,
  type DiscColor,
  type SquareIndex,
} from "../game/othello";
import { chooseTeacherGuidanceMove } from "./teacherGuidanceMove";

export type TeacherComebackBenchmarkPosition = {
  board: Board;
  currentDisc: DiscColor;
  moveCount: number;
};

export type TeacherComebackBenchmarkResult = {
  averageDiscDiff: number;
  averageFirstGuidanceTimeMs: number;
  draws: number;
  losses: number;
  timeoutCount: number;
  wins: number;
};

const benchmark =
  import.meta.env.VITE_TEACHER_COMEBACK_BENCHMARK === "1"
    ? describe
    : describe.skip;

benchmark("teacher comeback benchmark", () => {
  it("plays comeback guidance from slightly disadvantaged positions against level6", () => {
    const positions = generateDisadvantagedPositions(30);
    const result = summarizeBenchmarkResults(
      positions.map(playOutTeacherVsLevel6),
    );

    expect(positions.length).toBeGreaterThan(0);
    expect(result.wins + result.losses + result.draws).toBe(positions.length);
  });
});

export function generateDisadvantagedPositions(
  seedCount: number,
): TeacherComebackBenchmarkPosition[] {
  const positions: TeacherComebackBenchmarkPosition[] = [];

  for (let seed = 0; seed < seedCount; seed += 1) {
    let board = createInitialBoard();
    let currentDisc: DiscColor = "black";
    let passCount = 0;

    for (let moveCount = 0; moveCount < 28; moveCount += 1) {
      const legalMoves = getLegalMoves(board, currentDisc);

      if (legalMoves.length === 0) {
        passCount += 1;
        currentDisc = getNextDisc(currentDisc);

        if (passCount >= 2) {
          break;
        }

        continue;
      }

      passCount = 0;
      const move =
        currentDisc === "black"
          ? chooseSeededWeakerMove(legalMoves, seed + moveCount)
          : chooseCpuMove(board, currentDisc, "level6");

      if (move === null) {
        break;
      }

      board = placeDisc(board, move, currentDisc);
      currentDisc = getNextDisc(currentDisc);

      if (moveCount >= 8 && isSlightlyDisadvantaged(board, currentDisc)) {
        positions.push({
          board,
          currentDisc,
          moveCount: moveCount + 1,
        });
        break;
      }
    }
  }

  return positions;
}

export function playOutTeacherVsLevel6({
  board: initialBoard,
  currentDisc: initialDisc,
}: TeacherComebackBenchmarkPosition): {
  discDiff: number;
  firstGuidanceTimeMs: number;
  result: "win" | "loss" | "draw";
  timeoutCount: number;
} {
  let board = initialBoard;
  let currentDisc = initialDisc;
  let passCount = 0;
  let firstGuidanceTimeMs = 0;

  while (!isGameOver(board) && passCount < 2) {
    const legalMoves = getLegalMoves(board, currentDisc);

    if (legalMoves.length === 0) {
      passCount += 1;
      currentDisc = getNextDisc(currentDisc);
      continue;
    }

    passCount = 0;
    const move =
      currentDisc === initialDisc
        ? chooseTimedTeacherMove(board, currentDisc, (elapsedMs) => {
            if (firstGuidanceTimeMs === 0) {
              firstGuidanceTimeMs = elapsedMs;
            }
          })
        : chooseCpuMove(board, currentDisc, "level6");

    if (move === null) {
      break;
    }

    board = placeDisc(board, move, currentDisc);
    currentDisc = getNextDisc(currentDisc);
  }

  const counts = countDiscs(board);
  const opponentDisc = getNextDisc(initialDisc);
  const discDiff = counts[initialDisc] - counts[opponentDisc];
  const winner = getWinner(board);

  return {
    discDiff,
    firstGuidanceTimeMs,
    result:
      winner === "draw" ? "draw" : winner === initialDisc ? "win" : "loss",
    timeoutCount: 0,
  };
}

function summarizeBenchmarkResults(
  results: ReturnType<typeof playOutTeacherVsLevel6>[],
): TeacherComebackBenchmarkResult {
  const totalDiscDiff = results.reduce(
    (total, result) => total + result.discDiff,
    0,
  );
  const totalFirstGuidanceTime = results.reduce(
    (total, result) => total + result.firstGuidanceTimeMs,
    0,
  );

  return {
    averageDiscDiff: totalDiscDiff / results.length,
    averageFirstGuidanceTimeMs: totalFirstGuidanceTime / results.length,
    draws: results.filter((result) => result.result === "draw").length,
    losses: results.filter((result) => result.result === "loss").length,
    timeoutCount: results.reduce(
      (total, result) => total + result.timeoutCount,
      0,
    ),
    wins: results.filter((result) => result.result === "win").length,
  };
}

function chooseSeededWeakerMove(
  legalMoves: SquareIndex[],
  seed: number,
): SquareIndex {
  return legalMoves[seed % legalMoves.length];
}

function chooseTimedTeacherMove(
  board: Board,
  currentDisc: DiscColor,
  onElapsed: (elapsedMs: number) => void,
): SquareIndex | null {
  const startedAt = performance.now();
  const move = chooseTeacherGuidanceMove(board, currentDisc, {
    deepSearchDepth: 6,
    guidanceMode: "comeback",
    shallowSearchDepth: 3,
  });

  onElapsed(performance.now() - startedAt);

  return move;
}

function isSlightlyDisadvantaged(
  board: Board,
  currentDisc: DiscColor,
): boolean {
  const advantage = calculateAdvantage(board, currentDisc);
  const currentDiscPercent =
    currentDisc === "black" ? advantage.blackPercent : advantage.whitePercent;

  return currentDiscPercent >= 35 && currentDiscPercent <= 45;
}
