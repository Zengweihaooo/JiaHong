import { assetUrl } from "../../shared/core.js";
import { renderData } from "../../application/viewModels/renderViewModel.js?v=20260528-06";
import { renderButton } from "../components/primitives.js";
import { escapeHtml } from "../ui/html.js";
import { getActiveChatKey } from "./renderRecordSelectors.js?v=20260528-06";

const defaultMessageIntervalSeconds = 58;
const defaultAiReplyHighlights = ["多久", "体温", "几天", "位置", "程度", "痰色", "胸闷气促", "呼吸", "低头", "热敷", "活动颈部"];

export function renderChatInput({ className = "" } = {}) {
  return `
    <div class="jh-chat-input${className ? ` ${className}` : ""}">
      <div class="jh-chat-input__top">
        <textarea aria-label="回复内容" placeholder="输入回复内容，或点击上方AI推荐快速填充..."></textarea>
      </div>
      <div class="jh-chat-input__actions">
        ${renderButton({ text: "发送", tone: "primary", size: "md" })}
      </div>
    </div>`;
}

export function renderAiReplyOptions(options = []) {
  const layoutTextThreshold = "这是一串智能回复的文字内容，并且这是一行的最长字符数".length;
  const normalizedOptions = options.map((option) =>
    typeof option === "string"
      ? { text: option, tag: "", highlights: getAiReplyHighlights(option) }
      : { text: option.text || "", tag: option.tag || "", highlights: option.highlights || getAiReplyHighlights(option.text || "") }
  );
  const maxTextLength = Math.max(0, ...normalizedOptions.map((option) => option.text.length));
  const layoutClass = maxTextLength >= layoutTextThreshold ? " ai-reply__options--long" : "";
  return `
    <div class="ai-reply__options${layoutClass}" data-layout-threshold="${layoutTextThreshold}">
      ${normalizedOptions
        .map((option) =>
          `<button class="jh-btn jh-btn--md jh-btn--outline-primary jh-btn--ai-pill" type="button" data-reply-text="${escapeHtml(option.text)}">
            <span class="jh-btn--ai-pill__text">${renderAiReplyText(option.text, option.highlights)}</span>
            ${option.tag ? `<span class="jh-btn--ai-pill__tag">${escapeHtml(option.tag)}</span>` : ""}
          </button>`
        )
        .join("")}
    </div>`;
}

function getAiReplyHighlights(text = "") {
  return defaultAiReplyHighlights.filter((keyword) => String(text).includes(keyword));
}

function renderAiReplyText(text = "", highlights = []) {
  const source = String(text);
  const matches = highlights
    .map((keyword) => {
      const value = String(keyword || "");
      return value ? { keyword: value, index: source.indexOf(value) } : null;
    })
    .filter((match) => match && match.index >= 0)
    .sort((a, b) => a.index - b.index || b.keyword.length - a.keyword.length)
    .reduce((result, match) => {
      const previous = result[result.length - 1];
      if (previous && match.index < previous.index + previous.keyword.length) return result;
      return [...result, match];
    }, []);

  if (!matches.length) return escapeHtml(source);

  let cursor = 0;
  return matches
    .map((match) => {
      const before = source.slice(cursor, match.index);
      const highlighted = source.slice(match.index, match.index + match.keyword.length);
      cursor = match.index + match.keyword.length;
      return `${escapeHtml(before)}<strong class="jh-btn--ai-pill__keyword">${escapeHtml(highlighted)}</strong>`;
    })
    .join("") + escapeHtml(source.slice(cursor));
}

function getAiReplies(record = null) {
  if (record?.type === "consult") {
    return [
      { text: "考虑颈部肌肉劳损，多休息少低头", tag: "休息姿势" },
      { text: "颈椎姿势不良引发不适，局部热敷缓解", tag: "热敷缓解" },
      { text: "颈肩筋膜炎，避免久坐适当活动颈部", tag: "活动建议" }
    ];
  }
  if (record?.type === "video") {
    return [
      { text: "我先看一下您的咳嗽情况，请把镜头对准面部", tag: "视频确认" },
      { text: "请描述痰色、体温和胸闷气促情况", tag: "症状追问" },
      { text: "如果呼吸明显费力，建议尽快线下就诊", tag: "风险提示" }
    ];
  }
  return [
    { text: "头痛发烧多久啦？体温多少度？", tag: "时间体温", highlights: ["多久", "体温"] },
    { text: "持续几天了？头痛具体位置在哪，程度如何？", tag: "位置程度", highlights: ["几天", "位置", "程度"] },
    { text: "这是一串智能回复的文字内容，并且这是一行的最长字符数", tag: "语义简介" }
  ];
}

export function renderAiReplyComposer(record = null) {
  return `
    <div class="ai-reply ai-reply--collapsed" data-ai-reply-state="collapsed">
      <div class="ai-reply__head">
        <div class="ai-reply__title">
          <span class="ai-spark" aria-hidden="true"></span>
          <h3>智能推荐回复</h3>
          ${renderButton({ text: "智能回复", tone: "outline-primary", className: "quick-reply-trigger", size: "sm" })}
        </div>
        <p class="ai-reply__hint">双击智能回复展开或收起智能回复</p>
        <div class="ai-reply__actions">
          <button class="ai-reply__refresh" type="button" aria-label="换一批智能推荐回复">
            <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
              <path d="M13.4 5.8A5.5 5.5 0 0 0 3.1 4.2L1.5 5.8M1.5 2.4v3.4h3.4M2.6 10.2a5.5 5.5 0 0 0 10.3 1.6l1.6-1.6m0 3.4v-3.4h-3.4" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.4"/>
            </svg>
            <span>换一批</span>
          </button>
          <button class="ai-reply__close" type="button" aria-label="关闭智能推荐回复">
            <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
              <path d="M4 4l8 8M12 4l-8 8" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.4"/>
            </svg>
          </button>
        </div>
      </div>
      ${renderAiReplyOptions(getAiReplies(record))}
      <p class="ai-reply__notice">AI辅助内容基于患者档案与对话语境生成，仅供医生参考，发送前请核实。</p>
      ${renderChatInput()}
    </div>`;
}

export function findOngoingChatMessage(chatKey, messageId) {
  return renderData.ongoingChatState[chatKey]?.messages.find((message) => message.id === messageId);
}

function parseMessageDate(value = "") {
  if (!value) return null;
  const normalized = String(value).replace(" ", "T");
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatChatTime(date = new Date()) {
  const pad = (value) => String(value).padStart(2, "0");
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function formatChatDateTime(date = new Date()) {
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${formatChatTime(date)}`;
}

function getMessageDate(message = {}, chat = {}, index = 0) {
  const explicitDate = parseMessageDate(message.time || message.sentAt || message.createdAt);
  if (explicitDate) return explicitDate;
  const sessionDate = parseMessageDate(chat.sessionDate);
  if (!sessionDate) return null;
  return new Date(sessionDate.getTime() + index * defaultMessageIntervalSeconds * 1000);
}

function getDoctorReadState(message = {}, messages = [], index = 0) {
  if (message.readStatus === "read" || message.read === true) return "read";
  if (message.readStatus === "unread" || message.read === false) return "unread";
  return messages.slice(index + 1).some((item) => item.from === "patient") ? "read" : "unread";
}

function renderMessageTimeMeta(message, context, senderLabel) {
  const sentDate = getMessageDate(message, context.chat, context.index);
  const timeLabel = sentDate ? formatChatTime(sentDate) : "";
  const fullTimeLabel = sentDate ? formatChatDateTime(sentDate) : "";
  if (!timeLabel) return "";
  return `
    <div class="chat-message__meta" aria-label="${senderLabel}消息发送时间：${fullTimeLabel}">
      <time class="chat-message__time" datetime="${fullTimeLabel}" title="${fullTimeLabel}">${timeLabel}</time>
    </div>`;
}

function renderDoctorReadReceipt(message, context) {
  const readState = getDoctorReadState(message, context.messages, context.index);
  const label = readState === "read" ? "已读" : "未读";
  return `<span class="chat-message__read-state chat-message__read-state--${readState}" aria-label="医生消息状态：${label}">${label}</span>`;
}

export function renderChatBubble(message, context = {}) {
  if (message.from === "doctor" && message.recalled) {
    return `
      <div class="chat-message chat-message--doctor">
        ${renderMessageTimeMeta(message, context, "医生")}
        <div class="chat-bubble chat-bubble--doctor chat-bubble--recalled" data-message-id="${message.id}">
          <p class="chat-bubble__recalled">您撤回了一条消息</p>
        </div>
        ${renderDoctorReadReceipt(message, context)}
      </div>`;
  }

  const isDoctor = message.from === "doctor";
  const bubble = `
      <div
        class="chat-bubble chat-bubble--${message.from}${isDoctor ? " chat-bubble--actionable" : ""}"
        data-message-id="${message.id}"
        ${isDoctor ? 'data-chat-context="doctor"' : ""}
      >
        <p>${escapeHtml(message.text)}</p>
      </div>`;
  return isDoctor
    ? `
      <div class="chat-message chat-message--doctor">
        ${renderMessageTimeMeta(message, context, "医生")}
        ${bubble}
        ${renderDoctorReadReceipt(message, context)}
      </div>`
    : `
      <div class="chat-message chat-message--patient">
        ${renderMessageTimeMeta(message, context, "患者")}
        ${bubble}
      </div>`
}

export function renderChatThread(chatKey = getActiveChatKey(), { threadClass = "chat-thread" } = {}) {
  const chat = renderData.ongoingChatState[chatKey];
  if (!chat) return "";

  return `
    <div class="${threadClass}" data-chat-key="${chatKey}">
      <p class="chat-date">${chat.sessionDate}</p>
      ${chat.messages
        .map((message, index) =>
          renderChatBubble(message, {
            chat,
            index,
            messages: chat.messages
          })
        )
        .join("")}
    </div>`;
}

function getConsultInfo(record = {}) {
  const attachments = record.consultInfo?.attachments?.length
    ? record.consultInfo.attachments
    : [
        { title: "附件1", image: "assets/consult-materials/allergic-rhinitis.png" },
        { title: "附件2", image: "assets/consult-materials/pediatric-fever.png" },
        { title: "附件3", image: "assets/consult-materials/sore-throat.png" },
        { title: "附件4", image: "assets/consult-materials/skin-rash.png" }
      ];
  return {
    description: record.consultInfo?.description || "颈部酸痛僵硬，转头活动受限，久坐后痛感加重",
    attachments: attachments.map((attachment, index) =>
      typeof attachment === "string"
        ? {
            title: attachment,
            image: "assets/figma-consult/attachment-preview.png"
          }
        : {
            title: attachment.title || `附件${index + 1}`,
            image: attachment.image || "assets/figma-consult/attachment-preview.png"
          }
    )
  };
}

export function renderConsultInfoCard(record) {
  if (record?.type !== "consult") return "";
  const consultInfo = getConsultInfo(record);
  return `
    <section class="consult-info-card" aria-label="咨询信息">
      <h3>咨询信息</h3>
      <div class="consult-info-card__row">
        <span class="consult-info-card__label">病情描述：</span>
        <p>${escapeHtml(consultInfo.description)}</p>
      </div>
      <div class="consult-info-card__row">
        <span class="consult-info-card__label">病例信息：</span>
        <div class="consult-attachments">
          ${consultInfo.attachments
            .map(
              (attachment, index) => `
                <button class="consult-attachment" type="button" aria-label="预览${escapeHtml(attachment.title)}" data-consult-attachment-index="${index + 1}" data-consult-attachment-total="${consultInfo.attachments.length}" data-consult-attachment-title="${escapeHtml(attachment.title)}" data-consult-attachment-image="${assetUrl(attachment.image)}">
                  <span class="consult-attachment__thumb">
                    <img src="${assetUrl(attachment.image)}" alt="${escapeHtml(attachment.title)}" loading="lazy" />
                  </span>
                </button>`
            )
            .join("")}
        </div>
      </div>
    </section>`;
}

export function renderConsultAttachmentDialog() {
  return `
    <div class="consult-attachment-overlay" role="dialog" aria-modal="true" aria-hidden="true">
      <div class="consult-attachment-dialog">
        <div class="consult-attachment-dialog__header">
          <h2>
            <span class="consult-attachment-dialog__icon" aria-hidden="true"></span>
            <span data-consult-attachment-dialog-title>附件1</span>
          </h2>
          <button class="consult-attachment-dialog__close" type="button" aria-label="关闭附件预览"></button>
        </div>
        <div class="consult-attachment-dialog__body">
          <img class="consult-attachment-dialog__image" src="${assetUrl("assets/figma-consult/attachment-preview.png")}" alt="附件预览" />
          <span class="consult-attachment-dialog__scrub consult-attachment-dialog__scrub--prev" aria-hidden="true"></span>
          <span class="consult-attachment-dialog__scrub consult-attachment-dialog__scrub--next" aria-hidden="true"></span>
          <span class="consult-attachment-dialog__scrub consult-attachment-dialog__scrub--pager" aria-hidden="true"></span>
          <span class="consult-attachment-dialog__pager" data-consult-attachment-dialog-pager>1/4</span>
          <button class="consult-attachment-dialog__page consult-attachment-dialog__page--prev" type="button" aria-label="上一页"></button>
          <button class="consult-attachment-dialog__page consult-attachment-dialog__page--next" type="button" aria-label="下一页"></button>
        </div>
      </div>
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

export function renderChatPanel(chatKey = getActiveChatKey(), { record = null } = {}) {
  return `
    <section class="chat-panel" aria-label="聊天区域">
      ${renderConsultInfoCard(record)}
      ${renderChatThread(chatKey)}
      ${renderAiReplyComposer(record)}
    </section>`;
}
