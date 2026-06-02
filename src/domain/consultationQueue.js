export const maxVisibleOngoingConsultations = 6;
export const contactLayoutTypeOrder = ["video", "text", "consult"];

function getRecordSortMinutes(record = {}) {
  const match = String(record.time || "").match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return -1;
  return Number(match[1]) * 60 + Number(match[2]);
}

function sortRecordsByRecentTime(records = []) {
  return records
    .map((record, index) => ({ record, index }))
    .sort((left, right) => {
      const timeDiff = getRecordSortMinutes(right.record) - getRecordSortMinutes(left.record);
      return timeDiff || left.index - right.index;
    })
    .map((item) => item.record);
}

function getContactLayoutTypeRank(record = {}) {
  const index = contactLayoutTypeOrder.indexOf(record.type);
  return index === -1 ? contactLayoutTypeOrder.length : index;
}

function getPreferredVideoRecord(records = [], preferredRecordId = "") {
  return (
    records.find(
      (record) => record.id === preferredRecordId && record.type === "video" && record.state === "ongoing"
    ) ||
    sortRecordsByRecentTime(records.filter((record) => record.type === "video" && record.state === "ongoing"))[0] ||
    null
  );
}

export function sortOngoingContactRecords(records = [], { activeVideoRecordId = "" } = {}) {
  const preferredVideo = getPreferredVideoRecord(records, activeVideoRecordId);
  return records
    .map((record, index) => ({ record, index }))
    .sort((left, right) => {
      if (preferredVideo?.id) {
        if (left.record.id === preferredVideo.id) return -1;
        if (right.record.id === preferredVideo.id) return 1;
      }
      const typeDiff = getContactLayoutTypeRank(left.record) - getContactLayoutTypeRank(right.record);
      if (typeDiff) return typeDiff;
      const timeDiff = getRecordSortMinutes(right.record) - getRecordSortMinutes(left.record);
      return timeDiff || left.index - right.index;
    })
    .map((item) => item.record);
}

export function getNextOngoingVideoConsultationRecord(records = [], { excludeRecordId = "", preferredRecordId = "" } = {}) {
  const videoRecords = records.filter(
    (record) => record.type === "video" && record.state === "ongoing" && record.id !== excludeRecordId
  );
  return getPreferredVideoRecord(videoRecords, preferredRecordId);
}

function collapseOngoingVideoRecords(records = [], activeVideoRecordId = "") {
  const preferredVideo = getPreferredVideoRecord(records, activeVideoRecordId);
  if (!preferredVideo) return records;
  return records.filter((record) => record.type !== "video" || record.id === preferredVideo.id);
}

export function getMessageListRecords(
  records = [],
  { type = "all", state = "ongoing", activeVideoRecordId = "", collapseVideoQueue = false } = {}
) {
  const filteredRecords = records.filter(
    (record) => (type === "all" || record.type === type) && record.state === state
  );
  const displayRecords = state === "ongoing" && collapseVideoQueue
    ? collapseOngoingVideoRecords(filteredRecords, activeVideoRecordId)
    : filteredRecords;
  const sortedRecords = sortOngoingContactRecords(displayRecords, { activeVideoRecordId });
  return state === "ongoing" ? sortedRecords.slice(0, maxVisibleOngoingConsultations) : sortedRecords;
}

export function buildWaitingQueueFromRecords(records = [], date = new Date()) {
  const visibleOngoingRecords = getMessageListRecords(records, { type: "all", state: "ongoing" }).filter(
    (record) => record.type === "text" || record.type === "video" || record.type === "consult"
  );
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
