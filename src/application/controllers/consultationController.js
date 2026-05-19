import { updateConsultationStatus } from "../../infrastructure/api/appApi.js";
import { appView, getRecordParam, getRoomHref } from "../../shared/core.js";
import { consultationRecords, updateConsultationRecordState } from "../state/dataStore.js";
import { consultationEvents } from "../../domain/consultationStateMachine.js";
import { buildWaitingQueueFromRecords } from "../../domain/consultationQueue.js";
import {
  clearActiveVideoConsultation,
  sendConsultationEvent,
  setActiveVideoConsultation,
  setWaitingQueue
} from "../state/runtimeState.js";

const terminalConsultationEvents = {
  cancel: {
    event: consultationEvents.CANCEL,
    state: "cancelled",
    message: "已取消问诊"
  },
  end: {
    event: consultationEvents.END,
    state: "ended",
    message: "问诊已结束"
  }
};

export function getActiveOngoingRecordId(view = appView) {
  const recordId = getRecordParam();
  if (recordId) return recordId;
  if (view === "text") return "active-text";
  if (view === "video") return "active-video";
  return null;
}

export function getActiveConsultationRecord() {
  const recordId = getActiveOngoingRecordId();
  return consultationRecords.find((entry) => entry.id === recordId && entry.state === "ongoing");
}

export function getConsultationRecordById(recordId) {
  return consultationRecords.find((entry) => entry.id === recordId) || null;
}

export function getFirstEndedConsultationRecord({ type = "all" } = {}) {
  return consultationRecords.find(
    (record) => (type === "all" || record.type === type) && record.state === "ended"
  ) || null;
}

export function activateVideoConsultation(recordId) {
  setActiveVideoConsultation(recordId);
}

export function syncWaitingQueueToMessages({ silent = false } = {}) {
  setWaitingQueue(buildWaitingQueueFromRecords(consultationRecords), { silent });
}

export function syncActiveElapsedSeconds(seconds) {
  const recordId = getActiveOngoingRecordId();
  if (!recordId) return;
  const record = consultationRecords.find((entry) => entry.id === recordId);
  if (record) record.elapsedSeconds = seconds;
}

export function openRiskReviewForActiveConsultation() {
  return syncActiveConsultationEvent(consultationEvents.OPEN_RISK_REVIEW);
}

export function submitPrescriptionForActiveConsultation() {
  return syncActiveConsultationEvent(consultationEvents.SUBMIT_PRESCRIPTION);
}

export function syncActiveConsultationEvent(event) {
  const recordId = getActiveOngoingRecordId();
  if (!recordId) return null;
  sendConsultationEvent(recordId, event);
  return updateConsultationStatus(recordId, event);
}

export async function resolveActiveConsultation(kind) {
  const config = terminalConsultationEvents[kind];
  if (!config) return null;

  const recordId = getActiveOngoingRecordId();
  const record = consultationRecords.find((entry) => entry.id === recordId);
  if (!recordId) {
    return {
      message: config.message,
      redirectHref: getRoomHref()
    };
  }

  sendConsultationEvent(recordId, config.event);
  const updatedRecord = updateConsultationRecordState(recordId, config.state);
  if (record?.type === "video") {
    clearActiveVideoConsultation(recordId);
  }
  syncWaitingQueueToMessages();

  await updateConsultationStatus(recordId, config.event, updatedRecord);
  return {
    recordId,
    record: updatedRecord,
    message: config.message,
    redirectHref: getRoomHref()
  };
}
