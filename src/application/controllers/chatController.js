import { generatePatientAutoReply } from "../../infrastructure/api/appApi.js";
import { consultationRecords, ongoingChatState } from "../state/dataStore.js";
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
