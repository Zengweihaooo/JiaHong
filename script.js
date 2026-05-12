const validAppModes = new Set(["responsive", "fixed-left", "fixed-center"]);
const requestedAppMode = window.JH_APP_MODE || "responsive";
const appMode = validAppModes.has(requestedAppMode) ? requestedAppMode : "responsive";
const assetUrl = (path) => new URL(path, document.currentScript.src).href;
const siteBasePath = new URL(".", document.currentScript.src).pathname.replace(/\/$/, "");
const fixedDesignWidth = 1440;
const appView =
  window.JH_APP_VIEW ||
  (location.pathname.includes("/video")
    ? "video"
    : location.pathname.includes("/text")
      ? "text"
      : location.pathname.includes("/room")
        ? "room"
        : "home");

const versionRoutes = [
  { label: "首页", path: "/", mode: "responsive" },
  { label: "版本 1", path: "/1/", mode: "responsive" },
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

function getCurrentVersionPath() {
  const normalized = location.pathname.replace(/\/+$/, "") || "/";
  const base = siteBasePath || "";
  if (base && normalized.startsWith(base)) {
    const rest = normalized.slice(base.length) || "/";
    return rest.startsWith("/") ? rest : `/${rest}`;
  }
  return normalized;
}

function getCurrentVersionBasePath() {
  const currentPath = getCurrentVersionPath();
  const match = currentPath.match(/^\/([123])(?:\/|$)/);
  return match ? `/${match[1]}/` : "/";
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
  return getVersionHref(getCurrentVersionBasePath());
}

const icons = {
  logo: `
    <img class="brand-mark" src="${assetUrl("assets/logo-source.png")}" alt="嘉虹健康" />`,
  home: `
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M6 14.6667V8.00004H10V14.6667M2 6.00004L8 1.33337L14 6.00004V13.3334C14 13.687 13.8595 14.0261 13.6095 14.2762C13.3594 14.5262 13.0203 14.6667 12.6667 14.6667H3.33333C2.97971 14.6667 2.64057 14.5262 2.39052 14.2762C2.14048 14.0261 2 13.687 2 13.3334V6.00004Z" stroke="#006EF9" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
  dashboard: `
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M12.6667 2H3.33333C2.59695 2 2 2.59695 2 3.33333V12.6667C2 13.403 2.59695 14 3.33333 14H12.6667C13.403 14 14 13.403 14 12.6667V3.33333C14 2.59695 13.403 2 12.6667 2Z" stroke="black" stroke-opacity="0.6" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M6.66667 4.66667H4.66667V10.6667H6.66667V4.66667Z" stroke="black" stroke-opacity="0.6" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M11.3333 4.66667H9.33333V8H11.3333V4.66667Z" stroke="black" stroke-opacity="0.6" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
  circle: `
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8.00065 14.6667C11.6825 14.6667 14.6673 11.6819 14.6673 8.00004C14.6673 4.31814 11.6825 1.33337 8.00065 1.33337C4.31875 1.33337 1.33398 4.31814 1.33398 8.00004C1.33398 11.6819 4.31875 14.6667 8.00065 14.6667Z" stroke="black" stroke-opacity="0.6" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M8.00065 10C9.10522 10 10.0007 9.10461 10.0007 8.00004C10.0007 6.89547 9.10522 6.00004 8.00065 6.00004C6.89608 6.00004 6.00065 6.89547 6.00065 8.00004C6.00065 9.10461 6.89608 10 8.00065 10Z" stroke="black" stroke-opacity="0.6" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
  clipboard: `
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M10.666 2.66671H11.9993C12.353 2.66671 12.6921 2.80718 12.9422 3.05723C13.1922 3.30728 13.3327 3.64642 13.3327 4.00004V13.3334C13.3327 13.687 13.1922 14.0261 12.9422 14.2762C12.6921 14.5262 12.353 14.6667 11.9993 14.6667H3.99935C3.64573 14.6667 3.30659 14.5262 3.05654 14.2762C2.80649 14.0261 2.66602 13.687 2.66602 13.3334V4.00004C2.66602 3.64642 2.80649 3.30728 3.05654 3.05723C3.30659 2.80718 3.64573 2.66671 3.99935 2.66671H5.33268M5.99935 1.33337H9.99935C10.3675 1.33337 10.666 1.63185 10.666 2.00004V3.33337C10.666 3.70156 10.3675 4.00004 9.99935 4.00004H5.99935C5.63116 4.00004 5.33268 3.70156 5.33268 3.33337V2.00004C5.33268 1.63185 5.63116 1.33337 5.99935 1.33337Z" stroke="black" stroke-opacity="0.6" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
  checkSquare: `
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M6 7.33333L8 9.33333L14.6667 2.66667M14 8V12.6667C14 13.0203 13.8595 13.3594 13.6095 13.6095C13.3594 13.8595 13.0203 14 12.6667 14H3.33333C2.97971 14 2.64057 13.8595 2.39052 13.6095C2.14048 13.3594 2 13.0203 2 12.6667V3.33333C2 2.97971 2.14048 2.64057 2.39052 2.39052C2.64057 2.14048 2.97971 2 3.33333 2H10.6667" stroke="black" stroke-opacity="0.6" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
  briefcase: `
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M10.6673 14V3.33333C10.6673 2.97971 10.5268 2.64057 10.2768 2.39052C10.0267 2.14048 9.68761 2 9.33398 2H6.66732C6.3137 2 5.97456 2.14048 5.72451 2.39052C5.47446 2.64057 5.33398 2.97971 5.33398 3.33333V14M2.66732 4.66667H13.334C14.0704 4.66667 14.6673 5.26362 14.6673 6V12.6667C14.6673 13.403 14.0704 14 13.334 14H2.66732C1.93094 14 1.33398 13.403 1.33398 12.6667V6C1.33398 5.26362 1.93094 4.66667 2.66732 4.66667Z" stroke="black" stroke-opacity="0.6" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
  calendar: `
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M10.6667 1.33337V4.00004M5.33333 1.33337V4.00004M2 6.66671H14M3.33333 2.66671H12.6667C13.403 2.66671 14 3.26366 14 4.00004V13.3334C14 14.0698 13.403 14.6667 12.6667 14.6667H3.33333C2.59695 14.6667 2 14.0698 2 13.3334V4.00004C2 3.26366 2.59695 2.66671 3.33333 2.66671Z" stroke="black" stroke-opacity="0.6" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
  user: `
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M14 14.5V13.0556C14 12.2894 13.6839 11.5546 13.1213 11.0128C12.5587 10.471 11.7956 10.1667 11 10.1667H5C4.20435 10.1667 3.44129 10.471 2.87868 11.0128C2.31607 11.5546 2 12.2894 2 13.0556V14.5M11 4.38889C11 5.98438 9.65685 7.27778 8 7.27778C6.34315 7.27778 5 5.98438 5 4.38889C5 2.7934 6.34315 1.5 8 1.5C9.65685 1.5 11 2.7934 11 4.38889Z" stroke="black" stroke-opacity="0.6" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
  shield: `
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M5.33398 6.66667L8.00065 9.33333L10.6673 6.66667M2.66732 2H13.334C13.6876 2 14.0267 2.14048 14.2768 2.39052C14.5268 2.64057 14.6673 2.97971 14.6673 3.33333V7.33333C14.6673 9.10144 13.9649 10.7971 12.7147 12.0474C11.4645 13.2976 9.76876 14 8.00065 14C7.12517 14 6.25827 13.8276 5.44943 13.4925C4.64059 13.1575 3.90566 12.6664 3.28661 12.0474C2.03636 10.7971 1.33398 9.10144 1.33398 7.33333V3.33333C1.33398 2.97971 1.47446 2.64057 1.72451 2.39052C1.97456 2.14048 2.3137 2 2.66732 2Z" stroke="black" stroke-opacity="0.6" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
  menu: `
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2 8H14M2 4H14M2 12H14" stroke="black" stroke-opacity="0.6" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
  stethoscope: `
    <svg width="88" height="88" viewBox="0 0 88 88" fill="none" aria-hidden="true">
      <path d="M24.884 9.48853C23.4014 9.48853 22.2002 10.6898 22.2002 12.1723V14.8561C22.2002 16.3386 23.4015 17.5398 24.884 17.5398C26.3665 17.5398 27.5677 16.3386 27.5677 14.8561V12.1723C27.5677 10.6898 26.3665 9.48853 24.884 9.48853Z" fill="white"/>
      <path d="M40.9866 9.48853C39.504 9.48853 38.3029 10.6898 38.3029 12.1723V14.8561C38.3029 16.3386 39.5041 17.5398 40.9866 17.5398C42.4692 17.5398 43.6704 16.3386 43.6704 14.8561V12.1723C43.6705 10.6898 42.4692 9.48853 40.9866 9.48853Z" fill="white"/>
      <path d="M82.506 36.7336C82.506 31.1223 77.9797 26.5575 72.4164 26.5575C66.8531 26.5575 62.3268 31.1222 62.3268 36.7336C62.3268 41.3497 65.3934 45.2514 69.5779 46.4918V66.6643C69.5779 70.2864 67.1405 73.3458 64.2558 73.3458H41.3448C39.2716 73.3458 37.354 71.9201 36.6813 69.8783C36.0134 67.8504 35.9573 64.654 35.9824 62.5582H46.2737C52.1481 62.5582 56.8158 58.0284 58.1665 51.0175C58.1814 50.938 58.1927 50.8576 58.2014 50.7773L60.914 23.6841C60.9227 23.5951 60.9271 23.5059 60.9271 23.4168C60.9271 16.5483 56.1746 11.3685 49.8714 11.3685C48.3888 11.3685 47.1876 12.5698 47.1876 14.0523C47.1876 15.5348 48.3889 16.7361 49.8714 16.7361C53.7293 16.7361 55.5133 20.1101 55.5587 23.2918L52.8732 50.1159C52.2084 53.4061 50.096 57.1906 46.2738 57.1906H20.2239C16.6201 57.1906 14.1443 53.5895 13.6305 50.1797L10.9388 23.2919C10.9843 20.1102 12.7683 16.7361 16.6262 16.7361C18.1088 16.7361 19.31 15.5349 19.31 14.0524C19.31 12.5699 18.1087 11.3686 16.6262 11.3686C10.323 11.3686 5.57043 16.5484 5.57043 23.4169C5.57043 23.506 5.57483 23.5951 5.58354 23.6842L8.29527 50.7773C8.29966 50.8167 8.30397 50.856 8.31013 50.8944C9.1497 56.691 13.5117 62.5583 20.2239 62.5583H30.6141C30.5837 65.042 30.663 68.7627 31.5828 71.5576C32.9937 75.8374 36.9163 78.7135 41.3448 78.7135H64.2558C70.1502 78.7135 74.9455 73.3083 74.9455 66.6643V46.5722C79.2865 45.4358 82.506 41.4619 82.506 36.7336ZM72.4164 41.5412C69.813 41.5412 67.6944 39.3842 67.6944 36.7336C67.6944 34.0821 69.813 31.9251 72.4164 31.9251C75.0198 31.9251 77.1383 34.0821 77.1383 36.7336C77.1383 39.3842 75.0198 41.5412 72.4164 41.5412Z" fill="white"/>
      <path d="M30.2513 47.0629V51.5359C30.2513 53.0185 31.4526 54.2197 32.9351 54.2197C34.4177 54.2197 35.6189 53.0184 35.6189 51.5359V47.0629C35.6189 45.5803 34.4176 44.3792 32.9351 44.3792C31.4525 44.3792 30.2513 45.5804 30.2513 47.0629Z" fill="white"/>
      <path d="M25.5058 25.004C26.469 26.5547 29.1126 29.1791 32.9086 29.1791C36.6861 29.1791 39.3621 26.5748 40.348 25.0354C41.1403 23.7983 40.7805 22.169 39.5539 21.3618C38.3277 20.5537 36.6687 20.897 35.8453 22.1139C35.834 22.1305 34.6755 23.8113 32.9087 23.8113C31.1906 23.8113 30.1222 22.2554 30.0501 22.1471C29.2617 20.9074 27.6197 20.5299 26.3696 21.3084C25.11 22.0904 24.7235 23.7451 25.5058 25.004Z" fill="white"/>
    </svg>`,
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

const services = ["图文问诊", "视频问诊", "图文咨询"];

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
  const currentVersionPath = getCurrentVersionPath();
  const versionNav = versionRoutes
    .map((item) => {
      const isActive =
        currentVersionPath === item.path.replace(/\/+$/, "") ||
        (item.path === "/" && currentVersionPath === "/");
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
          <button class="btn btn--primary" type="button">在线客服</button>
          <button class="btn btn--outline" type="button">医生招聘</button>
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
        <a class="room-back-btn" href="${getHomeHref()}" aria-label="返回首页">
          <img src="${assetUrl("assets/room-back.svg")}" alt="" />
          <span>返回首页</span>
        </a>
        <div class="room-topbar__right">
          <button class="btn btn--primary room-service-btn" type="button">在线客服</button>
          <button class="room-status" type="button" aria-label="出诊状态：在线">
            <span class="badge room-status__badge">在线</span>
            <img src="${assetUrl("assets/room-chevron.svg")}" alt="" />
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
          <button class="room-tag is-active" type="button">全部</button>
          <button class="room-tag" type="button">图文</button>
          <button class="room-tag" type="button">视频</button>
        </div>
        <div class="room-tags room-tags--state">
          <button class="room-tag room-tag--wide is-active" type="button">进行中</button>
          <button class="room-tag room-tag--wide" type="button">已结束</button>
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
      <span class="message-item__badge">1</span>
    </button>`;
}

function renderRoomMain() {
  return `
    <main class="room-main">
      <section class="room-card" aria-label="候诊室">
        <button class="btn btn--outline room-refresh" type="button">刷新列表</button>
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
            <button class="danger-btn" type="button">取消问诊</button>
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
          <p>您好，下图已经出现局部明显脱落，请问下<br />续是否继续原方案使用，药物是否有变化？<br />患者无异常，请问是否需要补充？</p>
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
          <button type="button">头痛发烧多久啦？体温多少度？</button>
          <button type="button">持续几天了？头痛具体位置在哪，程度如何？</button>
          <button type="button">这是一串智能回复的文字内容，并且这是一行的最长字符数</button>
        </div>
        <div class="chat-input">
          <div class="chat-input__quick">快捷回复</div>
          <p>输入回复内容，或点击上方AI推荐快速填充...</p>
          <button type="button">发送</button>
        </div>
      </div>
    </section>`;
}

function renderPrescriptionPanel(includeSecondMedicine = false) {
  const medicineRow = `
          <div class="medicine-table__row">
            <span>1</span><span>阿奇霉素分散片</span><span>处方药</span><span class="table-input">0.125g*6片</span><span class="table-input">口服</span><span class="table-input">1次/日</span><span class="table-input">0.25毫克</span><span>1</span><span class="table-input">盒</span><span class="risk-small">高</span><button type="button">删除</button>
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
          <button class="select-control" type="button">请选择诊断</button>
          <div class="diagnosis-input">
            <span>支气管肺炎</span>
            <button type="button" aria-label="移除诊断">×</button>
          </div>
        </div>
      </div>
      <div class="section-divider"></div>
      <div class="medicine-section">
        <h3>所需药品</h3>
        <div class="medicine-search">请输入药品名称或首字母做模糊查询</div>
        <div class="medicine-table">
          <div class="medicine-table__row medicine-table__head">
            <span>序号</span><span>药品名称</span><span>类型</span><span>规格</span><span>用法</span><span>服用频次</span><span>用量</span><span>数量</span><span>单位</span><span>风险</span><span>操作</span>
          </div>
          ${medicineRow}
          ${includeSecondMedicine ? medicineRow : ""}
        </div>
      </div>
      <div class="prescription-actions">
        <button class="select-control" type="button">请选择</button>
        <div>
          <button class="end-btn" type="button">结束问诊</button>
          <button class="submit-btn" type="button">提交处方</button>
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
          <p>您好，下图已经出现局部明显脱落，请问下<br />续是否继续原方案使用，药物是否有变化？<br />患者无异常，请问是否需要补充？</p>
        </div>
        <div class="chat-bubble chat-bubble--patient">
          <p>还有发烧</p>
        </div>
      </div>
      <div class="video-input-wrap">
        <div class="chat-input">
          <div class="chat-input__quick">快捷回复</div>
          <p>输入回复内容，或点击上方AI推荐快速填充...</p>
          <button type="button">发送</button>
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
            <button class="danger-btn" type="button">取消问诊</button>
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
              <button class="service-tile" type="button" role="checkbox" aria-checked="true" data-service="${service}">
                <span class="check-icon">${icons.checkbox}</span>
                <span>${service}</span>
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
        <button class="btn btn--outline btn--block" type="button">查看全部公告</button>
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

  document.querySelectorAll(".service-tile").forEach((tile) => {
    tile.addEventListener("click", () => {
      const enabled = tile.getAttribute("aria-checked") === "true";
      tile.setAttribute("aria-checked", String(!enabled));
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
