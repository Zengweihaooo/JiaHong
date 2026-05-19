import { initAppStore } from "./src/application/store/appStore.js";
import { appView } from "./src/shared/core.js";
import { renderAppMarkup } from "./src/presentation/render.js";
import { bindInteractions, startOngoingTimers, startRealtimeMockUpdates } from "./src/presentation/interactions.js";
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
