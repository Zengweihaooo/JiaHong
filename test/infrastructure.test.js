import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { searchDiagnosisCatalog, searchMedicineCatalog } from "../src/infrastructure/api/mockCatalogSearch.js";
import { createPatientAutoReplyMessage, formatMessageTime } from "../src/infrastructure/api/mockPatientReply.js";

test("diagnosis catalog search matches Chinese keywords and excludes selected diagnoses", async () => {
  const response = await searchDiagnosisCatalog({
    keyword: "咽炎",
    exclude: ["急性咽炎"]
  });

  assert.equal(response.keyword, "咽炎");
  assert.equal(response.total, response.items.length);
  assert.equal(response.items.includes("急性咽炎"), false);
  assert.equal(response.items.some((item) => item.includes("咽炎")), true);
});

test("diagnosis catalog search supports pinyin initials", async () => {
  const response = await searchDiagnosisCatalog({ keyword: "btty" });

  assert.equal(response.items.includes("扁桃体炎"), true);
});

test("medicine catalog search matches aliases and excludes medicines by name", async () => {
  const response = await searchMedicineCatalog({
    keyword: "羟氨苄青霉素",
    exclude: []
  });

  assert.equal(response.items[0].name, "阿莫西林胶囊");

  const excluded = await searchMedicineCatalog({
    keyword: "羟氨苄青霉素",
    exclude: ["阿莫西林胶囊"]
  });

  assert.equal(excluded.items.some((medicine) => medicine.name === "阿莫西林胶囊"), false);
});

test("medicine catalog search supports indication matching and keeps medicine/spec combinations unique", async () => {
  const response = await searchMedicineCatalog({ keyword: "鼻窦炎" });
  const keys = response.items.map((medicine) => `${medicine.name}-${medicine.spec}`);

  assert.equal(response.items.some((medicine) => medicine.indications?.includes("鼻窦炎")), true);
  assert.equal(new Set(keys).size, keys.length);
});

test("multi-medicine risk demo contains five medicines and three switchable risk details", async () => {
  const bootstrap = JSON.parse(
    await readFile(new URL("../src/infrastructure/mocks/app-bootstrap.json", import.meta.url), "utf8")
  );
  const record = bootstrap.consultations.records.find((item) => item.id === "demo_multi_medicine_risk_001");
  const riskMedicines = record.prescriptionMedicines.filter((medicine) => medicine.warningMessage && medicine.warningSuggestion);

  assert.equal(record.prescriptionMedicines.length, 5);
  assert.equal(riskMedicines.length, 3);
  assert.equal(record.followUpVoucher, undefined);
  assert.equal(record.consultInfo.attachments.length, 2);
  assert.equal(record.consultInfo.caseVoices.length, 3);
  assert.equal(record.prescriptionMedicines[3].risk, "低");
  assert.equal(new Set(riskMedicines.map((medicine) => medicine.warningMessage)).size, 3);
  assert.deepEqual(
    riskMedicines.map((medicine) => medicine.riskWarnings[0]),
    [
      { category: "重复用药", level: "must" },
      { category: "相互作用", level: "severe" },
      { category: "患者条件", level: "general" }
    ]
  );
});

test("patient auto reply formats timestamps and creates deterministic message metadata", (t) => {
  t.mock.method(Math, "random", () => 0);
  const date = new Date(2026, 4, 28, 9, 8, 7);

  assert.equal(formatMessageTime(date), "2026-05-28 09:08:07");

  const message = createPatientAutoReplyMessage({
    recordId: "r1",
    doctorMessage: "请问有青霉素过敏吗？",
    record: {
      diagnosis: "急性咽炎",
      patientDetail: { allergies: "青霉素" }
    },
    chat: { messages: [] },
    date
  });

  assert.deepEqual(message, {
    id: `r1-patient-${date.getTime()}-0`,
    from: "patient",
    text: "我有青霉素过敏，其他药暂时没发现过敏。",
    time: "2026-05-28 09:08:07",
    recalled: false,
    mock: true
  });
});

test("patient auto reply avoids recent duplicate patient messages when alternatives exist", (t) => {
  t.mock.method(Math, "random", () => 0);
  const date = new Date(2026, 4, 28, 9, 8, 7);

  const message = createPatientAutoReplyMessage({
    recordId: "r1",
    doctorMessage: "疼痛有没有加重？",
    record: { diagnosis: "急性咽炎" },
    chat: {
      messages: [
        {
          from: "patient",
          text: "疼痛大概是能忍的程度，活动或者吞咽时会更明显。"
        }
      ]
    },
    date
  });

  assert.equal(message.text, "现在还是不舒服，但没有突然加重。");
});
