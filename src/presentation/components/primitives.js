import { assetUrl } from "../../shared/core.js";
import { getConsultationDurationTone } from "../../domain/consultationRules.js";

export function renderCheckboxMark() {
  return `<img class="jh-checkbox__mark" src="${assetUrl("assets/figma-home/checkmark.svg")}" alt="" aria-hidden="true" />`;
}

export function renderCheckbox({ label, className = "", labelClassName = "" } = {}) {
  return `
    <span class="jh-checkbox${className ? ` ${className}` : ""}">
      <span class="jh-checkbox__icon" aria-hidden="true">${renderCheckboxMark()}</span>
      ${label ? `<span class="jh-checkbox__label${labelClassName ? ` ${labelClassName}` : ""}">${label}</span>` : ""}
    </span>`;
}

export function renderSwitch({ checked = false, label = "切换开关", className = "" } = {}) {
  return `<button class="jh-switch${checked ? " is-on" : ""}${className ? ` ${className}` : ""}" type="button" aria-label="${label}" aria-pressed="${checked}"></button>`;
}

export function renderButton({ text, tone = "primary", size = "md", className = "", type = "button", disabled = false } = {}) {
  const safeTone = [
    "primary",
    "success",
    "outline-primary",
    "outline-secondary",
    "block-outline",
    "danger",
    "soft-danger",
    "neutral",
    "text"
  ].includes(tone)
    ? tone
    : "primary";
  const sizeClass = ["sm", "md", "lg"].includes(size) ? ` jh-btn--${size}` : "";
  return `<button class="jh-btn${sizeClass} jh-btn--${safeTone}${className ? ` ${className}` : ""}" type="${type}"${disabled ? " disabled" : ""}>${text}</button>`;
}

export function formatDuration(totalSeconds) {
  const safeSeconds = Math.max(0, Number(totalSeconds) || 0);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;
  return [hours, minutes, seconds].map((value) => String(value).padStart(2, "0")).join(":");
}

export function getDurationTone(totalSeconds) {
  return getConsultationDurationTone(totalSeconds);
}

export function renderClockIcon({ className = "", size = 18, strokeWidth = 1.4 } = {}) {
  const safeSize = Number(size) || 18;
  const center = safeSize / 2;
  const radius = center - strokeWidth / 2;
  const handTop = safeSize * 0.28;
  const handEndX = safeSize * 0.68;
  const handEndY = safeSize * 0.6;
  return `<svg class="${className}" width="${safeSize}" height="${safeSize}" viewBox="0 0 ${safeSize} ${safeSize}" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
    <circle cx="${center}" cy="${center}" r="${radius}" stroke="currentColor" stroke-width="${strokeWidth}"/>
    <path d="M${center} ${handTop}V${center}L${handEndX} ${handEndY}" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
}

export function renderDurationChip(variant = "icon", elapsedSeconds = 0) {
  const safeVariant = ["icon", "pill", "plain"].includes(variant) ? variant : "icon";
  const durationText = formatDuration(elapsedSeconds);
  const tone = getDurationTone(elapsedSeconds);
  return `
    <span class="jh-duration-chip jh-duration-chip--${safeVariant} jh-duration-chip--${tone}" data-duration-timer data-elapsed="${elapsedSeconds}" aria-label="问诊持续时长：${durationText}">
      ${
        safeVariant === "icon"
          ? renderClockIcon({ className: "jh-duration-chip__clock", size: 18, strokeWidth: 1.4 })
          : ""
      }
      <strong><span class="jh-duration-chip__prefix">问诊持续时长：</span><span class="jh-duration-chip__value">${durationText}</span></strong>
    </span>`;
}

export function renderLabelTag({ text = "默认标签", tone = "light", size = "sm", weight = "regular", className = "" } = {}) {
  const safeTone = ["dark", "light", "focus"].includes(tone) ? tone : "light";
  const safeSize = ["sm", "md", "lg"].includes(size) ? size : "sm";
  const weightClass = weight === "bold" ? " jh-tag--bold" : "";
  return `<span class="jh-tag jh-tag--${safeTone} jh-tag--${safeSize}${weightClass}${className ? ` ${className}` : ""}">${text}</span>`;
}

export function getDoctorStatusLabel(status = "offline") {
  const labels = {
    online: "在线",
    busy: "忙碌",
    offline: "离线"
  };
  return labels[status] || labels.offline;
}

export function renderStatusBadge(status = "online", className = "", { live = true } = {}) {
  const safeStatus = ["online", "busy", "offline"].includes(status) ? status : "online";
  return `<span class="jh-status-badge jh-status-badge--${safeStatus}${className ? ` ${className}` : ""}"${live ? " data-status-text" : ""}>${getDoctorStatusLabel(safeStatus)}</span>`;
}

export function renderReadTag(status = "unread", className = "") {
  const safeStatus = status === "read" ? "read" : "unread";
  const label = safeStatus === "read" ? "已读" : "未读";
  return `<span class="jh-read-tag jh-read-tag--${safeStatus}${className ? ` ${className}` : ""}">${label}</span>`;
}

export function renderRiskTag({ text = "高", size = "sm", className = "" } = {}) {
  if (text === "中") return "";
  const safeSize = size === "lg" ? "lg" : "sm";
  const riskLevelClass = {
    高: "jh-risk-tag--high",
    低: "jh-risk-tag--low"
  }[text] || "";
  return `<span class="jh-risk-tag jh-risk-tag--${safeSize}${riskLevelClass ? ` ${riskLevelClass}` : ""}${className ? ` ${className}` : ""}">${text}</span>`;
}
