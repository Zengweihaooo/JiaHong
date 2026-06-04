import {
  appendDoctorChatMessage,
  generatePatientReplyForChat,
  getOngoingChatMessage,
  recallOngoingChatMessage
} from "../../application/controllers/chatController.js";
import { getActiveChatKey } from "../views/renderRecordSelectors.js?v=20260528-06";
import { renderChatThread } from "../views/chatView.js?v=20260604-10";
import { isConsultReadonlyView, refreshChatThread } from "../ui/dom.js";
import { showToast } from "../ui/interactionPrimitives.js";

let onChatThreadRendered = () => {};

export function configureChatBindings({ onThreadRendered } = {}) {
  onChatThreadRendered = typeof onThreadRendered === "function" ? onThreadRendered : () => {};
}

export function closeChatMessageMenu() {
  const menu = document.querySelector(".chat-message-menu");
  if (!menu) return;
  menu.hidden = true;
  menu.classList.remove("is-open");
  menu.setAttribute("aria-hidden", "true");
  menu.style.left = "";
  menu.style.top = "";
  delete menu.dataset.messageId;
  delete menu.dataset.chatKey;
}

function openChatMessageMenu(bubble, event) {
  if (isConsultReadonlyView()) return;
  event.preventDefault();
  const menu = document.querySelector(".chat-message-menu");
  if (!menu) return;

  const chatKey = bubble.closest("[data-chat-key]")?.dataset.chatKey || getActiveChatKey() || "";
  menu.dataset.messageId = bubble.dataset.messageId || "";
  menu.dataset.chatKey = chatKey;
  menu.hidden = false;
  menu.classList.add("is-open");
  menu.setAttribute("aria-hidden", "false");

  const offset = 4;
  menu.style.left = `${event.clientX + offset}px`;
  menu.style.top = `${event.clientY + offset}px`;

  requestAnimationFrame(() => {
    const rect = menu.getBoundingClientRect();
    const left = Math.min(event.clientX + offset, window.innerWidth - rect.width - 8);
    const top = Math.min(event.clientY + offset, window.innerHeight - rect.height - 8);
    menu.style.left = `${Math.max(8, left)}px`;
    menu.style.top = `${Math.max(8, top)}px`;
  });
}

async function copyChatMessageText(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast("已复制");
  } catch {
    showToast("复制失败");
  }
}

function handleChatMessageMenuAction(action) {
  const menu = document.querySelector(".chat-message-menu");
  if (!menu) return;
  const chatKey = menu.dataset.chatKey;
  const messageId = menu.dataset.messageId;
  const message = getOngoingChatMessage(chatKey, messageId);
  if (!message || message.recalled) {
    closeChatMessageMenu();
    return;
  }

  if (action === "recall") {
    recallOngoingChatMessage(chatKey, messageId);
    refreshChatThread(renderChatThread, chatKey);
    showToast("消息已撤回");
  } else if (action === "copy") {
    copyChatMessageText(message.text);
  } else if (action === "quote") {
    fillChatInput(`引用：${message.text}`, { append: true });
    showToast("已引用到输入框");
  }

  closeChatMessageMenu();
}

function appendActiveDoctorChatMessage(text) {
  const chatKey = getActiveChatKey();
  const message = appendDoctorChatMessage(chatKey, text);
  if (!message) return null;
  refreshChatThread(renderChatThread, chatKey);
  bindChatMessageMenu();
  onChatThreadRendered();
  const thread = document.querySelector(`[data-chat-key="${chatKey}"]`);
  if (thread) thread.scrollTop = thread.scrollHeight;
  return { chatKey, message };
}

export function fillChatInput(text = "", { append = false } = {}) {
  const input = document.querySelector(".jh-chat-input textarea");
  if (!input) return false;
  const nextText = String(text).trim();
  if (!nextText) return false;
  input.value = append && input.value.trim() ? `${input.value.trim()}\n${nextText}` : nextText;
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.focus();
  input.setSelectionRange?.(input.value.length, input.value.length);
  return true;
}

async function appendMockPatientReply(chatKey, doctorMessage) {
  try {
    const reply = await generatePatientReplyForChat(chatKey, doctorMessage);
    if (!reply) return;
    refreshChatThread(renderChatThread, chatKey);
    bindChatMessageMenu();
    onChatThreadRendered();
    const thread = document.querySelector(`[data-chat-key="${chatKey}"]`);
    if (thread) thread.scrollTop = thread.scrollHeight;
  } catch {
    showToast("病人自动回复失败");
  }
}

export function sendChatInputMessage(input) {
  if (isConsultReadonlyView()) return;
  const text = input?.value.trim();
  if (!text) return;
  const sent = appendActiveDoctorChatMessage(text);
  if (!sent) {
    showToast("当前会话不可发送");
    return;
  }
  input.value = "";
  input.focus();
  appendMockPatientReply(sent.chatKey, sent.message);
}


export function bindChatMessageMenu() {
  const menu = document.querySelector(".chat-message-menu");
  if (!menu || menu.dataset.bound === "true") return;
  menu.dataset.bound = "true";

  document.addEventListener("contextmenu", (event) => {
    if (!document.querySelector(".text-card:not(.text-card--readonly)")) return;
    const bubble = event.target.closest(
      '.chat-bubble--doctor[data-chat-context="doctor"]:not(.chat-bubble--recalled)'
    );
    if (!bubble) return;
    openChatMessageMenu(bubble, event);
  });

  menu.querySelectorAll(".chat-message-menu__item").forEach((item) => {
    item.addEventListener("click", (event) => {
      event.stopPropagation();
      handleChatMessageMenuAction(item.dataset.action);
    });
  });

  document.addEventListener("click", (event) => {
    if (!menu.classList.contains("is-open")) return;
    if (menu.contains(event.target)) return;
    closeChatMessageMenu();
  });

  document.addEventListener("scroll", closeChatMessageMenu, true);
}
