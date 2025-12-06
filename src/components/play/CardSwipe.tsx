import React, { useCallback } from "react";

type CardSwipeProps = {
  en: string;
  pt: string;
  revealed: boolean;
  setRevealed: (state: boolean) => void;
  speak: (text: string, langHint?: "en" | "pt") => void;
};

const CardSwipe: React.FC<CardSwipeProps> = ({
  en,
  pt,
  revealed,
  setRevealed,
  speak,
}) => {
  const speakPortuguese = useCallback(
    (event?: React.MouseEvent) => {
      event?.stopPropagation();
      speak(pt, "pt");
    },
    [pt, speak]
  );

  const speakEnglish = useCallback(
    (event?: React.MouseEvent) => {
      event?.stopPropagation();
      speak(en, "en");
    },
    [en, speak]
  );

  function onClickToggle() {
    setRevealed(!revealed);
  }

  return (
    <div
      className="relative h-[300px] w-full max-w-xl mx-auto cursor-pointer overflow-hidden border border-slate-200"
      onClick={onClickToggle}
    >
      <div className="absolute inset-0 bg-white rounded-2xl shadow-lg p-6 flex flex-col items-center justify-center z-0">
        <span className="text-xs uppercase tracking-wide text-slate-400">
          Português
        </span>
        <div className="mt-2 text-2xl sm:text-3xl font-bold text-center break-words flex items-center gap-3">
          {pt}
          <button
            onClick={speakPortuguese}
            className="ml-2 p-2 rounded-full bg-slate-200 hover:bg-slate-300"
            title="Repetir pronúncia"
          >
            🔊
          </button>
        </div>
      </div>

      <div
        className={`absolute inset-0 rounded-2xl p-6 flex flex-col items-center justify-center bg-slate-900 text-white transition-opacity duration-150 ${
          revealed ? "opacity-100 z-10" : "opacity-0 pointer-events-none z-10"
        }`}
      >
        <span className="text-xs uppercase tracking-wide text-white/70">
          Inglês
        </span>
        <div className="mt-2 text-2xl sm:text-3xl font-semibold text-center break-words flex items-center gap-3">
          {en}
          <button
            onClick={speakEnglish}
            className="ml-2 p-2 rounded-full bg-white/20 hover:bg-white/30"
            title="Repetir pronúncia"
          >
            🔊
          </button>
        </div>
        <div className="mt-3 text-xs opacity-70">
          Clique novamente para ocultar
        </div>
      </div>
    </div>
  );
};

export default CardSwipe;
