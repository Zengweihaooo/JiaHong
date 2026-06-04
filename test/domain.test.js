import test from "node:test";
import assert from "node:assert/strict";

import {
  consultationEvents,
  consultationStates,
  createStateMachine,
  mapRecordStateToMachineState
} from "../src/domain/consultationStateMachine.js";
import {
  buildWaitingQueueFromRecords,
  getMessageListRecords,
  getNextOngoingVideoConsultationRecord,
  maxVisibleOngoingConsultations,
  sortOngoingContactRecords
} from "../src/domain/consultationQueue.js";
import { normalizeArchivedConsultationRecord } from "../src/domain/archivedConsultation.js";
import { getConsultationDurationTone } from "../src/domain/consultationRules.js";
import {
  getHighestMedicineRiskLevel,
  getMedicineRiskWarnings,
  prescriptionRiskCategories,
  prescriptionRiskLevels
} from "../src/domain/prescriptionRisk.js";

test("state machine follows the allowed consultation flow and ignores invalid events", () => {
  const machine = createStateMachine();

  assert.equal(machine.state, consultationStates.WAITING);
  assert.equal(machine.can(consultationEvents.END), false);
  assert.equal(machine.send(consultationEvents.END), consultationStates.WAITING);

  assert.equal(machine.can(consultationEvents.ACCEPT), true);
  assert.equal(machine.send(consultationEvents.ACCEPT), consultationStates.ONGOING);
  assert.equal(machine.send(consultationEvents.OPEN_RISK_REVIEW), consultationStates.RISK_REVIEW);
  assert.equal(machine.send(consultationEvents.SUBMIT_PRESCRIPTION), consultationStates.PRESCRIPTION_SUBMITTED);
  assert.equal(machine.send(consultationEvents.END), consultationStates.ENDED);
  assert.equal(machine.send(consultationEvents.ARCHIVE), consultationStates.ARCHIVED);

  assert.equal(machine.can(consultationEvents.CANCEL), false);
  assert.equal(machine.send(consultationEvents.CANCEL), consultationStates.ARCHIVED);
});

test("record states map to the correct machine starting points", () => {
  assert.equal(mapRecordStateToMachineState("ongoing"), consultationStates.ONGOING);
  assert.equal(mapRecordStateToMachineState("ended"), consultationStates.ARCHIVED);
  assert.equal(mapRecordStateToMachineState("waiting"), consultationStates.WAITING);
  assert.equal(mapRecordStateToMachineState(undefined), consultationStates.WAITING);
});

test("prescription risk reminders use independent categories and red-orange-yellow levels", () => {
  assert.deepEqual(prescriptionRiskCategories, [
    "患者条件",
    "重复用药",
    "用法用量",
    "给药途径",
    "相互作用",
    "生化指标",
    "配伍",
    "过敏",
    "孕产",
    "其他"
  ]);
  assert.deepEqual(prescriptionRiskLevels, {
    must: "必须处理",
    severe: "严重警告",
    general: "一般警告"
  });

  const medicine = {
    risk: "低",
    riskWarnings: [
      { category: "患者条件", level: "general" },
      { category: "重复用药", level: "must" }
    ]
  };
  assert.equal(getMedicineRiskWarnings(medicine).length, 2);
  assert.equal(getHighestMedicineRiskLevel(medicine), "must");
});

test("ongoing contact records prioritize the active video, then type order, time, and stable input order", () => {
  const records = [
    { id: "text_old", type: "text", state: "ongoing", time: "09:00" },
    { id: "consult_new", type: "consult", state: "ongoing", time: "10:00" },
    { id: "video_old", type: "video", state: "ongoing", time: "08:30" },
    { id: "video_active", type: "video", state: "ongoing", time: "08:00" },
    { id: "text_new", type: "text", state: "ongoing", time: "09:30" },
    { id: "unknown", type: "followup", state: "ongoing", time: "11:00" }
  ];

  assert.deepEqual(
    sortOngoingContactRecords(records, { activeVideoRecordId: "video_active" }).map((record) => record.id),
    ["video_active", "video_old", "text_new", "text_old", "consult_new", "unknown"]
  );
});

test("message list filters by type/state and limits visible ongoing consultations", () => {
  const records = [
    { id: "ended_video", type: "video", state: "ended", time: "12:00" },
    { id: "video_1", type: "video", state: "ongoing", time: "09:00" },
    { id: "text_1", type: "text", state: "ongoing", time: "10:00" },
    { id: "text_2", type: "text", state: "ongoing", time: "10:01" },
    { id: "text_3", type: "text", state: "ongoing", time: "10:02" },
    { id: "text_4", type: "text", state: "ongoing", time: "10:03" },
    { id: "text_5", type: "text", state: "ongoing", time: "10:04" },
    { id: "text_6", type: "text", state: "ongoing", time: "10:05" }
  ];

  const ongoing = getMessageListRecords(records);
  assert.equal(ongoing.length, maxVisibleOngoingConsultations);
  assert.deepEqual(
    ongoing.map((record) => record.id),
    ["video_1", "text_6", "text_5", "text_4", "text_3", "text_2"]
  );

  assert.deepEqual(
    getMessageListRecords(records, { type: "video", state: "ended" }).map((record) => record.id),
    ["ended_video"]
  );
});

test("next ongoing video excludes the current record and honors a preferred video when available", () => {
  const records = [
    { id: "video_current", type: "video", state: "ongoing", time: "11:00" },
    { id: "video_recent", type: "video", state: "ongoing", time: "10:30" },
    { id: "video_preferred", type: "video", state: "ongoing", time: "09:00" },
    { id: "text_1", type: "text", state: "ongoing", time: "12:00" },
    { id: "video_ended", type: "video", state: "ended", time: "12:30" }
  ];

  assert.equal(
    getNextOngoingVideoConsultationRecord(records, {
      excludeRecordId: "video_current",
      preferredRecordId: "video_preferred"
    }).id,
    "video_preferred"
  );

  assert.equal(getNextOngoingVideoConsultationRecord(records, { excludeRecordId: "video_current" }).id, "video_recent");
});

test("waiting queue is derived from the visible ongoing records only", () => {
  const records = [
    { id: "video_1", type: "video", state: "ongoing", time: "09:00" },
    { id: "text_1", type: "text", state: "ongoing", time: "09:01" },
    { id: "consult_1", type: "consult", state: "ongoing", time: "09:02" },
    { id: "ended_1", type: "text", state: "ended", time: "09:03" },
    { id: "unknown_1", type: "followup", state: "ongoing", time: "09:04" },
    { id: "text_2", type: "text", state: "ongoing", time: "09:05" },
    { id: "text_3", type: "text", state: "ongoing", time: "09:06" },
    { id: "text_4", type: "text", state: "ongoing", time: "09:07" }
  ];

  assert.deepEqual(buildWaitingQueueFromRecords(records, new Date("2026-05-28T01:02:03.000Z")), {
    total: 6,
    byType: {
      text: 4,
      video: 1,
      consult: 1
    },
    updatedAt: "2026-05-28T01:02:03.000Z"
  });
});

test("duration tone clamps invalid seconds and switches at warning and danger thresholds", () => {
  assert.equal(getConsultationDurationTone(-1), "normal");
  assert.equal(getConsultationDurationTone("not a number"), "normal");
  assert.equal(getConsultationDurationTone(178), "normal");
  assert.equal(getConsultationDurationTone(179), "warning");
  assert.equal(getConsultationDurationTone(599), "warning");
  assert.equal(getConsultationDurationTone(600), "danger");
});

test("archived consultation normalization fills transcript, trace, diagnosis, and prescription fallbacks", () => {
  const record = {
    id: "cs_1",
    type: "video",
    state: "ended",
    time: "14:30",
    preview: "患者主诉咽痛",
    diagnosisTags: ["急性咽炎"],
    prescriptionMedicines: [{ name: "阿莫西林" }, { name: "布洛芬" }, { name: "氯雷他定" }]
  };

  const archived = normalizeArchivedConsultationRecord(record);

  assert.equal(archived.typeLabel, "视频");
  assert.equal(archived.diagnosis, "急性咽炎");
  assert.deepEqual(archived.diagnosisTags, ["急性咽炎"]);
  assert.equal(archived.prescriptionNo, "归档中");
  assert.equal(archived.endedAt, "14:30");
  assert.deepEqual(archived.transcript, [
    { from: "patient", time: "14:30", text: "患者主诉咽痛" },
    { from: "doctor", time: "14:30", text: "本次问诊已结束，诊断：急性咽炎。" }
  ]);
  assert.equal(archived.trace.length, 3);
  assert.equal(archived.trace[2].detail, "阿莫西林、布洛芬等 3 项药品已归档");
});

test("archived consultation transcript prefers explicit transcript, then chat messages", () => {
  assert.deepEqual(
    normalizeArchivedConsultationRecord({
      transcript: [{ from: "doctor", time: "15:00", text: "已解释用药" }]
    }).transcript,
    [{ from: "doctor", time: "15:00", text: "已解释用药" }]
  );

  assert.deepEqual(
    normalizeArchivedConsultationRecord(
      { endedAt: "16:00" },
      {
        sessionDate: "2026-05-28",
        messages: [
          { from: "patient", text: "我还有点咳嗽" },
          { from: "doctor", recalled: true }
        ]
      }
    ).transcript,
    [
      { from: "patient", time: "2026-05-28", text: "我还有点咳嗽" },
      { from: "doctor", time: "2026-05-28", text: "医生撤回了一条消息" }
    ]
  );
});
