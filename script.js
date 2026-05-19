import { initAppStore } from "./src/store/appStore.js";
import { renderApp } from "./src/render.js";
import { bindInteractions, startOngoingTimers, startRealtimeMockUpdates } from "./src/interactions.js";

try {
  await initAppStore();
  renderApp();
  bindInteractions();
  startOngoingTimers();
  startRealtimeMockUpdates();
} catch (error) {
  console.error(error);
  document.getElementById("app").innerHTML = `
    <main class="main" role="alert">
      <div class="content-stack">
        <section class="card">
          <h1 class="card__title">页面数据加载失败</h1>
          <p>请确认 Mock 数据服务可访问后刷新页面。</p>
        </section>
      </div>
    </main>`;
}
