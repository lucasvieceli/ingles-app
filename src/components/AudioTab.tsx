import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Card } from "../types";
import { useSpeechConfig } from "../hooks/useSpeechConfig";
import { useCategorySelection } from "../hooks/useCategorySelection";
import ConfigDialog from "./play/ConfigDialog";
import CategoryDialog from "./play/CategoryDialog";

type AudioTabProps = {
  cards: Card[];
};

const GAP_BEFORE_EN_MS = 180;
const GAP_BETWEEN_CARDS_MS = 500;

const AudioTab: React.FC<AudioTabProps> = ({ cards }) => {
  const {
    voices,
    selectedVoiceEn,
    selectedVoicePt,
    rate,
    setRate,
    autoSpeak,
    setAutoSpeak,
    setSelectedVoiceEn,
    setSelectedVoicePt,
    speak,
  } = useSpeechConfig();

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<"idle" | "pt" | "en">("idle");
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isCatDialogOpen, setIsCatDialogOpen] = useState(false);

  const playingRef = useRef(false);
  const sessionRef = useRef(0);
  const gapTimeoutRef = useRef<number | null>(null);

  const {
    categories,
    selectedCategories,
    isAllSelected,
    categorySummary,
    toggleCategory,
    selectAllCategories,
  } = useCategorySelection(cards);

  const filteredCards = useMemo(() => {
    if (isAllSelected) return cards;
    const selectedSet = new Set(selectedCategories);
    return cards.filter((card) => selectedSet.has((card.category || "").trim()));
  }, [cards, isAllSelected, selectedCategories]);

  const total = filteredCards.length;
  const currentCard = filteredCards[currentIndex];

  const clearGapTimeout = useCallback(() => {
    if (gapTimeoutRef.current !== null) {
      clearTimeout(gapTimeoutRef.current);
      gapTimeoutRef.current = null;
    }
  }, []);

  const stopPlayback = useCallback(() => {
    playingRef.current = false;
    sessionRef.current += 1;
    clearGapTimeout();
    setIsPlaying(false);
    setPhase("idle");
    window?.speechSynthesis?.cancel();
  }, [clearGapTimeout]);

  const playCard = useCallback(
    (index: number) => {
      const currentSession = sessionRef.current;
      if (!playingRef.current) return;
      const card = filteredCards[index];
      if (!card) {
        stopPlayback();
        return;
      }

      setCurrentIndex(index);
      setPhase("pt");

      speak(card.pt, "pt", {
        cancelOthers: true,
        onEnd: () => {
          if (!playingRef.current || sessionRef.current !== currentSession) return;
          setPhase("en");
          clearGapTimeout();
          gapTimeoutRef.current = window.setTimeout(() => {
            if (!playingRef.current || sessionRef.current !== currentSession) return;
            speak(card.en, "en", {
              cancelOthers: true,
              onEnd: () => {
                if (!playingRef.current || sessionRef.current !== currentSession) return;
                const nextIndex = index + 1;
                if (nextIndex >= filteredCards.length) {
                  stopPlayback();
                  return;
                }
                clearGapTimeout();
                gapTimeoutRef.current = window.setTimeout(() => {
                  if (!playingRef.current || sessionRef.current !== currentSession) return;
                  playCard(nextIndex);
                }, GAP_BETWEEN_CARDS_MS);
              },
            });
          }, GAP_BEFORE_EN_MS);
        },
      });
    },
    [clearGapTimeout, filteredCards, speak, stopPlayback]
  );

  const startFrom = useCallback(
    (index: number) => {
      if (!filteredCards.length) return;
      sessionRef.current += 1;
      playingRef.current = true;
      setIsPlaying(true);
      playCard(index);
    },
    [filteredCards.length, playCard]
  );

  const handleNext = useCallback(() => {
    if (!filteredCards.length) return;
    const next = Math.min(filteredCards.length - 1, currentIndex + 1);
    window?.speechSynthesis?.cancel();
    if (isPlaying) {
      sessionRef.current += 1;
      playCard(next);
    } else {
      setCurrentIndex(next);
      setPhase("idle");
    }
  }, [filteredCards.length, currentIndex, isPlaying, playCard]);

  const handlePrevious = useCallback(() => {
    if (!filteredCards.length) return;
    const prev = Math.max(0, currentIndex - 1);
    window?.speechSynthesis?.cancel();
    if (isPlaying) {
      sessionRef.current += 1;
      playCard(prev);
    } else {
      setCurrentIndex(prev);
      setPhase("idle");
    }
  }, [filteredCards.length, currentIndex, isPlaying, playCard]);

  const progressLabel = useMemo(() => {
    if (!filteredCards.length) return "Nenhum card";
    return `${currentIndex + 1}/${filteredCards.length}`;
  }, [filteredCards.length, currentIndex]);

  useEffect(() => {
    if (!filteredCards.length) {
      stopPlayback();
      setCurrentIndex(0);
      setPhase("idle");
      return;
    }
    setCurrentIndex((prev) => Math.min(prev, Math.max(filteredCards.length - 1, 0)));
  }, [filteredCards, stopPlayback]);

  useEffect(() => stopPlayback, [stopPlayback]);

  if (!cards.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-700">
        Cadastre ou importe cards para usar o modo só áudio.
      </div>
    );
  }

  if (!filteredCards.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-700 space-y-3">
        <div>Não há cards nas categorias selecionadas.</div>
        <button
          onClick={() => setIsCatDialogOpen(true)}
          className="px-4 py-2 rounded-xl border border-slate-200 text-slate-800 hover:bg-slate-50"
        >
          Escolher categorias
        </button>
        {isCatDialogOpen ? (
          <CategoryDialog
            categories={categories}
            selected={selectedCategories}
            isAllSelected={isAllSelected}
            onToggle={toggleCategory}
            onSelectAll={selectAllCategories}
            onClose={() => setIsCatDialogOpen(false)}
          />
        ) : null}
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded-full px-3 py-1">
          <span className="text-slate-800 font-semibold">{progressLabel}</span>
          <span>•</span>
          <span>{phase === "pt" ? "Falando em português" : phase === "en" ? "Falando em inglês" : "Pronto para tocar"}</span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsCatDialogOpen(true)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-sm bg-white text-slate-800 hover:bg-slate-50 transition-colors flex items-center gap-2"
          >
            🗂️ {categorySummary}
          </button>
          <button
            onClick={() => setIsConfigOpen(true)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-sm bg-white text-slate-800 hover:bg-slate-50 transition-colors flex items-center gap-2"
          >
            ⚙️ Configurar voz
          </button>
          <button
            onClick={handlePrevious}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-sm bg-white text-slate-800 hover:bg-slate-50 transition-colors"
            disabled={currentIndex === 0}
          >
            ← Anterior
          </button>
          <button
            onClick={handleNext}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-sm bg-white text-slate-800 hover:bg-slate-50 transition-colors"
            disabled={currentIndex >= total - 1}
          >
            Próximo →
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Modo só áudio</p>
            <h4 className="text-lg font-semibold text-slate-900">{currentCard?.pt} → {currentCard?.en}</h4>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {isPlaying ? (
              <button
                onClick={stopPlayback}
                className="px-4 py-2 rounded-xl bg-red-500 text-white font-semibold shadow-sm"
              >
                ⏹ Parar
              </button>
            ) : (
              <button
                onClick={() => startFrom(currentIndex)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 text-white font-semibold shadow-sm"
              >
                ▶️ Tocar a partir daqui
              </button>
            )}
            {!isPlaying ? (
              <button
                onClick={() => startFrom(0)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-800 hover:bg-slate-50"
              >
                ↺ Recomeçar do início
              </button>
            ) : null}
          </div>
        </div>

        <p className="mt-3 text-sm text-slate-600">
          O app fala cada card em português e depois em inglês. Ajuste a voz em "Configurar voz". Você pode parar ou pular a qualquer momento.
        </p>
      </div>

      {isConfigOpen ? (
        <ConfigDialog
          voices={voices}
          selectedVoiceEn={selectedVoiceEn}
          selectedVoicePt={selectedVoicePt}
          rate={rate}
          autoSpeak={autoSpeak}
          onSelectVoiceEn={setSelectedVoiceEn}
          onSelectVoicePt={setSelectedVoicePt}
          onRateChange={setRate}
          onToggleAutoSpeak={setAutoSpeak}
          onClose={() => setIsConfigOpen(false)}
        />
      ) : null}
      {isCatDialogOpen ? (
        <CategoryDialog
          categories={categories}
          selected={selectedCategories}
          isAllSelected={isAllSelected}
          onToggle={toggleCategory}
          onSelectAll={selectAllCategories}
          onClose={() => setIsCatDialogOpen(false)}
        />
      ) : null}
    </div>
  );
};

export default AudioTab;
