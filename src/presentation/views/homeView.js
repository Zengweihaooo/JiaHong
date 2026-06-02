import { assetUrl } from "../../shared/core.js";
import { renderData, renderRuntime } from "../../application/viewModels/renderViewModel.js?v=20260528-06";
import {
  renderButton,
  renderCheckbox,
  renderReadTag,
  renderStatusBadge,
  renderSwitch
} from "../components/primitives.js";
import { icons, renderQuickEntryIcon } from "../ui/icons.js";
import { renderQuickCardMarkup } from "../components/quickEntryCards.js";
import { renderSchedulePanel } from "./homeSchedulePanel.js";
import { maxQuickActionCards } from "../../domain/quickEntries.js";

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
        <div class="queue-chip">
          <span class="queue-chip__name">图文咨询</span>
          <span class="queue-chip__value" data-waiting-type="consult">${renderRuntime.waitingQueue.byType.consult}</span>
        </div>
      </div>
    </section>`;
}

export function renderConsultCard() {
  const hasWaitingQueue = Number(renderRuntime.waitingQueue?.total || 0) > 0;
  return `
    <button class="consult-card${hasWaitingQueue ? " consult-card--has-queue" : ""}" type="button" aria-label="进入问诊室">
      <img class="consult-card__bg" src="${assetUrl("assets/figma-home/consult-bg.png")}" alt="" aria-hidden="true" />
      <div class="consult-card__content">
        <div class="consult-card__icon">${icons.stethoscope}</div>
        <h2>进入问诊室</h2>
        <p>点击开始接诊患者</p>
      </div>
    </button>`;
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
                  <span class="icon-box">${renderQuickEntryIcon(option.icon)}</span>
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

function renderQuickEntryCardEditButton() {
  return `
    <button class="quick-entry-card__edit" type="button" aria-label="编辑高频操作入口" aria-pressed="false">
      <span class="quick-entry-card__edit-icon" aria-hidden="true"></span>
      <span class="quick-entry-card__edit-text">编辑</span>
    </button>`;
}

export function renderQuickActions() {
  const quickActions = normalizeQuickActions(renderData.quickActions);
  return `
    <section class="card quick-entry-card" aria-label="高频操作入口">
      <div class="quick-entry-card__header">
        <h2 class="card__title">高频操作入口</h2>
        ${renderQuickEntryCardEditButton()}
      </div>
      <div class="quick-grid">
        ${quickActions
          .map((action) => renderQuickCardMarkup(action))
          .join("")}
      </div>
      ${renderSchedulePanel()}
    </section>`;
}

export function normalizeQuickActions(actions = []) {
  const customActions = actions.filter((action) => !action?.isAdd);
  if (customActions.length >= maxQuickActionCards) return customActions.slice(0, maxQuickActionCards);
  return [
    ...customActions.slice(0, maxQuickActionCards),
    {
      title: "",
      desc: "添加快捷入口",
      icon: "plus",
      isAdd: true
    }
  ];
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
