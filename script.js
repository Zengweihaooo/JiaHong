const assetUrl = (path) => new URL(path, document.currentScript.src).href;
const siteBasePath = new URL(".", document.currentScript.src).pathname.replace(/\/$/, "");
const fixedDesignWidth = 1440;
const validAppModes = new Set(["responsive", "fixed-left", "fixed-center"]);
const validAppViews = new Set(["home", "room", "text", "video"]);

function getCurrentRoutePath() {
  const normalized = location.pathname.replace(/\/+$/, "") || "/";
  const base = siteBasePath || "";
  if (base && normalized.startsWith(base)) {
    const rest = normalized.slice(base.length) || "/";
    return rest.startsWith("/") ? rest : `/${rest}`;
  }
  return normalized;
}

function inferAppMode() {
  const currentPath = getCurrentRoutePath();
  if (currentPath.startsWith("/2/") || currentPath === "/2") {
    return "fixed-left";
  }
  if (currentPath.startsWith("/3/") || currentPath === "/3") {
    return "fixed-center";
  }
  return "responsive";
}

function inferAppView() {
  const currentPath = getCurrentRoutePath();
  if (currentPath.includes("/video")) return "video";
  if (currentPath.includes("/text")) return "text";
  if (currentPath.includes("/room")) return "room";
  return "home";
}

const requestedAppMode = window.JH_APP_MODE || inferAppMode();
const appMode = validAppModes.has(requestedAppMode) ? requestedAppMode : inferAppMode();
const requestedAppView = window.JH_APP_VIEW || inferAppView();
const appView = validAppViews.has(requestedAppView) ? requestedAppView : "home";

const versionRoutes = [
  { label: "版本 1", path: "/", mode: "responsive", aliases: ["/", "/1"] },
  { label: "版本 2", path: "/2/", mode: "fixed-left" },
  { label: "版本 3", path: "/3/", mode: "fixed-center" }
];

function getVersionHref(path) {
  const base = siteBasePath || "";
  if (path === "/") {
    return `${base || ""}/`;
  }
  return `${base}${path}`;
}

function getCurrentVersionBasePath() {
  const currentPath = getCurrentRoutePath();
  const match = currentPath.match(/^\/([123])(?:\/|$)/);
  return match ? `/${match[1]}/` : "/1/";
}

function getRoomHref() {
  return getVersionHref(`${getCurrentVersionBasePath()}room/`);
}

function getTextHref() {
  return getVersionHref(`${getCurrentVersionBasePath()}text/`);
}

function getVideoHref() {
  return getVersionHref(`${getCurrentVersionBasePath()}video/`);
}

function getHomeHref() {
  const basePath = getCurrentVersionBasePath();
  return getVersionHref(basePath === "/1/" ? "/" : basePath);
}

const icons = {
  logo: `
    <img class="brand-mark" src="${assetUrl("assets/figma-home/logo.png")}" alt="嘉虹健康" />`,
  home: `
    <img class="menu-icon" src="${assetUrl("assets/figma-home/home.svg")}" alt="" aria-hidden="true" />`,
  dashboard: `
    <img class="menu-icon" src="${assetUrl("assets/figma-home/trello.svg")}" alt="" aria-hidden="true" />`,
  circle: `
    <img class="menu-icon" src="${assetUrl("assets/figma-home/disc.svg")}" alt="" aria-hidden="true" />`,
  clipboard: `
    <img class="menu-icon" src="${assetUrl("assets/figma-home/clipboard.svg")}" alt="" aria-hidden="true" />`,
  checkSquare: `
    <img class="menu-icon" src="${assetUrl("assets/figma-home/check-square.svg")}" alt="" aria-hidden="true" />`,
  briefcase: `
    <img class="menu-icon" src="${assetUrl("assets/figma-home/briefcase.svg")}" alt="" aria-hidden="true" />`,
  calendar: `
    <img class="menu-icon" src="${assetUrl("assets/figma-home/calendar.svg")}" alt="" aria-hidden="true" />`,
  user: `
    <img class="menu-icon" src="${assetUrl("assets/figma-home/user.svg")}" alt="" aria-hidden="true" />`,
  shield: `
    <img class="menu-icon" src="${assetUrl("assets/figma-home/pocket.svg")}" alt="" aria-hidden="true" />`,
  menu: `
    <img class="menu-icon" src="${assetUrl("assets/figma-home/menu-icon.svg")}" alt="" aria-hidden="true" />`,
  stethoscope: `
    <img class="consult-card__icon-img" src="${assetUrl("assets/figma-home/consult-icon.svg")}" alt="" aria-hidden="true" />`,
  quickCalendar: `
    <span class="quick-icon quick-icon--schedule" aria-hidden="true">
      <img class="quick-icon__base" src="${assetUrl("assets/figma-home/quick-schedule-box.svg")}" alt="" />
      <img class="quick-icon__mark" src="${assetUrl("assets/figma-home/quick-schedule-mark.svg")}" alt="" />
    </span>`,
  document: `
    <img class="quick-icon quick-icon--document" src="${assetUrl("assets/figma-home/quick-doc.svg")}" alt="" aria-hidden="true" />`,
  clock: `
    <span class="quick-icon quick-icon--clock" aria-hidden="true">
      <img class="quick-icon__base" src="${assetUrl("assets/figma-home/quick-clock-circle.svg")}" alt="" />
      <img class="quick-icon__hand" src="${assetUrl("assets/figma-home/quick-clock-hand.svg")}" alt="" />
    </span>`,
  plus: `
    <img class="quick-icon quick-icon--plus" src="${assetUrl("assets/figma-home/quick-plus.svg")}" alt="" aria-hidden="true" />`
};

const menuGroups = [
  {
    title: "工作台",
    items: [
      { label: "首页", icon: "home", active: true },
      { label: "数据看板", icon: "dashboard" }
    ]
  },
  {
    title: "问诊管理",
    items: [
      { label: "三方问诊", icon: "circle" },
      { label: "问诊记录", icon: "clipboard" },
      { label: "驳回处方", icon: "checkSquare" }
    ]
  },
  {
    title: "运营相关",
    items: [
      { label: "出诊管理", icon: "briefcase" },
      { label: "值班打卡", icon: "calendar" }
    ]
  },
  {
    title: "账户",
    items: [
      { label: "个人中心", icon: "user" },
      { label: "医生佣金", icon: "shield" }
    ]
  }
];

const quickActions = [
  { title: "排班管理", desc: "查看值班安排", icon: "quickCalendar" },
  { title: "医生佣金条", desc: "查看当月佣金明细", icon: "document" },
  { title: "历史问诊", desc: "历史病历查询", icon: "clock" },
  { title: "", desc: "添加快捷入口", icon: "plus" }
];

const services = [
  { key: "text", label: "图文问诊", enabled: true },
  { key: "video", label: "视频问诊", enabled: true },
  { key: "consult", label: "图文咨询", enabled: true }
];

const quickReplyCategories = [
  "续方-必发两项",
  "续方-询问病史",
  "续方-风险评估",
  "续方-安全用药",
  "续方-异常情况",
  "续方-售后服务",
  "续方-凭证不符",
  "续方-处方备注"
];

const quickReplyMessages = [
  "稍后给您开方，请您按处方使用并认真阅读药品说明书。注意忌饮酒，辛辣食物，注意休息。如出现病情变化或其它不适症状，请立即停药并及时当地医院就医。",
  "请问您是否线下就诊并已明确诊断?",
  "请问确定是医生推荐使用该药品的吗?",
  "请问您确定非处于孕期/哺乳期/备孕期吗?",
  "请问确定不存在肝肾功能异常?",
  "请问您是否线下就诊并已明确诊断?",
  "请您按时用药，定期复查，不适随诊。",
  "如您在用药3-5天后，症状没有缓解或者病情加重，请及时医院就诊，以免延误病情。"
];

const serviceState = services.reduce((state, service) => {
  state[service.key] = service.enabled;
  return state;
}, {});

const dismissedBadgeStorageKey = "jh.dismissedMessageBadges";
const currentNavigation = performance.getEntriesByType("navigation")[0];
if (currentNavigation?.type === "reload") {
  sessionStorage.removeItem(dismissedBadgeStorageKey);
}
const dismissedMessageBadges = new Set(
  JSON.parse(sessionStorage.getItem(dismissedBadgeStorageKey) || "[]")
);

function rememberDismissedMessageBadge(badgeKey) {
  if (!badgeKey) return;
  dismissedMessageBadges.add(badgeKey);
  sessionStorage.setItem(
    dismissedBadgeStorageKey,
    JSON.stringify(Array.from(dismissedMessageBadges))
  );
}

function getMessageBadgeKey(type, targetView, index = 0) {
  return `${type}:${targetView}:${index}`;
}

function renderCheckboxMark() {
  return `<img class="jh-checkbox__mark" src="${assetUrl("assets/figma-home/checkmark.svg")}" alt="" aria-hidden="true" />`;
}

function renderCheckbox({ label, className = "", labelClassName = "" } = {}) {
  return `
    <span class="jh-checkbox${className ? ` ${className}` : ""}">
      <span class="jh-checkbox__icon" aria-hidden="true">${renderCheckboxMark()}</span>
      ${label ? `<span class="jh-checkbox__label${labelClassName ? ` ${labelClassName}` : ""}">${label}</span>` : ""}
    </span>`;
}

function renderSwitch({ checked = false, label = "切换开关", className = "" } = {}) {
  return `<button class="jh-switch${checked ? " is-on" : ""}${className ? ` ${className}` : ""}" type="button" aria-label="${label}" aria-pressed="${checked}"></button>`;
}

function renderButton({ text, tone = "primary", size = "md", className = "", type = "button" } = {}) {
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
  return `<button class="jh-btn${sizeClass} jh-btn--${safeTone}${className ? ` ${className}` : ""}" type="${type}">${text}</button>`;
}

function renderDurationChip(variant = "icon") {
  const safeVariant = ["icon", "pill", "plain"].includes(variant) ? variant : "icon";
  return `
    <span class="jh-duration-chip jh-duration-chip--${safeVariant}">
      ${safeVariant === "icon" ? `<span class="jh-duration-chip__clock" aria-hidden="true"></span>` : ""}
      <strong>问诊持续时长：00:00:55</strong>
    </span>`;
}

function renderChatInput({ className = "" } = {}) {
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

function renderQuickReplyDialog() {
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
            ${quickReplyCategories
              .map(
                (category, index) => `
                  <button class="quick-reply-category${index === 0 ? " is-active" : ""}" type="button">
                    ${category}
                  </button>`
              )
              .join("")}
          </nav>
          <div class="quick-reply-list" role="list">
            ${quickReplyMessages
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

function renderRiskWarningDialog() {
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
  const rows = [
    { name: "阿奇霉素分散片", warnings: { 2: "must", 5: "severe" } },
    { name: "头孢", warnings: { 4: "general" } }
  ];

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
            ${rows
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
            <p>[警示信息-孕产]孕妇禁用</p>
            <p>[建议信息]本品为高危药品</p>
          </div>
        </div>
      </section>
    </div>`;
}

function renderAiReplyOptions(options = []) {
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

function renderSearchField({ className = "", placeholder = "请输入药品名称或首字母做模糊查询", disabled = false } = {}) {
  return `
    <label class="jh-search-field${className ? ` ${className}` : ""}${disabled ? " is-disabled" : ""}">
      <span class="jh-search-field__icon" aria-hidden="true">
        <img src="${assetUrl("assets/search-icon.png")}" alt="" />
      </span>
      <input type="text" placeholder="${placeholder}" aria-label="${placeholder}"${disabled ? " disabled" : ""} />
    </label>`;
}

function renderSelectField({ label = "请选择", size = "sm", className = "", showChevron = true } = {}) {
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

function renderLabelTag({ text = "默认标签", tone = "light", size = "sm", weight = "regular", className = "" } = {}) {
  const safeTone = ["dark", "light", "focus"].includes(tone) ? tone : "light";
  const safeSize = ["sm", "md", "lg"].includes(size) ? size : "sm";
  const weightClass = weight === "bold" ? " jh-tag--bold" : "";
  return `<span class="jh-tag jh-tag--${safeTone} jh-tag--${safeSize}${weightClass}${className ? ` ${className}` : ""}">${text}</span>`;
}

function renderStatusBadge(status = "online", className = "") {
  const statusMap = {
    online: "在线",
    busy: "忙碌",
    offline: "离线"
  };
  const safeStatus = Object.prototype.hasOwnProperty.call(statusMap, status) ? status : "online";
  return `<span class="jh-status-badge jh-status-badge--${safeStatus}${className ? ` ${className}` : ""}" data-status-text>${statusMap[safeStatus]}</span>`;
}

function renderReadTag(status = "unread", className = "") {
  const safeStatus = status === "read" ? "read" : "unread";
  const label = safeStatus === "read" ? "已读" : "未读";
  return `<span class="jh-read-tag jh-read-tag--${safeStatus}${className ? ` ${className}` : ""}">${label}</span>`;
}

function renderRiskTag({ text = "高", size = "sm", className = "" } = {}) {
  const safeSize = size === "lg" ? "lg" : "sm";
  return `<span class="jh-risk-tag jh-risk-tag--${safeSize}${className ? ` ${className}` : ""}">${text}</span>`;
}

function renderMenu() {
  return menuGroups
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

function renderSidebar() {
  return `
    <aside class="sidebar" aria-label="主菜单">
      <div class="sidebar__brand">${icons.logo}</div>
      <nav class="sidebar__content">${renderMenu()}</nav>
      <div class="sidebar__footer">${icons.menu}</div>
    </aside>`;
}

function renderTopbar() {
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
          <div class="user-chip__body">
            <span class="avatar" aria-hidden="true">
              <img src="${assetUrl("assets/figma-home/avatar-source.png")}" alt="" />
            </span>
            <span>张医生</span>
          </div>
        </div>
      </div>
    </header>`;
}

function renderWaitingCard() {
  return `
    <section class="card card--compact waiting-card" aria-label="当前候诊状态">
      <div class="waiting-card__left">
        <div class="waiting-card__heading">
          <h1 class="card__title">当前候诊状态</h1>
          <p class="waiting-card__label">当前候诊人数</p>
        </div>
        <p class="waiting-card__number">2</p>
        <p class="waiting-card__hint">请及时接诊患者</p>
      </div>
      <div class="waiting-card__right">
        <div class="queue-chip">
          <span class="queue-chip__name">图文问诊</span>
          <span class="queue-chip__value">1</span>
        </div>
        <div class="queue-chip">
          <span class="queue-chip__name">视频问诊</span>
          <span class="queue-chip__value">1</span>
        </div>
      </div>
    </section>`;
}

function renderConsultCard() {
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

function renderRoomCheckbox(label) {
  return renderCheckbox({ label, className: "room-check", labelClassName: "room-check__label" });
}

function renderRoomTopbar() {
  return `
    <header class="room-topbar">
      <div class="room-topbar__inner">
        <a class="jh-btn jh-btn--md jh-btn--neutral jh-btn--icon room-back-btn" href="${getHomeHref()}" aria-label="返回首页">
          <img src="${assetUrl("assets/figma-consult/back.svg")}" alt="" />
          <span>返回首页</span>
        </a>
        <div class="room-topbar__right">
          ${renderButton({ text: "在线客服", tone: "primary", size: "md", className: "room-service-btn" })}
          <button class="room-status" type="button" aria-label="出诊状态：在线">
            ${renderStatusBadge("online", "room-status__badge")}
            <span class="room-status__chevron" aria-hidden="true">
              <img src="${assetUrl("assets/figma-consult/chevron-down.svg")}" alt="" />
            </span>
          </button>
          <div class="room-service-switches" aria-label="服务类型">
            <button class="room-service-check is-selected" type="button" role="checkbox" aria-checked="true">
              ${renderRoomCheckbox("视频问诊")}
            </button>
            <button class="room-service-check is-selected" type="button" role="checkbox" aria-checked="true">
              ${renderRoomCheckbox("图文问诊")}
            </button>
          </div>
          <div class="room-user">
            <span class="room-user__divider" aria-hidden="true">
              <img src="${assetUrl("assets/figma-consult/topbar-divider.svg")}" alt="" />
            </span>
            <span class="avatar" aria-hidden="true">
              <img src="${assetUrl("assets/figma-consult/avatar-source.png")}" alt="" />
            </span>
            <span>张医生</span>
          </div>
        </div>
      </div>
    </header>`;
}

function renderRoomSidebar() {
  const hasMessages = appView === "text" || appView === "video";
  const waitingCount = hasMessages ? 4 : 0;
  return `
    <aside class="room-sidebar" aria-label="问诊消息栏">
      <div class="room-sidebar__section room-sidebar__section--head">
        <div class="room-title-row">
          <h1>问诊室</h1>
          <div class="room-waiting">
            <span>待接诊</span>
            <strong>${waitingCount}</strong>
          </div>
        </div>
      </div>
      <div class="room-sidebar__section room-sidebar__section--filters">
        <div class="room-tags room-tags--type">
          ${renderButton({ text: "全部", tone: "outline-secondary", size: "md", className: "room-tag is-active" })}
          ${renderButton({ text: "图文", tone: "outline-secondary", size: "md", className: "room-tag" })}
          ${renderButton({ text: "视频", tone: "outline-secondary", size: "md", className: "room-tag" })}
        </div>
        <div class="room-tags room-tags--state">
          ${renderButton({ text: "进行中", tone: "outline-secondary", size: "md", className: "room-tag room-tag--wide is-active" })}
          ${renderButton({ text: "已结束", tone: "outline-secondary", size: "md", className: "room-tag room-tag--wide" })}
        </div>
      </div>
      ${
        hasMessages
          ? `<div class="message-list" aria-label="会话列表">
              ${renderMessageItem("图文", appView === "text", "text", 0)}
              ${renderMessageItem("视频", appView === "video", "video", 1)}
              ${renderMessageItem("图文", false, "text", 2)}
              ${renderMessageItem("视频", false, "video", 3)}
            </div>`
          : ""
      }
    </aside>`;
}

function renderMessageItem(type, active, targetView, index = 0) {
  const badgeKey = getMessageBadgeKey(type, targetView, index);
  const showBadge = !active && !dismissedMessageBadges.has(badgeKey);
  return `
    <button class="message-item${active ? " is-active" : ""}" type="button" data-target-view="${targetView}" data-badge-key="${badgeKey}">
      <span class="message-item__stripe" aria-hidden="true"></span>
      <span class="message-item__body">
        <span class="message-item__type message-item__type--${type === "图文" ? "text" : "video"}">${type}</span>
        <span class="message-item__title">武汉市好药师大药房</span>
        <span class="message-item__preview">您好！请问那个药怎么...</span>
      </span>
      ${showBadge ? '<span class="message-item__badge">1</span>' : ""}
    </button>`;
}

function renderRoomMain() {
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

function renderRoom() {
  return `
    <div class="app-shell room-shell app-shell--${appMode}">
      ${renderRoomTopbar()}
      ${renderRoomSidebar()}
      ${renderRoomMain()}
      <div class="toast" role="status" aria-live="polite"></div>
    </div>`;
}

function renderTextMain() {
  return `
    <main class="text-main">
      <section class="text-card" aria-label="图文问诊">
        <div class="pharmacy-bar">
          <div class="pharmacy-bar__left">
            <h2>武汉市好药师大药房南岸店</h2>
            ${renderRiskTag({ text: "迎检", size: "lg", className: "risk-tag--inspection" })}
            ${renderLabelTag({ text: "中药", tone: "focus", size: "lg", className: "risk-tag--medicine medicine-type-tag" })}
          </div>
          <div class="pharmacy-bar__right">
            ${renderDurationChip("icon")}
            ${renderButton({ text: "取消问诊", tone: "danger", size: "md" })}
          </div>
        </div>
        <div class="consult-workspace">
          ${renderChatPanel()}
          ${renderPrescriptionPanel()}
        </div>
      </section>
    </main>`;
}

function renderChatPanel() {
  return `
    <section class="chat-panel" aria-label="聊天区域">
      <div class="chat-thread">
        <p class="chat-date">2026-01-13 16:38:21</p>
        <div class="chat-bubble chat-bubble--doctor">
          <p>您好，下图已经出现局部明显脱落，请问下续是否继续原方案使用，药物是否有变化？患者无异常，请问是否需要补充？</p>
        </div>
        <div class="chat-bubble chat-bubble--patient">
          <p>还有发烧</p>
        </div>
      </div>
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

function renderPrescriptionPanel(includeSecondMedicine = false) {
  const medicineRow = `
          <div class="medicine-table__row">
            <span>1</span><span>阿奇霉素分散片</span><span>处方药</span><span class="table-input">0.125g*6片</span><span class="table-input">口服</span><span class="table-input">1次/日</span><span class="table-input">0.25毫克</span><span>1</span><span class="table-input">盒</span>${renderRiskTag({ text: "高", size: "sm", className: "risk-small" })}${renderButton({ text: "删除", tone: "text", size: "", className: "medicine-delete-btn" })}
          </div>`;

  return `
    <section class="prescription-panel" aria-label="处方信息">
      <div class="patient-info">
        <div class="patient-info__name">柯思达&nbsp;&nbsp;男&nbsp;&nbsp;30岁</div>
        <div class="patient-info__grid">
          <span>体重 /KG：XX</span>
          <span>*妊娠哺乳：　否</span>
          <span>手机号：XXXXXXXXXXX</span>
          <span>*肝功能异常：　否</span>
          <span>证件号：XXXXXXXXXXXXXXXXXX</span>
          <span>*肾功能异常：　否</span>
          <span>过敏史：无</span>
        </div>
      </div>
      <div class="section-divider"></div>
      <div class="diagnosis-section">
        <h3>疾病信息</h3>
        <div class="diagnosis-row">
          <label><span>*</span>诊断</label>
          ${renderSelectField({ label: "请选择诊断", size: "lg", className: "diagnosis-select", showChevron: false })}
          <div class="diagnosis-input">
            <button class="diagnosis-tag" type="button" aria-label="移除诊断：支气管肺炎">
              <span>支气管肺炎</span>
              <span class="diagnosis-tag__close" aria-hidden="true">
                <img src="${assetUrl("assets/diagnosis-tag-close.svg")}" alt="" />
              </span>
            </button>
          </div>
        </div>
      </div>
      <div class="section-divider"></div>
      <div class="medicine-section">
        <h3>所需药品</h3>
        <div class="medicine-scroll-area">
          ${renderSearchField({ className: "medicine-search" })}
          <div class="medicine-table">
            <div class="medicine-table__row medicine-table__head">
              <span>序号</span><span>药品名称</span><span>类型</span><span>规格</span><span>用法</span><span>服用频次</span><span>用量</span><span>数量</span><span>单位</span><span>风险</span><span>操作</span>
            </div>
            ${medicineRow}
            ${includeSecondMedicine ? medicineRow : ""}
          </div>
        </div>
      </div>
      <div class="prescription-actions">
        ${renderSelectField({ label: "请选择", size: "sm" })}
        <div>
          ${renderButton({ text: "结束问诊", tone: "danger", size: "md", className: "end-consult-trigger" })}
          ${renderButton({ text: "提交处方", tone: "primary", size: "md", className: "jh-prescription-submit" })}
        </div>
      </div>
    </section>`;
}

function renderTextPage() {
  return `
    <div class="app-shell room-shell text-shell app-shell--${appMode}">
      ${renderRoomTopbar()}
      ${renderRoomSidebar()}
      ${renderTextMain()}
      ${renderQuickReplyDialog()}
      ${renderRiskWarningDialog()}
      <div class="toast" role="status" aria-live="polite"></div>
    </div>`;
}

function renderVideoChatPanel() {
  return `
    <section class="chat-panel video-chat-panel" aria-label="视频聊天区域">
      <div class="video-window">
        <img class="video-window__main" src="${assetUrl("assets/video-main.png")}" alt="" />
        <div class="video-window__pip">
          <img src="${assetUrl("assets/video-doctor.png")}" alt="" />
        </div>
      </div>
      <div class="video-chat-thread">
        <p class="chat-date">2026-01-13 16:38:21</p>
        <div class="chat-bubble chat-bubble--doctor">
          <p>您好，下图已经出现局部明显脱落，请问下续是否继续原方案使用，药物是否有变化？患者无异常，请问是否需要补充？</p>
        </div>
        <div class="chat-bubble chat-bubble--patient">
          <p>还有发烧</p>
        </div>
      </div>
      <div class="video-input-wrap">
        ${renderChatInput()}
      </div>
    </section>`;
}

function renderVideoMain() {
  return `
    <main class="text-main">
      <section class="text-card" aria-label="视频问诊">
        <div class="pharmacy-bar">
          <div class="pharmacy-bar__left">
            <h2>武汉市好药师大药房南岸店</h2>
            ${renderRiskTag({ text: "迎检", size: "lg", className: "risk-tag--inspection" })}
            ${renderLabelTag({ text: "中药", tone: "focus", size: "lg", className: "risk-tag--medicine medicine-type-tag" })}
          </div>
          <div class="pharmacy-bar__right">
            ${renderDurationChip("icon")}
            ${renderButton({ text: "取消问诊", tone: "danger", size: "md" })}
          </div>
        </div>
        <div class="consult-workspace">
          ${renderVideoChatPanel()}
          ${renderPrescriptionPanel(true)}
        </div>
      </section>
    </main>`;
}

function renderVideoPage() {
  return `
    <div class="app-shell room-shell text-shell video-shell app-shell--${appMode}">
      ${renderRoomTopbar()}
      ${renderRoomSidebar()}
      ${renderVideoMain()}
      ${renderQuickReplyDialog()}
      ${renderRiskWarningDialog()}
      <div class="toast" role="status" aria-live="polite"></div>
    </div>`;
}

function renderServiceCard() {
  return `
    <section class="card card--compact service-card" aria-label="接诊状态与服务开关">
      <h2 class="card__title">接诊状态与服务开关</h2>
        <div class="status-row">
          <div class="status-row__left">
            <span>出诊状态</span>
          ${renderStatusBadge("online")}
        </div>
        ${renderSwitch({ checked: true, label: "切换出诊状态" })}
      </div>
      <div class="service-list">
        ${services
          .map(
            (service) => `
              <button class="service-tile" type="button" role="checkbox" aria-checked="${serviceState[service.key]}" data-service-key="${service.key}">
                ${renderCheckbox({ label: service.label })}
              </button>`
          )
          .join("")}
      </div>
    </section>`;
}

function renderNoticeCard() {
  return `
    <section class="card notice-card" aria-label="最新公告">
      <div class="notice-card__inner">
        <div class="notice-card__head">
          <div class="notice-card__title-row">
            <h2 class="card__title">最新公告</h2>
            <span class="notice-card__date">2026-04-08</span>
          </div>
          <div class="divider"></div>
        </div>
        <article class="announcement">
          <div class="announcement__top">
            <div class="announcement__title-row">
              <h3 class="announcement__title">嘉虹健康医生端新功能发布</h3>
              ${renderReadTag("unread", "announcement-tag")}
            </div>
            <div class="announcement__body"> 一、图文问诊未回复弹框确认机制：图文问诊未回复弹框确认持续3秒。若顾客未回复，禁止开具处方。 
二、处方驳回流程调整：取消医生端驳回处方修改功能。药师端驳回处方的同时即作废该处方。医生开方前需谨慎核对，处方一旦错误将无驳回修改机会。 
<span class="link">……展开详情</span></div>
          </div>
          <p class="announcement__footer">成都双流九州通互联网医院</p>
        </article>
        ${renderButton({ text: "查看全部公告", tone: "block-outline", size: "" })}
      </div>
    </section>`;
}

function renderQuickActions() {
  return `
    <section class="card quick-entry-card" aria-label="高频操作入口">
      <h2 class="card__title">高频操作入口</h2>
      <div class="quick-grid">
        ${quickActions
          .map(
            (action) => `
              <button class="quick-card" type="button" data-action="${action.desc}">
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

function renderMain() {
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

function renderApp() {
  document.body.classList.add(`page-mode-${appMode}`, `page-view-${appView}`);
  document.getElementById("app").innerHTML =
    appView === "room"
      ? renderRoom()
      : appView === "text"
        ? renderTextPage()
        : appView === "video"
          ? renderVideoPage()
      : `
    <div class="app-shell app-shell--${appMode}">
      ${renderTopbar()}
      ${renderSidebar()}
      ${renderMain()}
      <div class="toast" role="status" aria-live="polite"></div>
    </div>`;
}

function syncFixedViewport() {
  if (appMode === "responsive") {
    document.documentElement.style.removeProperty("--jh-fixed-offset-x");
    return;
  }

  const viewportWidth = window.innerWidth;
  const offsetX =
    appMode === "fixed-center" ? Math.max(0, (viewportWidth - fixedDesignWidth) / 2) : 0;

  document.documentElement.style.setProperty("--jh-fixed-offset-x", `${offsetX}px`);
}

function showToast(message) {
  const toast = document.querySelector(".toast");
  window.clearTimeout(showToast.timer);
  toast.textContent = message;
  toast.classList.add("is-visible");
  showToast.timer = window.setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 1500);
}

function setServiceTileState(tile, enabled) {
  const serviceKey = tile.dataset.serviceKey;
  if (serviceKey) {
    serviceState[serviceKey] = enabled;
  }
  tile.setAttribute("aria-checked", String(enabled));
  tile.classList.toggle("is-selected", enabled);
}

function openQuickReplyDialog() {
  const overlay = document.querySelector(".quick-reply-overlay");
  if (!overlay) return;
  overlay.classList.add("is-open");
  overlay.setAttribute("aria-hidden", "false");
  overlay.querySelector(".quick-reply-dialog__close")?.focus();
}

function closeQuickReplyDialog() {
  const overlay = document.querySelector(".quick-reply-overlay");
  if (!overlay) return;
  overlay.classList.remove("is-open");
  overlay.setAttribute("aria-hidden", "true");
}

function openRiskWarningDialog() {
  const overlay = document.querySelector(".risk-warning-overlay");
  if (!overlay) return;
  overlay.classList.add("is-open");
  overlay.setAttribute("aria-hidden", "false");
  overlay.querySelector(".risk-warning-dialog__close")?.focus();
}

function closeRiskWarningDialog() {
  const overlay = document.querySelector(".risk-warning-overlay");
  if (!overlay) return;
  overlay.classList.remove("is-open");
  overlay.setAttribute("aria-hidden", "true");
}

function bindInteractions() {
  document.querySelectorAll(".menu-item").forEach((item) => {
    item.addEventListener("click", () => {
      document.querySelectorAll(".menu-item").forEach((node) => {
        node.classList.remove("is-active");
      });
      item.classList.add("is-active");
    });
  });

  const statusText = document.querySelector("[data-status-text]");
  const switchButton = document.querySelector(".jh-switch");
  if (statusText && switchButton) {
    switchButton.addEventListener("click", () => {
      const nextState = !switchButton.classList.contains("is-on");
      switchButton.classList.toggle("is-on", nextState);
      switchButton.setAttribute("aria-pressed", String(nextState));
      statusText.textContent = nextState ? "在线" : "离线";
      statusText.classList.toggle("jh-status-badge--online", nextState);
      statusText.classList.toggle("jh-status-badge--offline", !nextState);
    });
  }

  const serviceList = document.querySelector(".service-list");
  if (serviceList) {
    serviceList.querySelectorAll(".service-tile").forEach((tile) => {
      const serviceKey = tile.dataset.serviceKey;
      setServiceTileState(tile, Boolean(serviceState[serviceKey]));
    });

    serviceList.addEventListener("click", (event) => {
      const currentTile = event.target.closest(".service-tile");
      if (!currentTile || !serviceList.contains(currentTile)) return;
      event.preventDefault();
      event.stopPropagation();
      const serviceKey = currentTile.dataset.serviceKey;
      setServiceTileState(currentTile, !serviceState[serviceKey]);
    });
  }

  document.querySelectorAll(".ai-reply__options button").forEach((option) => {
    option.addEventListener("click", () => {
      const input = document.querySelector(".jh-chat-input textarea");
      if (input) {
        input.value = option.textContent.trim();
        input.focus();
      }
    });
  });

  const quickReplyOverlay = document.querySelector(".quick-reply-overlay");
  document.querySelectorAll(".quick-reply-trigger").forEach((button) => {
    button.addEventListener("click", openQuickReplyDialog);
  });

  if (quickReplyOverlay) {
    quickReplyOverlay.querySelector(".quick-reply-dialog__close")?.addEventListener("click", closeQuickReplyDialog);
    quickReplyOverlay.addEventListener("click", (event) => {
      if (event.target === quickReplyOverlay) {
        closeQuickReplyDialog();
      }
    });

    quickReplyOverlay.querySelectorAll(".quick-reply-category").forEach((category) => {
      category.addEventListener("click", () => {
        quickReplyOverlay
          .querySelectorAll(".quick-reply-category")
          .forEach((node) => node.classList.remove("is-active"));
        category.classList.add("is-active");
      });
    });

    quickReplyOverlay.querySelectorAll(".quick-reply-message").forEach((message) => {
      message.addEventListener("click", () => {
        const input = document.querySelector(".jh-chat-input textarea");
        if (input) {
          input.value = message.textContent.trim();
          input.focus();
        }
        closeQuickReplyDialog();
      });
    });
  }

  const riskWarningOverlay = document.querySelector(".risk-warning-overlay");
  document.querySelectorAll(".end-consult-trigger").forEach((button) => {
    button.addEventListener("click", openRiskWarningDialog);
  });

  if (riskWarningOverlay) {
    riskWarningOverlay.querySelector(".risk-warning-dialog__close")?.addEventListener("click", closeRiskWarningDialog);
    riskWarningOverlay.addEventListener("click", (event) => {
      if (event.target === riskWarningOverlay) {
        closeRiskWarningDialog();
      }
    });
  }

  const consultCard = document.querySelector(".consult-card");
  if (consultCard) {
    consultCard.addEventListener("click", () => {
      window.location.href = getRoomHref();
    });
  }

  document.querySelectorAll(".quick-card").forEach((card) => {
    card.addEventListener("click", () => {
      showToast(card.dataset.action);
    });
  });

  document
    .querySelectorAll(".topbar__actions .jh-btn, .room-service-btn, .notice-card .jh-btn--block-outline")
    .forEach((button) => {
      button.addEventListener("click", () => {
        showToast(button.textContent.trim());
      });
    });

  const roomRefresh = document.querySelector(".room-refresh");
  if (roomRefresh) {
    roomRefresh.addEventListener("click", () => {
      window.location.href = getTextHref();
    });
  }

  document.querySelectorAll(".room-tag").forEach((tag) => {
    tag.addEventListener("click", () => {
      const group = tag.closest(".room-tags");
      group.querySelectorAll(".room-tag").forEach((node) => node.classList.remove("is-active"));
      tag.classList.add("is-active");
    });
  });

  document.querySelectorAll(".room-service-check").forEach((button) => {
    button.addEventListener("click", () => {
      const enabled = button.getAttribute("aria-checked") === "true";
      const nextState = !enabled;
      button.setAttribute("aria-checked", String(nextState));
      button.classList.toggle("is-selected", nextState);
    });
  });

  document.querySelectorAll(".message-item").forEach((item) => {
    item.addEventListener("click", () => {
      if (item.dataset.badgeKey) {
        rememberDismissedMessageBadge(item.dataset.badgeKey);
      }
      item.querySelector(".message-item__badge")?.remove();
      if (item.dataset.targetView === "video") {
        window.location.href = getVideoHref();
      } else if (item.dataset.targetView === "text") {
        window.location.href = getTextHref();
      }
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeQuickReplyDialog();
      closeRiskWarningDialog();
    }
  });
}

syncFixedViewport();
renderApp();
bindInteractions();
window.addEventListener("resize", syncFixedViewport);
