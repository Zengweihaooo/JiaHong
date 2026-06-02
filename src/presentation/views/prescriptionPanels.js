import { escapeHtml } from "../ui/html.js";
import { renderMedicineTable } from "../components/medicineTable.js?v=20260528-06";
import { renderPrescriptionActions } from "../components/prescriptionActions.js?v=20260528-06";
import {
  renderDiagnosisSelectInput,
  renderDiagnosisTags,
  renderMedicineSearchCombobox,
  renderPrescriptionRemarkSelect
} from "./prescriptionFormFields.js?v=20260528-06";

export {
  renderDiagnosisSelectInput,
  renderDiagnosisTags,
  renderMedicineSearchCombobox,
  renderPrescriptionRemarkSelect,
  renderSearchField,
  renderSelectField
} from "./prescriptionFormFields.js?v=20260528-06";


export const defaultPrescriptionMedicines = [];

export const defaultPatientDetail = {
  weight: "--",
  pregnancy: "--",
  phone: "--",
  liverAbnormal: "--",
  idCard: "--",
  kidneyAbnormal: "--",
  allergies: "--"
};

function renderPatientInfoField(label, value, { required = false } = {}) {
  return `
    <span class="patient-info__field">
      <span class="patient-info__field-label">${required ? "<em>*</em>" : ""}${label}：</span>
      <span class="patient-info__field-value">${escapeHtml(value || "--")}</span>
    </span>`;
}

export function renderPatientInfoGrid(patientDetail = defaultPatientDetail) {
  return `
    ${renderPatientInfoField("过敏史", patientDetail.allergies)}
    ${renderPatientInfoField("肝功能异常", patientDetail.liverAbnormal, { required: true })}
    ${renderPatientInfoField("妊娠哺乳", patientDetail.pregnancy, { required: true })}
    ${renderPatientInfoField("肾功能异常", patientDetail.kidneyAbnormal, { required: true })}`;
}

function getPatientName(record) {
  return record
    ? `${record.patient}&nbsp;&nbsp;${record.patientGender || ""}&nbsp;&nbsp;${record.age}`
    : "暂无患者信息";
}

function getPatientWeight(patientDetail = defaultPatientDetail) {
  const weight = String(patientDetail.weight || "").trim();
  if (!weight || weight === "--") return "";
  return `${weight}${/kg$/i.test(weight) ? "" : "KG"}`;
}

function getDiagnosisTags(record, { excludeConsultationTag = false } = {}) {
  const tags = record ? record.diagnosisTags || [record.diagnosis].filter(Boolean) : [];
  return excludeConsultationTag ? tags.filter((tag) => !tag.includes("咨询")) : tags;
}

function renderPatientSection(record) {
  const patientDetail = record?.patientDetail ? record.patientDetail : defaultPatientDetail;
  const patientWeight = getPatientWeight(patientDetail);
  return `
      <div class="patient-info">
        <div class="patient-info__header">
          <div class="patient-info__name">${getPatientName(record)}${patientWeight ? `&nbsp;&nbsp;${escapeHtml(patientWeight)}` : ""}</div>
          <div class="patient-info__meta">
            <span>证件号：${escapeHtml(patientDetail.idCard || "--")}</span>
            <span>手机号：${escapeHtml(patientDetail.phone || "--")}</span>
          </div>
        </div>
        <div class="patient-info__grid">${renderPatientInfoGrid(patientDetail)}</div>
      </div>`;
}

function renderReadonlyDiagnosisValue(diagnosisTags) {
  return `<span class="jh-input-field jh-input-field--lg diagnosis-select diagnosis-select--readonly" aria-disabled="true">${diagnosisTags[0] || ""}</span>`;
}

function renderDiagnosisSection({ title, diagnosisTags, readonly = false, className = "", treatmentAdvice = "" }) {
  const hasEditableDiagnosisTags = !readonly && diagnosisTags.length > 0;
  return `
      <div class="diagnosis-section${className ? ` ${className}` : ""}">
        <h3>${title}</h3>
        <div class="diagnosis-row">
          <label><span>*</span>诊断</label>
          ${readonly ? renderReadonlyDiagnosisValue(diagnosisTags) : renderDiagnosisSelectInput()}
          <div class="diagnosis-input">
            ${renderDiagnosisTags(diagnosisTags, readonly)}
            ${
              hasEditableDiagnosisTags
                ? `<button class="diagnosis-clear-all-btn" type="button" aria-label="双击清空全部诊断" title="双击清空全部诊断"></button>`
                : ""
            }
          </div>
        </div>
        ${
          treatmentAdvice === null
            ? ""
            : `<div class="diagnosis-row consultation-treatment-row">
          <label><span>*</span>处理意见</label>
          <textarea class="jh-input-field jh-input-field--lg consultation-treatment-input" placeholder="请输入治疗处理意见" aria-label="请输入治疗处理意见">${escapeHtml(treatmentAdvice)}</textarea>
        </div>`
        }
      </div>`;
}

function renderMedicineSection({ medicines, readonly = false, className = "" }) {
  return `
      <div class="medicine-section${className ? ` ${className}` : ""}">
        <h3>所需药品</h3>
        <div class="medicine-scroll-area">
          ${readonly ? "" : renderMedicineSearchCombobox()}
          ${renderMedicineTable(medicines, readonly)}
        </div>
      </div>`;
}

function renderMedicineRiskTip() {
  return `
    <section class="medicine-risk-tip" data-medicine-risk-tip role="dialog" aria-label="药品风险提示" hidden>
      <div class="medicine-risk-tip__head">
        <h4>药品风险提示</h4>
        <button class="medicine-risk-tip__close" type="button" aria-label="关闭风险提示"></button>
      </div>
      <p class="medicine-risk-tip__message" data-medicine-risk-message></p>
      <p class="medicine-risk-tip__suggestion" data-medicine-risk-suggestion></p>
    </section>`;
}

const inlineRiskWarningHeaders = [
  "药品名称",
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
];

const inlineRiskWarningLegendItems = [
  { status: "must", label: "必须处理" },
  { status: "severe", label: "严重警告" },
  { status: "general", label: "一般警告" }
];

function getInlineRiskWarningRows(medicines = []) {
  return medicines.filter((medicine) => Array.isArray(medicine.warningFields) && medicine.warningFields.length > 0);
}

function renderInlineRiskWarning(medicines = [], visible = false) {
  const rows = getInlineRiskWarningRows(medicines);
  if (!rows.length) return "";
  return `
    <section class="inline-risk-warning${visible ? " is-visible" : ""}" data-inline-risk-warning${visible ? "" : " hidden"} aria-label="处方风险提醒">
      <div class="inline-risk-warning__legend" aria-label="风险状态说明">
        ${inlineRiskWarningLegendItems
          .map(
            (item) => `
              <span class="inline-risk-warning__legend-item">
                <span class="risk-warning-status risk-warning-status--${item.status}" aria-hidden="true"></span>
                <span>${item.label}</span>
              </span>`
          )
          .join("")}
      </div>
      <div class="inline-risk-warning__table" role="table" aria-label="处方风险提醒">
        <div class="inline-risk-warning__row inline-risk-warning__row--head" role="row">
          ${inlineRiskWarningHeaders.map((header) => `<div role="columnheader">${header}</div>`).join("")}
        </div>
        ${rows
          .map(
            (row) => `
              <div class="inline-risk-warning__row" role="row">
                <div class="inline-risk-warning__medicine" role="cell">${escapeHtml(row.name)}</div>
                ${inlineRiskWarningHeaders
                  .slice(1)
                  .map((_, index) => {
                    const status = row.warningColumns?.[index + 1];
                    return `<div role="cell">${
                      status ? `<span class="risk-warning-status risk-warning-status--${status}" aria-hidden="true"></span>` : ""
                    }</div>`;
                  })
                  .join("")}
              </div>`
          )
          .join("")}
      </div>
      <div class="inline-risk-warning__messages">
        ${rows
          .map(
            (row) => `
              <div class="inline-risk-warning__message">
                <p>${escapeHtml(row.warningMessage || `[警示信息]${row.name}需完成风险核对`)}</p>
                <p>${escapeHtml(row.warningSuggestion || "[建议信息]请结合患者基础信息、过敏史和用药风险完成处方确认。")}</p>
              </div>`
          )
          .join("")}
      </div>
    </section>`;
}

export function renderPrescriptionPanel(options = {}) {
  const normalized = typeof options === "boolean" ? { includeSecondMedicine: options } : options;
  const { includeSecondMedicine = false, readonly = false, record = null, videoSubmitLock = false } = normalized;

  const diagnosisTags = getDiagnosisTags(record);
  const medicines =
    record?.prescriptionMedicines?.length
      ? record.prescriptionMedicines
      : defaultPrescriptionMedicines;
  let medicineRows = medicines;
  if (!readonly && includeSecondMedicine && medicines.length === 1) {
    medicineRows = [...medicines, { ...medicines[0], index: 2 }];
  }

  const panelLabel = readonly ? "只读处方信息" : "处方信息";

  return `
    <section class="prescription-panel${readonly ? " prescription-panel--readonly" : ""}${record?.inlineRiskWarningVisible ? " has-inline-risk-warning" : ""}" aria-label="${panelLabel}">
      ${renderPatientSection(record)}
      <div class="section-divider"></div>
      ${renderDiagnosisSection({ title: "疾病信息", diagnosisTags, readonly, treatmentAdvice: null })}
      <div class="section-divider"></div>
      ${renderMedicineSection({ medicines: medicineRows, readonly })}
      ${readonly ? "" : renderMedicineRiskTip()}
      ${renderPrescriptionActions({ readonly, videoSubmitLock, prescriptionSubmitted: Boolean(record?.prescriptionSubmitted) })}
    </section>`;
}

export function renderConsultationPanel(options = {}) {
  const { readonly = false, record = null } = options;
  const diagnosisTags = getDiagnosisTags(record, { excludeConsultationTag: true });
  const medicines = record?.prescriptionMedicines?.length ? record.prescriptionMedicines : [];

  return `
    <section class="prescription-panel consultation-panel${readonly ? " prescription-panel--readonly" : ""}" aria-label="咨询处理信息">
      ${renderPatientSection(record)}
      <div class="section-divider"></div>
      ${renderDiagnosisSection({
        title: "诊断意见",
        diagnosisTags,
        readonly,
        className: "consultation-diagnosis-section",
        treatmentAdvice: record?.treatmentAdvice || ""
      })}
      <div class="section-divider"></div>
      ${renderMedicineSection({ medicines, readonly, className: "consultation-medicine-section" })}
      ${readonly ? "" : renderMedicineRiskTip()}
      ${renderPrescriptionActions({ readonly, consultation: true })}
    </section>`;
}
