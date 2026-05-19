import {
  createStateMachine,
  mapRecordStateToMachineState
} from "./domain/consultationStateMachine.js";

export const serviceState = {};
export const consultationMachines = {};
export const doctorStatusState = {
  status: "offline"
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

export function subscribeRuntimeState(listener) {
  runtimeStateListeners.add(listener);
  return () => runtimeStateListeners.delete(listener);
}

function emitRuntimeStateChange() {
  runtimeStateListeners.forEach((listener) => listener());
}

export function initRuntimeState({ services = [], consultationRecords = [], doctor = null, waitingQueue = null } = {}) {
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

  doctorStatusState.status = doctor?.status || "offline";
  setWaitingQueue(
    waitingQueue || {
      total: consultationRecords.filter((record) => record.state === "ongoing").length,
      byType: {
        text: consultationRecords.filter((record) => record.state === "ongoing" && record.type === "text").length,
        video: consultationRecords.filter((record) => record.state === "ongoing" && record.type === "video").length,
        consult: consultationRecords.filter((record) => record.state === "ongoing" && record.type === "consult").length
      },
      updatedAt: new Date().toISOString()
    },
    { silent: true }
  );
  emitRuntimeStateChange();
}

export function sendConsultationEvent(recordId, event) {
  return consultationMachines[recordId]?.send(event);
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

export const dismissedBadgeStorageKey = "jh.dismissedMessageBadges";
export const safeSessionStorage =
  typeof sessionStorage === "undefined"
    ? { getItem: () => null, setItem: () => {}, removeItem: () => {} }
    : sessionStorage;
export const currentNavigation =
  typeof performance === "undefined" ? null : performance.getEntriesByType("navigation")[0];
if (currentNavigation?.type === "reload") {
  safeSessionStorage.removeItem(dismissedBadgeStorageKey);
}
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

export function getMessageBadgeKey(type, targetView, index = 0) {
  return `${type}:${targetView}:${index}`;
}
