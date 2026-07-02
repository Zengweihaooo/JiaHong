import { assetUrl } from "../../shared/core.js";
import { renderData } from "../../application/viewModels/renderViewModel.js?v=20260528-06";
import { renderButton } from "../components/primitives.js";
import { escapeHtml } from "../ui/html.js";
import { getActiveChatKey } from "./renderRecordSelectors.js?v=20260528-06";
import { renderChatQuoteBubbleMarkup } from "../ui/chatComposerUi.js";

const defaultMessageIntervalSeconds = 58;
const defaultAiReplyHighlights = ["多久", "体温", "几天", "位置", "程度", "痰色", "胸闷气促", "呼吸", "低头", "热敷", "活动颈部"];
const followUpVoucherVariants = ["image", "voice", "mixed"];
const followUpVoucherImages = [
  { title: "病例图片1", image: "assets/consult-materials/allergic-rhinitis.png" },
  { title: "病例图片2", image: "assets/consult-materials/pediatric-fever.png" },
  { title: "病例图片3", image: "assets/consult-materials/sore-throat.png" },
  { title: "病例图片4", image: "assets/consult-materials/skin-rash.png" }
];
const followUpVoucherVoices = [
  { title: "病例语音1", duration: 8 },
  { title: "病例语音2", duration: 7 }
];
const defaultConsultCaseVoices = [{ title: "病例信息语音", duration: 7 }];

export function renderChatInput({ className = "", showSmartReplyTrigger = true } = {}) {
  const toolbarMarkup = showSmartReplyTrigger
    ? `<div class="chat-reply-toolbar">
        ${renderButton({ text: "智能推荐回复", tone: "outline-primary", className: "smart-reply-trigger", size: "sm" })}
        ${renderButton({ text: "快捷回复", tone: "outline-primary", className: "quick-reply-trigger", size: "sm" })}
      </div>`
    : renderButton({ text: "快捷回复", tone: "outline-primary", className: "quick-reply-trigger", size: "sm" });
  return `
    <div class="jh-chat-input${className ? ` ${className}` : ""}">
      <div class="jh-chat-input__top">
        <div class="chat-composer-preview" hidden></div>
        ${toolbarMarkup}
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
      <div class="ai-reply__panel">
        <div class="ai-reply__head">
          <button class="ai-reply__title ai-reply__toggle" type="button" aria-label="展开智能推荐回复" aria-expanded="false">
            <span class="ai-spark" aria-hidden="true"></span>
            <h3>智能推荐回复</h3>
          </button>
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
      </div>
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
  const quoteMarkup = renderChatQuoteBubbleMarkup(message.quote);
  const editedMarkup = message.edited ? `<span class="chat-bubble__edited">已编辑</span>` : "";
  const bubble = `
      <div
        class="chat-bubble chat-bubble--${message.from}${isDoctor ? " chat-bubble--actionable" : " chat-bubble--actionable"}"
        data-message-id="${message.id}"
        data-message-from="${message.from}"
        ${isDoctor ? 'data-chat-context="doctor"' : 'data-chat-context="patient"'}
      >
        ${quoteMarkup}
        <p class="chat-bubble__text">${escapeHtml(message.text)}</p>
        ${editedMarkup}
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
  const voucher = getFollowUpVoucher(record);
  const hasConsultInfo = Boolean(record?.consultInfo);
  const hasConsultAttachments = Array.isArray(record.consultInfo?.attachments) && record.consultInfo.attachments.length > 0;
  const defaultConsultAttachments = [
    { title: "附件1", image: "assets/consult-materials/allergic-rhinitis.png" },
    { title: "附件2", image: "assets/consult-materials/pediatric-fever.png" },
    { title: "附件3", image: "assets/consult-materials/sore-throat.png" },
    { title: "附件4", image: "assets/consult-materials/skin-rash.png" }
  ];
  const attachments = [
    ...(hasConsultAttachments ? record.consultInfo.attachments : record?.type === "consult" ? defaultConsultAttachments : []),
    ...(voucher?.images || [])
  ];
  const normalizeVoices = (voices = [], fallback = []) => {
    const source = Array.isArray(voices) && voices.length ? voices : fallback;
    return source.map((voice, index) =>
      typeof voice === "string"
        ? { title: voice, duration: index === 0 ? 8 : 7 }
        : { title: voice.title || `语音${index + 1}`, duration: Number(voice.duration || 0) || (index === 0 ? 8 : 7) }
    );
  };
  const caseVoices = [
    ...normalizeVoices(record.consultInfo?.caseVoices, record?.type === "consult" || hasConsultInfo ? defaultConsultCaseVoices : []),
    ...normalizeVoices(voucher?.voices || [])
  ];
  return {
    description: record.consultInfo?.description || (record?.type === "consult" ? "颈部酸痛僵硬，转头活动受限，久坐后痛感加重" : ""),
    caseVoices,
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

export function getFollowUpVoucher(record = {}) {
  const source = record?.followUpVoucher;
  if (!source) return null;
  const hasImages = Array.isArray(source.images) && source.images.length > 0;
  const hasVoices = Array.isArray(source.voices) && source.voices.length > 0;
  const inferredType = hasImages && hasVoices ? "mixed" : hasImages ? "image" : hasVoices ? "voice" : "";
  const type = followUpVoucherVariants.includes(source.type) ? source.type : inferredType;
  if (!type) return null;
  const images = hasImages ? source.images : followUpVoucherImages;
  const voices = hasVoices ? source.voices : followUpVoucherVoices;
  return {
    type,
    images: type === "voice" ? [] : images.slice(0, 4),
    voices: type === "image" ? [] : voices.slice(0, 2)
  };
}

function renderVoiceWaveform() {
  return `
    <span class="followup-voice-wave" aria-hidden="true">
      <svg class="followup-voice-wave__icon" viewBox="0 0 24 24" focusable="false">
        <circle class="followup-voice-wave__base" cx="6" cy="12" r="2.1" />
        <path class="followup-voice-wave__base" d="M10 8.8c1.1.8 1.8 1.9 1.8 3.2s-.7 2.4-1.8 3.2" />
        <path class="followup-voice-wave__base" d="M13.2 6.2c1.9 1.4 3 3.4 3 5.8s-1.1 4.4-3 5.8" />
        <path class="followup-voice-wave__base" d="M16.5 3.8c2.7 2 4.2 4.8 4.2 8.2s-1.5 6.2-4.2 8.2" />
        <circle class="followup-voice-wave__active followup-voice-wave__active--1" cx="6" cy="12" r="2.1" />
        <path class="followup-voice-wave__active followup-voice-wave__active--1" d="M10 8.8c1.1.8 1.8 1.9 1.8 3.2s-.7 2.4-1.8 3.2" />
        <path class="followup-voice-wave__active followup-voice-wave__active--2" d="M13.2 6.2c1.9 1.4 3 3.4 3 5.8s-1.1 4.4-3 5.8" />
        <path class="followup-voice-wave__active followup-voice-wave__active--3" d="M16.5 3.8c2.7 2 4.2 4.8 4.2 8.2s-1.5 6.2-4.2 8.2" />
      </svg>
    </span>`;
}

function renderFollowUpVoucherImage(image, index, total) {
  return `
    <button class="followup-voucher-image followup-voucher-item followup-voucher-item--unviewed consult-attachment" type="button" aria-label="未读病例附件：预览${escapeHtml(image.title)}" data-followup-voucher-item="true" data-followup-voucher-status="unviewed" data-consult-attachment-index="${index + 1}" data-consult-attachment-total="${total}" data-consult-attachment-title="${escapeHtml(image.title)}" data-consult-attachment-image="${assetUrl(image.image || "assets/figma-consult/attachment-preview.png")}">
      <span class="followup-voucher-image__thumb">
        <img src="${assetUrl(image.image || "assets/figma-consult/attachment-preview.png")}" alt="${escapeHtml(image.title)}" loading="lazy" />
      </span>
    </button>`;
}

function renderFollowUpVoucherVoice(voice, index) {
  const duration = Number(voice.duration || 0) || (index === 0 ? 8 : 7);
  const title = voice.title || `病例语音${index + 1}`;
  return `
    <button class="followup-voucher-voice followup-voucher-item followup-voucher-item--unviewed" type="button" aria-label="播放${escapeHtml(title)}，${duration}秒" aria-pressed="false" data-followup-voucher-item="true" data-followup-voucher-status="unviewed" data-followup-voice-title="${escapeHtml(title)}" data-followup-voice-duration="${duration}">
      <span class="followup-voice-time">
        <span data-followup-voice-current>${duration}"</span>
      </span>
      ${renderVoiceWaveform()}
    </button>`;
}

export function renderConsultInfoCard(record) {
  if (record?.type !== "consult" && !record?.consultInfo && !getFollowUpVoucher(record)) return "";
  const consultInfo = getConsultInfo(record);
  return `
    <section class="consult-info-card" aria-label="咨询信息">
      <h3>咨询信息</h3>
      ${
        consultInfo.description
          ? `<div class="consult-info-card__row">
              <span class="consult-info-card__label">病情描述：</span>
              <p>${escapeHtml(consultInfo.description)}</p>
            </div>`
          : ""
      }
      ${
        consultInfo.attachments.length || consultInfo.caseVoices.length
          ? `<div class="consult-info-card__row">
              <span class="consult-info-card__label">病例信息：</span>
              <div class="consult-info-card__content">
                ${
                  consultInfo.attachments.length
                    ? `<div class="consult-attachments">
                        ${consultInfo.attachments
                          .map(
                            (attachment, index) => `
                              <button class="consult-attachment consult-attachment--unread" type="button" aria-label="未读病例附件：预览${escapeHtml(attachment.title)}" data-consult-attachment-status="unread" data-consult-attachment-index="${index + 1}" data-consult-attachment-total="${consultInfo.attachments.length}" data-consult-attachment-title="${escapeHtml(attachment.title)}" data-consult-attachment-image="${assetUrl(attachment.image)}">
                                <span class="consult-attachment__thumb">
                                  <img src="${assetUrl(attachment.image)}" alt="${escapeHtml(attachment.title)}" loading="lazy" />
                                </span>
                              </button>`
                          )
                          .join("")}
                      </div>`
                    : ""
                }
                ${
                  consultInfo.caseVoices.length
                    ? `<div class="consult-info-card__voices" aria-label="病例信息语音">
                        ${consultInfo.caseVoices.map((voice, index) => renderFollowUpVoucherVoice(voice, index)).join("")}
                      </div>`
                    : ""
                }
              </div>
            </div>`
          : ""
      }
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
      <button type="button" class="chat-message-menu__item chat-message-menu__item--doctor-only" role="menuitem" data-action="recall">撤回</button>
      <button type="button" class="chat-message-menu__item chat-message-menu__item--doctor-only" role="menuitem" data-action="edit">编辑</button>
      <button type="button" class="chat-message-menu__item" role="menuitem" data-action="copy">复制</button>
      <button type="button" class="chat-message-menu__item" role="menuitem" data-action="quote">引用</button>
    </div>`;
}

export function renderChatPanel(chatKey = getActiveChatKey(), { record = null } = {}) {
  return `
    <section class="chat-panel" aria-label="聊天区域">
      <div class="chat-panel__body">
        ${renderConsultInfoCard(record)}
        ${renderChatThread(chatKey)}
      </div>
      <div class="chat-panel__composer">
        ${renderAiReplyComposer(record)}
      </div>
    </section>`;
}
