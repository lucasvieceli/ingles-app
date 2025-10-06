import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

// --- Types
type Card = { id: string; en: string; pt: string; cat?: string };

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

// --- Main App
export default function App() {
  const [cards, setCards] = useState<Card[]>(load());
  const [tab, setTab] = useState<"create" | "play">("create");

  useEffect(() => save(cards), [cards]);

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
          <CreateTab cards={cards} setCards={setCards} />
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
  setCards,
}: {
  cards: Card[];
  setCards: React.Dispatch<React.SetStateAction<Card[]>>;
}) {
  const [en, setEn] = useState("");
  const [pt, setPt] = useState("");
  const [cat, setCat] = useState("");
  const [search, setSearch] = useState("");

  const categories = useMemo(
    () =>
      Array.from(
        new Set(cards.map((c) => (c.cat || "").trim()).filter(Boolean))
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
        (c.cat || "").toLowerCase().includes(q);
      const matchCat =
        searchCat === "__all" ? true : (c.cat || "") === searchCat;
      return matchText && matchCat;
    });
  }, [cards, search, searchCat]);

  function addCard() {
    if (!en.trim() || !pt.trim()) return;
    setCards((prev) => [
      { id: uid(), en: en.trim(), pt: pt.trim(), cat: cat.trim() || undefined },
      ...prev,
    ]);
    setEn("");
    setPt("");
    setCat("");
  }

  function removeCard(id: string) {
    setCards((prev) => prev.filter((c) => c.id !== id));
  }

  function importJson(jsonText: string) {
    try {
      const data = JSON.parse(jsonText) as
        | Card[]
        | { en: string; pt: string; cat?: string }[];
      const normalized: Card[] = (data as any[])
        .map((c: any) => ({
          id: c.id || uid(),
          en: String(c.en || ""),
          pt: String(c.pt || ""),
          cat: c.cat ? String(c.cat) : undefined,
        }))
        .filter((c) => c.en && c.pt);
      setCards((prev) => [...normalized, ...prev]);
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
        <div className="flex gap-2 pt-2">
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

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar…"
            className="border rounded-xl px-3 py-2 w-60"
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

      <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((c) => (
          <li
            key={c.id}
            className="bg-white rounded-2xl shadow-sm p-4 flex flex-col gap-2"
          >
            <div className="text-sm text-slate-500">EN</div>
            <div className="text-lg font-semibold">{c.en}</div>
            <div className="text-sm text-slate-500">PT</div>
            <div className="text-lg">{c.pt}</div>
            {c.cat ? (
              <div className="mt-1">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 border">
                  {c.cat}
                </span>
              </div>
            ) : null}
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => removeCard(c.id)}
                className="text-sm px-3 py-1 rounded-lg border"
              >
                Excluir
              </button>
            </div>
          </li>
        ))}
      </ul>
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
  const [selectedCat, setSelectedCat] = useState<string>(
    () => localStorage.getItem("flashcards_selectedCat") || "__all"
  );
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState(
    () => localStorage.getItem("flashcards_voice") || ""
  );
  const [rate, setRate] = useState(() =>
    Number(localStorage.getItem("flashcards_rate") || 1)
  );
  const [autoSpeak, setAutoSpeak] = useState(
    () => localStorage.getItem("flashcards_autoSpeak") !== "false"
  );

  useEffect(() => {
    localStorage.setItem("flashcards_selectedCat", selectedCat);
  }, [selectedCat]);
  useEffect(() => {
    localStorage.setItem("flashcards_voice", selectedVoiceURI);
  }, [selectedVoiceURI]);
  useEffect(() => {
    localStorage.setItem("flashcards_rate", String(rate));
  }, [rate]);
  useEffect(() => {
    localStorage.setItem("flashcards_autoSpeak", String(autoSpeak));
  }, [autoSpeak]);

  // Lista de categorias existentes
  const categories = useMemo(
    () =>
      Array.from(
        new Set(cards.map((c) => (c.cat || "").trim()).filter(Boolean))
      ).sort(),
    [cards]
  );

  // Conjunto jogável conforme a categoria
  const playable = useMemo(() => {
    return cards
      .map((c, i) => ({ c, i }))
      .filter((x) =>
        selectedCat === "__all" ? true : (x.c.cat || "") === selectedCat
      );
  }, [cards, selectedCat]);

  // --- Carrega vozes (robusto com fallback)
  useEffect(() => {
    function refreshVoices() {
      const list = window.speechSynthesis.getVoices();
      setVoices(list);
      if (!selectedVoiceURI && list.length) {
        const pick =
          list.find((v) => v.lang?.toLowerCase().startsWith("en")) ?? list[0];
        if (pick) setSelectedVoiceURI(pick.voiceURI);
      }
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
  }, [selectedVoiceURI]);

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
  }, [playable.length, selectedCat]);

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

  // --- Fala estável (com retries e pequeno delay após cancel)
  const speakText = useCallback(
    (text: string) => {
      const synth = window?.speechSynthesis;
      if (!synth) return;

      const run = (retries = 8) => {
        const available = synth.getVoices();
        const pool = available.length ? available : voices;

        if (!pool.length) {
          if (retries <= 0) return;
          setTimeout(() => run(retries - 1), 150);
          return;
        }

        const utter = new SpeechSynthesisUtterance(text);

        const preferred = pool.find((v) => v.voiceURI === selectedVoiceURI);
        const english = pool.find((v) =>
          v.lang?.toLowerCase().startsWith("en")
        );
        const voice = preferred || english || pool[0];

        if (voice) {
          utter.voice = voice;
          utter.lang = voice.lang || "en-US";
        } else {
          utter.lang = "en-US";
        }
        utter.pitch = 1;
        console.log("utter", utter);

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
    [voices, selectedVoiceURI, rate]
  );

  // Fala automático ao mostrar inglês
  useEffect(() => {
    if (current && !revealed && autoSpeak) {
      speakText(current.en);
    }
  }, [current, revealed, autoSpeak, speakText]);

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
        Não há cards na categoria selecionada.
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
  const progress = order.reduce(
    (acc, i) => (answers[cards[i]?.id] !== undefined ? acc + 1 : acc),
    0
  );
  const isDone = progress >= order.length;
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
                    {c.cat ? (
                      <div className="mt-1 text-[11px] text-slate-500">
                        Categoria: {c.cat}
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
                    {c.cat ? (
                      <div className="mt-1 text-[11px] text-slate-500">
                        Categoria: {c.cat}
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

        <div className="flex gap-2">
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
    );
  }

  return (
    <div className="grid gap-4">
      <div className="flex justify-between items-center gap-3 flex-wrap">
        <div className="text-sm text-slate-500">
          {safeIndex + 1} / {order.length}
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm">Categoria</label>
          <select
            value={selectedCat}
            onChange={(e) => setSelectedCat(e.target.value)}
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

        <div className="flex items-center gap-2 flex-wrap">
          <label className="text-sm">Voz</label>
          <select
            value={selectedVoiceURI}
            onChange={(e) => setSelectedVoiceURI(e.target.value)}
            className="border rounded px-2 py-1 text-sm"
          >
            {voices
              .filter((v) => v.lang?.toLowerCase().startsWith("en"))
              .map((v) => (
                <option key={v.voiceURI} value={v.voiceURI}>
                  {v.name} • {v.lang}
                </option>
              ))}
          </select>

          <label className="text-sm ml-2">Velocidade</label>
          <input
            type="range"
            min={0.7}
            max={1.3}
            step={0.05}
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
          />

          <label className="text-sm ml-2 flex items-center gap-1">
            <input
              type="checkbox"
              checked={autoSpeak}
              onChange={(e) => setAutoSpeak(e.target.checked)}
            />{" "}
            auto
          </label>
        </div>

        <div className="flex gap-2 ml-auto">
          <button onClick={prev} className="px-3 py-2 rounded-xl border">
            Anterior
          </button>
          <button onClick={next} className="px-3 py-2 rounded-xl border">
            Próximo
          </button>
        </div>
      </div>

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
  speak: (text: string) => void;
}) {
  function speakAgain(e?: React.MouseEvent) {
    e?.stopPropagation();
    speak(en);
  }

  function onClickToggle() {
    setRevealed(!revealed);
  }

  return (
    <div
      className="relative h-[300px] w-full max-w-xl mx-auto cursor-pointer overflow-hidden border border-slate-200"
      onClick={onClickToggle}
    >
      {/* Base card (EN) */}
      <div className="absolute inset-0 bg-white rounded-2xl shadow-lg p-6 flex flex-col items-center justify-center z-0">
        <span className="text-xs uppercase tracking-wide text-slate-400">
          Inglês
        </span>
        <div className="mt-2 text-2xl sm:text-3xl font-bold text-center break-words flex items-center gap-3">
          {en}
          <button
            onClick={speakAgain}
            className="ml-2 p-2 rounded-full bg-slate-200 hover:bg-slate-300"
            title="Repetir pronúncia"
          >
            🔊
          </button>
        </div>
      </div>

      {/* PT overlay com fade */}
      <div
        className={`absolute inset-0 rounded-2xl p-6 flex flex-col items-center justify-center bg-slate-900 text-white transition-opacity duration-150 ${
          revealed ? "opacity-100 z-10" : "opacity-0 pointer-events-none z-10"
        }`}
      >
        <span className="text-xs uppercase tracking-wide text-white/70">
          Português
        </span>
        <div className="mt-2 text-2xl sm:text-3xl font-semibold text-center break-words">
          {pt}
        </div>
        <div className="mt-3 text-xs opacity-70">
          Clique novamente para ocultar
        </div>
      </div>
    </div>
  );
}
