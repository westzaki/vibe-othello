import {
  choosePerfectEndgameMove,
  countEmptySquares,
  strategicEvaluateBoard,
} from "../cpu";
import {
  CORNER_SQUARES,
  countDiscs,
  getLegalMoves,
  getNextDisc,
  isGameOver,
  placeDisc,
  type Board,
  type DiscColor,
  type SquareIndex,
} from "../game/othello";
import {
  analyzeMoveCandidates,
  type MoveCandidateAnalysis,
} from "./analyzeMoveCandidates";
import type { CandidateMoveReview } from "./reviewTypes";

export type TeacherGuidanceMoveOptions = {
  deepSearchDepth?: number;
  refutationSearchDepth?: number;
  shallowSearchDepth?: number;
  strongCandidateScoreGap?: number;
  topCandidateLimit?: number;
};

export type TeacherGuidanceRefutation = {
  opponentSquare: SquareIndex;
  scoreAfterReply: number;
  severity: "low" | "medium" | "high";
};

export type TeacherGuidanceCandidate = {
  candidate: CandidateMoveReview;
  learningBonus: number;
  refutation: TeacherGuidanceRefutation | null;
  refutationPenalty: number;
  scoreGapFromBest: number;
  searchScore: number;
  teacherScore: number;
};

const defaultTeacherGuidanceShallowSearchDepth = 3;
const defaultTeacherGuidanceDeepSearchDepth = 6;
const defaultTeacherGuidanceRefutationSearchDepth = 1;
const defaultTeacherGuidanceTopCandidateLimit = 4;
const defaultTeacherGuidanceStrongCandidateScoreGap = 30;
const deepeningCloseScoreGap = 36;
const deepeningMobilitySwing = 4;
const cornerLearningBonus = 4;
const mobilityLearningBonus = 2;
const stableEdgeLearningBonus = 3;
const refutationLowPenalty = 3;
const refutationMediumPenalty = 8;
const refutationHighPenalty = 20;
const refutationLowScoreGap = 30;
const refutationMediumScoreGap = 55;
const refutationHighScoreGap = 85;
const finalScoreWeight = 1000;

export function chooseTeacherGuidanceMove(
  board: Board,
  disc: DiscColor,
  {
    deepSearchDepth = defaultTeacherGuidanceDeepSearchDepth,
    refutationSearchDepth = defaultTeacherGuidanceRefutationSearchDepth,
    shallowSearchDepth = defaultTeacherGuidanceShallowSearchDepth,
    strongCandidateScoreGap = defaultTeacherGuidanceStrongCandidateScoreGap,
    topCandidateLimit = defaultTeacherGuidanceTopCandidateLimit,
  }: TeacherGuidanceMoveOptions = {},
): SquareIndex | null {
  const legalMoves = getLegalMoves(board, disc);

  if (legalMoves.length === 0) {
    return null;
  }

  if (shouldUseTeacherExactEndgame(board, disc)) {
    return choosePerfectEndgameMove(board, disc);
  }

  const shallowAnalysis = analyzeMoveCandidates(board, disc, {
    searchDepth: shallowSearchDepth,
  });
  const deepenedScores = getDeepenedTeacherMoveScores({
    analysis: shallowAnalysis,
    board,
    deepSearchDepth,
    disc,
    topCandidateLimit,
  });
  const recommendationCandidates = rankTeacherGuidanceCandidates({
    board,
    candidates: deepenedScores,
    disc,
    refutationSearchDepth,
    strongCandidateScoreGap,
  });

  return (
    recommendationCandidates[0]?.candidate.square ??
    deepenedScores[0]?.square ??
    shallowAnalysis.candidateMoves[0]?.square ??
    null
  );
}

export function shouldUseTeacherExactEndgame(
  board: Board,
  disc: DiscColor,
): boolean {
  return shouldUseTeacherExactEndgameByCounts(
    countEmptySquares(board),
    getLegalMoves(board, disc).length,
  );
}

export function shouldUseTeacherExactEndgameByCounts(
  emptyCount: number,
  legalMoveCount: number,
): boolean {
  return (
    emptyCount <= 10 ||
    (emptyCount <= 12 && legalMoveCount <= 4) ||
    (emptyCount <= 14 && legalMoveCount <= 3)
  );
}

function getDeepenedTeacherMoveScores({
  analysis,
  board,
  deepSearchDepth,
  disc,
  topCandidateLimit,
}: {
  analysis: MoveCandidateAnalysis;
  board: Board;
  deepSearchDepth: number;
  disc: DiscColor;
  topCandidateLimit: number;
}): CandidateMoveReview[] {
  const deepeningCandidates = selectTeacherDeepeningCandidates(
    analysis.candidateMoves,
    topCandidateLimit,
  );
  const deepenedScores = scoreDeepeningCandidates({
    board,
    candidates: deepeningCandidates,
    deepSearchDepth,
    disc,
  });

  return analysis.candidateMoves
    .map((candidate) => ({
      ...candidate,
      score: deepenedScores.get(candidate.square) ?? candidate.score,
    }))
    .sort(compareCandidateScores)
    .map((candidate, index) => ({
      ...candidate,
      rank: index + 1,
    }));
}

export function selectTeacherDeepeningCandidates(
  candidateMoves: CandidateMoveReview[],
  topCandidateLimit = defaultTeacherGuidanceTopCandidateLimit,
): CandidateMoveReview[] {
  return candidateMoves.filter(
    (candidate) =>
      candidate.rank <= topCandidateLimit ||
      candidate.metrics.isCorner ||
      candidate.metrics.givesOpponentCorner ||
      candidate.metrics.isDangerSquare ||
      candidate.metrics.scoreGapFromBest <= deepeningCloseScoreGap ||
      candidate.metrics.anchoredEdgeDelta > 0 ||
      Math.abs(candidate.metrics.mobilitySwing) >= deepeningMobilitySwing,
  );
}

export function rankTeacherGuidanceCandidates({
  board,
  candidates,
  disc,
  refutationSearchDepth = defaultTeacherGuidanceRefutationSearchDepth,
  strongCandidateScoreGap = defaultTeacherGuidanceStrongCandidateScoreGap,
}: {
  board: Board;
  candidates: CandidateMoveReview[];
  disc: DiscColor;
  refutationSearchDepth?: number;
  strongCandidateScoreGap?: number;
}): TeacherGuidanceCandidate[] {
  const strongCandidates = selectStrongTeacherCandidates(
    candidates,
    strongCandidateScoreGap,
  );
  const bestSearchScore = getBestCandidateScore(candidates) ?? 0;
  const candidatePool =
    strongCandidates.length > 0 ? strongCandidates : candidates.slice(0, 1);
  return candidatePool
    .map((candidate) =>
      createTeacherGuidanceCandidate({
        bestSearchScore,
        board,
        candidate,
        disc,
        refutationSearchDepth,
      }),
    )
    .sort(compareTeacherGuidanceCandidates);
}

export function selectStrongTeacherCandidates(
  candidates: CandidateMoveReview[],
  maxScoreGap = defaultTeacherGuidanceStrongCandidateScoreGap,
): CandidateMoveReview[] {
  const bestScore = getBestCandidateScore(candidates);

  if (bestScore === null) {
    return [];
  }

  return candidates.filter(
    (candidate) => bestScore - candidate.score <= maxScoreGap,
  );
}

function getBestCandidateScore(
  candidates: CandidateMoveReview[],
): number | null {
  if (candidates.length === 0) {
    return null;
  }

  return Math.max(...candidates.map((candidate) => candidate.score));
}

function createTeacherGuidanceCandidate({
  bestSearchScore,
  board,
  candidate,
  disc,
  refutationSearchDepth,
}: {
  bestSearchScore: number;
  board: Board;
  candidate: CandidateMoveReview;
  disc: DiscColor;
  refutationSearchDepth: number;
}): TeacherGuidanceCandidate {
  const refutation = findTeacherRefutation({
    bestSearchScore,
    boardAfterCandidate: placeDisc(board, candidate.square, disc),
    candidate,
    disc,
    refutationSearchDepth,
  });
  const refutationPenalty = getRefutationPenalty(refutation);
  const learningBonus = getLearningBonus(candidate);
  const scoreGapFromBest = bestSearchScore - candidate.score;

  return {
    candidate,
    learningBonus,
    refutation,
    refutationPenalty,
    scoreGapFromBest,
    searchScore: candidate.score,
    teacherScore: candidate.score - refutationPenalty + learningBonus,
  };
}

function findTeacherRefutation({
  bestSearchScore,
  boardAfterCandidate,
  candidate,
  disc,
  refutationSearchDepth,
}: {
  bestSearchScore: number;
  boardAfterCandidate: Board;
  candidate: CandidateMoveReview;
  disc: DiscColor;
  refutationSearchDepth: number;
}): TeacherGuidanceRefutation | null {
  const opponentDisc = getNextDisc(disc);
  const opponentMoves = getLegalMoves(boardAfterCandidate, opponentDisc);

  if (opponentMoves.length === 0) {
    return null;
  }

  const replyScores = opponentMoves
    .map((opponentSquare) => {
      const boardAfterReply = placeDisc(
        boardAfterCandidate,
        opponentSquare,
        opponentDisc,
      );

      return {
        opponentSquare,
        scoreAfterReply: minimax(
          boardAfterReply,
          disc,
          disc,
          Math.max(0, refutationSearchDepth - 1),
          Number.NEGATIVE_INFINITY,
          Number.POSITIVE_INFINITY,
        ),
      };
    })
    .sort(
      (firstReply, secondReply) =>
        firstReply.scoreAfterReply - secondReply.scoreAfterReply,
    );
  const strongestReply = replyScores[0];

  if (strongestReply === undefined) {
    return null;
  }

  const severity = getRefutationSeverity({
    candidate,
    opponentSquare: strongestReply.opponentSquare,
    scoreAfterReply: strongestReply.scoreAfterReply,
    bestSearchScore,
  });

  if (severity === null) {
    return null;
  }

  return {
    opponentSquare: strongestReply.opponentSquare,
    scoreAfterReply: strongestReply.scoreAfterReply,
    severity,
  };
}

function getRefutationSeverity({
  bestSearchScore,
  candidate,
  opponentSquare,
  scoreAfterReply,
}: {
  bestSearchScore: number;
  candidate: CandidateMoveReview;
  opponentSquare: SquareIndex;
  scoreAfterReply: number;
}): TeacherGuidanceRefutation["severity"] | null {
  const scoreGapAfterReply = bestSearchScore - scoreAfterReply;
  const opponentTakesCorner = (
    CORNER_SQUARES as readonly SquareIndex[]
  ).includes(opponentSquare);

  if (opponentTakesCorner) {
    return scoreGapAfterReply >= refutationLowScoreGap ? "high" : "medium";
  }

  if (
    candidate.metrics.givesOpponentCorner &&
    scoreGapAfterReply >= refutationMediumScoreGap
  ) {
    return scoreGapAfterReply >= refutationHighScoreGap ? "high" : "medium";
  }

  if (scoreGapAfterReply >= refutationHighScoreGap) {
    return "high";
  }

  if (scoreGapAfterReply >= refutationMediumScoreGap) {
    return "medium";
  }

  if (scoreGapAfterReply >= refutationLowScoreGap) {
    return "low";
  }

  return null;
}

function getRefutationPenalty(
  refutation: TeacherGuidanceRefutation | null,
): number {
  if (refutation === null) {
    return 0;
  }

  switch (refutation.severity) {
    case "high":
      return refutationHighPenalty;
    case "medium":
      return refutationMediumPenalty;
    case "low":
      return refutationLowPenalty;
  }
}

function getLearningBonus(candidate: CandidateMoveReview): number {
  return (
    (candidate.metrics.isCorner ? cornerLearningBonus : 0) +
    (candidate.metrics.mobilitySwing > 0
      ? Math.min(mobilityLearningBonus, candidate.metrics.mobilitySwing)
      : 0) +
    (candidate.metrics.anchoredEdgeDelta > 0 ? stableEdgeLearningBonus : 0)
  );
}

function scoreDeepeningCandidates({
  board,
  candidates,
  deepSearchDepth,
  disc,
}: {
  board: Board;
  candidates: CandidateMoveReview[];
  deepSearchDepth: number;
  disc: DiscColor;
}): Map<SquareIndex, number> {
  const scores = new Map<SquareIndex, number>();
  let alpha = Number.NEGATIVE_INFINITY;

  for (const candidate of candidates) {
    const score = minimax(
      placeDisc(board, candidate.square, disc),
      getNextDisc(disc),
      disc,
      deepSearchDepth - 1,
      alpha,
      Number.POSITIVE_INFINITY,
    );

    scores.set(candidate.square, score);
    alpha = Math.max(alpha, score);
  }

  return scores;
}

function minimax(
  board: Board,
  currentDisc: DiscColor,
  maximizingDisc: DiscColor,
  depth: number,
  alpha: number,
  beta: number,
): number {
  if (isGameOver(board)) {
    return getFinalDiscDifference(board, maximizingDisc) * finalScoreWeight;
  }

  if (depth <= 0) {
    return strategicEvaluateBoard(board, maximizingDisc);
  }

  const legalMoves = getLegalMoves(board, currentDisc);
  const nextDisc = getNextDisc(currentDisc);

  if (legalMoves.length === 0) {
    return minimax(board, nextDisc, maximizingDisc, depth - 1, alpha, beta);
  }

  return currentDisc === maximizingDisc
    ? getMaxScore(
        board,
        currentDisc,
        maximizingDisc,
        legalMoves,
        depth,
        alpha,
        beta,
      )
    : getMinScore(
        board,
        currentDisc,
        maximizingDisc,
        legalMoves,
        depth,
        alpha,
        beta,
      );
}

function getMaxScore(
  board: Board,
  currentDisc: DiscColor,
  maximizingDisc: DiscColor,
  legalMoves: SquareIndex[],
  depth: number,
  alpha: number,
  beta: number,
): number {
  let bestScore = Number.NEGATIVE_INFINITY;
  let nextAlpha = alpha;

  for (const move of orderMoves(
    board,
    currentDisc,
    maximizingDisc,
    legalMoves,
    true,
  )) {
    const score = minimax(
      placeDisc(board, move, currentDisc),
      getNextDisc(currentDisc),
      maximizingDisc,
      depth - 1,
      nextAlpha,
      beta,
    );

    bestScore = Math.max(bestScore, score);
    nextAlpha = Math.max(nextAlpha, bestScore);

    if (beta <= nextAlpha) {
      break;
    }
  }

  return bestScore;
}

function getMinScore(
  board: Board,
  currentDisc: DiscColor,
  maximizingDisc: DiscColor,
  legalMoves: SquareIndex[],
  depth: number,
  alpha: number,
  beta: number,
): number {
  let bestScore = Number.POSITIVE_INFINITY;
  let nextBeta = beta;

  for (const move of orderMoves(
    board,
    currentDisc,
    maximizingDisc,
    legalMoves,
    false,
  )) {
    const score = minimax(
      placeDisc(board, move, currentDisc),
      getNextDisc(currentDisc),
      maximizingDisc,
      depth - 1,
      alpha,
      nextBeta,
    );

    bestScore = Math.min(bestScore, score);
    nextBeta = Math.min(nextBeta, bestScore);

    if (nextBeta <= alpha) {
      break;
    }
  }

  return bestScore;
}

function orderMoves(
  board: Board,
  currentDisc: DiscColor,
  maximizingDisc: DiscColor,
  legalMoves: SquareIndex[],
  isMaximizing: boolean,
): SquareIndex[] {
  return legalMoves
    .map((move) => ({
      move,
      score: strategicEvaluateBoard(
        placeDisc(board, move, currentDisc),
        maximizingDisc,
      ),
    }))
    .sort((firstMove, secondMove) =>
      isMaximizing
        ? secondMove.score - firstMove.score
        : firstMove.score - secondMove.score,
    )
    .map(({ move }) => move);
}

function getFinalDiscDifference(board: Board, disc: DiscColor): number {
  const counts = countDiscs(board);
  const opponentDisc = getNextDisc(disc);

  return counts[disc] - counts[opponentDisc];
}

function compareCandidateScores(
  firstCandidate: CandidateMoveReview,
  secondCandidate: CandidateMoveReview,
): number {
  const scoreDifference = secondCandidate.score - firstCandidate.score;

  if (scoreDifference !== 0) {
    return scoreDifference;
  }

  return firstCandidate.rank - secondCandidate.rank;
}

function compareTeacherGuidanceCandidates(
  firstCandidate: TeacherGuidanceCandidate,
  secondCandidate: TeacherGuidanceCandidate,
): number {
  const searchScoreDifference =
    secondCandidate.searchScore - firstCandidate.searchScore;

  if (searchScoreDifference !== 0) {
    return searchScoreDifference;
  }

  const refutationPenaltyDifference =
    firstCandidate.refutationPenalty - secondCandidate.refutationPenalty;

  if (refutationPenaltyDifference !== 0) {
    return refutationPenaltyDifference;
  }

  const learningBonusDifference =
    secondCandidate.learningBonus - firstCandidate.learningBonus;

  if (learningBonusDifference !== 0) {
    return learningBonusDifference;
  }

  return firstCandidate.scoreGapFromBest - secondCandidate.scoreGapFromBest;
}
