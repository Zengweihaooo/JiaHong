import { ongoingChatState } from "../state/dataStore.js";
import { rememberDismissedMessageBadge } from "../state/runtimeState.js";

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

export function appendDoctorChatMessage(chatKey, text, date = new Date()) {
  if (!chatKey || !ongoingChatState[chatKey]) return null;
  const chat = ongoingChatState[chatKey];
  const message = {
    id: `${chatKey}-doctor-${date.getTime()}`,
    from: "doctor",
    text,
    recalled: false
  };
  chat.messages = [...(chat.messages || []), message];
  return message;
}
