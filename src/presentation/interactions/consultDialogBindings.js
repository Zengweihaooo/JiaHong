import { getRoomHref } from "../../shared/core.js";
import {
  activePrescriptionHasMustWarnings,
  getActiveConsultationRecord,
  openRiskReviewForActiveConsultation,
  resolveActiveConsultation,
  submitPrescriptionForActiveConsultation
} from "../../application/controllers/consultationController.js";
import { canEndConsultation } from "../../application/controllers/prescriptionController.js";
import {
  bindOverlayDismiss,
  closeOverlay,
  openOverlay,
  setOverlayOpen,
  showToast,
  stopEvent
} from "../ui/interactionPrimitives.js";
import {
  bindEndConsultConfirmPositionSync,
  clearEndConsultConfirmPosition,
  syncEndConsultConfirmPosition
} from "../ui/consultConfirmPosition.js";
import { fillChatInput, sendChatInputMessage } from "./chatBindings.js";

let getConsultContext = () => ({ sessionId: "", view: "" });
let onConsultResolved = () => {};

export function configureConsultDialogBindings({ getContext, onResolved } = {}) {
  getConsultContext = typeof getContext === "function" ? getContext : getConsultContext;
  onConsultResolved = typeof onResolved === "function" ? onResolved : onConsultResolved;
}

export function openQuickReplyDialog() {
  openOverlay(".quick-reply-overlay", ".quick-reply-dialog__close");
}

function closeQuickReplyDialog() {
  closeOverlay(".quick-reply-overlay");
}

export function syncEndConsultTriggerState(record) {
  const enabled = canEndConsultation(record);
  document.querySelectorAll(".end-consult-trigger").forEach((button) => {
    if (button.classList.contains("consultation-complete-trigger")) return;
    button.disabled = !enabled;
    button.setAttribute("aria-disabled", String(!enabled));
    button.classList.remove("jh-btn--soft-danger", "jh-btn--danger");
    button.classList.add("jh-btn--success");
  });
  const submitted = Boolean(record?.prescriptionSubmitted);
  document.querySelectorAll(".jh-prescription-submit, .cancel-consult-trigger").forEach((button) => {
    button.disabled = submitted;
    button.setAttribute("aria-disabled", String(submitted));
  });
}

function setPrescriptionSubmittedControlsState(record) {
  syncEndConsultTriggerState(record);
}

export async function requestPrescriptionSubmit() {
  const context = getConsultContext();
  if (activePrescriptionHasMustWarnings(context)) {
    showToast("存在必须处理的用药风险，请点击高亮药品行查看具体提示并完成修改");
    return;
  }
  try {
    await submitPrescriptionForActiveConsultation(context);
    setPrescriptionSubmittedControlsState(getActiveConsultationRecord(context));
    showToast("处方已提交，可结束问诊");
  } catch {
    showToast("处方状态同步失败");
  }
}

export function openRiskWarningDialog({ revealInlineOnClose = false, syncRiskReview = true } = {}) {
  const overlay = document.querySelector(".risk-warning-overlay");
  if (!overlay) return;
  if (revealInlineOnClose) {
    overlay.dataset.revealInlineOnClose = "true";
  } else {
    delete overlay.dataset.revealInlineOnClose;
  }
  if (syncRiskReview) {
    openRiskReviewForActiveConsultation(getConsultContext())?.catch(() => {
      showToast("问诊状态同步失败");
    });
  }
  setOverlayOpen(overlay, true, { focusSelector: ".risk-warning-dialog__close" });
}

function closeRiskWarningDialog() {
  const overlay = document.querySelector(".risk-warning-overlay");
  if (!overlay) return;
  delete overlay.dataset.revealInlineOnClose;
  setOverlayOpen(overlay, false);
}

export function openConsultAttachmentDialog(button, event) {
  stopEvent(event);
  const overlay = document.querySelector(".consult-attachment-overlay");
  if (!overlay) return;
  markFollowUpVoucherViewed(button);
  markConsultAttachmentViewed(button);
  const index = button?.dataset.consultAttachmentIndex || "1";
  const total = button?.dataset.consultAttachmentTotal || "4";
  const title = button?.dataset.consultAttachmentTitle || `附件${index}`;
  const image = button?.dataset.consultAttachmentImage || "";
  const titleNode = overlay.querySelector("[data-consult-attachment-dialog-title]");
  const pagerNode = overlay.querySelector("[data-consult-attachment-dialog-pager]");
  const imageNode = overlay.querySelector(".consult-attachment-dialog__image");
  if (titleNode) titleNode.textContent = title;
  if (pagerNode) pagerNode.textContent = `${index}/${total}`;
  if (imageNode && image) {
    imageNode.src = image;
    imageNode.alt = title;
  }
  overlay.dataset.consultAttachmentIndex = index;
  setOverlayOpen(overlay, true, { focusSelector: ".consult-attachment-dialog__close" });
}

function markFollowUpVoucherViewed(button) {
  if (button?.dataset?.followupVoucherItem !== "true") return;
  button.dataset.followupVoucherStatus = "viewed";
  button.classList.remove("followup-voucher-item--unviewed");
  button.classList.add("followup-voucher-item--viewed");
  const label = button.getAttribute("aria-label") || "";
  button.setAttribute("aria-label", label.replace("未读病例附件：", "已读病例附件："));
}

function markConsultAttachmentViewed(button) {
  if (button?.dataset?.consultAttachmentStatus !== "unread") return;
  button.dataset.consultAttachmentStatus = "read";
  button.classList.remove("consult-attachment--unread");
  button.classList.add("consult-attachment--read");
  const title = button.dataset.consultAttachmentTitle || "附件";
  button.setAttribute("aria-label", `已读病例附件：预览${title}`);
}

function switchConsultAttachment(direction, event) {
  stopEvent(event);
  const overlay = document.querySelector(".consult-attachment-overlay");
  if (!overlay) return;
  const buttons = Array.from(document.querySelectorAll(".consult-attachment"));
  if (!buttons.length) return;
  const currentIndex = Number(overlay.dataset.consultAttachmentIndex || "1") - 1;
  const nextIndex = (currentIndex + direction + buttons.length) % buttons.length;
  openConsultAttachmentDialog(buttons[nextIndex]);
}

function closeConsultAttachmentDialog(event) {
  closeOverlay(".consult-attachment-overlay", event);
}

export function openConsultConfirmDialog(kind) {
  openOverlay(
    `.consult-confirm-overlay[data-confirm-kind="${kind}"]`,
    kind === "cancel" ? ".consult-cancel-reason.is-active:not([hidden])" : ".consult-confirm-submit"
  );
  if (kind === "end") {
    bindEndConsultConfirmPositionSync();
    window.requestAnimationFrame(() => {
      syncEndConsultConfirmPosition();
      window.requestAnimationFrame(syncEndConsultConfirmPosition);
    });
  } else {
    clearEndConsultConfirmPosition();
  }
}

function closeConsultConfirmDialog(kind) {
  closeOverlay(`.consult-confirm-overlay[data-confirm-kind="${kind}"]`);
}

async function copyRiskWarningMessage(button, event) {
  stopEvent(event);
  const text = button?.dataset.copyText || "";
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    showToast("已复制警示信息");
  } catch {
    showToast("复制失败");
  }
}

function closeAllConsultConfirmDialogs() {
  document.querySelectorAll(".consult-confirm-overlay.is-open").forEach((overlay) => {
    closeConsultConfirmDialog(overlay.dataset.confirmKind);
  });
}

async function handleConsultConfirm(kind) {
  closeConsultConfirmDialog(kind);
  let result = null;
  try {
    result = await resolveActiveConsultation(kind, getConsultContext());
  } catch {
    showToast("问诊状态同步失败");
    result = { message: kind === "cancel" ? "已取消问诊" : "问诊已结束", redirectHref: getRoomHref() };
  }
  onConsultResolved(result);
  showToast(result?.message || "问诊状态已更新");
  if (!result?.nextVideoRecord) {
    window.location.href = result?.redirectHref || getRoomHref();
  }
}

function bindCancelReasonDialog(overlay) {
  const reasonTypes = overlay.querySelectorAll(".consult-cancel-reason-type");
  const reasons = overlay.querySelectorAll(".consult-cancel-reason");
  const selectReason = (selectedReason) => {
    if (!selectedReason) return;
    reasons.forEach((reason) => {
      const selected = reason === selectedReason;
      reason.classList.toggle("is-active", selected);
      reason.setAttribute("aria-pressed", String(selected));
    });
    overlay.dataset.selectedCancelReason = selectedReason.dataset.cancelReason || selectedReason.textContent.trim();
  };

  selectReason(overlay.querySelector(".consult-cancel-reason.is-active:not([hidden])"));

  reasonTypes.forEach((type) => {
    type.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const group = type.dataset.cancelReasonType;
      reasonTypes.forEach((node) => {
        const selected = node === type;
        node.classList.toggle("is-active", selected);
        node.setAttribute("aria-pressed", String(selected));
      });
      let firstVisibleReason = null;
      reasons.forEach((reason) => {
        const visible = reason.dataset.cancelReasonGroup === group;
        reason.hidden = !visible;
        if (visible && !firstVisibleReason) firstVisibleReason = reason;
      });
      if (firstVisibleReason) {
        selectReason(firstVisibleReason);
      }
    });
  });

  reasons.forEach((reason) => {
    reason.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      selectReason(reason);
    });
  });
}

export function bindConsultConfirmDialogs() {
  document.querySelectorAll(".consult-confirm-overlay").forEach((overlay) => {
    if (overlay.dataset.confirmBound === "true") return;
    overlay.dataset.confirmBound = "true";
    const kind = overlay.dataset.confirmKind;
    if (kind === "cancel") {
      bindCancelReasonDialog(overlay);
    }
    overlay.querySelector(".consult-confirm-dialog__close")?.addEventListener("click", () => {
      closeConsultConfirmDialog(kind);
    });
    overlay.querySelector(".consult-confirm-dismiss")?.addEventListener("click", () => {
      closeConsultConfirmDialog(kind);
    });
    const submitConfirm = (event) => {
      event.preventDefault();
      event.stopPropagation();
      handleConsultConfirm(kind);
    };
    overlay.querySelector(".consult-confirm-submit")?.addEventListener("pointerdown", (event) => {
      event.stopPropagation();
    });
    overlay.querySelector(".consult-confirm-submit")?.addEventListener("click", submitConfirm);
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) {
        closeConsultConfirmDialog(kind);
      }
    });
    overlay.querySelector(".consult-confirm-dialog")?.addEventListener("click", (event) => {
      event.stopPropagation();
    });
  });
}

function bindQuickReplyOverlay() {
  const quickReplyOverlay = document.querySelector(".quick-reply-overlay");
  if (!quickReplyOverlay) return;
  let closeQuickReplyTimer = 0;

  bindOverlayDismiss(quickReplyOverlay, {
    close: closeQuickReplyDialog,
    closeSelector: ".quick-reply-dialog__close"
  });

  quickReplyOverlay.querySelectorAll(".quick-reply-category").forEach((category) => {
    category.addEventListener("click", () => {
      quickReplyOverlay
        .querySelectorAll(".quick-reply-category")
        .forEach((node) => node.classList.remove("is-active"));
      category.classList.add("is-active");
    });
  });

  const applyQuickReplyMessage = (message, event, { send = false } = {}) => {
    event?.preventDefault();
    event?.stopPropagation();
    const didFill = fillChatInput(message.textContent);
    if (send && didFill) {
      window.clearTimeout(closeQuickReplyTimer);
      sendChatInputMessage(document.querySelector(".jh-chat-input textarea"));
      window.setTimeout(closeQuickReplyDialog, 120);
    } else if (didFill) {
      window.clearTimeout(closeQuickReplyTimer);
      closeQuickReplyTimer = window.setTimeout(closeQuickReplyDialog, 360);
    }
  };

  quickReplyOverlay.querySelectorAll(".quick-reply-message").forEach((message) => {
    message.addEventListener("pointerdown", (event) => {
      const now = Date.now();
      const lastPointerAt = Number(message.dataset.lastPointerAt || 0);
      const shouldSend = now - lastPointerAt <= 320;
      message.dataset.lastPointerAt = shouldSend ? "0" : String(now);
      applyQuickReplyMessage(message, event, { send: shouldSend });
    });
    message.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
    });
  });
}

function bindRiskWarningOverlay() {
  const riskWarningOverlay = document.querySelector(".risk-warning-overlay");
  if (!riskWarningOverlay) return;
  bindOverlayDismiss(riskWarningOverlay, {
    close: closeRiskWarningDialog,
    closeSelector: ".risk-warning-dialog__close"
  });
  riskWarningOverlay.querySelectorAll(".risk-warning-message-item[data-copy-text]").forEach((button) => {
    if (button.dataset.copyBound === "true") return;
    button.dataset.copyBound = "true";
    button.addEventListener("click", (event) => copyRiskWarningMessage(button, event));
  });
}

function bindConsultAttachmentOverlay() {
  const consultAttachmentOverlay = document.querySelector(".consult-attachment-overlay");
  if (!consultAttachmentOverlay) return;
  bindOverlayDismiss(consultAttachmentOverlay, {
    close: closeConsultAttachmentDialog,
    closeSelector: ".consult-attachment-dialog__close",
    dialogSelector: ".consult-attachment-dialog"
  });
  consultAttachmentOverlay.querySelector(".consult-attachment-dialog__page--prev")?.addEventListener("click", (event) => {
    switchConsultAttachment(-1, event);
  });
  consultAttachmentOverlay.querySelector(".consult-attachment-dialog__page--next")?.addEventListener("click", (event) => {
    switchConsultAttachment(1, event);
  });
}

export function bindConsultDialogOverlays() {
  bindQuickReplyOverlay();
  bindRiskWarningOverlay();
  bindConsultAttachmentOverlay();
}

export function closeConsultDialogOverlays(event) {
  closeQuickReplyDialog();
  closeRiskWarningDialog();
  closeConsultAttachmentDialog(event);
  closeAllConsultConfirmDialogs();
}
