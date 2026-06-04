import test from "node:test";
import assert from "node:assert/strict";

import {
  addConsultationRecord,
  getActiveOngoingConsultationRecord,
  getDefaultEndedConsultationRecord,
  getDefaultOngoingConsultationRecord,
  getOngoingConsultationRecordById,
  hydrateAppData,
  latestAnnouncement,
  quickEntryOptions,
  updateConsultationRecordState
} from "../src/application/state/dataStore.js";
import { getAnnouncementById, getQuickEntryOption, markAnnouncementRead } from "../src/application/controllers/contentController.js";
import {
  addDiagnosisToActiveRecord,
  addMedicineToActiveRecord,
  clearDiagnosesFromActiveRecord,
  hasUnresolvedPrescriptionWarnings,
  removeDiagnosisFromActiveRecord,
  removeMedicineFromActiveRecord,
  updateMedicineFieldInActiveRecord
} from "../src/application/controllers/prescriptionController.js";
import {
  appendDoctorChatMessage,
  getOngoingChatMessage,
  recallOngoingChatMessage
} from "../src/application/controllers/chatController.js";

function resetAppData(payload = {}) {
  hydrateAppData({
    schemaVersion: 1,
    doctor: { id: "doctor_1", status: "offline" },
    waitingQueue: null,
    navigation: { menuGroups: [] },
    home: {
      quickActions: [],
      quickEntryOptions: [],
      announcements: []
    },
    services: [],
    consultations: {
      records: [],
      ongoingChats: {}
    },
    quickReplies: {
      categories: [],
      messages: []
    },
    ...payload
  });
}

test.beforeEach(() => {
  resetAppData();
});

test("hydrateAppData resets exported store bindings and content selectors use fallbacks", () => {
  resetAppData({
    home: {
      quickActions: [],
      quickEntryOptions: [{ title: "排班管理" }, { title: "快捷问诊" }],
      announcements: [
        { id: "a1", title: "第一条公告" },
        { id: "a2", title: "第二条公告" }
      ]
    }
  });

  assert.equal(latestAnnouncement.id, "a1");
  assert.equal(quickEntryOptions.length, 2);
  assert.deepEqual(getAnnouncementById("a2"), { id: "a2", title: "第二条公告" });
  assert.deepEqual(getAnnouncementById("missing"), { id: "a1", title: "第一条公告" });
  assert.deepEqual(getQuickEntryOption("1"), { title: "快捷问诊" });
  assert.equal(getQuickEntryOption("9"), null);
});

test("markAnnouncementRead clears unread state while preserving announcement history", () => {
  resetAppData({
    home: {
      quickActions: [],
      quickEntryOptions: [],
      announcements: [
        { id: "a1", title: "第一条公告", unread: true },
        { id: "a2", title: "第二条公告", unread: false }
      ]
    }
  });

  const readAnnouncement = markAnnouncementRead("a1");

  assert.equal(readAnnouncement.unread, false);
  assert.equal(getAnnouncementById("a1").unread, false);
  assert.equal(getAnnouncementById("a2").title, "第二条公告");
});

test("data store inserts ongoing records by message-list order and rejects duplicates", () => {
  resetAppData({
    consultations: {
      records: [
        { id: "text_old", type: "text", targetView: "text", state: "ongoing", time: "09:00" },
        { id: "ended_recent", type: "text", targetView: "text", state: "ended", time: "13:00" }
      ],
      ongoingChats: {}
    }
  });

  assert.equal(addConsultationRecord({ id: "video_new", type: "video", state: "ongoing", time: "08:00" }), true);
  assert.equal(addConsultationRecord({ id: "video_new", type: "video", state: "ongoing", time: "08:00" }), false);

  assert.equal(getDefaultOngoingConsultationRecord({ view: "room" }).id, "video_new");
  assert.equal(getDefaultOngoingConsultationRecord({ view: "text" }).id, "text_old");
  assert.equal(getDefaultEndedConsultationRecord().id, "ended_recent");
});

test("active ongoing selectors require ongoing state and honor explicit session ids", () => {
  resetAppData({
    consultations: {
      records: [
        { id: "r1", type: "text", targetView: "text", state: "ongoing", time: "10:00" },
        { id: "r2", type: "video", targetView: "video", state: "ended", time: "11:00" }
      ],
      ongoingChats: {}
    }
  });

  assert.equal(getActiveOngoingConsultationRecord({ sessionId: "r1" }).id, "r1");
  assert.equal(getActiveOngoingConsultationRecord({ sessionId: "r2" }), null);
  assert.equal(getOngoingConsultationRecordById("r2"), null);
  assert.equal(getActiveOngoingConsultationRecord({ view: "text" }).id, "r1");
});

test("ending a consultation clears unread markers and normalizes an archived record", () => {
  resetAppData({
    consultations: {
      records: [
        {
          id: "r1",
          type: "text",
          state: "ongoing",
          time: "10:00",
          badge: 3,
          unreadCount: 2,
          preview: "患者头痛",
          diagnosis: "头痛",
          prescriptionMedicines: [{ name: "布洛芬缓释胶囊" }]
        }
      ],
      ongoingChats: {
        r1: {
          sessionDate: "2026-05-28",
          messages: [{ from: "patient", text: "头痛一晚" }]
        }
      }
    }
  });

  const record = updateConsultationRecordState("r1", "ended");

  assert.equal(record.state, "ended");
  assert.equal(record.badge, 0);
  assert.equal(record.unreadCount, 0);
  assert.equal(record.diagnosis, "头痛");
  assert.equal(record.transcript[0].text, "头痛一晚");
  assert.equal(record.trace[2].detail, "布洛芬缓释胶囊 1 项药品已归档");
});

test("diagnosis controller adds, deduplicates, removes, and clears active record diagnoses", () => {
  resetAppData({
    consultations: {
      records: [
        {
          id: "r1",
          type: "text",
          targetView: "text",
          state: "ongoing",
          diagnosis: "急性咽炎",
          diagnosisTags: ["急性咽炎"]
        }
      ],
      ongoingChats: {}
    }
  });

  assert.deepEqual(addDiagnosisToActiveRecord(" 咳嗽 ", { sessionId: "r1" }), {
    ok: true,
    record: getOngoingConsultationRecordById("r1"),
    message: "已添加诊断：咳嗽"
  });
  assert.deepEqual(getOngoingConsultationRecordById("r1").diagnosisTags, ["急性咽炎", "咳嗽"]);
  assert.equal(addDiagnosisToActiveRecord("咳嗽", { sessionId: "r1" }).message, "该诊断已存在");

  assert.equal(removeDiagnosisFromActiveRecord("急性咽炎", { sessionId: "r1" }).ok, true);
  assert.deepEqual(getOngoingConsultationRecordById("r1").diagnosisTags, ["咳嗽"]);
  assert.equal(clearDiagnosesFromActiveRecord({ sessionId: "r1" }).ok, true);
  assert.deepEqual(getOngoingConsultationRecordById("r1").diagnosisTags, []);
});

test("medicine controller adds objects, blocks duplicates, removes rows, and reindexes medicines", async () => {
  resetAppData({
    consultations: {
      records: [{ id: "r1", type: "text", targetView: "text", state: "ongoing", prescriptionMedicines: [] }],
      ongoingChats: {}
    }
  });

  const firstMedicine = { name: "阿莫西林胶囊", spec: "0.25g*24粒", dose: "0.5g" };
  const secondMedicine = { name: "布洛芬缓释胶囊", spec: "0.3g*20粒", dose: "0.3g" };

  assert.equal((await addMedicineToActiveRecord(firstMedicine, { sessionId: "r1" })).ok, true);
  assert.equal((await addMedicineToActiveRecord(secondMedicine, { sessionId: "r1" })).ok, true);
  assert.equal((await addMedicineToActiveRecord(firstMedicine, { sessionId: "r1" })).message, "该药品已在处方中");

  assert.deepEqual(
    getOngoingConsultationRecordById("r1").prescriptionMedicines.map((medicine) => [medicine.index, medicine.name]),
    [
      [1, "阿莫西林胶囊"],
      [2, "布洛芬缓释胶囊"]
    ]
  );

  assert.equal(removeMedicineFromActiveRecord("阿莫西林胶囊", { sessionId: "r1" }).ok, true);
  assert.deepEqual(
    getOngoingConsultationRecordById("r1").prescriptionMedicines.map((medicine) => [medicine.index, medicine.name]),
    [[1, "布洛芬缓释胶囊"]]
  );
});

test("updating warning medicine fields clears field warnings and hides record warning after all are resolved", () => {
  resetAppData({
    consultations: {
      records: [
        {
          id: "r1",
          type: "text",
          targetView: "text",
          state: "ongoing",
          inlineRiskWarningVisible: true,
          prescriptionMedicines: [
            {
              index: 1,
              name: "阿莫西林胶囊",
              dose: "",
              warningFields: ["dose"],
              warningColumns: { 3: "severe" },
              warningMessage: "剂量缺失",
              warningSuggestion: "补充剂量"
            }
          ]
        }
      ],
      ongoingChats: {}
    }
  });

  const result = updateMedicineFieldInActiveRecord(1, "dose", "0.5g", { sessionId: "r1" });
  const record = getOngoingConsultationRecordById("r1");

  assert.equal(result.ok, true);
  assert.equal(result.fieldWarningCleared, true);
  assert.equal(result.medicineWarningsResolved, true);
  assert.equal(result.recordWarningsResolved, true);
  assert.equal(hasUnresolvedPrescriptionWarnings(record), false);
  assert.equal(record.inlineRiskWarningVisible, false);
  assert.equal("warningFields" in record.prescriptionMedicines[0], false);
  assert.equal(record.prescriptionMedicines[0].dose, "0.5g");
});

test("chat controller appends timestamped doctor messages and recalls them once", () => {
  resetAppData({
    consultations: {
      records: [{ id: "r1", type: "text", targetView: "text", state: "ongoing" }],
      ongoingChats: {
        r1: {
          messages: [{ id: "m1", from: "patient", text: "您好", recalled: false }]
        }
      }
    }
  });

  const date = new Date(2026, 4, 28, 1, 2, 3);
  const message = appendDoctorChatMessage("r1", "请补充体温", date);

  assert.equal(message.id, `r1-doctor-${date.getTime()}`);
  assert.equal(message.time, "2026-05-28 01:02:03");
  assert.equal(getOngoingChatMessage("r1", message.id), message);

  assert.equal(recallOngoingChatMessage("r1", message.id).recalled, true);
  assert.equal(recallOngoingChatMessage("r1", message.id), null);
  assert.equal(appendDoctorChatMessage("missing", "无效消息"), null);
});
