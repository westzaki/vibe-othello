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

export type TeacherGuidanceMode = "normal" | "comeback" | "auto";

export type TeacherGuidanceSearchStats = {
  cacheHitCount: number;
  searchedNodeCount: number;
};

export type TeacherGuidanceMoveOptions = {
  deepSearchDepth?: number;
  guidanceMode?: TeacherGuidanceMode;
  isDisadvantaged?: boolean;
  refutationSearchDepth?: number;
  searchStats?: TeacherGuidanceSearchStats;
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
  comebackBonus: number;
  learningBonus: number;
  opponentCornerAccessPenalty: number;
  opponentPressureScore: number;
  opponentReplySpread: number | null;
  refutation: TeacherGuidanceRefutation | null;
  refutationPenalty: number;
  scoreGapFromBest: number;
  searchScore: number;
  teacherScore: number;
};

export type TeacherGuidanceSelection = {
  candidate: CandidateMoveReview;
  guidance: TeacherGuidanceCandidate | null;
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
const comebackForcePassBonus = 10;
const comebackForceMoveBonus = 8;
const comebackNarrowMoveBonus = 4;
const comebackReplySpreadScale = 16;
const comebackReplySpreadMaxBonus = 5;
const comebackPressureMaxBonus = 18;
const comebackCornerGivenPenalty = 24;
const comebackDangerSquarePenalty = 8;
const comebackHighRefutationExtraPenalty = 28;
const autoDisadvantageSearchScore = -20;
const opponentCornerMoveDeltaPenalty = 12;
const opponentCornerAccessAfterPenalty = 4;
const teacherSearchCacheMaxEntries = 20_000;
const teacherMoveOrderingCornerBonus = 140;
const teacherMoveOrderingCornerAccessPenalty = 90;
const teacherMoveOrderingDangerSquarePenalty = 32;
const teacherMoveOrderingMobilityDeltaWeight = 8;
const teacherMoveOrderingAnchoredEdgeBonus = 18;
const refutationLowPenalty = 3;
const refutationMediumPenalty = 8;
const refutationHighPenalty = 20;
const refutationLowScoreGap = 30;
const refutationMediumScoreGap = 55;
const refutationHighScoreGap = 85;
const finalScoreWeight = 1000;
const teacherDangerSquaresByCorner = new Map<SquareIndex, SquareIndex[]>([
  [0, [1, 8, 9]],
  [7, [6, 14, 15]],
  [56, [48, 49, 57]],
  [63, [54, 55, 62]],
]);
const teacherEdgeRaysByCorner: Array<{
  corner: SquareIndex;
  directions: [number, number];
}> = [
  { corner: 0, directions: [1, 8] },
  { corner: 7, directions: [-1, 8] },
  { corner: 56, directions: [1, -8] },
  { corner: 63, directions: [-1, -8] },
];

export function chooseTeacherGuidanceMove(
  board: Board,
  disc: DiscColor,
  {
    deepSearchDepth = defaultTeacherGuidanceDeepSearchDepth,
    guidanceMode = "normal",
    isDisadvantaged,
    refutationSearchDepth = defaultTeacherGuidanceRefutationSearchDepth,
    searchStats,
    shallowSearchDepth = defaultTeacherGuidanceShallowSearchDepth,
    strongCandidateScoreGap = defaultTeacherGuidanceStrongCandidateScoreGap,
    topCandidateLimit = defaultTeacherGuidanceTopCandidateLimit,
  }: TeacherGuidanceMoveOptions = {},
): SquareIndex | null {
  const shallowAnalysis = analyzeMoveCandidates(board, disc, {
    searchDepth: shallowSearchDepth,
  });

  return (
    selectTeacherGuidanceCandidate({
      analysis: shallowAnalysis,
      board,
      deepSearchDepth,
      disc,
      guidanceMode,
      isDisadvantaged,
      refutationSearchDepth,
      searchStats,
      strongCandidateScoreGap,
      topCandidateLimit,
    })?.square ?? null
  );
}

export function selectTeacherGuidanceCandidate({
  analysis,
  board,
  deepSearchDepth = defaultTeacherGuidanceDeepSearchDepth,
  disc,
  guidanceMode = "normal",
  isDisadvantaged,
  refutationSearchDepth = defaultTeacherGuidanceRefutationSearchDepth,
  searchStats,
  strongCandidateScoreGap = defaultTeacherGuidanceStrongCandidateScoreGap,
  topCandidateLimit = defaultTeacherGuidanceTopCandidateLimit,
}: {
  analysis: MoveCandidateAnalysis;
  board: Board;
  disc: DiscColor;
} & TeacherGuidanceMoveOptions): CandidateMoveReview | null {
  return (
    selectTeacherGuidanceSelection({
      analysis,
      board,
      deepSearchDepth,
      disc,
      guidanceMode,
      isDisadvantaged,
      refutationSearchDepth,
      searchStats,
      strongCandidateScoreGap,
      topCandidateLimit,
    })?.candidate ?? null
  );
}

export function selectTeacherGuidanceSelection({
  analysis,
  board,
  deepSearchDepth = defaultTeacherGuidanceDeepSearchDepth,
  disc,
  guidanceMode = "normal",
  isDisadvantaged,
  refutationSearchDepth = defaultTeacherGuidanceRefutationSearchDepth,
  searchStats,
  strongCandidateScoreGap = defaultTeacherGuidanceStrongCandidateScoreGap,
  topCandidateLimit = defaultTeacherGuidanceTopCandidateLimit,
}: {
  analysis: MoveCandidateAnalysis;
  board: Board;
  disc: DiscColor;
} & TeacherGuidanceMoveOptions): TeacherGuidanceSelection | null {
  const legalMoves = getLegalMoves(board, disc);

  if (legalMoves.length === 0) {
    return null;
  }

  if (shouldUseTeacherExactEndgame(board, disc)) {
    const exactSquare = choosePerfectEndgameMove(board, disc);
    const exactCandidate = findCandidateBySquare(
      analysis.candidateMoves,
      exactSquare,
    );

    return exactCandidate === null
      ? null
      : {
          candidate: exactCandidate,
          guidance: null,
        };
  }

  const searchContext = createTeacherSearchContext(searchStats);
  const resolvedDeepSearchDepth = getTeacherDeepSearchDepth({
    baseDepth: deepSearchDepth,
    candidates: analysis.candidateMoves,
    emptyCount: countEmptySquares(board),
    guidanceMode,
  });
  const deepenedScores = getDeepenedTeacherMoveScores({
    analysis,
    board,
    deepSearchDepth: resolvedDeepSearchDepth,
    disc,
    searchContext,
    topCandidateLimit,
  });
  const recommendationCandidates = rankTeacherGuidanceCandidates({
    board,
    candidates: deepenedScores,
    disc,
    guidanceMode,
    isDisadvantaged,
    refutationSearchDepth,
    searchContext,
    strongCandidateScoreGap,
  });

  const recommendation = recommendationCandidates[0];

  if (recommendation !== undefined) {
    return {
      candidate: recommendation.candidate,
      guidance: recommendation,
    };
  }

  const fallbackCandidate = deepenedScores[0] ?? analysis.candidateMoves[0];

  return fallbackCandidate === undefined
    ? null
    : {
        candidate: fallbackCandidate,
        guidance: null,
      };
}

function findCandidateBySquare(
  candidates: CandidateMoveReview[],
  square: SquareIndex | null,
): CandidateMoveReview | null {
  if (square === null) {
    return null;
  }

  return candidates.find((candidate) => candidate.square === square) ?? null;
}

export type TeacherSearchContext = {
  cache: Map<string, number>;
  cacheHitCount: number;
  maxCacheEntries: number;
  searchedNodeCount: number;
  stats?: TeacherGuidanceSearchStats;
};

type TeacherSearchResult = {
  isExact: boolean;
  score: number;
};

export function createTeacherSearchContext(
  stats?: TeacherGuidanceSearchStats,
): TeacherSearchContext {
  if (stats !== undefined) {
    stats.cacheHitCount = 0;
    stats.searchedNodeCount = 0;
  }

  return {
    cache: new Map(),
    cacheHitCount: 0,
    maxCacheEntries: teacherSearchCacheMaxEntries,
    searchedNodeCount: 0,
    stats,
  };
}

export function getTeacherDeepSearchDepth(options: {
  baseDepth: number;
  candidates: CandidateMoveReview[];
  emptyCount: number;
  guidanceMode: TeacherGuidanceMode;
}): number {
  return options.baseDepth;
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
  searchContext,
  topCandidateLimit,
}: {
  analysis: MoveCandidateAnalysis;
  board: Board;
  deepSearchDepth: number;
  disc: DiscColor;
  searchContext: TeacherSearchContext;
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
    searchContext,
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
  guidanceMode = "normal",
  isDisadvantaged,
  refutationSearchDepth = defaultTeacherGuidanceRefutationSearchDepth,
  searchContext = createTeacherSearchContext(),
  strongCandidateScoreGap = defaultTeacherGuidanceStrongCandidateScoreGap,
}: {
  board: Board;
  candidates: CandidateMoveReview[];
  disc: DiscColor;
  guidanceMode?: TeacherGuidanceMode;
  isDisadvantaged?: boolean;
  refutationSearchDepth?: number;
  searchContext?: TeacherSearchContext;
  strongCandidateScoreGap?: number;
}): TeacherGuidanceCandidate[] {
  const strongCandidates = selectStrongTeacherCandidates(
    candidates,
    strongCandidateScoreGap,
  );
  const bestSearchScore = getBestCandidateScore(candidates) ?? 0;
  const candidatePool =
    strongCandidates.length > 0 ? strongCandidates : candidates.slice(0, 1);
  const resolvedGuidanceMode = resolveTeacherGuidanceMode({
    candidates,
    guidanceMode,
    isDisadvantaged,
  });

  return candidatePool
    .map((candidate) =>
      createTeacherGuidanceCandidate({
        bestSearchScore,
        board,
        candidate,
        disc,
        guidanceMode: resolvedGuidanceMode,
        refutationSearchDepth,
        searchContext,
      }),
    )
    .sort((firstCandidate, secondCandidate) =>
      compareTeacherGuidanceCandidates(
        firstCandidate,
        secondCandidate,
        resolvedGuidanceMode,
      ),
    );
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
  guidanceMode,
  refutationSearchDepth,
  searchContext,
}: {
  bestSearchScore: number;
  board: Board;
  candidate: CandidateMoveReview;
  disc: DiscColor;
  guidanceMode: Exclude<TeacherGuidanceMode, "auto">;
  refutationSearchDepth: number;
  searchContext: TeacherSearchContext;
}): TeacherGuidanceCandidate {
  const boardAfterCandidate = placeDisc(board, candidate.square, disc);
  const replyProfile = getTeacherReplyProfile({
    boardAfterCandidate,
    disc,
    refutationSearchDepth,
    searchContext,
  });
  const refutation = findTeacherRefutation({
    bestSearchScore,
    candidate,
    replyProfile,
  });
  const refutationPenalty = getRefutationPenalty(refutation);
  const learningBonus = getLearningBonus(candidate);
  const opponentCornerAccessPenalty =
    getOpponentCornerAccessPenalty(candidate);
  const opponentPressureScore = getOpponentPressureScore(candidate);
  const opponentReplySpread = replyProfile.opponentReplySpread;
  const comebackBonus = getComebackBonus({
    opponentPressureScore,
    opponentReplySpread,
  });
  const scoreGapFromBest = bestSearchScore - candidate.score;
  const teacherScore =
    guidanceMode === "comeback"
      ? getComebackTeacherScore({
          candidate,
          comebackBonus,
          learningBonus,
          opponentCornerAccessPenalty,
          refutation,
          refutationPenalty,
        })
      : candidate.score -
        refutationPenalty -
        opponentCornerAccessPenalty +
        learningBonus;

  return {
    candidate,
    comebackBonus,
    learningBonus,
    opponentCornerAccessPenalty,
    opponentPressureScore,
    opponentReplySpread,
    refutation,
    refutationPenalty,
    scoreGapFromBest,
    searchScore: candidate.score,
    teacherScore,
  };
}

type TeacherReplyScore = {
  opponentSquare: SquareIndex;
  scoreAfterReply: number;
};

type TeacherReplyProfile = {
  opponentReplySpread: number | null;
  strongestReply: TeacherReplyScore | null;
};

function getTeacherReplyProfile({
  boardAfterCandidate,
  disc,
  refutationSearchDepth,
  searchContext,
}: {
  boardAfterCandidate: Board;
  disc: DiscColor;
  refutationSearchDepth: number;
  searchContext: TeacherSearchContext;
}): TeacherReplyProfile {
  const opponentDisc = getNextDisc(disc);
  const opponentMoves = getLegalMoves(boardAfterCandidate, opponentDisc);

  if (opponentMoves.length === 0) {
    return {
      opponentReplySpread: null,
      strongestReply: null,
    };
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
          searchContext,
        ).score,
      };
    })
    .sort(
      (firstReply, secondReply) =>
        firstReply.scoreAfterReply - secondReply.scoreAfterReply,
    );
  const strongestReply = replyScores[0];

  if (strongestReply === undefined) {
    return {
      opponentReplySpread: null,
      strongestReply: null,
    };
  }

  return {
    opponentReplySpread: getOpponentReplySpread(replyScores),
    strongestReply,
  };
}

function findTeacherRefutation({
  bestSearchScore,
  candidate,
  replyProfile,
}: {
  bestSearchScore: number;
  candidate: CandidateMoveReview;
  replyProfile: TeacherReplyProfile;
}): TeacherGuidanceRefutation | null {
  const strongestReply = replyProfile.strongestReply;

  if (strongestReply === null) {
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

function getOpponentReplySpread(replyScores: TeacherReplyScore[]): number | null {
  if (replyScores.length < 2) {
    return null;
  }

  return replyScores[1].scoreAfterReply - replyScores[0].scoreAfterReply;
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

function getOpponentCornerAccessPenalty(
  candidate: CandidateMoveReview,
): number {
  const deltaPenalty =
    Math.max(0, candidate.metrics.opponentCornerMoveDelta) *
    opponentCornerMoveDeltaPenalty;
  const accessPenalty =
    candidate.metrics.opponentCornerMovesAfter > 0
      ? opponentCornerAccessAfterPenalty
      : 0;

  return deltaPenalty + accessPenalty;
}

function getOpponentPressureScore(candidate: CandidateMoveReview): number {
  const forcedMoveBonus = getForcedMoveBonus(
    candidate.metrics.opponentMobilityAfter,
  );
  const mobilityAfterBonus = Math.max(
    0,
    4 - candidate.metrics.opponentMobilityAfter,
  );
  const mobilityDeltaBonus =
    candidate.metrics.opponentMobilityDelta < 0
      ? Math.min(5, -candidate.metrics.opponentMobilityDelta * 1.5)
      : 0;
  const mobilitySwingBonus =
    candidate.metrics.mobilitySwing > 0
      ? Math.min(4, candidate.metrics.mobilitySwing)
      : 0;

  return (
    forcedMoveBonus +
    mobilityAfterBonus +
    mobilityDeltaBonus +
    mobilitySwingBonus
  );
}

function getForcedMoveBonus(opponentMovesAfter: number): number {
  if (opponentMovesAfter === 0) {
    return comebackForcePassBonus;
  }

  if (opponentMovesAfter === 1) {
    return comebackForceMoveBonus;
  }

  if (opponentMovesAfter === 2) {
    return comebackNarrowMoveBonus;
  }

  return 0;
}

function getComebackBonus({
  opponentPressureScore,
  opponentReplySpread,
}: {
  opponentPressureScore: number;
  opponentReplySpread: number | null;
}): number {
  const replySpreadBonus =
    opponentReplySpread === null
      ? 0
      : Math.min(
          comebackReplySpreadMaxBonus,
          opponentReplySpread / comebackReplySpreadScale,
        );

  return Math.min(
    comebackPressureMaxBonus,
    opponentPressureScore + replySpreadBonus,
  );
}

function getComebackTeacherScore({
  candidate,
  comebackBonus,
  learningBonus,
  opponentCornerAccessPenalty,
  refutation,
  refutationPenalty,
}: {
  candidate: CandidateMoveReview;
  comebackBonus: number;
  learningBonus: number;
  opponentCornerAccessPenalty: number;
  refutation: TeacherGuidanceRefutation | null;
  refutationPenalty: number;
}): number {
  return (
    candidate.score +
    comebackBonus +
    learningBonus * 0.5 -
    opponentCornerAccessPenalty -
    getComebackRiskPenalty(candidate, refutation, refutationPenalty)
  );
}

function getComebackRiskPenalty(
  candidate: CandidateMoveReview,
  refutation: TeacherGuidanceRefutation | null,
  refutationPenalty: number,
): number {
  return (
    refutationPenalty +
    (candidate.metrics.givesOpponentCorner ? comebackCornerGivenPenalty : 0) +
    (candidate.metrics.isDangerSquare ? comebackDangerSquarePenalty : 0) +
    (refutation?.severity === "high" ? comebackHighRefutationExtraPenalty : 0)
  );
}

function resolveTeacherGuidanceMode({
  candidates,
  guidanceMode,
  isDisadvantaged,
}: {
  candidates: CandidateMoveReview[];
  guidanceMode: TeacherGuidanceMode;
  isDisadvantaged: boolean | undefined;
}): Exclude<TeacherGuidanceMode, "auto"> {
  if (guidanceMode !== "auto") {
    return guidanceMode;
  }

  if (isDisadvantaged !== undefined) {
    return isDisadvantaged ? "comeback" : "normal";
  }

  return isLikelyDisadvantagedFromCandidates(candidates)
    ? "comeback"
    : "normal";
}

function isLikelyDisadvantagedFromCandidates(
  candidates: CandidateMoveReview[],
): boolean {
  const bestScore = getBestCandidateScore(candidates);

  return bestScore !== null && bestScore < autoDisadvantageSearchScore;
}

function scoreDeepeningCandidates({
  board,
  candidates,
  deepSearchDepth,
  disc,
  searchContext,
}: {
  board: Board;
  candidates: CandidateMoveReview[];
  deepSearchDepth: number;
  disc: DiscColor;
  searchContext: TeacherSearchContext;
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
      searchContext,
    ).score;

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
  searchContext: TeacherSearchContext,
): TeacherSearchResult {
  const cacheKey = createTeacherSearchCacheKey({
    board,
    currentDisc,
    depth,
    maximizingDisc,
  });
  const cachedScore = searchContext.cache.get(cacheKey);

  if (cachedScore !== undefined) {
    recordTeacherSearchCacheHit(searchContext);

    return {
      isExact: true,
      score: cachedScore,
    };
  }

  recordTeacherSearchNode(searchContext);

  if (isGameOver(board)) {
    return cacheTeacherSearchResult(searchContext, cacheKey, {
      isExact: true,
      score: getFinalDiscDifference(board, maximizingDisc) * finalScoreWeight,
    });
  }

  if (depth <= 0) {
    return cacheTeacherSearchResult(searchContext, cacheKey, {
      isExact: true,
      score: strategicEvaluateBoard(board, maximizingDisc),
    });
  }

  const legalMoves = getLegalMoves(board, currentDisc);
  const nextDisc = getNextDisc(currentDisc);

  if (legalMoves.length === 0) {
    const result = minimax(
      board,
      nextDisc,
      maximizingDisc,
      depth - 1,
      alpha,
      beta,
      searchContext,
    );

    return cacheTeacherSearchResult(searchContext, cacheKey, result);
  }

  const result =
    currentDisc === maximizingDisc
      ? getMaxScore(
          board,
          currentDisc,
          maximizingDisc,
          legalMoves,
          depth,
          alpha,
          beta,
          searchContext,
        )
      : getMinScore(
          board,
          currentDisc,
          maximizingDisc,
          legalMoves,
          depth,
          alpha,
          beta,
          searchContext,
        );

  return cacheTeacherSearchResult(searchContext, cacheKey, result);
}

function getMaxScore(
  board: Board,
  currentDisc: DiscColor,
  maximizingDisc: DiscColor,
  legalMoves: SquareIndex[],
  depth: number,
  alpha: number,
  beta: number,
  searchContext: TeacherSearchContext,
): TeacherSearchResult {
  let bestScore = Number.NEGATIVE_INFINITY;
  let nextAlpha = alpha;
  let isExact = true;

  for (const move of orderTeacherSearchMoves({
    board,
    currentDisc,
    isMaximizing: true,
    legalMoves,
    maximizingDisc,
    remainingDepth: depth,
  })) {
    const result = minimax(
      placeDisc(board, move, currentDisc),
      getNextDisc(currentDisc),
      maximizingDisc,
      depth - 1,
      nextAlpha,
      beta,
      searchContext,
    );
    const score = result.score;

    isExact &&= result.isExact;
    bestScore = Math.max(bestScore, score);
    nextAlpha = Math.max(nextAlpha, bestScore);

    if (beta <= nextAlpha) {
      return {
        isExact: false,
        score: bestScore,
      };
    }
  }

  return {
    isExact,
    score: bestScore,
  };
}

function getMinScore(
  board: Board,
  currentDisc: DiscColor,
  maximizingDisc: DiscColor,
  legalMoves: SquareIndex[],
  depth: number,
  alpha: number,
  beta: number,
  searchContext: TeacherSearchContext,
): TeacherSearchResult {
  let bestScore = Number.POSITIVE_INFINITY;
  let nextBeta = beta;
  let isExact = true;

  for (const move of orderTeacherSearchMoves({
    board,
    currentDisc,
    isMaximizing: false,
    legalMoves,
    maximizingDisc,
    remainingDepth: depth,
  })) {
    const result = minimax(
      placeDisc(board, move, currentDisc),
      getNextDisc(currentDisc),
      maximizingDisc,
      depth - 1,
      alpha,
      nextBeta,
      searchContext,
    );
    const score = result.score;

    isExact &&= result.isExact;
    bestScore = Math.min(bestScore, score);
    nextBeta = Math.min(nextBeta, bestScore);

    if (nextBeta <= alpha) {
      return {
        isExact: false,
        score: bestScore,
      };
    }
  }

  return {
    isExact,
    score: bestScore,
  };
}

export function evaluateTeacherSearchPosition({
  board,
  currentDisc,
  depth,
  maximizingDisc,
  searchContext = createTeacherSearchContext(),
}: {
  board: Board;
  currentDisc: DiscColor;
  depth: number;
  maximizingDisc: DiscColor;
  searchContext?: TeacherSearchContext;
}): number {
  return minimax(
    board,
    currentDisc,
    maximizingDisc,
    depth,
    Number.NEGATIVE_INFINITY,
    Number.POSITIVE_INFINITY,
    searchContext,
  ).score;
}

export function orderTeacherSearchMoves({
  board,
  currentDisc,
  isMaximizing,
  legalMoves,
  maximizingDisc,
  remainingDepth,
}: {
  board: Board;
  currentDisc: DiscColor;
  isMaximizing: boolean;
  legalMoves: SquareIndex[];
  maximizingDisc: DiscColor;
  remainingDepth?: number;
}): SquareIndex[] {
  if (remainingDepth !== undefined && remainingDepth <= 2) {
    return orderTeacherSearchMovesByStrategicEvaluation({
      board,
      currentDisc,
      isMaximizing,
      legalMoves,
      maximizingDisc,
    });
  }

  const opponentDisc = getNextDisc(currentDisc);
  const opponentCornerMovesBefore = getCornerMoveCount(board, opponentDisc);
  const opponentMobilityBefore = getLegalMoves(board, opponentDisc).length;
  const anchoredEdgeDifferenceBefore = getAnchoredEdgeDifference(
    board,
    currentDisc,
  );

  return legalMoves
    .map((move) => ({
      move,
      score: getTeacherMoveOrderingScore({
        anchoredEdgeDifferenceBefore,
        board,
        currentDisc,
        maximizingDisc,
        move,
        opponentCornerMovesBefore,
        opponentMobilityBefore,
      }),
    }))
    .sort((firstMove, secondMove) =>
      isMaximizing
        ? secondMove.score - firstMove.score
        : firstMove.score - secondMove.score,
    )
    .map(({ move }) => move);
}

function orderTeacherSearchMovesByStrategicEvaluation({
  board,
  currentDisc,
  isMaximizing,
  legalMoves,
  maximizingDisc,
}: {
  board: Board;
  currentDisc: DiscColor;
  isMaximizing: boolean;
  legalMoves: SquareIndex[];
  maximizingDisc: DiscColor;
}): SquareIndex[] {
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

function getTeacherMoveOrderingScore({
  anchoredEdgeDifferenceBefore,
  board,
  currentDisc,
  maximizingDisc,
  move,
  opponentCornerMovesBefore,
  opponentMobilityBefore,
}: {
  anchoredEdgeDifferenceBefore: number;
  board: Board;
  currentDisc: DiscColor;
  maximizingDisc: DiscColor;
  move: SquareIndex;
  opponentCornerMovesBefore: number;
  opponentMobilityBefore: number;
}): number {
  const boardAfterMove = placeDisc(board, move, currentDisc);
  const opponentDisc = getNextDisc(currentDisc);
  const opponentMovesAfter = getLegalMoves(boardAfterMove, opponentDisc);
  const opponentCornerMovesAfter = opponentMovesAfter.filter(isCorner).length;
  const opponentCornerMoveDelta =
    opponentCornerMovesAfter - opponentCornerMovesBefore;
  const opponentMobilityDelta =
    opponentMovesAfter.length - opponentMobilityBefore;
  const anchoredEdgeDelta =
    getAnchoredEdgeDifference(boardAfterMove, currentDisc) -
    anchoredEdgeDifferenceBefore;
  const moverScore =
    (isCorner(move) ? teacherMoveOrderingCornerBonus : 0) -
    Math.max(0, opponentCornerMoveDelta) *
      teacherMoveOrderingCornerAccessPenalty -
    (isDangerSquare(board, move) ? teacherMoveOrderingDangerSquarePenalty : 0) -
    opponentMobilityDelta * teacherMoveOrderingMobilityDeltaWeight +
    anchoredEdgeDelta * teacherMoveOrderingAnchoredEdgeBonus;
  const moverSign = currentDisc === maximizingDisc ? 1 : -1;

  return (
    strategicEvaluateBoard(boardAfterMove, maximizingDisc) +
    moverScore * moverSign
  );
}

function cacheTeacherSearchResult(
  searchContext: TeacherSearchContext,
  cacheKey: string,
  result: TeacherSearchResult,
): TeacherSearchResult {
  if (
    result.isExact &&
    searchContext.cache.size < searchContext.maxCacheEntries
  ) {
    searchContext.cache.set(cacheKey, result.score);
  }

  return result;
}

function createTeacherSearchCacheKey({
  board,
  currentDisc,
  depth,
  maximizingDisc,
}: {
  board: Board;
  currentDisc: DiscColor;
  depth: number;
  maximizingDisc: DiscColor;
}): string {
  return `${depth}:${currentDisc}:${maximizingDisc}:${board
    .map((cell) => {
      if (cell === "black") {
        return "b";
      }

      if (cell === "white") {
        return "w";
      }

      return "-";
    })
    .join("")}`;
}

function recordTeacherSearchCacheHit(
  searchContext: TeacherSearchContext,
): void {
  searchContext.cacheHitCount += 1;

  if (searchContext.stats !== undefined) {
    searchContext.stats.cacheHitCount = searchContext.cacheHitCount;
  }
}

function recordTeacherSearchNode(searchContext: TeacherSearchContext): void {
  searchContext.searchedNodeCount += 1;

  if (searchContext.stats !== undefined) {
    searchContext.stats.searchedNodeCount = searchContext.searchedNodeCount;
  }
}

function getCornerMoveCount(board: Board, disc: DiscColor): number {
  return getLegalMoves(board, disc).filter(isCorner).length;
}

function isCorner(square: SquareIndex): boolean {
  return (CORNER_SQUARES as readonly SquareIndex[]).includes(square);
}

function isDangerSquare(board: Board, square: SquareIndex): boolean {
  for (const [corner, dangerSquares] of teacherDangerSquaresByCorner) {
    if (board[corner] === null && dangerSquares.includes(square)) {
      return true;
    }
  }

  return false;
}

function getAnchoredEdgeDifference(board: Board, disc: DiscColor): number {
  return (
    getAnchoredEdgeCount(board, disc) -
    getAnchoredEdgeCount(board, getNextDisc(disc))
  );
}

function getAnchoredEdgeCount(board: Board, disc: DiscColor): number {
  return teacherEdgeRaysByCorner.reduce<number>(
    (count, { corner, directions }) =>
      count +
      directions.reduce<number>(
        (rayCount, direction) =>
          rayCount + getAnchoredEdgeRayCount(board, disc, corner, direction),
        0,
      ),
    0,
  );
}

function getAnchoredEdgeRayCount(
  board: Board,
  disc: DiscColor,
  corner: SquareIndex,
  direction: number,
): number {
  if (board[corner] !== disc) {
    return 0;
  }

  let count = 1;
  let square = corner + direction;

  while (isEdgeRaySquare(corner, direction, square) && board[square] === disc) {
    count += 1;
    square += direction;
  }

  return count;
}

function isEdgeRaySquare(
  corner: SquareIndex,
  direction: number,
  square: SquareIndex,
): boolean {
  if (square < 0 || square >= 64) {
    return false;
  }

  if (direction === 1 || direction === -1) {
    return Math.floor(square / 8) === Math.floor(corner / 8);
  }

  return square % 8 === corner % 8;
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
  guidanceMode: Exclude<TeacherGuidanceMode, "auto">,
): number {
  if (guidanceMode === "comeback") {
    return compareComebackTeacherGuidanceCandidates(
      firstCandidate,
      secondCandidate,
    );
  }

  const teacherScoreDifference =
    secondCandidate.teacherScore - firstCandidate.teacherScore;

  if (teacherScoreDifference !== 0) {
    return teacherScoreDifference;
  }

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

function compareComebackTeacherGuidanceCandidates(
  firstCandidate: TeacherGuidanceCandidate,
  secondCandidate: TeacherGuidanceCandidate,
): number {
  const teacherScoreDifference =
    secondCandidate.teacherScore - firstCandidate.teacherScore;

  if (teacherScoreDifference !== 0) {
    return teacherScoreDifference;
  }

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

  const pressureDifference =
    secondCandidate.opponentPressureScore - firstCandidate.opponentPressureScore;

  if (pressureDifference !== 0) {
    return pressureDifference;
  }

  return firstCandidate.scoreGapFromBest - secondCandidate.scoreGapFromBest;
}
