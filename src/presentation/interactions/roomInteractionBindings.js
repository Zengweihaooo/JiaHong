import { appView, getHistoryHref, getRoomHref, getSessionIdParam, getTextHref, getVideoHref } from "../../shared/core.js";
import {
  activateVideoConsultation,
  getConsultationRecordById,
  getFirstEndedConsultationRecord,
  syncWaitingQueueToMessages
} from "../../application/controllers/consultationController.js";
import { rememberMessageBadgeDismissed } from "../../application/controllers/chatController.js";
import { getConsultMainElement, isConsultReadonlyView, setConsultShellReadonly } from "../ui/dom.js";
import { showToast } from "../ui/interactionPrimitives.js";
import { renderTextMain, renderVideoMain } from "../views/consultRoomView.js?v=20260604-03";
import { renderPrescriptionTraceMain } from "../views/historyView.js?v=20260528-06";
import { renderMessageList } from "../views/roomMessageListView.js?v=20260602-03";
import { renderRoomMain } from "../views/roomShellView.js?v=20260528-06";
import { bindChatMessageMenu } from "./chatBindings.js";
import { bindConsultConfirmDialogs } from "./consultDialogBindings.js?v=20260604-01";
import { setServiceTileState } from "./runtimeUiBindings.js?v=20260528-06";

const videoConsultationLockedMessage = "请先结束当前视频问诊，再进入新的视频问诊";

let bindConsultWorkspace = () => {};
let startOngoingTimers = () => {};
let stopOngoingTimers = () => {};
const collapsedMessageGroups = new Set();

export function configureRoomInteractionBindings({ bindWorkspace, startTimers, stopTimers } = {}) {
  bindConsultWorkspace = typeof bindWorkspace === "function" ? bindWorkspace : bindConsultWorkspace;
  startOngoingTimers = typeof startTimers === "function" ? startTimers : startOngoingTimers;
  stopOngoingTimers = typeof stopTimers === "function" ? stopTimers : stopOngoingTimers;
}

function getRoomFilters() {
  const messageList = document.querySelector(".message-list");
  return {
    type: messageList?.dataset.filterType || "all",
    state: messageList?.dataset.filterState || "ongoing"
  };
}

export function updateRoomMessageList({ activeRecord = "" } = {}) {
  const messageList = document.querySelector(".message-list");
  syncWaitingQueueToMessages();
  if (!messageList) return;
  const filters = getRoomFilters();
  const activeId = activeRecord || document.querySelector(".message-item.is-active")?.dataset.recordId || "";
  messageList.innerHTML = renderMessageList({ ...filters, activeRecord: activeId });
  bindMessageGroupToggles();
  applyMessageGroupCollapseState(messageList);
  bindMessageItems();
}

export function handleConsultResolved(result = {}) {
  const nextVideoRecord = result?.nextVideoRecord;
  updateRoomMessageList({ activeRecord: nextVideoRecord?.id || "" });
  if (!nextVideoRecord?.id) return;
  if (!openConsultationInCurrentPage(nextVideoRecord, "video")) {
    window.location.href = getVideoHref(nextVideoRecord.id);
  }
}

function restoreOngoingMain() {
  const main = getConsultMainElement();
  if (!main) return;
  if (appView === "text") {
    main.outerHTML = renderTextMain();
  } else if (appView === "video") {
    main.outerHTML = renderVideoMain();
  } else {
    main.outerHTML = renderRoomMain();
  }
}

function showPrescriptionTrace(record) {
  const main = getConsultMainElement();
  if (!main) return;
  stopOngoingTimers();
  main.outerHTML = renderPrescriptionTraceMain(record);
  setConsultShellReadonly(true);
  bindPrescriptionTraceCards();
}

function handleMessageItemClick(item) {
  if (item.dataset.videoLocked === "true" || item.getAttribute("aria-disabled") === "true") {
    showToast(videoConsultationLockedMessage, { tone: "warning", duration: 3200 });
    return;
  }
  if (item.dataset.badgeKey) {
    rememberMessageBadgeDismissed(item.dataset.badgeKey);
  }
  item.querySelector(".message-item__badge")?.remove();
  const messageList = item.closest(".message-list");
  messageList?.querySelectorAll(".message-item").forEach((node) => node.classList.remove("is-active"));
  item.classList.add("is-active");
  const record = getConsultationRecordById(item.dataset.recordId);
  if (record?.state === "ended") {
    showPrescriptionTrace(record);
    return;
  }

  setConsultShellReadonly(false);

  if (isConsultReadonlyView() && (appView === "text" || appView === "video") && record?.id === getSessionIdParam()) {
    restoreOngoingMain();
    bindConsultWorkspace();
    startOngoingTimers();
    return;
  }

  const targetView = item.dataset.targetView || (record?.type === "video" ? "video" : record ? "text" : "");
  if (targetView === "video") {
    if (record?.id) {
      activateVideoConsultation(record.id);
    }
    if (!openConsultationInCurrentPage(record, "video")) {
      window.location.href = getVideoHref(record?.id);
    }
  } else if (targetView === "text") {
    if (!openConsultationInCurrentPage(record, "text")) {
      window.location.href = getTextHref(record?.id);
    }
  }
}

function updateConsultRoute(targetView, sessionId) {
  const href = targetView === "video" ? getVideoHref(sessionId) : getTextHref(sessionId);
  const nextUrl = new URL(href, window.location.href);
  if (nextUrl.href !== window.location.href) {
    window.history.pushState({ view: targetView, sessionId }, "", nextUrl);
  }
}

function setConsultPageMode(targetView) {
  document.title = targetView === "video" ? "嘉虹健康视频问诊" : "嘉虹健康图文问诊";
  document.body.classList.remove("page-view-room", "page-view-text", "page-view-video", "page-view-history");
  document.body.classList.add(`page-view-${targetView}`);
  const shell = document.querySelector(".app-shell");
  if (!shell) return;
  shell.classList.add("room-shell", "consult-shell", "text-shell");
  shell.classList.toggle("video-shell", targetView === "video");
  shell.classList.remove("history-shell");
}

function openConsultationInCurrentPage(record, targetView) {
  if (!record?.id || !document.querySelector(".room-shell")) return false;
  const main = getConsultMainElement();
  if (!main) return false;

  updateConsultRoute(targetView, record.id);
  setConsultPageMode(targetView);
  setConsultShellReadonly(false);
  main.outerHTML = targetView === "video" ? renderVideoMain() : renderTextMain();
  bindConsultWorkspace();
  bindChatMessageMenu();
  bindConsultConfirmDialogs();
  startOngoingTimers();
  return true;
}

export function bindMessageItems() {
  document.querySelectorAll(".message-item").forEach((item) => {
    if (item.dataset.bound === "true") return;
    item.dataset.bound = "true";
    item.addEventListener("click", () => handleMessageItemClick(item));
    item.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      handleMessageItemClick(item);
    });
  });
}

function setMessageGroupCollapsed(toggle, collapsed, { persist = true } = {}) {
  const group = toggle.dataset.messageGroup;
  if (persist && group) {
    if (collapsed) {
      collapsedMessageGroups.add(group);
    } else {
      collapsedMessageGroups.delete(group);
    }
  }
  toggle.setAttribute("aria-expanded", String(!collapsed));
  toggle.classList.toggle("is-collapsed", collapsed);
  let node = toggle.nextElementSibling;
  while (node && !node.classList.contains("message-group-label")) {
    if (node.classList.contains("message-item")) {
      node.hidden = collapsed;
    }
    node = node.nextElementSibling;
  }
}

function applyMessageGroupCollapseState(root = document) {
  root.querySelectorAll(".message-group-toggle").forEach((toggle) => {
    setMessageGroupCollapsed(toggle, collapsedMessageGroups.has(toggle.dataset.messageGroup), { persist: false });
  });
}

function bindMessageGroupToggles() {
  document.querySelectorAll(".message-group-toggle").forEach((toggle) => {
    if (toggle.dataset.bound === "true") return;
    toggle.dataset.bound = "true";
    toggle.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const collapsed = toggle.getAttribute("aria-expanded") === "true";
      setMessageGroupCollapsed(toggle, collapsed);
    });
  });
  document.querySelectorAll(".message-list").forEach((messageList) => {
    applyMessageGroupCollapseState(messageList);
  });
}

export function bindPrescriptionTraceCards() {
  document.querySelectorAll(".prescription-history-open").forEach((button) => {
    if (button.dataset.bound === "true") return;
    button.dataset.bound = "true";
    button.addEventListener("click", () => {
      const recordId = document.querySelector(".message-item.is-active")?.dataset.recordId;
      window.location.href = getHistoryHref(recordId);
    });
  });
}

function bindRoomRefresh() {
  const roomRefresh = document.querySelector(".room-refresh");
  if (roomRefresh) {
    roomRefresh.addEventListener("click", () => {
      window.location.href = getTextHref();
    });
  }
}

function bindRoomFilters() {
  document.querySelectorAll(".room-tag").forEach((tag) => {
    tag.addEventListener("click", () => {
      const group = tag.closest(".room-tags");
      group.querySelectorAll(".room-tag").forEach((node) => node.classList.remove("is-active"));
      tag.classList.add("is-active");
      const messageList = document.querySelector(".message-list");
      if (!messageList) return;
      if (tag.dataset.filterType) {
        messageList.dataset.filterType = tag.dataset.filterType;
      }
      if (tag.dataset.filterState) {
        messageList.dataset.filterState = tag.dataset.filterState;
      }
      updateRoomMessageList();
      const filters = getRoomFilters();
      if (filters.state === "ended") {
        const firstEnded = getFirstEndedConsultationRecord({ type: filters.type });
        if (firstEnded) {
          showPrescriptionTrace(firstEnded);
          document.querySelector(`.message-item[data-record-id="${firstEnded.id}"]`)?.classList.add("is-active");
        }
      } else if (filters.state === "ongoing") {
        setConsultShellReadonly(false);
        if (isConsultReadonlyView()) {
          restoreOngoingMain();
          bindConsultWorkspace();
          startOngoingTimers();
        }
      }
    });
  });
}

function bindRoomServiceSwitches() {
  document.querySelectorAll(".room-service-check").forEach((button) => {
    button.addEventListener("click", () => {
      const enabled = button.getAttribute("aria-checked") === "true";
      setServiceTileState(button, !enabled);
    });
  });
}

function bindHistoryBackButtons() {
  document.querySelectorAll(".history-back").forEach((button) => {
    button.addEventListener("click", () => {
      window.location.href = getRoomHref();
    });
  });
}

export function bindRoomInteractions() {
  bindRoomRefresh();
  bindRoomFilters();
  bindRoomServiceSwitches();
  bindMessageGroupToggles();
  bindMessageItems();
  bindPrescriptionTraceCards();
  bindHistoryBackButtons();
}
