import {
  SQUARE_COUNT,
  type Board,
  type Cell,
  type DiscColor,
  type SquareIndex,
} from "../game/othello";
import type { CoachHintKind } from "./createCoachHint";
import type { PlayPositionShapeSignalKind } from "./createPlayPositionAnalysis";
import type { MoveReviewKind, MoveReviewReason } from "./reviewTypes";

export type LearningFixtureTheme =
  | "cornerOpportunity"
  | "cornerRisk"
  | "mobilityOpportunity"
  | "mobilityRisk";

export type LearningFixtureSourcePrinciple =
  | "cornerStability"
  | "openCornerAdjacentRisk"
  | "mobilityQuality";

export type LearningFixtureExpectation = {
  candidateReasons: MoveReviewReason[];
  coachHints: Array<{
    kind: CoachHintKind;
    square: SquareIndex;
  }>;
  review?: {
    kind: MoveReviewKind;
    reasons: MoveReviewReason[];
    square: SquareIndex;
  };
  shapeSignals: Array<{
    kind: PlayPositionShapeSignalKind;
    square: SquareIndex;
  }>;
  square: SquareIndex;
};

export type LearningFixture = {
  board: Board;
  disc: DiscColor;
  expectation: LearningFixtureExpectation;
  id: string;
  note: string;
  sourcePrinciples: LearningFixtureSourcePrinciple[];
  theme: LearningFixtureTheme;
};

type LearningFixtureSeed = Omit<LearningFixture, "board"> & {
  cells: Partial<Record<number, Cell>>;
};

type BoardTransform = {
  id: string;
  square: (row: number, column: number) => SquareIndex;
};

const boardSize = 8;

const boardTransforms: BoardTransform[] = [
  {
    id: "identity",
    square: (row, column) => toSquare(row, column),
  },
  {
    id: "rotate90",
    square: (row, column) => toSquare(column, boardSize - 1 - row),
  },
  {
    id: "rotate180",
    square: (row, column) =>
      toSquare(boardSize - 1 - row, boardSize - 1 - column),
  },
  {
    id: "rotate270",
    square: (row, column) => toSquare(boardSize - 1 - column, row),
  },
  {
    id: "flipHorizontal",
    square: (row, column) => toSquare(row, boardSize - 1 - column),
  },
  {
    id: "flipVertical",
    square: (row, column) => toSquare(boardSize - 1 - row, column),
  },
  {
    id: "flipMainDiagonal",
    square: (row, column) => toSquare(column, row),
  },
  {
    id: "flipAntiDiagonal",
    square: (row, column) =>
      toSquare(boardSize - 1 - column, boardSize - 1 - row),
  },
];

const intermediateLearningFixtureSeeds: LearningFixtureSeed[] = [
  {
    cells: {
      1: "white",
      2: "black",
    },
    disc: "black",
    expectation: {
      candidateReasons: ["corner"],
      coachHints: [{ kind: "cornerOpportunity", square: 0 }],
      review: {
        kind: "good",
        reasons: ["corner"],
        square: 0,
      },
      shapeSignals: [{ kind: "cornerOpportunity", square: 0 }],
      square: 0,
    },
    id: "corner-opportunity-a1",
    note: "Corners are stable and should be noticed when available.",
    sourcePrinciples: ["cornerStability"],
    theme: "cornerOpportunity",
  },
  {
    cells: {
      10: "white",
      11: "black",
      18: "white",
      27: "white",
      28: "black",
    },
    disc: "black",
    expectation: {
      candidateReasons: ["dangerSquare", "cornerGiven"],
      coachHints: [{ kind: "cornerRisk", square: 9 }],
      review: {
        kind: "bad",
        reasons: ["dangerSquare", "cornerGiven"],
        square: 9,
      },
      shapeSignals: [{ kind: "cornerRisk", square: 9 }],
      square: 9,
    },
    id: "x-square-corner-risk-b2",
    note: "An X-square next to an open corner should be treated as a practical corner risk.",
    sourcePrinciples: ["cornerStability", "openCornerAdjacentRisk"],
    theme: "cornerRisk",
  },
  {
    cells: {
      18: "white",
      19: "black",
      27: "white",
      28: "black",
      35: "black",
      36: "white",
    },
    disc: "black",
    expectation: {
      candidateReasons: ["mobilityGain"],
      coachHints: [{ kind: "mobility", square: 26 }],
      review: {
        kind: "good",
        reasons: ["mobilityGain"],
        square: 26,
      },
      shapeSignals: [{ kind: "mobilityOpportunity", square: 26 }],
      square: 26,
    },
    id: "mobility-opportunity-c4",
    note: "Moves that reduce the opponent's choices are useful beginner-to-intermediate learning targets.",
    sourcePrinciples: ["mobilityQuality"],
    theme: "mobilityOpportunity",
  },
  {
    cells: {
      1: "black",
      9: "black",
      17: "black",
      18: "white",
      19: "black",
      27: "white",
      28: "black",
      35: "black",
      36: "white",
    },
    disc: "white",
    expectation: {
      candidateReasons: ["mobilityLoss"],
      coachHints: [{ kind: "mobilityRisk", square: 11 }],
      review: {
        kind: "bad",
        reasons: ["mobilityLoss"],
        square: 11,
      },
      shapeSignals: [{ kind: "mobilityRisk", square: 11 }],
      square: 11,
    },
    id: "mobility-risk-d2",
    note: "Moves that sharply reduce the player's own choices should be visible as learning risks.",
    sourcePrinciples: ["mobilityQuality"],
    theme: "mobilityRisk",
  },
];

export const intermediateLearningFixtures: LearningFixture[] =
  intermediateLearningFixtureSeeds.flatMap((seed) =>
    boardTransforms.map((transform) =>
      createTransformedFixture(seed, transform),
    ),
  );

function createTransformedFixture(
  seed: LearningFixtureSeed,
  transform: BoardTransform,
): LearningFixture {
  return {
    board: createLearningBoardFixture(transformCells(seed.cells, transform)),
    disc: seed.disc,
    expectation: transformExpectation(seed.expectation, transform),
    id: `${seed.id}-${transform.id}`,
    note: seed.note,
    sourcePrinciples: seed.sourcePrinciples,
    theme: seed.theme,
  };
}

function transformExpectation(
  expectation: LearningFixtureExpectation,
  transform: BoardTransform,
): LearningFixtureExpectation {
  return {
    candidateReasons: expectation.candidateReasons,
    coachHints: expectation.coachHints.map((hint) => ({
      ...hint,
      square: transformSquare(hint.square, transform),
    })),
    review:
      expectation.review === undefined
        ? undefined
        : {
            ...expectation.review,
            square: transformSquare(expectation.review.square, transform),
          },
    shapeSignals: expectation.shapeSignals.map((signal) => ({
      ...signal,
      square: transformSquare(signal.square, transform),
    })),
    square: transformSquare(expectation.square, transform),
  };
}

function transformCells(
  cells: Partial<Record<number, Cell>>,
  transform: BoardTransform,
): Partial<Record<number, Cell>> {
  const transformedCells: Partial<Record<number, Cell>> = {};

  for (const [square, cell] of Object.entries(cells) as Array<[string, Cell]>) {
    transformedCells[transformSquare(Number(square), transform)] = cell;
  }

  return transformedCells;
}

function transformSquare(
  square: SquareIndex,
  transform: BoardTransform,
): SquareIndex {
  return transform.square(Math.floor(square / boardSize), square % boardSize);
}

function createLearningBoardFixture(
  cells: Partial<Record<number, Cell>>,
  defaultCell: Cell = null,
): Board {
  const board: Board = Array.from({ length: SQUARE_COUNT }, () => defaultCell);

  for (const [square, cell] of Object.entries(cells) as Array<[string, Cell]>) {
    board[Number(square)] = cell;
  }

  return board;
}

function toSquare(row: number, column: number): SquareIndex {
  return row * boardSize + column;
}
