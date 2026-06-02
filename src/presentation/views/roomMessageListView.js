import { appView, assetUrl, getSessionIdParam } from "../../shared/core.js";
import { contactLayoutTypeOrder, getMessageListRecords } from "../../domain/consultationQueue.js?v=20260602-03";
import { renderData, renderRuntime } from "../../application/viewModels/renderViewModel.js?v=20260528-06";
import {
  getActiveVideoConsultationRecordId,
  getDefaultEndedRenderRecord,
  getDefaultOngoingRenderRecord
} from "./renderRecordSelectors.js?v=20260528-06";

function renderRoomFilterButton({ text, type, state, active = false, wide = false }) {
  const dataAttr = type ? `data-filter-type="${type}"` : `data-filter-state="${state}"`;
  return `<button class="jh-btn jh-btn--md jh-btn--outline-secondary room-tag${wide ? " room-tag--wide" : ""}${active ? " is-active" : ""}" type="button" ${dataAttr}>${text}</button>`;
}

const messageTypeMeta = {
  video: {
    label: "视频",
    icon: "assets/figma-room/video-consult.svg"
  },
  text: {
    label: "图文",
    icon: "assets/figma-room/text-consult.svg"
  },
  consult: {
    label: "咨询",
    icon: "assets/figma-room/consult.svg"
  }
};

function getInitialActiveRecordId() {
  return (
    getSessionIdParam() ||
    (appView === "history" ? getDefaultEndedRenderRecord()?.id : getDefaultOngoingRenderRecord(appView)?.id) ||
    ""
  );
}

export function renderRoomSidebar() {
  const activeRecord = getInitialActiveRecordId();
  const initialState = appView === "history" ? "ended" : "ongoing";
  return `
    <aside class="room-sidebar" aria-label="问诊消息栏">
      <div class="room-sidebar__section room-sidebar__section--head">
        <div class="room-title-row">
          <h1>问诊室</h1>
          <div class="room-waiting">
            <span>待接诊</span>
            <strong data-waiting-total>${renderRuntime.waitingQueue.total}</strong>
          </div>
        </div>
      </div>
      <div class="room-sidebar__section room-sidebar__section--filters">
        <div class="room-tags room-tags--state">
          ${renderRoomFilterButton({ text: "进行中", state: "ongoing", active: initialState === "ongoing", wide: true })}
          ${renderRoomFilterButton({ text: "已结束", state: "ended", active: initialState === "ended", wide: true })}
        </div>
      </div>
      <div class="message-list" aria-label="会话列表" data-filter-type="all" data-filter-state="${initialState}">
        ${renderMessageList({ state: initialState, activeRecord })}
      </div>
    </aside>`;
}

export function renderMessageList({ type = "all", state = "ongoing", activeRecord = "" } = {}) {
  const activeVideoRecordId = getActiveVideoConsultationRecordId(activeRecord);
  const records = getMessageListRecords(renderData.consultationRecords, {
    type,
    state,
    activeVideoRecordId,
    collapseVideoQueue: true
  });
  if (type !== "all") {
    return records
      .map((record, index) => renderMessageItem(record, record.id === activeRecord, index, activeVideoRecordId))
      .join("");
  }

  return records
    .map((record, index) => {
      const previousRecord = records[index - 1];
      const shouldRenderGroup = !previousRecord || previousRecord.type !== record.type;
      return `
        ${shouldRenderGroup ? renderMessageGroupLabel(record.type) : ""}
        ${renderMessageItem(record, record.id === activeRecord, index, activeVideoRecordId)}`;
    })
    .join("");
}

function renderMessageGroupLabel(type) {
  if (!contactLayoutTypeOrder.includes(type)) return "";
  return `
    <button class="message-group-label message-group-toggle" type="button" data-message-group="${type}" data-no-drag-scroll="true" aria-expanded="true">
      <span>${messageTypeMeta[type].label}</span>
      <img src="${assetUrl("assets/figma-room/group-chevron.svg")}" alt="" aria-hidden="true" />
    </button>`;
}

export function renderMessageItem(record, active, index = 0, activeVideoRecordId = "") {
  const badgeKey = renderRuntime.getMessageBadgeKey(record.id);
  const unreadCount = Number(record.unreadCount ?? record.badge ?? 0);
  const showBadge = unreadCount > 0 && !renderRuntime.isMessageBadgeDismissed(record.id);
  const typeMeta = messageTypeMeta[record.type] || messageTypeMeta.consult;
  const currentVideo =
    record.type === "video" &&
    record.state === "ongoing" &&
    (record.id === activeVideoRecordId || (!activeVideoRecordId && active));
  const compact = record.type === "video" && !active && !currentVideo;
  const videoLocked =
    !active && !currentVideo && record.type === "video" && record.state === "ongoing" && activeVideoRecordId && record.id !== activeVideoRecordId;
  const lockedAttrs = videoLocked
    ? ` aria-disabled="true" data-video-locked="true" title="当前视频问诊未结束，暂不可进入新的视频问诊"`
    : "";
  return `
    <button class="message-item message-item--${record.type}${compact ? " message-item--compact" : ""}${active ? " is-active" : ""}${currentVideo ? " is-current-video" : ""}${videoLocked ? " is-video-locked" : ""}" type="button" data-record-id="${record.id}" data-target-view="${record.targetView || ""}" data-record-state="${record.state}" data-badge-key="${badgeKey}"${lockedAttrs}>
      <span class="message-item__stripe" aria-hidden="true"></span>
      <span class="message-item__icon" aria-hidden="true">
        <img src="${assetUrl(typeMeta.icon)}" alt="" />
      </span>
      <span class="message-item__body">
        <span class="message-item__title">${record.title}</span>
        ${compact ? "" : `<span class="message-item__preview">${record.preview}</span>`}
        ${videoLocked && !compact ? `<span class="message-item__lock-hint">请先结束当前视频问诊</span>` : ""}
      </span>
      ${currentVideo ? `<span class="message-item__current" aria-label="当前视频问诊进行中"><img src="${assetUrl("assets/figma-room/current-video-indicator.svg")}" alt="" /></span>` : ""}
      ${!currentVideo && showBadge ? `<span class="message-item__badge">${unreadCount}</span>` : ""}
    </button>`;
}
