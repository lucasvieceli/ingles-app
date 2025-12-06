import { useCallback, useEffect, useMemo, useState } from "react";

import { Card } from "../types";

const LS_KEY_ARRAY = "flashcards_selectedCats";
const LS_KEY_SINGLE = "flashcards_selectedCat";

const loadInitialSelection = (): string[] => {
  const raw =
    localStorage.getItem(LS_KEY_ARRAY) ??
    localStorage.getItem(LS_KEY_SINGLE);
  if (!raw || raw === "__all") return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return Array.from(
        new Set(
          parsed
            .filter((cat): cat is string => typeof cat === "string")
            .map((cat) => cat.trim())
            .filter(Boolean)
        )
      );
    }
  } catch {
    // Fallback para string simples
  }
  return Array.from(
    new Set(
      String(raw)
        .split(",")
        .map((cat) => cat.trim())
        .filter(Boolean)
    )
  );
};

const arraysEqual = (a: string[], b: string[]) =>
  a.length === b.length && a.every((value, index) => value === b[index]);

export function useCategorySelection(cards: Card[]) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    () => loadInitialSelection()
  );

  const categories = useMemo(
    () =>
      Array.from(
        new Set(
          cards.map((card) => (card.category || "").trim()).filter(Boolean)
        )
      ).sort(),
    [cards]
  );

  useEffect(() => {
    const sanitized = Array.from(
      new Set(
        selectedCategories.map((cat) => cat.trim()).filter(Boolean)
      )
    );
    if (!arraysEqual(sanitized, selectedCategories)) {
      setSelectedCategories(sanitized);
      return;
    }
    if (!sanitized.length) {
      localStorage.removeItem(LS_KEY_ARRAY);
      localStorage.setItem(LS_KEY_SINGLE, "__all");
      return;
    }
    const payload = JSON.stringify(sanitized);
    localStorage.setItem(LS_KEY_ARRAY, payload);
    localStorage.setItem(LS_KEY_SINGLE, sanitized[0] || "__all");
  }, [selectedCategories]);

  useEffect(() => {
    setSelectedCategories((prev) => {
      if (!prev.length) return prev;
      const available = new Set(categories);
      const filtered = prev.filter((cat) => available.has(cat));
      return filtered.length === prev.length ? prev : filtered;
    });
  }, [categories]);

  const isAllSelected = selectedCategories.length === 0;
  const categorySummary = useMemo(() => {
    if (isAllSelected) return "Todas as categorias";
    if (selectedCategories.length === 1) return selectedCategories[0];
    return `${selectedCategories.length} categorias selecionadas`;
  }, [isAllSelected, selectedCategories]);

  const toggleCategory = useCallback((category: string) => {
    const normalized = category.trim();
    if (!normalized) return;
    setSelectedCategories((prev) => {
      if (prev.includes(normalized)) {
        return prev.filter((cat) => cat !== normalized);
      }
      return [...prev, normalized];
    });
  }, []);

  const selectAllCategories = useCallback(() => {
    setSelectedCategories([]);
  }, []);

  return {
    categories,
    selectedCategories,
    isAllSelected,
    categorySummary,
    toggleCategory,
    selectAllCategories,
    setSelectedCategories,
  };
}

