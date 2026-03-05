import React, { useEffect, useMemo, useRef, useState } from "react";

import { Card } from "../types";
import { saveCustomCards } from "../utils/storage";
import { generateId } from "../utils/uid";

type CreateTabProps = {
  cards: Card[];
  setCardsLocal: React.Dispatch<React.SetStateAction<Card[]>>;
};

const LEGACY_CONNECTION_PREFIX_REGEX = /^Connection\s*-\s*(.+)$/i;

const normalizeBookAndCategory = (rawBook: unknown, rawCategory: unknown) => {
  const normalizedBookRaw =
    typeof rawBook === "string" ? rawBook.trim() : "";
  const normalizedCategoryRaw =
    typeof rawCategory === "string" ? rawCategory.trim() : "";

  let normalizedBook = normalizedBookRaw || undefined;
  let normalizedCategory = normalizedCategoryRaw || undefined;

  if (!normalizedBook && normalizedCategory) {
    const match = normalizedCategory.match(LEGACY_CONNECTION_PREFIX_REGEX);
    if (match) {
      normalizedBook = "Connection";
      normalizedCategory = match[1]?.trim() || undefined;
    }
  }

  return { book: normalizedBook, category: normalizedCategory };
};

const CreateTab: React.FC<CreateTabProps> = ({ cards, setCardsLocal }) => {
  const [en, setEn] = useState("");
  const [pt, setPt] = useState("");
  const [book, setBook] = useState("");
  const [cat, setCat] = useState("");
  const [search, setSearch] = useState("");
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [searchBook, setSearchBook] = useState("__all");
  const [searchCat, setSearchCat] = useState("__all");

  const books = useMemo(
    () =>
      Array.from(
        new Set(cards.map((card) => (card.book || "").trim()).filter(Boolean))
      ).sort((a, b) => a.localeCompare(b, "pt-BR")),
    [cards]
  );

  const categories = useMemo(
    () =>
      Array.from(
        new Set(cards.map((card) => (card.category || "").trim()).filter(Boolean))
      ).sort((a, b) => a.localeCompare(b, "pt-BR")),
    [cards]
  );

  const categoriesBySearchBook = useMemo(() => {
    return Array.from(
      new Set(
        cards
          .filter((card) =>
            searchBook === "__all" ? true : (card.book || "") === searchBook
          )
          .map((card) => (card.category || "").trim())
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [cards, searchBook]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return cards.filter((card) => {
      const cardBook = (card.book || "").toLowerCase();
      const cardCategory = (card.category || "").toLowerCase();
      const matchesText =
        !query ||
        card.en.toLowerCase().includes(query) ||
        card.pt.toLowerCase().includes(query) ||
        cardBook.includes(query) ||
        cardCategory.includes(query);
      const matchesBook = searchBook === "__all" ? true : (card.book || "") === searchBook;
      const matchesCategory =
        searchCat === "__all" ? true : (card.category || "") === searchCat;
      return matchesText && matchesBook && matchesCategory;
    });
  }, [cards, search, searchBook, searchCat]);

  const grouped = useMemo(
    () =>
      Array.from(
        filtered.reduce((acc, card) => {
          const groupBook = (card.book || "").trim() || "__none_book";
          const groupCategory = (card.category || "").trim() || "__none_category";
          const key = `${groupBook}::${groupCategory}`;
          if (!acc.has(key)) {
            acc.set(key, {
              book: groupBook,
              category: groupCategory,
              cards: [] as Card[],
            });
          }
          acc.get(key)!.cards.push(card);
          return acc;
        }, new Map<string, { book: string; category: string; cards: Card[] }>())
      )
        .map(([key, group]) => ({
          key,
          book: group.book === "__none_book" ? "" : group.book,
          category: group.category === "__none_category" ? "" : group.category,
          cards: group.cards,
        }))
        .sort((a, b) => {
          const labelA = `${a.book || "Sem livro"} • ${a.category || "Sem categoria"}`;
          const labelB = `${b.book || "Sem livro"} • ${b.category || "Sem categoria"}`;
          return labelA.localeCompare(labelB, "pt-BR");
        }),
    [filtered]
  );

  useEffect(() => {
    if (expandedGroup && !grouped.some((group) => group.key === expandedGroup)) {
      setExpandedGroup(null);
    }
  }, [grouped, expandedGroup]);

  useEffect(() => {
    if (searchCat !== "__all" && !categoriesBySearchBook.includes(searchCat)) {
      setSearchCat("__all");
    }
  }, [categoriesBySearchBook, searchCat]);

  useEffect(() => {
    if (searchBook === "__all" && searchCat === "__all") return;
    if (!grouped.length) return;
    setExpandedGroup(grouped[0].key);
  }, [grouped, searchBook, searchCat]);

  function addCard() {
    if (!en.trim() || !pt.trim()) return;
    const normalized = normalizeBookAndCategory(book, cat);
    setCardsLocal((prev) => {
      const newCards = [
        {
          id: generateId(),
          en: en.trim(),
          pt: pt.trim(),
          book: normalized.book,
          category: normalized.category,
        },
        ...prev,
      ];

      saveCustomCards(newCards);
      return newCards;
    });
    setEn("");
    setPt("");
    setBook("");
    setCat("");
  }

  function removeCard(id: string) {
    setCardsLocal((prev) => {
      const next = prev.filter((card) => card.id !== id);
      saveCustomCards(next);
      return next;
    });
  }

  function importJson(jsonText: string) {
    try {
      const data = JSON.parse(jsonText) as unknown;
      if (!Array.isArray(data)) {
        throw new Error("JSON deve ser uma lista de cards");
      }
      const normalized: Card[] = data
        .map((item: any) => {
          const normalizedFields = normalizeBookAndCategory(item.book, item.category);
          return {
            id: item.id || generateId(),
            en: String(item.en || "").trim(),
            pt: String(item.pt || "").trim(),
            book: normalizedFields.book,
            category: normalizedFields.category,
          };
        })
        .filter((card) => card.en && card.pt);
      setCardsLocal((prev) => {
        const next = [...normalized, ...prev];
        saveCustomCards(next);
        return next;
      });
    } catch (error) {
      alert("JSON inválido");
    }
  }

  function exportJson() {
    const blob = new Blob([JSON.stringify(cards, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "flashcards_en_pt.json";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-3 bg-white border border-slate-200 p-5 sm:p-6 rounded-2xl shadow-sm">
        <label className="text-xs uppercase tracking-[0.18em] text-slate-600">Palavra em inglês</label>
        <input
          value={en}
          onChange={(event) => setEn(event.target.value)}
          placeholder="e.g., apple"
          className="rounded-xl px-3 py-2 bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-orange-400/70 focus:border-orange-400/60 transition"
        />
        <label className="text-xs uppercase tracking-[0.18em] text-slate-600">Tradução em português</label>
        <input
          value={pt}
          onChange={(event) => setPt(event.target.value)}
          placeholder="e.g., maçã"
          className="rounded-xl px-3 py-2 bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-orange-400/70 focus:border-orange-400/60 transition"
        />
        <label className="text-xs uppercase tracking-[0.18em] text-slate-600">Livro (opcional)</label>
        <input
          list="books"
          value={book}
          onChange={(event) => setBook(event.target.value)}
          placeholder="e.g., Connection"
          className="rounded-xl px-3 py-2 bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-orange-400/70 focus:border-orange-400/60 transition"
        />
        <datalist id="books">
          {books.map((bookItem) => (
            <option key={bookItem} value={bookItem} />
          ))}
        </datalist>
        <label className="text-xs uppercase tracking-[0.18em] text-slate-600">Categoria (opcional)</label>
        <input
          list="cats"
          value={cat}
          onChange={(event) => setCat(event.target.value)}
          placeholder="e.g., 1 - A, Verbos, Casa"
          className="rounded-xl px-3 py-2 bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-orange-400/70 focus:border-orange-400/60 transition"
        />
        <datalist id="cats">
          {categories.map((category) => (
            <option key={category} value={category} />
          ))}
        </datalist>
        <div className="flex gap-2 pt-2 flex-col sm:flex-row">
          <button
            onClick={addCard}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 via-amber-400 to-yellow-400 text-white font-semibold shadow-md hover:translate-y-[-1px] active:translate-y-[1px] transition-transform"
          >
            Adicionar
          </button>
          <button
            onClick={exportJson}
            className="px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-medium hover:bg-slate-100 transition"
          >
            Exportar JSON
          </button>
          <ImportButton onImport={importJson} />
        </div>
      </div>

      <div className="flex md:items-center justify-between gap-3 flex-wrap flex-col sm:flex-row bg-slate-50 border border-slate-200 rounded-2xl p-3">
        <div className="flex md:items-center gap-2 flex-col sm:flex-row w-full sm:w-auto">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por inglês, português, livro ou categoria"
            className="rounded-xl px-3 py-2 sm:max-w-72 w-full bg-white border border-slate-200 text-slate-900 placeholder:text-slate-500 focus:ring-2 focus:ring-orange-400/70 focus:border-orange-400/60 transition"
          />
          <select
            value={searchBook}
            onChange={(event) => setSearchBook(event.target.value)}
            className="rounded-xl px-3 py-2 text-sm bg-white border border-slate-200 text-slate-900 focus:ring-2 focus:ring-amber-400/70"
          >
            <option value="__all">Todos os livros</option>
            {books.map((bookItem) => (
              <option key={bookItem} value={bookItem}>
                {bookItem}
              </option>
            ))}
          </select>
          <select
            value={searchCat}
            onChange={(event) => setSearchCat(event.target.value)}
            className="rounded-xl px-3 py-2 text-sm bg-white border border-slate-200 text-slate-900 focus:ring-2 focus:ring-emerald-400/70"
          >
            <option value="__all">Todas as categorias</option>
            {categoriesBySearchBook.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
        <h2 className="text-lg font-semibold text-slate-900">
          Seus cards ({cards.length})
        </h2>
      </div>

      {grouped.length ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {grouped.map(({ key, book: groupBook, category: groupCategory, cards: groupedCards }) => {
            const isOpen = expandedGroup === key;
            return (
              <div
                key={key}
                className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 flex flex-col gap-3"
              >
                <button
                  type="button"
                  onClick={() =>
                    setExpandedGroup((prev) => (prev === key ? null : key))
                  }
                  className="text-left group"
                >
                  <div className="text-[11px] uppercase tracking-wide text-slate-500">
                    Livro / Categoria
                  </div>
                  <div className="mt-1 text-xl font-semibold text-slate-900 flex items-center gap-2">
                    {groupBook || "Sem livro"}
                    <span className="h-2 w-2 rounded-full bg-emerald-400/70 animate-pulse" />
                  </div>
                  <div className="text-sm text-slate-600 mt-1">
                    {groupCategory || "Sem categoria"}
                  </div>
                  <div className="text-xs text-slate-500 mt-2">
                    {groupedCards.length}{" "}
                    {groupedCards.length === 1 ? "card" : "cards"}
                  </div>
                </button>

                {isOpen ? (
                  <ul className="grid gap-3">
                    {groupedCards.map((card) => (
                      <li
                        key={card.id}
                        className="border border-slate-200 rounded-2xl p-3 flex flex-col gap-2 bg-slate-50"
                      >
                        <div className="text-[11px] uppercase tracking-wide text-slate-500">EN</div>
                        <div className="text-lg font-semibold text-slate-900">{card.en}</div>
                        <div className="text-[11px] uppercase tracking-wide text-slate-500">PT</div>
                        <div className="text-base text-slate-800">{card.pt}</div>
                        {card.book || card.category ? (
                          <div className="text-xs text-slate-500">
                            {card.book ? `Livro: ${card.book}` : ""}
                            {card.book && card.category ? " • " : ""}
                            {card.category ? `Categoria: ${card.category}` : ""}
                          </div>
                        ) : null}
                        <div className="pt-2 flex justify-end">
                          <button
                            onClick={() => removeCard(card.id)}
                            className="text-xs px-3 py-1 rounded-lg border border-slate-200 text-slate-700 hover:bg-white transition"
                          >
                            Excluir
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-sm text-slate-500">
          Nenhum card encontrado para os filtros atuais.
        </div>
      )}
    </div>
  );
};

const ImportButton: React.FC<{ onImport: (jsonText: string) => void }> = ({
  onImport,
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = () => onImport(String(reader.result || ""));
          reader.readAsText(file);
          event.currentTarget.value = "";
        }}
      />
      <button
        onClick={() => inputRef.current?.click()}
        className="px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-medium hover:bg-slate-100 transition"
      >
        Importar JSON
      </button>
    </>
  );
};

export default CreateTab;
