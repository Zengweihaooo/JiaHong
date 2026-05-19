import { fetchJson } from "./httpClient.js";

const mockLatencyMs = 80;
let realtimeTick = 0;
const runtimeStorageKey = "jh.mockRuntimeState";
const runtimeSchemaVersion = 6;
const maxRuntimeConsultations = 6;
const baseWaitingQueue = {
  total: 2,
  byType: { text: 1, video: 1, consult: 0 }
};
const bootstrapUrl = new URL("../mocks/app-bootstrap.json", import.meta.url);

function readRuntimeState() {
  try {
    const state = JSON.parse(sessionStorage.getItem(runtimeStorageKey) || "{}");
    if (state.schemaVersion !== runtimeSchemaVersion) return {};
    return state;
  } catch {
    return {};
  }
}

function writeRuntimeState(patch) {
  const nextState = { ...readRuntimeState(), schemaVersion: runtimeSchemaVersion, ...patch };
  sessionStorage.setItem(runtimeStorageKey, JSON.stringify(nextState));
  return nextState;
}

function delay(ms = mockLatencyMs) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function getRuntimeConsultations() {
  const runtimeState = readRuntimeState();
  return {
    records: runtimeState.consultationRecords || [],
    chats: runtimeState.ongoingChats || {}
  };
}

function writeRuntimeConsultation(record, chat) {
  const runtimeState = readRuntimeState();
  const records = runtimeState.consultationRecords || [];
  const chats = runtimeState.ongoingChats || {};
  if (records.some((item) => item.id === record.id)) {
    return { records, chats };
  }
  const nextRecords = insertAtRandomPosition(record, records).slice(
    0,
    maxRuntimeConsultations - baseWaitingQueue.total
  );
  const keptIds = new Set(nextRecords.map((item) => item.id));
  const nextChats = { ...chats, [record.id]: chat };
  Object.keys(nextChats).forEach((chatId) => {
    if (!keptIds.has(chatId)) delete nextChats[chatId];
  });
  writeRuntimeState({
    consultationRecords: nextRecords,
    ongoingChats: nextChats
  });
  return { records: nextRecords, chats: nextChats };
}

function formatRuntimeEndedAt(date = new Date()) {
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function findConsultationRecord(recordId, payload, runtimeRecords) {
  return (
    runtimeRecords.find((record) => record.id === recordId) ||
    payload.consultations?.records?.find((record) => record.id === recordId) ||
    payload.consultations?.realtimePool?.records?.find((record) => record.id === recordId) ||
    null
  );
}

function pickRandomAvailableConsultation(poolRecords, runtimeRecords) {
  const usedIds = new Set(runtimeRecords.map((record) => record.id));
  const availableRecords = poolRecords.filter((record) => !usedIds.has(record.id));
  if (!availableRecords.length) return null;
  const index = Math.floor(Math.random() * availableRecords.length);
  return availableRecords[index];
}

function insertAtRandomPosition(record, records) {
  const nextRecords = [...records];
  const index = Math.floor(Math.random() * (nextRecords.length + 1));
  nextRecords.splice(index, 0, record);
  return nextRecords;
}

function buildWaitingQueue(runtimeRecords) {
  const ongoingRuntimeRecords = runtimeRecords.filter((record) => record.state === "ongoing");
  const addedText = ongoingRuntimeRecords.filter((record) => record.type === "text").length;
  const addedVideo = ongoingRuntimeRecords.filter((record) => record.type === "video").length;
  const text = Math.min(baseWaitingQueue.byType.text + addedText, 3);
  const video = Math.min(baseWaitingQueue.byType.video + addedVideo, 3);
  const consult = baseWaitingQueue.byType.consult;
  return {
    total: Math.min(text + video + consult, maxRuntimeConsultations),
    byType: { text, video, consult },
    updatedAt: new Date().toISOString()
  };
}

export async function getAppBootstrap() {
  await delay();
  const payload = await fetchJson(bootstrapUrl);
  const runtimeState = readRuntimeState();
  if (runtimeState.doctorStatus && payload.doctor) {
    payload.doctor = { ...payload.doctor, status: runtimeState.doctorStatus };
  }
  if (runtimeState.waitingQueue) {
    payload.waitingQueue = runtimeState.waitingQueue;
  }
  if (runtimeState.services) {
    payload.services = payload.services.map((service) => ({
      ...service,
      enabled:
        typeof runtimeState.services[service.key] === "boolean"
          ? runtimeState.services[service.key]
          : service.enabled
    }));
  }
  if (runtimeState.consultationRecords?.length) {
    const runtimeRecords = runtimeState.consultationRecords.slice(0, maxRuntimeConsultations);
    payload.consultations.records = [
      ...runtimeRecords,
      ...payload.consultations.records.filter(
        (record) => !runtimeRecords.some((item) => item.id === record.id)
      )
    ];
  }
  if (runtimeState.ongoingChats) {
    payload.consultations.ongoingChats = {
      ...payload.consultations.ongoingChats,
      ...runtimeState.ongoingChats
    };
  }
  return payload;
}

export async function updateServiceAvailability(serviceKey, enabled) {
  await delay(40);
  const runtimeState = readRuntimeState();
  writeRuntimeState({
    services: {
      ...(runtimeState.services || {}),
      [serviceKey]: enabled
    }
  });
  return { serviceKey, enabled, updatedAt: new Date().toISOString() };
}

export async function updateDoctorStatus(status) {
  await delay(40);
  writeRuntimeState({ doctorStatus: status });
  return { status, updatedAt: new Date().toISOString() };
}

export async function getRealtimeSnapshot() {
  await delay(40);
  realtimeTick += 1;

  const payload = await fetchJson(bootstrapUrl);
  const poolRecords = payload.consultations?.realtimePool?.records || [];
  const poolChats = payload.consultations?.realtimePool?.chats || {};
  let currentConsultations = getRuntimeConsultations();
  let newConsultation = null;

  const currentTotal =
    baseWaitingQueue.total +
    currentConsultations.records.filter((record) => record.state === "ongoing").length;
  if (currentTotal < maxRuntimeConsultations) {
    const record = pickRandomAvailableConsultation(poolRecords, currentConsultations.records);
    if (record) {
      newConsultation = {
        record,
        chat: poolChats[record.id]
      };
      currentConsultations = writeRuntimeConsultation(record, poolChats[record.id]);
    }
  }

  const waitingQueue = buildWaitingQueue(currentConsultations.records);
  writeRuntimeState({ waitingQueue });

  return {
    waitingQueue,
    newConsultation,
    tick: realtimeTick
  };
}

export async function updateConsultationStatus(recordId, event, recordPatch = null) {
  await delay(40);
  if (event === "END" || event === "CANCEL") {
    const payload = await fetchJson(bootstrapUrl);
    const runtimeState = readRuntimeState();
    const runtimeRecords = runtimeState.consultationRecords || [];
    const sourceRecord = recordPatch || findConsultationRecord(recordId, payload, runtimeRecords);
    if (sourceRecord) {
      const nextState = event === "END" ? "ended" : "cancelled";
      const nextRecord = {
        ...sourceRecord,
        state: nextState,
        badge: 0,
        unreadCount: 0
      };
      if (nextState === "ended" && !nextRecord.endedAt) {
        nextRecord.endedAt = formatRuntimeEndedAt();
      }
      const nextRecords = runtimeRecords.some((record) => record.id === recordId)
        ? runtimeRecords.map((record) => (record.id === recordId ? nextRecord : record))
        : [nextRecord, ...runtimeRecords];
      writeRuntimeState({ consultationRecords: nextRecords });
    }
  }
  return { recordId, event, updatedAt: new Date().toISOString() };
}
