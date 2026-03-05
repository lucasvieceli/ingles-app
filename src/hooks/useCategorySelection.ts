import { useCallback, useEffect, useMemo, useState } from "react";

import { Card } from "../types";

const LS_KEY_CATS_ARRAY = "flashcards_selectedCats";
const LS_KEY_CATS_SINGLE = "flashcards_selectedCat";
const LS_KEY_BOOKS_ARRAY = "flashcards_selectedBooks";
const LS_KEY_BOOKS_SINGLE = "flashcards_selectedBook";

const loadInitialSelection = (arrayKey: string, singleKey: string): string[] => {
  const raw =
    localStorage.getItem(arrayKey) ??
    localStorage.getItem(singleKey);
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
  const [selectedBooks, setSelectedBooks] = useState<string[]>(() =>
    loadInitialSelection(LS_KEY_BOOKS_ARRAY, LS_KEY_BOOKS_SINGLE)
  );
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    () => loadInitialSelection(LS_KEY_CATS_ARRAY, LS_KEY_CATS_SINGLE)
  );

  const books = useMemo(
    () =>
      Array.from(new Set(cards.map((card) => (card.book || "").trim()).filter(Boolean)))
        .sort((a, b) => a.localeCompare(b, "pt-BR")),
    [cards]
  );

  const categories = useMemo(
    () => {
      const selectedBooksSet = new Set(
        selectedBooks.map((book) => book.trim()).filter(Boolean)
      );
      return Array.from(
        new Set(
          cards
            .filter((card) =>
              !selectedBooksSet.size
                ? true
                : selectedBooksSet.has((card.book || "").trim())
            )
            .map((card) => (card.category || "").trim())
            .filter(Boolean)
        )
      ).sort((a, b) => a.localeCompare(b, "pt-BR"));
    },
    [cards, selectedBooks]
  );

  useEffect(() => {
    const sanitized = Array.from(
      new Set(selectedBooks.map((book) => book.trim()).filter(Boolean))
    );
    if (!arraysEqual(sanitized, selectedBooks)) {
      setSelectedBooks(sanitized);
      return;
    }
    if (!sanitized.length) {
      localStorage.removeItem(LS_KEY_BOOKS_ARRAY);
      localStorage.setItem(LS_KEY_BOOKS_SINGLE, "__all");
      return;
    }
    const payload = JSON.stringify(sanitized);
    localStorage.setItem(LS_KEY_BOOKS_ARRAY, payload);
    localStorage.setItem(LS_KEY_BOOKS_SINGLE, sanitized[0] || "__all");
  }, [selectedBooks]);

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
      localStorage.removeItem(LS_KEY_CATS_ARRAY);
      localStorage.setItem(LS_KEY_CATS_SINGLE, "__all");
      return;
    }
    const payload = JSON.stringify(sanitized);
    localStorage.setItem(LS_KEY_CATS_ARRAY, payload);
    localStorage.setItem(LS_KEY_CATS_SINGLE, sanitized[0] || "__all");
  }, [selectedCategories]);

  useEffect(() => {
    setSelectedBooks((prev) => {
      if (!prev.length) return prev;
      const available = new Set(books);
      const filtered = prev.filter((book) => available.has(book));
      return filtered.length === prev.length ? prev : filtered;
    });
  }, [books]);

  useEffect(() => {
    setSelectedCategories((prev) => {
      if (!prev.length) return prev;
      const available = new Set(categories);
      const filtered = prev.filter((cat) => available.has(cat));
      return filtered.length === prev.length ? prev : filtered;
    });
  }, [categories]);

  const isAllBooksSelected = selectedBooks.length === 0;
  const isAllCategoriesSelected = selectedCategories.length === 0;
  const isAllSelected = isAllBooksSelected && isAllCategoriesSelected;

  const bookSummary = useMemo(() => {
    if (isAllBooksSelected) return "Todos os livros";
    if (selectedBooks.length === 1) return selectedBooks[0];
    return `${selectedBooks.length} livros selecionados`;
  }, [isAllBooksSelected, selectedBooks]);

  const categorySummary = useMemo(() => {
    if (isAllCategoriesSelected) return "Todas as categorias";
    if (selectedCategories.length === 1) return selectedCategories[0];
    return `${selectedCategories.length} categorias selecionadas`;
  }, [isAllCategoriesSelected, selectedCategories]);

  const toggleBook = useCallback((book: string) => {
    const normalized = book.trim();
    if (!normalized) return;
    setSelectedBooks((prev) => {
      if (prev.includes(normalized)) {
        return prev.filter((value) => value !== normalized);
      }
      return [...prev, normalized];
    });
  }, []);

  const selectAllBooks = useCallback(() => {
    setSelectedBooks([]);
  }, []);

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

  const matchesCard = useCallback(
    (card: Card) => {
      const book = (card.book || "").trim();
      const category = (card.category || "").trim();
      const matchesBook =
        isAllBooksSelected || selectedBooks.includes(book);
      const matchesCategory =
        isAllCategoriesSelected || selectedCategories.includes(category);
      return matchesBook && matchesCategory;
    },
    [
      isAllBooksSelected,
      isAllCategoriesSelected,
      selectedBooks,
      selectedCategories,
    ]
  );

  return {
    books,
    selectedBooks,
    isAllBooksSelected,
    bookSummary,
    toggleBook,
    selectAllBooks,
    setSelectedBooks,
    categories,
    selectedCategories,
    isAllCategoriesSelected,
    isAllSelected,
    categorySummary,
    toggleCategory,
    selectAllCategories,
    setSelectedCategories,
    matchesCard,
  };
}
