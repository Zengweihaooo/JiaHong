import test from "node:test";
import assert from "node:assert/strict";

function setupBrowserGlobals(pathname = "/room/", search = "") {
  globalThis.window = {
    JH_APP_VIEW: ""
  };
  globalThis.location = {
    pathname,
    search
  };
}

test("shared core infers app view, route path, query params, and app hrefs", async () => {
  setupBrowserGlobals("/Users/zengweihao/Desktop/Repos/JiaHong/video/", "?sessionId=cs_1&record=legacy");
  const core = await import("../src/shared/core.js?presentation-core");

  assert.equal(core.getCurrentRoutePath(), "/video");
  assert.equal(core.inferAppView(), "video");
  assert.equal(core.getQueryParam("sessionId"), "cs_1");
  assert.equal(core.getRecordParam(), "legacy");
  assert.equal(core.getSessionIdParam(), "cs_1");
  assert.equal(core.getTextHref("cs 2"), `${core.siteBasePath}/text/?sessionId=cs%202`);
  assert.equal(core.getHomeHref(), `${core.siteBasePath}/`);
  assert.equal(core.validAppViews.has("history"), true);
});

test("shared core falls back from sessionId to record for legacy links", async () => {
  setupBrowserGlobals("/Users/zengweihao/Desktop/Repos/JiaHong/history/", "?record=old_1");
  const core = await import("../src/shared/core.js?presentation-core-legacy");

  assert.equal(core.inferAppView(), "history");
  assert.equal(core.getSessionIdParam(), "old_1");
  assert.equal(core.getVideoHref(), `${core.siteBasePath}/video/`);
});

test("escapeHtml escapes markup-sensitive characters", async () => {
  const { escapeHtml } = await import("../src/presentation/ui/html.js");

  assert.equal(escapeHtml(`<button title="x&y">`), "&lt;button title=&quot;x&amp;y&quot;&gt;");
  assert.equal(escapeHtml(123), "123");
});

test("primitive components normalize invalid options and format durations", async () => {
  setupBrowserGlobals("/room/");
  const {
    formatDuration,
    getDoctorStatusLabel,
    renderButton,
    renderDurationChip,
    renderReadTag,
    renderRiskTag,
    renderStatusBadge,
    renderSwitch
  } = await import("../src/presentation/components/primitives.js?v=20260527-36");

  assert.equal(formatDuration(3661), "01:01:01");
  assert.equal(formatDuration(-10), "00:00:00");
  assert.match(renderButton({ text: "保存", tone: "unknown", size: "xl", type: "submit", disabled: true }), /jh-btn--primary/);
  assert.match(renderButton({ text: "保存", tone: "unknown", size: "xl", type: "submit", disabled: true }), /disabled/);
  assert.match(renderSwitch({ checked: true, label: "服务开关" }), /aria-pressed="true"/);
  assert.match(renderDurationChip("bad", 600), /jh-duration-chip--icon jh-duration-chip--danger/);
  assert.match(renderStatusBadge("invalid"), /jh-status-badge--online/);
  assert.equal(getDoctorStatusLabel("busy"), "忙碌");
  assert.equal(getDoctorStatusLabel("missing"), "离线");
  assert.match(renderReadTag("read"), /已读/);
  assert.match(renderRiskTag({ text: "高", size: "lg" }), /jh-risk-tag--high/);
});

test("video media toolbar reflects camera and microphone state", async () => {
  const { renderVideoToolbar, videoMediaState } = await import("../src/presentation/views/videoMedia.js");

  videoMediaState.cameraOn = false;
  videoMediaState.micOn = true;

  const html = renderVideoToolbar();

  assert.match(html, /data-video-action="toggle-camera"/);
  assert.match(html, /aria-label="开启摄像头"/);
  assert.match(html, /data-video-action="toggle-mic"/);
  assert.match(html, /aria-label="关闭麦克风"/);
});

test("quick entry cards escape user text and mark add/custom variants", async () => {
  setupBrowserGlobals("/");
  const { renderQuickCardMarkup } = await import("../src/presentation/components/quickEntryCards.js");

  const custom = renderQuickCardMarkup({
    title: `常用入口"<>`,
    desc: `查看&编辑`,
    icon: "calendar"
  });
  assert.match(custom, /quick-card--custom/);
  assert.match(custom, /data-custom-quick-entry="true"/);
  assert.match(custom, /常用入口&quot;&lt;&gt;/);
  assert.match(custom, /查看&amp;编辑/);

  assert.match(renderQuickCardMarkup({ title: "排班管理" }), /data-quick-feature="schedule"/);

  const add = renderQuickCardMarkup({ isAdd: true });
  assert.match(add, /quick-card--add/);
  assert.doesNotMatch(add, /quick-card__delete/);
});

test("home quick actions keep one add entry at the end when capacity remains", async () => {
  setupBrowserGlobals("/");
  const { normalizeQuickActions } = await import("../src/presentation/views/homeView.js?quick-actions");

  const entries = normalizeQuickActions([
    { title: "排班管理", desc: "查看值班安排" },
    { title: "", desc: "添加快捷入口", isAdd: true },
    { title: "历史问诊", desc: "历史病历查询" },
    { title: "", desc: "添加快捷入口", isAdd: true }
  ]);

  assert.equal(entries.length, 3);
  assert.equal(entries[0].title, "排班管理");
  assert.equal(entries[1].title, "历史问诊");
  assert.equal(entries[2].isAdd, true);
});

test("schedule panel renders punch controls and ending-soon warning state", async () => {
  setupBrowserGlobals("/");
  const { renderSchedulePanel } = await import("../src/presentation/views/homeSchedulePanel.js?schedule-punch");

  const markup = renderSchedulePanel({ hidden: false, titleId: "schedule-title-test" });
  assert.match(markup, /近期排班/);
  assert.match(markup, /schedule-panel__punch schedule-panel__punch--warning/);
  assert.match(markup, /立即打卡/);
  assert.match(markup, /已打卡：/);
  assert.match(markup, /待打卡：/);
});

test("quick entry duplicate checks match existing cards by feature or title", async () => {
  const { isQuickEntryAlreadyUsed } = await import("../src/presentation/interactions/quickEntryGridDom.js?duplicates");
  const makeCard = ({ title = "", feature = "" }) => ({
    dataset: {
      quickFeature: feature,
      quickTitle: title
    }
  });
  const scheduleCard = makeCard({ title: "排班管理", feature: "schedule" });
  const commissionCard = makeCard({ title: "医生佣金条", feature: "commission" });
  const followUpCard = makeCard({ title: "患者随访" });
  const grid = {
    querySelectorAll: () => [scheduleCard, commissionCard, followUpCard]
  };

  assert.equal(isQuickEntryAlreadyUsed(grid, { title: "排班管理" }), true);
  assert.equal(isQuickEntryAlreadyUsed(grid, { title: "佣金明细" }), true);
  assert.equal(isQuickEntryAlreadyUsed(grid, { title: "患者随访" }), true);
  assert.equal(isQuickEntryAlreadyUsed(grid, { title: "风险提醒" }), false);
  assert.equal(isQuickEntryAlreadyUsed(grid, { title: "患者随访" }, followUpCard), false);
});

test("video contact list only renders one ongoing video while the video queue is active", async () => {
  setupBrowserGlobals("/room/");
  const { hydrateAppData } = await import("../src/application/state/dataStore.js");
  const { activeVideoConsultationState } = await import("../src/application/state/runtimeState.js?v=20260528-06");
  hydrateAppData({
    schemaVersion: 1,
    consultations: {
      records: [
        {
          id: "video_active",
          type: "video",
          state: "ongoing",
          title: "当前视频药房",
          preview: "您好！请问那个药...",
          unreadCount: 3,
          targetView: "video",
          time: "10:00"
        },
        {
          id: "video_waiting",
          type: "video",
          state: "ongoing",
          title: "等待视频药房",
          preview: "另一条视频问诊",
          unreadCount: 1,
          targetView: "video",
          time: "10:01"
        },
        {
          id: "text_1",
          type: "text",
          state: "ongoing",
          title: "图文药房",
          preview: "图文问诊",
          unreadCount: 1,
          targetView: "text",
          time: "10:02"
        }
      ],
      ongoingChats: {}
    },
    navigation: { menuGroups: [] },
    home: { quickActions: [], quickEntryOptions: [], announcements: [] },
    services: [],
    quickReplies: { categories: [], messages: [] }
  });
  activeVideoConsultationState.recordId = "video_active";

  const { renderMessageList } = await import("../src/presentation/views/roomMessageListView.js?video-contact-list");
  const markup = renderMessageList({ state: "ongoing", activeRecord: "text_1" });
  assert.match(markup, /当前视频药房/);
  assert.match(markup, /is-current-video/);
  assert.match(markup, /您好！请问那个药/);
  assert.doesNotMatch(markup, /等待视频药房/);
  assert.match(markup, /图文药房/);
});

test("follow-up vouchers render for text and video consultations with image and voice variants", async () => {
  setupBrowserGlobals("/text/");
  const {
    getFollowUpVoucher,
    renderFollowUpVoucherCard,
    renderFollowUpVoiceDialog
  } = await import("../src/presentation/views/chatView.js?follow-up-vouchers");

  const textImage = renderFollowUpVoucherCard({
    id: "text_image",
    type: "text",
    followUpVoucher: { type: "image" }
  });
  assert.match(textImage, /复诊凭证/);
  assert.match(textImage, /图片凭证/);
  assert.match(textImage, /consult-attachment/);
  assert.doesNotMatch(textImage, /语音凭证/);

  const videoVoice = renderFollowUpVoucherCard({
    id: "video_voice",
    type: "video",
    followUpVoucher: { type: "voice" }
  });
  assert.match(videoVoice, /语音凭证/);
  assert.match(videoVoice, /followup-voucher-voice/);
  assert.doesNotMatch(videoVoice, /图片凭证/);

  const textMixed = renderFollowUpVoucherCard({
    id: "text_mixed",
    type: "text",
    followUpVoucher: { type: "mixed" }
  });
  assert.match(textMixed, /语音凭证/);
  assert.match(textMixed, /图片凭证/);
  assert.match(textMixed, /followup-voucher-divider/);

  assert.equal(renderFollowUpVoucherCard({ id: "consult_1", type: "consult" }), "");
  assert.equal(getFollowUpVoucher({ id: "video_1", type: "video" })?.images.length >= 0, true);
  assert.match(renderFollowUpVoiceDialog(), /followup-voice-overlay/);
});

test("room main keeps empty state without queue and shows pending workspace with queue", async () => {
  setupBrowserGlobals("/room/");
  const { setWaitingQueue } = await import("../src/application/state/runtimeState.js?v=20260528-06");
  const { renderRoomMain } = await import("../src/presentation/views/roomShellView.js?room-pending-main");

  setWaitingQueue({ total: 0, byType: { text: 0, video: 0, consult: 0 } }, { silent: true, force: true });
  const emptyMarkup = renderRoomMain();
  assert.match(emptyMarkup, /aria-label="候诊室"/);
  assert.match(emptyMarkup, /暂无待接诊订单/);
  assert.doesNotMatch(emptyMarkup, /room-card--pending-consult/);

  setWaitingQueue({ total: 2, byType: { text: 1, video: 1, consult: 0 } }, { silent: true, force: true });
  const pendingMarkup = renderRoomMain();
  assert.match(pendingMarkup, /room-card--pending-consult/);
  assert.match(pendingMarkup, /room-pending-chat-panel/);
  assert.doesNotMatch(pendingMarkup, /暂无待接诊订单/);
  assert.match(pendingMarkup, /诊断意见/);
  assert.match(pendingMarkup, /处方备注/);
});

test("room sidebar does not preselect an ongoing consultation before opening one", async () => {
  setupBrowserGlobals("/room/");
  const { hydrateAppData } = await import("../src/application/state/dataStore.js");
  hydrateAppData({
    schemaVersion: 1,
    consultations: {
      records: [
        {
          id: "text_waiting",
          type: "text",
          state: "ongoing",
          title: "待接诊药房",
          preview: "待打开会话",
          unreadCount: 0,
          targetView: "text",
          time: "10:03"
        }
      ],
      ongoingChats: {}
    },
    navigation: { menuGroups: [] },
    home: { quickActions: [], quickEntryOptions: [], announcements: [] },
    services: [],
    quickReplies: { categories: [], messages: [] }
  });

  const { setWaitingQueue } = await import("../src/application/state/runtimeState.js?v=20260528-06");
  setWaitingQueue({ total: 1, byType: { text: 1, video: 0, consult: 0 } }, { silent: true, force: true });

  const { renderRoomSidebar } = await import("../src/presentation/views/roomMessageListView.js?room-sidebar-no-preselect");
  const markup = renderRoomSidebar();
  assert.match(markup, /待接诊药房/);
  assert.doesNotMatch(markup, /message-item--text is-active/);
});

test("medicine table renders empty, editable, readonly, escaped, and warning states", async () => {
  setupBrowserGlobals("/");
  const { renderMedicineTable, renderMedicineTableRow } = await import("../src/presentation/components/medicineTable.js");
  const row = {
    index: 1,
    name: `阿莫西林<胶囊>`,
    type: "处方药",
    spec: `0.25g*"24粒"`,
    usage: "口服",
    frequency: "3次/日",
    dose: "",
    quantity: "1",
    unit: "盒",
    risk: "中",
    warningFields: ["dose", "unit"]
  };

  assert.match(renderMedicineTable(), /暂无药品信息/);

  const editable = renderMedicineTableRow(row);
  assert.match(editable, /medicine-table__row--warning-linked/);
  assert.match(editable, /阿莫西林&lt;胶囊&gt;/);
  assert.match(editable, /0.25g\*&quot;24粒&quot;/);
  assert.match(editable, /data-medicine-field="dose"/);
  assert.match(editable, /medicine-delete-btn/);
  assert.match(editable, /jh-risk-tag--medium/);

  const readonly = renderMedicineTable([row], true);
  assert.match(readonly, /medicine-table--single/);
  assert.doesNotMatch(readonly, /medicine-delete-btn/);
  assert.doesNotMatch(readonly, /<input class="table-input medicine-edit-field/);
});

test("prescription actions choose readonly, consultation, locked, and submitted controls", async () => {
  setupBrowserGlobals("/");
  const { renderPrescriptionActions } = await import("../src/presentation/components/prescriptionActions.js");

  assert.match(renderPrescriptionActions({ readonly: true }), /已封存，仅支持查看/);
  assert.match(renderPrescriptionActions({ readonly: true }), /查看开方历史/);
  assert.match(renderPrescriptionActions({ consultation: true }), /完成问诊/);

  const locked = renderPrescriptionActions({ videoSubmitLock: true, prescriptionSubmitted: false });
  assert.match(locked, /video-submit-countdown/);
  assert.match(locked, /data-remaining="10"/);
  assert.match(locked, /jh-prescription-submit" type="button" disabled/);

  const submitted = renderPrescriptionActions({ prescriptionSubmitted: true });
  assert.match(submitted, /结束问诊/);
  assert.match(submitted, /jh-prescription-submit" type="button" disabled/);
});

test("render record selectors resolve active records, chat keys, ended records, and active video ids", async () => {
  setupBrowserGlobals("/video/", "?sessionId=text_1");
  const { hydrateAppData } = await import("../src/application/state/dataStore.js");
  const {
    activeVideoConsultationState,
    initRuntimeState
  } = await import("../src/application/state/runtimeState.js?v=20260528-06");

  hydrateAppData({
    schemaVersion: 1,
    consultations: {
      records: [
        { id: "video_1", type: "video", targetView: "video", state: "ongoing", time: "09:00" },
        { id: "text_1", type: "text", targetView: "text", state: "ongoing", time: "10:00" },
        { id: "ended_1", type: "text", targetView: "text", state: "ended", time: "11:00" }
      ],
      ongoingChats: {
        text_1: { messages: [] }
      }
    },
    navigation: { menuGroups: [] },
    home: { quickActions: [], quickEntryOptions: [], announcements: [] },
    services: [],
    quickReplies: { categories: [], messages: [] }
  });
  initRuntimeState({
    consultationRecords: [
      { id: "video_1", type: "video", targetView: "video", state: "ongoing", time: "09:00" },
      { id: "text_1", type: "text", targetView: "text", state: "ongoing", time: "10:00" }
    ]
  });
  activeVideoConsultationState.recordId = "video_1";

  const selectors = await import("../src/presentation/views/renderRecordSelectors.js?presentation-selectors");

  assert.equal(selectors.getDefaultOngoingRenderRecord("room").id, "video_1");
  assert.equal(selectors.getDefaultOngoingRenderRecord("text").id, "text_1");
  assert.equal(selectors.getDefaultEndedRenderRecord().id, "ended_1");
  assert.equal(selectors.getActiveConsultationRecord("video").id, "text_1");
  assert.equal(selectors.getActiveChatKey(), "text_1");
  assert.equal(selectors.getActiveVideoConsultationRecordId("text_1"), "video_1");
});
