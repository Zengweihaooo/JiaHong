import { fillChatInput, sendChatInputMessage } from "./chatBindings.js";
import {
  openConsultAttachmentDialog,
  openConsultConfirmDialog,
  openFollowUpVoiceDialog,
  openQuickReplyDialog,
  requestPrescriptionSubmit
} from "./consultDialogBindings.js?v=20260603-01";
import { bindDragScrollContainers } from "./dragScrollBindings.js";
import { bindPrescriptionEditor } from "./prescriptionEditorBindings.js?v=20260528-06";
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
      aiReply.dataset.aiReplyState = "collapsed";
      aiReply.classList.add("ai-reply--collapsed");
      aiReply.classList.remove("ai-reply--expanded");
    });
  });
}

function toggleAiReply(button) {
  const aiReply = button.closest(".ai-reply");
  if (!aiReply) return;
  const expanded = aiReply.dataset.aiReplyState === "expanded";
  aiReply.dataset.aiReplyState = expanded ? "collapsed" : "expanded";
  aiReply.classList.toggle("ai-reply--collapsed", expanded);
  aiReply.classList.toggle("ai-reply--expanded", !expanded);
  if (!expanded) {
    aiReply.querySelector(".ai-reply__options button")?.focus();
  } else {
    button.focus();
  }
}

function bindQuickReplyTriggers() {
  document.querySelectorAll(".quick-reply-trigger").forEach((button) => {
    if (button.dataset.bound === "true") return;
    button.dataset.bound = "true";
    let clickTimer = null;
    button.addEventListener("click", (event) => {
      if (event.detail > 1) return;
      clickTimer = window.setTimeout(() => {
        clickTimer = null;
        openQuickReplyDialog();
      }, 260);
    });
    button.addEventListener("dblclick", (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (clickTimer) {
        window.clearTimeout(clickTimer);
        clickTimer = null;
      }
      toggleAiReply(button);
    });
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
    button.addEventListener("click", (event) => openFollowUpVoiceDialog(button, event));
  });
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
  bindQuickReplyTriggers();
  bindConsultAttachments();
  bindChatInputs();
  bindPrescriptionSubmitTriggers();
  bindVideoPrescriptionSubmitCountdown();
  bindConsultFinishTriggers();
  bindVideoControls();
}
