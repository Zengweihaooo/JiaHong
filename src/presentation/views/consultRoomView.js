import { assetUrl } from "../../shared/core.js";
import { renderButton, renderDurationChip, renderLabelTag, renderRiskTag } from "../components/primitives.js?v=20260527-36";
import { getActiveConsultationRecord } from "./renderRecordSelectors.js?v=20260528-06";
import { renderAiReplyComposer, renderChatPanel, renderChatThread, renderFollowUpVoucherCard } from "./chatView.js?v=20260604-03";
import { renderConsultationPanel, renderPrescriptionPanel } from "./prescriptionPanels.js?v=20260604-01";
import { renderRoomSidebar } from "./roomMessageListView.js?v=20260604-02";
import { renderRoomTopbar } from "./roomShellView.js?v=20260528-06";
import { renderVideoToolbar, videoMediaState } from "./videoMedia.js";

function getRecordMedicineTypeLabel(record) {
  if (record?.type === "consult") return record.consultationAttribute === "with-medicine" ? "带药" : "珮文";
  return "中药";
}

function getConsultMainTitle(record) {
  if (record?.type === "consult" && (!record.title || record.title.includes("图文咨询"))) {
    return "武汉市好药师大药房";
  }
  return record?.title || "图文问诊";
}

function renderConsultMainShell({ label, title, elapsedSeconds = 0, chatPanel, prescriptionPanel, record = null }) {
  const cancelDisabled = Boolean(record?.prescriptionSubmitted);
  return `
    <main class="text-main consult-room-main">
      <section class="text-card consult-room-card" aria-label="${label}">
        <div class="pharmacy-bar">
          <div class="pharmacy-bar__left">
            <h2>${title}</h2>
            ${renderRiskTag({ text: "迎检", size: "lg", className: "risk-tag--inspection" })}
            ${renderLabelTag({ text: getRecordMedicineTypeLabel(record), tone: "focus", size: "lg", className: "risk-tag--medicine medicine-type-tag" })}
          </div>
          <div class="pharmacy-bar__right">
            ${renderDurationChip("icon", elapsedSeconds)}
            ${renderButton({ text: "取消问诊", tone: "outline-secondary", size: "md", className: "cancel-consult-trigger", disabled: cancelDisabled })}
          </div>
        </div>
        <div class="consult-workspace">
          ${chatPanel}
          ${prescriptionPanel}
        </div>
      </section>
    </main>`;
}

export function renderTextMain() {
  const record = getActiveConsultationRecord("text");
  const isConsult = record?.type === "consult";
  return renderConsultMainShell({
    label: isConsult ? "图文咨询" : "图文问诊",
    title: getConsultMainTitle(record),
    elapsedSeconds: record?.elapsedSeconds ?? 0,
    chatPanel: renderChatPanel(record?.id, { record }),
    prescriptionPanel: isConsult ? renderConsultationPanel({ record }) : renderPrescriptionPanel({ record }),
    record
  });
}

function renderConsultPage({ shellClass = "", main, overlays = "" }) {
  return `
    <div class="app-shell room-shell consult-shell${shellClass ? ` ${shellClass}` : ""} app-shell--responsive">
      ${renderRoomTopbar()}
      ${renderRoomSidebar()}
      ${main}
      ${overlays}
      <div class="toast" role="status" aria-live="polite"></div>
    </div>`;
}

export function renderTextPage({ overlays = "" } = {}) {
  return renderConsultPage({ shellClass: "text-shell", main: renderTextMain(), overlays });
}

export function renderVideoChatPanel() {
  const { cameraOn } = videoMediaState;
  const record = getActiveConsultationRecord("video");
  return `
    <section class="chat-panel video-chat-panel" aria-label="视频聊天区域">
      <div class="video-window" data-video-controls="true">
        <div class="video-window__stage" aria-label="视频通话画面">
          <div class="video-window__pane video-window__pane--patient">
            <img class="video-window__main" src="${assetUrl("assets/video-main.png")}" alt="患者视频画面" />
          </div>
          <div class="video-window__pane video-window__pane--doctor video-window__pip video-window__pip--local${cameraOn ? "" : " is-camera-off"}">
            <video class="video-window__local-video" data-local-camera autoplay muted playsinline aria-label="医生摄像头画面"></video>
            <div class="video-window__camera-status" data-camera-status>正在连接摄像头</div>
            <div class="video-window__pip-off" aria-hidden="${cameraOn}">摄像头已关闭</div>
          </div>
        </div>
        ${renderVideoToolbar()}
      </div>
      ${renderFollowUpVoucherCard(record)}
      ${renderChatThread(record?.id, { threadClass: "video-chat-thread" })}
      <div class="video-input-wrap">
        ${renderAiReplyComposer(record)}
      </div>
    </section>`;
}

export function renderVideoMain() {
  const record = getActiveConsultationRecord("video");
  return renderConsultMainShell({
    label: "视频问诊",
    title: record?.title || "视频问诊",
    elapsedSeconds: record?.elapsedSeconds ?? 0,
    chatPanel: renderVideoChatPanel(),
    prescriptionPanel: renderPrescriptionPanel({ record, videoSubmitLock: true }),
    record
  });
}

export function renderVideoPage({ overlays = "" } = {}) {
  return renderConsultPage({ shellClass: "text-shell video-shell", main: renderVideoMain(), overlays });
}
