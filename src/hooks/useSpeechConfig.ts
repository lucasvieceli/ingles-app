import { useCallback, useEffect, useState } from "react";

import { normalizeLang } from "../utils/lang";

export function useSpeechConfig() {
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

  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

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
      synth.onvoiceschanged = refreshVoices;
      return () => {
        synth.onvoiceschanged = null;
      };
    }
  }, []);

  useEffect(() => {
    if (!voices.length) return;
    if (
      selectedVoiceEn &&
      !voices.some((voice) => voice.voiceURI === selectedVoiceEn)
    ) {
      setSelectedVoiceEn(null);
    }
    if (
      selectedVoicePt &&
      !voices.some((voice) => voice.voiceURI === selectedVoicePt)
    ) {
      setSelectedVoicePt(null);
    }
  }, [voices, selectedVoiceEn, selectedVoicePt]);

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

  const speak = useCallback(
    (text: string, langHint: "en" | "pt" = "en") => {
      const synth = window?.speechSynthesis;
      if (!synth) return;

      const run = (retries = 8) => {
        const available = synth.getVoices();
        const pool = available.length ? available : voices;
        const preferredVoiceUri =
          langHint === "pt" ? selectedVoicePt : selectedVoiceEn;
        const preferredVoice = preferredVoiceUri
          ? pool.find((voice) => voice.voiceURI === preferredVoiceUri)
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
          hint === "pt" ? ["en-us", "en", "en-gb"] : ["pt-br", "pt", "pt-pt"];

        const candidates: SpeechSynthesisVoice[] = [];
        const pushCandidate = (voice?: SpeechSynthesisVoice) => {
          if (
            voice &&
            !candidates.some((item) => item.voiceURI === voice.voiceURI)
          ) {
            candidates.push(voice);
          }
        };

        if (preferredVoice) {
          pushCandidate(preferredVoice);
        }
        pool.forEach((voice) => {
          const normalized = normalizeLang(voice.lang);
          if (localePriority.some((prefix) => normalized.startsWith(prefix))) {
            pushCandidate(voice);
          }
        });
        pool.forEach((voice) => {
          const normalized = normalizeLang(voice.lang);
          if (secondaryLocale.some((prefix) => normalized.startsWith(prefix))) {
            pushCandidate(voice);
          }
        });
        pool.forEach((voice) => pushCandidate(voice));

        const selected = candidates[0];
        if (selected) {
          utter.voice = selected;
        }

        utter.rate = Math.max(0.1, Math.min(10, rate || 1));
        utter.pitch = 1;

        synth.cancel();
        setTimeout(() => synth.speak(utter), 20);
      };

      run();
    },
    [voices, selectedVoiceEn, selectedVoicePt, rate]
  );

  return {
    voices,
    rate,
    setRate,
    autoSpeak,
    setAutoSpeak,
    selectedVoiceEn,
    setSelectedVoiceEn,
    selectedVoicePt,
    setSelectedVoicePt,
    speak,
  };
}

