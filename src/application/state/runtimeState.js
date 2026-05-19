import {
  createStateMachine,
  mapRecordStateToMachineState
} from "../../domain/consultationStateMachine.js";
import { buildWaitingQueueFromRecords } from "../../domain/consultationQueue.js";

export const serviceState = {};
export const consultationMachines = {};
export const doctorStatusState = {
  status: "offline"
};
export const activeVideoConsultationState = {
  recordId: ""
};
export const waitingQueueState = {
  total: 0,
  byType: {
    text: 0,
    video: 0,
    consult: 0
  },
  updatedAt: null
};

const runtimeStateListeners = new Set();
export const activeVideoConsultationStorageKey = "jh.activeVideoConsultationId.v1";
export const dismissedBadgeStorageKey = "jh.dismissedMessageBadges.v2";
export const safeSessionStorage =
  typeof sessionStorage === "undefined"
    ? { getItem: () => null, setItem: () => {}, removeItem: () => {} }
    : sessionStorage;

export function subscribeRuntimeState(listener) {
  runtimeStateListeners.add(listener);
  return () => runtimeStateListeners.delete(listener);
}

function emitRuntimeStateChange() {
  runtimeStateListeners.forEach((listener) => listener());
}

export function initRuntimeState({ services = [], consultationRecords = [], doctor = null } = {}) {
  Object.keys(serviceState).forEach((key) => {
    delete serviceState[key];
  });
  services.forEach((service) => {
    serviceState[service.key] = service.enabled;
  });

  Object.keys(consultationMachines).forEach((key) => {
    delete consultationMachines[key];
  });
  consultationRecords.forEach((record) => {
    consultationMachines[record.id] = createStateMachine(mapRecordStateToMachineState(record.state));
  });

  const storedActiveVideoId = safeSessionStorage.getItem(activeVideoConsultationStorageKey);
  const storedActiveVideo = consultationRecords.find(
    (record) => record.id === storedActiveVideoId && record.type === "video" && record.state === "ongoing"
  );
  const defaultActiveVideo = consultationRecords.find(
    (record) => record.id === "active-video" && record.type === "video" && record.state === "ongoing"
  );
  activeVideoConsultationState.recordId = storedActiveVideo?.id || defaultActiveVideo?.id || "";
  if (activeVideoConsultationState.recordId) {
    safeSessionStorage.setItem(activeVideoConsultationStorageKey, activeVideoConsultationState.recordId);
  } else {
    safeSessionStorage.removeItem(activeVideoConsultationStorageKey);
  }

  doctorStatusState.status = doctor?.status || "offline";
  setWaitingQueue(buildWaitingQueueFromRecords(consultationRecords), { silent: true });
  emitRuntimeStateChange();
}

export function sendConsultationEvent(recordId, event) {
  return consultationMachines[recordId]?.send(event);
}

export function registerConsultationMachine(record) {
  if (!record?.id || consultationMachines[record.id]) return;
  consultationMachines[record.id] = createStateMachine(mapRecordStateToMachineState(record.state));
}

export function setActiveVideoConsultation(recordId, { silent = false } = {}) {
  activeVideoConsultationState.recordId = recordId || "";
  if (activeVideoConsultationState.recordId) {
    safeSessionStorage.setItem(activeVideoConsultationStorageKey, activeVideoConsultationState.recordId);
  } else {
    safeSessionStorage.removeItem(activeVideoConsultationStorageKey);
  }
  if (!silent) emitRuntimeStateChange();
}

export function clearActiveVideoConsultation(recordId, { silent = false } = {}) {
  if (recordId && activeVideoConsultationState.recordId !== recordId) return;
  setActiveVideoConsultation("", { silent });
}

export function setDoctorStatus(status, { silent = false } = {}) {
  doctorStatusState.status = status;
  if (!silent) emitRuntimeStateChange();
}

export function setWaitingQueue(queue, { silent = false } = {}) {
  const byType = queue?.byType || {};
  waitingQueueState.byType = {
    text: Number(byType.text) || 0,
    video: Number(byType.video) || 0,
    consult: Number(byType.consult) || 0
  };
  waitingQueueState.total =
    typeof queue?.total === "number"
      ? queue.total
      : waitingQueueState.byType.text + waitingQueueState.byType.video + waitingQueueState.byType.consult;
  waitingQueueState.updatedAt = queue?.updatedAt || new Date().toISOString();
  if (!silent) emitRuntimeStateChange();
}

export const currentNavigation =
  typeof performance === "undefined" ? null : performance.getEntriesByType("navigation")[0];
export const dismissedMessageBadges = new Set(
  JSON.parse(safeSessionStorage.getItem(dismissedBadgeStorageKey) || "[]")
);

export function rememberDismissedMessageBadge(badgeKey) {
  if (!badgeKey) return;
  dismissedMessageBadges.add(badgeKey);
  safeSessionStorage.setItem(
    dismissedBadgeStorageKey,
    JSON.stringify(Array.from(dismissedMessageBadges))
  );
}

export function getMessageBadgeKey(recordId) {
  return `record:${recordId}`;
}
