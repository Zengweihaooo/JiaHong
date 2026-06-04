import { normalizeArchivedConsultationRecord } from "../../domain/archivedConsultation.js";
import { getMessageListRecords, sortOngoingContactRecords } from "../../domain/consultationQueue.js";

export const appData = {
  schemaVersion: null,
  doctor: null,
  waitingQueue: null,
  navigation: { menuGroups: [] },
  home: {
    quickActions: [],
    quickEntryOptions: [],
    announcements: []
  },
  services: [],
  consultations: {
    records: [],
    ongoingChats: {}
  },
  quickReplies: {
    categories: [],
    messages: []
  }
};

export let menuGroups = appData.navigation.menuGroups;
export let doctor = appData.doctor;
export let waitingQueue = appData.waitingQueue;
export let quickActions = appData.home.quickActions;
export let quickEntryOptions = appData.home.quickEntryOptions;
export let announcements = appData.home.announcements;
export let latestAnnouncement = null;
export let services = appData.services;
export let consultationRecords = appData.consultations.records;
export let ongoingChatState = appData.consultations.ongoingChats;
export let quickReplyCategories = appData.quickReplies.categories;
export let quickReplyMessages = appData.quickReplies.messages;

export function hydrateAppData(payload) {
  appData.schemaVersion = payload.schemaVersion ?? null;
  appData.doctor = payload.doctor ?? null;
  appData.waitingQueue = payload.waitingQueue ?? null;
  appData.navigation = payload.navigation ?? appData.navigation;
  appData.home = payload.home ?? appData.home;
  appData.services = payload.services ?? [];
  appData.consultations = payload.consultations ?? appData.consultations;
  appData.quickReplies = payload.quickReplies ?? appData.quickReplies;

  menuGroups = appData.navigation.menuGroups ?? [];
  doctor = appData.doctor;
  waitingQueue = appData.waitingQueue;
  quickActions = appData.home.quickActions ?? [];
  quickEntryOptions = appData.home.quickEntryOptions ?? [];
  announcements = appData.home.announcements ?? [];
  latestAnnouncement = announcements[0] ?? null;
  services = appData.services;
  consultationRecords = appData.consultations.records ?? [];
  ongoingChatState = appData.consultations.ongoingChats ?? {};
  quickReplyCategories = appData.quickReplies.categories ?? [];
  quickReplyMessages = appData.quickReplies.messages ?? [];
}

export function addConsultationRecord(record, chat) {
  if (!record?.id || consultationRecords.some((item) => item.id === record.id)) return false;
  const ongoingRecords = sortOngoingContactRecords([
    ...consultationRecords.filter((item) => item.state === "ongoing"),
    record
  ]);
  const archivedRecords = consultationRecords.filter((item) => item.state !== "ongoing");
  consultationRecords = [...ongoingRecords, ...archivedRecords];
  appData.consultations.records = consultationRecords;
  if (chat) {
    ongoingChatState[record.id] = chat;
    appData.consultations.ongoingChats = ongoingChatState;
  }
  return true;
}

export function getDefaultOngoingConsultationRecord({ view = "" } = {}) {
  if (!view || view === "room") {
    return getMessageListRecords(consultationRecords, { type: "all", state: "ongoing" })[0] || null;
  }
  return consultationRecords.find((record) => record.state === "ongoing" && record.targetView === view) ||
    consultationRecords.find((record) => record.state === "ongoing" && record.type === view) ||
    null;
}

export function getDefaultEndedConsultationRecord() {
  return getMessageListRecords(consultationRecords, { type: "all", state: "ended" })[0] || null;
}

export function getActiveOngoingConsultationRecordId({ sessionId = "", recordId = "", view = "" } = {}) {
  const explicitSessionId = sessionId || recordId;
  if (explicitSessionId) return explicitSessionId;
  return getDefaultOngoingConsultationRecord({ view })?.id || null;
}

export function getConsultationRecordById(recordId) {
  return consultationRecords.find((entry) => entry.id === recordId) || null;
}

export function markAnnouncementRead(announcementId) {
  const announcement = announcements.find((item) => item.id === announcementId) || latestAnnouncement;
  if (!announcement) return null;
  announcement.unread = false;
  return announcement;
}

export function getOngoingConsultationRecordById(recordId) {
  return consultationRecords.find((entry) => entry.id === recordId && entry.state === "ongoing") || null;
}

export function getActiveOngoingConsultationRecord(context = {}) {
  return getOngoingConsultationRecordById(getActiveOngoingConsultationRecordId(context));
}

export function getFirstEndedConsultationRecordByType(type = "all") {
  return getMessageListRecords(consultationRecords, { type, state: "ended" })[0] || null;
}

function formatEndedAt(date = new Date()) {
  const pad = (value) => String(value).padStart(2, "0");
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate())
  ].join("-") + ` ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function updateConsultationRecordState(recordId, state) {
  const record = consultationRecords.find((item) => item.id === recordId);
  if (!record) return null;
  record.state = state;
  if (state === "ended" && !record.endedAt) {
    record.endedAt = formatEndedAt();
  }
  if (state !== "ongoing") {
    record.badge = 0;
    record.unreadCount = 0;
  }
  if (state === "ended") {
    Object.assign(record, normalizeArchivedConsultationRecord(record, ongoingChatState[recordId]));
  }
  return record;
}
