import { describe, expect, it } from "vitest";
import {
  applyMove,
  getLegalMoves,
  type DiscColor,
  type SquareIndex,
} from "../game/othello";
import type { MoveRecord } from "../game/session";
import { analyzeMoveCandidates } from "./analyzeMoveCandidates";
import { createPlayPositionAnalysis } from "./createPlayPositionAnalysis";
import { intermediateLearningFixtures } from "./learningFixtures";
import { reviewGame } from "./reviewGame";

describe("intermediate learning fixtures", () => {
  it("provides a production seed pack of at least 30 fixtures", () => {
    expect(intermediateLearningFixtures).toHaveLength(32);
  });

  it("keeps fixture ids unique", () => {
    const ids = intermediateLearningFixtures.map((fixture) => fixture.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it("keeps every fixture tied to a source-backed principle", () => {
    expect(intermediateLearningFixtures).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          sourcePrinciples: expect.arrayContaining([expect.any(String)]),
        }),
      ]),
    );
    expect(
      intermediateLearningFixtures.every(
        (fixture) => fixture.sourcePrinciples.length > 0,
      ),
    ).toBe(true);
  });

  it.each(intermediateLearningFixtures)(
    "detects candidate reasons for $id",
    (fixture) => {
      const analysis = analyzeMoveCandidates(fixture.board, fixture.disc, {
        searchDepth: 1,
      });
      const candidate = analysis.candidateMoves.find(
        (move) => move.square === fixture.expectation.square,
      );

      expect(candidate).toEqual(
        expect.objectContaining({
          reasons: expect.arrayContaining(fixture.expectation.candidateReasons),
          square: fixture.expectation.square,
        }),
      );
    },
  );

  it.each(intermediateLearningFixtures)(
    "keeps play hints aligned with $id",
    (fixture) => {
      const analysis = createPlayPositionAnalysis(fixture.board, fixture.disc, {
        includeCandidateFallback: true,
        searchDepth: 1,
      });

      for (const expectedHint of fixture.expectation.coachHints) {
        expect(analysis.coachHints).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              kind: expectedHint.kind,
              square: expectedHint.square,
            }),
          ]),
        );
      }

      for (const expectedSignal of fixture.expectation.shapeSignals) {
        expect(analysis.shapeSignals).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              kind: expectedSignal.kind,
              square: expectedSignal.square,
            }),
          ]),
        );
      }
    },
  );

  it.each(
    intermediateLearningFixtures.filter(
      (fixture) => fixture.expectation.review !== undefined,
    ),
  )("keeps review classification aligned with $id", (fixture) => {
    const expectedReview = fixture.expectation.review;

    if (expectedReview === undefined) {
      throw new Error("Missing review expectation");
    }

    const review = reviewGame(
      [
        createMoveRecord({
          boardBefore: fixture.board,
          disc: fixture.disc,
          moveNumber: 1,
          square: expectedReview.square,
        }),
      ],
      {
        maxHighlights: 2,
        reviewedDisc: fixture.disc,
        searchDepth: 1,
      },
    );
    const reviewedMove = review.reviewedMoves[0];

    expect(reviewedMove.review).toEqual(
      expect.objectContaining({
        kind: expectedReview.kind,
        reasons: expect.arrayContaining(expectedReview.reasons),
        square: expectedReview.square,
      }),
    );
  });
});

function createMoveRecord({
  boardBefore,
  disc,
  moveNumber,
  square,
}: {
  boardBefore: MoveRecord["boardBefore"];
  disc: DiscColor;
  moveNumber: number;
  square: SquareIndex;
}): MoveRecord {
  const appliedMove = applyMove(boardBefore, square, disc);

  if (appliedMove === null) {
    throw new Error(`Fixture move ${square} is not legal for ${disc}`);
  }

  return {
    boardAfter: appliedMove.board,
    boardBefore,
    disc,
    flippedSquares: appliedMove.flippedSquares,
    legalMovesBefore: getLegalMoves(boardBefore, disc),
    moveNumber,
    square,
  };
}
