import { updateConsultationStatus } from "../../infrastructure/api/appApi.js";
import {
  consultationRecords,
  getActiveOngoingConsultationRecord,
  getActiveOngoingConsultationRecordId,
  getConsultationRecordById as findConsultationRecordById,
  getFirstEndedConsultationRecordByType,
  updateConsultationRecordState
} from "../state/dataStore.js";
import { consultationEvents } from "../../domain/consultationStateMachine.js";
import { buildWaitingQueueFromRecords } from "../../domain/consultationQueue.js";
import { getNextOngoingVideoConsultationRecord } from "../../domain/consultationQueue.js";
import {
  clearActiveVideoConsultation,
  sendConsultationEvent,
  setActiveVideoConsultation,
  setWaitingQueue
} from "../state/runtimeState.js?v=20260528-06";
import { hasUnresolvedPrescriptionWarnings, hasUnresolvedMustPrescriptionWarnings, canEndConsultation } from "./prescriptionController.js";

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

export function getActiveOngoingRecordId(context = {}) {
  return getActiveOngoingConsultationRecordId(context);
}

export function getActiveConsultationRecord(context = {}) {
  return getActiveOngoingConsultationRecord(context);
}

export function getConsultationRecordById(recordId) {
  return findConsultationRecordById(recordId);
}

export function getFirstEndedConsultationRecord({ type = "all" } = {}) {
  return getFirstEndedConsultationRecordByType(type);
}

export function activateVideoConsultation(recordId) {
  setActiveVideoConsultation(recordId);
}

export function syncWaitingQueueToMessages({ silent = false } = {}) {
  setWaitingQueue(buildWaitingQueueFromRecords(consultationRecords), { silent });
}

export function syncActiveElapsedSeconds(seconds, context = {}) {
  const recordId = getActiveOngoingRecordId(context);
  if (!recordId) return;
  const record = consultationRecords.find((entry) => entry.id === recordId);
  if (record) record.elapsedSeconds = seconds;
}

export function openRiskReviewForActiveConsultation(context = {}) {
  return syncActiveConsultationEvent(consultationEvents.OPEN_RISK_REVIEW, context);
}

export function activePrescriptionHasWarnings(context = {}) {
  return hasUnresolvedPrescriptionWarnings(getActiveConsultationRecord(context));
}

export function activePrescriptionHasMustWarnings(context = {}) {
  return hasUnresolvedMustPrescriptionWarnings(getActiveConsultationRecord(context));
}

export function activeConsultationCanEnd(context = {}) {
  return canEndConsultation(getActiveConsultationRecord(context));
}

export function showPrescriptionWarningsForActiveConsultation(context = {}) {
  const record = getActiveConsultationRecord(context);
  if (record) {
    record.inlineRiskWarningVisible = true;
  }
  return openRiskReviewForActiveConsultation(context);
}

export async function submitPrescriptionForActiveConsultation(context = {}) {
  const response = await syncActiveConsultationEvent(consultationEvents.SUBMIT_PRESCRIPTION, context);
  const record = getActiveConsultationRecord(context);
  if (record) {
    record.prescriptionSubmitted = true;
    record.inlineRiskWarningVisible = false;
  }
  return response;
}

export function syncActiveConsultationEvent(event, context = {}) {
  const recordId = getActiveOngoingRecordId(context);
  if (!recordId) return null;
  sendConsultationEvent(recordId, event);
  return updateConsultationStatus(recordId, event);
}

export async function resolveActiveConsultation(kind, context = {}) {
  const config = terminalConsultationEvents[kind];
  if (!config) return null;

  const recordId = getActiveOngoingRecordId(context);
  const record = consultationRecords.find((entry) => entry.id === recordId);
  if (!recordId) {
    return {
      message: config.message
    };
  }

  sendConsultationEvent(recordId, config.event);
  const updatedRecord = updateConsultationRecordState(recordId, config.state);
  let nextVideoRecord = null;
  if (record?.type === "video") {
    if (kind === "end") {
      nextVideoRecord = getNextOngoingVideoConsultationRecord(consultationRecords, { excludeRecordId: recordId });
      if (nextVideoRecord) {
        setActiveVideoConsultation(nextVideoRecord.id, { silent: true });
      } else {
        clearActiveVideoConsultation(recordId, { silent: true });
      }
    } else {
      clearActiveVideoConsultation(recordId, { silent: true });
    }
  }
  syncWaitingQueueToMessages();

  await updateConsultationStatus(recordId, config.event, updatedRecord);
  return {
    recordId,
    record: updatedRecord,
    nextVideoRecord,
    message: nextVideoRecord ? "问诊已结束，已自动接入下一位视频问诊" : config.message
  };
}
