import { appView, getSessionIdParam } from "../../shared/core.js";
import { normalizeArchivedConsultationRecord } from "../../domain/archivedConsultation.js";
import { renderData } from "../../application/viewModels/renderViewModel.js?v=20260528-06";
import { renderButton, renderLabelTag, renderReadTag } from "../components/primitives.js";
import { renderPrescriptionPanel } from "./prescriptionPanels.js?v=20260604-01";
import { getDefaultEndedRenderRecord } from "./renderRecordSelectors.js?v=20260528-06";
import { renderRoomSidebar } from "./roomMessageListView.js?v=20260604-02";
import { renderRoomTopbar } from "./roomShellView.js?v=20260528-06";

export function getConsultMainClass() {
  return appView === "text" || appView === "video" ? "text-main" : "room-main";
}

function getArchivedTypeDisplay(record = {}) {
  return record.type === "consult" ? "咨询" : `${record.typeLabel}问诊`;
}

export function renderPrescriptionTraceMain(record = renderData.consultationRecords.find((item) => item.state === "ended")) {
  const mainClass = getConsultMainClass();
  const archivedRecord = normalizeArchivedConsultationRecord(record, renderData.ongoingChatState[record?.id]);
  const typeDisplay = getArchivedTypeDisplay(archivedRecord);
  return `
    <main class="${mainClass}">
      <section class="text-card text-card--readonly" aria-label="历史问诊回看">
        <div class="pharmacy-bar">
          <div class="pharmacy-bar__left">
            <h2>${archivedRecord.title}</h2>
            ${renderReadTag("read", "readonly-seal-tag").replace("已读", "已封存")}
            ${renderLabelTag({ text: typeDisplay, tone: "focus", size: "lg", className: "risk-tag--medicine medicine-type-tag" })}
          </div>
          <div class="pharmacy-bar__right">
            <span class="readonly-ended-time">结束时间：${archivedRecord.endedAt}</span>
          </div>
        </div>
        <div class="consult-workspace">
          ${renderArchivedConsultationPanel(archivedRecord)}
          ${renderReadonlyPrescriptionPanel(archivedRecord)}
        </div>
      </section>
    </main>`;
}

export function renderArchivedChatThread(record) {
  const transcript = normalizeArchivedConsultationRecord(record, renderData.ongoingChatState[record?.id]).transcript;

  return `
    <div class="chat-thread chat-thread--archived">
      ${transcript
        .map(
          (item) => `
        <p class="chat-date">${item.time || ""}</p>
        <div class="chat-bubble chat-bubble--${item.from === "doctor" ? "doctor" : "patient"}">
          <p>${item.text}</p>
        </div>`
        )
        .join("")}
    </div>`;
}

export function renderArchivedConsultationPanel(record) {
  return `
    <section class="chat-panel archived-consult-panel" aria-label="历史聊天记录">
      <div class="archived-consult-panel__scroll">
        ${renderArchivedChatThread(record)}
      </div>
      <div class="archived-consult-panel__disabled-input">问诊已封存，仅支持回看</div>
    </section>`;
}

export function renderReadonlyPrescriptionPanel(record) {
  const medicineCount = record.prescriptionMedicines?.length || 1;
  return renderPrescriptionPanel({
    readonly: true,
    record,
    includeSecondMedicine: medicineCount > 1
  });
}

export function renderPrescriptionTraceCard(record) {
  const archivedRecord = normalizeArchivedConsultationRecord(record, renderData.ongoingChatState[record?.id]);
  const typeDisplay = getArchivedTypeDisplay(archivedRecord);
  return `
    <button class="prescription-trace-card" type="button" data-history-record-id="${archivedRecord.id}" aria-label="查看${archivedRecord.patient}开方历史">
      <span class="prescription-trace-card__head">
        <span>
          <span class="prescription-trace-card__eyebrow">${typeDisplay}已结束</span>
          <strong>${archivedRecord.patient}｜${archivedRecord.age}</strong>
        </span>
        ${renderReadTag("read", "prescription-trace-card__status").replace("已读", "已归档")}
      </span>
      <span class="prescription-trace-card__body">
        <span class="trace-info-grid">
          <span><em>诊断</em><strong>${archivedRecord.diagnosis}</strong></span>
          <span><em>处方编号</em><strong>${archivedRecord.prescriptionNo}</strong></span>
          <span><em>结束时间</em><strong>${archivedRecord.endedAt}</strong></span>
        </span>
        <span class="trace-timeline">
          ${archivedRecord.trace
            .map(
              (item) => `
                <span class="trace-timeline__item">
                  <span class="trace-timeline__dot" aria-hidden="true"></span>
                  <span>
                    <strong>${item.label}<em>${item.time}</em></strong>
                    <small>${item.detail}</small>
                  </span>
                </span>`
            )
            .join("")}
        </span>
      </span>
      <span class="prescription-trace-card__footer">点击查看完整开方历史</span>
    </button>`;
}

export function renderHistoryPage({ quickReplyDialog = "", riskWarningDialog = "" } = {}) {
  const sessionId = getSessionIdParam();
  const record =
    renderData.consultationRecords.find((item) => item.id === sessionId && item.state === "ended") ||
    getDefaultEndedRenderRecord();
  const archivedRecord = normalizeArchivedConsultationRecord(record, renderData.ongoingChatState[record?.id]);
  const typeDisplay = getArchivedTypeDisplay(archivedRecord);
  const medicines = archivedRecord.prescriptionMedicines || [];
  return `
    <div class="app-shell room-shell history-shell app-shell--responsive">
      ${renderRoomTopbar()}
      ${renderRoomSidebar()}
      <main class="room-main">
        <section class="room-card prescription-history" aria-label="开方历史">
          <div class="prescription-history__header">
            <div>
              <p>开方历史</p>
              <h1>${archivedRecord.patient}的处方留痕记录</h1>
            </div>
            ${renderButton({ text: "返回问诊室", tone: "outline-secondary", size: "md", className: "history-back" })}
          </div>
          <div class="prescription-history__summary">
            <span><em>问诊类型</em><strong>${typeDisplay}</strong></span>
            <span><em>诊断</em><strong>${archivedRecord.diagnosis}</strong></span>
            <span><em>处方编号</em><strong>${archivedRecord.prescriptionNo}</strong></span>
            <span><em>归档时间</em><strong>${archivedRecord.endedAt}</strong></span>
          </div>
          <div class="prescription-history__content">
            <section class="history-panel">
              <h2>处方明细</h2>
              <div class="history-medicine-table">
                ${
                  medicines.length
                    ? medicines
                        .map(
                          (medicine) =>
                            `<div><strong>${medicine.name}</strong><span>${medicine.spec}｜${medicine.usage}｜${medicine.frequency}｜${medicine.quantity}${medicine.unit}</span></div>`
                        )
                        .join("")
                    : `<div><strong>暂无处方药品</strong><span>本次问诊未生成处方明细</span></div>`
                }
              </div>
            </section>
            <section class="history-panel">
              <h2>操作留痕</h2>
              <div class="history-trace-list">
                ${archivedRecord.trace
                  .map(
                    (item) => `
                      <div>
                        <strong>${item.label}<span>${item.time}</span></strong>
                        <p>${item.detail}</p>
                      </div>`
                  )
                  .join("")}
              </div>
            </section>
          </div>
        </section>
      </main>
      ${quickReplyDialog}
      ${riskWarningDialog}
      <div class="toast" role="status" aria-live="polite"></div>
    </div>`;
}
