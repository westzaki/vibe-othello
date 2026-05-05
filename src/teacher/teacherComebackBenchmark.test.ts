import { describe, expect, it } from "vitest";
import { calculateAdvantage, chooseCpuMove } from "../cpu";
import {
  countDiscs,
  createInitialBoard,
  getLegalMoves,
  getNextDisc,
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
  seed: number;
};

export type TeacherComebackFirstResponseResult = {
  advantageAfterLevel6Reply: number;
  advantageAfterTeacherMove: number;
  advantageBefore: number;
  discDiffAfterLevel6Reply: number;
  firstGuidanceTimeMs: number;
  level6Reply: SquareIndex | null;
  level6ReplyTimeMs: number;
  moveCount: number;
  seed: number;
  teacherMove: SquareIndex | null;
};

export type TeacherComebackFirstResponseSummary = {
  averageAdvantageSwingAfterReply: number;
  averageDiscDiffAfterReply: number;
  averageFirstGuidanceTimeMs: number;
  averageLevel6ReplyTimeMs: number;
  improvedOrHeldCount: number;
  level6NullReplyCount: number;
  positionCount: number;
  teacherNullMoveCount: number;
  worsenedCount: number;
};

const benchmark =
  import.meta.env.VITE_TEACHER_COMEBACK_BENCHMARK === "1"
    ? describe
    : describe.skip;
const fixedBenchmarkPositionCount = 30;
const fixedBenchmarkSeeds = Array.from({ length: 120 }, (_, seed) => seed);

describe("teacher comeback benchmark fixtures", () => {
  it("keeps a fixed pack of slightly disadvantaged positions", () => {
    const positions = getTeacherComebackBenchmarkPositions();

    expect(positions).toHaveLength(fixedBenchmarkPositionCount);

    for (const position of positions) {
      const advantagePercent = getAdvantagePercent(
        position.board,
        position.currentDisc,
      );

      expect(position.moveCount).toBeGreaterThanOrEqual(9);
      expect(getLegalMoves(position.board, position.currentDisc).length).toBeGreaterThan(
        0,
      );
      expect(advantagePercent).toBeGreaterThanOrEqual(35);
      expect(advantagePercent).toBeLessThanOrEqual(45);
    }
  });
});

benchmark("teacher comeback benchmark", () => {
  it(
    "measures Teacher first response against Level 6 on fixed positions",
    () => {
      const limit = getBenchmarkLimit();
      const positions = getTeacherComebackBenchmarkPositions().slice(0, limit);
      const results = positions.map(playTeacherFirstResponseAgainstLevel6);
      const summary = summarizeFirstResponseResults(results);

      console.info(
        [
          "Teacher comeback first-response benchmark",
          JSON.stringify(summary, null, 2),
        ].join("\n"),
      );

      expect(summary.positionCount).toBe(positions.length);
      expect(summary.teacherNullMoveCount).toBe(0);
    },
    60_000,
  );
});

export function getTeacherComebackBenchmarkPositions(): TeacherComebackBenchmarkPosition[] {
  const positions: TeacherComebackBenchmarkPosition[] = [];

  for (const seed of fixedBenchmarkSeeds) {
    const position = createSeededDisadvantagedPosition(seed);

    if (position === null) {
      continue;
    }

    positions.push(position);

    if (positions.length >= fixedBenchmarkPositionCount) {
      break;
    }
  }

  return positions;
}

export function playTeacherFirstResponseAgainstLevel6({
  board,
  currentDisc,
  moveCount,
  seed,
}: TeacherComebackBenchmarkPosition): TeacherComebackFirstResponseResult {
  const advantageBefore = getAdvantagePercent(board, currentDisc);
  const teacherStartedAt = performance.now();
  const teacherMove = chooseTeacherGuidanceMove(board, currentDisc, {
    deepSearchDepth: 6,
    guidanceMode: "comeback",
    shallowSearchDepth: 3,
  });
  const firstGuidanceTimeMs = performance.now() - teacherStartedAt;
  const boardAfterTeacher =
    teacherMove === null ? board : placeDisc(board, teacherMove, currentDisc);
  const advantageAfterTeacherMove = getAdvantagePercent(
    boardAfterTeacher,
    currentDisc,
  );
  const opponentDisc = getNextDisc(currentDisc);
  const level6StartedAt = performance.now();
  const level6Reply =
    getLegalMoves(boardAfterTeacher, opponentDisc).length === 0
      ? null
      : chooseCpuMove(boardAfterTeacher, opponentDisc, "level6");
  const level6ReplyTimeMs = performance.now() - level6StartedAt;
  const boardAfterLevel6Reply =
    level6Reply === null
      ? boardAfterTeacher
      : placeDisc(boardAfterTeacher, level6Reply, opponentDisc);
  const countsAfterReply = countDiscs(boardAfterLevel6Reply);

  return {
    advantageAfterLevel6Reply: getAdvantagePercent(
      boardAfterLevel6Reply,
      currentDisc,
    ),
    advantageAfterTeacherMove,
    advantageBefore,
    discDiffAfterLevel6Reply:
      countsAfterReply[currentDisc] - countsAfterReply[opponentDisc],
    firstGuidanceTimeMs,
    level6Reply,
    level6ReplyTimeMs,
    moveCount,
    seed,
    teacherMove,
  };
}

export function summarizeFirstResponseResults(
  results: TeacherComebackFirstResponseResult[],
): TeacherComebackFirstResponseSummary {
  const totalAdvantageSwingAfterReply = results.reduce(
    (total, result) =>
      total + result.advantageAfterLevel6Reply - result.advantageBefore,
    0,
  );
  const totalDiscDiffAfterReply = results.reduce(
    (total, result) => total + result.discDiffAfterLevel6Reply,
    0,
  );
  const totalFirstGuidanceTime = results.reduce(
    (total, result) => total + result.firstGuidanceTimeMs,
    0,
  );
  const totalLevel6ReplyTime = results.reduce(
    (total, result) => total + result.level6ReplyTimeMs,
    0,
  );

  return {
    averageAdvantageSwingAfterReply:
      totalAdvantageSwingAfterReply / results.length,
    averageDiscDiffAfterReply: totalDiscDiffAfterReply / results.length,
    averageFirstGuidanceTimeMs: totalFirstGuidanceTime / results.length,
    averageLevel6ReplyTimeMs: totalLevel6ReplyTime / results.length,
    improvedOrHeldCount: results.filter(
      (result) => result.advantageAfterLevel6Reply >= result.advantageBefore,
    ).length,
    level6NullReplyCount: results.filter((result) => result.level6Reply === null)
      .length,
    positionCount: results.length,
    teacherNullMoveCount: results.filter((result) => result.teacherMove === null)
      .length,
    worsenedCount: results.filter(
      (result) => result.advantageAfterLevel6Reply < result.advantageBefore,
    ).length,
  };
}

function createSeededDisadvantagedPosition(
  seed: number,
): TeacherComebackBenchmarkPosition | null {
  let board = createInitialBoard();
  let currentDisc: DiscColor = "black";
  let passCount = 0;

  for (let moveIndex = 0; moveIndex < 34; moveIndex += 1) {
    const legalMoves = getLegalMoves(board, currentDisc);

    if (legalMoves.length === 0) {
      passCount += 1;
      currentDisc = getNextDisc(currentDisc);

      if (passCount >= 2) {
        return null;
      }

      continue;
    }

    passCount = 0;
    board = placeDisc(
      board,
      chooseSeededBenchmarkMove(legalMoves, seed, moveIndex, currentDisc),
      currentDisc,
    );
    currentDisc = getNextDisc(currentDisc);

    if (
      moveIndex >= 8 &&
      getLegalMoves(board, currentDisc).length > 0 &&
      isSlightlyDisadvantaged(board, currentDisc)
    ) {
      return {
        board,
        currentDisc,
        moveCount: moveIndex + 1,
        seed,
      };
    }
  }

  return null;
}

function chooseSeededBenchmarkMove(
  legalMoves: SquareIndex[],
  seed: number,
  moveIndex: number,
  disc: DiscColor,
): SquareIndex {
  const offset =
    disc === "black" ? seed * 3 + moveIndex * 5 : seed * 7 + moveIndex * 2 + 1;

  return legalMoves[offset % legalMoves.length] ?? legalMoves[0] ?? 0;
}

function summarizeLimitedNumber(value: string | undefined, fallback: number) {
  const parsedValue = value === undefined ? Number.NaN : Number(value);

  return Number.isFinite(parsedValue) && parsedValue > 0
    ? Math.floor(parsedValue)
    : fallback;
}

function getBenchmarkLimit(): number {
  return Math.min(
    fixedBenchmarkPositionCount,
    summarizeLimitedNumber(
      import.meta.env.VITE_TEACHER_COMEBACK_BENCHMARK_LIMIT,
      fixedBenchmarkPositionCount,
    ),
  );
}

function isSlightlyDisadvantaged(
  board: Board,
  currentDisc: DiscColor,
): boolean {
  const advantagePercent = getAdvantagePercent(board, currentDisc);

  return advantagePercent >= 35 && advantagePercent <= 45;
}

function getAdvantagePercent(board: Board, disc: DiscColor): number {
  const advantage = calculateAdvantage(board, disc);

  return disc === "black" ? advantage.blackPercent : advantage.whitePercent;
}
