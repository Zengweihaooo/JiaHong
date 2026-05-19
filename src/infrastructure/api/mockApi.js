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

function formatMessageTime(date = new Date()) {
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function pickRandom(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function getReplyIntent(text = "") {
  if (/过敏|敏感|青霉素|花粉/.test(text)) return "allergy";
  if (/发烧|发热|体温|低热|高热/.test(text)) return "fever";
  if (/咳|痰|喘|胸闷/.test(text)) return "cough";
  if (/疼|痛|不舒服|难受/.test(text)) return "pain";
  if (/药|用药|服用|吃过|处方|剂量/.test(text)) return "medicine";
  if (/怀孕|备孕|哺乳|月经/.test(text)) return "pregnancy";
  if (/多久|几天|什么时候|时间/.test(text)) return "duration";
  return "general";
}

function buildPatientReplyText({ doctorMessage = "", record = {}, chat = {} } = {}) {
  const diagnosis = record.diagnosis || record.diagnosisTags?.[0] || "这个情况";
  const preview = record.preview || "症状还是和前面描述差不多";
  const allergies = record.patientDetail?.allergies || "无";
  const intentReplies = {
    allergy: [
      allergies === "无" ? "目前没有已知药物过敏，之前吃常见感冒药也没出现过敏。" : `我有${allergies}过敏，其他药暂时没发现过敏。`,
      "我不太确定这个算不算过敏，之前没有起过大片红疹。"
    ],
    fever: [
      "刚又量了一下，体温比前面差不多，没有明显升高。",
      "现在有点低热，但精神还可以，没有寒战。"
    ],
    cough: [
      "咳嗽还是晚上明显一点，痰量不算多。",
      "目前没有明显胸闷气短，就是咳起来不太舒服。"
    ],
    pain: [
      "疼痛大概是能忍的程度，活动或者吞咽时会更明显。",
      "现在还是不舒服，但没有突然加重。"
    ],
    medicine: [
      "今天还没吃别的药，之前用过的药也没有明显不良反应。",
      "家里有一点以前的药，但我还没继续吃，想先问一下能不能用。"
    ],
    pregnancy: [
      "没有怀孕，也不在哺乳期。",
      "近期没有备孕计划，月经情况和平时差不多。"
    ],
    duration: [
      "大概是这两三天开始明显的，今天感觉更不舒服一些。",
      "最早前几天就有一点症状，昨天开始比较明显。"
    ],
    general: [
      `${preview}，目前没有其他特别明显的新症状。`,
      `主要还是${diagnosis}相关的不舒服，想尽快缓解一下。`,
      "我明白了，医生您看还需要我补充哪些情况？"
    ]
  };
  const replies = intentReplies[getReplyIntent(doctorMessage)] || intentReplies.general;
  const recentPatientMessages = (chat.messages || [])
    .filter((message) => message.from === "patient")
    .slice(-3)
    .map((message) => message.text);
  const availableReplies = replies.filter((reply) => !recentPatientMessages.includes(reply));
  return pickRandom(availableReplies.length ? availableReplies : replies);
}

function writeRuntimeChat(recordId, chat) {
  const runtimeState = readRuntimeState();
  writeRuntimeState({
    ongoingChats: {
      ...(runtimeState.ongoingChats || {}),
      [recordId]: chat
    }
  });
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

export async function generatePatientAutoReply({ recordId, doctorMessage, record = null, chat = null } = {}) {
  await delay(500 + Math.floor(Math.random() * 900));
  if (!recordId || !doctorMessage?.text) {
    return { recordId, message: null };
  }

  const payload = await fetchJson(bootstrapUrl);
  const runtimeState = readRuntimeState();
  const runtimeRecords = runtimeState.consultationRecords || [];
  const sourceRecord = record || findConsultationRecord(recordId, payload, runtimeRecords) || {};
  const sourceChat = chat || runtimeState.ongoingChats?.[recordId] || payload.consultations?.ongoingChats?.[recordId] || {};
  const date = new Date();
  const message = {
    id: `${recordId}-patient-${date.getTime()}-${Math.floor(Math.random() * 1000)}`,
    from: "patient",
    text: buildPatientReplyText({ doctorMessage: doctorMessage.text, record: sourceRecord, chat: sourceChat }),
    time: formatMessageTime(date),
    recalled: false,
    mock: true
  };

  writeRuntimeChat(recordId, {
    ...sourceChat,
    sessionDate: sourceChat.sessionDate || formatMessageTime(date),
    messages: [...(sourceChat.messages || []), message]
  });

  return {
    recordId,
    message,
    updatedAt: date.toISOString()
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
