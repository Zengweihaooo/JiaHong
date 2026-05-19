export function getConsultMainElement(root = document) {
  return root.querySelector(".room-main, .text-main");
}

export function isConsultReadonlyView(root = document) {
  return Boolean(root.querySelector(".text-card--readonly"));
}

export function setConsultShellReadonly(readonly, root = document) {
  root.querySelector(".room-shell, .text-shell, .video-shell")?.classList.toggle("consult-shell--readonly", readonly);
}

export function refreshChatThread(renderChatThread, chatKey, root = document) {
  if (!chatKey) return;
  const existing = root.querySelector(`[data-chat-key="${chatKey}"]`);
  if (!existing) return;
  const threadClass = existing.classList.contains("video-chat-thread") ? "video-chat-thread" : "chat-thread";
  existing.outerHTML = renderChatThread(chatKey, { threadClass });
}

export function mountApp(html, view, root = document) {
  root.body.classList.add("page-mode-responsive", `page-view-${view}`);
  root.getElementById("app").innerHTML = html;
}

export function mountAppError(root = document) {
  root.getElementById("app").innerHTML = `
    <main class="main" role="alert">
      <div class="content-stack">
        <section class="card">
          <h1 class="card__title">页面数据加载失败</h1>
          <p>请确认 Mock 数据服务可访问后刷新页面。</p>
        </section>
      </div>
    </main>`;
}
