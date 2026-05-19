import { fetchJson } from "./httpClient.js";

const mockLatencyMs = 80;
let realtimeTick = 0;
const runtimeStorageKey = "jh.mockRuntimeState";

function readRuntimeState() {
  try {
    return JSON.parse(sessionStorage.getItem(runtimeStorageKey) || "{}");
  } catch {
    return {};
  }
}

function writeRuntimeState(patch) {
  const nextState = { ...readRuntimeState(), ...patch };
  sessionStorage.setItem(runtimeStorageKey, JSON.stringify(nextState));
  return nextState;
}

function delay(ms = mockLatencyMs) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export async function getAppBootstrap() {
  await delay();
  const payload = await fetchJson(new URL("../mocks/app-bootstrap.json", import.meta.url));
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

  const text = 1 + (realtimeTick % 3);
  const video = realtimeTick % 2;
  const consult = Math.floor(realtimeTick / 2) % 2;

  const waitingQueue = {
    total: text + video + consult,
    byType: { text, video, consult },
    updatedAt: new Date().toISOString()
  };
  writeRuntimeState({ waitingQueue });

  return { waitingQueue };
}

export async function updateConsultationStatus(recordId, event) {
  await delay(40);
  return { recordId, event, updatedAt: new Date().toISOString() };
}
