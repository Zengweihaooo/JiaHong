export const videoMediaState = {
  cameraOn: true,
  micOn: true
};

export function renderVideoMediaIcon(type, enabled) {
  if (type === "camera") {
    return enabled
      ? `<svg class="video-control-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4 7h4l2-2h4l2 2h4a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
          <circle cx="12" cy="13" r="3.2" stroke="currentColor" stroke-width="1.6"/>
        </svg>`
      : `<svg class="video-control-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4 7h4l2-2h4l2 2h4a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
          <path d="m3 3 18 18" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
        </svg>`;
  }

  return enabled
    ? `<svg class="video-control-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3Z" stroke="currentColor" stroke-width="1.6"/>
        <path d="M6 11v1a6 6 0 0 0 12 0v-1" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
        <path d="M12 18v3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
      </svg>`
    : `<svg class="video-control-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M6 11v1a6 6 0 0 0 9.2 5.1" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
        <path d="M12 18v3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
        <path d="m4 4 16 16" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
      </svg>`;
}

export function renderVideoToolbar() {
  const { cameraOn, micOn } = videoMediaState;
  return `
    <div class="video-toolbar" role="toolbar" aria-label="视频通话控制">
      <button
        type="button"
        class="video-toolbar__btn${cameraOn ? "" : " is-off"}"
        data-video-action="toggle-camera"
        aria-pressed="${cameraOn}"
        title="${cameraOn ? "关闭摄像头" : "开启摄像头"}"
        aria-label="${cameraOn ? "关闭摄像头" : "开启摄像头"}"
      >
        ${renderVideoMediaIcon("camera", cameraOn)}
      </button>
      <button
        type="button"
        class="video-toolbar__btn${micOn ? "" : " is-off"}"
        data-video-action="toggle-mic"
        aria-pressed="${micOn}"
        title="${micOn ? "关闭麦克风" : "开启麦克风"}"
        aria-label="${micOn ? "关闭麦克风" : "开启麦克风"}"
      >
        ${renderVideoMediaIcon("mic", micOn)}
      </button>
    </div>`;
}

export function renderVideoControlDock() {
  return `
    <aside class="video-window__dock">
      <div id="video-control-dock-panel" class="video-window__dock-panel" hidden>
        ${renderVideoToolbar()}
      </div>
      <button
        type="button"
        class="video-window__dock-toggle"
        data-video-dock-toggle
        aria-expanded="false"
        aria-controls="video-control-dock-panel"
        aria-label="展开视频控制"
      >
        <span class="video-window__dock-chevron" aria-hidden="true"></span>
      </button>
    </aside>`;
}

/** @deprecated Use renderVideoControlDock */
export function renderVideoLocalDock() {
  return renderVideoControlDock();
}
