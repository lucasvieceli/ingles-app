import React, { useEffect, useState } from "react";

import { useCategorySelection } from "../hooks/useCategorySelection";
import { useDeck } from "../hooks/useDeck";
import { useScore } from "../hooks/useScore";
import { useSpeechConfig } from "../hooks/useSpeechConfig";
import { Card } from "../types";
import CardSwipe from "./play/CardSwipe";
import CategoryDialog from "./play/CategoryDialog";
import ConfigDialog from "./play/ConfigDialog";
import ScorePanel from "./play/ScorePanel";

type PlayTabProps = {
  cards: Card[];
};

const PlayTab: React.FC<PlayTabProps> = ({ cards }) => {
  const [isCatDialogOpen, setIsCatDialogOpen] = useState(false);
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);

  const {
    categories,
    selectedCategories,
    isAllSelected,
    categorySummary,
    toggleCategory,
    selectAllCategories,
  } = useCategorySelection(cards);

  const {
    score,
    scoreChange,
    scoreDeltaDisplay,
    scoreDeltaText,
    applyScoreDelta,
  } = useScore();

  const {
    voices,
    rate,
    setRate,
    autoSpeak,
    setAutoSpeak,
    selectedVoiceEn,
    setSelectedVoiceEn,
    selectedVoicePt,
    setSelectedVoicePt,
    speak,
  } = useSpeechConfig();

  const {
    current,
    playableCount,
    revealed,
    setRevealed,
    next,
    prev,
    reshuffle,
    handleAnswer,
    clearAnswers,
    setCustomOrder,
    progress,
    totalCards,
    remainingCards,
    progressPercent,
    isDone,
    answers,
    order,
  } = useDeck(cards, selectedCategories, applyScoreDelta);

  useEffect(() => {
    if (isDone || !current || !autoSpeak) return;
    const langHint: "en" | "pt" = revealed ? "en" : "pt";
    const text = revealed ? current.en : current.pt;
    speak(text, langHint);
  }, [current?.id, revealed, autoSpeak, speak, isDone]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const key = event.key;
      if (key.toLowerCase() === "a" && revealed && current) {
        event.preventDefault();
        handleAnswer(true);
        return;
      }
      if (key.toLowerCase() === "d" && revealed && current) {
        event.preventDefault();
        handleAnswer(false);
        return;
      }
      if (key === "Enter") {
        event.preventDefault();
        setRevealed((prev) => !prev);
        return;
      }
      if (key === "ArrowUp") {
        setRevealed(true);
      } else if (key === "ArrowDown") {
        setRevealed(false);
      } else if (key === " " || key === "Spacebar" || event.code === "Space") {
        event.preventDefault();
        setRevealed((prev) => !prev);
      } else if (key === "ArrowRight") {
        next();
      } else if (key === "ArrowLeft") {
        prev();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [revealed, current, handleAnswer, next, prev, setRevealed]);

  const scorePanel = (
    <ScorePanel
      score={score}
      scoreChange={scoreChange}
      scoreDeltaDisplay={scoreDeltaDisplay}
      scoreDeltaText={scoreDeltaText}
    />
  );

  if (!cards.length) {
    return (
      <div className="grid gap-4">
        {scorePanel}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8 text-center text-slate-700">
          Cadastre alguns cards na aba <b>Cadastrar</b>.
        </div>
      </div>
    );
  }

  if (!playableCount) {
    return (
      <div className="grid gap-4">
        {scorePanel}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8 text-center text-slate-700">
          Não há cards nas categorias selecionadas.
        </div>
      </div>
    );
  }

  if (!order.length) {
    return (
      <div className="grid gap-4">
        {scorePanel}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8 text-center text-slate-700">
          Preparando os cards…
        </div>
      </div>
    );
  }

  if (isDone) {
    const wrongIndices = order.filter(
      (value) => answers[cards[value]?.id] === false
    );
    const rightIndices = order.filter(
      (value) => answers[cards[value]?.id] === true
    );

    const wrongCards = wrongIndices
      .map((value) => cards[value])
      .filter(Boolean) as Card[];
    const rightCards = rightIndices
      .map((value) => cards[value])
      .filter(Boolean) as Card[];

    function retryWrong() {
      if (!wrongIndices.length) return;
      setCustomOrder(wrongIndices);
      clearAnswers();
    }

    function resetAll() {
      reshuffle();
      clearAnswers();
    }

    return (
      <div className="grid gap-4">
        {scorePanel}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-2 text-slate-900">Resumo da rodada</h3>
          <p className="text-sm text-slate-600">
            Acertos: {rightIndices.length} • Erros: {wrongIndices.length} •
            Total: {order.length}
          </p>
          <div className="mt-4 flex gap-2 flex-wrap">
            {wrongCards.length ? (
              <button
                onClick={retryWrong}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 text-white font-semibold shadow-md"
              >
                Rever apenas errados
              </button>
            ) : null}
            <button
              onClick={resetAll}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-800 hover:bg-slate-50 transition"
            >
              Recomeçar tudo
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
            <h4 className="font-medium mb-3 text-slate-900">
              Errados ({wrongCards.length})
            </h4>
            {wrongCards.length ? (
              <ul className="grid gap-2">
                {wrongCards.map((card) => (
                  <li
                    key={card.id}
                    className="border border-slate-200 rounded-xl p-3 bg-slate-50 text-slate-800"
                  >
                    <div className="text-xs text-slate-500">EN</div>
                    <div className="font-semibold text-slate-900">{card.en}</div>
                    <div className="text-xs text-slate-500 mt-1">PT</div>
                    <div>{card.pt}</div>
                    {card.category ? (
                      <div className="mt-1 text-[11px] text-slate-500">
                        Categoria: {card.category}
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-sm text-slate-600">Nenhum 😊</div>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
            <h4 className="font-medium mb-3 text-slate-900">
              Acertos ({rightCards.length})
            </h4>
            {rightCards.length ? (
              <ul className="grid gap-2">
                {rightCards.map((card) => (
                  <li
                    key={card.id}
                    className="border border-slate-200 rounded-xl p-3 bg-slate-50 text-slate-800"
                  >
                    <div className="text-xs text-slate-500">EN</div>
                    <div className="font-semibold text-slate-900">{card.en}</div>
                    <div className="text-xs text-slate-500 mt-1">PT</div>
                    <div>{card.pt}</div>
                    {card.category ? (
                      <div className="mt-1 text-[11px] text-slate-500">
                        Categoria: {card.category}
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-sm text-slate-600">Nenhum ainda</div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <div className="flex justify-between items-center gap-3 flex-wrap">
        {scorePanel}

        <div className="items-center md:flex grid grid-cols-2 md:w-auto gap-2 w-full md:ml-auto flex-wrap">
          <button
            type="button"
            onClick={() => setIsCatDialogOpen(true)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-sm bg-white text-slate-800 hover:bg-slate-50 transition-colors flex items-center gap-2"
          >
            {categorySummary}
          </button>
          <button
            type="button"
            onClick={() => setIsConfigDialogOpen(true)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-sm bg-white text-slate-800 hover:bg-slate-50 transition-colors flex items-center gap-2"
          >
            ⚙️ Configurar voz
          </button>
          <button
            onClick={prev}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-800 hover:bg-slate-50 transition"
          >
            Anterior
          </button>
          <button
            onClick={next}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-800 hover:bg-slate-50 transition"
          >
            Próximo
          </button>
        </div>
      </div>

      {totalCards > 0 ? (
        <div className="w-full max-w-xl mx-auto">
          <div className="flex justify-between text-xs text-slate-600 mb-1">
            <span>
              Feitos: {progress} / {totalCards}
            </span>
            <span>Faltam: {remainingCards}</span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-500 via-amber-400 to-emerald-400 transition-all duration-200 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      ) : null}

      {!current ? (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8 text-center text-slate-700">
          <p className="mb-3">
            Não consegui localizar este card. Quer reembaralhar?
          </p>
          <button
            onClick={reshuffle}
            className="px-3 py-2 rounded-xl border border-slate-200 text-slate-800 hover:bg-slate-50 transition"
          >
            Reembaralhar
          </button>
        </div>
      ) : (
        <>
          <CardSwipe
            en={current.en}
            pt={current.pt}
            revealed={revealed}
            setRevealed={setRevealed}
            speak={speak}
          />

          <div className="flex items-center justify-center gap-3 mt-2">
            <button
              onClick={() => handleAnswer(true)}
              disabled={!revealed}
              className={`px-4 py-2 rounded-xl font-semibold shadow-lg transition ${
                revealed
                  ? "bg-gradient-to-r from-emerald-500 to-teal-400 text-white hover:scale-[1.01]"
                  : "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
              }`}
              title="Marcar como acertei (A)"
            >
              Acertei
            </button>
            <button
              onClick={() => handleAnswer(false)}
              disabled={!revealed}
              className={`px-4 py-2 rounded-xl font-semibold shadow-lg transition ${
                revealed
                  ? "bg-gradient-to-r from-rose-500 to-orange-400 text-white hover:scale-[1.01]"
                  : "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
              }`}
              title="Marcar como errei (D)"
            >
              Errei
            </button>
          </div>
        </>
      )}

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

      {isConfigDialogOpen ? (
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
          onClose={() => setIsConfigDialogOpen(false)}
        />
      ) : null}
    </div>
  );
};

export default PlayTab;
