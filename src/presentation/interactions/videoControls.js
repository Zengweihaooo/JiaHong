import { showToast } from "../ui/interactionPrimitives.js";
import {
  attachLocalCamera,
  getLocalMediaStatus,
  setLocalCameraEnabled,
  setLocalMicrophoneEnabled
} from "../ui/localMedia.js";
import { renderVideoMediaIcon, videoMediaState } from "../views/videoMedia.js";

function syncVideoWindowControls(videoWindow) {
  if (!videoWindow) return;
  const { cameraOn, micOn } = videoMediaState;
  const pip = videoWindow.querySelector(".video-window__pip--local");
  pip?.classList.toggle("is-camera-off", !cameraOn);
  const pipOff = pip?.querySelector(".video-window__pip-off");
  if (pipOff) pipOff.setAttribute("aria-hidden", String(cameraOn));
  videoWindow.classList.toggle("is-media-off", !cameraOn || !micOn);
  setLocalCameraEnabled(cameraOn);
  setLocalMicrophoneEnabled(micOn);

  videoWindow.querySelectorAll("[data-video-action]").forEach((button) => {
    const isCamera = button.dataset.videoAction === "toggle-camera";
    const enabled = isCamera ? cameraOn : micOn;
    const label = isCamera
      ? enabled
        ? "关闭摄像头"
        : "开启摄像头"
      : enabled
        ? "关闭麦克风"
        : "开启麦克风";

    button.classList.toggle("is-off", !enabled);
    button.setAttribute("aria-pressed", String(enabled));
    button.setAttribute("aria-label", label);
    button.setAttribute("title", label);
    const icon = button.querySelector(".video-control-icon");
    if (icon) {
      icon.outerHTML = renderVideoMediaIcon(isCamera ? "camera" : "mic", enabled);
    }
  });
}

async function setupLocalCamera(videoWindow, { forceRetry = false } = {}) {
  const video = videoWindow.querySelector("[data-local-camera]");
  const pip = videoWindow.querySelector(".video-window__pip--local");
  const status = videoWindow.querySelector("[data-camera-status]");
  if (!video || (video.dataset.cameraBound === "true" && !forceRetry)) return;

  video.dataset.cameraBound = "true";
  const mediaStatus = getLocalMediaStatus();
  const shouldShowLoading = forceRetry || mediaStatus.status === "idle" || mediaStatus.status === "pending";
  pip?.classList.toggle("is-camera-loading", shouldShowLoading);
  if (status) {
    status.textContent = mediaStatus.hasStream
      ? "医生摄像头已连接"
      : shouldShowLoading
        ? "正在连接摄像头"
        : mediaStatus.reason === "NotAllowedError"
          ? "摄像头权限未开启"
          : "无法连接摄像头";
  }

  const result = await attachLocalCamera(video, { ...videoMediaState, forceRetry });
  pip?.classList.remove("is-camera-loading");
  pip?.classList.toggle("is-camera-ready", result.ok);
  pip?.classList.toggle("is-camera-error", !result.ok);

  if (status) {
    status.textContent = result.ok
      ? "医生摄像头已连接"
      : result.reason === "NotAllowedError"
        ? "摄像头权限未开启"
        : "无法连接摄像头";
  }
}

export function bindVideoControls() {
  document.querySelectorAll(".video-window[data-video-controls]").forEach((videoWindow) => {
    if (videoWindow.dataset.bound === "true") return;
    videoWindow.dataset.bound = "true";
    setupLocalCamera(videoWindow);

    videoWindow.querySelectorAll("[data-video-dock-toggle]").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        const dock = videoWindow.querySelector(".video-window__dock");
        const panel = videoWindow.querySelector("#video-control-dock-panel");
        dock?.classList.toggle("is-open");
        const isOpen = dock?.classList.contains("is-open");
        panel?.toggleAttribute("hidden", !isOpen);
        button.setAttribute("aria-expanded", String(Boolean(isOpen)));
        button.setAttribute("aria-label", isOpen ? "收起视频控制" : "展开视频控制");
      });
    });

    videoWindow.querySelectorAll("[data-video-action]").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        if (button.dataset.videoAction === "toggle-camera") {
          videoMediaState.cameraOn = !videoMediaState.cameraOn;
          showToast(videoMediaState.cameraOn ? "摄像头已开启" : "摄像头已关闭");
          if (videoMediaState.cameraOn && videoWindow.querySelector(".video-window__pip--local.is-camera-error")) {
            setupLocalCamera(videoWindow, { forceRetry: true });
          }
        } else if (button.dataset.videoAction === "toggle-mic") {
          videoMediaState.micOn = !videoMediaState.micOn;
          showToast(videoMediaState.micOn ? "麦克风已开启" : "麦克风已关闭");
        }
        syncVideoWindowControls(videoWindow);
      });
    });
  });
}
