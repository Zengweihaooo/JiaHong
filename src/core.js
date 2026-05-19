export const assetUrl = (path) => new URL(`../${path}`, import.meta.url).href;
export const siteBasePath = new URL("..", import.meta.url).pathname.replace(/\/$/, "");
export const validAppViews = new Set(["home", "room", "text", "video", "history"]);

export function getCurrentRoutePath() {
  const normalized = location.pathname.replace(/\/+$/, "") || "/";
  const base = siteBasePath || "";
  if (base && normalized.startsWith(base)) {
    const rest = normalized.slice(base.length) || "/";
    return rest.startsWith("/") ? rest : `/${rest}`;
  }
  return normalized;
}

export function getQueryParam(name, fallback = "") {
  return new URLSearchParams(location.search).get(name) || fallback;
}

export function getRecordParam(fallback = "") {
  return getQueryParam("record", fallback);
}

export function inferAppView() {
  const currentPath = getCurrentRoutePath();
  if (currentPath.includes("/video")) return "video";
  if (currentPath.includes("/text")) return "text";
  if (currentPath.includes("/history")) return "history";
  if (currentPath.includes("/room")) return "room";
  return "home";
}

const requestedAppView = window.JH_APP_VIEW || inferAppView();
export const appView = validAppViews.has(requestedAppView) ? requestedAppView : "home";

export function getAppHref(path) {
  const base = siteBasePath || "";
  if (path === "/") {
    return `${base || ""}/`;
  }
  return `${base}${path}`;
}

export function getRoomHref() {
  return getAppHref("/room/");
}

export function getTextHref(recordId = "") {
  const href = getAppHref("/text/");
  return recordId ? `${href}?record=${encodeURIComponent(recordId)}` : href;
}

export function getVideoHref(recordId = "") {
  const href = getAppHref("/video/");
  return recordId ? `${href}?record=${encodeURIComponent(recordId)}` : href;
}

export function getHistoryHref(recordId = "ended-text") {
  return `${getAppHref("/history/")}?record=${encodeURIComponent(recordId)}`;
}

export function getHomeHref() {
  return getAppHref("/");
}
