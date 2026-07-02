import { fillChatInput, sendChatInputMessage } from "./chatBindings.js";
import {
  openConsultAttachmentDialog,
  openConsultConfirmDialog,
  openQuickReplyDialog,
  requestPrescriptionSubmit
} from "./consultDialogBindings.js?v=20260604-04";
import { bindDragScrollContainers } from "./dragScrollBindings.js";
import { bindPrescriptionEditor } from "./prescriptionEditorBindings.js?v=20260604-06";
import { bindVideoControls } from "./videoControls.js";
import { bindVideoPrescriptionSubmitCountdown } from "./videoSubmitLockBindings.js";

function bindAiReplyOptions() {
  document.querySelectorAll(".ai-reply__options button").forEach((option) => {
    if (option.dataset.bound === "true") return;
    option.dataset.bound = "true";
    const getOptionText = () => option.dataset.replyText || option.querySelector(".jh-btn--ai-pill__text")?.textContent || option.textContent;
    option.addEventListener("click", () => {
      fillChatInput(getOptionText());
    });
    option.addEventListener("dblclick", (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (!fillChatInput(getOptionText())) return;
      sendChatInputMessage(document.querySelector(".jh-chat-input textarea"));
    });
  });

  document.querySelectorAll(".ai-reply__refresh").forEach((button) => {
    if (button.dataset.bound === "true") return;
    button.dataset.bound = "true";
    button.addEventListener("click", () => {
      const options = Array.from(button.closest(".ai-reply")?.querySelectorAll(".jh-btn--ai-pill") || []);
      if (options.length < 2) return;
      const firstText = options[0].querySelector(".jh-btn--ai-pill__text")?.innerHTML || "";
      const firstTag = options[0].querySelector(".jh-btn--ai-pill__tag")?.textContent || "";
      const firstReplyText = options[0].dataset.replyText || "";
      options.forEach((option, index) => {
        const nextOption = options[index + 1];
        const nextText = nextOption?.querySelector(".jh-btn--ai-pill__text")?.innerHTML || firstText;
        const nextTag = nextOption?.querySelector(".jh-btn--ai-pill__tag")?.textContent || firstTag;
        const nextReplyText = nextOption?.dataset.replyText || firstReplyText;
        const textNode = option.querySelector(".jh-btn--ai-pill__text");
        const tagNode = option.querySelector(".jh-btn--ai-pill__tag");
        if (textNode) textNode.innerHTML = nextText;
        if (tagNode) tagNode.textContent = nextTag;
        option.dataset.replyText = nextReplyText;
      });
    });
  });

  document.querySelectorAll(".ai-reply__close").forEach((button) => {
    if (button.dataset.bound === "true") return;
    button.dataset.bound = "true";
    button.addEventListener("click", () => {
      const aiReply = button.closest(".ai-reply");
      if (!aiReply) return;
      setAiReplyState(aiReply, "collapsed");
      aiReply.querySelector(".ai-reply__toggle")?.focus();
    });
  });
}

function setAiReplyState(aiReply, state) {
  if (!aiReply) return;
  const expanded = state === "expanded";
  aiReply.dataset.aiReplyState = state;
  aiReply.classList.toggle("ai-reply--collapsed", !expanded);
  aiReply.classList.toggle("ai-reply--expanded", expanded);
  const toggle = aiReply.querySelector(".ai-reply__toggle");
  toggle?.setAttribute("aria-expanded", String(expanded));
  toggle?.setAttribute("aria-label", expanded ? "智能推荐回复已展开" : "展开智能推荐回复");
  const smartReplyTrigger = aiReply.querySelector(".smart-reply-trigger");
  smartReplyTrigger?.setAttribute("aria-expanded", String(expanded));
  smartReplyTrigger?.setAttribute("aria-label", expanded ? "收起智能推荐回复" : "展开智能推荐回复");
}

function bindAiReplyToggles() {
  document.querySelectorAll(".ai-reply__toggle").forEach((button) => {
    if (button.dataset.bound === "true") return;
    button.dataset.bound = "true";
    button.addEventListener("click", () => {
      const aiReply = button.closest(".ai-reply");
      if (!aiReply || aiReply.dataset.aiReplyState === "expanded") return;
      setAiReplyState(aiReply, "expanded");
    });
  });

  document.querySelectorAll(".smart-reply-trigger").forEach((button) => {
    if (button.dataset.bound === "true") return;
    button.dataset.bound = "true";
    button.addEventListener("click", () => {
      const aiReply = button.closest(".ai-reply");
      if (!aiReply) return;
      const expanded = aiReply.dataset.aiReplyState === "expanded";
      setAiReplyState(aiReply, expanded ? "collapsed" : "expanded");
    });
  });
}

function bindQuickReplyTriggers() {
  document.querySelectorAll(".quick-reply-trigger").forEach((button) => {
    if (button.dataset.bound === "true") return;
    button.dataset.bound = "true";
    button.addEventListener("click", openQuickReplyDialog);
  });
}

function bindConsultAttachments() {
  document.querySelectorAll(".consult-attachment").forEach((button) => {
    if (button.dataset.bound === "true") return;
    button.dataset.bound = "true";
    button.addEventListener("click", (event) => openConsultAttachmentDialog(button, event));
  });
  document.querySelectorAll(".followup-voucher-voice").forEach((button) => {
    if (button.dataset.bound === "true") return;
    button.dataset.bound = "true";
    button.addEventListener("click", (event) => toggleFollowUpVoicePlayback(button, event));
  });
}

let activeFollowUpVoice = null;
const followUpVoiceWaveFrameMs = 250;
const followUpVoiceWaveFrameCount = 4;

function markFollowUpVoiceViewed(button) {
  button.dataset.followupVoucherStatus = "viewed";
  button.classList.remove("followup-voucher-item--unviewed");
  button.classList.add("followup-voucher-item--viewed");
}

function updateFollowUpVoiceProgress(state) {
  const waveStep = state.waveFrame % followUpVoiceWaveFrameCount;
  state.button.dataset.followupVoiceStep = String(waveStep);
  const currentNode = state.button.querySelector("[data-followup-voice-current]");
  if (currentNode) currentNode.textContent = `${state.duration}"`;
}

function stopFollowUpVoicePlayback({ reset = false } = {}) {
  if (!activeFollowUpVoice) return;
  window.clearInterval(activeFollowUpVoice.timer);
  window.clearInterval(activeFollowUpVoice.waveTimer);
  activeFollowUpVoice.button.classList.remove("is-playing");
  activeFollowUpVoice.button.setAttribute("aria-pressed", "false");
  delete activeFollowUpVoice.button.dataset.followupVoiceStep;
  if (reset) {
    activeFollowUpVoice.elapsed = 0;
    updateFollowUpVoiceProgress(activeFollowUpVoice);
    delete activeFollowUpVoice.button.dataset.followupVoiceStep;
  }
  activeFollowUpVoice = null;
}

function toggleFollowUpVoicePlayback(button, event) {
  event.preventDefault();
  event.stopPropagation();
  if (activeFollowUpVoice?.button === button) {
    stopFollowUpVoicePlayback();
    return;
  }
  stopFollowUpVoicePlayback({ reset: true });
  markFollowUpVoiceViewed(button);
  const duration = Math.max(1, Number(button.dataset.followupVoiceDuration || 0));
  activeFollowUpVoice = { button, duration, elapsed: 0, waveFrame: 0, timer: null, waveTimer: null };
  button.classList.add("is-playing");
  button.setAttribute("aria-pressed", "true");
  updateFollowUpVoiceProgress(activeFollowUpVoice);
  activeFollowUpVoice.waveTimer = window.setInterval(() => {
    if (!activeFollowUpVoice || activeFollowUpVoice.button !== button) return;
    activeFollowUpVoice.waveFrame = (activeFollowUpVoice.waveFrame + 1) % followUpVoiceWaveFrameCount;
    updateFollowUpVoiceProgress(activeFollowUpVoice);
  }, followUpVoiceWaveFrameMs);
  activeFollowUpVoice.timer = window.setInterval(() => {
    if (!activeFollowUpVoice || activeFollowUpVoice.button !== button) return;
    activeFollowUpVoice.elapsed = Math.min(activeFollowUpVoice.duration, activeFollowUpVoice.elapsed + 1);
    updateFollowUpVoiceProgress(activeFollowUpVoice);
    if (activeFollowUpVoice.elapsed >= activeFollowUpVoice.duration) {
      stopFollowUpVoicePlayback();
    }
  }, 1000);
}

function bindChatInputs() {
  document.querySelectorAll(".jh-chat-input").forEach((chatInput) => {
    if (chatInput.dataset.sendBound === "true") return;
    chatInput.dataset.sendBound = "true";
    const textarea = chatInput.querySelector("textarea");
    const sendButton = chatInput.querySelector(".jh-chat-input__actions .jh-btn--primary");
    sendButton?.addEventListener("click", () => {
      sendChatInputMessage(textarea);
    });
    textarea?.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" || event.shiftKey || event.isComposing) return;
      event.preventDefault();
      sendChatInputMessage(textarea);
    });
  });
}

function bindPrescriptionSubmitTriggers() {
  document.querySelectorAll(".jh-prescription-submit").forEach((button) => {
    if (button.dataset.bound === "true") return;
    button.dataset.bound = "true";
    const submit = (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (button.disabled || button.getAttribute("aria-disabled") === "true") return;
      requestPrescriptionSubmit();
    };
    button.addEventListener("pointerdown", (event) => {
      event.stopPropagation();
    });
    button.addEventListener("click", submit);
  });
}

function bindConsultFinishTriggers() {
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
    const openEndConfirm = (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (button.disabled) return;
      openConsultConfirmDialog("end");
    };
    button.addEventListener("pointerdown", (event) => {
      event.stopPropagation();
    });
    button.addEventListener("click", openEndConfirm);
  });
}

export function bindConsultWorkspace() {
  bindDragScrollContainers();
  bindPrescriptionEditor();
  bindAiReplyOptions();
  bindAiReplyToggles();
  bindQuickReplyTriggers();
  bindConsultAttachments();
  bindChatInputs();
  bindPrescriptionSubmitTriggers();
  bindVideoPrescriptionSubmitCountdown();
  bindConsultFinishTriggers();
  bindVideoControls();
}
