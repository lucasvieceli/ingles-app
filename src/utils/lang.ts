export const normalizeLang = (value?: string) =>
  (value || "").toLowerCase().replace(/_/g, "-");

