import { assetUrl } from "../../shared/core.js";
import { escapeHtml } from "../ui/html.js";
import { renderCustomScrollListMarkup } from "../ui/customScrollList.js";

export function renderSearchField({ className = "", placeholder = "请输入药品名称或首字母做模糊查询", disabled = false } = {}) {
  const safePlaceholder = escapeHtml(placeholder);
  return `
    <label class="jh-search-field${className ? ` ${className}` : ""}${disabled ? " is-disabled" : ""}">
      <span class="jh-search-field__icon" aria-hidden="true">
        <img src="${assetUrl("assets/search-icon.png")}" alt="" />
      </span>
      <input type="text" placeholder="${safePlaceholder}" aria-label="${safePlaceholder}"${disabled ? " disabled" : ""} />
    </label>`;
}

export function renderMedicineSearchCombobox() {
  return `
    <div class="medicine-search-combobox">
      ${renderSearchField({ className: "medicine-search" })}
      <div class="medicine-options jh-custom-scroll" role="listbox" hidden>${renderCustomScrollListMarkup({ maxHeight: 260 })}</div>
    </div>`;
}

export function renderSelectField({ label = "请选择", size = "sm", className = "", showChevron = true } = {}) {
  const safeSize = size === "lg" ? "lg" : "sm";
  const safeLabel = escapeHtml(label);
  return `
    <button class="jh-input-field jh-input-field--${safeSize}${className ? ` ${className}` : ""}" type="button">
      <span>${safeLabel}</span>
      ${
        showChevron
          ? `<span class="jh-input-field__chevron" aria-hidden="true">
              <img src="${assetUrl("assets/figma-consult/chevron-down.svg")}" alt="" />
            </span>`
          : ""
      }
    </button>`;
}

const prescriptionRemarkOptions = [
  "益生菌需与抗生素间隔两小时使用",
  "蒙脱石散需与其它药前后间隔两小时使用",
  "联合用药中的补充用药",
  "为老人带药",
  "处方中儿童药品为15岁孩子带药",
  "按疗程使用",
  "微信支付",
  "现金支付",
  "支付宝支付",
  "阿托伐他汀需与其它药物分开使用",
  "其他"
];

export function renderPrescriptionRemarkSelect() {
  const optionsMarkup = prescriptionRemarkOptions
    .map(
      (option) => `
              <button class="prescription-remark-option" type="button" role="option" data-prescription-remark="${escapeHtml(option)}">
                ${escapeHtml(option)}
              </button>`
    )
    .join("");
  return `
    <label class="prescription-remark-field">
      <span class="prescription-remark-field__label">处方备注：</span>
      <span class="prescription-remark-combobox">
        <input
          class="jh-input-field jh-input-field--lg diagnosis-select prescription-remark-select prescription-remark-input"
          type="text"
          aria-label="处方备注"
          aria-expanded="false"
          autocomplete="off"
          placeholder="请选择"
        />
        <div class="prescription-remark-options jh-custom-scroll" role="listbox" hidden>
          <div class="jh-custom-scroll__viewport">
            <div class="jh-custom-scroll__content">
              ${optionsMarkup}
            </div>
          </div>
          <div class="jh-custom-scroll__bar" aria-hidden="true">
            <div class="jh-custom-scroll__thumb"></div>
          </div>
        </div>
      </span>
    </label>`;
}

export function renderDiagnosisTags(tags, readonly = false) {
  return tags
    .map((tag) => {
      const safeTag = escapeHtml(tag);
      return `
        ${
          readonly
            ? `<span class="diagnosis-tag diagnosis-tag--readonly">`
            : `<span class="diagnosis-tag" data-diagnosis-tag="${safeTag}">`
        }
          <span>${safeTag}</span>
          ${
            readonly
              ? ""
              : `<button class="diagnosis-tag__close diagnosis-tag__close-btn" type="button" data-diagnosis-tag="${safeTag}" aria-label="移除诊断：${safeTag}">
                  <img src="${assetUrl("assets/diagnosis-tag-close.svg")}" alt="" />
                </button>`
          }
        </span>`;
    })
    .join("");
}

export function renderDiagnosisSelectInput() {
  return `
    <div class="diagnosis-combobox">
      <input
        class="jh-input-field jh-input-field--lg diagnosis-select diagnosis-select-input"
        type="text"
        aria-label="请输入诊断"
        aria-expanded="false"
        autocomplete="off"
        placeholder="请输入诊断"
      />
      <div class="diagnosis-options jh-custom-scroll" role="listbox" hidden>${renderCustomScrollListMarkup({ maxHeight: 220 })}</div>
    </div>`;
}
