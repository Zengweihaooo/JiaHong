export function getChatQuoteAuthorLabel(from = "") {
  return from === "doctor" ? "我" : "患者";
}

export function buildChatQuote({ messageId = "", from = "", text = "" } = {}) {
  const normalized = String(text || "").trim();
  if (!normalized) return null;
  return {
    messageId,
    from,
    authorLabel: getChatQuoteAuthorLabel(from),
    text: normalized
  };
}

export function truncateChatPreview(text = "", maxLength = 72) {
  const value = String(text || "").trim();
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength)}…`;
}

export function createEmptyChatComposerState() {
  return {
    quote: null,
    edit: null
  };
}
