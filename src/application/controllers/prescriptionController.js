import { searchDiagnosisCatalog, searchMedicineCatalog } from "../../infrastructure/api/appApi.js";
import { getMedicineRiskWarnings } from "../../domain/prescriptionRisk.js";
import { getActiveOngoingConsultationRecord } from "../state/dataStore.js";

export async function getDiagnosisOptions(keyword = "", context = {}) {
  const record = getActiveOngoingConsultationRecord(context);
  const response = await searchDiagnosisCatalog({
    keyword,
    exclude: record?.diagnosisTags || []
  });
  return response.items;
}

export function addDiagnosisToActiveRecord(diagnosisText = "", context = {}) {
  const record = getActiveOngoingConsultationRecord(context);
  if (!record) return { ok: false, message: "当前会话不可编辑" };
  normalizeRecordDiagnosis(record);
  const nextDiagnosis = diagnosisText.trim() || `补充诊断${record.diagnosisTags.length + 1}`;
  if (record.diagnosisTags.includes(nextDiagnosis)) {
    return { ok: false, record, message: "该诊断已存在" };
  }
  record.diagnosisTags.push(nextDiagnosis);
  normalizeRecordDiagnosis(record);
  return { ok: true, record, message: `已添加诊断：${nextDiagnosis}` };
}

export function removeDiagnosisFromActiveRecord(tag, context = {}) {
  const record = getActiveOngoingConsultationRecord(context);
  if (!record || !tag) return { ok: false, message: "当前诊断不可删除" };
  normalizeRecordDiagnosis(record);
  record.diagnosisTags = record.diagnosisTags.filter((item) => item !== tag);
  normalizeRecordDiagnosis(record, { allowEmpty: true });
  return { ok: true, record, message: "诊断已更新" };
}

export function clearDiagnosesFromActiveRecord(context = {}) {
  const record = getActiveOngoingConsultationRecord(context);
  if (!record) return { ok: false, message: "当前诊断不可删除" };
  normalizeRecordDiagnosis(record);
  if (!record.diagnosisTags.length) return { ok: false, record };
  record.diagnosisTags = [];
  normalizeRecordDiagnosis(record, { allowEmpty: true });
  return { ok: true, record, message: "诊断已清空" };
}

export async function getMedicineOptions(keyword = "", context = {}) {
  const record = getActiveOngoingConsultationRecord(context);
  const response = await searchMedicineCatalog({
    keyword,
    exclude: (record?.prescriptionMedicines || []).map((medicine) => medicine.name)
  });
  return response.items;
}

const warningFieldColumns = {
  frequency: "3",
  dose: "3",
  quantity: "3",
  unit: "3",
  usage: "4"
};

const warningFieldCategories = {
  name: "重复用药",
  frequency: "用法用量",
  dose: "用法用量",
  quantity: "用法用量",
  unit: "用法用量",
  usage: "给药途径"
};

const medicineRelationRiskCategories = new Set(["重复用药", "相互作用", "配伍"]);

export function hasUnresolvedPrescriptionWarnings(record = null) {
  return Boolean(
    record?.prescriptionMedicines?.some((medicine) => getMedicineRiskWarnings(medicine).length > 0)
  );
}

export async function addMedicineToActiveRecord(input = "", context = {}) {
  const record = getActiveOngoingConsultationRecord(context);
  if (!record) return { ok: false, message: "当前会话不可编辑" };
  record.prescriptionMedicines = record.prescriptionMedicines || [];
  const keyword = typeof input === "string" ? input.trim() : input?.name || "";
  if (!keyword) return { ok: false, record, message: "请输入药品名称" };
  const options = typeof input === "object" && input ? [input] : await getMedicineOptions(keyword, context);
  const suggestion = options.find((medicine) => medicine.name === keyword) || options[0];
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

export function removeMedicineFromActiveRecord(name, context = {}) {
  const record = getActiveOngoingConsultationRecord(context);
  if (!record || !name) return { ok: false, message: "当前药品不可删除" };
  record.prescriptionMedicines = (record.prescriptionMedicines || []).filter((medicine) => medicine.name !== name);
  normalizeMedicines(record);
  const resolvedWarnings = resolvePrescriptionWarnings(record);
  const recordWarningsResolved = !hasUnresolvedPrescriptionWarnings(record);
  if (recordWarningsResolved) {
    record.inlineRiskWarningVisible = false;
  }
  return { ok: true, record, message: "药品已删除", resolvedWarnings, recordWarningsResolved };
}

export function updateMedicineFieldInActiveRecord(index, field, value, context = {}) {
  const record = getActiveOngoingConsultationRecord(context);
  if (!record || !index || !field) return { ok: false };
  const medicine = (record.prescriptionMedicines || []).find((item) => Number(item.index) === Number(index));
  if (!medicine) return { ok: false, record };
  const previousValue = medicine[field] ?? "";
  const nextValue = value.trim();
  medicine[field] = nextValue;

  const warningFields = Array.isArray(medicine.warningFields) ? medicine.warningFields : [];
  const previousWarningColumns = medicine.warningColumns || {};
  const fieldWarningCleared = warningFields.includes(field) && nextValue && nextValue !== previousValue;
  if (fieldWarningCleared) {
    medicine.warningFields = warningFields.filter((item) => item !== field);
    rebuildMedicineWarningsFromFields(medicine, previousWarningColumns);
  }

  const resolvedWarnings = resolvePrescriptionWarnings(record);
  const recordWarningsResolved = !hasUnresolvedPrescriptionWarnings(record);
  if (recordWarningsResolved) {
    record.inlineRiskWarningVisible = false;
  }

  return {
    ok: true,
    record,
    fieldWarningCleared,
    resolvedWarnings,
    medicineWarningsResolved: getMedicineRiskWarnings(medicine).length === 0,
    recordWarningsResolved
  };
}

function clearMedicineWarningState(medicine) {
  delete medicine.warningFields;
  delete medicine.warningColumns;
  delete medicine.riskWarnings;
  delete medicine.warningMessage;
  delete medicine.warningSuggestion;
}

function rebuildMedicineWarningsFromFields(medicine, previousWarningColumns = {}) {
  const warningFields = Array.isArray(medicine.warningFields) ? medicine.warningFields : [];
  if (!warningFields.length) {
    clearMedicineWarningState(medicine);
    return;
  }

  medicine.warningColumns = warningFields.reduce((columns, warningField) => {
    const column = warningFieldColumns[warningField];
    if (!column) return columns;
    return { ...columns, [column]: previousWarningColumns[column] || "severe" };
  }, {});

  if (Array.isArray(medicine.riskWarnings)) {
    const remainingCategories = new Set(warningFields.map((field) => warningFieldCategories[field]).filter(Boolean));
    medicine.riskWarnings = medicine.riskWarnings.filter((warning) => remainingCategories.has(warning.category));
    if (!medicine.riskWarnings.length) {
      delete medicine.riskWarnings;
    }
  }
}

function warningMentionsAnotherMedicine(medicine, medicines = []) {
  const warningText = `${medicine.warningMessage || ""} ${medicine.warningSuggestion || ""}`;
  if (!warningText.trim()) return true;
  return medicines.some((item) => item !== medicine && item.name && warningText.includes(item.name));
}

function resolvePrescriptionWarnings(record) {
  const medicines = record?.prescriptionMedicines || [];
  let resolvedCount = 0;

  medicines.forEach((medicine) => {
    const warnings = getMedicineRiskWarnings(medicine);
    if (!warnings.length) return;
    const remainingWarnings = warnings.filter((warning) => {
      if (!medicineRelationRiskCategories.has(warning.category)) return true;
      if (medicines.length < 2) return false;
      return warningMentionsAnotherMedicine(medicine, medicines);
    });
    if (remainingWarnings.length === warnings.length) return;
    resolvedCount += warnings.length - remainingWarnings.length;
    if (!remainingWarnings.length) {
      clearMedicineWarningState(medicine);
      return;
    }
    medicine.riskWarnings = remainingWarnings;
  });

  return resolvedCount;
}

function normalizeRecordDiagnosis(record, { allowEmpty = false } = {}) {
  const tags = Array.isArray(record.diagnosisTags) ? record.diagnosisTags.filter(Boolean) : [];
  const normalizedTags = record.type === "consult"
    ? tags.filter((tag) => !tag.includes("咨询"))
    : tags;
  if (!allowEmpty && !normalizedTags.length && record.diagnosis && !record.diagnosis.includes("咨询")) normalizedTags.push(record.diagnosis);
  record.diagnosisTags = Array.from(new Set(normalizedTags));
  record.diagnosis = record.diagnosisTags[0] || "";
}

function normalizeMedicines(record) {
  record.prescriptionMedicines = (record.prescriptionMedicines || []).map((medicine, index) => ({
    ...medicine,
    index: index + 1
  }));
}
