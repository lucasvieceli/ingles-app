import React, { useEffect, useMemo, useRef, useState } from "react";

import { Card } from "../types";
import { saveCustomCards } from "../utils/storage";
import { generateId } from "../utils/uid";

type CreateTabProps = {
  cards: Card[];
  setCardsLocal: React.Dispatch<React.SetStateAction<Card[]>>;
};

const CreateTab: React.FC<CreateTabProps> = ({ cards, setCardsLocal }) => {
  const [en, setEn] = useState("");
  const [pt, setPt] = useState("");
  const [cat, setCat] = useState("");
  const [search, setSearch] = useState("");
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const [searchCat, setSearchCat] = useState("__all");

  const categories = useMemo(
    () =>
      Array.from(
        new Set(cards.map((card) => (card.category || "").trim()).filter(Boolean))
      ).sort(),
    [cards]
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return cards.filter((card) => {
      const cardCategory = (card.category || "").toLowerCase();
      const matchesText =
        !query ||
        card.en.toLowerCase().includes(query) ||
        card.pt.toLowerCase().includes(query) ||
        cardCategory.includes(query);
      const matchesCategory =
        searchCat === "__all" ? true : (card.category || "") === searchCat;
      return matchesText && matchesCategory;
    });
  }, [cards, search, searchCat]);

  const grouped = useMemo(
    () =>
      Array.from(
        filtered.reduce((acc, card) => {
          const key = (card.category || "").trim() || "__none";
          if (!acc.has(key)) acc.set(key, [] as Card[]);
          acc.get(key)!.push(card);
          return acc;
        }, new Map<string, Card[]>())
      )
        .map(([key, groupCards]) => ({
          key,
          label: key === "__none" ? "Sem categoria" : key,
          cards: groupCards,
        }))
        .sort((a, b) => a.label.localeCompare(b.label, "pt-BR")),
    [filtered]
  );

  useEffect(() => {
    if (expandedCat && !grouped.some((group) => group.key === expandedCat)) {
      setExpandedCat(null);
    }
  }, [grouped, expandedCat]);

  useEffect(() => {
    if (searchCat !== "__all") {
      setExpandedCat(searchCat);
    }
  }, [searchCat]);

  function addCard() {
    if (!en.trim() || !pt.trim()) return;
    setCardsLocal((prev) => {
      const newCards = [
        {
          id: generateId(),
          en: en.trim(),
          pt: pt.trim(),
          category: cat.trim() || undefined,
        },
        ...prev,
      ];

      saveCustomCards(newCards);
      return newCards;
    });
    setEn("");
    setPt("");
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
      const data = JSON.parse(jsonText) as
        | Card[]
        | { en: string; pt: string; category?: string }[];
      const normalized: Card[] = (data as any[])
        .map((item: any) => ({
          id: item.id || generateId(),
          en: String(item.en || ""),
          pt: String(item.pt || ""),
          category: item.category ? String(item.category) : undefined,
        }))
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
        <label className="text-xs uppercase tracking-[0.18em] text-slate-600">Categoria (opcional)</label>
        <input
          list="cats"
          value={cat}
          onChange={(event) => setCat(event.target.value)}
          placeholder="e.g., Frutas, Verbos, Casa"
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
            placeholder="Buscar por inglês, português ou categoria"
            className="rounded-xl px-3 py-2 sm:max-w-72 w-full bg-white border border-slate-200 text-slate-900 placeholder:text-slate-500 focus:ring-2 focus:ring-orange-400/70 focus:border-orange-400/60 transition"
          />
          <select
            value={searchCat}
            onChange={(event) => setSearchCat(event.target.value)}
            className="rounded-xl px-3 py-2 text-sm bg-white border border-slate-200 text-slate-900 focus:ring-2 focus:ring-emerald-400/70"
          >
            <option value="__all">Todas</option>
            {categories.map((category) => (
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
          {grouped.map(({ key, label, cards: groupedCards }) => {
            const isOpen = expandedCat === key;
            return (
              <div
                key={key}
                className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 flex flex-col gap-3"
              >
                <button
                  type="button"
                  onClick={() =>
                    setExpandedCat((prev) => (prev === key ? null : key))
                  }
                  className="text-left group"
                >
                  <div className="text-[11px] uppercase tracking-wide text-slate-500">
                    Categoria
                  </div>
                  <div className="mt-1 text-xl font-semibold text-slate-900 flex items-center gap-2">
                    {label}
                    <span className="h-2 w-2 rounded-full bg-emerald-400/70 animate-pulse" />
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
