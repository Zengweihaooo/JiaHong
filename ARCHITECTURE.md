# 嘉虹医生端前端架构

## 目标

当前项目保持原生 HTML/CSS/JavaScript，不引入框架；架构上按生产前端的边界拆分，所有页面由 Mock API 数据驱动，避免业务数据散落在渲染代码里。

## 模块分层

- `script.js`：应用启动入口，负责初始化数据、渲染页面、绑定交互。
- `src/core.js`：路由识别、页面跳转 URL、静态资源 URL。
- `src/api/httpClient.js`：统一 JSON 请求封装，未来替换真实接口时优先改这里。
- `src/api/mockApi.js`：Mock API 门面，模拟真实接口延迟和返回结构。
- `src/mocks/app-bootstrap.json`：页面启动所需 Mock 数据源。
- `src/data.js`：内存数据仓库，只保存 API hydrate 后的数据，不写业务样例。
- `src/state.js`：运行态状态，例如服务开关、消息徽标、问诊状态机实例。
- `src/domain/consultationStateMachine.js`：问诊领域状态机，集中约束流程流转。
- `src/render.js`：纯渲染函数，输入来自数据仓库和状态，不直接发请求。
- `src/interactions.js`：事件绑定和用户动作处理，通过 API/状态机更新运行态。

## 实时 Mock 状态

候诊人数和接诊状态不允许在页面里写死。当前通过 `mockApi.js` 模拟后端运行态：

- `getRealtimeSnapshot()` 每 3 秒生成新的候诊队列数据。
- 进行中问诊启动时预置 2 条，实时 Mock 池继续随机补充到 6 条上限；最终保持图文 3 条、视频 3 条。
- 每条 Mock 会话包含独立患者资料、完整手机号和身份证号、匹配症状的聊天回复、诊断标签和处方用药，避免页面出现重复病人。
- `getRealtimeSnapshot()` 从 `realtimePool` 随机抽取未出现的病例，并把候诊人数从 2 逐步同步到 6。
- `waitingQueue` 写入 Mock 运行态存储，页面跳转后继续保持同一份候诊数字。
- `updateDoctorStatus(status)` 写入 Mock 运行态存储，首页和问诊页读取同一个接诊状态。
- `updateServiceAvailability(serviceKey, enabled)` 写入 Mock 运行态存储，首页服务开关和问诊页顶部服务开关保持一致。

页面只通过 `state.js` 的 `doctorStatusState`、`waitingQueueState`、`serviceState` 读取运行态，不直接读取或修改 DOM 中的数字作为业务状态。

消息列表和问诊详情同样由 Mock API 驱动：

- 新增会话通过 `newConsultation.record` 进入 `data.js` 的 `consultationRecords`。
- 新增聊天通过 `newConsultation.chat` 进入 `ongoingChatState`。
- 点击会话时路由携带 `record` 参数，图文/视频页按同一个 `recordId` 渲染药店、患者、聊天、诊断和用药信息。
- 进行中的消息列表最多展示 6 条，Mock 运行态新增会话会随机插入列表位置并做数量裁剪，避免列表无限增长或类型固定分组。
- 未读状态按 `record.id` 持久化，不再按列表位置计算，新增会话插入后不会导致徽标错位。

## 数据结构

`src/mocks/app-bootstrap.json` 是启动聚合数据：

```json
{
  "schemaVersion": 1,
  "navigation": { "menuGroups": [] },
  "home": {
    "quickActions": [],
    "quickEntryOptions": [],
    "announcements": []
  },
  "services": [],
  "consultations": {
    "records": [],
    "ongoingChats": {}
  },
  "quickReplies": {
    "categories": [],
    "messages": []
  }
}
```

未来接真实后端时，可以把这个聚合接口拆成多个接口：

- `GET /api/navigation`
- `GET /api/home`
- `GET /api/services`
- `GET /api/consultations`
- `GET /api/quick-replies`

页面代码不应直接关心接口数量，只通过 `mockApi.js` 或未来的 `api/*.js` 调用。

## API 通信层

当前所有请求从 `mockApi.js` 进入：

- `getAppBootstrap()`：加载启动 Mock 数据。
- `updateServiceAvailability(serviceKey, enabled)`：模拟服务开关保存。
- `updateConsultationStatus(recordId, event)`：模拟问诊流程状态同步。

真实接口上线时，保留函数签名，替换内部 URL 和返回适配即可。

## 问诊状态机

问诊状态集中定义在 `consultationStateMachine.js`：

```text
waiting -> ongoing -> risk_review -> prescription_submitted -> ended -> archived
          |           |
          |           -> cancelled
          -> cancelled
```

事件：

- `ACCEPT`：接诊。
- `OPEN_RISK_REVIEW`：提交处方前进入风险检测。
- `SUBMIT_PRESCRIPTION`：风险确认后提交处方。
- `END`：结束问诊。
- `CANCEL`：取消问诊。
- `ARCHIVE`：归档封存。

交互层只能发送事件，不应在页面里手写随意状态变更。

## 开发约束

- 新增页面数据先加到 Mock JSON，再通过 API/仓库进入页面。
- 渲染函数不发请求，不直接改 Mock 数据。
- 交互函数不拼业务数据结构，只调用 API 和状态机。
- 后续接真实后端时，优先新增或替换 `src/api/*`，尽量不动 `render.js`。
