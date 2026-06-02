export const assetUrl = (path) => new URL(`../../${path}`, import.meta.url).href;
export const siteBasePath = new URL("../..", import.meta.url).pathname.replace(/\/$/, "");
export const validAppViews = new Set(["home", "room", "text", "video", "history"]);

export function getCurrentRoutePath() {
  const normalized = location.pathname.replace(/\/+$/, "") || "/";
  const base = siteBasePath || "";
  if (base && normalized.startsWith(base)) {
    const rest = normalized.slice(base.length) || "/";
    return rest.startsWith("/") ? rest : `/${rest}`;
  }
  const segments = normalized.split("/").filter(Boolean);
  const routeIndex = segments.findIndex((segment) => validAppViews.has(segment) && segment !== "home");
  if (routeIndex >= 0) {
    return `/${segments.slice(routeIndex).join("/")}`;
  }
  return normalized;
}

export function getQueryParam(name, fallback = "") {
  return new URLSearchParams(location.search).get(name) || fallback;
}

export function getRecordParam(fallback = "") {
  return getQueryParam("record", fallback);
}

export function getSessionIdParam(fallback = "") {
  return getQueryParam("sessionId") || getRecordParam(fallback);
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

export function getTextHref(sessionId = "") {
  const href = getAppHref("/text/");
  return sessionId ? `${href}?sessionId=${encodeURIComponent(sessionId)}` : href;
}

export function getVideoHref(sessionId = "") {
  const href = getAppHref("/video/");
  return sessionId ? `${href}?sessionId=${encodeURIComponent(sessionId)}` : href;
}

export function getHistoryHref(sessionId = "") {
  const href = getAppHref("/history/");
  return sessionId ? `${href}?sessionId=${encodeURIComponent(sessionId)}` : href;
}

export function getHomeHref() {
  return getAppHref("/");
}
