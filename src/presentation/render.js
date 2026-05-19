import { assetUrl, appView, getHomeHref, getRoomHref, getTextHref, getVideoHref, getHistoryHref, getRecordParam } from "../shared/core.js";
import { normalizeArchivedConsultationRecord } from "../domain/archivedConsultation.js";
import { getMessageListRecords } from "../domain/consultationQueue.js";
import { icons } from "./ui/icons.js";
import { renderData, renderRuntime } from "./renderContext.js";

export function renderCheckboxMark() {
  return `<img class="jh-checkbox__mark" src="${assetUrl("assets/figma-home/checkmark.svg")}" alt="" aria-hidden="true" />`;
}

export function renderCheckbox({ label, className = "", labelClassName = "" } = {}) {
  return `
    <span class="jh-checkbox${className ? ` ${className}` : ""}">
      <span class="jh-checkbox__icon" aria-hidden="true">${renderCheckboxMark()}</span>
      ${label ? `<span class="jh-checkbox__label${labelClassName ? ` ${labelClassName}` : ""}">${label}</span>` : ""}
    </span>`;
}

export function renderSwitch({ checked = false, label = "切换开关", className = "" } = {}) {
  return `<button class="jh-switch${checked ? " is-on" : ""}${className ? ` ${className}` : ""}" type="button" aria-label="${label}" aria-pressed="${checked}"></button>`;
}

export function renderButton({ text, tone = "primary", size = "md", className = "", type = "button", disabled = false } = {}) {
  const safeTone = [
    "primary",
    "outline-primary",
    "outline-secondary",
    "block-outline",
    "danger",
    "soft-danger",
    "neutral",
    "text"
  ].includes(tone)
    ? tone
    : "primary";
  const sizeClass = ["sm", "md", "lg"].includes(size) ? ` jh-btn--${size}` : "";
  return `<button class="jh-btn${sizeClass} jh-btn--${safeTone}${className ? ` ${className}` : ""}" type="${type}"${disabled ? " disabled" : ""}>${text}</button>`;
}

export function renderDurationChip(variant = "icon", elapsedSeconds = 0) {
  const safeVariant = ["icon", "pill", "plain"].includes(variant) ? variant : "icon";
  return `
    <span class="jh-duration-chip jh-duration-chip--${safeVariant}" data-duration-timer data-elapsed="${elapsedSeconds}">
      ${safeVariant === "icon" ? `<span class="jh-duration-chip__clock" aria-hidden="true"></span>` : ""}
      <strong>问诊持续时长：${formatDuration(elapsedSeconds)}</strong>
    </span>`;
}

export function formatDuration(totalSeconds) {
  const safeSeconds = Math.max(0, Number(totalSeconds) || 0);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;
  return [hours, minutes, seconds].map((value) => String(value).padStart(2, "0")).join(":");
}

export function renderChatInput({ className = "" } = {}) {
  return `
    <div class="jh-chat-input${className ? ` ${className}` : ""}">
      <div class="jh-chat-input__top">
        ${renderButton({ text: "快捷回复", tone: "outline-primary", className: "quick-reply-trigger" })}
        <textarea aria-label="回复内容" placeholder="输入回复内容，或点击上方AI推荐快速填充..."></textarea>
      </div>
      <div class="jh-chat-input__actions">
        ${renderButton({ text: "发送", tone: "primary", size: "md" })}
      </div>
    </div>`;
}

export function renderQuickReplyDialog() {
  return `
    <div class="quick-reply-overlay" aria-hidden="true">
      <section class="quick-reply-dialog" role="dialog" aria-modal="true" aria-labelledby="quick-reply-title">
        <header class="quick-reply-dialog__header">
          <h2 id="quick-reply-title">快捷用语</h2>
          <button class="quick-reply-dialog__close" type="button" aria-label="关闭快捷用语">
            <img src="${assetUrl("assets/quick-reply-close.svg")}" alt="" />
          </button>
        </header>
        <div class="quick-reply-dialog__body">
          <nav class="quick-reply-categories" aria-label="快捷回复分类">
            ${renderData.quickReplyCategories
              .map(
                (category, index) => `
                  <button class="quick-reply-category${index === 0 ? " is-active" : ""}" type="button">
                    ${category}
                  </button>`
              )
              .join("")}
          </nav>
          <div class="quick-reply-list" role="list">
            ${renderData.quickReplyMessages
              .map(
                (message) => `
                  <button class="quick-reply-message" type="button" role="listitem">
                    <span>${message}</span>
                  </button>`
              )
              .join("")}
          </div>
          <div class="quick-reply-scrollbar" aria-hidden="true"></div>
        </div>
        <footer class="quick-reply-dialog__footer">点击快捷用语即可发送</footer>
      </section>
    </div>`;
}

const consultConfirmConfig = {
  cancel: {
    title: "取消问诊",
    message: "确定要取消本次问诊吗？取消后将退出当前会话，未保存内容不会保留。",
    confirmText: "确定取消"
  },
  end: {
    title: "结束问诊",
    message: "确定要结束本次问诊吗？结束后将无法继续与患者沟通。",
    confirmText: "确定结束"
  }
};

export function renderConsultConfirmDialogs() {
  return Object.entries(consultConfirmConfig)
    .map(
      ([kind, config]) => `
    <div class="consult-confirm-overlay" data-confirm-kind="${kind}" aria-hidden="true">
      <section
        class="consult-confirm-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="consult-confirm-title-${kind}"
        aria-describedby="consult-confirm-desc-${kind}"
      >
        <header class="consult-confirm-dialog__header">
          <h2 id="consult-confirm-title-${kind}">${config.title}</h2>
          <button type="button" class="consult-confirm-dialog__close" aria-label="关闭">
            <img src="${assetUrl("assets/quick-reply-close.svg")}" alt="" />
          </button>
        </header>
        <div class="consult-confirm-dialog__body">
          <p id="consult-confirm-desc-${kind}">${config.message}</p>
        </div>
        <footer class="consult-confirm-dialog__footer">
          ${renderButton({ text: "再想想", tone: "outline-secondary", size: "md", className: "consult-confirm-dismiss" })}
          ${renderButton({ text: config.confirmText, tone: "danger", size: "md", className: "consult-confirm-submit" })}
        </footer>
      </section>
    </div>`
    )
    .join("");
}

export function renderRiskWarningDialog() {
  const record = getActiveConsultationRecord();
  const medicines = record?.prescriptionMedicines?.length ? record.prescriptionMedicines : [];
  const headers = [
    "药品名称",
    "患者条件",
    "重复用药",
    "用法用量",
    "给药途径",
    "相互作用",
    "生化指标",
    "配伍",
    "过敏",
    "孕产",
    "其他"
  ];
  const rows = medicines.map((medicine, index) => ({
    name: medicine.name,
    warnings: index === 0 ? { 2: "must", 5: medicine.risk === "低" ? "general" : "severe" } : { 4: "general" }
  }));

  return `
    <div class="risk-warning-overlay" aria-hidden="true">
      <section class="risk-warning-dialog" role="dialog" aria-modal="true" aria-labelledby="risk-warning-title">
        <header class="risk-warning-dialog__header">
          <h2 id="risk-warning-title">风险检测提醒</h2>
          <button class="risk-warning-dialog__close" type="button" aria-label="关闭风险检测提醒">
            <img src="${assetUrl("assets/quick-reply-close.svg")}" alt="" />
          </button>
        </header>
        <div class="risk-warning-dialog__table-wrap">
          <div class="risk-warning-table" role="table" aria-label="风险检测提醒">
            <div class="risk-warning-row risk-warning-row--head" role="row">
              ${headers.map((header) => `<div class="risk-warning-cell" role="columnheader">${header}</div>`).join("")}
            </div>
            ${(rows.length ? rows : [{ name: "暂无用药数据", warnings: {} }])
              .map(
                (row) => `
                  <div class="risk-warning-row" role="row">
                    <div class="risk-warning-cell risk-warning-cell--name" role="cell">${row.name}</div>
                    ${headers
                      .slice(1)
                      .map((_, index) => {
                        const status = row.warnings[index + 1];
                        return `<div class="risk-warning-cell risk-warning-cell--status" role="cell">${
                          status ? `<span class="risk-warning-status risk-warning-status--${status}" aria-hidden="true"></span>` : ""
                        }</div>`;
                      })
                      .join("")}
                  </div>`
              )
              .join("")}
          </div>
        </div>
        <div class="risk-warning-dialog__divider"></div>
        <div class="risk-warning-dialog__message-wrap">
          <div class="risk-warning-message">
            <p>[警示信息]${rows[0]?.name || "当前药品"}需完成风险核对</p>
            <p>[建议信息]请结合患者基础信息、过敏史和用药风险完成处方确认。</p>
          </div>
        </div>
      </section>
    </div>`;
}

export function renderAiReplyOptions(options = []) {
  const layoutTextThreshold = "这是一串智能回复的文字内容，并且这是一行的最长字符数".length;
  const maxTextLength = Math.max(0, ...options.map((option) => option.length));
  const layoutClass = maxTextLength >= layoutTextThreshold ? " ai-reply__options--long" : "";
  return `
    <div class="ai-reply__options${layoutClass}" data-layout-threshold="${layoutTextThreshold}">
      ${options
        .map((option) =>
          renderButton({ text: option, tone: "outline-primary", size: "md", className: "jh-btn--ai-pill" })
        )
        .join("")}
    </div>`;
}

export function renderSearchField({ className = "", placeholder = "请输入药品名称或首字母做模糊查询", disabled = false } = {}) {
  return `
    <label class="jh-search-field${className ? ` ${className}` : ""}${disabled ? " is-disabled" : ""}">
      <span class="jh-search-field__icon" aria-hidden="true">
        <img src="${assetUrl("assets/search-icon.png")}" alt="" />
      </span>
      <input type="text" placeholder="${placeholder}" aria-label="${placeholder}"${disabled ? " disabled" : ""} />
    </label>`;
}

export function renderMedicineSearchCombobox() {
  return `
    <div class="medicine-search-combobox">
      ${renderSearchField({ className: "medicine-search" })}
      <div class="medicine-options" role="listbox" hidden></div>
    </div>`;
}

export function renderSelectField({ label = "请选择", size = "sm", className = "", showChevron = true } = {}) {
  const safeSize = size === "lg" ? "lg" : "sm";
  return `
    <button class="jh-input-field jh-input-field--${safeSize}${className ? ` ${className}` : ""}" type="button">
      <span>${label}</span>
      ${
        showChevron
          ? `<span class="jh-input-field__chevron" aria-hidden="true">
              <img src="${assetUrl("assets/figma-consult/chevron-down.svg")}" alt="" />
            </span>`
          : ""
      }
    </button>`;
}

export function renderLabelTag({ text = "默认标签", tone = "light", size = "sm", weight = "regular", className = "" } = {}) {
  const safeTone = ["dark", "light", "focus"].includes(tone) ? tone : "light";
  const safeSize = ["sm", "md", "lg"].includes(size) ? size : "sm";
  const weightClass = weight === "bold" ? " jh-tag--bold" : "";
  return `<span class="jh-tag jh-tag--${safeTone} jh-tag--${safeSize}${weightClass}${className ? ` ${className}` : ""}">${text}</span>`;
}

export function renderStatusBadge(status = "online", className = "") {
  const statusMap = {
    online: "在线",
    busy: "忙碌",
    offline: "离线"
  };
  const safeStatus = Object.prototype.hasOwnProperty.call(statusMap, status) ? status : "online";
  return `<span class="jh-status-badge jh-status-badge--${safeStatus}${className ? ` ${className}` : ""}" data-status-text>${statusMap[safeStatus]}</span>`;
}

export function getDoctorStatusLabel(status = renderRuntime.doctorStatus) {
  const labels = {
    online: "在线",
    busy: "忙碌",
    offline: "离线"
  };
  return labels[status] || labels.offline;
}

export function renderReadTag(status = "unread", className = "") {
  const safeStatus = status === "read" ? "read" : "unread";
  const label = safeStatus === "read" ? "已读" : "未读";
  return `<span class="jh-read-tag jh-read-tag--${safeStatus}${className ? ` ${className}` : ""}">${label}</span>`;
}

export function renderRiskTag({ text = "高", size = "sm", className = "" } = {}) {
  const safeSize = size === "lg" ? "lg" : "sm";
  return `<span class="jh-risk-tag jh-risk-tag--${safeSize}${className ? ` ${className}` : ""}">${text}</span>`;
}

export function renderMenu() {
  return renderData.menuGroups
    .map(
      (group) => `
        <div class="menu-section">${group.title}</div>
        ${group.items
          .map(
            (item) => `
              <button class="menu-item${item.active ? " is-active" : ""}" type="button" data-menu="${item.label}">
                ${icons[item.icon]}
                <span>${item.label}</span>
              </button>`
          )
          .join("")}`
    )
    .join("");
}

export function renderSidebar() {
  return `
    <aside class="sidebar" aria-label="主菜单">
      <div class="sidebar__brand">${icons.logo}</div>
      <nav class="sidebar__content">${renderMenu()}</nav>
      <div class="sidebar__footer">${icons.menu}</div>
    </aside>`;
}

export function renderTopbar() {
  return `
    <header class="topbar">
      <div class="topbar__left"></div>
      <div class="topbar__right">
        <div class="certificate">
          <span>证书到期时间</span>
          <span>2027-01-15</span>
        </div>
        <div class="topbar__actions">
          ${renderButton({ text: "在线客服", tone: "primary", size: "md" })}
          ${renderButton({ text: "医生招聘", tone: "outline-secondary", size: "md" })}
        </div>
        <div class="user-chip">
          <button class="user-chip__body user-menu-trigger" type="button" aria-expanded="false" aria-haspopup="menu">
            <span class="avatar" aria-hidden="true">
              <img src="${assetUrl("assets/figma-home/avatar-source.png")}" alt="" />
            </span>
            <span>张医生</span>
          </button>
          ${renderUserMenu()}
        </div>
      </div>
    </header>`;
}

export function renderUserMenu() {
  return `
    <div class="user-menu" role="menu" aria-hidden="true">
      <button class="user-menu__item" type="button" role="menuitem" data-action="个人中心">个人中心</button>
      <button class="user-menu__item" type="button" role="menuitem" data-action="账号安全">账号安全</button>
      <button class="user-menu__item" type="button" role="menuitem" data-action="消息通知">消息通知</button>
      <div class="user-menu__divider"></div>
      <button class="user-menu__item user-menu__item--danger" type="button" role="menuitem" data-action="退出登录">退出登录</button>
    </div>`;
}

export function renderWaitingCard() {
  return `
    <section class="card card--compact waiting-card" aria-label="当前候诊状态">
      <div class="waiting-card__left">
        <div class="waiting-card__heading">
          <h1 class="card__title">当前候诊状态</h1>
          <p class="waiting-card__label">当前候诊人数</p>
        </div>
        <p class="waiting-card__number" data-waiting-total>${renderRuntime.waitingQueue.total}</p>
        <p class="waiting-card__hint">请及时接诊患者</p>
      </div>
      <div class="waiting-card__right">
        <div class="queue-chip">
          <span class="queue-chip__name">图文问诊</span>
          <span class="queue-chip__value" data-waiting-type="text">${renderRuntime.waitingQueue.byType.text}</span>
        </div>
        <div class="queue-chip">
          <span class="queue-chip__name">视频问诊</span>
          <span class="queue-chip__value" data-waiting-type="video">${renderRuntime.waitingQueue.byType.video}</span>
        </div>
      </div>
    </section>`;
}

export function renderConsultCard() {
  return `
    <button class="consult-card" type="button" aria-label="进入问诊室">
      <img class="consult-card__bg" src="${assetUrl("assets/figma-home/consult-bg.png")}" alt="" aria-hidden="true" />
      <div class="consult-card__content">
        <div class="consult-card__icon">${icons.stethoscope}</div>
        <h2>进入问诊室</h2>
        <p>点击开始接诊患者</p>
      </div>
    </button>`;
}

export function renderRoomCheckbox(label) {
  return renderCheckbox({ label, className: "room-check", labelClassName: "room-check__label" });
}

export function renderRoomFilterButton({ text, type, state, active = false, wide = false }) {
  const dataAttr = type ? `data-filter-type="${type}"` : `data-filter-state="${state}"`;
  return `<button class="jh-btn jh-btn--md jh-btn--outline-secondary room-tag${wide ? " room-tag--wide" : ""}${active ? " is-active" : ""}" type="button" ${dataAttr}>${text}</button>`;
}

export function renderRoomTopbar() {
  return `
    <header class="room-topbar">
      <div class="room-topbar__inner">
        <a class="jh-btn jh-btn--md jh-btn--neutral jh-btn--icon room-back-btn" href="${getHomeHref()}" aria-label="返回首页">
          <img src="${assetUrl("assets/figma-consult/back.svg")}" alt="" />
          <span>返回首页</span>
        </a>
        <div class="room-topbar__right">
          ${renderButton({ text: "在线客服", tone: "primary", size: "md", className: "room-service-btn" })}
          <button class="room-status" type="button" aria-label="出诊状态：${getDoctorStatusLabel()}">
            ${renderStatusBadge(renderRuntime.doctorStatus, "room-status__badge")}
            <span class="room-status__chevron" aria-hidden="true">
              <img src="${assetUrl("assets/figma-consult/chevron-down.svg")}" alt="" />
            </span>
          </button>
          <div class="room-service-switches" aria-label="服务类型">
            <button class="room-service-check${renderRuntime.serviceState.video ? " is-selected" : ""}" type="button" role="checkbox" aria-checked="${Boolean(renderRuntime.serviceState.video)}" data-service-key="video">
              ${renderRoomCheckbox("视频问诊")}
            </button>
            <button class="room-service-check${renderRuntime.serviceState.text ? " is-selected" : ""}" type="button" role="checkbox" aria-checked="${Boolean(renderRuntime.serviceState.text)}" data-service-key="text">
              ${renderRoomCheckbox("图文问诊")}
            </button>
          </div>
          <div class="room-user">
            <span class="room-user__divider" aria-hidden="true">
              <img src="${assetUrl("assets/figma-consult/topbar-divider.svg")}" alt="" />
            </span>
            <button class="room-user__body user-menu-trigger" type="button" aria-expanded="false" aria-haspopup="menu">
              <span class="avatar" aria-hidden="true">
                <img src="${assetUrl("assets/figma-consult/avatar-source.png")}" alt="" />
              </span>
              <span>张医生</span>
            </button>
            ${renderUserMenu()}
          </div>
        </div>
      </div>
    </header>`;
}

export function renderRoomSidebar() {
  const activeRecord =
    appView === "video"
      ? getRecordParam("active-video")
      : appView === "text"
        ? getRecordParam("active-text")
        : appView === "history"
          ? getRecordParam("ended-text")
          : "";
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
        <div class="room-tags room-tags--type">
          ${renderRoomFilterButton({ text: "全部", type: "all", active: true })}
          ${renderRoomFilterButton({ text: "图文", type: "text" })}
          ${renderRoomFilterButton({ text: "视频", type: "video" })}
        </div>
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
  return getMessageListRecords(renderData.consultationRecords, { type, state })
    .map((record, index) => renderMessageItem(record, record.id === activeRecord, index, activeVideoRecordId))
    .join("");
}

export function getActiveVideoConsultationRecordId(activeRecord = "") {
  const urlRecordId = getRecordParam();
  const candidates = [
    activeRecord,
    appView === "video" ? urlRecordId : "",
    renderRuntime.activeVideoConsultationId
  ].filter(Boolean);
  return (
    candidates
      .map((recordId) =>
        renderData.consultationRecords.find((record) => record.id === recordId && record.type === "video" && record.state === "ongoing")
      )
      .find(Boolean)?.id || ""
  );
}

export function renderMessageItem(record, active, index = 0, activeVideoRecordId = "") {
  const badgeKey = renderRuntime.getMessageBadgeKey(record.id);
  const unreadCount = Number(record.unreadCount ?? record.badge ?? 0);
  const showBadge = unreadCount > 0 && !renderRuntime.isMessageBadgeDismissed(record.id);
  const videoLocked =
    !active && record.type === "video" && record.state === "ongoing" && activeVideoRecordId && record.id !== activeVideoRecordId;
  const lockedAttrs = videoLocked
    ? ` aria-disabled="true" data-video-locked="true" title="当前视频问诊未结束，暂不可进入新的视频问诊"`
    : "";
  return `
    <button class="message-item${active ? " is-active" : ""}${videoLocked ? " is-video-locked" : ""}" type="button" data-record-id="${record.id}" data-target-view="${record.targetView || ""}" data-record-state="${record.state}" data-badge-key="${badgeKey}"${lockedAttrs}>
      <span class="message-item__stripe" aria-hidden="true"></span>
      <span class="message-item__body">
        <span class="message-item__meta">
          <span class="message-item__type message-item__type--${record.type}">${record.typeLabel}</span>
          <span class="message-item__time">${record.time}</span>
        </span>
        <span class="message-item__title">${record.title}</span>
        <span class="message-item__preview">${record.preview}</span>
      </span>
      ${showBadge ? `<span class="message-item__badge">${unreadCount}</span>` : ""}
    </button>`;
}

export function getActiveConsultationRecord(type = appView) {
  const recordId = getRecordParam();
  const fallbackId = type === "video" ? "active-video" : "active-text";
  return (
    renderData.consultationRecords.find((record) => record.id === recordId && record.state === "ongoing") ||
    renderData.consultationRecords.find((record) => record.id === fallbackId) ||
    renderData.consultationRecords.find((record) => record.state === "ongoing" && record.type === type)
  );
}

export function renderRoomMain() {
  return `
    <main class="room-main">
      <section class="room-card" aria-label="候诊室">
        ${renderButton({ text: "刷新列表", tone: "outline-secondary", size: "md", className: "room-refresh" })}
        <div class="room-empty">
          <img class="room-empty__icon" src="${assetUrl("assets/room-empty.svg")}" alt="" aria-hidden="true" />
          <div class="room-empty__copy">
            <h2>暂无待接诊订单</h2>
            <p>保持在线后，系统将自动接收新的图文或视频问诊</p>
          </div>
        </div>
      </section>
    </main>`;
}

export function getConsultMainClass() {
  return appView === "text" || appView === "video" ? "text-main" : "room-main";
}

export function renderPrescriptionTraceMain(record = renderData.consultationRecords.find((item) => item.state === "ended")) {
  const mainClass = getConsultMainClass();
  const archivedRecord = normalizeArchivedConsultationRecord(record, renderData.ongoingChatState[record?.id]);
  return `
    <main class="${mainClass}">
      <section class="text-card text-card--readonly" aria-label="历史问诊回看">
        <div class="pharmacy-bar">
          <div class="pharmacy-bar__left">
            <h2>${archivedRecord.title}</h2>
            ${renderReadTag("read", "readonly-seal-tag").replace("已读", "已封存")}
            ${renderLabelTag({ text: `${archivedRecord.typeLabel}问诊`, tone: "focus", size: "lg", className: "risk-tag--medicine medicine-type-tag" })}
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
  return `
    <button class="prescription-trace-card" type="button" data-history-record-id="${archivedRecord.id}" aria-label="查看${archivedRecord.patient}开方历史">
      <span class="prescription-trace-card__head">
        <span>
          <span class="prescription-trace-card__eyebrow">${archivedRecord.typeLabel}问诊已结束</span>
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

export function renderHistoryPage() {
  const recordId = getRecordParam("ended-text");
  const record =
    renderData.consultationRecords.find((item) => item.id === recordId && item.state === "ended") ||
    renderData.consultationRecords.find((item) => item.id === "ended-text");
  const archivedRecord = normalizeArchivedConsultationRecord(record, renderData.ongoingChatState[record?.id]);
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
            <span><em>问诊类型</em><strong>${archivedRecord.typeLabel}问诊</strong></span>
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
      ${renderQuickReplyDialog()}
      ${renderRiskWarningDialog()}
      <div class="toast" role="status" aria-live="polite"></div>
    </div>`;
}

export function renderRoom() {
  return `
    <div class="app-shell room-shell app-shell--responsive">
      ${renderRoomTopbar()}
      ${renderRoomSidebar()}
      ${renderRoomMain()}
      <div class="toast" role="status" aria-live="polite"></div>
    </div>`;
}

export function renderTextMain() {
  const record = getActiveConsultationRecord("text");
  return `
    <main class="text-main">
      <section class="text-card" aria-label="图文问诊">
        <div class="pharmacy-bar">
          <div class="pharmacy-bar__left">
            <h2>${record?.title || "图文问诊"}</h2>
            ${renderRiskTag({ text: "迎检", size: "lg", className: "risk-tag--inspection" })}
            ${renderLabelTag({ text: "中药", tone: "focus", size: "lg", className: "risk-tag--medicine medicine-type-tag" })}
          </div>
          <div class="pharmacy-bar__right">
            ${renderDurationChip("icon", record?.elapsedSeconds ?? 0)}
            ${renderButton({ text: "取消问诊", tone: "danger", size: "md", className: "cancel-consult-trigger" })}
          </div>
        </div>
        <div class="consult-workspace">
          ${renderChatPanel(record?.id)}
          ${renderPrescriptionPanel({ record })}
        </div>
      </section>
    </main>`;
}


export function getActiveChatKey() {
  const recordId = getRecordParam();
  if (recordId && renderData.ongoingChatState[recordId]) return recordId;
  if (appView === "video") return "active-video";
  if (appView === "text") return "active-text";
  return null;
}

export function findOngoingChatMessage(chatKey, messageId) {
  return renderData.ongoingChatState[chatKey]?.messages.find((message) => message.id === messageId);
}

export function renderChatBubble(message) {
  if (message.from === "doctor" && message.recalled) {
    return `
      <div class="chat-bubble chat-bubble--doctor chat-bubble--recalled" data-message-id="${message.id}">
        <p class="chat-bubble__recalled">您撤回了一条消息</p>
      </div>`;
  }

  const isDoctor = message.from === "doctor";
  return `
    <div
      class="chat-bubble chat-bubble--${message.from}${isDoctor ? " chat-bubble--actionable" : ""}"
      data-message-id="${message.id}"
      ${isDoctor ? 'data-chat-context="doctor"' : ""}
    >
      <p>${escapeHtml(message.text)}</p>
    </div>`;
}

export function renderChatThread(chatKey = getActiveChatKey(), { threadClass = "chat-thread" } = {}) {
  const chat = renderData.ongoingChatState[chatKey];
  if (!chat) return "";

  return `
    <div class="${threadClass}" data-chat-key="${chatKey}">
      <p class="chat-date">${chat.sessionDate}</p>
      ${chat.messages.map((message) => renderChatBubble(message)).join("")}
    </div>`;
}

export function renderChatMessageMenu() {
  return `
    <div class="chat-message-menu" role="menu" aria-hidden="true" hidden>
      <button type="button" class="chat-message-menu__item" role="menuitem" data-action="recall">撤回</button>
      <button type="button" class="chat-message-menu__item" role="menuitem" data-action="copy">复制</button>
      <button type="button" class="chat-message-menu__item" role="menuitem" data-action="quote">引用</button>
    </div>`;
}

export function renderChatPanel(chatKey = "active-text") {
  return `
    <section class="chat-panel" aria-label="聊天区域">
      ${renderChatThread(chatKey)}
      <div class="ai-reply">
        <div class="ai-reply__head">
          <span class="ai-spark" aria-hidden="true"></span>
          <h3>智能推荐回复</h3>
        </div>
        ${renderAiReplyOptions([
          "头痛发烧多久啦？体温多少度？",
          "持续几天了？头痛具体位置在哪，程度如何？",
          "这是一串智能回复的文字内容，并且这是一行的最长字符数"
        ])}
        ${renderChatInput()}
      </div>
    </section>`;
}

export const defaultPrescriptionMedicines = [];

export const defaultPatientDetail = {
  weight: "--",
  pregnancy: "--",
  phone: "--",
  liverAbnormal: "--",
  idCard: "--",
  kidneyAbnormal: "--",
  allergies: "--"
};

export function renderPatientInfoGrid(patientDetail = defaultPatientDetail) {
  return `
    <span>体重 /KG：${patientDetail.weight}</span>
    <span>*妊娠哺乳：　${patientDetail.pregnancy}</span>
    <span>手机号：${patientDetail.phone}</span>
    <span>*肝功能异常：　${patientDetail.liverAbnormal}</span>
    <span>证件号：${patientDetail.idCard}</span>
    <span>*肾功能异常：　${patientDetail.kidneyAbnormal}</span>
    <span>过敏史：${patientDetail.allergies}</span>`;
}

export function renderMedicineTableRow(row, readonly = false) {
  const renderEditableBox = (field, label) => {
    const value = row[field] ?? "";
    if (readonly) return `<span class="table-input">${escapeHtml(value)}</span>`;
    return `<input class="table-input medicine-edit-field" type="text" value="${escapeHtml(value)}" aria-label="${label}" data-medicine-field="${field}" />`;
  };

  return `
    <div class="medicine-table__row" data-medicine-index="${row.index}" data-medicine-name="${escapeHtml(row.name)}">
      <span>${row.index}</span>
      <span>${escapeHtml(row.name)}</span>
      <span>${escapeHtml(row.type)}</span>
      ${renderEditableBox("spec", "规格")}
      ${renderEditableBox("usage", "用法")}
      ${renderEditableBox("frequency", "服用频次")}
      ${renderEditableBox("dose", "用量")}
      <span>${escapeHtml(row.quantity)}</span>
      ${renderEditableBox("unit", "单位")}
      ${renderRiskTag({ text: row.risk, size: "sm", className: "risk-small" })}
      ${
        readonly
          ? ""
          : renderButton({ text: "删除", tone: "text", size: "", className: "medicine-delete-btn" })
      }
    </div>`;
}

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function renderDiagnosisTags(tags, readonly = false) {
  return tags
    .map((tag) => {
      const safeTag = escapeHtml(tag);
      return `
        ${
          readonly
            ? `<span class="diagnosis-tag diagnosis-tag--readonly">`
            : `<span class="diagnosis-tag" data-diagnosis-tag="${safeTag}">`
        }
          <span>${safeTag}</span>
          ${
            readonly
              ? ""
              : `<button class="diagnosis-tag__close diagnosis-tag__close-btn" type="button" data-diagnosis-tag="${safeTag}" aria-label="移除诊断：${safeTag}">
                  <img src="${assetUrl("assets/diagnosis-tag-close.svg")}" alt="" />
                </button>`
          }
        </span>`;
    })
    .join("");
}

export function renderDiagnosisSelectInput() {
  return `
    <div class="diagnosis-combobox">
      <input
        class="jh-input-field jh-input-field--lg diagnosis-select diagnosis-select-input"
        type="text"
        aria-label="请选择诊断"
        aria-expanded="false"
        autocomplete="off"
        placeholder="请选择诊断"
      />
      <div class="diagnosis-options" role="listbox" hidden></div>
    </div>`;
}

export function renderPrescriptionPanel(options = {}) {
  const normalized = typeof options === "boolean" ? { includeSecondMedicine: options } : options;
  const { includeSecondMedicine = false, readonly = false, record = null } = normalized;

  const patientName =
    record
      ? `${record.patient}&nbsp;&nbsp;${record.patientGender || ""}&nbsp;&nbsp;${record.age}`
      : "暂无患者信息";
  const patientDetail = record?.patientDetail ? record.patientDetail : defaultPatientDetail;
  const diagnosisTags =
    record
      ? record.diagnosisTags || [record.diagnosis].filter(Boolean)
      : [];
  const medicines =
    record?.prescriptionMedicines?.length
      ? record.prescriptionMedicines
      : defaultPrescriptionMedicines;
  let medicineRows = medicines;
  if (!readonly && includeSecondMedicine && medicines.length === 1) {
    medicineRows = [...medicines, { ...medicines[0], index: 2 }];
  }

  const panelLabel = readonly ? "只读处方信息" : "处方信息";

  return `
    <section class="prescription-panel${readonly ? " prescription-panel--readonly" : ""}" aria-label="${panelLabel}">
      <div class="patient-info">
        <div class="patient-info__name">${patientName}</div>
        <div class="patient-info__grid">${renderPatientInfoGrid(patientDetail)}</div>
      </div>
      <div class="section-divider"></div>
      <div class="diagnosis-section">
        <h3>疾病信息</h3>
        <div class="diagnosis-row">
          <label><span>*</span>诊断</label>
          ${
            readonly
              ? `<span class="jh-input-field jh-input-field--lg diagnosis-select diagnosis-select--readonly" aria-disabled="true">${diagnosisTags[0] || ""}</span>`
              : renderDiagnosisSelectInput()
          }
          <div class="diagnosis-input">
            ${renderDiagnosisTags(diagnosisTags, readonly)}
          </div>
        </div>
      </div>
      <div class="section-divider"></div>
      <div class="medicine-section">
        <h3>所需药品</h3>
        <div class="medicine-scroll-area">
          ${readonly ? "" : renderMedicineSearchCombobox()}
          <div class="medicine-table">
            <div class="medicine-table__row medicine-table__head">
              <span>序号</span><span>药品名称</span><span>类型</span><span>规格</span><span>用法</span><span>服用频次</span><span>用量</span><span>数量</span><span>单位</span><span>风险</span><span>操作</span>
            </div>
            ${medicineRows.map((row) => renderMedicineTableRow(row, readonly)).join("")}
          </div>
        </div>
      </div>
      <div class="prescription-actions${readonly ? " prescription-actions--readonly" : ""}">
        ${
          readonly
            ? `<span class="prescription-actions__hint">已封存，仅支持查看</span>`
            : renderSelectField({ label: "请选择", size: "sm" })
        }
        <div>
          ${
            readonly
              ? renderButton({
                  text: "查看开方历史",
                  tone: "primary",
                  size: "md",
                  className: "prescription-history-open"
                })
              : `${renderButton({ text: "结束问诊", tone: "soft-danger", size: "md", className: "end-consult-trigger", disabled: true })}
          ${renderButton({ text: "提交处方", tone: "primary", size: "md", className: "jh-prescription-submit" })}`
          }
        </div>
      </div>
    </section>`;
}


export function renderTextPage() {
  return `
    <div class="app-shell room-shell text-shell app-shell--responsive">
      ${renderRoomTopbar()}
      ${renderRoomSidebar()}
      ${renderTextMain()}
      ${renderQuickReplyDialog()}
      ${renderRiskWarningDialog()}
      ${renderConsultConfirmDialogs()}
      ${renderChatMessageMenu()}
      <div class="toast" role="status" aria-live="polite"></div>
    </div>`;
}

export const videoMediaState = {
  cameraOn: true,
  micOn: true
};

export function renderVideoMediaIcon(type, enabled) {
  if (type === "camera") {
    return enabled
      ? `<svg class="video-control-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4 7h4l2-2h4l2 2h4a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
          <circle cx="12" cy="13" r="3.2" stroke="currentColor" stroke-width="1.6"/>
        </svg>`
      : `<svg class="video-control-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4 7h4l2-2h4l2 2h4a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
          <path d="m3 3 18 18" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
        </svg>`;
  }

  return enabled
    ? `<svg class="video-control-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3Z" stroke="currentColor" stroke-width="1.6"/>
        <path d="M6 11v1a6 6 0 0 0 12 0v-1" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
        <path d="M12 18v3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
      </svg>`
    : `<svg class="video-control-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M6 11v1a6 6 0 0 0 9.2 5.1" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
        <path d="M12 18v3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
        <path d="m4 4 16 16" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
      </svg>`;
}

export function renderVideoToolbar() {
  const { cameraOn, micOn } = videoMediaState;
  return `
    <div class="video-toolbar" role="toolbar" aria-label="视频通话控制">
      <button
        type="button"
        class="video-toolbar__btn${cameraOn ? "" : " is-off"}"
        data-video-action="toggle-camera"
        aria-pressed="${cameraOn}"
        title="${cameraOn ? "关闭摄像头" : "开启摄像头"}"
        aria-label="${cameraOn ? "关闭摄像头" : "开启摄像头"}"
      >
        ${renderVideoMediaIcon("camera", cameraOn)}
      </button>
      <button
        type="button"
        class="video-toolbar__btn${micOn ? "" : " is-off"}"
        data-video-action="toggle-mic"
        aria-pressed="${micOn}"
        title="${micOn ? "关闭麦克风" : "开启麦克风"}"
        aria-label="${micOn ? "关闭麦克风" : "开启麦克风"}"
      >
        ${renderVideoMediaIcon("mic", micOn)}
      </button>
    </div>`;
}

export function renderVideoChatPanel() {
  const { cameraOn } = videoMediaState;
  const record = getActiveConsultationRecord("video");
  return `
    <section class="chat-panel video-chat-panel" aria-label="视频聊天区域">
      <div class="video-window" data-video-controls="true">
        <img class="video-window__main" src="${assetUrl("assets/video-main.png")}" alt="患者视频画面" />
        <div class="video-window__pip video-window__pip--local${cameraOn ? "" : " is-camera-off"}">
          <video class="video-window__local-video" data-local-camera autoplay muted playsinline aria-label="医生摄像头画面"></video>
          <div class="video-window__camera-status" data-camera-status>正在连接摄像头</div>
          <div class="video-window__pip-off" aria-hidden="${cameraOn}">摄像头已关闭</div>
        </div>
        ${renderVideoToolbar()}
      </div>
      ${renderChatThread(record?.id || "active-video", { threadClass: "video-chat-thread" })}
      <div class="video-input-wrap">
        ${renderChatInput()}
      </div>
    </section>`;
}

export function renderVideoMain() {
  const record = getActiveConsultationRecord("video");
  return `
    <main class="text-main">
      <section class="text-card" aria-label="视频问诊">
        <div class="pharmacy-bar">
          <div class="pharmacy-bar__left">
            <h2>${record?.title || "视频问诊"}</h2>
            ${renderRiskTag({ text: "迎检", size: "lg", className: "risk-tag--inspection" })}
            ${renderLabelTag({ text: "中药", tone: "focus", size: "lg", className: "risk-tag--medicine medicine-type-tag" })}
          </div>
          <div class="pharmacy-bar__right">
            ${renderDurationChip("icon", record?.elapsedSeconds ?? 0)}
            ${renderButton({ text: "取消问诊", tone: "danger", size: "md", className: "cancel-consult-trigger" })}
          </div>
        </div>
        <div class="consult-workspace">
          ${renderVideoChatPanel()}
          ${renderPrescriptionPanel({ record })}
        </div>
      </section>
    </main>`;
}

export function renderVideoPage() {
  return `
    <div class="app-shell room-shell text-shell video-shell app-shell--responsive">
      ${renderRoomTopbar()}
      ${renderRoomSidebar()}
      ${renderVideoMain()}
      ${renderQuickReplyDialog()}
      ${renderRiskWarningDialog()}
      ${renderConsultConfirmDialogs()}
      ${renderChatMessageMenu()}
      <div class="toast" role="status" aria-live="polite"></div>
    </div>`;
}

export function renderServiceCard() {
  return `
    <section class="card card--compact service-card" aria-label="接诊状态与服务开关">
      <h2 class="card__title">接诊状态与服务开关</h2>
        <div class="status-row">
          <div class="status-row__left">
            <span>出诊状态</span>
          ${renderStatusBadge(renderRuntime.doctorStatus)}
        </div>
        ${renderSwitch({ checked: renderRuntime.doctorStatus !== "offline", label: "切换出诊状态" })}
      </div>
      <div class="service-list">
        ${renderData.services
          .map(
            (service) => `
              <button class="service-tile" type="button" role="checkbox" aria-checked="${renderRuntime.serviceState[service.key]}" data-service-key="${service.key}">
                ${renderCheckbox({ label: service.label })}
              </button>`
          )
          .join("")}
      </div>
    </section>`;
}

export function renderNoticeCard() {
  return `
    <section class="card notice-card" aria-label="最新公告">
      <div class="notice-card__inner">
        <div class="notice-card__head">
          <div class="notice-card__title-row">
            <h2 class="card__title">最新公告</h2>
            <span class="notice-card__date">${renderData.latestAnnouncement.date}</span>
          </div>
          <div class="divider"></div>
        </div>
        <article class="announcement">
          <div class="announcement__top">
            <div class="announcement__title-row">
              <h3 class="announcement__title">${renderData.latestAnnouncement.title}</h3>
              ${renderReadTag("unread", "announcement-tag")}
            </div>
            <div class="announcement__body">${renderData.latestAnnouncement.content.split("\n").slice(0, 2).join("\n")}
<button class="announcement__detail-trigger" type="button" data-announcement-id="${renderData.latestAnnouncement.id}">……展开详情</button></div>
          </div>
          <p class="announcement__footer">${renderData.latestAnnouncement.publisher}</p>
        </article>
        ${renderButton({ text: "查看全部公告", tone: "block-outline", size: "", className: "announcement-list-trigger" })}
      </div>
    </section>`;
}

export function renderAnnouncementDialog() {
  return `
    <div class="announcement-overlay" aria-hidden="true">
      <section class="announcement-dialog" role="dialog" aria-modal="true" aria-labelledby="announcement-dialog-title">
        <header class="announcement-dialog__header">
          <h2 id="announcement-dialog-title">公告详情</h2>
          <button class="announcement-dialog__close" type="button" aria-label="关闭公告详情">
            <img src="${assetUrl("assets/quick-reply-close.svg")}" alt="" aria-hidden="true" />
          </button>
        </header>
        <div class="announcement-dialog__body">
          <div class="announcement-dialog__meta">
            <h3>${renderData.latestAnnouncement.title}</h3>
            <span>${renderData.latestAnnouncement.date}</span>
          </div>
          <p>${renderData.latestAnnouncement.content}</p>
          <div class="announcement-dialog__publisher">${renderData.latestAnnouncement.publisher}</div>
        </div>
      </section>
    </div>`;
}

export function renderAnnouncementListDialog() {
  return `
    <div class="announcement-list-overlay" aria-hidden="true">
      <section class="announcement-list-dialog" role="dialog" aria-modal="true" aria-labelledby="announcement-list-title">
        <header class="announcement-dialog__header">
          <h2 id="announcement-list-title">全部公告</h2>
          <button class="announcement-list-dialog__close announcement-dialog__close" type="button" aria-label="关闭全部公告">
            <img src="${assetUrl("assets/quick-reply-close.svg")}" alt="" aria-hidden="true" />
          </button>
        </header>
        <div class="announcement-list-dialog__body">
          ${renderData.announcements
            .map(
              (announcement) => `
                <button class="announcement-list-item" type="button" data-announcement-id="${announcement.id}">
                  <span class="announcement-list-item__main">
                    <span class="announcement-list-item__title">
                      ${announcement.title}
                      ${announcement.unread ? renderReadTag("unread", "announcement-list-item__tag") : renderReadTag("read", "announcement-list-item__tag")}
                    </span>
                    <span class="announcement-list-item__summary">${announcement.content.split("\n")[0]}</span>
                  </span>
                  <span class="announcement-list-item__date">${announcement.date}</span>
                </button>`
            )
            .join("")}
        </div>
      </section>
    </div>`;
}

export function renderQuickEntryDialog() {
  return `
    <div class="quick-entry-overlay" aria-hidden="true">
      <section class="quick-entry-dialog" role="dialog" aria-modal="true" aria-labelledby="quick-entry-title">
        <header class="announcement-dialog__header">
          <h2 id="quick-entry-title">添加快捷入口</h2>
          <button class="quick-entry-dialog__close announcement-dialog__close" type="button" aria-label="关闭添加快捷入口">
            <img src="${assetUrl("assets/quick-reply-close.svg")}" alt="" aria-hidden="true" />
          </button>
        </header>
        <div class="quick-entry-dialog__body">
          ${renderData.quickEntryOptions
            .map(
              (option, index) => `
                <button class="quick-entry-option" type="button" data-option-index="${index}">
                  <span class="icon-box">${icons[option.icon]}</span>
                  <span class="quick-entry-option__copy">
                    <span class="quick-entry-option__title">${option.title}</span>
                    <span class="quick-entry-option__desc">${option.desc}</span>
                  </span>
                </button>`
            )
            .join("")}
        </div>
      </section>
    </div>`;
}

export function renderQuickActions() {
  return `
    <section class="card quick-entry-card" aria-label="高频操作入口">
      <h2 class="card__title">高频操作入口</h2>
      <div class="quick-grid">
        ${renderData.quickActions
          .map(
            (action) => `
              <button class="quick-card${action.isAdd ? " quick-card--add" : ""}" type="button" data-action="${action.desc}">
                <span class="quick-card__body">
                  <span class="icon-box">${icons[action.icon]}</span>
                  ${
                    action.title
                      ? `<span class="quick-card__title">${action.title}</span>`
                      : ""
                  }
                  <span class="quick-card__desc">${action.desc}</span>
                </span>
              </button>`
          )
          .join("")}
      </div>
    </section>`;
}

export function renderMain() {
  return `
    <main class="main">
      <div class="content-stack">
        <div class="row row--top">
          ${renderWaitingCard()}
          ${renderConsultCard()}
          ${renderServiceCard()}
        </div>
        <div class="row row--bottom">
          ${renderNoticeCard()}
          ${renderQuickActions()}
        </div>
        <footer class="footer">嘉虹健康　copyright © 2017-2026　鄂ICP备2024037712号-1</footer>
      </div>
    </main>`;
}

export function renderAppMarkup() {
  return appView === "room"
    ? renderRoom()
    : appView === "text"
      ? renderTextPage()
      : appView === "video"
        ? renderVideoPage()
        : appView === "history"
          ? renderHistoryPage()
    : `
    <div class="app-shell app-shell--responsive">
      ${renderTopbar()}
      ${renderSidebar()}
      ${renderMain()}
      ${renderAnnouncementDialog()}
      ${renderAnnouncementListDialog()}
      ${renderQuickEntryDialog()}
      <div class="toast" role="status" aria-live="polite"></div>
    </div>`;
}
