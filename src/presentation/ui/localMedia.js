let localMediaStream = null;
let localMediaRequest = null;

function getMediaDevices() {
  return navigator.mediaDevices || null;
}

function setTrackEnabled(kind, enabled) {
  if (!localMediaStream) return;
  localMediaStream
    .getTracks()
    .filter((track) => track.kind === kind)
    .forEach((track) => {
      track.enabled = enabled;
    });
}

export function setLocalCameraEnabled(enabled) {
  setTrackEnabled("video", enabled);
}

export function setLocalMicrophoneEnabled(enabled) {
  setTrackEnabled("audio", enabled);
}

export async function attachLocalCamera(videoElement, { cameraOn = true, micOn = true } = {}) {
  if (!videoElement) return { ok: false, reason: "missing-video" };
  const mediaDevices = getMediaDevices();
  if (!mediaDevices?.getUserMedia) {
    return { ok: false, reason: "unsupported" };
  }

  try {
    if (!localMediaStream) {
      localMediaRequest ??= mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 360 },
          facingMode: "user"
        },
        audio: true
      });
      localMediaStream = await localMediaRequest;
    }

    videoElement.srcObject = localMediaStream;
    setLocalCameraEnabled(cameraOn);
    setLocalMicrophoneEnabled(micOn);
    await videoElement.play().catch(() => {});
    return { ok: true };
  } catch (error) {
    localMediaRequest = null;
    return {
      ok: false,
      reason: error?.name || "camera-error"
    };
  }
}
