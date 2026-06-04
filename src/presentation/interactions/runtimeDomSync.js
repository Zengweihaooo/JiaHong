import {
  getDoctorStatus,
  getServiceAvailabilityEntries,
  getWaitingQueueState
} from "../../application/controllers/runtimeController.js?v=20260528-06";
import { getDoctorStatusLabel } from "../components/primitives.js?v=20260604-37";

export function applyServiceStateToDom(serviceKey, enabled) {
  document.querySelectorAll(`[data-service-key="${serviceKey}"]`).forEach((node) => {
    node.setAttribute("aria-checked", String(enabled));
    node.classList.toggle("is-selected", enabled);
  });
}

function applyDoctorStatusToDom(status = getDoctorStatus()) {
  const statusLabel = getDoctorStatusLabel(status);

  document.querySelectorAll("[data-status-text]").forEach((node) => {
    node.textContent = statusLabel;
    node.classList.remove("jh-status-badge--online", "jh-status-badge--busy", "jh-status-badge--offline");
    node.classList.add(`jh-status-badge--${status}`);
  });

  document.querySelectorAll(".room-status").forEach((button) => {
    button.setAttribute("aria-label", `出诊状态：${statusLabel}，展开状态菜单`);
  });

  document.querySelectorAll(".doctor-status-trigger").forEach((button) => {
    button.setAttribute("aria-label", `出诊状态：${statusLabel}，展开状态菜单`);
  });

  document.querySelectorAll(".doctor-status-menu__item").forEach((item) => {
    const active = item.dataset.doctorStatus === status;
    item.classList.toggle("is-active", active);
    item.setAttribute("aria-checked", String(active));
  });

  document.querySelectorAll(".jh-switch").forEach((button) => {
    const enabled = status !== "offline";
    button.classList.toggle("is-on", enabled);
    button.setAttribute("aria-pressed", String(enabled));
  });
}

function applyWaitingQueueToDom(waitingQueue = getWaitingQueueState()) {
  document.querySelectorAll("[data-waiting-total]").forEach((node) => {
    node.textContent = String(waitingQueue.total);
  });
  document.querySelectorAll("[data-waiting-type]").forEach((node) => {
    node.textContent = String(waitingQueue.byType[node.dataset.waitingType] ?? 0);
  });
  document.querySelectorAll(".consult-card").forEach((card) => {
    card.classList.toggle("consult-card--has-queue", Number(waitingQueue.total) > 0);
  });
}

export function applyRuntimeStateToDom() {
  applyDoctorStatusToDom();
  applyWaitingQueueToDom();
  getServiceAvailabilityEntries().forEach(([serviceKey, enabled]) => {
    applyServiceStateToDom(serviceKey, enabled);
  });
}
