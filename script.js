import { initAppStore } from "./src/application/store/appStore.js?v=20260528-06";
import { appView } from "./src/shared/core.js";
import { renderAppMarkup } from "./src/presentation/render.js?v=20260602-01";
import { bindInteractions, startOngoingTimers, startRealtimeMockUpdates } from "./src/presentation/interactions.js?v=20260602-01";
import { mountApp, mountAppError } from "./src/presentation/ui/dom.js";

try {
  await initAppStore();
  mountApp(renderAppMarkup(), appView);
  bindInteractions();
  startOngoingTimers();
  startRealtimeMockUpdates();
} catch (error) {
  console.error(error);
  mountAppError();
}
