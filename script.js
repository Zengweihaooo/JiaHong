const assetUrl = (path) => new URL(path, document.currentScript.src).href;
const siteBasePath = new URL(".", document.currentScript.src).pathname.replace(/\/$/, "");
const validAppViews = new Set(["home", "room", "text", "video", "history"]);

function getCurrentRoutePath() {
  const normalized = location.pathname.replace(/\/+$/, "") || "/";
  const base = siteBasePath || "";
  if (base && normalized.startsWith(base)) {
    const rest = normalized.slice(base.length) || "/";
    return rest.startsWith("/") ? rest : `/${rest}`;
  }
  return normalized;
}

function inferAppView() {
  const currentPath = getCurrentRoutePath();
  if (currentPath.includes("/video")) return "video";
  if (currentPath.includes("/text")) return "text";
  if (currentPath.includes("/history")) return "history";
  if (currentPath.includes("/room")) return "room";
  return "home";
}

const requestedAppView = window.JH_APP_VIEW || inferAppView();
const appView = validAppViews.has(requestedAppView) ? requestedAppView : "home";

function getAppHref(path) {
  const base = siteBasePath || "";
  if (path === "/") {
    return `${base || ""}/`;
  }
  return `${base}${path}`;
}

function getRoomHref() {
  return getAppHref("/room/");
}

function getTextHref() {
  return getAppHref("/text/");
}

function getVideoHref() {
  return getAppHref("/video/");
}

function getHistoryHref(recordId = "ended-text") {
  return `${getAppHref("/history/")}?record=${encodeURIComponent(recordId)}`;
}

function getHomeHref() {
  return getAppHref("/");
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
  { title: "", desc: "添加快捷入口", icon: "plus", isAdd: true }
];

const quickEntryOptions = [
  { title: "患者随访", desc: "查看待随访患者", icon: "user" },
  { title: "风险提醒", desc: "查看用药风险项", icon: "shield" },
  { title: "处方模板", desc: "管理常用处方", icon: "clipboard" }
];

const announcements = [
  {
    id: "doctor-release",
    date: "2026-04-08",
    title: "嘉虹健康医生端新功能发布",
    publisher: "成都双流九州通互联网医院",
    unread: true,
    content: `一、图文问诊未回复弹框确认机制：图文问诊未回复弹框确认持续3秒。若顾客未回复，禁止开具处方。
二、处方驳回流程调整：取消医生端驳回处方修改功能。药师端驳回处方的同时即作废该处方。医生开方前需谨慎核对，处方一旦错误将无驳回修改机会。
三、风险检测提醒优化：提交处方前将展示患者用药风险检测结果，请根据检测信息完成处方核对。
四、快捷用语分类更新：新增续方、安全用药、异常情况、售后服务等常用话术分类，便于医生快速响应患者咨询。`
  },
  {
    id: "holiday-schedule",
    date: "2026-04-01",
    title: "清明节期间排班提醒",
    publisher: "嘉虹健康运营中心",
    unread: false,
    content: `一、请各位医生在假期前完成排班确认，避免患者问诊等待时间过长。
二、假期期间在线客服将保持值班，遇到系统异常可优先联系在线客服。
三、如需临时调整出诊状态，请至少提前30分钟在医生端完成切换。`
  },
  {
    id: "security-reminder",
    date: "2026-03-25",
    title: "医生账号安全提醒",
    publisher: "嘉虹健康技术支持",
    unread: false,
    content: `一、请勿将医生账号、短信验证码或电子签名授权信息提供给他人使用。
二、建议定期检查登录设备，如发现异常登录记录，请及时联系平台处理。
三、处方相关操作需由医生本人完成，平台将持续加强账号安全校验。`
  }
];

const latestAnnouncement = announcements[0];

const services = [
  { key: "text", label: "图文问诊", enabled: true },
  { key: "video", label: "视频问诊", enabled: true },
  { key: "consult", label: "图文咨询", enabled: true }
];

const consultationRecords = [
  {
    id: "active-text",
    type: "text",
    typeLabel: "图文",
    state: "ongoing",
    title: "武汉市好药师大药房",
    patient: "李女士",
    age: "36岁",
    preview: "您好！请问那个药怎么服用？",
    time: "16:38",
    badge: 1,
    targetView: "text",
    elapsedSeconds: 0
  },
  {
    id: "active-video",
    type: "video",
    typeLabel: "视频",
    state: "ongoing",
    title: "成都双流九州通互联网医院",
    patient: "周先生",
    age: "42岁",
    preview: "患者正在等待视频接诊",
    time: "16:34",
    badge: 1,
    targetView: "video",
    elapsedSeconds: 0
  },
  {
    id: "ended-text",
    type: "text",
    typeLabel: "图文",
    state: "ended",
    title: "武汉市好药师大药房南岸店",
    patient: "王女士",
    age: "29岁",
    preview: "已完成复诊开方，处方已流转药师审核",
    time: "15:22",
    diagnosis: "急性上呼吸道感染",
    diagnosisTags: ["急性上呼吸道感染"],
    patientGender: "女",
    patientDetail: {
      weight: "52",
      pregnancy: "否",
      phone: "138****5621",
      liverAbnormal: "否",
      idCard: "4201**********5621",
      kidneyAbnormal: "否",
      allergies: "无"
    },
    prescriptionNo: "RX202605190152",
    endedAt: "2026-05-19 15:22",
    targetView: "text",
    prescriptionMedicines: [
      {
        index: 1,
        name: "阿奇霉素分散片",
        type: "处方药",
        spec: "0.125g*6片",
        usage: "口服",
        frequency: "1次/日",
        dose: "0.25毫克",
        quantity: "1",
        unit: "盒",
        risk: "高"
      },
      {
        index: 2,
        name: "复方氨酚烷胺胶囊",
        type: "处方药",
        spec: "12粒",
        usage: "口服",
        frequency: "2次/日",
        dose: "1粒",
        quantity: "1",
        unit: "盒",
        risk: "低"
      }
    ],
    transcript: [
      { from: "doctor", time: "2026-05-19 15:10:18", text: "您好，请问有什么不适？" },
      { from: "patient", time: "2026-05-19 15:10:42", text: "咳嗽三天了，有点发热。" },
      { from: "doctor", time: "2026-05-19 15:11:06", text: "体温多少？有没有胸闷气短？" },
      { from: "patient", time: "2026-05-19 15:11:35", text: "37.8 度左右，没有胸闷。" }
    ],
    trace: [
      { label: "问诊结束", time: "15:18", detail: "医生完成图文问诊记录确认" },
      { label: "处方提交", time: "15:20", detail: "阿奇霉素分散片等 2 项药品提交审核" },
      { label: "药师审核", time: "15:22", detail: "处方审核通过，留痕记录已归档" }
    ]
  },
  {
    id: "ended-video",
    type: "video",
    typeLabel: "视频",
    state: "ended",
    title: "嘉虹健康视频问诊",
    patient: "陈先生",
    age: "51岁",
    preview: "视频复诊结束，处方已完成电子签名",
    time: "14:08",
    diagnosis: "慢性支气管炎复诊",
    diagnosisTags: ["慢性支气管炎复诊"],
    patientGender: "男",
    patientDetail: {
      weight: "68",
      pregnancy: "否",
      phone: "139****1088",
      liverAbnormal: "否",
      idCard: "4201**********1088",
      kidneyAbnormal: "否",
      allergies: "青霉素"
    },
    prescriptionNo: "RX202605190108",
    endedAt: "2026-05-19 14:08",
    targetView: "video",
    prescriptionMedicines: [
      {
        index: 1,
        name: "氨溴索口服液",
        type: "处方药",
        spec: "100ml",
        usage: "口服",
        frequency: "3次/日",
        dose: "10ml",
        quantity: "2",
        unit: "瓶",
        risk: "低"
      },
      {
        index: 2,
        name: "布地奈德吸入剂",
        type: "处方药",
        spec: "1支",
        usage: "吸入",
        frequency: "2次/日",
        dose: "200μg",
        quantity: "1",
        unit: "支",
        risk: "中"
      }
    ],
    transcript: [
      { from: "doctor", time: "2026-05-19 13:55:12", text: "您好，视频已接通，请描述一下近期症状。" },
      { from: "patient", time: "2026-05-19 13:55:48", text: "老毛病犯了，咳嗽有痰，晚上更明显。" },
      { from: "doctor", time: "2026-05-19 13:56:21", text: "近期是否按时服药？有无发热？" },
      { from: "patient", time: "2026-05-19 13:56:57", text: "有按时吃，没有发热。" }
    ],
    trace: [
      { label: "视频接诊", time: "13:55", detail: "医生完成视频问诊和身份核验" },
      { label: "处方签署", time: "14:05", detail: "电子签名完成，处方进入审核" },
      { label: "审核归档", time: "14:08", detail: "药师审核通过，开方留痕可追溯" }
    ]
  }
];

const ongoingChatState = {
  "active-text": {
    sessionDate: "2026-01-13 16:38:21",
    messages: [
      {
        id: "active-text-msg-1",
        from: "doctor",
        text: "您好，下图已经出现局部明显脱落，请问下续是否继续原方案使用，药物是否有变化？患者无异常，请问是否需要补充？",
        recalled: false
      },
      { id: "active-text-msg-2", from: "patient", text: "还有发烧", recalled: false }
    ]
  },
  "active-video": {
    sessionDate: "2026-01-13 16:34:08",
    messages: [
      {
        id: "active-video-msg-1",
        from: "doctor",
        text: "您好，下图已经出现局部明显脱落，请问下续是否继续原方案使用，药物是否有变化？患者无异常，请问是否需要补充？",
        recalled: false
      },
      { id: "active-video-msg-2", from: "patient", text: "还有发烧", recalled: false }
    ]
  }
};

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
const safeSessionStorage =
  typeof sessionStorage === "undefined"
    ? { getItem: () => null, setItem: () => {}, removeItem: () => {} }
    : sessionStorage;
const currentNavigation =
  typeof performance === "undefined" ? null : performance.getEntriesByType("navigation")[0];
if (currentNavigation?.type === "reload") {
  safeSessionStorage.removeItem(dismissedBadgeStorageKey);
}
const dismissedMessageBadges = new Set(
  JSON.parse(safeSessionStorage.getItem(dismissedBadgeStorageKey) || "[]")
);

function rememberDismissedMessageBadge(badgeKey) {
  if (!badgeKey) return;
  dismissedMessageBadges.add(badgeKey);
  safeSessionStorage.setItem(
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

function renderButton({ text, tone = "primary", size = "md", className = "", type = "button", disabled = false } = {}) {
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

function renderDurationChip(variant = "icon", elapsedSeconds = 0) {
  const safeVariant = ["icon", "pill", "plain"].includes(variant) ? variant : "icon";
  return `
    <span class="jh-duration-chip jh-duration-chip--${safeVariant}" data-duration-timer data-elapsed="${elapsedSeconds}">
      ${safeVariant === "icon" ? `<span class="jh-duration-chip__clock" aria-hidden="true"></span>` : ""}
      <strong>问诊持续时长：${formatDuration(elapsedSeconds)}</strong>
    </span>`;
}

function formatDuration(totalSeconds) {
  const safeSeconds = Math.max(0, Number(totalSeconds) || 0);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;
  return [hours, minutes, seconds].map((value) => String(value).padStart(2, "0")).join(":");
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

function renderUserMenu() {
  return `
    <div class="user-menu" role="menu" aria-hidden="true">
      <button class="user-menu__item" type="button" role="menuitem" data-action="个人中心">个人中心</button>
      <button class="user-menu__item" type="button" role="menuitem" data-action="账号安全">账号安全</button>
      <button class="user-menu__item" type="button" role="menuitem" data-action="消息通知">消息通知</button>
      <div class="user-menu__divider"></div>
      <button class="user-menu__item user-menu__item--danger" type="button" role="menuitem" data-action="退出登录">退出登录</button>
    </div>`;
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

function renderRoomFilterButton({ text, type, state, active = false, wide = false }) {
  const dataAttr = type ? `data-filter-type="${type}"` : `data-filter-state="${state}"`;
  return `<button class="jh-btn jh-btn--md jh-btn--outline-secondary room-tag${wide ? " room-tag--wide" : ""}${active ? " is-active" : ""}" type="button" ${dataAttr}>${text}</button>`;
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

function renderRoomSidebar() {
  const activeRecord =
    appView === "video"
      ? "active-video"
      : appView === "text"
        ? "active-text"
        : appView === "history"
          ? new URLSearchParams(location.search).get("record") || "ended-text"
          : "";
  const initialState = appView === "history" ? "ended" : "ongoing";
  const waitingCount = consultationRecords.filter((record) => record.state === "ongoing").length;
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

function renderMessageList({ type = "all", state = "ongoing", activeRecord = "" } = {}) {
  return consultationRecords
    .filter((record) => (type === "all" || record.type === type) && record.state === state)
    .map((record, index) => renderMessageItem(record, record.id === activeRecord, index))
    .join("");
}

function renderMessageItem(record, active, index = 0) {
  const badgeKey = getMessageBadgeKey(record.typeLabel, record.type, index);
  const showBadge = record.badge && !active && !dismissedMessageBadges.has(badgeKey);
  return `
    <button class="message-item${active ? " is-active" : ""}" type="button" data-record-id="${record.id}" data-target-view="${record.targetView || ""}" data-record-state="${record.state}" data-badge-key="${badgeKey}">
      <span class="message-item__stripe" aria-hidden="true"></span>
      <span class="message-item__body">
        <span class="message-item__meta">
          <span class="message-item__type message-item__type--${record.type}">${record.typeLabel}</span>
          <span class="message-item__time">${record.time}</span>
        </span>
        <span class="message-item__title">${record.title}</span>
        <span class="message-item__preview">${record.preview}</span>
      </span>
      ${showBadge ? `<span class="message-item__badge">${record.badge}</span>` : ""}
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

function getConsultMainClass() {
  return appView === "text" || appView === "video" ? "text-main" : "room-main";
}

function getConsultMainElement() {
  return document.querySelector(".room-main, .text-main");
}

function isConsultReadonlyView() {
  return Boolean(document.querySelector(".text-card--readonly"));
}

function setConsultShellReadonly(readonly) {
  document.querySelector(".room-shell, .text-shell, .video-shell")?.classList.toggle("consult-shell--readonly", readonly);
}

function renderPrescriptionTraceMain(record = consultationRecords.find((item) => item.state === "ended")) {
  const mainClass = getConsultMainClass();
  return `
    <main class="${mainClass}">
      <section class="text-card text-card--readonly" aria-label="历史问诊回看">
        <div class="pharmacy-bar">
          <div class="pharmacy-bar__left">
            <h2>${record.title}</h2>
            ${renderReadTag("read", "readonly-seal-tag").replace("已读", "已封存")}
            ${renderLabelTag({ text: `${record.typeLabel}问诊`, tone: "focus", size: "lg", className: "risk-tag--medicine medicine-type-tag" })}
          </div>
          <div class="pharmacy-bar__right">
            <span class="readonly-ended-time">结束时间：${record.endedAt}</span>
          </div>
        </div>
        <div class="consult-workspace">
          ${renderArchivedConsultationPanel(record)}
          ${renderReadonlyPrescriptionPanel(record)}
        </div>
      </section>
    </main>`;
}

function renderArchivedConsultationPanel(record) {
  const transcript = record.transcript || [];
  const chatList = `
    <div class="archived-chat__list">
      ${transcript
        .map(
          (item) => `
            <div class="archived-chat__item archived-chat__item--${item.from}">
              <time class="archived-chat__time" datetime="${item.time || ""}">${item.time || item.name || ""}</time>
              <p>${item.text}</p>
            </div>`
        )
        .join("")}
    </div>`;

  return `
    <section class="chat-panel archived-consult-panel" aria-label="历史聊天记录">
      ${
        record.type === "video"
          ? `<div class="video-window archived-video-window">
              <img class="video-window__main" src="${assetUrl("assets/video-main.png")}" alt="" />
              <div class="video-window__pip">
                <img src="${assetUrl("assets/video-doctor.png")}" alt="" />
              </div>
            </div>`
          : ""
      }
      <div class="archived-consult-panel__head">
        <h3>历史聊天记录</h3>
        <span>只读回看</span>
      </div>
      ${chatList}
      <div class="archived-consult-panel__disabled-input">问诊已封存，仅支持回看</div>
    </section>`;
}

function renderReadonlyPrescriptionPanel(record) {
  const medicineCount = record.prescriptionMedicines?.length || 1;
  return renderPrescriptionPanel({
    readonly: true,
    record,
    includeSecondMedicine: medicineCount > 1
  });
}


function renderPrescriptionTraceCard(record) {
  return `
    <button class="prescription-trace-card" type="button" data-history-record-id="${record.id}" aria-label="查看${record.patient}开方历史">
      <span class="prescription-trace-card__head">
        <span>
          <span class="prescription-trace-card__eyebrow">${record.typeLabel}问诊已结束</span>
          <strong>${record.patient}｜${record.age}</strong>
        </span>
        ${renderReadTag("read", "prescription-trace-card__status").replace("已读", "已归档")}
      </span>
      <span class="prescription-trace-card__body">
        <span class="trace-info-grid">
          <span><em>诊断</em><strong>${record.diagnosis}</strong></span>
          <span><em>处方编号</em><strong>${record.prescriptionNo}</strong></span>
          <span><em>结束时间</em><strong>${record.endedAt}</strong></span>
        </span>
        <span class="trace-timeline">
          ${record.trace
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

function renderHistoryPage() {
  const recordId = new URLSearchParams(location.search).get("record") || "ended-text";
  const record =
    consultationRecords.find((item) => item.id === recordId && item.state === "ended") ||
    consultationRecords.find((item) => item.id === "ended-text");
  return `
    <div class="app-shell room-shell history-shell app-shell--responsive">
      ${renderRoomTopbar()}
      ${renderRoomSidebar()}
      <main class="room-main">
        <section class="room-card prescription-history" aria-label="开方历史">
          <div class="prescription-history__header">
            <div>
              <p>开方历史</p>
              <h1>${record.patient}的处方留痕记录</h1>
            </div>
            ${renderButton({ text: "返回问诊室", tone: "outline-secondary", size: "md", className: "history-back" })}
          </div>
          <div class="prescription-history__summary">
            <span><em>问诊类型</em><strong>${record.typeLabel}问诊</strong></span>
            <span><em>诊断</em><strong>${record.diagnosis}</strong></span>
            <span><em>处方编号</em><strong>${record.prescriptionNo}</strong></span>
            <span><em>归档时间</em><strong>${record.endedAt}</strong></span>
          </div>
          <div class="prescription-history__content">
            <section class="history-panel">
              <h2>处方明细</h2>
              <div class="history-medicine-table">
                <div><strong>阿奇霉素分散片</strong><span>0.125g*6片｜口服｜1次/日｜1盒</span></div>
                <div><strong>复方氨酚烷胺胶囊</strong><span>12粒｜口服｜2次/日｜1盒</span></div>
              </div>
            </section>
            <section class="history-panel">
              <h2>操作留痕</h2>
              <div class="history-trace-list">
                ${record.trace
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

function renderRoom() {
  return `
    <div class="app-shell room-shell app-shell--responsive">
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
            ${renderDurationChip("icon", consultationRecords.find((record) => record.id === "active-text")?.elapsedSeconds ?? 0)}
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


function getActiveChatKey() {
  if (appView === "video") return "active-video";
  if (appView === "text") return "active-text";
  return null;
}

function findOngoingChatMessage(chatKey, messageId) {
  return ongoingChatState[chatKey]?.messages.find((message) => message.id === messageId);
}

function renderChatBubble(message) {
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
      <p>${message.text}</p>
    </div>`;
}

function renderChatThread(chatKey = getActiveChatKey(), { threadClass = "chat-thread" } = {}) {
  const chat = ongoingChatState[chatKey];
  if (!chat) return "";

  return `
    <div class="${threadClass}" data-chat-key="${chatKey}">
      <p class="chat-date">${chat.sessionDate}</p>
      ${chat.messages.map((message) => renderChatBubble(message)).join("")}
    </div>`;
}

function refreshChatThread(chatKey = getActiveChatKey()) {
  if (!chatKey) return;
  const existing = document.querySelector(`[data-chat-key="${chatKey}"]`);
  if (!existing) return;
  const threadClass = existing.classList.contains("video-chat-thread") ? "video-chat-thread" : "chat-thread";
  existing.outerHTML = renderChatThread(chatKey, { threadClass });
}

function renderChatMessageMenu() {
  return `
    <div class="chat-message-menu" role="menu" aria-hidden="true" hidden>
      <button type="button" class="chat-message-menu__item" role="menuitem" data-action="recall">撤回</button>
      <button type="button" class="chat-message-menu__item" role="menuitem" data-action="copy">复制</button>
      <button type="button" class="chat-message-menu__item" role="menuitem" data-action="quote">引用</button>
    </div>`;
}

function renderChatPanel() {
  return `
    <section class="chat-panel" aria-label="聊天区域">
      ${renderChatThread("active-text")}
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

const defaultPrescriptionMedicines = [
  {
    index: 1,
    name: "阿奇霉素分散片",
    type: "处方药",
    spec: "0.125g*6片",
    usage: "口服",
    frequency: "1次/日",
    dose: "0.25毫克",
    quantity: "1",
    unit: "盒",
    risk: "高"
  }
];

const defaultPatientDetail = {
  weight: "XX",
  pregnancy: "否",
  phone: "XXXXXXXXXXX",
  liverAbnormal: "否",
  idCard: "XXXXXXXXXXXXXXXXXX",
  kidneyAbnormal: "否",
  allergies: "无"
};

function renderPatientInfoGrid(patientDetail = defaultPatientDetail) {
  return `
    <span>体重 /KG：${patientDetail.weight}</span>
    <span>*妊娠哺乳：　${patientDetail.pregnancy}</span>
    <span>手机号：${patientDetail.phone}</span>
    <span>*肝功能异常：　${patientDetail.liverAbnormal}</span>
    <span>证件号：${patientDetail.idCard}</span>
    <span>*肾功能异常：　${patientDetail.kidneyAbnormal}</span>
    <span>过敏史：${patientDetail.allergies}</span>`;
}

function renderMedicineTableRow(row, readonly = false) {
  return `
    <div class="medicine-table__row">
      <span>${row.index}</span>
      <span>${row.name}</span>
      <span>${row.type}</span>
      <span class="table-input">${row.spec}</span>
      <span class="table-input">${row.usage}</span>
      <span class="table-input">${row.frequency}</span>
      <span class="table-input">${row.dose}</span>
      <span>${row.quantity}</span>
      <span class="table-input">${row.unit}</span>
      ${renderRiskTag({ text: row.risk, size: "sm", className: "risk-small" })}
      ${
        readonly
          ? ""
          : renderButton({ text: "删除", tone: "text", size: "", className: "medicine-delete-btn" })
      }
    </div>`;
}

function renderDiagnosisTags(tags, readonly = false) {
  return tags
    .map(
      (tag) => `
        ${
          readonly
            ? `<span class="diagnosis-tag diagnosis-tag--readonly">`
            : `<button class="diagnosis-tag" type="button" aria-label="移除诊断：${tag}">`
        }
          <span>${tag}</span>
          ${
            readonly
              ? ""
              : `<span class="diagnosis-tag__close" aria-hidden="true">
                  <img src="${assetUrl("assets/diagnosis-tag-close.svg")}" alt="" />
                </span>`
          }
        ${readonly ? "</span>" : "</button>"}`
    )
    .join("");
}

function renderPrescriptionPanel(options = {}) {
  const normalized = typeof options === "boolean" ? { includeSecondMedicine: options } : options;
  const { includeSecondMedicine = false, readonly = false, record = null } = normalized;

  const patientName =
    readonly && record
      ? `${record.patient}&nbsp;&nbsp;${record.patientGender || ""}&nbsp;&nbsp;${record.age}`
      : "柯思达&nbsp;&nbsp;男&nbsp;&nbsp;30岁";
  const patientDetail = readonly && record?.patientDetail ? record.patientDetail : defaultPatientDetail;
  const diagnosisTags =
    readonly && record
      ? record.diagnosisTags || [record.diagnosis].filter(Boolean)
      : ["支气管肺炎"];
  const medicines =
    readonly && record?.prescriptionMedicines?.length
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
              : renderSelectField({ label: "请选择诊断", size: "lg", className: "diagnosis-select", showChevron: false })
          }
          <div class="diagnosis-input">${renderDiagnosisTags(diagnosisTags, readonly)}</div>
        </div>
      </div>
      <div class="section-divider"></div>
      <div class="medicine-section">
        <h3>所需药品</h3>
        <div class="medicine-scroll-area">
          ${readonly ? "" : renderSearchField({ className: "medicine-search" })}
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


function renderTextPage() {
  return `
    <div class="app-shell room-shell text-shell app-shell--responsive">
      ${renderRoomTopbar()}
      ${renderRoomSidebar()}
      ${renderTextMain()}
      ${renderQuickReplyDialog()}
      ${renderRiskWarningDialog()}
      ${renderChatMessageMenu()}
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
      ${renderChatThread("active-video", { threadClass: "video-chat-thread" })}
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
            ${renderDurationChip("icon", consultationRecords.find((record) => record.id === "active-video")?.elapsedSeconds ?? 0)}
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
    <div class="app-shell room-shell text-shell video-shell app-shell--responsive">
      ${renderRoomTopbar()}
      ${renderRoomSidebar()}
      ${renderVideoMain()}
      ${renderQuickReplyDialog()}
      ${renderRiskWarningDialog()}
      ${renderChatMessageMenu()}
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
            <span class="notice-card__date">${latestAnnouncement.date}</span>
          </div>
          <div class="divider"></div>
        </div>
        <article class="announcement">
          <div class="announcement__top">
            <div class="announcement__title-row">
              <h3 class="announcement__title">${latestAnnouncement.title}</h3>
              ${renderReadTag("unread", "announcement-tag")}
            </div>
            <div class="announcement__body">${latestAnnouncement.content.split("\n").slice(0, 2).join("\n")}
<button class="announcement__detail-trigger" type="button" data-announcement-id="${latestAnnouncement.id}">……展开详情</button></div>
          </div>
          <p class="announcement__footer">${latestAnnouncement.publisher}</p>
        </article>
        ${renderButton({ text: "查看全部公告", tone: "block-outline", size: "", className: "announcement-list-trigger" })}
      </div>
    </section>`;
}

function renderAnnouncementDialog() {
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
            <h3>${latestAnnouncement.title}</h3>
            <span>${latestAnnouncement.date}</span>
          </div>
          <p>${latestAnnouncement.content}</p>
          <div class="announcement-dialog__publisher">${latestAnnouncement.publisher}</div>
        </div>
      </section>
    </div>`;
}

function renderAnnouncementListDialog() {
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
          ${announcements
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

function renderQuickEntryDialog() {
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
          ${quickEntryOptions
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

function renderQuickActions() {
  return `
    <section class="card quick-entry-card" aria-label="高频操作入口">
      <h2 class="card__title">高频操作入口</h2>
      <div class="quick-grid">
        ${quickActions
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
  document.body.classList.add("page-mode-responsive", `page-view-${appView}`);
  document.getElementById("app").innerHTML =
    appView === "room"
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

function enableEndConsultButton() {
  document.querySelectorAll(".end-consult-trigger").forEach((button) => {
    button.disabled = false;
    button.classList.remove("jh-btn--soft-danger");
    button.classList.add("jh-btn--danger");
  });
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
  const wasOpen = overlay.classList.contains("is-open");
  overlay.classList.remove("is-open");
  overlay.setAttribute("aria-hidden", "true");
  if (wasOpen) {
    enableEndConsultButton();
  }
}

function openAnnouncementDialog(event) {
  event?.preventDefault();
  event?.stopPropagation();
  const overlay = document.querySelector(".announcement-overlay");
  if (!overlay) return;
  const announcementId =
    event?.currentTarget?.dataset?.announcementId || event?.target?.closest("[data-announcement-id]")?.dataset?.announcementId;
  const announcement = announcements.find((item) => item.id === announcementId) || latestAnnouncement;
  overlay.querySelector(".announcement-dialog__meta h3").textContent = announcement.title;
  overlay.querySelector(".announcement-dialog__meta span").textContent = announcement.date;
  overlay.querySelector(".announcement-dialog__body p").textContent = announcement.content;
  overlay.querySelector(".announcement-dialog__publisher").textContent = announcement.publisher;
  overlay.classList.add("is-open");
  overlay.setAttribute("aria-hidden", "false");
  overlay.querySelector(".announcement-dialog__close")?.focus();
}

function closeAnnouncementDialog(event) {
  event?.preventDefault();
  event?.stopPropagation();
  const overlay = document.querySelector(".announcement-overlay");
  if (!overlay) return;
  overlay.classList.remove("is-open");
  overlay.setAttribute("aria-hidden", "true");
}

function openAnnouncementListDialog(event) {
  event?.preventDefault();
  event?.stopPropagation();
  const overlay = document.querySelector(".announcement-list-overlay");
  if (!overlay) return;
  overlay.classList.add("is-open");
  overlay.setAttribute("aria-hidden", "false");
  overlay.querySelector(".announcement-list-dialog__close")?.focus();
}

function closeAnnouncementListDialog(event) {
  event?.preventDefault();
  event?.stopPropagation();
  const overlay = document.querySelector(".announcement-list-overlay");
  if (!overlay) return;
  overlay.classList.remove("is-open");
  overlay.setAttribute("aria-hidden", "true");
}

function openQuickEntryDialog(event) {
  event?.preventDefault();
  event?.stopPropagation();
  const overlay = document.querySelector(".quick-entry-overlay");
  if (!overlay) return;
  overlay.classList.add("is-open");
  overlay.setAttribute("aria-hidden", "false");
  overlay.querySelector(".quick-entry-dialog__close")?.focus();
}

function closeQuickEntryDialog(event) {
  event?.preventDefault();
  event?.stopPropagation();
  const overlay = document.querySelector(".quick-entry-overlay");
  if (!overlay) return;
  overlay.classList.remove("is-open");
  overlay.setAttribute("aria-hidden", "true");
}

function toggleUserMenu(trigger, forceOpen) {
  const menu = trigger.closest(".user-chip, .room-user")?.querySelector(".user-menu");
  if (!menu) return;
  const isOpen = menu.classList.contains("is-open");
  const nextOpen = typeof forceOpen === "boolean" ? forceOpen : !isOpen;
  document.querySelectorAll(".user-menu.is-open").forEach((node) => {
    if (node !== menu) {
      node.classList.remove("is-open");
      node.setAttribute("aria-hidden", "true");
      node.closest(".user-chip, .room-user")?.querySelector(".user-menu-trigger")?.setAttribute("aria-expanded", "false");
    }
  });
  menu.classList.toggle("is-open", nextOpen);
  menu.setAttribute("aria-hidden", String(!nextOpen));
  trigger.setAttribute("aria-expanded", String(nextOpen));
}

function closeUserMenus() {
  document.querySelectorAll(".user-menu.is-open").forEach((menu) => {
    menu.classList.remove("is-open");
    menu.setAttribute("aria-hidden", "true");
    menu.closest(".user-chip, .room-user")?.querySelector(".user-menu-trigger")?.setAttribute("aria-expanded", "false");
  });
}

function getRoomFilters() {
  const messageList = document.querySelector(".message-list");
  return {
    type: messageList?.dataset.filterType || "all",
    state: messageList?.dataset.filterState || "ongoing"
  };
}

function updateRoomMessageList() {
  const messageList = document.querySelector(".message-list");
  if (!messageList) return;
  const filters = getRoomFilters();
  const activeId = document.querySelector(".message-item.is-active")?.dataset.recordId || "";
  messageList.innerHTML = renderMessageList({ ...filters, activeRecord: activeId });
  bindMessageItems();
}

function restoreOngoingMain() {
  const main = getConsultMainElement();
  if (!main) return;
  if (appView === "text") {
    main.outerHTML = renderTextMain();
  } else if (appView === "video") {
    main.outerHTML = renderVideoMain();
  } else {
    main.outerHTML = renderRoomMain();
  }
}

function showPrescriptionTrace(record) {
  const main = getConsultMainElement();
  if (!main) return;
  window.clearInterval(startOngoingTimers.timer);
  main.outerHTML = renderPrescriptionTraceMain(record);
  setConsultShellReadonly(true);
  bindPrescriptionTraceCards();
}

function handleMessageItemClick(item) {
  if (item.dataset.badgeKey) {
    rememberDismissedMessageBadge(item.dataset.badgeKey);
  }
  item.querySelector(".message-item__badge")?.remove();
  const messageList = item.closest(".message-list");
  messageList?.querySelectorAll(".message-item").forEach((node) => node.classList.remove("is-active"));
  item.classList.add("is-active");
  const record = consultationRecords.find((entry) => entry.id === item.dataset.recordId);
  if (record?.state === "ended") {
    showPrescriptionTrace(record);
    return;
  }

  setConsultShellReadonly(false);

  if (isConsultReadonlyView() && (appView === "text" || appView === "video")) {
    const activeId = appView === "text" ? "active-text" : "active-video";
    if (record?.id === activeId) {
      restoreOngoingMain();
      bindConsultWorkspace();
      startOngoingTimers();
      return;
    }
  }

  if (item.dataset.targetView === "video") {
    window.location.href = getVideoHref();
  } else if (item.dataset.targetView === "text") {
    window.location.href = getTextHref();
  }
}

function bindMessageItems() {
  document.querySelectorAll(".message-item").forEach((item) => {
    if (item.dataset.bound === "true") return;
    item.dataset.bound = "true";
    item.addEventListener("click", () => handleMessageItemClick(item));
  });
}

function bindPrescriptionTraceCards() {
  document.querySelectorAll(".prescription-history-open").forEach((button) => {
    if (button.dataset.bound === "true") return;
    button.dataset.bound = "true";
    button.addEventListener("click", () => {
      const recordId = document.querySelector(".message-item.is-active")?.dataset.recordId;
      window.location.href = getHistoryHref(recordId);
    });
  });
}

function getActiveOngoingRecordId() {
  if (appView === "text") return "active-text";
  if (appView === "video") return "active-video";
  return null;
}

function syncActiveElapsedSeconds(seconds) {
  const recordId = getActiveOngoingRecordId();
  if (!recordId) return;
  const record = consultationRecords.find((entry) => entry.id === recordId);
  if (record) record.elapsedSeconds = seconds;
}

function closeChatMessageMenu() {
  const menu = document.querySelector(".chat-message-menu");
  if (!menu) return;
  menu.hidden = true;
  menu.classList.remove("is-open");
  menu.setAttribute("aria-hidden", "true");
  menu.style.left = "";
  menu.style.top = "";
  delete menu.dataset.messageId;
  delete menu.dataset.chatKey;
}

function openChatMessageMenu(bubble, event) {
  if (isConsultReadonlyView()) return;
  event.preventDefault();
  const menu = document.querySelector(".chat-message-menu");
  if (!menu) return;

  const chatKey = bubble.closest("[data-chat-key]")?.dataset.chatKey || getActiveChatKey() || "";
  menu.dataset.messageId = bubble.dataset.messageId || "";
  menu.dataset.chatKey = chatKey;
  menu.hidden = false;
  menu.classList.add("is-open");
  menu.setAttribute("aria-hidden", "false");

  const offset = 4;
  menu.style.left = `${event.clientX + offset}px`;
  menu.style.top = `${event.clientY + offset}px`;

  requestAnimationFrame(() => {
    const rect = menu.getBoundingClientRect();
    const left = Math.min(event.clientX + offset, window.innerWidth - rect.width - 8);
    const top = Math.min(event.clientY + offset, window.innerHeight - rect.height - 8);
    menu.style.left = `${Math.max(8, left)}px`;
    menu.style.top = `${Math.max(8, top)}px`;
  });
}

async function copyChatMessageText(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast("已复制");
  } catch {
    showToast("复制失败");
  }
}

function handleChatMessageMenuAction(action) {
  const menu = document.querySelector(".chat-message-menu");
  if (!menu) return;
  const chatKey = menu.dataset.chatKey;
  const messageId = menu.dataset.messageId;
  const message = findOngoingChatMessage(chatKey, messageId);
  if (!message || message.recalled) {
    closeChatMessageMenu();
    return;
  }

  if (action === "recall") {
    message.recalled = true;
    refreshChatThread(chatKey);
    showToast("消息已撤回");
  } else if (action === "copy") {
    copyChatMessageText(message.text);
  } else if (action === "quote") {
    const input = document.querySelector(".jh-chat-input textarea");
    if (input) {
      const quoteLine = `引用：${message.text}`;
      input.value = input.value.trim() ? `${input.value.trim()}\n${quoteLine}` : quoteLine;
      input.focus();
    }
    showToast("已引用到输入框");
  }

  closeChatMessageMenu();
}

function bindChatMessageMenu() {
  const menu = document.querySelector(".chat-message-menu");
  if (!menu || menu.dataset.bound === "true") return;
  menu.dataset.bound = "true";

  document.addEventListener("contextmenu", (event) => {
    if (!document.querySelector(".text-card:not(.text-card--readonly)")) return;
    const bubble = event.target.closest(
      '.chat-bubble--doctor[data-chat-context="doctor"]:not(.chat-bubble--recalled)'
    );
    if (!bubble) return;
    openChatMessageMenu(bubble, event);
  });

  menu.querySelectorAll(".chat-message-menu__item").forEach((item) => {
    item.addEventListener("click", (event) => {
      event.stopPropagation();
      handleChatMessageMenuAction(item.dataset.action);
    });
  });

  document.addEventListener("click", (event) => {
    if (!menu.classList.contains("is-open")) return;
    if (menu.contains(event.target)) return;
    closeChatMessageMenu();
  });

  document.addEventListener("scroll", closeChatMessageMenu, true);
}

function bindConsultWorkspace() {
  document.querySelectorAll(".ai-reply__options button").forEach((option) => {
    if (option.dataset.bound === "true") return;
    option.dataset.bound = "true";
    option.addEventListener("click", () => {
      const input = document.querySelector(".jh-chat-input textarea");
      if (input) {
        input.value = option.textContent.trim();
        input.focus();
      }
    });
  });

  document.querySelectorAll(".quick-reply-trigger").forEach((button) => {
    if (button.dataset.bound === "true") return;
    button.dataset.bound = "true";
    button.addEventListener("click", openQuickReplyDialog);
  });

  document.querySelectorAll(".jh-prescription-submit").forEach((button) => {
    if (button.dataset.bound === "true") return;
    button.dataset.bound = "true";
    button.addEventListener("click", openRiskWarningDialog);
  });

  document.querySelectorAll(".end-consult-trigger").forEach((button) => {
    if (button.dataset.bound === "true") return;
    button.dataset.bound = "true";
    button.addEventListener("click", () => {
      if (button.disabled) return;
      showToast("结束问诊");
    });
  });
}

function startOngoingTimers() {
  window.clearInterval(startOngoingTimers.timer);
  if (isConsultReadonlyView() || !document.querySelector("[data-duration-timer]")) {
    return;
  }
  const tick = () => {
    document.querySelectorAll("[data-ongoing-timer], [data-duration-timer]").forEach((node) => {
      const nextSeconds = Number(node.dataset.elapsed || 0) + 1;
      node.dataset.elapsed = String(nextSeconds);
      if (node.matches("[data-duration-timer]")) {
        syncActiveElapsedSeconds(nextSeconds);
      }
      const text = formatDuration(nextSeconds);
      if (node.matches("[data-duration-timer]")) {
        const label = node.querySelector("strong");
        if (label) label.textContent = `问诊持续时长：${text}`;
      } else {
        node.textContent = `持续 ${text}`;
      }
    });
  };
  startOngoingTimers.timer = window.setInterval(tick, 1000);
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

  bindConsultWorkspace();
  bindChatMessageMenu();

  const quickReplyOverlay = document.querySelector(".quick-reply-overlay");

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

  if (riskWarningOverlay) {
    riskWarningOverlay.querySelector(".risk-warning-dialog__close")?.addEventListener("click", closeRiskWarningDialog);
    riskWarningOverlay.addEventListener("click", (event) => {
      if (event.target === riskWarningOverlay) {
        closeRiskWarningDialog();
      }
    });
  }

  const announcementOverlay = document.querySelector(".announcement-overlay");
  const announcementListOverlay = document.querySelector(".announcement-list-overlay");
  const quickEntryOverlay = document.querySelector(".quick-entry-overlay");
  document.querySelectorAll(".announcement__detail-trigger").forEach((button) => {
    button.addEventListener("click", openAnnouncementDialog);
  });
  document.querySelectorAll(".announcement-list-trigger").forEach((button) => {
    button.addEventListener("click", openAnnouncementListDialog);
  });

  if (announcementOverlay) {
    announcementOverlay
      .querySelector(".announcement-dialog__close")
      ?.addEventListener("click", closeAnnouncementDialog);
    announcementOverlay.addEventListener("click", (event) => {
      if (event.target === announcementOverlay) {
        closeAnnouncementDialog(event);
      }
    });
    announcementOverlay.querySelector(".announcement-dialog")?.addEventListener("click", (event) => {
      event.stopPropagation();
    });
  }

  if (announcementListOverlay) {
    announcementListOverlay
      .querySelector(".announcement-list-dialog__close")
      ?.addEventListener("click", closeAnnouncementListDialog);
    announcementListOverlay.addEventListener("click", (event) => {
      if (event.target === announcementListOverlay) {
        closeAnnouncementListDialog(event);
      }
    });
    announcementListOverlay.querySelector(".announcement-list-dialog")?.addEventListener("click", (event) => {
      event.stopPropagation();
    });
    announcementListOverlay.querySelectorAll(".announcement-list-item").forEach((item) => {
      item.addEventListener("click", (event) => {
        closeAnnouncementListDialog(event);
        openAnnouncementDialog(event);
      });
    });
  }

  if (quickEntryOverlay) {
    quickEntryOverlay
      .querySelector(".quick-entry-dialog__close")
      ?.addEventListener("click", closeQuickEntryDialog);
    quickEntryOverlay.addEventListener("click", (event) => {
      if (event.target === quickEntryOverlay) {
        closeQuickEntryDialog(event);
      }
    });
    quickEntryOverlay.querySelector(".quick-entry-dialog")?.addEventListener("click", (event) => {
      event.stopPropagation();
    });
    quickEntryOverlay.querySelectorAll(".quick-entry-option").forEach((optionButton) => {
      optionButton.addEventListener("click", (event) => {
        const option = quickEntryOptions[Number(optionButton.dataset.optionIndex)];
        if (!option) return;
        const addCard = document.querySelector(".quick-card--add");
        if (addCard) {
          addCard.classList.remove("quick-card--add");
          addCard.dataset.action = option.desc;
          addCard.querySelector(".icon-box").innerHTML = icons[option.icon];
          addCard.querySelector(".quick-card__title")?.remove();
          addCard.querySelector(".quick-card__desc")?.insertAdjacentHTML("beforebegin", `<span class="quick-card__title">${option.title}</span>`);
          addCard.querySelector(".quick-card__desc").textContent = option.desc;
        }
        closeQuickEntryDialog(event);
        showToast(`已添加${option.title}`);
      });
    });
  }

  const consultCard = document.querySelector(".consult-card");
  if (consultCard) {
    consultCard.addEventListener("click", () => {
      window.location.href = getRoomHref();
    });
  }

  document.querySelectorAll(".quick-card").forEach((card) => {
    card.addEventListener("click", (event) => {
      if (card.classList.contains("quick-card--add")) {
        openQuickEntryDialog(event);
        return;
      }
      showToast(card.dataset.action);
    });
  });

  document
    .querySelectorAll(".topbar__actions .jh-btn, .room-service-btn")
    .forEach((button) => {
      button.addEventListener("click", () => {
        showToast(button.textContent.trim());
      });
    });

  document.querySelectorAll(".user-menu-trigger").forEach((trigger) => {
    trigger.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      toggleUserMenu(trigger);
    });
  });

  document.querySelectorAll(".user-menu__item").forEach((item) => {
    item.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      closeUserMenus();
      showToast(item.dataset.action || item.textContent.trim());
    });
  });

  document.addEventListener("click", closeUserMenus);

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
      const messageList = document.querySelector(".message-list");
      if (messageList) {
        if (tag.dataset.filterType) {
          messageList.dataset.filterType = tag.dataset.filterType;
        }
        if (tag.dataset.filterState) {
          messageList.dataset.filterState = tag.dataset.filterState;
        }
        updateRoomMessageList();
        const filters = getRoomFilters();
        if (filters.state === "ended") {
          const firstEnded = consultationRecords.find(
            (record) => (filters.type === "all" || record.type === filters.type) && record.state === "ended"
          );
          if (firstEnded) {
            showPrescriptionTrace(firstEnded);
            document.querySelector(`.message-item[data-record-id="${firstEnded.id}"]`)?.classList.add("is-active");
          }
        } else if (filters.state === "ongoing") {
          setConsultShellReadonly(false);
          if (isConsultReadonlyView()) {
            restoreOngoingMain();
            bindConsultWorkspace();
            startOngoingTimers();
          }
        }
      }
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

  bindMessageItems();

  bindPrescriptionTraceCards();

  document.querySelectorAll(".history-back").forEach((button) => {
    button.addEventListener("click", () => {
      window.location.href = getRoomHref();
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeQuickReplyDialog();
      closeRiskWarningDialog();
      closeAnnouncementDialog(event);
      closeAnnouncementListDialog(event);
      closeQuickEntryDialog(event);
      closeUserMenus();
      closeChatMessageMenu();
    }
  });
}

renderApp();
bindInteractions();
startOngoingTimers();
