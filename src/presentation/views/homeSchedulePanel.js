const morningHours = Array.from({ length: 12 }, (_, index) => index);
const afternoonHours = Array.from({ length: 12 }, (_, index) => index + 12);

const scheduleBlocks = [
  {
    column: "morning",
    tone: "ended",
    title: "饿了么后方-固定值班",
    time: "已结束",
    topHour: 4,
    durationHours: 2,
    status: "check"
  },
  {
    column: "morning",
    tone: "active",
    title: "饿了么后方-固定值班",
    time: "8:00-11:00",
    topHour: 8,
    durationHours: 3,
    status: "warning",
    active: true
  },
  {
    column: "afternoon",
    tone: "orange",
    title: "九州通美团-兜底科室报班",
    time: "14:00-15:00",
    topHour: 14,
    durationHours: 2
  },
  {
    column: "afternoon",
    tone: "purple",
    title: "妙手阿里-兜底科室报班",
    time: "14:00-15:00",
    topHour: 18,
    durationHours: 4
  }
];

function renderHourLabels(hours) {
  return hours.map((hour) => `<span class="schedule-day-grid__hour">${hour}:00</span>`).join("");
}

function renderGridLines(hours) {
  return hours.map((hour) => `<span class="schedule-day-grid__line" aria-hidden="true" style="--row:${hour % 12}"></span>`).join("");
}

function renderScheduleBlock(block) {
  const relativeHour = block.topHour % 12;
  const status =
    block.status === "check"
      ? '<span class="schedule-day-block__status schedule-day-block__status--check" aria-label="已打卡">✓</span>'
      : block.status === "warning"
        ? '<span class="schedule-day-block__status schedule-day-block__status--warning" data-schedule-active-status="true" aria-label="该时段未打卡">!</span>'
        : "";
  return `
    <article
      class="schedule-day-block schedule-day-block--${block.tone}${block.active ? " is-active" : ""}"
      style="--start-hour:${relativeHour};--duration-hours:${block.durationHours}"
    >
      <div class="schedule-day-block__title">
        <strong>${block.title}</strong>
        ${status}
      </div>
      <span class="schedule-day-block__time">${block.time}</span>
      ${block.active ? '<em class="schedule-day-block__stamp" aria-hidden="true">进行中</em>' : ""}
    </article>`;
}

function renderScheduleColumn({ period, title, hours }) {
  const blocks = scheduleBlocks.filter((block) => block.column === period);
  return `
    <section class="schedule-day-grid__column schedule-day-grid__column--${period}" aria-label="${title}">
      <header class="schedule-day-grid__period">${title}</header>
      <div class="schedule-day-grid__body">
        <div class="schedule-day-grid__hours" aria-hidden="true">${renderHourLabels(hours)}</div>
        <div class="schedule-day-grid__tracks">
          ${renderGridLines(hours)}
          ${blocks.map(renderScheduleBlock).join("")}
          ${period === "morning" ? '<div class="schedule-day-grid__missed-callout">该时段未打卡</div><div class="schedule-day-grid__current-line" aria-hidden="true"></div>' : ""}
        </div>
      </div>
    </section>`;
}

export function renderSchedulePanel({ hidden = true, titleId = "" } = {}) {
  const titleIdAttribute = titleId ? ` id="${titleId}"` : "";
  return `
    <section class="schedule-panel" aria-label="今日排班"${hidden ? " hidden" : ""}>
      <header class="schedule-panel__header">
        <strong class="schedule-panel__title"${titleIdAttribute}>今日排班</strong>
        <button class="schedule-panel__back schedule-panel__close" type="button" aria-label="关闭排班弹窗">×</button>
      </header>
      <div class="schedule-panel__summary">
        <div class="schedule-panel__summary-left">
          <div class="schedule-panel__date" aria-label="当前排班日期">
            <strong>6月3日</strong>
            <span>星期三</span>
          </div>
          <span class="schedule-panel__punch-counts" aria-label="排班打卡统计">
            <span>已打卡：<strong data-schedule-punched-count>1</strong></span>
            <span>待打卡：<strong data-schedule-unpunched-count>3</strong></span>
          </span>
        </div>
        <span class="schedule-panel__actions">
          <button class="schedule-panel__detail" type="button">查看详情</button>
          <button class="schedule-panel__punch schedule-panel__punch--warning" type="button" data-punch-state="warning" data-punch-default-state="warning">立即打卡</button>
        </span>
      </div>
      <div class="schedule-panel__body">
        <div class="schedule-day-grid">
          ${renderScheduleColumn({ period: "morning", title: "上午  00:00–12:00", hours: morningHours })}
          ${renderScheduleColumn({ period: "afternoon", title: "下午  12:00–24:00", hours: afternoonHours })}
        </div>
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
