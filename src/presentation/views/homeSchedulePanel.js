const scheduleTimeSlots = ["7:00–8:00", "9:00–10:00", "10:00–11:00", "11:00–12:00", "12:00–13:00", "14:00–15:00", "15:00–16:00", "16:00–18:00"];

const scheduleRows = [
  { label: "4.04", sub: "周六", active: true },
  { label: "4.05", sub: "周日" },
  { label: "4.06", sub: "周一" }
];

const scheduleItems = [
  { row: 1, col: 2, span: 1, tone: "muted", title: "饿了么后方-固定值班", time: "已结束" },
  { row: 1, col: 4, span: 3, tone: "blue", title: "线下药店续方服务", time: "10:00-13:00", active: true, endingSoon: true },
  { row: 1, col: 8, span: 1, tone: "cyan", title: "妙手阿里-兜底科室报班", time: "15:00-16:00" },
  { row: 2, col: 4, span: 3, tone: "blue", title: "线下药店续方服务", time: "10:00-13:00" },
  { row: 2, col: 7, span: 1, tone: "amber", title: "九州通美团-兜底科室报班", time: "14:00-15:00" },
  { row: 3, col: 2, span: 1, tone: "cyan", title: "饿了么后方-固定值班", time: "7:00-8:00" },
  { row: 3, col: 4, span: 1, tone: "red", title: "拼多多-自由报班", time: "14:00-15:00" },
  { row: 3, col: 6, span: 1, tone: "cyan", title: "九州通阿里-固定值班", time: "12:00-13:00" },
  { row: 3, col: 7, span: 2, tone: "amber", title: "九州通美团-自由报班", time: "14:00-16:00" }
];

export function renderSchedulePanel({ hidden = true, titleId = "" } = {}) {
  const titleIdAttribute = titleId ? ` id="${titleId}"` : "";
  const activeSchedule = scheduleItems.find((item) => item.active);
  const punchTone = activeSchedule?.endingSoon ? "warning" : "primary";
  return `
    <section class="schedule-panel" aria-label="近期排班"${hidden ? " hidden" : ""}>
      <header class="schedule-panel__header">
        <span class="schedule-panel__title">
          <strong${titleIdAttribute}>近期排班</strong>
          <span>11分钟前已变更</span>
        </span>
        <span class="schedule-panel__actions">
          <button class="schedule-panel__punch schedule-panel__punch--${punchTone}" type="button" data-punch-state="${punchTone}" data-punch-default-state="${punchTone}">立即打卡</button>
          <span class="schedule-panel__punch-counts" aria-label="排班打卡统计">
            <span>已打卡：<strong data-schedule-punched-count>1</strong></span>
            <span>待打卡：<strong data-schedule-unpunched-count>2</strong></span>
          </span>
          <button class="schedule-panel__detail" type="button">查看详情</button>
          <button class="schedule-panel__back" type="button">关闭</button>
        </span>
      </header>
      <nav class="schedule-panel__tabs" aria-label="排班时间段">
        <button class="schedule-panel__arrow" type="button" aria-label="上一个时间段">‹</button>
        ${scheduleTimeSlots
          .map(
            (slot, index) => `
              <button class="schedule-panel__tab${index === 3 ? " is-active" : ""}" type="button">${slot}</button>`
          )
          .join("")}
        <button class="schedule-panel__arrow" type="button" aria-label="下一个时间段">›</button>
      </nav>
      <div class="schedule-board">
        ${scheduleRows
          .map(
            (row, index) => `
              <div class="schedule-board__date${row.active ? " is-active" : ""}" style="grid-row:${index + 1}">
                <span>${row.label}</span>
                <span>${row.sub}</span>
              </div>`
          )
          .join("")}
        ${scheduleItems
          .map(
            (item) => `
              <article class="schedule-event schedule-event--${item.tone}${item.active ? " is-active" : ""}" style="grid-row:${item.row};grid-column:${item.col} / span ${item.span}">
                <strong>${item.title}</strong>
                <span>${item.time}</span>
                ${item.active ? '<em aria-hidden="true">进行中</em>' : ""}
              </article>`
          )
          .join("")}
      </div>
    </section>`;
}

export function renderScheduleDialog() {
  return `
    <div class="schedule-overlay" aria-hidden="true">
      <section class="schedule-dialog" role="dialog" aria-modal="true" aria-labelledby="schedule-dialog-title">
        ${renderSchedulePanel({ hidden: false, titleId: "schedule-dialog-title" })}
      </section>
    </div>`;
}
