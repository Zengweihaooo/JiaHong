const boundRoots = new WeakMap();
const floatingBindings = new WeakMap();

function readScroller(root) {
  if (!root) return null;
  const viewport = root.querySelector(":scope > .jh-custom-scroll__viewport");
  const bar = root.querySelector(":scope > .jh-custom-scroll__bar");
  return {
    root,
    viewport,
    content: viewport?.querySelector(":scope > .jh-custom-scroll__content") || null,
    bar,
    thumb: bar?.querySelector(":scope > .jh-custom-scroll__thumb") || null
  };
}

function updateCustomScrollThumb(root) {
  const scroller = readScroller(root);
  if (!scroller?.viewport || !scroller.bar || !scroller.thumb) return;

  const { viewport, bar, thumb } = scroller;
  const trackHeight = bar.clientHeight;
  const maxScroll = Math.max(0, viewport.scrollHeight - viewport.clientHeight);

  if (maxScroll <= 0 || trackHeight <= 0) {
    thumb.style.height = `${Math.max(trackHeight, 32)}px`;
    thumb.style.top = "0px";
    return;
  }

  const ratio = viewport.clientHeight / viewport.scrollHeight;
  const thumbHeight = Math.max(32, Math.round(trackHeight * ratio));
  const maxThumbTop = Math.max(0, trackHeight - thumbHeight);
  const thumbTop = maxThumbTop ? (viewport.scrollTop / maxScroll) * maxThumbTop : 0;

  thumb.style.height = `${thumbHeight}px`;
  thumb.style.top = `${thumbTop}px`;
}

function scheduleCustomScrollThumb(root) {
  if (!root) return;
  if (root.__jhCustomScrollFrame) {
    cancelAnimationFrame(root.__jhCustomScrollFrame);
  }
  root.__jhCustomScrollFrame = requestAnimationFrame(() => {
    root.__jhCustomScrollFrame = 0;
    updateCustomScrollThumb(root);
  });
}

function bindCustomScrollList(root) {
  if (!root) return;
  ensureCustomScrollList(root);

  if (boundRoots.has(root)) {
    scheduleCustomScrollThumb(root);
    return;
  }

  const scroller = readScroller(root);
  if (!scroller?.viewport || !scroller.bar || !scroller.thumb) return;

  const { viewport, bar, thumb } = scroller;
  const onViewportScroll = () => scheduleCustomScrollThumb(root);
  const onWheel = (event) => {
    const maxScroll = Math.max(0, viewport.scrollHeight - viewport.clientHeight);
    if (maxScroll <= 0) return;
    viewport.scrollTop = Math.min(maxScroll, Math.max(0, viewport.scrollTop + event.deltaY));
    event.preventDefault();
    scheduleCustomScrollThumb(root);
  };

  viewport.addEventListener("scroll", onViewportScroll, { passive: true });
  viewport.addEventListener("wheel", onWheel, { passive: false });
  viewport.addEventListener("touchmove", onViewportScroll, { passive: true });
  viewport.addEventListener("scrollend", onViewportScroll, { passive: true });

  const resizeObserver = new ResizeObserver(() => scheduleCustomScrollThumb(root));
  if (scroller.content) resizeObserver.observe(scroller.content);
  resizeObserver.observe(viewport);
  resizeObserver.observe(bar);
  resizeObserver.observe(root);

  let dragging = false;
  let startY = 0;
  let startScrollTop = 0;

  thumb.addEventListener("pointerdown", (event) => {
    dragging = true;
    startY = event.clientY;
    startScrollTop = viewport.scrollTop;
    thumb.setPointerCapture(event.pointerId);
    event.preventDefault();
    event.stopPropagation();
  });

  thumb.addEventListener("pointermove", (event) => {
    if (!dragging) return;
    const trackHeight = bar.clientHeight;
    const maxScroll = Math.max(0, viewport.scrollHeight - viewport.clientHeight);
    const thumbHeight = thumb.offsetHeight;
    const maxThumbTop = Math.max(0, trackHeight - thumbHeight);
    const deltaY = event.clientY - startY;
    const scrollDelta = maxThumbTop > 0 ? (deltaY / maxThumbTop) * maxScroll : 0;
    viewport.scrollTop = startScrollTop + scrollDelta;
    scheduleCustomScrollThumb(root);
  });

  const stopDragging = () => {
    dragging = false;
  };
  thumb.addEventListener("pointerup", stopDragging);
  thumb.addEventListener("pointercancel", stopDragging);

  bar.addEventListener("pointerdown", (event) => {
    if (event.target === thumb) return;
    const rect = bar.getBoundingClientRect();
    const maxScroll = Math.max(0, viewport.scrollHeight - viewport.clientHeight);
    const ratio = rect.height > 0 ? (event.clientY - rect.top) / rect.height : 0;
    viewport.scrollTop = ratio * maxScroll;
    scheduleCustomScrollThumb(root);
    event.preventDefault();
  });

  boundRoots.set(root, { onViewportScroll, onWheel, resizeObserver });
  scheduleCustomScrollThumb(root);
}

export function ensureCustomScrollList(root) {
  if (!root) return null;

  root.classList.add("jh-custom-scroll");

  let viewport = root.querySelector(":scope > .jh-custom-scroll__viewport");
  if (!viewport) {
    const legacyList = root.querySelector(":scope > .jh-option-list");
    const content = document.createElement("div");
    content.className = "jh-custom-scroll__content";

    viewport = document.createElement("div");
    viewport.className = "jh-custom-scroll__viewport";

    const bar = document.createElement("div");
    bar.className = "jh-custom-scroll__bar";
    bar.setAttribute("aria-hidden", "true");

    const thumb = document.createElement("div");
    thumb.className = "jh-custom-scroll__thumb";
    bar.appendChild(thumb);

    if (legacyList) {
      while (legacyList.firstChild) {
        content.appendChild(legacyList.firstChild);
      }
      legacyList.remove();
    } else {
      Array.from(root.children).forEach((node) => content.appendChild(node));
    }

    viewport.appendChild(content);
    root.appendChild(viewport);
    root.appendChild(bar);
  }

  return readScroller(root);
}

export function getCustomScrollContent(root) {
  return ensureCustomScrollList(root)?.content || root;
}

export function syncCustomScrollList(root) {
  if (!root) return;
  bindCustomScrollList(root);
}

function updateFloatingScrollListPosition(root, anchor, { gap = 4, width } = {}) {
  if (!root || !anchor) return;
  const rect = anchor.getBoundingClientRect();
  root.style.position = "fixed";
  root.style.top = `${Math.round(rect.bottom + gap)}px`;
  root.style.left = `${Math.round(rect.left)}px`;
  root.style.zIndex = "1000";
  if (width) {
    root.style.width = typeof width === "number" ? `${width}px` : width;
  }
}

function bindFloatingScrollList(root, anchor, options = {}) {
  if (!root || !anchor) return;

  if (floatingBindings.has(root)) {
    floatingBindings.set(root, { anchor, options });
    updateFloatingScrollListPosition(root, anchor, options);
    return;
  }

  const reposition = () => {
    if (root.hidden) return;
    const binding = floatingBindings.get(root);
    if (!binding?.anchor) return;
    updateFloatingScrollListPosition(root, binding.anchor, binding.options);
    scheduleCustomScrollThumb(root);
  };

  window.addEventListener("resize", reposition, { passive: true });
  window.addEventListener("scroll", reposition, { passive: true, capture: true });
  floatingBindings.set(root, { anchor, options, reposition });
}

export function syncFloatingScrollList(root, anchor, options = {}) {
  if (!root) return;
  syncCustomScrollList(root);
  if (!anchor || root.hidden) {
    resetFloatingScrollList(root);
    return;
  }
  bindFloatingScrollList(root, anchor, options);
  updateFloatingScrollListPosition(root, anchor, options);
  scheduleCustomScrollThumb(root);
}

export function resetFloatingScrollList(root) {
  if (!root) return;
  const binding = floatingBindings.get(root);
  if (binding?.reposition) {
    window.removeEventListener("resize", binding.reposition);
    window.removeEventListener("scroll", binding.reposition, true);
  }
  floatingBindings.delete(root);
  root.style.position = "";
  root.style.top = "";
  root.style.left = "";
  root.style.zIndex = "";
  root.style.width = "";
}

export function renderCustomScrollListMarkup({ maxHeight = 220 } = {}) {
  return `
    <div class="jh-custom-scroll__viewport">
      <div class="jh-custom-scroll__content"></div>
    </div>
    <div class="jh-custom-scroll__bar" aria-hidden="true">
      <div class="jh-custom-scroll__thumb"></div>
    </div>`;
}
