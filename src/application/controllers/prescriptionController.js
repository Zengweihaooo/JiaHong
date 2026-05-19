import { compareByPinyin, diagnosisSuggestionPool, medicineSuggestionPool } from "../../domain/prescriptionCatalog.js";
import { getActiveConsultationRecord } from "./consultationController.js";

export function getDiagnosisOptions(keyword = "") {
  const record = getActiveConsultationRecord();
  const normalizedKeyword = keyword.trim().toLowerCase();
  const existingTags = new Set(record?.diagnosisTags || []);
  return diagnosisSuggestionPool
    .filter((diagnosis) => !existingTags.has(diagnosis))
    .filter((diagnosis) => !normalizedKeyword || diagnosis.toLowerCase().includes(normalizedKeyword))
    .sort(compareByPinyin);
}

export function addDiagnosisToActiveRecord(diagnosisText = "") {
  const record = getActiveConsultationRecord();
  if (!record) return { ok: false, message: "当前会话不可编辑" };
  normalizeRecordDiagnosis(record);
  const nextDiagnosis =
    diagnosisText.trim() ||
    diagnosisSuggestionPool.find((diagnosis) => !record.diagnosisTags.includes(diagnosis)) ||
    `补充诊断${record.diagnosisTags.length + 1}`;
  if (record.diagnosisTags.includes(nextDiagnosis)) {
    return { ok: false, record, message: "该诊断已存在" };
  }
  record.diagnosisTags.push(nextDiagnosis);
  normalizeRecordDiagnosis(record);
  return { ok: true, record, message: `已添加诊断：${nextDiagnosis}` };
}

export function removeDiagnosisFromActiveRecord(tag) {
  const record = getActiveConsultationRecord();
  if (!record || !tag) return { ok: false, message: "当前诊断不可删除" };
  normalizeRecordDiagnosis(record);
  record.diagnosisTags = record.diagnosisTags.filter((item) => item !== tag);
  normalizeRecordDiagnosis(record);
  return { ok: true, record, message: "诊断已更新" };
}

export function getMedicineOptions(keyword = "") {
  const record = getActiveConsultationRecord();
  const normalizedKeyword = keyword.trim().toLowerCase();
  const existingMedicines = new Set((record?.prescriptionMedicines || []).map((medicine) => medicine.name));
  return medicineSuggestionPool
    .filter((medicine) => !existingMedicines.has(medicine.name))
    .filter((medicine) => !normalizedKeyword || medicine.name.toLowerCase().includes(normalizedKeyword))
    .sort((left, right) => compareByPinyin(left.name, right.name));
}

export function addMedicineToActiveRecord(keyword = "") {
  const record = getActiveConsultationRecord();
  if (!record) return { ok: false, message: "当前会话不可编辑" };
  record.prescriptionMedicines = record.prescriptionMedicines || [];
  const suggestion = findMedicineSuggestion(keyword);
  if (!suggestion) return { ok: false, record, message: "未找到匹配药品" };
  if (record.prescriptionMedicines.some((medicine) => medicine.name === suggestion.name)) {
    return { ok: false, record, message: "该药品已在处方中" };
  }
  record.prescriptionMedicines.push({
    index: record.prescriptionMedicines.length + 1,
    ...suggestion
  });
  normalizeMedicines(record);
  return { ok: true, record, message: `已添加药品：${suggestion.name}` };
}

export function removeMedicineFromActiveRecord(name) {
  const record = getActiveConsultationRecord();
  if (!record || !name) return { ok: false, message: "当前药品不可删除" };
  record.prescriptionMedicines = (record.prescriptionMedicines || []).filter((medicine) => medicine.name !== name);
  normalizeMedicines(record);
  return { ok: true, record, message: "药品已删除" };
}

export function updateMedicineFieldInActiveRecord(index, field, value) {
  const record = getActiveConsultationRecord();
  if (!record || !index || !field) return { ok: false };
  const medicine = (record.prescriptionMedicines || []).find((item) => Number(item.index) === Number(index));
  if (!medicine) return { ok: false, record };
  medicine[field] = value.trim();
  return { ok: true, record };
}

function normalizeRecordDiagnosis(record) {
  const tags = Array.isArray(record.diagnosisTags) ? record.diagnosisTags.filter(Boolean) : [];
  if (!tags.length && record.diagnosis) tags.push(record.diagnosis);
  record.diagnosisTags = Array.from(new Set(tags));
  record.diagnosis = record.diagnosisTags[0] || "";
}

function normalizeMedicines(record) {
  record.prescriptionMedicines = (record.prescriptionMedicines || []).map((medicine, index) => ({
    ...medicine,
    index: index + 1
  }));
}

function findMedicineSuggestion(keyword) {
  const normalizedKeyword = keyword.trim().toLowerCase();
  if (!normalizedKeyword) return null;
  return medicineSuggestionPool.find((medicine) => medicine.name.toLowerCase().includes(normalizedKeyword));
}
