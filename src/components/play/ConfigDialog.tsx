import React, { useEffect } from "react";

import { normalizeLang } from "../../utils/lang";

type ConfigDialogProps = {
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
};

const ConfigDialog: React.FC<ConfigDialogProps> = ({
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
}) => {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  function handleOverlayClick(
    event: React.MouseEvent<HTMLDivElement, MouseEvent>
  ) {
    if (event.target === event.currentTarget) onClose();
  }

  const valueEn = selectedVoiceEn ?? "__auto";
  const valuePt = selectedVoicePt ?? "__auto";

  const getSortedVoices = (locale: "en" | "pt") => {
    const priority = locale === "pt" ? ["pt", "en", "es"] : ["en", "pt", "es"];
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
              onChange={(event) => {
                const next = event.target.value;
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
              onChange={(event) => {
                const next = event.target.value;
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
              onChange={(event) => onRateChange(Number(event.target.value))}
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
                onChange={(event) => onToggleAutoSpeak(event.target.checked)}
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
};

export default ConfigDialog;

