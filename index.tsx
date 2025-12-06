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
  const totalCategories = useMemo(
    () =>
      new Set(
        cards
          .map((card) => (card.category || "").trim())
          .filter((category) => !!category)
      ).size,
    [cards]
  );

  const totalCards = cards.length;
  const customCards = cardsLocal.length;

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-orange-300 via-amber-400 to-yellow-400 text-amber-900 font-bold grid place-items-center shadow-lg shadow-orange-200">
              EN
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
                Estudo guiado
              </p>
              <h1 className="text-3xl sm:text-4xl font-semibold leading-tight text-slate-900">
                Flashcards bilíngue
              </h1>
              <p className="text-sm text-slate-600">
                Crie e pratique inglês com áudio e atalhos.
              </p>
            </div>
          </div>

          <nav className="flex items-center gap-2 bg-white rounded-2xl border border-slate-200 p-1 shadow-md">
            <TabButton
              label="Cadastrar"
              description="Adicionar/organizar"
              active={tab === "create"}
              onClick={() => setTab("create")}
              icon="✏️"
            />
            <TabButton
              label="Praticar"
              description="Revisar e ouvir"
              active={tab === "play"}
              onClick={() => setTab("play")}
              icon="🎯"
            />
          </nav>
        </header>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xl">
          <div className="grid gap-6 md:grid-cols-[1.25fr,0.95fr] items-start">
            <div className="space-y-4">
              <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-orange-600">
                <span className="h-[1px] w-6 bg-orange-400" />
                Seu fluxo
              </p>
              <h2 className="text-2xl sm:text-3xl font-semibold leading-snug text-slate-900">
                Cadastre palavras, use pronúncia do navegador e revise com atalhos.
              </h2>
              <p className="text-sm sm:text-base text-slate-600 max-w-2xl">
                Enter revela/oculta, A marca acerto, D marca erro, setas navegam. Importação/exportação por JSON para levar seu baralho.
              </p>
              <div className="flex flex-wrap gap-2 text-[12px] text-slate-600">
                <span className="px-3 py-1 rounded-full bg-orange-50 border border-orange-100 text-orange-800">Enter revela</span>
                <span className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-800">A acertei • D errei</span>
                <span className="px-3 py-1 rounded-full bg-sky-50 border border-sky-100 text-sky-800">Voz automática</span>
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-3">
              <StatCard label="Total de cards" value={totalCards} accent="bg-orange-50 text-orange-900" numberClass="text-2xl font-semibold" />
              <StatCard label="Categorias" value={totalCategories} accent="bg-sky-50 text-sky-900" numberClass="text-2xl font-semibold" />
              <StatCard label="Seus cards" value={customCards} accent="bg-emerald-50 text-emerald-900" numberClass="text-2xl font-semibold" />
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-xl">
          <div className="flex items-center justify-between flex-wrap gap-3 pb-4 border-b border-slate-200">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500">{tab === "create" ? "Cadastro e organização" : "Treino guiado"}</p>
              <h3 className="text-xl font-semibold text-slate-900 mt-1">
                {tab === "create" ? "Monte seu baralho" : "Hora de praticar"}
              </h3>
            </div>
            <div className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-full px-3 py-1">
              Dados ficam só no seu navegador (localStorage)
            </div>
          </div>

          <div className="pt-4">
            {tab === "create" ? (
              <CreateTab cards={cards} setCardsLocal={setCardsLocal} />
            ) : (
              <PlayTab cards={cards} />
            )}
          </div>
        </section>

        <footer className="pb-4 text-center text-xs text-slate-500">
          Feito com React + Tailwind. Mantemos tudo rápido e sem backend.
        </footer>
      </div>
    </div>
  );
}

const StatCard: React.FC<{
  label: string;
  value: number;
  accent: string;
  numberClass?: string;
}> = ({ label, value, accent, numberClass }) => {
  return (
    <div className={`rounded-2xl border border-slate-200 ${accent} p-4 shadow-sm`}>
      <div className="text-sm text-slate-600">{label}</div>
      <div className={numberClass || "text-2xl font-semibold text-slate-900"}>
        {value}
      </div>
    </div>
  );
};

const TabButton: React.FC<{
  label: string;
  description: string;
  active: boolean;
  onClick: () => void;
  icon: string;
}> = ({ label, description, active, onClick, icon }) => {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-all min-w-[160px] ${
        active
          ? "bg-gradient-to-r from-orange-500 to-amber-400 text-white shadow-md"
          : "text-slate-700 hover:bg-slate-50"
      }`}
    >
      <span className="text-lg" aria-hidden>
        {icon}
      </span>
      <span className="leading-tight">
        <span className="block text-sm font-semibold">{label}</span>
        <span className="block text-[12px] text-current/80">{description}</span>
      </span>
    </button>
  );
};
