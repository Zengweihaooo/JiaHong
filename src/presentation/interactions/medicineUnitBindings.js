import { updateMedicineFieldInActiveRecord } from "../../application/controllers/prescriptionController.js";

let getPrescriptionContext = () => ({});
let onMedicineFieldUpdated = () => {};
const medicineFieldOptions = {
  usage: ["口服", "外用", "适量冲洗", "口腔吸入", "鼻吸入"],
  frequency: ["1次/日", "2次/日", "3次/日", "4次/日", "1-2次/日", "2-3次/日", "必要时", "按需", "单次"],
  dose: ["0.5片", "1片", "2片", "1粒", "2粒", "0.5袋", "1袋", "2袋", "5ml", "10ml", "15ml", "1吸", "1滴", "适量", "薄涂", "每侧鼻孔2喷"]
};

export function configureMedicineUnitBindings({ getContext, onFieldResult } = {}) {
  getPrescriptionContext = typeof getContext === "function" ? getContext : () => ({});
  onMedicineFieldUpdated = typeof onFieldResult === "function" ? onFieldResult : () => {};
}

function applyMedicineFieldResult(row, fieldNode, result) {
  if (result.fieldWarningCleared) {
    fieldNode?.classList.remove("medicine-warning-target");
  }
  if (result.medicineWarningsResolved) {
    row?.classList.remove("medicine-table__row--warning-linked");
  }
  onMedicineFieldUpdated({ row, fieldNode, result });
}

function closeMedicineUnitDropdown(control) {
  const dropdown = control?.querySelector(".medicine-unit-options");
  const trigger = control?.querySelector(".medicine-unit-select");
  if (!dropdown || !trigger) return;
  dropdown.hidden = true;
  trigger.setAttribute("aria-expanded", "false");
}

export function closeMedicineUnitDropdowns(exceptControl = null) {
  document.querySelectorAll(".medicine-unit-control").forEach((control) => {
    if (control !== exceptControl) closeMedicineUnitDropdown(control);
  });
}

function closeMedicineUsageDropdown(control) {
  const dropdown = control?.querySelector(".medicine-usage-options");
  const input = control?.querySelector(".medicine-usage-input");
  if (!dropdown || !input) return;
  dropdown.hidden = true;
  input.setAttribute("aria-expanded", "false");
}

export function closeMedicineUsageDropdowns(exceptControl = null) {
  document.querySelectorAll(".medicine-usage-control").forEach((control) => {
    if (control !== exceptControl) closeMedicineUsageDropdown(control);
  });
}

function positionOpenMedicineUnitDropdowns() {
  document.querySelectorAll('.medicine-unit-select[aria-expanded="true"]').forEach((trigger) => {
    positionMedicineUnitDropdown(trigger.closest(".medicine-unit-control"));
  });
}

function positionOpenMedicineUsageDropdowns() {
  document.querySelectorAll('.medicine-usage-input[aria-expanded="true"]').forEach((input) => {
    positionMedicineUsageDropdown(input.closest(".medicine-usage-control"));
  });
}

function positionMedicineUnitDropdown(control) {
  const trigger = control?.querySelector(".medicine-unit-select");
  const dropdown = control?.querySelector(".medicine-unit-options");
  if (!trigger || !dropdown) return;
  const triggerRect = trigger.getBoundingClientRect();
  const menuWidth = dropdown.offsetWidth || 64;
  const left = Math.min(triggerRect.right + 8, window.innerWidth - menuWidth - 8);
  const top = Math.max(8, triggerRect.top - 8);
  dropdown.style.setProperty("--medicine-unit-menu-left", `${Math.max(8, left)}px`);
  dropdown.style.setProperty("--medicine-unit-menu-top", `${top}px`);
}

function positionMedicineUsageDropdown(control) {
  const input = control?.querySelector(".medicine-usage-input");
  const dropdown = control?.querySelector(".medicine-usage-options");
  if (!input || !dropdown) return;
  const inputRect = input.getBoundingClientRect();
  const menuWidth = Math.max(112, inputRect.width);
  const left = Math.min(inputRect.left, window.innerWidth - menuWidth - 8);
  const top = inputRect.bottom + 6;
  dropdown.style.setProperty("--medicine-usage-menu-left", `${Math.max(8, left)}px`);
  dropdown.style.setProperty("--medicine-usage-menu-top", `${top}px`);
  dropdown.style.setProperty("--medicine-usage-menu-width", `${menuWidth}px`);
}

function openMedicineUnitDropdown(control) {
  const dropdown = control?.querySelector(".medicine-unit-options");
  const trigger = control?.querySelector(".medicine-unit-select");
  if (!dropdown || !trigger) return;
  closeMedicineUnitDropdowns(control);
  dropdown.hidden = false;
  trigger.setAttribute("aria-expanded", "true");
  positionMedicineUnitDropdown(control);
}

function renderMedicineUsageOptions(control, { filter = true } = {}) {
  const input = control?.querySelector(".medicine-usage-input");
  const dropdown = control?.querySelector(".medicine-usage-options");
  if (!input || !dropdown) return;
  const keyword = input.value.trim();
  const field = input.dataset.medicineField || "usage";
  const sourceOptions = medicineFieldOptions[field] || [];
  const options = filter
    ? sourceOptions.filter((option) => !keyword || option.includes(keyword))
    : sourceOptions;
  dropdown.innerHTML = options.length
    ? options
      .map(
        (option) => `
        <button
          class="medicine-usage-option${option === input.value ? " is-active" : ""}"
          type="button"
          role="option"
          aria-selected="${option === input.value ? "true" : "false"}"
          data-medicine-option="${option}"
        >
          ${option}
        </button>`
      )
      .join("")
    : `<span class="medicine-usage-empty">无匹配选项</span>`;
  bindMedicineUsageOptions(control);
}

function openMedicineUsageDropdown(control, options = {}) {
  const dropdown = control?.querySelector(".medicine-usage-options");
  const input = control?.querySelector(".medicine-usage-input");
  if (!dropdown || !input) return;
  closeMedicineUsageDropdowns(control);
  renderMedicineUsageOptions(control, options);
  dropdown.hidden = false;
  input.setAttribute("aria-expanded", "true");
  positionMedicineUsageDropdown(control);
}

function selectMedicineUnit(option) {
  const control = option.closest(".medicine-unit-control");
  const row = option.closest("[data-medicine-index]");
  const trigger = control?.querySelector(".medicine-unit-select");
  const unit = option.dataset.medicineUnit || "";
  const result = updateMedicineFieldInActiveRecord(row?.dataset.medicineIndex, "unit", unit, getPrescriptionContext());
  if (trigger) {
    trigger.querySelector("span").textContent = unit;
  }
  applyMedicineFieldResult(row, trigger, result);
  control?.querySelectorAll(".medicine-unit-option").forEach((item) => {
    const active = item === option;
    item.classList.toggle("is-active", active);
    item.setAttribute("aria-selected", String(active));
  });
  closeMedicineUnitDropdown(control);
}

function selectMedicineUsage(option) {
  const control = option.closest(".medicine-usage-control");
  const row = option.closest("[data-medicine-index]");
  const input = control?.querySelector(".medicine-usage-input");
  const field = input?.dataset.medicineField || "usage";
  const value = option.dataset.medicineOption || "";
  const result = updateMedicineFieldInActiveRecord(row?.dataset.medicineIndex, field, value, getPrescriptionContext());
  if (input) input.value = value;
  applyMedicineFieldResult(row, input, result);
  control?.querySelectorAll(".medicine-usage-option").forEach((item) => {
    const active = item === option;
    item.classList.toggle("is-active", active);
    item.setAttribute("aria-selected", String(active));
  });
  closeMedicineUsageDropdown(control);
}

function bindMedicineUnitGlobalDismiss() {
  if (bindMedicineUnitGlobalDismiss.bound) return;
  bindMedicineUnitGlobalDismiss.bound = true;
  window.addEventListener("resize", () => {
    closeMedicineUnitDropdowns();
    closeMedicineUsageDropdowns();
  });
  document.addEventListener("scroll", () => {
    positionOpenMedicineUnitDropdowns();
    positionOpenMedicineUsageDropdowns();
  }, true);
}

function bindMedicineUsageOptions(control) {
  control?.querySelectorAll(".medicine-usage-option[data-medicine-option]").forEach((option) => {
    option.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      event.stopPropagation();
      selectMedicineUsage(option);
    });
    option.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
    });
    option.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        selectMedicineUsage(option);
      }
      if (event.key === "Escape") {
        closeMedicineUsageDropdown(control);
        control?.querySelector(".medicine-usage-input")?.focus();
      }
    });
  });
}

export function bindMedicineUsageControls(panel) {
  bindMedicineUnitGlobalDismiss();

  panel.querySelectorAll(".medicine-usage-input").forEach((input) => {
    input.addEventListener("pointerdown", () => {
      openMedicineUsageDropdown(input.closest(".medicine-usage-control"), { filter: false });
    });
    input.addEventListener("click", () => {
      openMedicineUsageDropdown(input.closest(".medicine-usage-control"), { filter: false });
    });
    input.addEventListener("focus", () => {
      openMedicineUsageDropdown(input.closest(".medicine-usage-control"), { filter: false });
    });
    input.addEventListener("input", () => {
      openMedicineUsageDropdown(input.closest(".medicine-usage-control"), { filter: true });
    });
    input.addEventListener("blur", () => {
      window.setTimeout(() => closeMedicineUsageDropdown(input.closest(".medicine-usage-control")), 0);
    });
    input.addEventListener("keydown", (event) => {
      const control = input.closest(".medicine-usage-control");
      if (event.key === "Escape") {
        closeMedicineUsageDropdown(control);
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        openMedicineUsageDropdown(control, { filter: false });
        control?.querySelector(".medicine-usage-option.is-active, .medicine-usage-option")?.focus();
      }
      if (event.key === "Enter" && !event.isComposing) {
        const firstOption = control?.querySelector(".medicine-usage-option");
        if (!firstOption) return;
        event.preventDefault();
        selectMedicineUsage(firstOption);
      }
    });
  });

  panel.querySelectorAll(".medicine-usage-control").forEach(bindMedicineUsageOptions);
}

export function bindMedicineUnitControls(panel) {
  bindMedicineUnitGlobalDismiss();

  panel.querySelectorAll(".medicine-unit-select").forEach((button) => {
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const control = button.closest(".medicine-unit-control");
      const expanded = button.getAttribute("aria-expanded") === "true";
      if (expanded) {
        closeMedicineUnitDropdown(control);
      } else {
        openMedicineUnitDropdown(control);
      }
    });
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
    });
    button.addEventListener("keydown", (event) => {
      const control = button.closest(".medicine-unit-control");
      if (event.key === "Escape") {
        closeMedicineUnitDropdown(control);
        button.focus();
      }
      if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openMedicineUnitDropdown(control);
        control?.querySelector(".medicine-unit-option.is-active, .medicine-unit-option")?.focus();
      }
    });
  });

  panel.querySelectorAll(".medicine-unit-option[data-medicine-unit]").forEach((option) => {
    option.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      event.stopPropagation();
      selectMedicineUnit(option);
    });
    option.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
    });
    option.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        const control = option.closest(".medicine-unit-control");
        closeMedicineUnitDropdown(control);
        control?.querySelector(".medicine-unit-select")?.focus();
      }
    });
  });
}
