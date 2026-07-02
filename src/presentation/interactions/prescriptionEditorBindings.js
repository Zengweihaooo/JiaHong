import { getActiveConsultationRecord } from "../../application/controllers/consultationController.js";
import { syncEndConsultTriggerState } from "./consultDialogBindings.js";
import { getHighestMedicineRiskLevel, getMedicineRiskWarnings, prescriptionRiskLevels, getPrescriptionRiskCategoryLevel } from "../../domain/prescriptionRisk.js";
import {
  addDiagnosisToActiveRecord,
  addMedicineToActiveRecord,
  clearDiagnosesFromActiveRecord,
  getDiagnosisOptions,
  getMedicineOptions,
  removeDiagnosisFromActiveRecord,
  removeMedicineFromActiveRecord,
  updateMedicineFieldInActiveRecord
} from "../../application/controllers/prescriptionController.js";
import { renderConsultationPanel, renderPrescriptionPanel } from "../views/prescriptionPanels.js?v=20260528-06";
import { showToast } from "../ui/interactionPrimitives.js";
import { getCustomScrollContent, resetFloatingScrollList, syncCustomScrollList, syncFloatingScrollList } from "../ui/customScrollList.js";
import {
  bindMedicineUsageControls,
  bindMedicineUnitControls,
  closeMedicineUsageDropdowns,
  closeMedicineUnitDropdowns,
  configureMedicineUnitBindings
} from "./medicineUnitBindings.js?v=20260528-06";

let getPrescriptionContext = () => ({});
let onPrescriptionPanelRendered = () => {};

function syncMedicineRiskSelection(panel, medicineIndex = "") {
  panel?.querySelectorAll(".medicine-table__row--warning-linked").forEach((row) => {
    row.classList.toggle("medicine-table__row--warning-active", Boolean(medicineIndex) && row.dataset.medicineIndex === String(medicineIndex));
  });
}

export function configurePrescriptionEditorBindings({ getContext, onPanelRendered } = {}) {
  getPrescriptionContext = typeof getContext === "function" ? getContext : () => ({});
  onPrescriptionPanelRendered = typeof onPanelRendered === "function" ? onPanelRendered : () => {};
  configureMedicineUnitBindings({ getContext: getPrescriptionContext, onFieldResult: handleMedicineFieldResult });
}

function refreshActivePrescriptionPanel(record = getActiveConsultationRecord(getPrescriptionContext())) {
  const panel = document.querySelector(".prescription-panel:not(.prescription-panel--readonly)");
  if (!panel || !record) return;
  const scrollTop = panel.scrollTop;
  const scrollBottom = panel.scrollHeight - panel.clientHeight - scrollTop;
  panel.outerHTML = record.type === "consult" ? renderConsultationPanel({ record }) : renderPrescriptionPanel({ record });
  onPrescriptionPanelRendered();
  const nextPanel = document.querySelector(".prescription-panel:not(.prescription-panel--readonly)");
  if (nextPanel) {
    const restoreScroll = () => {
      nextPanel.scrollTop = scrollTop > 0
        ? Math.max(0, nextPanel.scrollHeight - nextPanel.clientHeight - scrollBottom)
        : 0;
    };
    restoreScroll();
    window.requestAnimationFrame(restoreScroll);
    window.setTimeout(restoreScroll, 0);
  }
}

function hideMedicineRiskTip(panel) {
  const tip = panel?.querySelector("[data-medicine-risk-tip]");
  if (!tip) return;
  tip.hidden = true;
  delete tip.dataset.activeMedicineIndex;
  syncMedicineRiskSelection(panel);
}

function showMedicineRiskTip(panel, row) {
  const tip = panel?.querySelector("[data-medicine-risk-tip]");
  if (!tip || !row?.dataset?.warningLevel) return;
  const titleNode = tip.querySelector("[data-medicine-risk-title]");
  const categoriesNode = tip.querySelector("[data-medicine-risk-categories]");
  const messageNode = tip.querySelector("[data-medicine-risk-message]");
  const suggestionNode = tip.querySelector("[data-medicine-risk-suggestion]");
  if (titleNode) titleNode.textContent = `药品风险提示 · ${row.dataset.medicineName || "当前药品"}`;
  if (categoriesNode) {
    const categories = (row.dataset.warningCategories || "").split("、").filter(Boolean);
    categoriesNode.replaceChildren(
      ...categories.map((category) => {
        const tag = document.createElement("span");
        const level = getPrescriptionRiskCategoryLevel(category);
        tag.className = `medicine-risk-tip__category medicine-risk-tip__category--${level}`;
        tag.textContent = category;
        return tag;
      })
    );
  }
  if (messageNode) messageNode.textContent = row.dataset.warningMessage || "";
  if (suggestionNode) suggestionNode.textContent = row.dataset.warningSuggestion || "";
  tip.dataset.activeMedicineIndex = row.dataset.medicineIndex || "";
  tip.hidden = false;
  syncMedicineRiskSelection(panel, tip.dataset.activeMedicineIndex);
}

function shouldIgnoreMedicineRiskRowTarget(target) {
  return Boolean(target?.closest?.(".medicine-delete-btn, .medicine-usage-options, .medicine-unit-options"));
}

function clearMedicineWarningTargetClasses(fieldNode) {
  fieldNode?.classList.remove(
    "medicine-warning-target",
    "medicine-warning-target--must",
    "medicine-warning-target--severe",
    "medicine-warning-target--general"
  );
}

function handleMedicineFieldResult({ row, fieldNode, result } = {}) {
  if (result?.fieldWarningCleared) {
    clearMedicineWarningTargetClasses(fieldNode);
  }
  if (result?.medicineWarningsResolved) {
    row?.classList.remove("medicine-table__row--warning-linked");
  }
  applyMedicineRowWarningState(row, result);
  if (result?.record) {
    syncEndConsultTriggerState(result.record);
  }
}

function applyMedicineRowWarningState(row, result) {
  const rowIndex = Number(row?.dataset.medicineIndex || 0);
  const medicine = result?.record?.prescriptionMedicines?.find((item) => Number(item.index) === rowIndex);
  if (!row || !medicine) return;
  const panel = row.closest(".prescription-panel");
  const level = getHighestMedicineRiskLevel(medicine);
  row.classList.remove(
    "medicine-table__row--warning-linked",
    "medicine-table__row--warning-active",
    "medicine-table__row--warning-must",
    "medicine-table__row--warning-severe",
    "medicine-table__row--warning-general"
  );
  if (!level) {
    delete row.dataset.warningLevel;
    delete row.dataset.warningLevelLabel;
    delete row.dataset.warningCategories;
    delete row.dataset.warningMessage;
    delete row.dataset.warningSuggestion;
    const tip = panel?.querySelector("[data-medicine-risk-tip]");
    if (tip?.dataset.activeMedicineIndex === String(row.dataset.medicineIndex || "")) {
      hideMedicineRiskTip(panel);
    }
    return;
  }
  row.classList.add("medicine-table__row--warning-linked", `medicine-table__row--warning-${level}`);
  row.dataset.warningLevel = level;
  row.dataset.warningLevelLabel = prescriptionRiskLevels[level];
  row.dataset.warningCategories = getMedicineRiskWarnings(medicine).map((warning) => warning.category).join("、");
  row.dataset.warningMessage = medicine.warningMessage || `[警示信息]${medicine.name || "当前药品"}需完成风险核对`;
  row.dataset.warningSuggestion = medicine.warningSuggestion || "[建议信息]请结合患者基础信息、过敏史和用药风险完成处方确认。";
  const tip = panel?.querySelector("[data-medicine-risk-tip]");
  if (tip?.dataset.activeMedicineIndex === String(row.dataset.medicineIndex || "")) {
    showMedicineRiskTip(panel, row);
  }
}

function getOptionListContainer(dropdown) {
  syncCustomScrollList(dropdown);
  return getCustomScrollContent(dropdown);
}

async function renderDiagnosisDropdown(input) {
  const panel = input.closest(".prescription-panel");
  const dropdown = panel?.querySelector(".diagnosis-options");
  if (!dropdown) return;
  const requestId = `${Date.now()}-${Math.random()}`;
  input.dataset.diagnosisRequestId = requestId;
  const context = getPrescriptionContext();
  const options = await getDiagnosisOptions(input.value, context);
  if (input.dataset.diagnosisRequestId !== requestId) return;
  const list = getOptionListContainer(dropdown);
  list.innerHTML = "";
  options.forEach((diagnosis) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "diagnosis-option";
    button.setAttribute("role", "option");
    button.textContent = diagnosis;
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      event.stopPropagation();
      handlePrescriptionResult(addDiagnosisToActiveRecord(diagnosis, context));
    });
    list.appendChild(button);
  });
  dropdown.hidden = options.length === 0;
  input.setAttribute("aria-expanded", String(options.length > 0));
  syncCustomScrollList(dropdown);
}

function closeDiagnosisDropdown(input) {
  const panel = input.closest(".prescription-panel");
  const dropdown = panel?.querySelector(".diagnosis-options");
  if (!dropdown) return;
  dropdown.hidden = true;
  input.setAttribute("aria-expanded", "false");
}

function renderPrescriptionRemarkDropdown(input, { filter = true } = {}) {
  const combobox = input.closest(".prescription-remark-combobox");
  const dropdown = combobox?.querySelector(".prescription-remark-options");
  if (!dropdown) return;
  const keyword = input.value.trim();
  const options = Array.from(dropdown.querySelectorAll(".prescription-remark-option"));
  let visibleCount = 0;
  options.forEach((option) => {
    const visible = !filter || !keyword || option.dataset.prescriptionRemark.includes(keyword);
    option.hidden = !visible;
    if (visible) visibleCount += 1;
  });
  dropdown.hidden = visibleCount === 0;
  input.setAttribute("aria-expanded", String(visibleCount > 0));
  syncCustomScrollList(dropdown);
}

function closePrescriptionRemarkDropdown(input) {
  const combobox = input.closest(".prescription-remark-combobox");
  const dropdown = combobox?.querySelector(".prescription-remark-options");
  if (!dropdown) return;
  dropdown.hidden = true;
  input.setAttribute("aria-expanded", "false");
}

async function renderMedicineDropdown(input) {
  const panel = input.closest(".prescription-panel");
  const dropdown = panel?.querySelector(".medicine-options");
  if (!dropdown) return;
  const requestId = `${Date.now()}-${Math.random()}`;
  input.dataset.medicineRequestId = requestId;
  const context = getPrescriptionContext();
  const options = await getMedicineOptions(input.value, context);
  if (input.dataset.medicineRequestId !== requestId) return;
  const list = getOptionListContainer(dropdown);
  list.innerHTML = "";
  options.forEach((medicine) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "medicine-option";
    button.setAttribute("role", "option");
    button.innerHTML = `<span>${medicine.name}</span><small>${medicine.spec}</small>`;
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      event.stopPropagation();
      handlePrescriptionResult(addMedicineToActiveRecord(medicine, context));
    });
    list.appendChild(button);
  });
  dropdown.hidden = options.length === 0;
  input.setAttribute("aria-expanded", String(options.length > 0));
  if (options.length > 0) {
    syncFloatingScrollList(dropdown, input, { gap: 4, width: 320 });
  } else {
    resetFloatingScrollList(dropdown);
  }
}

function closeMedicineDropdown(input) {
  const panel = input.closest(".prescription-panel");
  const dropdown = panel?.querySelector(".medicine-options");
  if (!dropdown) return;
  dropdown.hidden = true;
  input.setAttribute("aria-expanded", "false");
  resetFloatingScrollList(dropdown);
}

async function handlePrescriptionResult(resultOrPromise) {
  const result = await resultOrPromise;
  if (result?.record) {
    refreshActivePrescriptionPanel(result.record);
    syncEndConsultTriggerState(result.record);
  }
  if (result?.message) {
    showToast(result.message);
  }
}

export function bindPrescriptionEditor() {
  const panel = document.querySelector(".prescription-panel:not(.prescription-panel--readonly)");
  if (!panel || panel.dataset.editorBound === "true") return;
  panel.dataset.editorBound = "true";

  panel.querySelectorAll(".diagnosis-tag__close-btn[data-diagnosis-tag]").forEach((button) => {
    const removeDiagnosis = (event) => {
      event.preventDefault();
      event.stopPropagation();
      handlePrescriptionResult(
        removeDiagnosisFromActiveRecord(button.dataset.diagnosisTag, getPrescriptionContext())
      );
    };
    button.addEventListener("pointerdown", removeDiagnosis);
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
    });
  });
  panel.querySelectorAll(".diagnosis-clear-all-btn").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
    });
    button.addEventListener("dblclick", (event) => {
      event.preventDefault();
      event.stopPropagation();
      handlePrescriptionResult(clearDiagnosesFromActiveRecord(getPrescriptionContext()));
    });
  });
  const diagnosisInput = panel.querySelector(".diagnosis-select-input");
  diagnosisInput?.addEventListener("focus", () => {
    renderDiagnosisDropdown(diagnosisInput);
  });
  diagnosisInput?.addEventListener("input", () => {
    renderDiagnosisDropdown(diagnosisInput);
  });
  diagnosisInput?.addEventListener("blur", () => {
    window.setTimeout(() => closeDiagnosisDropdown(diagnosisInput), 0);
  });
  diagnosisInput?.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" || event.isComposing) return;
    event.preventDefault();
    const diagnosisText = event.currentTarget.value.trim();
    if (!diagnosisText) return;
    handlePrescriptionResult(addDiagnosisToActiveRecord(diagnosisText, getPrescriptionContext()));
  });
  const prescriptionRemarkInput = panel.querySelector(".prescription-remark-input");
  prescriptionRemarkInput?.addEventListener("pointerdown", () => {
    renderPrescriptionRemarkDropdown(prescriptionRemarkInput, { filter: false });
  });
  prescriptionRemarkInput?.addEventListener("focus", () => {
    renderPrescriptionRemarkDropdown(prescriptionRemarkInput, { filter: false });
  });
  prescriptionRemarkInput?.addEventListener("input", () => {
    renderPrescriptionRemarkDropdown(prescriptionRemarkInput, { filter: true });
  });
  prescriptionRemarkInput?.addEventListener("blur", () => {
    window.setTimeout(() => closePrescriptionRemarkDropdown(prescriptionRemarkInput), 0);
  });
  prescriptionRemarkInput?.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closePrescriptionRemarkDropdown(prescriptionRemarkInput);
      return;
    }
    if (event.key !== "ArrowDown" && event.key !== "Enter") return;
    const firstOption = panel.querySelector(".prescription-remark-options:not([hidden]) .prescription-remark-option:not([hidden])");
    if (!firstOption) return;
    event.preventDefault();
    if (event.key === "ArrowDown") {
      firstOption.focus();
      return;
    }
    prescriptionRemarkInput.value = firstOption.dataset.prescriptionRemark || firstOption.textContent.trim();
    closePrescriptionRemarkDropdown(prescriptionRemarkInput);
  });
  panel.querySelectorAll(".prescription-remark-option[data-prescription-remark]").forEach((option) => {
    option.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      event.stopPropagation();
      prescriptionRemarkInput.value = option.dataset.prescriptionRemark || option.textContent.trim();
      closePrescriptionRemarkDropdown(prescriptionRemarkInput);
    });
    option.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      prescriptionRemarkInput.value = option.dataset.prescriptionRemark || option.textContent.trim();
      closePrescriptionRemarkDropdown(prescriptionRemarkInput);
      prescriptionRemarkInput.focus();
    });
  });
  const medicineInput = panel.querySelector(".medicine-search input");
  medicineInput?.setAttribute("aria-expanded", "false");
  medicineInput?.addEventListener("focus", () => {
    renderMedicineDropdown(medicineInput);
  });
  medicineInput?.addEventListener("input", () => {
    renderMedicineDropdown(medicineInput);
  });
  medicineInput?.addEventListener("blur", () => {
    window.setTimeout(() => closeMedicineDropdown(medicineInput), 0);
  });
  medicineInput?.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" || event.isComposing) return;
    event.preventDefault();
    handlePrescriptionResult(addMedicineToActiveRecord(event.currentTarget.value, getPrescriptionContext()));
  });
  if (!bindPrescriptionEditor.dropdownDismissBound) {
    bindPrescriptionEditor.dropdownDismissBound = true;
    document.addEventListener("pointerdown", (event) => {
      if (!event.target.closest(".diagnosis-combobox")) {
        document.querySelectorAll(".diagnosis-select-input").forEach((input) => closeDiagnosisDropdown(input));
      }
      if (!event.target.closest(".prescription-remark-combobox")) {
        document.querySelectorAll(".prescription-remark-input").forEach((input) => closePrescriptionRemarkDropdown(input));
      }
      if (!event.target.closest(".medicine-search-combobox")) {
        document.querySelectorAll(".medicine-search input").forEach((input) => closeMedicineDropdown(input));
      }
      if (!event.target.closest(".medicine-unit-control")) {
        closeMedicineUnitDropdowns();
      }
      if (!event.target.closest(".medicine-usage-control")) {
        closeMedicineUsageDropdowns();
      }
    });
  }
  panel.querySelectorAll(".medicine-delete-btn").forEach((button) => {
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const row = button.closest("[data-medicine-name]");
      handlePrescriptionResult(
        removeMedicineFromActiveRecord(row?.dataset.medicineName, getPrescriptionContext())
      );
    });
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
    });
  });
  bindMedicineUsageControls(panel);
  bindMedicineUnitControls(panel);
  syncEndConsultTriggerState(getActiveConsultationRecord(getPrescriptionContext()));
  const riskTip = panel.querySelector("[data-medicine-risk-tip]");
  syncMedicineRiskSelection(panel, riskTip?.dataset.activeMedicineIndex);
  riskTip?.querySelector(".medicine-risk-tip__close")?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    hideMedicineRiskTip(panel);
  });
  panel.querySelectorAll(".medicine-table__row[data-warning-level]").forEach((row) => {
    row.addEventListener("pointerdown", (event) => {
      if (shouldIgnoreMedicineRiskRowTarget(event.target)) return;
      showMedicineRiskTip(panel, row);
    }, true);
    row.addEventListener("click", (event) => {
      if (shouldIgnoreMedicineRiskRowTarget(event.target)) return;
      showMedicineRiskTip(panel, row);
    });
  });
  panel.querySelectorAll(".medicine-edit-field[data-medicine-field]").forEach((input) => {
    input.addEventListener("input", () => {
      const row = input.closest("[data-medicine-index]");
      const result = updateMedicineFieldInActiveRecord(
        row?.dataset.medicineIndex,
        input.dataset.medicineField,
        input.value,
        getPrescriptionContext()
      );
      handleMedicineFieldResult({ row, fieldNode: input, result });
    });
    input.addEventListener("change", () => {
      const row = input.closest("[data-medicine-index]");
      const result = updateMedicineFieldInActiveRecord(
        row?.dataset.medicineIndex,
        input.dataset.medicineField,
        input.value,
        getPrescriptionContext()
      );
      handleMedicineFieldResult({ row, fieldNode: input, result });
    });
  });
}
