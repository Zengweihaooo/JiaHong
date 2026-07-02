const END_CONFIRM_GAP = 12;

function getEndConsultTrigger() {
  return (
    document.querySelector(
      ".prescription-panel .end-consult-trigger:not(.consultation-complete-trigger):not(:disabled)"
    ) ||
    document.querySelector(".prescription-panel .end-consult-trigger:not(.consultation-complete-trigger)") ||
    document.querySelector(".prescription-panel .end-consult-trigger")
  );
}

export function syncEndConsultConfirmPosition() {
  const overlay = document.querySelector('.consult-confirm-overlay[data-confirm-kind="end"].is-open');
  const trigger = getEndConsultTrigger();
  const dialog = overlay?.querySelector(".consult-confirm-dialog");
  const submitBtn = dialog?.querySelector(".consult-confirm-submit");
  if (!overlay || !trigger || !dialog || !submitBtn) return;

  overlay.style.removeProperty("--consult-confirm-end-right");
  overlay.style.removeProperty("--consult-confirm-end-bottom");

  const triggerRect = trigger.getBoundingClientRect();
  const submitRect = submitBtn.getBoundingClientRect();
  const dialogRect = dialog.getBoundingClientRect();
  const submitInsetFromDialogRight = dialogRect.right - submitRect.right;
  const submitBottomFromDialogBottom = dialogRect.bottom - submitRect.bottom;
  const right = window.innerWidth - triggerRect.right - submitInsetFromDialogRight;
  const bottom =
    window.innerHeight - triggerRect.top + END_CONFIRM_GAP - submitBottomFromDialogBottom;

  overlay.style.setProperty("--consult-confirm-end-right", `${Math.max(16, right)}px`);
  overlay.style.setProperty("--consult-confirm-end-bottom", `${Math.max(16, bottom)}px`);
}

export function clearEndConsultConfirmPosition() {
  const overlay = document.querySelector('.consult-confirm-overlay[data-confirm-kind="end"]');
  overlay?.style.removeProperty("--consult-confirm-end-right");
  overlay?.style.removeProperty("--consult-confirm-end-bottom");
}

export function bindEndConsultConfirmPositionSync() {
  if (bindEndConsultConfirmPositionSync.bound) return;
  bindEndConsultConfirmPositionSync.bound = true;
  window.addEventListener("resize", syncEndConsultConfirmPosition);
}
