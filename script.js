import { initAppStore } from "./src/store/appStore.js";
import { appView } from "./src/core.js";
import { renderAppMarkup } from "./src/render.js";
import { bindInteractions, startOngoingTimers, startRealtimeMockUpdates } from "./src/interactions.js";
import { mountApp, mountAppError } from "./src/ui/dom.js";

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
