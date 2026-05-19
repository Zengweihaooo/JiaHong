export const consultationStates = {
  WAITING: "waiting",
  ONGOING: "ongoing",
  RISK_REVIEW: "risk_review",
  PRESCRIPTION_SUBMITTED: "prescription_submitted",
  ENDED: "ended",
  CANCELLED: "cancelled",
  ARCHIVED: "archived"
};

export const consultationEvents = {
  ACCEPT: "ACCEPT",
  OPEN_RISK_REVIEW: "OPEN_RISK_REVIEW",
  SUBMIT_PRESCRIPTION: "SUBMIT_PRESCRIPTION",
  END: "END",
  CANCEL: "CANCEL",
  ARCHIVE: "ARCHIVE"
};

const transitions = {
  [consultationStates.WAITING]: {
    [consultationEvents.ACCEPT]: consultationStates.ONGOING,
    [consultationEvents.CANCEL]: consultationStates.CANCELLED
  },
  [consultationStates.ONGOING]: {
    [consultationEvents.OPEN_RISK_REVIEW]: consultationStates.RISK_REVIEW,
    [consultationEvents.CANCEL]: consultationStates.CANCELLED,
    [consultationEvents.END]: consultationStates.ENDED
  },
  [consultationStates.RISK_REVIEW]: {
    [consultationEvents.SUBMIT_PRESCRIPTION]: consultationStates.PRESCRIPTION_SUBMITTED,
    [consultationEvents.CANCEL]: consultationStates.CANCELLED
  },
  [consultationStates.PRESCRIPTION_SUBMITTED]: {
    [consultationEvents.END]: consultationStates.ENDED
  },
  [consultationStates.ENDED]: {
    [consultationEvents.ARCHIVE]: consultationStates.ARCHIVED
  }
};

export function createStateMachine(initialState = consultationStates.WAITING) {
  let current = initialState;

  return {
    get state() {
      return current;
    },
    can(event) {
      return Boolean(transitions[current]?.[event]);
    },
    send(event) {
      const next = transitions[current]?.[event];
      if (!next) return current;
      current = next;
      return current;
    }
  };
}

export function mapRecordStateToMachineState(recordState) {
  if (recordState === "ongoing") return consultationStates.ONGOING;
  if (recordState === "ended") return consultationStates.ARCHIVED;
  return consultationStates.WAITING;
}
