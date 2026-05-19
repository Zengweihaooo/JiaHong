import { getRealtimeSnapshot } from "../../infrastructure/api/appApi.js";
import { addConsultationRecord } from "../state/dataStore.js";
import { registerConsultationMachine } from "../state/runtimeState.js";
import { setDoctorStatusState } from "./runtimeController.js";
import { syncWaitingQueueToMessages } from "./consultationController.js";

export async function refreshRealtimeState() {
  const snapshot = await getRealtimeSnapshot();
  let addedConsultation = null;

  if (snapshot.newConsultation) {
    const added = addConsultationRecord(snapshot.newConsultation.record, snapshot.newConsultation.chat);
    if (added) {
      registerConsultationMachine(snapshot.newConsultation.record);
      addedConsultation = snapshot.newConsultation;
    }
  }

  syncWaitingQueueToMessages();

  if (snapshot.doctorStatus) {
    setDoctorStatusState(snapshot.doctorStatus, { sync: false });
  }

  return {
    ...snapshot,
    addedConsultation
  };
}
