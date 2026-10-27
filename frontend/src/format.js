const locale = (lang) => (lang === "en" ? "en-GB" : "fr-FR");

// "2026-11-02" → "2 nov. 2026" (ou "2 Nov 2026" en anglais). Accepte aussi les dates ISO complètes.
export function formatDate(value, lang) {
  if (!value) return "";
  const d = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(value + "T00:00:00") : new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(locale(lang), { day: "numeric", month: "short", year: "numeric" });
}

// Équivalent de wp_trim_words : garde les N premiers mots
export function trimWords(text, n) {
  const words = (text || "").split(/\s+/).filter(Boolean);
  return words.length > n ? words.slice(0, n).join(" ") + "…" : words.join(" ");
}

export { locale };
