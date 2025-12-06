import { Card } from "../types";

export const LS_CUSTOM_CARDS_KEY = "flashcards_en_pt_v1";
export const LS_SCORE_KEY = "flashcards_score_v1";

export function saveCustomCards(cards: Card[]) {
  localStorage.setItem(LS_CUSTOM_CARDS_KEY, JSON.stringify(cards));
}

export function loadCustomCards(): Card[] {
  try {
    const raw = localStorage.getItem(LS_CUSTOM_CARDS_KEY);
    return raw ? (JSON.parse(raw) as Card[]) : [];
  } catch {
    return [];
  }
}

