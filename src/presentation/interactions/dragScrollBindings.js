export function bindDragScrollContainers(root = document) {
  root
    .querySelectorAll(".message-list, .chat-thread, .video-chat-thread, .quick-reply-categories, .quick-reply-list, .prescription-panel__body")
    .forEach((node) => {
      if (node.dataset.dragScrollBound === "true") return;
      node.dataset.dragScrollBound = "true";
      let startY = 0;
      let startScrollTop = 0;
      let didDrag = false;
      let pointerId = null;

      node.addEventListener("pointerdown", (event) => {
        if (event.target.closest("button, a, input, textarea, select, [role='button'], [data-no-drag-scroll]")) {
          didDrag = false;
          return;
        }
        if (event.button !== 0 || node.scrollHeight <= node.clientHeight) return;
        pointerId = event.pointerId;
        startY = event.clientY;
        startScrollTop = node.scrollTop;
        didDrag = false;
        node.classList.add("is-drag-scroll-active");
        node.setPointerCapture?.(event.pointerId);
      });

      node.addEventListener("pointermove", (event) => {
        if (pointerId !== event.pointerId) return;
        const deltaY = event.clientY - startY;
        if (Math.abs(deltaY) > 4) didDrag = true;
        if (!didDrag) return;
        event.preventDefault();
        node.scrollTop = startScrollTop - deltaY;
      });

      const endDrag = (event) => {
        if (pointerId !== event.pointerId) return;
        pointerId = null;
        node.classList.remove("is-drag-scroll-active");
        node.releasePointerCapture?.(event.pointerId);
      };

      node.addEventListener("pointerup", endDrag);
      node.addEventListener("pointercancel", endDrag);
      node.addEventListener(
        "click",
        (event) => {
          if (event.target.closest("button, a, input, textarea, select, [role='button'], [data-no-drag-scroll]")) return;
          if (!didDrag) return;
          event.preventDefault();
          event.stopPropagation();
          didDrag = false;
        },
        true
      );
    });
}
