import { useCallback, useEffect, useRef, useState } from "react";

import { LS_SCORE_KEY } from "../utils/storage";

type ScoreTrend = "up" | "down" | null;

export function useScore() {
  const [score, setScore] = useState(() => {
    const raw = Number(localStorage.getItem(LS_SCORE_KEY));
    return Number.isFinite(raw) ? raw : 0;
  });
  const [scoreChange, setScoreChange] = useState<ScoreTrend>(null);
  const [scoreDeltaDisplay, setScoreDeltaDisplay] = useState<number | null>(
    null
  );
  const timeoutRef = useRef<number | null>(null);

  const applyScoreDelta = useCallback((delta: number) => {
    if (!delta) return;
    setScore((prev) => prev + delta);
    setScoreDeltaDisplay(delta);
    setScoreChange(delta > 0 ? "up" : "down");
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = window.setTimeout(() => {
      setScoreChange(null);
      setScoreDeltaDisplay(null);
    }, 800);
  }, []);

  useEffect(() => {
    localStorage.setItem(LS_SCORE_KEY, String(score));
  }, [score]);

  useEffect(
    () => () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    },
    []
  );

  const scoreDeltaText =
    scoreDeltaDisplay !== null
      ? scoreDeltaDisplay > 0
        ? `+${scoreDeltaDisplay}`
        : `${scoreDeltaDisplay}`
      : "+0";

  return {
    score,
    scoreChange,
    scoreDeltaDisplay,
    scoreDeltaText,
    applyScoreDelta,
  };
}

