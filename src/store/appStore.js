import { getAppBootstrap } from "../api/appApi.js";
import { consultationRecords, doctor, hydrateAppData, services } from "../data.js";
import { initRuntimeState } from "../state.js";

export const appStore = {
  ready: false,
  error: null
};

export async function initAppStore() {
  try {
    const bootstrap = await getAppBootstrap();
    hydrateAppData(bootstrap);
    initRuntimeState({ services, consultationRecords, doctor });
    appStore.ready = true;
    appStore.error = null;
  } catch (error) {
    appStore.ready = false;
    appStore.error = error;
    throw error;
  }
}
