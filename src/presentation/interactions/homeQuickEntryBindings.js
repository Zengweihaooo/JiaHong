import { getQuickEntryOption } from "../../application/controllers/contentController.js";
import { maxQuickActionCards } from "../../domain/quickEntries.js?v=20260602-01";
import { bindOverlayDismiss, closeOverlay, openOverlay, showToast } from "../ui/interactionPrimitives.js?v=20260527-36";
import {
  addCustomQuickCardToGrid,
  ensureQuickAddCard,
  getQuickGridCustomCards,
  isQuickEntryAlreadyUsed,
  moveDraggingQuickCard,
  removeCustomQuickCardWithMotion,
  replaceQuickCard,
  setQuickCardEditControlsState
} from "./quickEntryGridDom.js?v=20260602-01";

let quickEntryEditingCard = null;
let activeQuickCardDrag = null;
let quickCardControlEventUntil = 0;

function isQuickCardControlTarget(target) {
  return Boolean(target?.closest?.(".quick-card__delete, .quick-card__drag"));
}

function guardQuickCardControlEvent(event) {
  if (!isQuickCardControlTarget(event.target)) return false;
  quickCardControlEventUntil = Date.now() + 350;
  event.stopPropagation();
  return true;
}

function openQuickEntryDialog(event, editingCard = null) {
  quickEntryEditingCard = editingCard;
  const overlay = openOverlay(".quick-entry-overlay", ".quick-entry-dialog__close", event);
  const title = overlay?.querySelector("#quick-entry-title");
  if (title) title.textContent = quickEntryEditingCard ? "编辑快捷入口" : "添加快捷入口";
  updateQuickEntryDialogOptions(overlay);
}

export function closeQuickEntryDialog(event) {
  closeOverlay(".quick-entry-overlay", event);
  quickEntryEditingCard = null;
}

function addCustomQuickCard(option) {
  const grid = document.querySelector(".quick-grid");
  const result = addCustomQuickCardToGrid(grid, option);
  if (result.reason === "duplicate") {
    showToast("该快捷入口已存在");
  }
  if (result.reason === "limit") {
    showToast(`最多添加${maxQuickActionCards}个快捷入口`);
  }
  return result.ok;
}

function updateQuickEntryDialogOptions(overlay) {
  if (!overlay) return;
  const grid = document.querySelector(".quick-grid");
  const empty = overlay.querySelector(".quick-entry-dialog__empty");
  let visibleCount = 0;
  overlay.querySelectorAll(".quick-entry-option").forEach((optionButton) => {
    const option = getQuickEntryOption(optionButton.dataset.optionIndex);
    const alreadyUsed = grid && option ? isQuickEntryAlreadyUsed(grid, option, quickEntryEditingCard) : false;
    optionButton.hidden = alreadyUsed;
    if (!alreadyUsed) visibleCount += 1;
  });
  if (empty) empty.hidden = visibleCount > 0;
}

function beginQuickCardDrag(event, grid, card) {
  activeQuickCardDrag = {
    grid,
    card,
    slotIndex: getQuickGridCustomCards(grid).indexOf(card)
  };
  card.classList.add("is-dragging");
}

function updateQuickCardDrag(event) {
  if (!activeQuickCardDrag) return;
  event.preventDefault();
  moveDraggingQuickCard(event, activeQuickCardDrag.grid, activeQuickCardDrag.card, activeQuickCardDrag);
}

function endPointerQuickCardDrag() {
  activeQuickCardDrag?.card.classList.remove("is-dragging");
  activeQuickCardDrag = null;
}

function endMouseQuickCardDrag() {
  document.removeEventListener("mousemove", updateQuickCardDrag);
  document.removeEventListener("mouseup", endMouseQuickCardDrag);
  endPointerQuickCardDrag();
}

function openQuickSchedulePanel(card, event) {
  const quickEntryCard = card.closest(".quick-entry-card");
  if (quickEntryCard) {
    quickEntryCard.classList.remove("is-editing");
    quickEntryCard.querySelector(".quick-entry-card__edit")?.setAttribute("aria-pressed", "false");
    const editText = quickEntryCard.querySelector(".quick-entry-card__edit-text");
    if (editText) editText.textContent = "编辑";
    setQuickCardEditControlsState(quickEntryCard, false);
  }
  return Boolean(openOverlay(".schedule-overlay", ".schedule-panel__back", event));
}

export function closeQuickSchedulePanel(event) {
  closeOverlay(".schedule-overlay", event);
}

function activateQuickCard(card, event) {
  if (isQuickCardControlTarget(event?.target) || Date.now() < quickCardControlEventUntil) return;
  if (card.classList.contains("quick-card--add")) {
    openQuickEntryDialog(event);
    return;
  }
  if (card.closest(".quick-entry-card")?.classList.contains("is-editing")) {
    openQuickEntryDialog(event, card);
    return;
  }
  if (card.dataset.quickFeature === "schedule") {
    openQuickSchedulePanel(card, event);
    return;
  }
  showToast(card.dataset.action);
}

function bindQuickEntryDialog() {
  const quickEntryOverlay = document.querySelector(".quick-entry-overlay");
  if (!quickEntryOverlay) return;
  bindOverlayDismiss(quickEntryOverlay, {
    close: closeQuickEntryDialog,
    closeSelector: ".quick-entry-dialog__close",
    dialogSelector: ".quick-entry-dialog"
  });
  quickEntryOverlay.querySelectorAll(".quick-entry-option").forEach((optionButton) => {
    optionButton.addEventListener("click", (event) => {
      if (optionButton.hidden) return;
      const option = getQuickEntryOption(optionButton.dataset.optionIndex);
      if (!option) return;
      const editingCard = quickEntryEditingCard;
      const updated = editingCard ? replaceQuickCard(editingCard, option) : addCustomQuickCard(option);
      closeQuickEntryDialog(event);
      if (updated) showToast(`${editingCard ? "已更新" : "已添加"}${option.title}`);
    });
  });
}

function bindQuickEntryEditButtons() {
  document.querySelectorAll(".quick-entry-card__edit").forEach((button) => {
    if (button.dataset.bound === "true") return;
    button.dataset.bound = "true";
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const card = button.closest(".quick-entry-card");
      const editing = !card?.classList.contains("is-editing");
      card?.classList.toggle("is-editing", editing);
      if (card) setQuickCardEditControlsState(card, editing);
      button.setAttribute("aria-pressed", String(editing));
      button.querySelector(".quick-entry-card__edit-text").textContent = editing ? "完成" : "编辑";
    });
  });
}

function bindQuickSchedulePanel() {
  const scheduleOverlay = document.querySelector(".schedule-overlay");
  if (!scheduleOverlay) return;
  bindOverlayDismiss(scheduleOverlay, {
    close: closeQuickSchedulePanel,
    closeSelector: ".schedule-panel__back",
    dialogSelector: ".schedule-dialog"
  });
  scheduleOverlay.querySelectorAll(".schedule-panel__detail").forEach((button) => {
    if (button.dataset.bound === "true") return;
    button.dataset.bound = "true";
    button.addEventListener("click", () => {
      showToast("排班详情暂未开放");
    });
  });
}

function bindQuickGrid() {
  document.querySelectorAll(".quick-grid").forEach((grid) => {
    if (grid.dataset.bound === "true") return;
    grid.dataset.bound = "true";
    grid.addEventListener("pointerdown", guardQuickCardControlEvent, true);
    grid.addEventListener("pointerup", guardQuickCardControlEvent, true);
    grid.addEventListener("mousedown", guardQuickCardControlEvent, true);
    grid.addEventListener("click", (event) => {
      const deleteButton = event.target.closest(".quick-card__delete");
      if (deleteButton) {
        event.preventDefault();
        event.stopPropagation();
        const card = deleteButton.closest(".quick-card--custom");
        if (!card || !card.closest(".quick-entry-card")?.classList.contains("is-editing")) return;
        removeCustomQuickCardWithMotion(card);
        showToast("已删除快捷入口");
        return;
      }
      const card = event.target.closest(".quick-card");
      if (!card || !grid.contains(card)) return;
      activateQuickCard(card, event);
    });
    grid.addEventListener("dragstart", (event) => {
      const handle = event.target.closest(".quick-card__drag");
      const card = handle?.closest(".quick-card--custom");
      if (!card || !grid.closest(".quick-entry-card")?.classList.contains("is-editing")) {
        event.preventDefault();
        return;
      }
      card.classList.add("is-dragging");
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", "");
    });
    grid.addEventListener("dragover", (event) => {
      const dragging = grid.querySelector(".quick-card.is-dragging");
      if (!dragging) return;
      event.preventDefault();
      moveDraggingQuickCard(event, grid, dragging, activeQuickCardDrag);
    });
    grid.addEventListener("dragend", () => {
      grid.querySelector(".quick-card.is-dragging")?.classList.remove("is-dragging");
    });
    grid.addEventListener("pointerdown", (event) => {
      if (isQuickCardControlTarget(event.target)) return;
      const handle = event.target.closest(".quick-card__drag");
      const card = event.target.closest(".quick-card--custom");
      if (!card || !grid.closest(".quick-entry-card")?.classList.contains("is-editing")) return;
      event.preventDefault();
      beginQuickCardDrag(event, grid, card);
      (handle || card).setPointerCapture?.(event.pointerId);
    });
    grid.addEventListener("pointermove", (event) => {
      if (!activeQuickCardDrag || activeQuickCardDrag.grid !== grid) return;
      updateQuickCardDrag(event);
    });
    grid.addEventListener("pointerup", endPointerQuickCardDrag);
    grid.addEventListener("pointercancel", endPointerQuickCardDrag);
    grid.addEventListener("mousedown", (event) => {
      if (typeof PointerEvent === "function") return;
      if (isQuickCardControlTarget(event.target)) return;
      const card = event.target.closest(".quick-card--custom");
      if (!card || !grid.closest(".quick-entry-card")?.classList.contains("is-editing")) return;
      event.preventDefault();
      beginQuickCardDrag(event, grid, card);
      document.addEventListener("mousemove", updateQuickCardDrag);
      document.addEventListener("mouseup", endMouseQuickCardDrag, { once: true });
    });
    grid.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      if (guardQuickCardControlEvent(event)) return;
      const card = event.target.closest(".quick-card");
      if (!card || !grid.contains(card)) return;
      event.preventDefault();
      activateQuickCard(card, event);
    });
  });
}

export function bindQuickEntryInteractions() {
  bindQuickEntryDialog();
  bindQuickEntryEditButtons();
  bindQuickSchedulePanel();
  bindQuickGrid();
}
