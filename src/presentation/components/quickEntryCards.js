import { getQuickEntryFeature } from "../../domain/quickEntries.js?v=20260602-01";
import { escapeHtml } from "../ui/html.js";
import { renderQuickEntryIcon } from "../ui/icons.js";

export function renderQuickCardMarkup(entry = {}) {
  const {
    title = "",
    desc = "添加快捷入口",
    icon = "plus",
    isAdd = false
  } = entry;
  const feature = getQuickEntryFeature(entry);
  const classes = `quick-card${isAdd ? " quick-card--add" : " quick-card--custom"}`;
  const featureAttribute = feature ? ` data-quick-feature="${escapeHtml(feature)}"` : "";
  const needsAttention = !isAdd && feature === "schedule";
  const attentionAttribute = needsAttention ? ' data-attention="unpunched-schedule"' : "";

  return `
    <div class="${classes}" role="button" tabindex="0" data-action="${escapeHtml(desc)}" data-quick-title="${escapeHtml(title)}"${featureAttribute}${attentionAttribute}${isAdd ? "" : ' data-custom-quick-entry="true"'}>
      ${
        isAdd
          ? ""
          : `<button class="quick-card__delete" type="button" aria-label="删除快捷入口：${escapeHtml(title)}">
              <svg class="quick-card__delete-icon" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                <path d="M4 4L12 12M12 4L4 12" />
              </svg>
            </button>
             <button class="quick-card__drag" type="button" aria-label="拖动排序：${escapeHtml(title)}" draggable="true"></button>`
      }
      ${needsAttention ? '<span class="quick-card__attention-dot" aria-label="存在未打卡排班"></span>' : ""}
      <span class="quick-card__body">
        <span class="icon-box">${renderQuickEntryIcon(icon)}</span>
        ${title ? `<span class="quick-card__title">${escapeHtml(title)}</span>` : ""}
        <span class="quick-card__desc">${escapeHtml(desc)}</span>
      </span>
    </div>`;
}
