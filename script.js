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
    <img class="brand-mark" src="${assetUrl("assets/home-logo-figma.png")}" alt="嘉虹健康" />`,
  home: `
    <img class="menu-icon" src="${assetUrl("assets/home-active-icon.svg")}" alt="" aria-hidden="true" />`,
  dashboard: `
    <img class="menu-icon" src="${assetUrl("assets/home-trello-icon.svg")}" alt="" aria-hidden="true" />`,
  circle: `
    <img class="menu-icon" src="${assetUrl("assets/home-disc-icon.svg")}" alt="" aria-hidden="true" />`,
  clipboard: `
    <img class="menu-icon" src="${assetUrl("assets/home-clipboard-icon.svg")}" alt="" aria-hidden="true" />`,
  checkSquare: `
    <img class="menu-icon" src="${assetUrl("assets/home-check-square-icon.svg")}" alt="" aria-hidden="true" />`,
  briefcase: `
    <img class="menu-icon" src="${assetUrl("assets/home-briefcase-icon.svg")}" alt="" aria-hidden="true" />`,
  calendar: `
    <img class="menu-icon" src="${assetUrl("assets/home-calendar-icon.svg")}" alt="" aria-hidden="true" />`,
  user: `
    <img class="menu-icon" src="${assetUrl("assets/home-user-icon.svg")}" alt="" aria-hidden="true" />`,
  shield: `
    <img class="menu-icon" src="${assetUrl("assets/home-pocket-icon.svg")}" alt="" aria-hidden="true" />`,
  menu: `
    <img class="menu-icon" src="${assetUrl("assets/home-menu-icon.svg")}" alt="" aria-hidden="true" />`,
  stethoscope: `
    <img class="consult-card__icon-img" src="${assetUrl("assets/consult-icon.svg")}" alt="" aria-hidden="true" />`,
  quickCalendar: `
    <span class="quick-icon quick-icon--schedule" aria-hidden="true">
      <svg width="23" height="24" viewBox="0 0 23 24" fill="none">
        <path d="M18.2382 0.86853H4.34242C2.42381 0.86853 0.868469 2.47437 0.868469 4.45526V18.8022C0.868469 20.7831 2.42381 22.3889 4.34242 22.3889H18.2382C20.1568 22.3889 21.7122 20.7831 21.7122 18.8022V4.45526C21.7122 2.47437 20.1568 0.86853 18.2382 0.86853Z" stroke="url(#scheduleBox)" stroke-width="1.73698"/>
        <defs><linearGradient id="scheduleBox" x1="21.7122" y1="11.6287" x2="0.868469" y2="11.6287" gradientUnits="userSpaceOnUse"><stop stop-color="#3B92FF"/><stop offset="1" stop-color="#006EF9"/></linearGradient></defs>
      </svg>
      <svg class="quick-icon__mark" width="14" height="8" viewBox="0 0 14 8" fill="none">
        <path d="M0.868469 0V7.82184M12.8685 0V7.82184" stroke="url(#scheduleMark)" stroke-width="1.73698"/>
        <defs><linearGradient id="scheduleMark" x1="12.8685" y1="3.91092" x2="0.868469" y2="3.91092" gradientUnits="userSpaceOnUse"><stop stop-color="#3B92FF"/><stop offset="1" stop-color="#006EF9"/></linearGradient></defs>
      </svg>
    </span>`,
  document: `
    <svg width="19" height="25" viewBox="0 0 19 25" fill="none" aria-hidden="true">
      <path d="M3.41847 6.49276H15.3185M3.41847 10.5101H15.3185M3.41847 14.5274H11.9185M1.86847 23.3654H16.8685C17.4208 23.3654 17.8685 22.9177 17.8685 22.3654V1.86853C17.8685 1.31625 17.4208 0.86853 16.8685 0.86853H1.86847C1.31618 0.86853 0.868469 1.31625 0.868469 1.86853V22.3654C0.868469 22.9177 1.31618 23.3654 1.86847 23.3654Z" stroke="url(#docIcon)" stroke-width="1.73698"/>
      <defs><linearGradient id="docIcon" x1="17.8685" y1="12.117" x2="0.868469" y2="12.117" gradientUnits="userSpaceOnUse"><stop stop-color="#3B92FF"/><stop offset="1" stop-color="#006EF9"/></linearGradient></defs>
    </svg>`,
  clock: `
    <span class="quick-icon quick-icon--clock" aria-hidden="true">
      <svg width="28" height="27" viewBox="0 0 28 27" fill="none">
        <path d="M13.5148 25.4867C20.4183 25.4867 26.0148 20.0085 26.0148 13.2507C26.0148 6.493 20.4183 1.01477 13.5148 1.01477C6.61121 1.01477 1.01477 6.493 1.01477 13.2507C1.01477 20.0085 6.61121 25.4867 13.5148 25.4867Z" stroke="url(#clockCircle)" stroke-width="2.02957"/>
        <defs><linearGradient id="clockCircle" x1="26.0148" y1="13.2507" x2="1.01477" y2="13.2507" gradientUnits="userSpaceOnUse"><stop stop-color="#3B92FF"/><stop offset="1" stop-color="#006EF9"/></linearGradient></defs>
      </svg>
      <svg class="quick-icon__hand" width="8" height="13" viewBox="0 0 8 13" fill="none">
        <path d="M1.01477 0V8.22257L7.01477 11.7465" stroke="url(#clockHand)" stroke-width="2.02957"/>
        <defs><linearGradient id="clockHand" x1="7.01477" y1="5.87326" x2="1.01477" y2="5.87326" gradientUnits="userSpaceOnUse"><stop stop-color="#3B92FF"/><stop offset="1" stop-color="#006EF9"/></linearGradient></defs>
      </svg>
    </span>`,
  plus: `
    <svg width="21" height="21" viewBox="0 0 21 21" fill="none" aria-hidden="true">
      <path d="M1.14075 10.1407L19.1407 10.1407M10.1407 1.14075L10.1407 19.1407" stroke="#D8DDE1" stroke-width="2.28148" stroke-linecap="square"/>
    </svg>`,
  checkbox: `
    <svg width="27" height="27" viewBox="0 0 27 27" fill="none" aria-hidden="true">
      <rect width="24" height="24" rx="4" fill="url(#checkboxFill)"/>
      <path fill-rule="evenodd" clip-rule="evenodd" d="M18.6444 8.07979C18.8415 8.27941 18.8415 8.6004 18.6444 8.80002L10.8892 16.6538C10.7011 16.8444 10.3935 16.8446 10.205 16.6544L6.35617 12.769C6.15874 12.5697 6.15822 12.2487 6.35502 12.0487L7.05545 11.3371C7.25579 11.1336 7.58384 11.1331 7.78483 11.336L7.96762 11.5205L10.5451 14.1225L17.2135 7.36933C17.4141 7.16611 17.7422 7.16611 17.9429 7.36933L18.6444 8.07979Z" fill="white"/>
      <defs><linearGradient id="checkboxFill" x1="24" y1="12" x2="0" y2="12" gradientUnits="userSpaceOnUse"><stop stop-color="#3B92FF"/><stop offset="1" stop-color="#006EF9"/></linearGradient></defs>
    </svg>`
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

const serviceState = services.reduce((state, service) => {
  state[service.key] = service.enabled;
  return state;
}, {});

function renderServiceCheckboxIcon() {
  return `
    <svg class="check-icon__svg" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect width="24" height="24" rx="4" fill="#006EF9"/>
      <path d="M7 12.2L10.2 15.4L17.4 8.2" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
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
  const currentVersionPath = getCurrentRoutePath();
  const versionNav = versionRoutes
    .map((item) => {
      const normalizedItemPath = item.path.replace(/\/+$/, "") || "/";
      const aliases = item.aliases || [normalizedItemPath];
      const isActive = aliases.some(
        (alias) => currentVersionPath === alias || currentVersionPath.startsWith(`${alias}/`)
      );
      return `<a class="version-nav__item${isActive ? " is-active" : ""}" href="${getVersionHref(item.path)}" data-mode="${item.mode}">${item.label}</a>`;
    })
    .join("");

  return `
    <header class="topbar">
      <div class="topbar__left">
        <nav class="version-nav" aria-label="页面版本导航">
          ${versionNav}
        </nav>
      </div>
      <div class="topbar__right">
        <div class="certificate">
          <span>证书到期时间</span>
          <span>2027-01-15</span>
        </div>
        <div class="topbar__actions">
          <button class="jh-btn jh-btn--md jh-btn--primary btn btn--primary" type="button">在线客服</button>
          <button class="jh-btn jh-btn--md jh-btn--outline-secondary btn btn--outline" type="button">医生招聘</button>
        </div>
        <div class="user-chip">
          <div class="user-chip__body">
            <span class="avatar" aria-hidden="true">
              <img src="${assetUrl("assets/avatar-source.png")}" alt="" />
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
      <img class="consult-card__bg" src="${assetUrl("assets/consult-bg.png")}" alt="" aria-hidden="true" />
      <div class="consult-card__content">
        <div class="consult-card__icon">${icons.stethoscope}</div>
        <h2>进入问诊室</h2>
        <p>点击开始接诊患者</p>
      </div>
    </button>`;
}

function renderRoomCheckbox(label) {
  return `
    <span class="room-check" aria-hidden="true">
      <img src="${assetUrl("assets/room-check.svg")}" alt="" />
    </span>
    <span class="room-check__label">${label}</span>`;
}

function renderRoomTopbar() {
  return `
    <header class="room-topbar">
      <div class="room-topbar__inner">
        <a class="jh-btn jh-btn--md jh-btn--neutral jh-btn--icon room-back-btn" href="${getHomeHref()}" aria-label="返回首页">
          <img src="${assetUrl("assets/room-back.svg")}" alt="" />
          <span>返回首页</span>
        </a>
        <div class="room-topbar__right">
          <button class="jh-btn jh-btn--md jh-btn--primary btn btn--primary room-service-btn" type="button">在线客服</button>
          <button class="room-status" type="button" aria-label="出诊状态：在线">
            <span class="badge room-status__badge">在线</span>
            <span class="room-status__chevron" aria-hidden="true">
              <img src="${assetUrl("assets/room-chevron.svg")}" alt="" />
            </span>
          </button>
          <div class="room-service-switches" aria-label="服务类型">
            <button class="room-service-check" type="button" aria-pressed="true">
              ${renderRoomCheckbox("视频问诊")}
            </button>
            <button class="room-service-check" type="button" aria-pressed="true">
              ${renderRoomCheckbox("图文问诊")}
            </button>
          </div>
          <div class="room-user">
            <span class="room-user__divider" aria-hidden="true"></span>
            <span class="avatar" aria-hidden="true">
              <img src="${assetUrl("assets/avatar-source.png")}" alt="" />
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
          <button class="jh-btn jh-btn--md jh-btn--outline-secondary room-tag is-active" type="button">全部</button>
          <button class="jh-btn jh-btn--md jh-btn--outline-secondary room-tag" type="button">图文</button>
          <button class="jh-btn jh-btn--md jh-btn--outline-secondary room-tag" type="button">视频</button>
        </div>
        <div class="room-tags room-tags--state">
          <button class="jh-btn jh-btn--md jh-btn--outline-secondary room-tag room-tag--wide is-active" type="button">进行中</button>
          <button class="jh-btn jh-btn--md jh-btn--outline-secondary room-tag room-tag--wide" type="button">已结束</button>
        </div>
      </div>
      ${
        hasMessages
          ? `<div class="message-list" aria-label="会话列表">
              ${renderMessageItem("图文", appView === "text", "text")}
              ${renderMessageItem("视频", appView === "video", "video")}
              ${renderMessageItem("图文", false, "text")}
              ${renderMessageItem("视频", false, "video")}
            </div>`
          : ""
      }
    </aside>`;
}

function renderMessageItem(type, active, targetView) {
  return `
    <button class="message-item${active ? " is-active" : ""}" type="button" data-target-view="${targetView}">
      <span class="message-item__stripe" aria-hidden="true"></span>
      <span class="message-item__body">
        <span class="message-item__type message-item__type--${type === "图文" ? "text" : "video"}">${type}</span>
        <span class="message-item__title">武汉市好药师大药房</span>
        <span class="message-item__preview">您好！请问那个药怎么...</span>
      </span>
      ${active ? "" : '<span class="message-item__badge">1</span>'}
    </button>`;
}

function renderRoomMain() {
  return `
    <main class="room-main">
      <section class="room-card" aria-label="候诊室">
        <button class="jh-btn jh-btn--md jh-btn--outline-secondary btn btn--outline room-refresh" type="button">刷新列表</button>
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
            <span class="risk-tag risk-tag--inspection">迎检</span>
            <span class="risk-tag risk-tag--medicine">中药</span>
          </div>
          <div class="pharmacy-bar__right">
            <span class="duration-chip">
              <span class="duration-chip__clock" aria-hidden="true"></span>
              <strong>问诊持续时长：00:00:55</strong>
            </span>
            <button class="jh-btn jh-btn--md jh-btn--danger danger-btn" type="button">取消问诊</button>
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
          <span class="ai-spark" aria-hidden="true">✦</span>
          <h3>智能推荐回复</h3>
        </div>
        <div class="ai-reply__options">
          <button class="jh-btn jh-btn--md jh-btn--outline-primary ai-option-btn" type="button">头痛发烧多久啦？体温多少度？</button>
          <button class="jh-btn jh-btn--md jh-btn--outline-primary ai-option-btn" type="button">持续几天了？头痛具体位置在哪，程度如何？</button>
          <button class="jh-btn jh-btn--md jh-btn--outline-primary ai-option-btn" type="button">这是一串智能回复的文字内容，并且这是一行的最长字符数</button>
        </div>
        <div class="chat-input">
          <button class="jh-btn jh-btn--outline-primary chat-input__quick" type="button">快捷回复</button>
          <textarea aria-label="回复内容" placeholder="输入回复内容，或点击上方AI推荐快速填充..."></textarea>
          <button class="jh-btn jh-btn--md jh-btn--primary chat-input__send" type="button">发送</button>
        </div>
      </div>
    </section>`;
}

function renderPrescriptionPanel(includeSecondMedicine = false) {
  const medicineRow = `
          <div class="medicine-table__row">
            <span>1</span><span>阿奇霉素分散片</span><span>处方药</span><span class="table-input">0.125g*6片</span><span class="table-input">口服</span><span class="table-input">1次/日</span><span class="table-input">0.25毫克</span><span>1</span><span class="table-input">盒</span><span class="risk-small">高</span><button class="jh-btn--text" type="button">删除</button>
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
          <button class="jh-btn jh-btn--md jh-btn--outline-secondary select-control" type="button">请选择诊断</button>
          <div class="diagnosis-input">
            <span>急性支气管炎</span>
            <button type="button" aria-label="移除诊断">×</button>
          </div>
        </div>
      </div>
      <div class="section-divider"></div>
      <div class="medicine-section">
        <h3>所需药品</h3>
        <div class="medicine-search">
          <span class="medicine-search__icon" aria-hidden="true"></span>
          <span>请输入药品名称或首字母做模糊查询</span>
        </div>
        <div class="medicine-table">
          <div class="medicine-table__row medicine-table__head">
            <span>序号</span><span>药品名称</span><span>类型</span><span>规格</span><span>用法</span><span>服用频次</span><span>用量</span><span>数量</span><span>单位</span><span>风险</span><span>操作</span>
          </div>
          ${medicineRow}
          ${includeSecondMedicine ? medicineRow : ""}
        </div>
      </div>
      <div class="prescription-actions">
        <button class="jh-btn jh-btn--md jh-btn--outline-secondary select-control" type="button">请选择</button>
        <div>
          <button class="jh-btn jh-btn--md jh-btn--soft-danger end-btn" type="button">结束问诊</button>
          <button class="jh-btn jh-btn--md jh-btn--primary submit-btn" type="button">提交处方</button>
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
        <div class="chat-input">
          <button class="jh-btn jh-btn--outline-primary chat-input__quick" type="button">快捷回复</button>
          <textarea aria-label="回复内容" placeholder="输入回复内容，或点击上方AI推荐快速填充..."></textarea>
          <button class="jh-btn jh-btn--md jh-btn--primary chat-input__send" type="button">发送</button>
        </div>
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
            <span class="risk-tag risk-tag--inspection">迎检</span>
            <span class="risk-tag risk-tag--medicine">中药</span>
          </div>
          <div class="pharmacy-bar__right">
            <span class="duration-chip">
              <span class="duration-chip__clock" aria-hidden="true"></span>
              <strong>问诊持续时长：00:00:55</strong>
            </span>
            <button class="jh-btn jh-btn--md jh-btn--danger danger-btn" type="button">取消问诊</button>
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
          <span class="badge" data-status-text>在线</span>
        </div>
        <button class="switch is-on" type="button" aria-label="切换出诊状态" aria-pressed="true"></button>
      </div>
      <div class="service-list">
        ${services
          .map(
            (service) => `
              <button class="service-tile" type="button" role="checkbox" aria-checked="${serviceState[service.key]}" data-service-key="${service.key}">
                <span class="check-icon" aria-hidden="true">${renderServiceCheckboxIcon()}</span>
                <span>${service.label}</span>
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
              <span class="tag">未读</span>
            </div>
            <div class="announcement__body"> 一、图文问诊未回复弹框确认机制：图文问诊未回复弹框确认持续3秒。若顾客未回复，禁止开具处方。 
二、处方驳回流程调整：取消医生端驳回处方修改功能。药师端驳回处方的同时即作废该处方。医生开方前需谨慎核对，处方一旦错误将无驳回修改机会。 
<span class="link">……展开详情</span></div>
          </div>
          <p class="announcement__footer">成都双流九州通互联网医院</p>
        </article>
        <button class="jh-btn jh-btn--block-outline btn btn--outline btn--block" type="button">查看全部公告</button>
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
  const switchButton = document.querySelector(".switch");
  if (statusText && switchButton) {
    switchButton.addEventListener("click", () => {
      const nextState = !switchButton.classList.contains("is-on");
      switchButton.classList.toggle("is-on", nextState);
      switchButton.setAttribute("aria-pressed", String(nextState));
      statusText.textContent = nextState ? "在线" : "离线";
      statusText.style.color = nextState ? "" : "#747c85";
      statusText.style.background = nextState ? "" : "#eceef0";
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
      const input = document.querySelector(".chat-input textarea");
      if (input) {
        input.value = option.textContent.trim();
        input.focus();
      }
    });
  });

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

  document.querySelectorAll(".btn").forEach((button) => {
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
      const enabled = button.getAttribute("aria-pressed") === "true";
      button.setAttribute("aria-pressed", String(!enabled));
    });
  });

  document.querySelectorAll(".message-item").forEach((item) => {
    item.addEventListener("click", () => {
      item.querySelector(".message-item__badge")?.remove();
      if (item.dataset.targetView === "video") {
        window.location.href = getVideoHref();
      } else if (item.dataset.targetView === "text") {
        window.location.href = getTextHref();
      }
    });
  });
}

syncFixedViewport();
renderApp();
bindInteractions();
window.addEventListener("resize", syncFixedViewport);
