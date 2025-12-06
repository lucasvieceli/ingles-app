import React, { useMemo, useState } from "react";

import CreateTab from "./src/components/CreateTab";
import PlayTab from "./src/components/PlayTab";
import { defaultCards } from "./src/cards";
import { Card } from "./src/types";
import { loadCustomCards } from "./src/utils/storage";

export type { Card } from "./src/types";

export default function App() {
  const [cardsLocal, setCardsLocal] = useState<Card[]>(() => loadCustomCards());
  const [tab, setTab] = useState<"create" | "play">("create");

  const cards = useMemo(() => [...defaultCards, ...cardsLocal], [cardsLocal]);

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

