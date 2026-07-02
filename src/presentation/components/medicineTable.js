import { renderButton, renderRiskTag } from "./primitives.js?v=20260604-37";
import { getHighestMedicineRiskLevel, getMedicineRiskWarnings, prescriptionRiskLevels, getPrescriptionRiskCategoryLevel } from "../../domain/prescriptionRisk.js";
import { escapeHtml } from "../ui/html.js";

const medicineUnitOptions = ["盒", "瓶", "支", "袋", "板", "片"];
const medicineFieldOptions = {
  usage: ["口服", "外用", "适量冲洗", "口腔吸入", "鼻吸入"],
  frequency: ["1次/日", "2次/日", "3次/日", "4次/日", "1-2次/日", "2-3次/日", "必要时", "按需", "单次"],
  dose: ["0.5片", "1片", "2片", "1粒", "2粒", "0.5袋", "1袋", "2袋", "5ml", "10ml", "15ml", "1吸", "1滴", "适量", "薄涂", "每侧鼻孔2喷"]
};

function getMedicineWarningFields(row = {}) {
  return new Set(Array.isArray(row.warningFields) ? row.warningFields : []);
}

function getMedicineRowWarningLevel(row = {}) {
  return getHighestMedicineRiskLevel(row);
}

const warningFieldCategories = {
  name: "重复用药",
  frequency: "用法用量",
  dose: "用法用量",
  quantity: "用法用量",
  unit: "用法用量",
  usage: "给药途径"
};

function getMedicineWarningClass(warningFields, field) {
  if (field === "name") return "";
  if (!warningFields.has(field)) return "";
  const category = warningFieldCategories[field];
  const level = getPrescriptionRiskCategoryLevel(category);
  return ` medicine-warning-target medicine-warning-target--${level}`;
}

function renderEditableBox(row, warningFields, field, label, readonly = false) {
  const value = row[field] ?? "";
  const warningClass = getMedicineWarningClass(warningFields, field);
  if (readonly) return `<span class="table-input${warningClass}">${escapeHtml(value)}</span>`;
  return `<input class="table-input medicine-edit-field${warningClass}" type="text" value="${escapeHtml(value)}" aria-label="${label}" data-medicine-field="${field}" />`;
}

function renderFieldCombobox(row, warningFields, field, label, readonly = false) {
  const value = row[field] ?? "";
  const warningClass = getMedicineWarningClass(warningFields, field);
  if (readonly) return `<span class="table-input${warningClass}">${escapeHtml(value)}</span>`;
  const optionValues = Array.from(new Set([value, ...(medicineFieldOptions[field] || [])].filter(Boolean)));
  return `
    <div class="medicine-usage-control">
      <input
        class="table-input medicine-edit-field medicine-usage-input${warningClass}"
        type="text"
        value="${escapeHtml(value)}"
        aria-label="${escapeHtml(label)}"
        aria-haspopup="listbox"
        aria-expanded="false"
        autocomplete="off"
        data-medicine-field="${escapeHtml(field)}"
      />
      <div class="medicine-usage-options" role="listbox" hidden>
        ${optionValues
          .map(
            (option) => `
              <button
                class="medicine-usage-option${option === value ? " is-active" : ""}"
                type="button"
                role="option"
                aria-selected="${option === value ? "true" : "false"}"
                data-medicine-option="${escapeHtml(option)}"
              >
                ${escapeHtml(option)}
              </button>`
          )
          .join("")}
      </div>
    </div>`;
}

function renderUnitSelector(row, warningFields, readonly = false) {
  const value = row.unit ?? "";
  const warningClass = getMedicineWarningClass(warningFields, "unit");
  if (readonly) return `<span class="table-input${warningClass}">${escapeHtml(value)}</span>`;
  const selectedValue = value || medicineUnitOptions[0];
  const optionValues = Array.from(new Set([selectedValue, ...medicineUnitOptions].filter(Boolean)));
  return `
    <div class="medicine-unit-control">
      <button
        class="table-input medicine-unit-select${warningClass}"
        type="button"
        aria-label="单位"
        aria-haspopup="listbox"
        aria-expanded="false"
        data-medicine-field="unit"
      >
        <span>${escapeHtml(selectedValue)}</span>
      </button>
      <div class="medicine-unit-options" role="listbox" hidden>
        ${optionValues
          .map(
            (unit) => `
              <button
                class="medicine-unit-option${unit === selectedValue ? " is-active" : ""}"
                type="button"
                role="option"
                aria-selected="${unit === selectedValue ? "true" : "false"}"
                data-medicine-unit="${escapeHtml(unit)}"
              >
                ${escapeHtml(unit)}
              </button>`
          )
          .join("")}
      </div>
    </div>`;
}

export function renderMedicineTableRow(row, readonly = false) {
  const warningFields = getMedicineWarningFields(row);
  const rowWarningLevel = getMedicineRowWarningLevel(row);
  const riskWarnings = getMedicineRiskWarnings(row);
  const warningCategories = riskWarnings.map((warning) => warning.category).join("、");
  const rowWarningClass = rowWarningLevel ? ` medicine-table__row--warning-linked medicine-table__row--warning-${rowWarningLevel}` : "";
  const warningMessage = row.warningMessage || `[警示信息]${row.name || "当前药品"}需完成风险核对`;
  const warningSuggestion = row.warningSuggestion || "[建议信息]请结合患者基础信息、过敏史和用药风险完成处方确认。";

  return `
    <div
      class="medicine-table__row${rowWarningClass}"
      data-medicine-index="${row.index}"
      data-medicine-name="${escapeHtml(row.name)}"
      ${rowWarningLevel ? `data-warning-level="${rowWarningLevel}" data-warning-level-label="${prescriptionRiskLevels[rowWarningLevel]}" data-warning-categories="${escapeHtml(warningCategories)}" data-warning-message="${escapeHtml(warningMessage)}" data-warning-suggestion="${escapeHtml(warningSuggestion)}" title="点击查看风险提示"` : ""}
    >
      <span class="medicine-table__index">${row.index}</span>
      <span>${escapeHtml(row.name)}</span>
      <span>${escapeHtml(row.type)}</span>
      <span class="medicine-spec-text">${escapeHtml(row.spec)}</span>
      ${renderFieldCombobox(row, warningFields, "usage", "用法", readonly)}
      ${renderFieldCombobox(row, warningFields, "frequency", "服用频次", readonly)}
      ${renderFieldCombobox(row, warningFields, "dose", "用量", readonly)}
      ${renderEditableBox(row, warningFields, "quantity", "数量", readonly)}
      ${renderUnitSelector(row, warningFields, readonly)}
      ${["高", "低"].includes(row.risk) ? renderRiskTag({ text: row.risk, size: "sm", className: "risk-small" }) : ""}
      ${
        readonly
          ? ""
          : renderButton({ text: "删除", tone: "text", size: "", className: "medicine-delete-btn" })
      }
    </div>`;
}

export function renderMedicineTable(medicines = [], readonly = false) {
  if (!medicines.length) {
    return `<div class="medicine-empty-state">暂无药品信息</div>`;
  }

  return `
    <div class="medicine-table${medicines.length === 1 ? " medicine-table--single" : ""}">
      <div class="medicine-table__row medicine-table__head">
        <span class="medicine-table__index medicine-table__index--head" aria-label="序号"><span>序</span><span>号</span></span><span>药品名称</span><span>类型</span><span>规格</span><span>用法</span><span>服用频次</span><span>用量</span><span>数量</span><span>单位</span><span>风险</span><span>操作</span>
      </div>
      ${medicines.map((row) => renderMedicineTableRow(row, readonly)).join("")}
    </div>`;
}
