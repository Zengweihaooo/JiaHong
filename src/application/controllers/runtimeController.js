import {
  updateDoctorStatus,
  updateServiceAvailability
} from "../../infrastructure/api/appApi.js";
import {
  doctorStatusState,
  serviceState,
  setDoctorStatus,
  subscribeRuntimeState,
  waitingQueueState
} from "../state/runtimeState.js";

const doctorStatusOrder = ["online", "busy", "offline"];

export function getDoctorStatus() {
  return doctorStatusState.status;
}

export function getNextDoctorStatus() {
  const currentIndex = Math.max(0, doctorStatusOrder.indexOf(getDoctorStatus()));
  return doctorStatusOrder[(currentIndex + 1) % doctorStatusOrder.length];
}

export function getToggledDoctorStatus() {
  return getDoctorStatus() === "offline" ? "online" : "offline";
}

export function setDoctorStatusState(nextStatus, { sync = true } = {}) {
  setDoctorStatus(nextStatus);
  return sync ? updateDoctorStatus(nextStatus) : Promise.resolve({ status: nextStatus });
}

export function getServiceAvailability(serviceKey) {
  return Boolean(serviceState[serviceKey]);
}

export function getServiceAvailabilityEntries() {
  return Object.entries(serviceState);
}

export function getWaitingQueueState() {
  return waitingQueueState;
}

export function subscribeToRuntimeState(listener) {
  return subscribeRuntimeState(listener);
}

export function setServiceAvailabilityState(serviceKey, enabled, { sync = true } = {}) {
  if (!serviceKey) return Promise.resolve({ serviceKey, enabled });
  serviceState[serviceKey] = enabled;
  return sync
    ? updateServiceAvailability(serviceKey, enabled)
    : Promise.resolve({ serviceKey, enabled });
}
