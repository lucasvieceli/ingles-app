import React, { useCallback, useMemo, useRef, useState } from "react";

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
  const [dragStartX, setDragStartX] = useState<number | null>(null);
  const [dragDeltaX, setDragDeltaX] = useState(0);
  const skipClickRef = useRef(false);
  const [isDragging, setIsDragging] = useState(false);

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
    if (skipClickRef.current) {
      skipClickRef.current = false;
      return;
    }
    setRevealed(!revealed);
  }

  function onPointerDown(event: React.PointerEvent) {
    setDragStartX(event.clientX);
    setDragDeltaX(0);
    setIsDragging(true);
    (event.target as HTMLElement).setPointerCapture?.(event.pointerId);
  }

  function onPointerMove(event: React.PointerEvent) {
    if (dragStartX === null) return;
    setDragDeltaX(event.clientX - dragStartX);
    if (Math.abs(event.clientX - dragStartX) > 8) {
      skipClickRef.current = true;
    }
  }

  function onPointerEnd(event?: React.PointerEvent) {
    if (dragStartX === null) return;
    const totalDelta = dragDeltaX;
    setDragStartX(null);
    setDragDeltaX(0);
    setIsDragging(false);
    (event?.target as HTMLElement | undefined)?.releasePointerCapture?.(
      event.pointerId
    );
    if (Math.abs(totalDelta) > 60) {
      skipClickRef.current = true;
      setRevealed((prev) => !prev);
    }
  }

  const dragTilt = useMemo(() => {
    const clamped = Math.max(-10, Math.min(10, dragDeltaX / 6));
    return dragStartX === null ? 0 : clamped;
  }, [dragDeltaX, dragStartX]);

  const rotationDeg = useMemo(() => {
    const base = revealed ? 180 : 0;
    if (!isDragging) return base;
    const preview = base + dragDeltaX / 2; // suaviza a rotação
    return Math.max(-20, Math.min(380, preview));
  }, [dragDeltaX, isDragging, revealed]);

  return (
    <div
      className="relative h-[340px] w-full max-w-xl mx-auto cursor-pointer"
      onClick={onClickToggle}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
      role="button"
      aria-label={revealed ? "Ocultar tradução" : "Revelar tradução"}
      style={{ perspective: "1400px" }}
    >
      <div
        className={`relative h-full w-full rounded-[32px] ${
          isDragging ? "transition-none" : "transition-transform duration-500"
        } shadow-xl`}
        style={{
          transform: `rotateY(${rotationDeg}deg) rotateZ(${dragTilt}deg)`,
          transformStyle: "preserve-3d",
        }}
      >
        <div className="absolute inset-0 rounded-[32px] p-8 flex flex-col items-center justify-center text-center text-slate-800 backface-hidden [backface-visibility:hidden] bg-gradient-to-br from-orange-50 via-white to-amber-50 border border-slate-200">
          <span className="text-[11px] uppercase tracking-[0.2em] text-slate-500">
            Português
          </span>
          <div className="mt-3 text-2xl sm:text-3xl font-bold break-words flex items-center gap-3 text-slate-900">
            {pt}
            <button
              onClick={speakPortuguese}
              className="ml-2 p-2 rounded-full bg-white border border-slate-200 hover:bg-slate-50 transition"
              title="Repetir pronúncia"
            >
              🔊
            </button>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Arraste ou clique para virar e ver em inglês.
          </p>
        </div>

        <div
          className="absolute inset-0 rounded-[32px] p-8 flex flex-col items-center justify-center bg-gradient-to-br from-orange-500 via-amber-400 to-yellow-300 text-slate-900 [backface-visibility:hidden] border border-amber-200"
          style={{ transform: "rotateY(180deg)" }}
        >
          <span className="text-[11px] uppercase tracking-[0.2em] text-slate-900/70">
            Inglês
          </span>
          <div className="mt-3 text-2xl sm:text-3xl font-semibold text-center break-words flex items-center gap-3">
            {en}
            <button
              onClick={speakEnglish}
              className="ml-2 p-2 rounded-full bg-white/70 text-slate-900 border border-white/80 hover:bg-white transition"
              title="Repetir pronúncia"
            >
              🔊
            </button>
          </div>
          <div className="mt-3 text-xs text-slate-900/70">
            Clique ou arraste para voltar
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardSwipe;
