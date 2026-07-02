import { buildChatQuote } from "../../domain/chatComposer.js";
import { generatePatientAutoReply } from "../../infrastructure/api/appApi.js";
import { consultationRecords, ongoingChatState } from "../state/dataStore.js";
import { rememberDismissedMessageBadge } from "../state/runtimeState.js?v=20260528-06";

function formatChatDateTime(date = new Date()) {
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export function getOngoingChatMessage(chatKey, messageId) {
  return ongoingChatState[chatKey]?.messages.find((message) => message.id === messageId) || null;
}

export function recallOngoingChatMessage(chatKey, messageId) {
  const message = getOngoingChatMessage(chatKey, messageId);
  if (!message || message.recalled) return null;
  message.recalled = true;
  return message;
}

export function rememberMessageBadgeDismissed(badgeKey) {
  rememberDismissedMessageBadge(badgeKey);
}

export function editOngoingChatMessage(chatKey, messageId, text) {
  const message = getOngoingChatMessage(chatKey, messageId);
  const content = String(text || "").trim();
  if (!message || message.from !== "doctor" || message.recalled || !content) return null;
  message.text = content;
  message.edited = true;
  message.editedAt = formatChatDateTime();
  return message;
}

export function appendDoctorChatMessage(chatKey, text, { quote = null, date = new Date() } = {}) {
  if (!chatKey || !ongoingChatState[chatKey]) return null;
  const chat = ongoingChatState[chatKey];
  const normalizedQuote = quote ? buildChatQuote(quote) : null;
  const message = {
    id: `${chatKey}-doctor-${date.getTime()}`,
    from: "doctor",
    text,
    time: formatChatDateTime(date),
    recalled: false,
    edited: false,
    quote: normalizedQuote
  };
  chat.messages = [...(chat.messages || []), message];
  return message;
}

export async function generatePatientReplyForChat(chatKey, doctorMessage) {
  const chat = ongoingChatState[chatKey];
  if (!chat || !doctorMessage) return null;
  const record = consultationRecords.find((item) => item.id === chatKey) || null;
  const response = await generatePatientAutoReply({
    recordId: chatKey,
    doctorMessage,
    record,
    chat
  });
  if (!response?.message) return null;
  chat.messages = [...(chat.messages || []), response.message];
  return response.message;
}
