import { appView, getHistoryHref, getRoomHref, getTextHref, getVideoHref } from "./core.js";
import {
  getRealtimeSnapshot,
  updateConsultationStatus,
  updateDoctorStatus,
  updateServiceAvailability
} from "./api/mockApi.js";
import { addConsultationRecord, announcements, consultationRecords, latestAnnouncement, quickEntryOptions, updateConsultationRecordState } from "./data.js";
import { consultationEvents } from "./domain/consultationStateMachine.js";
import {
  doctorStatusState,
  clearActiveVideoConsultation,
  rememberDismissedMessageBadge,
  registerConsultationMachine,
  sendConsultationEvent,
  serviceState,
  setActiveVideoConsultation,
  setDoctorStatus,
  setWaitingQueue,
  subscribeRuntimeState,
  waitingQueueState
} from "./state.js";
import { findOngoingChatMessage, formatDuration, getActiveChatKey, getConsultMainElement, getDoctorStatusLabel, icons, isConsultReadonlyView, renderMessageList, renderPrescriptionPanel, renderPrescriptionTraceMain, renderRoomMain, renderTextMain, renderVideoMain, renderVideoMediaIcon, refreshChatThread, setConsultShellReadonly, videoMediaState } from "./render.js";

const diagnosisSuggestionPool = [
  "急性咽炎",
  "过敏性鼻炎",
  "慢性胃炎",
  "急性支气管炎",
  "原发性高血压",
  "湿疹",
  "咳嗽咳痰",
  "反酸",
  "皮肤瘙痒",
  "复诊续方"
];

const medicineSuggestionPool = [
  {
    name: "蒲地蓝消炎口服液",
    type: "处方药",
    spec: "10ml*10支",
    usage: "口服",
    frequency: "3次/日",
    dose: "10ml",
    quantity: "1",
    unit: "盒",
    risk: "低"
  },
  {
    name: "氯雷他定片",
    type: "处方药",
    spec: "10mg*6片",
    usage: "口服",
    frequency: "1次/日",
    dose: "10mg",
    quantity: "1",
    unit: "盒",
    risk: "低"
  },
  {
    name: "奥美拉唑肠溶胶囊",
    type: "处方药",
    spec: "20mg*14粒",
    usage: "口服",
    frequency: "1次/日",
    dose: "20mg",
    quantity: "1",
    unit: "盒",
    risk: "低"
  },
  {
    name: "盐酸氨溴索片",
    type: "处方药",
    spec: "30mg*20片",
    usage: "口服",
    frequency: "3次/日",
    dose: "30mg",
    quantity: "1",
    unit: "盒",
    risk: "低"
  },
  {
    name: "苯磺酸氨氯地平片",
    type: "处方药",
    spec: "5mg*14片",
    usage: "口服",
    frequency: "1次/日",
    dose: "5mg",
    quantity: "2",
    unit: "盒",
    risk: "中"
  },
  {
    name: "糠酸莫米松乳膏",
    type: "处方药",
    spec: "10g:10mg",
    usage: "外用",
    frequency: "1次/日",
    dose: "薄涂患处",
    quantity: "1",
    unit: "支",
    risk: "中"
  }
];

function showToast(message) {
  const toast = document.querySelector(".toast");
  window.clearTimeout(showToast.timer);
  toast.textContent = message;
  toast.classList.add("is-visible");
  showToast.timer = window.setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 1500);
}

function setServiceTileState(tile, enabled, { sync = true } = {}) {
  const serviceKey = tile.dataset.serviceKey;
  if (serviceKey) {
    serviceState[serviceKey] = enabled;
    if (sync) updateServiceAvailability(serviceKey, enabled).catch(() => {
      showToast("服务状态同步失败");
    });
  }
  tile.setAttribute("aria-checked", String(enabled));
  tile.classList.toggle("is-selected", enabled);
  if (serviceKey) applyServiceStateToDom(serviceKey, enabled);
}

function applyServiceStateToDom(serviceKey, enabled) {
  document.querySelectorAll(`[data-service-key="${serviceKey}"]`).forEach((node) => {
    node.setAttribute("aria-checked", String(enabled));
    node.classList.toggle("is-selected", enabled);
  });
}

function applyRuntimeStateToDom() {
  const status = doctorStatusState.status;
  const statusLabel = getDoctorStatusLabel(status);

  document.querySelectorAll("[data-status-text]").forEach((node) => {
    node.textContent = statusLabel;
    node.classList.remove("jh-status-badge--online", "jh-status-badge--busy", "jh-status-badge--offline");
    node.classList.add(`jh-status-badge--${status}`);
  });

  document.querySelectorAll(".room-status").forEach((button) => {
    button.setAttribute("aria-label", `出诊状态：${statusLabel}`);
  });

  document.querySelectorAll(".jh-switch").forEach((button) => {
    const enabled = status !== "offline";
    button.classList.toggle("is-on", enabled);
    button.setAttribute("aria-pressed", String(enabled));
  });

  document.querySelectorAll("[data-waiting-total]").forEach((node) => {
    node.textContent = String(waitingQueueState.total);
  });
  document.querySelectorAll("[data-waiting-type]").forEach((node) => {
    node.textContent = String(waitingQueueState.byType[node.dataset.waitingType] ?? 0);
  });

  Object.entries(serviceState).forEach(([serviceKey, enabled]) => {
    applyServiceStateToDom(serviceKey, enabled);
  });
}

function changeDoctorStatus(nextStatus, { sync = true } = {}) {
  setDoctorStatus(nextStatus);
  if (sync) {
    updateDoctorStatus(nextStatus).catch(() => {
      showToast("出诊状态同步失败");
    });
  }
}

function cycleDoctorStatus() {
  const order = ["online", "busy", "offline"];
  const currentIndex = Math.max(0, order.indexOf(doctorStatusState.status));
  return order[(currentIndex + 1) % order.length];
}

function openQuickReplyDialog() {
  const overlay = document.querySelector(".quick-reply-overlay");
  if (!overlay) return;
  overlay.classList.add("is-open");
  overlay.setAttribute("aria-hidden", "false");
  overlay.querySelector(".quick-reply-dialog__close")?.focus();
}

function closeQuickReplyDialog() {
  const overlay = document.querySelector(".quick-reply-overlay");
  if (!overlay) return;
  overlay.classList.remove("is-open");
  overlay.setAttribute("aria-hidden", "true");
}

function enableEndConsultButton() {
  document.querySelectorAll(".end-consult-trigger").forEach((button) => {
    button.disabled = false;
    button.classList.remove("jh-btn--soft-danger");
    button.classList.add("jh-btn--danger");
  });
}

function openRiskWarningDialog() {
  const overlay = document.querySelector(".risk-warning-overlay");
  if (!overlay) return;
  const recordId = getActiveOngoingRecordId();
  if (recordId) {
    sendConsultationEvent(recordId, consultationEvents.OPEN_RISK_REVIEW);
    updateConsultationStatus(recordId, consultationEvents.OPEN_RISK_REVIEW).catch(() => {
      showToast("问诊状态同步失败");
    });
  }
  overlay.classList.add("is-open");
  overlay.setAttribute("aria-hidden", "false");
  overlay.querySelector(".risk-warning-dialog__close")?.focus();
}

function closeRiskWarningDialog() {
  const overlay = document.querySelector(".risk-warning-overlay");
  if (!overlay) return;
  const wasOpen = overlay.classList.contains("is-open");
  overlay.classList.remove("is-open");
  overlay.setAttribute("aria-hidden", "true");
  if (wasOpen) {
    const recordId = getActiveOngoingRecordId();
    if (recordId) {
      sendConsultationEvent(recordId, consultationEvents.SUBMIT_PRESCRIPTION);
      updateConsultationStatus(recordId, consultationEvents.SUBMIT_PRESCRIPTION).catch(() => {
        showToast("处方状态同步失败");
      });
    }
    enableEndConsultButton();
  }
}

function openConsultConfirmDialog(kind) {
  const overlay = document.querySelector(`.consult-confirm-overlay[data-confirm-kind="${kind}"]`);
  if (!overlay) return;
  overlay.classList.add("is-open");
  overlay.setAttribute("aria-hidden", "false");
  overlay.querySelector(".consult-confirm-submit")?.focus();
}

function closeConsultConfirmDialog(kind) {
  const overlay = document.querySelector(`.consult-confirm-overlay[data-confirm-kind="${kind}"]`);
  if (!overlay) return;
  overlay.classList.remove("is-open");
  overlay.setAttribute("aria-hidden", "true");
}

function closeAllConsultConfirmDialogs() {
  document.querySelectorAll(".consult-confirm-overlay.is-open").forEach((overlay) => {
    closeConsultConfirmDialog(overlay.dataset.confirmKind);
  });
}

function handleConsultConfirm(kind) {
  closeConsultConfirmDialog(kind);
  const recordId = getActiveOngoingRecordId();
  const record = consultationRecords.find((entry) => entry.id === recordId);
  if (kind === "cancel") {
    if (recordId) {
      sendConsultationEvent(recordId, consultationEvents.CANCEL);
      updateConsultationRecordState(recordId, "cancelled");
      if (record?.type === "video") {
        clearActiveVideoConsultation(recordId);
      }
      updateRoomMessageList();
      updateConsultationStatus(recordId, consultationEvents.CANCEL).catch(() => {
        showToast("问诊状态同步失败");
      });
    }
    showToast("已取消问诊");
    window.location.href = getRoomHref();
    return;
  }
  if (recordId) {
    sendConsultationEvent(recordId, consultationEvents.END);
    updateConsultationRecordState(recordId, "ended");
    if (record?.type === "video") {
      clearActiveVideoConsultation(recordId);
    }
    updateRoomMessageList();
    updateConsultationStatus(recordId, consultationEvents.END).catch(() => {
      showToast("问诊状态同步失败");
    });
  }
  showToast("问诊已结束");
}

function bindConsultConfirmDialogs() {
  if (bindConsultConfirmDialogs.bound) return;
  bindConsultConfirmDialogs.bound = true;

  document.querySelectorAll(".consult-confirm-overlay").forEach((overlay) => {
    const kind = overlay.dataset.confirmKind;
    overlay.querySelector(".consult-confirm-dialog__close")?.addEventListener("click", () => {
      closeConsultConfirmDialog(kind);
    });
    overlay.querySelector(".consult-confirm-dismiss")?.addEventListener("click", () => {
      closeConsultConfirmDialog(kind);
    });
    overlay.querySelector(".consult-confirm-submit")?.addEventListener("click", () => {
      handleConsultConfirm(kind);
    });
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

function openAnnouncementDialog(event) {
  event?.preventDefault();
  event?.stopPropagation();
  const overlay = document.querySelector(".announcement-overlay");
  if (!overlay) return;
  const announcementId =
    event?.currentTarget?.dataset?.announcementId || event?.target?.closest("[data-announcement-id]")?.dataset?.announcementId;
  const announcement = announcements.find((item) => item.id === announcementId) || latestAnnouncement;
  overlay.querySelector(".announcement-dialog__meta h3").textContent = announcement.title;
  overlay.querySelector(".announcement-dialog__meta span").textContent = announcement.date;
  overlay.querySelector(".announcement-dialog__body p").textContent = announcement.content;
  overlay.querySelector(".announcement-dialog__publisher").textContent = announcement.publisher;
  overlay.classList.add("is-open");
  overlay.setAttribute("aria-hidden", "false");
  overlay.querySelector(".announcement-dialog__close")?.focus();
}

function closeAnnouncementDialog(event) {
  event?.preventDefault();
  event?.stopPropagation();
  const overlay = document.querySelector(".announcement-overlay");
  if (!overlay) return;
  overlay.classList.remove("is-open");
  overlay.setAttribute("aria-hidden", "true");
}

function openAnnouncementListDialog(event) {
  event?.preventDefault();
  event?.stopPropagation();
  const overlay = document.querySelector(".announcement-list-overlay");
  if (!overlay) return;
  overlay.classList.add("is-open");
  overlay.setAttribute("aria-hidden", "false");
  overlay.querySelector(".announcement-list-dialog__close")?.focus();
}

function closeAnnouncementListDialog(event) {
  event?.preventDefault();
  event?.stopPropagation();
  const overlay = document.querySelector(".announcement-list-overlay");
  if (!overlay) return;
  overlay.classList.remove("is-open");
  overlay.setAttribute("aria-hidden", "true");
}

function openQuickEntryDialog(event) {
  event?.preventDefault();
  event?.stopPropagation();
  const overlay = document.querySelector(".quick-entry-overlay");
  if (!overlay) return;
  overlay.classList.add("is-open");
  overlay.setAttribute("aria-hidden", "false");
  overlay.querySelector(".quick-entry-dialog__close")?.focus();
}

function closeQuickEntryDialog(event) {
  event?.preventDefault();
  event?.stopPropagation();
  const overlay = document.querySelector(".quick-entry-overlay");
  if (!overlay) return;
  overlay.classList.remove("is-open");
  overlay.setAttribute("aria-hidden", "true");
}

function toggleUserMenu(trigger, forceOpen) {
  const menu = trigger.closest(".user-chip, .room-user")?.querySelector(".user-menu");
  if (!menu) return;
  const isOpen = menu.classList.contains("is-open");
  const nextOpen = typeof forceOpen === "boolean" ? forceOpen : !isOpen;
  document.querySelectorAll(".user-menu.is-open").forEach((node) => {
    if (node !== menu) {
      node.classList.remove("is-open");
      node.setAttribute("aria-hidden", "true");
      node.closest(".user-chip, .room-user")?.querySelector(".user-menu-trigger")?.setAttribute("aria-expanded", "false");
    }
  });
  menu.classList.toggle("is-open", nextOpen);
  menu.setAttribute("aria-hidden", String(!nextOpen));
  trigger.setAttribute("aria-expanded", String(nextOpen));
}

function closeUserMenus() {
  document.querySelectorAll(".user-menu.is-open").forEach((menu) => {
    menu.classList.remove("is-open");
    menu.setAttribute("aria-hidden", "true");
    menu.closest(".user-chip, .room-user")?.querySelector(".user-menu-trigger")?.setAttribute("aria-expanded", "false");
  });
}

function getRoomFilters() {
  const messageList = document.querySelector(".message-list");
  return {
    type: messageList?.dataset.filterType || "all",
    state: messageList?.dataset.filterState || "ongoing"
  };
}

function updateRoomMessageList() {
  const messageList = document.querySelector(".message-list");
  if (!messageList) return;
  const filters = getRoomFilters();
  const activeId = document.querySelector(".message-item.is-active")?.dataset.recordId || "";
  messageList.innerHTML = renderMessageList({ ...filters, activeRecord: activeId });
  bindMessageItems();
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
  window.clearInterval(startOngoingTimers.timer);
  main.outerHTML = renderPrescriptionTraceMain(record);
  setConsultShellReadonly(true);
  bindPrescriptionTraceCards();
}

function handleMessageItemClick(item) {
  if (item.dataset.videoLocked === "true" || item.getAttribute("aria-disabled") === "true") {
    showToast("当前视频问诊未结束，暂不可进入新的视频问诊");
    return;
  }
  if (item.dataset.badgeKey) {
    rememberDismissedMessageBadge(item.dataset.badgeKey);
  }
  item.querySelector(".message-item__badge")?.remove();
  const messageList = item.closest(".message-list");
  messageList?.querySelectorAll(".message-item").forEach((node) => node.classList.remove("is-active"));
  item.classList.add("is-active");
  const record = consultationRecords.find((entry) => entry.id === item.dataset.recordId);
  if (record?.state === "ended") {
    showPrescriptionTrace(record);
    return;
  }

  setConsultShellReadonly(false);

  if (isConsultReadonlyView() && (appView === "text" || appView === "video")) {
    const activeId = appView === "text" ? "active-text" : "active-video";
    if (record?.id === activeId) {
      restoreOngoingMain();
      bindConsultWorkspace();
      startOngoingTimers();
      return;
    }
  }

  if (item.dataset.targetView === "video") {
    if (record?.id) {
      setActiveVideoConsultation(record.id);
    }
    window.location.href = getVideoHref(record?.id);
  } else if (item.dataset.targetView === "text") {
    window.location.href = getTextHref(record?.id);
  }
}

function bindMessageItems() {
  document.querySelectorAll(".message-item").forEach((item) => {
    if (item.dataset.bound === "true") return;
    item.dataset.bound = "true";
    item.addEventListener("click", () => handleMessageItemClick(item));
  });
}

function bindPrescriptionTraceCards() {
  document.querySelectorAll(".prescription-history-open").forEach((button) => {
    if (button.dataset.bound === "true") return;
    button.dataset.bound = "true";
    button.addEventListener("click", () => {
      const recordId = document.querySelector(".message-item.is-active")?.dataset.recordId;
      window.location.href = getHistoryHref(recordId);
    });
  });
}

function getActiveOngoingRecordId() {
  const recordId = new URLSearchParams(location.search).get("record");
  if (recordId) return recordId;
  if (appView === "text") return "active-text";
  if (appView === "video") return "active-video";
  return null;
}

function syncActiveElapsedSeconds(seconds) {
  const recordId = getActiveOngoingRecordId();
  if (!recordId) return;
  const record = consultationRecords.find((entry) => entry.id === recordId);
  if (record) record.elapsedSeconds = seconds;
}

function closeChatMessageMenu() {
  const menu = document.querySelector(".chat-message-menu");
  if (!menu) return;
  menu.hidden = true;
  menu.classList.remove("is-open");
  menu.setAttribute("aria-hidden", "true");
  menu.style.left = "";
  menu.style.top = "";
  delete menu.dataset.messageId;
  delete menu.dataset.chatKey;
}

function openChatMessageMenu(bubble, event) {
  if (isConsultReadonlyView()) return;
  event.preventDefault();
  const menu = document.querySelector(".chat-message-menu");
  if (!menu) return;

  const chatKey = bubble.closest("[data-chat-key]")?.dataset.chatKey || getActiveChatKey() || "";
  menu.dataset.messageId = bubble.dataset.messageId || "";
  menu.dataset.chatKey = chatKey;
  menu.hidden = false;
  menu.classList.add("is-open");
  menu.setAttribute("aria-hidden", "false");

  const offset = 4;
  menu.style.left = `${event.clientX + offset}px`;
  menu.style.top = `${event.clientY + offset}px`;

  requestAnimationFrame(() => {
    const rect = menu.getBoundingClientRect();
    const left = Math.min(event.clientX + offset, window.innerWidth - rect.width - 8);
    const top = Math.min(event.clientY + offset, window.innerHeight - rect.height - 8);
    menu.style.left = `${Math.max(8, left)}px`;
    menu.style.top = `${Math.max(8, top)}px`;
  });
}

async function copyChatMessageText(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast("已复制");
  } catch {
    showToast("复制失败");
  }
}

function handleChatMessageMenuAction(action) {
  const menu = document.querySelector(".chat-message-menu");
  if (!menu) return;
  const chatKey = menu.dataset.chatKey;
  const messageId = menu.dataset.messageId;
  const message = findOngoingChatMessage(chatKey, messageId);
  if (!message || message.recalled) {
    closeChatMessageMenu();
    return;
  }

  if (action === "recall") {
    message.recalled = true;
    refreshChatThread(chatKey);
    showToast("消息已撤回");
  } else if (action === "copy") {
    copyChatMessageText(message.text);
  } else if (action === "quote") {
    const input = document.querySelector(".jh-chat-input textarea");
    if (input) {
      const quoteLine = `引用：${message.text}`;
      input.value = input.value.trim() ? `${input.value.trim()}\n${quoteLine}` : quoteLine;
      input.focus();
    }
    showToast("已引用到输入框");
  }

  closeChatMessageMenu();
}

function bindChatMessageMenu() {
  const menu = document.querySelector(".chat-message-menu");
  if (!menu || menu.dataset.bound === "true") return;
  menu.dataset.bound = "true";

  document.addEventListener("contextmenu", (event) => {
    if (!document.querySelector(".text-card:not(.text-card--readonly)")) return;
    const bubble = event.target.closest(
      '.chat-bubble--doctor[data-chat-context="doctor"]:not(.chat-bubble--recalled)'
    );
    if (!bubble) return;
    openChatMessageMenu(bubble, event);
  });

  menu.querySelectorAll(".chat-message-menu__item").forEach((item) => {
    item.addEventListener("click", (event) => {
      event.stopPropagation();
      handleChatMessageMenuAction(item.dataset.action);
    });
  });

  document.addEventListener("click", (event) => {
    if (!menu.classList.contains("is-open")) return;
    if (menu.contains(event.target)) return;
    closeChatMessageMenu();
  });

  document.addEventListener("scroll", closeChatMessageMenu, true);
}

function getActiveConsultationRecord() {
  const recordId = getActiveOngoingRecordId();
  return consultationRecords.find((entry) => entry.id === recordId && entry.state === "ongoing");
}

function refreshActivePrescriptionPanel(record = getActiveConsultationRecord()) {
  const panel = document.querySelector(".prescription-panel:not(.prescription-panel--readonly)");
  if (!panel || !record) return;
  panel.outerHTML = renderPrescriptionPanel({ record });
  bindConsultWorkspace();
}

function normalizeRecordDiagnosis(record) {
  const tags = Array.isArray(record.diagnosisTags) ? record.diagnosisTags.filter(Boolean) : [];
  if (!tags.length && record.diagnosis) tags.push(record.diagnosis);
  record.diagnosisTags = Array.from(new Set(tags));
  record.diagnosis = record.diagnosisTags[0] || "";
}

function addDiagnosisToActiveRecord() {
  const record = getActiveConsultationRecord();
  if (!record) return;
  normalizeRecordDiagnosis(record);
  const nextDiagnosis =
    diagnosisSuggestionPool.find((diagnosis) => !record.diagnosisTags.includes(diagnosis)) ||
    `补充诊断${record.diagnosisTags.length + 1}`;
  record.diagnosisTags.push(nextDiagnosis);
  normalizeRecordDiagnosis(record);
  refreshActivePrescriptionPanel(record);
  showToast(`已添加诊断：${nextDiagnosis}`);
}

function removeDiagnosisFromActiveRecord(tag) {
  const record = getActiveConsultationRecord();
  if (!record || !tag) return;
  normalizeRecordDiagnosis(record);
  record.diagnosisTags = record.diagnosisTags.filter((item) => item !== tag);
  normalizeRecordDiagnosis(record);
  refreshActivePrescriptionPanel(record);
  showToast("诊断已更新");
}

function normalizeMedicines(record) {
  record.prescriptionMedicines = (record.prescriptionMedicines || []).map((medicine, index) => ({
    ...medicine,
    index: index + 1
  }));
}

function findMedicineSuggestion(keyword) {
  const normalizedKeyword = keyword.trim().toLowerCase();
  return (
    medicineSuggestionPool.find((medicine) => medicine.name.toLowerCase().includes(normalizedKeyword)) ||
    medicineSuggestionPool.find((medicine) => normalizedKeyword && normalizedKeyword.includes(medicine.name.toLowerCase())) ||
    medicineSuggestionPool[0]
  );
}

function addMedicineToActiveRecord(keyword = "") {
  const record = getActiveConsultationRecord();
  if (!record) return;
  record.prescriptionMedicines = record.prescriptionMedicines || [];
  const suggestion = findMedicineSuggestion(keyword);
  if (record.prescriptionMedicines.some((medicine) => medicine.name === suggestion.name)) {
    showToast("该药品已在处方中");
    return;
  }
  record.prescriptionMedicines.push({
    index: record.prescriptionMedicines.length + 1,
    ...suggestion
  });
  normalizeMedicines(record);
  refreshActivePrescriptionPanel(record);
  showToast(`已添加药品：${suggestion.name}`);
}

function removeMedicineFromActiveRecord(name) {
  const record = getActiveConsultationRecord();
  if (!record || !name) return;
  record.prescriptionMedicines = (record.prescriptionMedicines || []).filter((medicine) => medicine.name !== name);
  normalizeMedicines(record);
  refreshActivePrescriptionPanel(record);
  showToast("药品已删除");
}

function bindPrescriptionEditor() {
  const panel = document.querySelector(".prescription-panel:not(.prescription-panel--readonly)");
  if (!panel || panel.dataset.editorBound === "true") return;
  panel.dataset.editorBound = "true";

  panel.querySelector(".diagnosis-select")?.addEventListener("click", addDiagnosisToActiveRecord);
  panel.querySelectorAll(".diagnosis-tag[data-diagnosis-tag]").forEach((tag) => {
    tag.addEventListener("click", () => removeDiagnosisFromActiveRecord(tag.dataset.diagnosisTag));
  });
  panel.querySelectorAll(".medicine-delete-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const row = button.closest("[data-medicine-name]");
      removeMedicineFromActiveRecord(row?.dataset.medicineName);
    });
  });
  panel.querySelector(".medicine-search input")?.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    addMedicineToActiveRecord(event.currentTarget.value);
  });
}

function bindDragScrollContainers(root = document) {
  root
    .querySelectorAll(".message-list, .chat-thread, .video-chat-thread, .quick-reply-categories, .quick-reply-list, .prescription-panel")
    .forEach((node) => {
      if (node.dataset.dragScrollBound === "true") return;
      node.dataset.dragScrollBound = "true";
      let startY = 0;
      let startScrollTop = 0;
      let didDrag = false;
      let pointerId = null;

      node.addEventListener("pointerdown", (event) => {
        if (event.button !== 0 || node.scrollHeight <= node.clientHeight) return;
        pointerId = event.pointerId;
        startY = event.clientY;
        startScrollTop = node.scrollTop;
        didDrag = false;
        node.classList.add("is-drag-scroll-active");
        node.setPointerCapture?.(event.pointerId);
      });

      node.addEventListener("pointermove", (event) => {
        if (pointerId !== event.pointerId) return;
        const deltaY = event.clientY - startY;
        if (Math.abs(deltaY) > 4) didDrag = true;
        if (!didDrag) return;
        event.preventDefault();
        node.scrollTop = startScrollTop - deltaY;
      });

      const endDrag = (event) => {
        if (pointerId !== event.pointerId) return;
        pointerId = null;
        node.classList.remove("is-drag-scroll-active");
        node.releasePointerCapture?.(event.pointerId);
      };

      node.addEventListener("pointerup", endDrag);
      node.addEventListener("pointercancel", endDrag);
      node.addEventListener(
        "click",
        (event) => {
          if (!didDrag) return;
          event.preventDefault();
          event.stopPropagation();
          didDrag = false;
        },
        true
      );
    });
}

function bindConsultWorkspace() {
  bindDragScrollContainers();
  bindPrescriptionEditor();

  document.querySelectorAll(".ai-reply__options button").forEach((option) => {
    if (option.dataset.bound === "true") return;
    option.dataset.bound = "true";
    option.addEventListener("click", () => {
      const input = document.querySelector(".jh-chat-input textarea");
      if (input) {
        input.value = option.textContent.trim();
        input.focus();
      }
    });
  });

  document.querySelectorAll(".quick-reply-trigger").forEach((button) => {
    if (button.dataset.bound === "true") return;
    button.dataset.bound = "true";
    button.addEventListener("click", openQuickReplyDialog);
  });

  document.querySelectorAll(".jh-prescription-submit").forEach((button) => {
    if (button.dataset.bound === "true") return;
    button.dataset.bound = "true";
    button.addEventListener("click", openRiskWarningDialog);
  });

  document.querySelectorAll(".cancel-consult-trigger").forEach((button) => {
    if (button.dataset.bound === "true") return;
    button.dataset.bound = "true";
    button.addEventListener("click", () => {
      openConsultConfirmDialog("cancel");
    });
  });

  document.querySelectorAll(".end-consult-trigger").forEach((button) => {
    if (button.dataset.bound === "true") return;
    button.dataset.bound = "true";
    button.addEventListener("click", () => {
      if (button.disabled) return;
      openConsultConfirmDialog("end");
    });
  });

  bindVideoControls();
}

function syncVideoWindowControls(videoWindow) {
  if (!videoWindow) return;
  const { cameraOn, micOn } = videoMediaState;
  const pip = videoWindow.querySelector(".video-window__pip--local");
  pip?.classList.toggle("is-camera-off", !cameraOn);
  const pipOff = pip?.querySelector(".video-window__pip-off");
  if (pipOff) pipOff.setAttribute("aria-hidden", String(cameraOn));
  videoWindow.classList.toggle("is-media-off", !cameraOn || !micOn);

  videoWindow.querySelectorAll("[data-video-action]").forEach((button) => {
    const isCamera = button.dataset.videoAction === "toggle-camera";
    const enabled = isCamera ? cameraOn : micOn;
    const label = isCamera
      ? enabled
        ? "关闭摄像头"
        : "开启摄像头"
      : enabled
        ? "关闭麦克风"
        : "开启麦克风";

    button.classList.toggle("is-off", !enabled);
    button.setAttribute("aria-pressed", String(enabled));
    button.setAttribute("aria-label", label);
    button.setAttribute("title", label);
    const icon = button.querySelector(".video-control-icon");
    if (icon) {
      icon.outerHTML = renderVideoMediaIcon(isCamera ? "camera" : "mic", enabled);
    }
  });
}

function bindVideoControls() {
  document.querySelectorAll(".video-window[data-video-controls]").forEach((videoWindow) => {
    if (videoWindow.dataset.bound === "true") return;
    videoWindow.dataset.bound = "true";

    videoWindow.querySelectorAll("[data-video-action]").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        if (button.dataset.videoAction === "toggle-camera") {
          videoMediaState.cameraOn = !videoMediaState.cameraOn;
          showToast(videoMediaState.cameraOn ? "摄像头已开启" : "摄像头已关闭");
        } else if (button.dataset.videoAction === "toggle-mic") {
          videoMediaState.micOn = !videoMediaState.micOn;
          showToast(videoMediaState.micOn ? "麦克风已开启" : "麦克风已关闭");
        }
        syncVideoWindowControls(videoWindow);
      });
    });
  });
}

export function startOngoingTimers() {
  window.clearInterval(startOngoingTimers.timer);
  if (isConsultReadonlyView() || !document.querySelector("[data-duration-timer]")) {
    return;
  }
  const tick = () => {
    document.querySelectorAll("[data-ongoing-timer], [data-duration-timer]").forEach((node) => {
      const nextSeconds = Number(node.dataset.elapsed || 0) + 1;
      node.dataset.elapsed = String(nextSeconds);
      if (node.matches("[data-duration-timer]")) {
        syncActiveElapsedSeconds(nextSeconds);
      }
      const text = formatDuration(nextSeconds);
      if (node.matches("[data-duration-timer]")) {
        const label = node.querySelector("strong");
        if (label) label.textContent = `问诊持续时长：${text}`;
      } else {
        node.textContent = `持续 ${text}`;
      }
    });
  };
  startOngoingTimers.timer = window.setInterval(tick, 1000);
}

export function startRealtimeMockUpdates() {
  window.clearInterval(startRealtimeMockUpdates.timer);
  const refresh = async () => {
    try {
      const snapshot = await getRealtimeSnapshot();
      if (snapshot.newConsultation) {
        const added = addConsultationRecord(snapshot.newConsultation.record, snapshot.newConsultation.chat);
        if (added) {
          registerConsultationMachine(snapshot.newConsultation.record);
          updateRoomMessageList();
          showToast(`新增${snapshot.newConsultation.record.typeLabel}问诊`);
        }
      }
      setWaitingQueue(snapshot.waitingQueue);
      if (snapshot.doctorStatus) {
        setDoctorStatus(snapshot.doctorStatus);
      }
    } catch {
      showToast("实时状态更新失败");
    }
  };
  startRealtimeMockUpdates.timer = window.setInterval(refresh, 3000);
}

export function bindInteractions() {
  subscribeRuntimeState(applyRuntimeStateToDom);
  applyRuntimeStateToDom();
  bindDragScrollContainers();

  document.querySelectorAll(".menu-item").forEach((item) => {
    item.addEventListener("click", () => {
      document.querySelectorAll(".menu-item").forEach((node) => {
        node.classList.remove("is-active");
      });
      item.classList.add("is-active");
    });
  });

  document.querySelectorAll(".jh-switch").forEach((switchButton) => {
    switchButton.addEventListener("click", () => {
      const nextStatus = doctorStatusState.status === "offline" ? "online" : "offline";
      changeDoctorStatus(nextStatus);
    });
  });

  document.querySelectorAll(".room-status").forEach((button) => {
    button.addEventListener("click", () => {
      changeDoctorStatus(cycleDoctorStatus());
    });
  });

  const serviceList = document.querySelector(".service-list");
  if (serviceList) {
    serviceList.querySelectorAll(".service-tile").forEach((tile) => {
      const serviceKey = tile.dataset.serviceKey;
      setServiceTileState(tile, Boolean(serviceState[serviceKey]), { sync: false });
    });

    serviceList.addEventListener("click", (event) => {
      const currentTile = event.target.closest(".service-tile");
      if (!currentTile || !serviceList.contains(currentTile)) return;
      event.preventDefault();
      event.stopPropagation();
      const serviceKey = currentTile.dataset.serviceKey;
      setServiceTileState(currentTile, !serviceState[serviceKey]);
    });
  }

  bindConsultWorkspace();
  bindChatMessageMenu();
  bindConsultConfirmDialogs();

  const quickReplyOverlay = document.querySelector(".quick-reply-overlay");

  if (quickReplyOverlay) {
    quickReplyOverlay.querySelector(".quick-reply-dialog__close")?.addEventListener("click", closeQuickReplyDialog);
    quickReplyOverlay.addEventListener("click", (event) => {
      if (event.target === quickReplyOverlay) {
        closeQuickReplyDialog();
      }
    });

    quickReplyOverlay.querySelectorAll(".quick-reply-category").forEach((category) => {
      category.addEventListener("click", () => {
        quickReplyOverlay
          .querySelectorAll(".quick-reply-category")
          .forEach((node) => node.classList.remove("is-active"));
        category.classList.add("is-active");
      });
    });

    quickReplyOverlay.querySelectorAll(".quick-reply-message").forEach((message) => {
      message.addEventListener("click", () => {
        const input = document.querySelector(".jh-chat-input textarea");
        if (input) {
          input.value = message.textContent.trim();
          input.focus();
        }
        closeQuickReplyDialog();
      });
    });
  }

  const riskWarningOverlay = document.querySelector(".risk-warning-overlay");

  if (riskWarningOverlay) {
    riskWarningOverlay.querySelector(".risk-warning-dialog__close")?.addEventListener("click", closeRiskWarningDialog);
    riskWarningOverlay.addEventListener("click", (event) => {
      if (event.target === riskWarningOverlay) {
        closeRiskWarningDialog();
      }
    });
  }

  const announcementOverlay = document.querySelector(".announcement-overlay");
  const announcementListOverlay = document.querySelector(".announcement-list-overlay");
  const quickEntryOverlay = document.querySelector(".quick-entry-overlay");
  document.querySelectorAll(".announcement__detail-trigger").forEach((button) => {
    button.addEventListener("click", openAnnouncementDialog);
  });
  document.querySelectorAll(".announcement-list-trigger").forEach((button) => {
    button.addEventListener("click", openAnnouncementListDialog);
  });

  if (announcementOverlay) {
    announcementOverlay
      .querySelector(".announcement-dialog__close")
      ?.addEventListener("click", closeAnnouncementDialog);
    announcementOverlay.addEventListener("click", (event) => {
      if (event.target === announcementOverlay) {
        closeAnnouncementDialog(event);
      }
    });
    announcementOverlay.querySelector(".announcement-dialog")?.addEventListener("click", (event) => {
      event.stopPropagation();
    });
  }

  if (announcementListOverlay) {
    announcementListOverlay
      .querySelector(".announcement-list-dialog__close")
      ?.addEventListener("click", closeAnnouncementListDialog);
    announcementListOverlay.addEventListener("click", (event) => {
      if (event.target === announcementListOverlay) {
        closeAnnouncementListDialog(event);
      }
    });
    announcementListOverlay.querySelector(".announcement-list-dialog")?.addEventListener("click", (event) => {
      event.stopPropagation();
    });
    announcementListOverlay.querySelectorAll(".announcement-list-item").forEach((item) => {
      item.addEventListener("click", (event) => {
        closeAnnouncementListDialog(event);
        openAnnouncementDialog(event);
      });
    });
  }

  if (quickEntryOverlay) {
    quickEntryOverlay
      .querySelector(".quick-entry-dialog__close")
      ?.addEventListener("click", closeQuickEntryDialog);
    quickEntryOverlay.addEventListener("click", (event) => {
      if (event.target === quickEntryOverlay) {
        closeQuickEntryDialog(event);
      }
    });
    quickEntryOverlay.querySelector(".quick-entry-dialog")?.addEventListener("click", (event) => {
      event.stopPropagation();
    });
    quickEntryOverlay.querySelectorAll(".quick-entry-option").forEach((optionButton) => {
      optionButton.addEventListener("click", (event) => {
        const option = quickEntryOptions[Number(optionButton.dataset.optionIndex)];
        if (!option) return;
        const addCard = document.querySelector(".quick-card--add");
        if (addCard) {
          addCard.classList.remove("quick-card--add");
          addCard.dataset.action = option.desc;
          addCard.querySelector(".icon-box").innerHTML = icons[option.icon];
          addCard.querySelector(".quick-card__title")?.remove();
          addCard.querySelector(".quick-card__desc")?.insertAdjacentHTML("beforebegin", `<span class="quick-card__title">${option.title}</span>`);
          addCard.querySelector(".quick-card__desc").textContent = option.desc;
        }
        closeQuickEntryDialog(event);
        showToast(`已添加${option.title}`);
      });
    });
  }

  const consultCard = document.querySelector(".consult-card");
  if (consultCard) {
    consultCard.addEventListener("click", () => {
      window.location.href = getRoomHref();
    });
  }

  document.querySelectorAll(".quick-card").forEach((card) => {
    card.addEventListener("click", (event) => {
      if (card.classList.contains("quick-card--add")) {
        openQuickEntryDialog(event);
        return;
      }
      showToast(card.dataset.action);
    });
  });

  document
    .querySelectorAll(".topbar__actions .jh-btn, .room-service-btn")
    .forEach((button) => {
      button.addEventListener("click", () => {
        showToast(button.textContent.trim());
      });
    });

  document.querySelectorAll(".user-menu-trigger").forEach((trigger) => {
    trigger.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      toggleUserMenu(trigger);
    });
  });

  document.querySelectorAll(".user-menu__item").forEach((item) => {
    item.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      closeUserMenus();
      showToast(item.dataset.action || item.textContent.trim());
    });
  });

  document.addEventListener("click", closeUserMenus);

  const roomRefresh = document.querySelector(".room-refresh");
  if (roomRefresh) {
    roomRefresh.addEventListener("click", () => {
      window.location.href = getTextHref();
    });
  }

  document.querySelectorAll(".room-tag").forEach((tag) => {
    tag.addEventListener("click", () => {
      const group = tag.closest(".room-tags");
      group.querySelectorAll(".room-tag").forEach((node) => node.classList.remove("is-active"));
      tag.classList.add("is-active");
      const messageList = document.querySelector(".message-list");
      if (messageList) {
        if (tag.dataset.filterType) {
          messageList.dataset.filterType = tag.dataset.filterType;
        }
        if (tag.dataset.filterState) {
          messageList.dataset.filterState = tag.dataset.filterState;
        }
        updateRoomMessageList();
        const filters = getRoomFilters();
        if (filters.state === "ended") {
          const firstEnded = consultationRecords.find(
            (record) => (filters.type === "all" || record.type === filters.type) && record.state === "ended"
          );
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
      }
    });
  });

  document.querySelectorAll(".room-service-check").forEach((button) => {
    button.addEventListener("click", () => {
      const enabled = button.getAttribute("aria-checked") === "true";
      const nextState = !enabled;
      setServiceTileState(button, nextState);
    });
  });

  bindMessageItems();

  bindPrescriptionTraceCards();

  document.querySelectorAll(".history-back").forEach((button) => {
    button.addEventListener("click", () => {
      window.location.href = getRoomHref();
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeQuickReplyDialog();
      closeRiskWarningDialog();
      closeAnnouncementDialog(event);
      closeAnnouncementListDialog(event);
      closeQuickEntryDialog(event);
      closeUserMenus();
      closeChatMessageMenu();
      closeAllConsultConfirmDialogs();
    }
  });
}
