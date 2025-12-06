import React from "react";

type ScoreTrend = "up" | "down" | null;

type ScorePanelProps = {
  score: number;
  scoreChange: ScoreTrend;
  scoreDeltaText: string;
  scoreDeltaDisplay: number | null;
};

const ScorePanel: React.FC<ScorePanelProps> = ({
  score,
  scoreChange,
  scoreDeltaText,
  scoreDeltaDisplay,
}) => {
  const scoreNumberClass = `text-lg font-semibold transform transition duration-300 ${
    scoreChange === "up"
      ? "text-green-600 scale-110"
      : scoreChange === "down"
      ? "text-red-600 scale-90"
      : "text-slate-900 scale-100"
  }`;

  const scoreDeltaClass = `text-xs font-semibold transition-opacity duration-300 ${
    scoreDeltaDisplay === null
      ? "opacity-0 text-slate-400"
      : scoreDeltaDisplay > 0
      ? "text-green-600 opacity-100"
      : "text-red-600 opacity-100"
  }`;

  return (
    <div className="flex items-center justify-center sm:justify-start gap-3 px-3 py-1.5 bg-white rounded-xl border shadow-sm mx-auto sm:mx-0">
      <div className="text-xs uppercase tracking-wide text-slate-500 text-center sm:text-left">
        Pontuação
      </div>
      <div className="flex items-center gap-2">
        <span className={scoreNumberClass}>{score}</span>
        <span className={scoreDeltaClass}>{scoreDeltaText}</span>
      </div>
    </div>
  );
};

export default ScorePanel;

