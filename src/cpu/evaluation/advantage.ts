import {
  getWinner,
  isGameOver,
  type Board,
  type DiscColor,
} from "../../game/othello";
import { solveExactEndgameDiscDifference } from "../search/exactEndgame";
import { countEmptySquares } from "./evaluationFeatures";
import { strategicEvaluateBoard } from "./strategicEvaluateBoard";

export type Advantage = {
  blackPercent: number;
  leadingDisc: DiscColor | null;
  whitePercent: number;
};

const evaluationScale = 220;
const exactEndgameAdvantageEmptyThreshold = 10;

export function calculateAdvantage(
  board: Board,
  currentDisc?: DiscColor,
): Advantage {
  if (isGameOver(board)) {
    return getFinalAdvantage(board);
  }

  if (
    currentDisc !== undefined &&
    countEmptySquares(board) <= exactEndgameAdvantageEmptyThreshold
  ) {
    return getExactEndgameAdvantage(board, currentDisc);
  }

  const blackScore = strategicEvaluateBoard(board, "black");
  const blackPercent = scoreToPercent(blackScore);
  const whitePercent = 100 - blackPercent;

  return {
    blackPercent,
    leadingDisc: getLeadingDisc(blackPercent, whitePercent),
    whitePercent,
  };
}

function getExactEndgameAdvantage(
  board: Board,
  currentDisc: DiscColor,
): Advantage {
  const blackFinalDifference = solveExactEndgameDiscDifference(
    board,
    currentDisc,
    "black",
  );

  if (blackFinalDifference === 0) {
    return {
      blackPercent: 50,
      leadingDisc: null,
      whitePercent: 50,
    };
  }

  return {
    blackPercent: blackFinalDifference > 0 ? 100 : 0,
    leadingDisc: blackFinalDifference > 0 ? "black" : "white",
    whitePercent: blackFinalDifference < 0 ? 100 : 0,
  };
}

function getFinalAdvantage(board: Board): Advantage {
  const winner = getWinner(board);

  if (winner === "draw") {
    return {
      blackPercent: 50,
      leadingDisc: null,
      whitePercent: 50,
    };
  }

  return {
    blackPercent: winner === "black" ? 100 : 0,
    leadingDisc: winner,
    whitePercent: winner === "white" ? 100 : 0,
  };
}

function scoreToPercent(score: number): number {
  return Math.round(50 + Math.tanh(score / evaluationScale) * 50);
}

function getLeadingDisc(
  blackPercent: number,
  whitePercent: number,
): DiscColor | null {
  if (blackPercent === whitePercent) {
    return null;
  }

  return blackPercent > whitePercent ? "black" : "white";
}
