import {
  buildChatQuote,
  createEmptyChatComposerState,
  truncateChatPreview
} from "../../domain/chatComposer.js";
import { escapeHtml } from "./html.js";

const composers = new Map();

export function getChatComposer(chatKey = "") {
  if (!chatKey) return createEmptyChatComposerState();
  return composers.get(chatKey) || createEmptyChatComposerState();
}

export function setChatComposerQuote(chatKey, payload = {}) {
  const quote = buildChatQuote(payload);
  if (!chatKey || !quote) return null;
  composers.set(chatKey, { quote, edit: null });
  return getChatComposer(chatKey);
}

export function setChatComposerEdit(chatKey, { messageId = "", text = "" } = {}) {
  if (!chatKey || !messageId) return null;
  composers.set(chatKey, {
    quote: null,
    edit: { messageId, text: String(text || "") }
  });
  return getChatComposer(chatKey);
}

export function clearChatComposer(chatKey = "") {
  if (!chatKey) return;
  composers.set(chatKey, createEmptyChatComposerState());
}

export function clearChatComposerQuote(chatKey = "") {
  if (!chatKey) return;
  const current = getChatComposer(chatKey);
  composers.set(chatKey, { ...current, quote: null });
}

export function clearChatComposerEdit(chatKey = "") {
  if (!chatKey) return;
  const current = getChatComposer(chatKey);
  composers.set(chatKey, { ...current, edit: null });
}

export function renderChatComposerPreviewInnerMarkup(composer = createEmptyChatComposerState()) {
  const parts = [];
  if (composer.edit?.messageId) {
    parts.push(`
      <div class="chat-composer-edit" data-chat-composer-edit>
        <span class="chat-composer-edit__icon" aria-hidden="true"></span>
        <span class="chat-composer-edit__label">编辑消息</span>
        <button class="chat-composer-edit__close" type="button" aria-label="取消编辑">×</button>
      </div>`);
  }
  if (composer.quote?.text) {
    parts.push(`
      <div class="chat-composer-quote" data-chat-composer-quote>
        <span class="chat-composer-quote__bar" aria-hidden="true"></span>
        <div class="chat-composer-quote__body">
          <span class="chat-composer-quote__author">${escapeHtml(composer.quote.authorLabel || "")}</span>
          <p class="chat-composer-quote__text">${escapeHtml(truncateChatPreview(composer.quote.text))}</p>
        </div>
        <button class="chat-composer-quote__close" type="button" aria-label="移除引用">×</button>
      </div>`);
  }
  return parts.join("");
}

export function renderChatComposerPreviewMarkup(composer = createEmptyChatComposerState()) {
  const inner = renderChatComposerPreviewInnerMarkup(composer);
  if (!inner) return "";
  return `<div class="chat-composer-preview">${inner}</div>`;
}

function ensureChatComposerPreviewRoot() {
  const top = document.querySelector(".jh-chat-input__top");
  if (!top) return null;
  let preview = top.querySelector(".chat-composer-preview");
  if (!preview) {
    preview = document.createElement("div");
    preview.className = "chat-composer-preview";
    preview.hidden = true;
    top.insertBefore(preview, top.firstChild);
  }
  return preview;
}

export function syncChatComposerPreview(chatKey = "") {
  const preview = ensureChatComposerPreviewRoot();
  if (!preview) return;
  const composer = getChatComposer(chatKey);
  const inner = renderChatComposerPreviewInnerMarkup(composer);
  if (!inner) {
    preview.innerHTML = "";
    preview.hidden = true;
    return;
  }
  preview.innerHTML = inner;
  preview.hidden = false;
  bindChatComposerPreview(chatKey);
}

function bindChatComposerPreview(chatKey = "") {
  const root = document.querySelector(".chat-composer-preview");
  if (!root) return;
  root.querySelector(".chat-composer-quote__close")?.addEventListener("click", () => {
    clearChatComposerQuote(chatKey);
    syncChatComposerPreview(chatKey);
  });
  root.querySelector(".chat-composer-edit__close")?.addEventListener("click", () => {
    clearChatComposerEdit(chatKey);
    syncChatComposerPreview(chatKey);
  });
}

export function renderChatQuoteBubbleMarkup(quote = null) {
  if (!quote?.text) return "";
  return `
    <div class="chat-bubble__quote">
      <span class="chat-bubble__quote-author">${escapeHtml(quote.authorLabel || "")}</span>
      <p class="chat-bubble__quote-text">${escapeHtml(truncateChatPreview(quote.text, 120))}</p>
    </div>`;
}
