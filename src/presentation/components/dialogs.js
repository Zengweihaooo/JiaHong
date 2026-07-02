import { assetUrl } from "../../shared/core.js";
import { getMedicineRiskWarnings, prescriptionRiskCategories } from "../../domain/prescriptionRisk.js";
import { renderButton } from "./primitives.js";
import { escapeHtml } from "../ui/html.js";

export function renderQuickReplyDialogView({ categories = [], messages = [] } = {}) {
  return `
    <div class="quick-reply-overlay" aria-hidden="true">
      <section class="quick-reply-dialog" role="dialog" aria-modal="true" aria-labelledby="quick-reply-title">
        <header class="quick-reply-dialog__header">
          <h2 id="quick-reply-title">快捷用语</h2>
          <button class="quick-reply-dialog__close" type="button" aria-label="关闭快捷用语">
            <img src="${assetUrl("assets/quick-reply-close.svg")}" alt="" />
          </button>
        </header>
        <div class="quick-reply-dialog__body">
          <nav class="quick-reply-categories" aria-label="快捷回复分类">
            ${categories
              .map(
                (category, index) => `
                  <button class="quick-reply-category${index === 0 ? " is-active" : ""}" type="button">
                    ${category}
                  </button>`
              )
              .join("")}
          </nav>
          <div class="quick-reply-list" role="list">
            ${messages
              .map(
                (message) => `
                  <button class="quick-reply-message" type="button" role="listitem">
                    <span>${message}</span>
                  </button>`
              )
              .join("")}
          </div>
        </div>
        <footer class="quick-reply-dialog__footer">单击快捷用语填入输入框并关闭，双击即可发送</footer>
      </section>
    </div>`;
}

const consultConfirmConfig = {
  cancel: {
    title: "取消问诊",
    message: "确定要取消本次问诊吗？取消后将退出当前会话，未保存内容不会保留。",
    confirmText: "确定取消"
  },
  end: {
    title: "结束问诊",
    message: "确定要结束本次问诊吗？结束后将无法继续与患者沟通。",
    confirmText: "确定结束"
  }
};

const cancelReasonGroups = [
  {
    key: "patient",
    label: "患者原因",
    reasons: ["患者原因不进行购买了", "患者只进行咨询", "用户取消", "药店端无患者", "有视频无人应答"]
  },
  {
    key: "medicine",
    label: "药品禁忌",
    reasons: ["药品与性别不符", "药品与年龄不符", "处方内药品配伍冲突", "病情特殊存在用药禁忌", "重复用药", "违规药品，拒绝开方"]
  },
  {
    key: "scope",
    label: "诊疗范围",
    reasons: ["疾病与科室不符", "诊断与拟购药品不符", "首诊开方", "危急重症开方", "动植物开方", "超疗程处方"]
  },
  {
    key: "prescription",
    label: "处方信息",
    reasons: ["药品名称错误", "药品规格错误", "凭证不符", "实名制药品超限"]
  },
  {
    key: "connection",
    label: "连接异常",
    reasons: ["没有视频接不通", "问诊中对方视频中断", "医生超时未开方"]
  }
];

function renderCancelReasonDialog() {
  return `
    <div class="consult-confirm-overlay" data-confirm-kind="cancel" aria-hidden="true">
      <section
        class="consult-confirm-dialog consult-confirm-dialog--cancel-reason"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="consult-confirm-title-cancel"
      >
        <header class="consult-confirm-dialog__header">
          <h2 id="consult-confirm-title-cancel">取消问诊原因</h2>
          <button type="button" class="consult-confirm-dialog__close" aria-label="关闭">
            <img src="${assetUrl("assets/quick-reply-close.svg")}" alt="" />
          </button>
        </header>
        <div class="consult-cancel-reasons">
          <div class="consult-cancel-reasons__head">
            <span>取消原因类型</span>
            <span>具体内容</span>
          </div>
          <div class="consult-cancel-reasons__body">
            <nav class="consult-cancel-reason-types" aria-label="取消原因类型">
              ${cancelReasonGroups
                .map(
                  (group) => `
                    <button
                      class="consult-cancel-reason-type${group.key === "medicine" ? " is-active" : ""}"
                      type="button"
                      aria-pressed="${group.key === "medicine" ? "true" : "false"}"
                      data-cancel-reason-type="${group.key}"
                    >
                      ${escapeHtml(group.label)}
                    </button>`
                )
                .join("")}
            </nav>
            <div class="consult-cancel-reason-list" role="list" aria-label="具体内容">
              ${cancelReasonGroups
                .map((group) =>
                  group.reasons
                    .map(
                      (reason) => `
                        <button
                          class="consult-cancel-reason${group.key === "medicine" && reason === "病情特殊存在用药禁忌" ? " is-active" : ""}"
                          type="button"
                          role="listitem"
                          aria-pressed="${group.key === "medicine" && reason === "病情特殊存在用药禁忌" ? "true" : "false"}"
                          data-cancel-reason="${escapeHtml(reason)}"
                          data-cancel-reason-group="${group.key}"
                          ${group.key !== "medicine" ? "hidden" : ""}
                        >
                          ${escapeHtml(reason)}
                        </button>`
                    )
                    .join("")
                )
                .join("")}
            </div>
          </div>
        </div>
        <footer class="consult-confirm-dialog__footer">
          ${renderButton({ text: "取消", tone: "outline-secondary", size: "md", className: "consult-confirm-dismiss" })}
          ${renderButton({ text: "确定", tone: "primary", size: "md", className: "consult-confirm-submit" })}
        </footer>
      </section>
    </div>`;
}

export function renderConsultConfirmDialogs() {
  return Object.entries(consultConfirmConfig)
    .map(
      ([kind, config]) =>
        kind === "cancel"
          ? renderCancelReasonDialog()
          : `
    <div class="consult-confirm-overlay" data-confirm-kind="${kind}" aria-hidden="true">
      <section
        class="consult-confirm-dialog consult-confirm-dialog--end-anchor"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="consult-confirm-title-${kind}"
        aria-describedby="consult-confirm-desc-${kind}"
      >
        <header class="consult-confirm-dialog__header">
          <h2 id="consult-confirm-title-${kind}">${config.title}</h2>
          <button type="button" class="consult-confirm-dialog__close" aria-label="关闭">
            <img src="${assetUrl("assets/quick-reply-close.svg")}" alt="" />
          </button>
        </header>
        <div class="consult-confirm-dialog__body">
          <p id="consult-confirm-desc-${kind}">${config.message}</p>
        </div>
        <footer class="consult-confirm-dialog__footer">
          ${renderButton({ text: "再想想", tone: "outline-secondary", size: "md", className: "consult-confirm-dismiss" })}
          ${renderButton({ text: config.confirmText, tone: "danger", size: "md", className: "consult-confirm-submit" })}
        </footer>
      </section>
    </div>`
    )
    .join("");
}

export function renderRiskWarningDialogView({ medicines = [] } = {}) {
  const legendItems = [
    { status: "must", label: "必须处理" },
    { status: "severe", label: "严重警告" },
    { status: "general", label: "一般警告" }
  ];
  const headers = ["药品名称", ...prescriptionRiskCategories];
  const compactHeaders = {
    "患者条件": ["患者", "条件"],
    "重复用药": ["重复", "用药"],
    "用法用量": ["用法", "用量"],
    "给药途径": ["给药", "途径"],
    "相互作用": ["相互", "作用"],
    "生化指标": ["生化", "指标"]
  };
  const renderRiskWarningHeader = (header) => {
    const lines = compactHeaders[header];
    return lines
      ? `<span class="risk-warning-cell__stack">${lines.map((line) => `<span>${escapeHtml(line)}</span>`).join("")}</span>`
      : escapeHtml(header);
  };
  const warningExampleMedicine = medicines.find((medicine) => medicine.warningMessage);
  const rows = medicines.map((medicine, index) => ({
    name: medicine.name,
    linked: medicine === warningExampleMedicine,
    warnings: Object.fromEntries(
      getMedicineRiskWarnings(medicine).map((warning) => [prescriptionRiskCategories.indexOf(warning.category) + 1, warning.level])
    )
  }));
  const warningMessage = warningExampleMedicine?.warningMessage || `[警示信息]${rows[0]?.name || "当前药品"}需完成风险核对`;
  const warningSuggestion = warningExampleMedicine?.warningSuggestion || "[建议信息]请结合患者基础信息、过敏史和用药风险完成处方确认。";
  const messageItems = (medicines.length ? medicines : [{ warningMessage, warningSuggestion }])
    .flatMap((medicine) => [medicine.warningMessage, medicine.warningSuggestion])
    .filter(Boolean);
  const structuredMessageItems = (messageItems.length ? messageItems : [warningMessage, warningSuggestion]).map((message) => {
    const match = String(message).match(/^\[([^\]]+)\](.*)$/);
    return {
      label: match ? match[1] : "提示信息",
      content: match ? match[2] : message,
      copyText: message,
      tone: match?.[1]?.includes("警示") ? "warning" : "suggestion"
    };
  });

  return `
    <div class="risk-warning-overlay" aria-hidden="true">
      <section class="risk-warning-dialog" role="dialog" aria-modal="false" aria-labelledby="risk-warning-title">
        <header class="risk-warning-dialog__header">
          <h2 id="risk-warning-title">风险检测提醒</h2>
          <button class="risk-warning-dialog__close" type="button" aria-label="关闭风险检测提醒">
            <img src="${assetUrl("assets/quick-reply-close.svg")}" alt="" />
          </button>
        </header>
        <div class="risk-warning-dialog__legend" aria-label="风险状态说明">
          ${legendItems
            .map(
              (item) => `
                <div class="risk-warning-legend-item">
                  <span class="risk-warning-legend-item__icon" aria-hidden="true">
                    <span class="risk-warning-status risk-warning-status--${item.status}"></span>
                  </span>
                  <span class="risk-warning-legend-item__label">${item.label}</span>
                </div>`
            )
            .join("")}
        </div>
        <div class="risk-warning-dialog__table-wrap">
          <div class="risk-warning-table" role="table" aria-label="风险检测提醒">
            <div class="risk-warning-row risk-warning-row--head" role="row">
              ${headers.map((header) => `<div class="risk-warning-cell" role="columnheader">${renderRiskWarningHeader(header)}</div>`).join("")}
            </div>
            ${(rows.length ? rows : [{ name: "暂无用药数据", warnings: {} }])
              .map(
                (row) => `
                  <div class="risk-warning-row${row.linked ? " risk-warning-row--linked" : ""}" role="row">
                    <div class="risk-warning-cell risk-warning-cell--name" role="cell">${escapeHtml(row.name)}</div>
                    ${headers
                      .slice(1)
                      .map((_, index) => {
                        const status = row.warnings[index + 1];
                        return `<div class="risk-warning-cell risk-warning-cell--status" role="cell">${
                          status ? `<span class="risk-warning-status risk-warning-status--${status}" aria-hidden="true"></span>` : ""
                        }</div>`;
                      })
                      .join("")}
                  </div>`
              )
              .join("")}
          </div>
        </div>
        <div class="risk-warning-dialog__divider"></div>
        <div class="risk-warning-dialog__message-wrap">
          <div class="risk-warning-message-list" aria-label="警示与建议信息">
            ${structuredMessageItems
              .map(
                (item) => `
                  <button class="risk-warning-message-item risk-warning-message-item--${item.tone}" type="button" data-copy-text="${escapeHtml(item.copyText)}" title="点击复制">
                    <span class="risk-warning-message-item__label">[${escapeHtml(item.label)}]</span>
                    <span class="risk-warning-message-item__content">${escapeHtml(item.content)}</span>
                    <span class="risk-warning-message-item__copy">点击复制</span>
                  </button>`
              )
              .join("")}
          </div>
        </div>
      </section>
    </div>`;
}
