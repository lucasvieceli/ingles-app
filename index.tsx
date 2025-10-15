import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { defaultCards } from "./src/cards";
// --- Types
export type Card = { id: string; en: string; pt: string; category?: string };

// --- Utilities
const uid = () => Math.random().toString(36).slice(2, 10);
const LS_KEY = "flashcards_en_pt_v1";
const save = (cards: Card[]) =>
  localStorage.setItem(LS_KEY, JSON.stringify(cards));
const load = (): Card[] => {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as Card[]) : [];
  } catch {
    return [];
  }
};

const normalizeLang = (value?: string) =>
  (value || "").toLowerCase().replace(/_/g, "-");

// --- Main App
export default function App() {
  const [cardsLocal, setCardsLocal] = useState<Card[]>(load());
  const [tab, setTab] = useState<"create" | "play">("create");

  const cards = useMemo(() => [...defaultCards, ...cardsLocal], [cardsLocal]);

  // useEffect(() => save(cardsLocal), [cardsLocal]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Flashcards
          </h1>
          <nav className="flex gap-2">
            <button
              onClick={() => setTab("create")}
              className={`px-3 py-2 rounded-xl text-sm font-medium shadow-sm ${
                tab === "create" ? "bg-slate-900 text-white" : "bg-white"
              }`}
            >
              Cadastrar
            </button>
            <button
              onClick={() => setTab("play")}
              className={`px-3 py-2 rounded-xl text-sm font-medium shadow-sm ${
                tab === "play" ? "bg-slate-900 text-white" : "bg-white"
              }`}
            >
              Praticar
            </button>
          </nav>
        </header>

        {tab === "create" ? (
          <CreateTab cards={cards} setCardsLocal={setCardsLocal} />
        ) : (
          <PlayTab cards={cards} />
        )}

        <footer className="mt-10 text-center text-xs text-slate-500">
          Feito com React + Tailwind. Dados salvos no seu navegador
          (localStorage).
        </footer>
      </div>
    </div>
  );
}

// --- Create / Manage
function CreateTab({
  cards,
  setCardsLocal,
}: {
  cards: Card[];
  setCardsLocal: React.Dispatch<React.SetStateAction<Card[]>>;
}) {
  const [en, setEn] = useState("");
  const [pt, setPt] = useState("");
  const [cat, setCat] = useState("");
  const [search, setSearch] = useState("");
  const [expandedCat, setExpandedCat] = useState<string | null>(null);

  const categories = useMemo(
    () =>
      Array.from(
        new Set(cards.map((c) => (c.category || "").trim()).filter(Boolean))
      ).sort(),
    [cards]
  );
  const [searchCat, setSearchCat] = useState("__all");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return cards.filter((c) => {
      const matchText =
        !q ||
        c.en.toLowerCase().includes(q) ||
        c.pt.toLowerCase().includes(q) ||
        (c.category || "").toLowerCase().includes(q);
      const matchCat =
        searchCat === "__all" ? true : (c.category || "") === searchCat;
      return matchText && matchCat;
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
          id: uid(),
          en: en.trim(),
          pt: pt.trim(),
          category: cat.trim() || undefined,
        },
        ...prev,
      ];

      save(newCards);
      return newCards;
    });
    setEn("");
    setPt("");
    setCat("");
  }

  function removeCard(id: string) {
    setCardsLocal((prev) => {
      const next = prev.filter((c) => c.id !== id);
      save(next);
      return next;
    });
  }

  function importJson(jsonText: string) {
    try {
      const data = JSON.parse(jsonText) as
        | Card[]
        | { en: string; pt: string; category?: string }[];
      const normalized: Card[] = (data as any[])
        .map((c: any) => ({
          id: c.id || uid(),
          en: String(c.en || ""),
          pt: String(c.pt || ""),
          category: c.category ? String(c.category) : undefined,
        }))
        .filter((c) => c.en && c.pt);
      setCardsLocal((prev) => {
        const next = [...normalized, ...prev];
        save(next);
        return next;
      });
    } catch (e) {
      alert("JSON inválido");
    }
  }

  function exportJson() {
    const blob = new Blob([JSON.stringify(cards, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "flashcards_en_pt.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-3 bg-white p-4 rounded-2xl shadow-sm">
        <label className="text-sm font-medium">Palavra em inglês</label>
        <input
          value={en}
          onChange={(e) => setEn(e.target.value)}
          placeholder="e.g., apple"
          className="border rounded-xl px-3 py-2"
        />
        <label className="text-sm font-medium">Tradução em português</label>
        <input
          value={pt}
          onChange={(e) => setPt(e.target.value)}
          placeholder="e.g., maçã"
          className="border rounded-xl px-3 py-2"
        />
        <label className="text-sm font-medium">Categoria (opcional)</label>
        <input
          list="cats"
          value={cat}
          onChange={(e) => setCat(e.target.value)}
          placeholder="e.g., Frutas, Verbos, Casa"
          className="border rounded-xl px-3 py-2"
        />
        <datalist id="cats">
          {categories.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
        <div className="flex gap-2 pt-2   flex-col sm:flex-row">
          <button
            onClick={addCard}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white font-medium"
          >
            Adicionar
          </button>
          <button
            onClick={exportJson}
            className="px-4 py-2 rounded-xl bg-white border font-medium"
          >
            Exportar JSON
          </button>
          <ImportButton onImport={importJson} />
        </div>
      </div>

      <div className="flex md:items-center justify-between gap-2 flex-wrap flex-col sm:flex-row">
        <div className="flex md:items-center gap-2 flex-col sm:flex-row">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar…"
            className="border rounded-xl px-3 py-2 sm:max-w-60 w-full"
          />
          <select
            value={searchCat}
            onChange={(e) => setSearchCat(e.target.value)}
            className="border rounded px-2 py-1 text-sm"
          >
            <option value="__all">Todas</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <h2 className="text-lg font-semibold">Seus cards ({cards.length})</h2>
      </div>

      {grouped.length ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {grouped.map(({ key, label, cards: groupedCards }) => {
            const isOpen = expandedCat === key;
            return (
              <div
                key={key}
                className="bg-white rounded-2xl shadow-sm p-4 flex flex-col gap-3"
              >
                <button
                  type="button"
                  onClick={() =>
                    setExpandedCat((prev) => (prev === key ? null : key))
                  }
                  className="text-left"
                >
                  <div className="text-xs uppercase tracking-wide text-slate-500">
                    Categoria
                  </div>
                  <div className="mt-1 text-xl font-semibold">{label}</div>
                  <div className="text-xs text-slate-400 mt-2">
                    {groupedCards.length}{" "}
                    {groupedCards.length === 1 ? "card" : "cards"}
                  </div>
                </button>

                {isOpen ? (
                  <ul className="grid gap-3">
                    {groupedCards.map((c) => (
                      <li
                        key={c.id}
                        className="border rounded-2xl p-3 flex flex-col gap-2"
                      >
                        <div className="text-xs text-slate-500">EN</div>
                        <div className="text-lg font-semibold">{c.en}</div>
                        <div className="text-xs text-slate-500">PT</div>
                        <div className="text-base">{c.pt}</div>
                        <div className="pt-2 flex justify-end">
                          <button
                            onClick={() => removeCard(c.id)}
                            className="text-xs px-3 py-1 rounded-lg border"
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
}

function ImportButton({ onImport }: { onImport: (jsonText: string) => void }) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = () => onImport(String(reader.result || ""));
          reader.readAsText(file);
          e.currentTarget.value = "";
        }}
      />
      <button
        onClick={() => inputRef.current?.click()}
        className="px-4 py-2 rounded-xl bg-white border font-medium"
      >
        Importar JSON
      </button>
    </>
  );
}

// --- Play Tab
function PlayTab({ cards }: { cards: Card[] }) {
  const [index, setIndex] = useState(0);
  const [order, setOrder] = useState<number[]>([]);
  const [revealed, setRevealed] = useState(false);
  const [answers, setAnswers] = useState<Record<string, boolean | undefined>>(
    {}
  );

  // Categoria + vozes (com persistência)
  const [selectedCats, setSelectedCats] = useState<string[]>(() => {
    const raw =
      localStorage.getItem("flashcards_selectedCats") ??
      localStorage.getItem("flashcards_selectedCat");
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
      // Mantém compatibilidade com versões antigas que salvavam string simples
    }
    return Array.from(
      new Set(
        String(raw)
          .split(",")
          .map((cat) => cat.trim())
          .filter(Boolean)
      )
    );
  });
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [rate, setRate] = useState(() =>
    Number(localStorage.getItem("flashcards_rate") || 1)
  );
  const [autoSpeak, setAutoSpeak] = useState(
    () => localStorage.getItem("flashcards_autoSpeak") !== "false"
  );
  const [selectedVoiceEn, setSelectedVoiceEn] = useState<string | null>(() => {
    const saved = localStorage.getItem("flashcards_voice_en") || "";
    return saved ? saved : null;
  });
  const [selectedVoicePt, setSelectedVoicePt] = useState<string | null>(() => {
    const saved = localStorage.getItem("flashcards_voice_pt") || "";
    return saved ? saved : null;
  });
  const [isCatDialogOpen, setIsCatDialogOpen] = useState(false);
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);

  useEffect(() => {
    const sanitized = Array.from(
      new Set(
        selectedCats.map((cat) => cat.trim()).filter(Boolean)
      )
    );
    if (
      sanitized.length !== selectedCats.length ||
      sanitized.some((cat, idx) => cat !== selectedCats[idx])
    ) {
      setSelectedCats(sanitized);
      return;
    }
    if (!sanitized.length) {
      localStorage.removeItem("flashcards_selectedCats");
      localStorage.setItem("flashcards_selectedCat", "__all");
      return;
    }
    const payload = JSON.stringify(sanitized);
    localStorage.setItem("flashcards_selectedCats", payload);
    // Mantém chave antiga para forward/backward compatibility
    localStorage.setItem("flashcards_selectedCat", sanitized[0] || "__all");
  }, [selectedCats]);
  useEffect(() => {
    localStorage.setItem("flashcards_rate", String(rate));
  }, [rate]);
  useEffect(() => {
    localStorage.setItem("flashcards_autoSpeak", String(autoSpeak));
  }, [autoSpeak]);
  useEffect(() => {
    if (selectedVoiceEn) {
      localStorage.setItem("flashcards_voice_en", selectedVoiceEn);
    } else {
      localStorage.removeItem("flashcards_voice_en");
    }
  }, [selectedVoiceEn]);
  useEffect(() => {
    if (selectedVoicePt) {
      localStorage.setItem("flashcards_voice_pt", selectedVoicePt);
    } else {
      localStorage.removeItem("flashcards_voice_pt");
    }
  }, [selectedVoicePt]);

  // Lista de categorias existentes
  const categories = useMemo(
    () =>
      Array.from(
        new Set(cards.map((c) => (c.category || "").trim()).filter(Boolean))
      ).sort(),
    [cards]
  );
  useEffect(() => {
    setSelectedCats((prev) => {
      if (!prev.length) return prev;
      const available = new Set(categories);
      const filtered = prev.filter((cat) => available.has(cat));
      if (!filtered.length) {
        return [];
      }
      if (
        filtered.length === prev.length &&
        filtered.every((cat, idx) => cat === prev[idx])
      ) {
        return prev;
      }
      return filtered;
    });
  }, [categories]);
  useEffect(() => {
    if (!voices.length) return;
    if (selectedVoiceEn && !voices.some((v) => v.voiceURI === selectedVoiceEn)) {
      setSelectedVoiceEn(null);
    }
    if (selectedVoicePt && !voices.some((v) => v.voiceURI === selectedVoicePt)) {
      setSelectedVoicePt(null);
    }
  }, [voices, selectedVoiceEn, selectedVoicePt]);

  // Conjunto jogável conforme a categoria
  const playable = useMemo(() => {
    const normalizedSelections = selectedCats
      .map((cat) => cat.trim())
      .filter(Boolean);
    if (!normalizedSelections.length) {
      return cards.map((c, i) => ({ c, i }));
    }
    const allowed = new Set(normalizedSelections);
    return cards
      .map((c, i) => ({ c, i }))
      .filter((x) => allowed.has((x.c.category || "").trim()));
  }, [cards, selectedCats]);
  const isAllSelected = selectedCats.length === 0;
  const categorySummary = useMemo(() => {
    if (isAllSelected) return "Todas as categorias";
    if (selectedCats.length === 1) return selectedCats[0];
    return `${selectedCats.length} categorias selecionadas`;
  }, [isAllSelected, selectedCats]);

  const toggleCategory = useCallback((category: string) => {
    const normalized = category.trim();
    if (!normalized) return;
    setSelectedCats((prev) => {
      if (prev.includes(normalized)) {
        return prev.filter((cat) => cat !== normalized);
      }
      return [...prev, normalized];
    });
  }, []);
  const selectAllCategories = useCallback(() => {
    setSelectedCats([]);
  }, []);
  const closeCategoryDialog = useCallback(() => {
    setIsCatDialogOpen(false);
  }, []);
  const closeConfigDialog = useCallback(() => {
    setIsConfigDialogOpen(false);
  }, []);

  // --- Carrega vozes (robusto com fallback)
  useEffect(() => {
    function refreshVoices() {
      const list = window.speechSynthesis.getVoices();
      setVoices(list);
    }
    refreshVoices();

    const synth: any = window.speechSynthesis as any;
    if (synth && typeof synth.addEventListener === "function") {
      synth.addEventListener("voiceschanged", refreshVoices);
      return () => synth.removeEventListener("voiceschanged", refreshVoices);
    } else {
      // Fallback para navegadores que não tipam addEventListener no speechSynthesis
      (window.speechSynthesis as any).onvoiceschanged = refreshVoices;
      return () => {
        (window.speechSynthesis as any).onvoiceschanged = null;
      };
    }
  }, []);

  // Embaralha ao mudar os jogáveis ou a categoria
  useEffect(() => {
    const baseIdxs = playable.map((x) => x.i);
    const idxs = [...baseIdxs];
    for (let i = idxs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [idxs[i], idxs[j]] = [idxs[j], idxs[i]];
    }
    setOrder(idxs);
    setIndex(0);
    setRevealed(false);
    setAnswers({});
  }, [playable.length, selectedCats]);

  // Corrige index se ordem mudar
  useEffect(() => {
    if (order.length && index > order.length - 1) setIndex(0);
  }, [order.length, index]);

  function reshuffle() {
    const baseIdxs = playable.map((x) => x.i);
    const idxs = [...baseIdxs];
    for (let i = idxs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [idxs[i], idxs[j]] = [idxs[j], idxs[i]];
    }
    setOrder(idxs);
    setIndex(0);
    setRevealed(false);
  }
  function next() {
    if (!order.length) return;
    setIndex((i) => Math.min(i + 1, Math.max(0, order.length - 1)));
    setRevealed(false);
  }
  function prev() {
    if (!order.length) return;
    setIndex((i) => Math.max(i - 1, 0));
    setRevealed(false);
  }

  // current seguro
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
        (acc, i) => (answers[cards[i]?.id] !== undefined ? acc + 1 : acc),
        0
      ),
    [order, answers, cards]
  );
  const isDone = order.length > 0 && progress >= order.length;
  const totalCards = order.length;
  const remainingCards = Math.max(totalCards - progress, 0);
  const progressPercent =
    totalCards > 0 ? Math.min(100, Math.max(0, (progress / totalCards) * 100)) : 0;

  // --- Fala estável (com retries e pequeno delay após cancel)
  const speakText = useCallback(
    (text: string, langHint: "en" | "pt" = "en") => {
      const synth = window?.speechSynthesis;
      if (!synth) return;

      const run = (retries = 8) => {
        const available = synth.getVoices();
        const pool = available.length ? available : voices;
        const preferredVoiceUri =
          langHint === "pt" ? selectedVoicePt : selectedVoiceEn;
        const preferredVoice = preferredVoiceUri
          ? pool.find((v) => v.voiceURI === preferredVoiceUri)
          : undefined;

        if (!pool.length) {
          if (retries <= 0) return;
          setTimeout(() => run(retries - 1), 150);
          return;
        }

        const utter = new SpeechSynthesisUtterance(text);

        const hint = langHint === "pt" ? "pt" : "en";
        const localePriority =
          hint === "pt"
            ? ["pt-br", "pt_br", "pt-pt", "pt"]
            : ["en-us", "en_us", "en-gb", "en"];
        const secondaryLocale =
          hint === "pt"
            ? ["en-us", "en", "en-gb"]
            : ["pt-br", "pt", "pt-pt"];

        const candidates: SpeechSynthesisVoice[] = [];
        const pushCandidate = (voice?: SpeechSynthesisVoice) => {
          if (
            voice &&
            !candidates.some((item) => item.voiceURI === voice.voiceURI)
          ) {
            candidates.push(voice);
          }
        };

        const findByLocale = (localePrefix: string) =>
          pool.find((v) =>
            normalizeLang(v.lang).startsWith(localePrefix.toLowerCase())
          );

        pushCandidate(preferredVoice);
        localePriority.forEach((locale) =>
          pushCandidate(findByLocale(locale))
        );
        secondaryLocale.forEach((locale) =>
          pushCandidate(findByLocale(locale))
        );
        if (!candidates.length) {
          pushCandidate(
            pool.find((v) => normalizeLang(v.lang).startsWith(hint))
          );
        }
        if (!candidates.length && pool.length) {
          pushCandidate(pool[0]);
        }

        const voice = candidates[0];

        if (voice) {
          utter.voice = voice;
          utter.lang =
            voice.lang || (hint === "pt" ? "pt-BR" : "en-US");
        } else {
          utter.lang = hint === "pt" ? "pt-BR" : "en-US";
        }
        utter.pitch = 1;

        utter.rate = rate || 1;

        try {
          synth.cancel();
        } catch {
          // ignore
        }

        // Evita race condition cancel->speak no Chrome
        setTimeout(() => {
          if (synth.paused) synth.resume();
          synth.speak(utter);
        }, 0);
      };

      run();
    },
    [voices, rate, selectedVoiceEn, selectedVoicePt]
  );

  // Fala automático conforme o lado visível do card
  useEffect(() => {
    if (isDone || !current || !autoSpeak) return;
    const lang = revealed ? "en" : "pt";
    const text = revealed ? current.en : current.pt;
    speakText(text, lang);
  }, [current, revealed, autoSpeak, speakText, isDone]);

  // Atalhos
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key.toLowerCase() === "a" && revealed && current) {
        setAnswers((prev) => ({ ...prev, [current.id]: true }));
        next();
      } else if (e.key.toLowerCase() === "d" && revealed && current) {
        setAnswers((prev) => ({ ...prev, [current.id]: false }));
        next();
      } else if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        setRevealed((r) => !r);
      } else if (e.key === "ArrowRight") {
        next();
      } else if (e.key === "ArrowLeft") {
        prev();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [revealed, current]);

  // Estados vazios
  if (!cards.length) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
        Cadastre alguns cards na aba <b>Cadastrar</b>.
      </div>
    );
  }
  if (!playable.length) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
        Não há cards nas categorias selecionadas.
      </div>
    );
  }
  if (!order.length) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
        Preparando os cards…
      </div>
    );
  }

  // Resumo quando termina
  if (isDone) {
    const wrong = order.filter((i) => answers[cards[i]?.id] === false);
    const right = order.filter((i) => answers[cards[i]?.id] === true);
    const wrongCards = wrong.map((i) => cards[i]).filter(Boolean) as Card[];
    const rightCards = right.map((i) => cards[i]).filter(Boolean) as Card[];

    function retryWrong() {
      if (!wrong.length) return;
      setOrder(wrong);
      setAnswers({});
      setIndex(0);
      setRevealed(false);
    }
    function resetAll() {
      reshuffle();
      setAnswers({});
    }

    return (
      <div className="grid gap-4">
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-2">Resumo da rodada</h3>
          <p className="text-sm text-slate-600">
            Acertos: {right.length} • Erros: {wrong.length} • Total:{" "}
            {order.length}
          </p>
          <div className="mt-4 flex gap-2 flex-wrap">
            {wrongCards.length ? (
              <button
                onClick={retryWrong}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white"
              >
                Rever apenas errados
              </button>
            ) : null}
            <button onClick={resetAll} className="px-4 py-2 rounded-xl border">
              Recomeçar tudo
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h4 className="font-medium mb-3">Errados ({wrongCards.length})</h4>
            {wrongCards.length ? (
              <ul className="grid gap-2">
                {wrongCards.map((c) => (
                  <li key={c.id} className="border rounded-xl p-3">
                    <div className="text-xs text-slate-500">EN</div>
                    <div className="font-semibold">{c.en}</div>
                    <div className="text-xs text-slate-500 mt-1">PT</div>
                    <div>{c.pt}</div>
                    {c.category ? (
                      <div className="mt-1 text-[11px] text-slate-500">
                        Categoria: {c.category}
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-sm text-slate-600">Nenhum 😊</div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h4 className="font-medium mb-3">Acertos ({rightCards.length})</h4>
            {rightCards.length ? (
              <ul className="grid gap-2">
                {rightCards.map((c) => (
                  <li key={c.id} className="border rounded-xl p-3">
                    <div className="text-xs text-slate-500">EN</div>
                    <div className="font-semibold">{c.en}</div>
                    <div className="text-xs text-slate-500 mt-1">PT</div>
                    <div>{c.pt}</div>
                    {c.category ? (
                      <div className="mt-1 text-[11px] text-slate-500">
                        Categoria: {c.category}
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
        <div className="text-sm text-slate-500">
          {safeIndex + 1} / {order.length}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm">Categorias</span>
          <button
            type="button"
            onClick={() => setIsCatDialogOpen(true)}
            className="px-3 py-1.5 rounded-xl border text-sm bg-white hover:bg-slate-100 transition-colors flex items-center gap-2"
          >
            {categorySummary}
          </button>
          {!isAllSelected ? (
            <button
              type="button"
              onClick={selectAllCategories}
              className="text-xs text-slate-500 underline"
            >
              Limpar seleção
            </button>
          ) : null}
        </div>

        <div className="flex items-center gap-2 ml-auto flex-wrap">
          <button
            type="button"
            onClick={() => setIsConfigDialogOpen(true)}
            className="px-3 py-2 rounded-xl border text-sm bg-white hover:bg-slate-100 transition-colors flex items-center gap-2"
          >
            ⚙️ Configurar voz
          </button>
          <button onClick={prev} className="px-3 py-2 rounded-xl border">
            Anterior
          </button>
          <button onClick={next} className="px-3 py-2 rounded-xl border">
            Próximo
          </button>
        </div>
      </div>

      {totalCards > 0 ? (
        <div className="w-full max-w-xl mx-auto">
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>
              Feitos: {progress} / {totalCards}
            </span>
            <span>Faltam: {remainingCards}</span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
            <div
              className="h-full bg-slate-900 transition-all duration-200 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      ) : null}

      {/* Card + barra de acerto/erro */}
      {!current ? (
        <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
          <p className="mb-3">
            Não consegui localizar este card. Quer reembaralhar?
          </p>
          <button onClick={reshuffle} className="px-3 py-2 rounded-xl border">
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
            speak={speakText}
          />

          <div className="flex items-center justify-center gap-3 mt-2">
            <button
              onClick={() => {
                setAnswers((prev) => ({ ...prev, [current.id]: true }));
                next();
              }}
              disabled={!revealed}
              className={`px-4 py-2 rounded-xl text-white ${
                revealed
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-slate-300 cursor-not-allowed"
              }`}
              title="Marcar como acertei (A)"
            >
              Acertei
            </button>
            <button
              onClick={() => {
                setAnswers((prev) => ({ ...prev, [current.id]: false }));
                next();
              }}
              disabled={!revealed}
              className={`px-4 py-2 rounded-xl text-white ${
                revealed
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-slate-300 cursor-not-allowed"
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
          selected={selectedCats}
          isAllSelected={isAllSelected}
          onToggle={toggleCategory}
          onSelectAll={selectAllCategories}
          onClose={closeCategoryDialog}
        />
      ) : null}
      {isConfigDialogOpen ? (
        <ConfigDialog
          voices={voices}
          selectedVoiceEn={selectedVoiceEn}
          selectedVoicePt={selectedVoicePt}
          rate={rate}
          autoSpeak={autoSpeak}
          onSelectVoiceEn={(value) => setSelectedVoiceEn(value)}
          onSelectVoicePt={(value) => setSelectedVoicePt(value)}
          onRateChange={(value) => setRate(value)}
          onToggleAutoSpeak={(value) => setAutoSpeak(value)}
          onClose={closeConfigDialog}
        />
      ) : null}
    </div>
  );
}

function CategoryDialog({
  categories,
  selected,
  isAllSelected,
  onToggle,
  onSelectAll,
  onClose,
}: {
  categories: string[];
  selected: string[];
  isAllSelected: boolean;
  onToggle: (category: string) => void;
  onSelectAll: () => void;
  onClose: () => void;
}) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  function handleOverlayClick(e: React.MouseEvent<HTMLDivElement, MouseEvent>) {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      onClick={handleOverlayClick}
    >
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Selecionar categorias</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
            aria-label="Fechar seleção de categorias"
          >
            ✕
          </button>
        </div>

        <p className="mt-2 text-xs text-slate-500">
          Deixe sem nenhuma marcada para incluir todas as categorias.
        </p>

        <div className="mt-4 max-h-60 overflow-y-auto pr-2">
          {categories.length ? (
            <ul className="grid gap-2">
              {categories.map((cat) => {
                const active = selected.includes(cat);
                return (
                  <li
                    key={cat}
                    className={`rounded-xl border px-3 py-2 transition-colors ${
                      active ? "border-slate-900 bg-slate-900/5" : "bg-white"
                    }`}
                  >
                    <label className="flex items-center gap-3 text-sm">
                      <input
                        type="checkbox"
                        checked={active}
                        onChange={() => onToggle(cat)}
                      />
                      <span>{cat}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="text-sm text-slate-600">
              Nenhuma categoria cadastrada até o momento.
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          {!isAllSelected ? (
            <button
              type="button"
              onClick={onSelectAll}
              className="text-sm text-slate-500 underline"
            >
              Limpar seleção
            </button>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfigDialog({
  voices,
  selectedVoiceEn,
  selectedVoicePt,
  rate,
  autoSpeak,
  onSelectVoiceEn,
  onSelectVoicePt,
  onRateChange,
  onToggleAutoSpeak,
  onClose,
}: {
  voices: SpeechSynthesisVoice[];
  selectedVoiceEn: string | null;
  selectedVoicePt: string | null;
  rate: number;
  autoSpeak: boolean;
  onSelectVoiceEn: (value: string | null) => void;
  onSelectVoicePt: (value: string | null) => void;
  onRateChange: (value: number) => void;
  onToggleAutoSpeak: (value: boolean) => void;
  onClose: () => void;
}) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  function handleOverlayClick(e: React.MouseEvent<HTMLDivElement, MouseEvent>) {
    if (e.target === e.currentTarget) onClose();
  }

  const valueEn = selectedVoiceEn ?? "__auto";
  const valuePt = selectedVoicePt ?? "__auto";

  const getSortedVoices = (locale: "en" | "pt") => {
    const priority =
      locale === "pt"
        ? ["pt", "en", "es"]
        : ["en", "pt", "es"];
    const score = (voice: SpeechSynthesisVoice) => {
      const norm = normalizeLang(voice.lang || "");
      const idx = priority.findIndex((prefix) =>
        norm.startsWith(prefix.toLowerCase())
      );
      return idx === -1 ? priority.length : idx;
    };
    return [...voices].sort((a, b) => {
      const diff = score(a) - score(b);
      if (diff !== 0) return diff;
      const nameA = a.name || a.voiceURI;
      const nameB = b.name || b.voiceURI;
      return nameA.localeCompare(nameB);
    });
  };

  const sortedPt = getSortedVoices("pt");
  const sortedEn = getSortedVoices("en");
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      onClick={handleOverlayClick}
    >
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Configurações de voz</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
            aria-label="Fechar painel de configurações"
          >
            ✕
          </button>
        </div>

        <div className="mt-4 grid gap-5">
          <section>
            <h3 className="text-sm font-medium text-slate-600 mb-2">
              Voz para inglês
            </h3>
            <select
              className="w-full rounded-xl border px-3 py-2 text-sm"
              value={valueEn}
              onChange={(e) => {
                const next = e.target.value;
                if (next === "__auto") {
                  onSelectVoiceEn(null);
                } else {
                  onSelectVoiceEn(next);
                }
              }}
            >
              <option value="__auto">Automático (escolher melhor voz)</option>
              {sortedEn.map((voice) => (
                <option key={voice.voiceURI} value={voice.voiceURI}>
                  {voice.name || voice.voiceURI} ({voice.lang || "?"})
                </option>
              ))}
            </select>
            {!voices.length ? (
              <p className="mt-1 text-xs text-slate-500">
                Carregando vozes disponíveis do navegador…
              </p>
            ) : null}
          </section>

          <section>
            <h3 className="text-sm font-medium text-slate-600 mb-2">
              Voz para português
            </h3>
            <select
              className="w-full rounded-xl border px-3 py-2 text-sm"
              value={valuePt}
              onChange={(e) => {
                const next = e.target.value;
                if (next === "__auto") {
                  onSelectVoicePt(null);
                } else {
                  onSelectVoicePt(next);
                }
              }}
            >
              <option value="__auto">Automático (escolher melhor voz)</option>
              {sortedPt.map((voice) => (
                <option key={voice.voiceURI} value={voice.voiceURI}>
                  {voice.name || voice.voiceURI} ({voice.lang || "?"})
                </option>
              ))}
            </select>
            {!voices.length ? (
              <p className="mt-1 text-xs text-slate-500">
                Carregando vozes disponíveis do navegador…
              </p>
            ) : null}
          </section>

          <section>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-600">Velocidade</h3>
              <span className="text-xs text-slate-500">
                {rate.toFixed(2).replace(/\.00$/, "")}x
              </span>
            </div>
            <input
              type="range"
              min={0.7}
              max={1.3}
              step={0.05}
              value={rate}
              onChange={(e) => onRateChange(Number(e.target.value))}
              className="w-full"
            />
            <p className="mt-1 text-xs text-slate-500">
              Ajuste a velocidade de reprodução da voz.
            </p>
          </section>

          <section>
            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={autoSpeak}
                onChange={(e) => onToggleAutoSpeak(e.target.checked)}
              />
              Reproduzir automaticamente ao virar o card
            </label>
          </section>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
}

function CardSwipe({
  en,
  pt,
  revealed,
  setRevealed,
  speak,
}: {
  en: string;
  pt: string;
  revealed: boolean;
  setRevealed: (b: boolean) => void;
  speak: (text: string, langHint?: "en" | "pt") => void;
}) {
  const speakPortuguese = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      speak(pt, "pt");
    },
    [pt, speak]
  );

  const speakEnglish = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
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
      {/* Base card (PT) */}
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

      {/* EN overlay com fade */}
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
}
