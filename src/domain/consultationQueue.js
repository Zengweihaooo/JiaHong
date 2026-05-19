export const maxVisibleOngoingConsultations = 6;

export function getMessageListRecords(records = [], { type = "all", state = "ongoing" } = {}) {
  const filteredRecords = records.filter(
    (record) => (type === "all" || record.type === type) && record.state === state
  );
  return state === "ongoing"
    ? filteredRecords.slice(0, maxVisibleOngoingConsultations)
    : filteredRecords;
}

export function buildWaitingQueueFromRecords(records = [], date = new Date()) {
  const visibleOngoingRecords = getMessageListRecords(records, { type: "all", state: "ongoing" });
  const byType = visibleOngoingRecords.reduce(
    (counts, record) => {
      const type = record.type || "consult";
      counts[type] = (counts[type] || 0) + 1;
      return counts;
    },
    { text: 0, video: 0, consult: 0 }
  );

  return {
    total: visibleOngoingRecords.length,
    byType: {
      text: byType.text || 0,
      video: byType.video || 0,
      consult: byType.consult || 0
    },
    updatedAt: date.toISOString()
  };
}
