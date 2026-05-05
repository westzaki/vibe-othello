import { getNextDisc, type DiscColor } from "./othello";
import type { PlayerSettings } from "./players";
import type { GameSession, MoveRecord } from "./session";
import {
  createPassNotice,
  type GameSessionNotice,
} from "./sessionTurn";

export function getUndoTargetMove(
  session: GameSession,
  players: PlayerSettings,
): MoveRecord | null {
  if (session.status !== "playing" || session.moveHistory.length === 0) {
    return null;
  }

  const lastMove = session.moveHistory.at(-1);

  if (lastMove === undefined) {
    return null;
  }

  const humanDisc = getSingleHumanDisc(players);

  if (humanDisc === null) {
    return lastMove;
  }

  if (lastMove.disc === humanDisc) {
    return lastMove;
  }

  const previousMove = session.moveHistory.at(-2);

  return previousMove?.disc === humanDisc ? previousMove : null;
}

export function getUndoNotice(
  currentDisc: DiscColor,
  previousMove: MoveRecord | null,
): GameSessionNotice | null {
  if (previousMove === null || previousMove.disc !== currentDisc) {
    return null;
  }

  return createPassNotice(getNextDisc(currentDisc), currentDisc);
}

function getSingleHumanDisc(players: PlayerSettings): DiscColor | null {
  const blackIsHuman = players.black.type === "human";
  const whiteIsHuman = players.white.type === "human";

  if (blackIsHuman === whiteIsHuman) {
    return null;
  }

  return blackIsHuman ? "black" : "white";
}
