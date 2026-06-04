import { appView, getRoomHref } from "../../shared/core.js";
import { getAnnouncementById, markAnnouncementRead } from "../../application/controllers/contentController.js";
import { clearWaitingQueueState } from "../../application/controllers/runtimeController.js?v=20260528-06";
import {
  bindOverlayDismiss,
  closeOverlay,
  openOverlay,
  setOverlayOpen,
  showToast,
  stopEvent
} from "../ui/interactionPrimitives.js";
import { applyRuntimeStateToDom } from "./runtimeUiBindings.js?v=20260528-06";
import { bindQuickEntryInteractions, closeQuickEntryDialog, closeQuickSchedulePanel } from "./homeQuickEntryBindings.js?v=20260604-01";

function setReadTagState(tag, read) {
  if (!tag) return;
  tag.classList.toggle("jh-read-tag--unread", !read);
  tag.classList.toggle("jh-read-tag--read", read);
  tag.textContent = read ? "已读" : "未读";
}

function syncAnnouncementReadState(announcementId) {
  const latestTrigger = document.querySelector(".announcement__detail-trigger");
  const isLatestAnnouncement = latestTrigger?.dataset.announcementId === announcementId;
  if (isLatestAnnouncement) {
    const noticeCard = document.querySelector(".notice-card");
    noticeCard?.classList.remove("notice-card--unread");
    noticeCard?.querySelector(".notice-card__unread-dot")?.remove();
    setReadTagState(noticeCard?.querySelector(".announcement-tag"), true);
  }

  const listItem = Array.from(document.querySelectorAll(".announcement-list-item"))
    .find((item) => item.dataset.announcementId === announcementId);
  listItem?.querySelector(".announcement-list-item__unread-dot")?.remove();
  setReadTagState(listItem?.querySelector(".announcement-list-item__tag"), true);
}

function openAnnouncementDialog(event) {
  stopEvent(event);
  const overlay = document.querySelector(".announcement-overlay");
  if (!overlay) return;
  const announcementId =
    event?.currentTarget?.dataset?.announcementId || event?.target?.closest("[data-announcement-id]")?.dataset?.announcementId;
  const announcement = getAnnouncementById(announcementId);
  overlay.querySelector(".announcement-dialog__meta h3").textContent = announcement.title;
  overlay.querySelector(".announcement-dialog__meta span").textContent = announcement.date;
  overlay.querySelector(".announcement-dialog__body p").textContent = announcement.content;
  overlay.querySelector(".announcement-dialog__publisher").textContent = announcement.publisher;
  markAnnouncementRead(announcement.id);
  syncAnnouncementReadState(announcement.id);
  setOverlayOpen(overlay, true, { focusSelector: ".announcement-dialog__close" });
}

function closeAnnouncementDialog(event) {
  closeOverlay(".announcement-overlay", event);
}

function openAnnouncementListDialog(event) {
  openOverlay(".announcement-list-overlay", ".announcement-list-dialog__close", event);
}

function closeAnnouncementListDialog(event) {
  closeOverlay(".announcement-list-overlay", event);
}

function bindAnnouncementDialogs() {
  const announcementOverlay = document.querySelector(".announcement-overlay");
  const announcementListOverlay = document.querySelector(".announcement-list-overlay");
  document.querySelectorAll(".announcement__detail-trigger").forEach((button) => {
    button.addEventListener("click", openAnnouncementDialog);
  });
  document.querySelectorAll(".announcement-list-trigger").forEach((button) => {
    button.addEventListener("click", openAnnouncementListDialog);
  });

  if (announcementOverlay) {
    bindOverlayDismiss(announcementOverlay, {
      close: closeAnnouncementDialog,
      closeSelector: ".announcement-dialog__close",
      dialogSelector: ".announcement-dialog"
    });
  }

  if (announcementListOverlay) {
    bindOverlayDismiss(announcementListOverlay, {
      close: closeAnnouncementListDialog,
      closeSelector: ".announcement-list-dialog__close",
      dialogSelector: ".announcement-list-dialog"
    });
    announcementListOverlay.querySelectorAll(".announcement-list-item").forEach((item) => {
      item.addEventListener("click", (event) => {
        closeAnnouncementListDialog(event);
        openAnnouncementDialog(event);
      });
    });
  }
}

function bindConsultCard() {
  const consultCard = document.querySelector(".consult-card");
  if (!consultCard) return;
  const setSelected = (selected) => {
    consultCard.classList.toggle("is-selected", selected);
  };
  consultCard.addEventListener("pointerdown", () => setSelected(true));
  consultCard.addEventListener("pointerup", () => setSelected(false));
  consultCard.addEventListener("pointercancel", () => setSelected(false));
  consultCard.addEventListener("pointerleave", () => setSelected(false));
  consultCard.addEventListener("blur", () => setSelected(false));
  consultCard.addEventListener("click", () => {
    window.location.href = getRoomHref();
  });
}

function isTextEntryTarget(target) {
  return Boolean(target?.closest?.("input, textarea, select, [contenteditable='true']"));
}

function bindWaitingQueueShortcut() {
  if (bindWaitingQueueShortcut.bound || appView !== "home") return;
  bindWaitingQueueShortcut.bound = true;
  document.addEventListener("keydown", (event) => {
    if (event.key !== "9" || event.isComposing || event.metaKey || event.ctrlKey || event.altKey || isTextEntryTarget(event.target)) {
      return;
    }
    event.preventDefault();
    clearWaitingQueueState();
    applyRuntimeStateToDom();
    showToast("候诊室已清零，30秒后恢复新增", { tone: "info", placement: "home-status" });
  });
}

export function bindHomeInteractions() {
  bindAnnouncementDialogs();
  bindConsultCard();
  bindWaitingQueueShortcut();
  bindQuickEntryInteractions();
}

export function closeHomeOverlays(event) {
  closeAnnouncementDialog(event);
  closeAnnouncementListDialog(event);
  closeQuickEntryDialog(event);
  closeQuickSchedulePanel(event);
}
