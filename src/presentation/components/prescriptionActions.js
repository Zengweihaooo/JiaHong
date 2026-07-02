import { videoPrescriptionSubmitLockSeconds } from "../../domain/consultationRules.js";
import { renderButton, renderClockIcon } from "./primitives.js?v=20260604-37";
import { renderPrescriptionRemarkSelect } from "../views/prescriptionFormFields.js?v=20260528-06";

function renderArchivedActionHint(readonly) {
  return readonly ? `<span class="prescription-actions__hint">已封存，仅支持查看</span>` : renderPrescriptionRemarkSelect();
}

function renderVideoSubmitCountdown(remainingSeconds = videoPrescriptionSubmitLockSeconds) {
  return `
    <span class="video-submit-countdown" data-video-submit-countdown data-remaining="${remainingSeconds}" aria-live="polite">
      ${renderClockIcon({ className: "video-submit-countdown__icon", size: 12, strokeWidth: 1.2 })}
      <span class="video-submit-countdown__value">${remainingSeconds}s</span>
    </span>`;
}

function renderPrescriptionActionButtons({
  readonly = false,
  consultation = false,
  videoSubmitLock = false,
  prescriptionSubmitted = false,
  canEndConsultation = false
} = {}) {
  if (readonly) {
    return renderButton({ text: "查看开方历史", tone: "primary", size: "md", className: "prescription-history-open" });
  }
  if (consultation) {
    return renderButton({ text: "完成问诊", tone: "primary", size: "md", className: "end-consult-trigger consultation-complete-trigger" });
  }
  const submitLocked = videoSubmitLock && !prescriptionSubmitted;
  const submitButton = renderButton({
    text: "提交处方",
    tone: "primary",
    size: "md",
    className: "jh-prescription-submit",
    disabled: submitLocked || prescriptionSubmitted
  });
  return `${renderButton({ text: "结束问诊", tone: "success", size: "md", className: "end-consult-trigger", disabled: !canEndConsultation })}
          ${
            submitLocked
              ? `<span class="video-prescription-submit-wrap">${renderVideoSubmitCountdown()}${submitButton}</span>`
              : submitButton
          }`;
}

export function renderPrescriptionActions({
  readonly = false,
  consultation = false,
  videoSubmitLock = false,
  prescriptionSubmitted = false,
  canEndConsultation = false
} = {}) {
  return `
      <div class="prescription-actions${consultation ? " consultation-actions" : ""}${readonly ? " prescription-actions--readonly" : ""}">
        ${renderArchivedActionHint(readonly)}
        <div class="prescription-actions__controls">
          ${renderPrescriptionActionButtons({ readonly, consultation, videoSubmitLock, prescriptionSubmitted, canEndConsultation })}
        </div>
      </div>`;
}
