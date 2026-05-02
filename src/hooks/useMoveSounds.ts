import { useEffect } from "react";
import { playFlipDiscSound, playPlaceDiscSound } from "../audio/gameSounds";

const firstFlipSoundDelayMs = 110;
const flipSoundDelayMs = 70;

type UseMoveSoundsParams = {
  flipAnimationId: number;
  flippedSquares: number[];
};

export function useMoveSounds({
  flipAnimationId,
  flippedSquares,
}: UseMoveSoundsParams) {
  useEffect(() => {
    if (flipAnimationId === 0) {
      return;
    }

    playPlaceDiscSound();

    const timeoutIds = flippedSquares.map((_, index) =>
      window.setTimeout(
        playFlipDiscSound,
        firstFlipSoundDelayMs + index * flipSoundDelayMs,
      ),
    );

    return () => {
      for (const timeoutId of timeoutIds) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [flipAnimationId, flippedSquares]);
}
