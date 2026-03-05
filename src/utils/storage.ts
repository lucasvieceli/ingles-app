import { Card } from "../types";
import { generateId } from "./uid";

export const LS_CUSTOM_CARDS_KEY = "flashcards_en_pt_v1";
export const LS_SCORE_KEY = "flashcards_score_v1";

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

const normalizeCard = (raw: unknown): Card | null => {
  if (!raw || typeof raw !== "object") return null;
  const entry = raw as Record<string, unknown>;
  const en = String(entry.en || "").trim();
  const pt = String(entry.pt || "").trim();
  if (!en || !pt) return null;

  const id =
    typeof entry.id === "string" && entry.id.trim()
      ? entry.id.trim()
      : generateId();
  const normalizedFields = normalizeBookAndCategory(entry.book, entry.category);

  return {
    id,
    en,
    pt,
    book: normalizedFields.book,
    category: normalizedFields.category,
  };
};

export function saveCustomCards(cards: Card[]) {
  localStorage.setItem(LS_CUSTOM_CARDS_KEY, JSON.stringify(cards));
}

export function loadCustomCards(): Card[] {
  try {
    const raw = localStorage.getItem(LS_CUSTOM_CARDS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    const normalized = parsed
      .map((entry) => normalizeCard(entry))
      .filter((entry): entry is Card => Boolean(entry));

    localStorage.setItem(LS_CUSTOM_CARDS_KEY, JSON.stringify(normalized));
    return normalized;
  } catch {
    return [];
  }
}
