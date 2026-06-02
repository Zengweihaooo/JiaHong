import { appView, getSessionIdParam } from "../shared/core.js";
import { syncActiveElapsedSeconds } from "../application/controllers/consultationController.js";
import { refreshRealtimeState } from "../application/controllers/realtimeController.js?v=20260528-06";
import { subscribeToRuntimeState } from "../application/controllers/runtimeController.js?v=20260528-06";
import { isConsultReadonlyView } from "./ui/dom.js";
import { showToast } from "./ui/interactionPrimitives.js?v=20260527-36";
import { formatDuration, getDurationTone } from "./components/primitives.js?v=20260527-36";
import {
  applyRuntimeStateToDom,
  bindDoctorStatusMenus,
  bindSidebarScrollIsolation,
  bindSidebarToggle,
  bindUserMenus,
  closeDoctorStatusMenus,
  closeUserMenus,
  isServiceAvailable,
  setServiceTileState,
  toggleDoctorOnlineStatus
} from "./interactions/runtimeUiBindings.js?v=20260528-06";
import {
  bindChatMessageMenu,
  closeChatMessageMenu,
  configureChatBindings
} from "./interactions/chatBindings.js";
import { bindConsultWorkspace } from "./interactions/consultWorkspaceBindings.js?v=20260603-01";
import { bindDragScrollContainers } from "./interactions/dragScrollBindings.js?v=20260527-45";
import { configurePrescriptionEditorBindings } from "./interactions/prescriptionEditorBindings.js?v=20260528-06";
import { bindHomeInteractions, closeHomeOverlays } from "./interactions/homeInteractionBindings.js?v=20260603-03";
import {
  bindConsultConfirmDialogs,
  bindConsultDialogOverlays,
  closeConsultDialogOverlays,
  configureConsultDialogBindings
} from "./interactions/consultDialogBindings.js?v=20260603-01";
import {
  bindRoomInteractions,
  configureRoomInteractionBindings,
  handleConsultResolved,
  updateRoomMessageList
} from "./interactions/roomInteractionBindings.js?v=20260528-06";

function getRouteConsultationContext() {
  return {
    sessionId: getSessionIdParam(),
    view: appView
  };
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
        syncActiveElapsedSeconds(nextSeconds, getRouteConsultationContext());
      }
      const text = formatDuration(nextSeconds);
      if (node.matches("[data-duration-timer]")) {
        node.setAttribute("aria-label", `问诊持续时长：${text}`);
        node.classList.remove("jh-duration-chip--normal", "jh-duration-chip--warning", "jh-duration-chip--danger");
        node.classList.add(`jh-duration-chip--${getDurationTone(nextSeconds)}`);
        const value = node.querySelector(".jh-duration-chip__value");
        if (value) value.textContent = text;
        const label = node.querySelector("strong");
        if (label && !value) label.textContent = `问诊持续时长：${text}`;
      } else {
        node.textContent = `持续 ${text}`;
      }
    });
  };
  startOngoingTimers.timer = window.setInterval(tick, 1000);
}

export function stopOngoingTimers() {
  window.clearInterval(startOngoingTimers.timer);
}

export function startRealtimeMockUpdates() {
  window.clearInterval(startRealtimeMockUpdates.timer);
  const refresh = async () => {
    try {
      const snapshot = await refreshRealtimeState();
      if (snapshot.addedConsultation) {
        updateRoomMessageList();
        showToast(`新增${snapshot.addedConsultation.record.typeLabel}问诊`);
      }
    } catch {
      showToast("实时状态更新失败");
    }
  };
  startRealtimeMockUpdates.timer = window.setInterval(refresh, 3000);
}

export function bindInteractions() {
  configureChatBindings({ onThreadRendered: bindDragScrollContainers });
  configurePrescriptionEditorBindings({ getContext: getRouteConsultationContext, onPanelRendered: bindConsultWorkspace });
  configureConsultDialogBindings({ getContext: getRouteConsultationContext, onResolved: handleConsultResolved });
  configureRoomInteractionBindings({
    bindWorkspace: bindConsultWorkspace,
    startTimers: startOngoingTimers,
    stopTimers: stopOngoingTimers
  });
  subscribeToRuntimeState(applyRuntimeStateToDom);
  applyRuntimeStateToDom();
  bindDragScrollContainers();
  bindSidebarToggle();
  bindSidebarScrollIsolation();

  document.querySelectorAll(".menu-item").forEach((item) => {
    item.addEventListener("click", () => {
      document.querySelectorAll(".menu-item").forEach((node) => {
        node.classList.remove("is-active");
      });
      item.classList.add("is-active");
    });
  });

  bindDoctorStatusMenus();

  document.querySelectorAll(".jh-switch").forEach((switchButton) => {
    if (switchButton.dataset.bound === "true") return;
    switchButton.dataset.bound = "true";
    switchButton.addEventListener("click", () => {
      toggleDoctorOnlineStatus();
    });
  });

  const serviceList = document.querySelector(".service-list");
  if (serviceList) {
    serviceList.querySelectorAll(".service-tile").forEach((tile) => {
      const serviceKey = tile.dataset.serviceKey;
      setServiceTileState(tile, isServiceAvailable(serviceKey), { sync: false });
    });

    serviceList.addEventListener("click", (event) => {
      const currentTile = event.target.closest(".service-tile");
      if (!currentTile || !serviceList.contains(currentTile)) return;
      event.preventDefault();
      event.stopPropagation();
      const serviceKey = currentTile.dataset.serviceKey;
      setServiceTileState(currentTile, !isServiceAvailable(serviceKey));
    });
  }

  document.querySelectorAll(".user-menu-service").forEach((tile) => {
    if (tile.dataset.bound === "true") return;
    tile.dataset.bound = "true";
    const serviceKey = tile.dataset.serviceKey;
    setServiceTileState(tile, isServiceAvailable(serviceKey), { sync: false });
    tile.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      setServiceTileState(tile, !isServiceAvailable(serviceKey));
    });
  });

  bindConsultWorkspace();
  bindChatMessageMenu();
  bindConsultConfirmDialogs();
  bindConsultDialogOverlays();

  bindHomeInteractions();

  document
    .querySelectorAll(".topbar__actions .jh-btn, .room-service-btn")
    .forEach((button) => {
      button.addEventListener("click", () => {
        showToast(button.textContent.trim());
      });
    });

  bindUserMenus();
  bindRoomInteractions();

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeConsultDialogOverlays(event);
      closeHomeOverlays(event);
      closeUserMenus();
      closeDoctorStatusMenus();
      closeChatMessageMenu();
    }
  });
}
