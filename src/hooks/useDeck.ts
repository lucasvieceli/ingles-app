import { useCallback, useEffect, useMemo, useState } from "react";

import { Card } from "../types";

type ScoreDeltaFn = (delta: number) => void;

const shuffleIndices = (indices: number[]) => {
  const shuffled = [...indices];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export function useDeck(
  cards: Card[],
  selectedBooks: string[],
  selectedCategories: string[],
  onScoreDelta: ScoreDeltaFn
) {
  const [index, setIndex] = useState(0);
  const [order, setOrder] = useState<number[]>([]);
  const [revealed, setRevealed] = useState(false);
  const [answers, setAnswers] = useState<Record<string, boolean | undefined>>(
    {}
  );

  const playableEntries = useMemo(() => {
    const normalizedBooks = selectedBooks
      .map((book) => book.trim())
      .filter(Boolean);
    const normalizedSelections = selectedCategories
      .map((cat) => cat.trim())
      .filter(Boolean);
    if (!normalizedBooks.length && !normalizedSelections.length) {
      return cards.map((card, i) => ({ card, index: i }));
    }
    const allowedBooks = new Set(normalizedBooks);
    const allowed = new Set(normalizedSelections);
    return cards
      .map((card, i) => ({ card, index: i }))
      .filter((entry) => {
        const cardBook = (entry.card.book || "").trim();
        const cardCategory = (entry.card.category || "").trim();
        const matchesBook = !allowedBooks.size || allowedBooks.has(cardBook);
        const matchesCategory = !allowed.size || allowed.has(cardCategory);
        return matchesBook && matchesCategory;
      });
  }, [cards, selectedBooks, selectedCategories]);

  const playableCount = playableEntries.length;

  const generateOrder = useCallback(
    () => shuffleIndices(playableEntries.map((entry) => entry.index)),
    [playableEntries]
  );

  useEffect(() => {
    const initialOrder = generateOrder();
    setOrder(initialOrder);
    setIndex(0);
    setRevealed(false);
    setAnswers({});
  }, [generateOrder]);

  useEffect(() => {
    if (order.length && index > order.length - 1) {
      setIndex(0);
    }
  }, [order.length, index]);

  const reshuffle = useCallback(() => {
    const nextOrder = generateOrder();
    setOrder(nextOrder);
    setIndex(0);
    setRevealed(false);
  }, [generateOrder]);

  const setCustomOrder = useCallback(
    (customOrder: number[]) => {
      const sanitized = customOrder.filter(
        (value) =>
          Number.isInteger(value) && value >= 0 && value < cards.length
      );
      setOrder(sanitized);
      setIndex(0);
      setRevealed(false);
    },
    [cards.length]
  );

  const clearAnswers = useCallback(() => setAnswers({}), []);

  const next = useCallback(() => {
    if (!order.length) return;
    setIndex((prev) => Math.min(prev + 1, Math.max(0, order.length - 1)));
    setRevealed(false);
  }, [order.length]);

  const prev = useCallback(() => {
    if (!order.length) return;
    setIndex((prev) => Math.max(prev - 1, 0));
    setRevealed(false);
  }, [order.length]);

  const hasOrder = order.length > 0;
  const safeIndex = hasOrder
    ? Math.min(Math.max(index, 0), Math.max(0, order.length - 1))
    : 0;
  const currentIdx = hasOrder ? order[safeIndex] : undefined;
  const current =
    Number.isInteger(currentIdx) &&
    (currentIdx as number) >= 0 &&
    (currentIdx as number) < cards.length
      ? cards[currentIdx as number]
      : undefined;

  const progress = useMemo(
    () =>
      order.reduce(
        (acc, value) => (answers[cards[value]?.id] !== undefined ? acc + 1 : acc),
        0
      ),
    [order, answers, cards]
  );
  const totalCards = order.length;
  const remainingCards = Math.max(totalCards - progress, 0);
  const progressPercent =
    totalCards > 0
      ? Math.min(100, Math.max(0, (progress / totalCards) * 100))
      : 0;
  const isDone = totalCards > 0 && progress >= totalCards;

  const handleAnswer = useCallback(
    (isCorrect: boolean) => {
      const card = current;
      if (!card) return;
      setAnswers((prev) => {
        const prevValue = prev[card.id];
        if (prevValue !== isCorrect) {
          const prevScoreContribution =
            prevValue === true ? 2 : prevValue === false ? -2 : 0;
          const nextScoreContribution = isCorrect ? 2 : -2;
          const delta = nextScoreContribution - prevScoreContribution;
          if (delta !== 0) {
            onScoreDelta(delta);
          }
        }
        return { ...prev, [card.id]: isCorrect };
      });
      next();
    },
    [current, next, onScoreDelta]
  );

  return {
    order,
    answers,
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
  };
}
